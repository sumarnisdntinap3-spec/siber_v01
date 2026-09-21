import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/data/store.js';
import { User } from './src/types/index.js';
import * as XLSX from 'xlsx';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // ==========================================
  // 0. HEALTH CHECK (CLOUD RUN / INGRESS)
  // ==========================================
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'si-supervisi-pm', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // 1. AUTHENTICATION & USERS
  // ==========================================
  app.get('/api/auth/demo-users', (req: Request, res: Response) => {
    res.json(db.users);
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password, role, userId } = req.body;
    const cleanId = typeof identifier === 'string' ? identifier.trim() : '';
    const cleanPwd = typeof password === 'string' ? password.trim() : '';
    const stripNip = (str: string) => str.replace(/[\s.-]/g, '');

    let user: User | undefined;

    // 0. Direct userId lookup (from 1-click login or role switcher)
    if (userId) {
      user = db.users.find((u) => u.id === userId);
    }

    // 1. Admin Dinas shortcut: user="admin" or "admin_dinas"
    if (!user && (cleanId.toLowerCase() === 'admin' || cleanId.toLowerCase() === 'admin_dinas')) {
      user = db.users.find((u) => u.role === 'ADMIN_DINAS') || db.users[0];
      if (cleanPwd && cleanPwd !== 'admin' && cleanPwd !== 'admin123' && cleanPwd !== '123456' && (user.password && cleanPwd !== user.password)) {
        return res.status(401).json({ error: 'Password Admin salah. Gunakan password: admin atau 123456' });
      }
    } else if (!user && cleanId) {
      const cleanIdLower = cleanId.toLowerCase();
      const strippedCleanId = stripNip(cleanId);

      // 2. Lookup user by NIP, username, email, email prefix, or full name
      user = db.users.find((u) => {
        const matchNip = u.nip === cleanId || (u.nip && stripNip(u.nip) === strippedCleanId);
        const matchUsername = u.username?.toLowerCase() === cleanIdLower;
        const matchEmail = u.email?.toLowerCase() === cleanIdLower;
        const matchEmailPrefix = u.email?.toLowerCase().split('@')[0] === cleanIdLower;
        const matchNameExact = u.name?.toLowerCase() === cleanIdLower;
        const matchNameContains = u.name?.toLowerCase().includes(cleanIdLower);
        return matchNip || matchUsername || matchEmail || matchEmailPrefix || matchNameExact || matchNameContains;
      });

      // 3. Fallback shortcut keywords
      if (!user) {
        if (cleanIdLower.includes('dinas') || cleanIdLower === 'admin' || cleanIdLower.includes('didik')) {
          user = db.users.find((u) => u.role === 'ADMIN_DINAS');
        } else if (cleanIdLower.includes('pengawas') || cleanIdLower.includes('bambang') || cleanIdLower.includes('siti') || cleanIdLower.includes('endang')) {
          user = db.users.find((u) => u.role === 'PENGAWAS');
        } else if (cleanIdLower.includes('kepala') || cleanIdLower.includes('ks') || cleanIdLower.includes('kepsek') || cleanIdLower.includes('wahyuni') || cleanIdLower.includes('agus')) {
          user = db.users.find((u) => u.role === 'KEPALA_SEKOLAH');
        } else if (cleanIdLower.includes('guru') || cleanIdLower.includes('sumarni') || cleanIdLower.includes('anwar') || cleanIdLower.includes('dewi') || cleanIdLower.includes('eko')) {
          user = db.users.find((u) => u.role === 'GURU');
        }
      }

      // 4. Password validation (flexible and user-friendly)
      if (user && cleanPwd) {
        const userFirstName = user.name.toLowerCase().split(/[\s,.]+/)[0] || '';
        const userNipStripped = stripNip(user.nip || '');
        const isPasswordValid =
          cleanPwd === user.nip ||
          stripNip(cleanPwd) === userNipStripped ||
          cleanPwd === '123456' ||
          cleanPwd === '12345678' ||
          cleanPwd === '123' ||
          cleanPwd === 'password' ||
          cleanPwd.toLowerCase() === 'admin' ||
          cleanPwd.toLowerCase() === 'admin123' ||
          cleanPwd.toLowerCase() === user.username?.toLowerCase() ||
          (user.password && cleanPwd === user.password) ||
          cleanPwd.toLowerCase() === 'pengawas' ||
          cleanPwd.toLowerCase() === 'pengawas123' ||
          cleanPwd.toLowerCase() === 'kepala' ||
          cleanPwd.toLowerCase() === 'kepala123' ||
          cleanPwd.toLowerCase() === 'guru' ||
          cleanPwd.toLowerCase() === 'guru123' ||
          (userFirstName.length >= 3 && cleanPwd.toLowerCase() === userFirstName);

        if (!isPasswordValid) {
          return res.status(401).json({
            error: `Password salah. Untuk akun ${user.role} (${user.name}), silakan gunakan Password = NIP (${user.nip || 'NIP Anda'}) atau '123456'`
          });
        }
      }
    }

    if (!user && role) {
      user = db.users.find((u) => u.role === role);
    }

    if (!user) {
      return res.status(404).json({
        error: 'Akun tidak ditemukan. Masukkan NIP, Email (contoh: sumarni.sdntinap3@gmail.com), atau pilih akun cepat di bawah.'
      });
    }

    db.addAuditLog(
      user.id,
      user.name,
      user.role,
      'User Login',
      `Pengguna masuk ke sistem sebagai ${user.role} (${user.name}) [User: ${cleanId || user.nip || user.username}]`,
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      token: `token-${user.id}-${Date.now()}`,
      user
    });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { userId, newPassword, adminName, adminId } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    db.addAuditLog(
      adminId || 'u-dinas',
      adminName || 'Admin Dinas',
      'ADMIN_DINAS',
      'Reset Password Pengguna',
      `Reset kata sandi untuk akun ${user.name} (${user.username})`,
      req.ip || '127.0.0.1'
    );

    db.addNotification(
      user.id,
      'Kata Sandi Direset',
      'Kata sandi akun Anda telah diperbarui oleh Admin Dinas.',
      'info'
    );

    res.json({ success: true, message: 'Password berhasil direset' });
  });

  // ==========================================
  // 2. MASTER DATA: TAHUN PELAKSANAAN
  // ==========================================
  app.get('/api/education-years', (req: Request, res: Response) => {
    res.json(db.educationYears);
  });

  app.post('/api/education-years', (req: Request, res: Response) => {
    const { name, semester, startDate, endDate, isActive, notes } = req.body;
    if (isActive) {
      db.educationYears.forEach((y) => (y.isActive = false));
    }
    const newYear = {
      id: `ey-${Date.now()}`,
      name,
      semester: semester || 'Ganjil',
      startDate,
      endDate,
      isActive: !!isActive,
      notes
    };
    db.educationYears.unshift(newYear);

    db.addAuditLog(
      'u-dinas',
      'Admin Dinas',
      'ADMIN_DINAS',
      'Tambah Tahun Pelaksanaan',
      `Menambahkan tahun pelaksanaan baru: ${name} (${semester})`,
      req.ip || '127.0.0.1'
    );

    res.status(201).json(newYear);
  });

  const activateEducationYearHandler = (req: Request, res: Response) => {
    const { id } = req.params;
    const year = db.educationYears.find((y) => y.id === id);
    if (!year) return res.status(404).json({ error: 'Tahun tidak ditemukan' });

    db.educationYears.forEach((y) => (y.isActive = y.id === id));

    db.addAuditLog(
      'u-dinas',
      'Admin Dinas',
      'ADMIN_DINAS',
      'Aktivasi Tahun Pelaksanaan',
      `Menetapkan tahun ${year.name} (${year.semester}) sebagai tahun pelaksanaan aktif`,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, activeYear: year });
  };

  app.post('/api/education-years/:id/activate', activateEducationYearHandler);
  app.put('/api/education-years/:id/activate', activateEducationYearHandler);

  // ==========================================
  // 3. MASTER DATA: SEKOLAH
  // ==========================================
  app.get('/api/schools', (req: Request, res: Response) => {
    // calculate teacher counts
    const schoolsWithCounts = db.schools.map((s) => ({
      ...s,
      teacherCount: db.teachers.filter((t) => t.schoolId === s.id && t.status === 'active').length
    }));
    res.json(schoolsWithCounts);
  });

  app.get('/api/schools/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const school = db.schools.find((s) => s.id === id);
    if (!school) return res.status(404).json({ error: 'Sekolah tidak ditemukan' });
    const teacherCount = db.teachers.filter((t) => t.schoolId === school.id && t.status === 'active').length;
    res.json({ ...school, teacherCount });
  });

  app.post('/api/schools', (req: Request, res: Response) => {
    const { npsn, name, level, address, subDistrict, city, principalName, supervisorId, phone } = req.body;
    const supervisor = db.supervisors.find((sp) => sp.id === supervisorId);

    const newSchool = {
      id: `sch-${Date.now()}`,
      npsn,
      name,
      level: level || 'SD',
      address,
      subDistrict,
      city: city || 'Kabupaten Magetan',
      principalName: principalName || '-',
      supervisorId,
      supervisorName: supervisor?.name || '-',
      status: 'active' as const,
      teacherCount: 0,
      phone
    };
    db.schools.push(newSchool);

    if (supervisor && !supervisor.assignedSchoolIds.includes(newSchool.id)) {
      supervisor.assignedSchoolIds.push(newSchool.id);
      supervisor.assignedSchoolNames?.push(newSchool.name);
    }

    db.addAuditLog(
      'u-dinas',
      'Admin Dinas',
      'ADMIN_DINAS',
      'Tambah Sekolah Baru',
      `Menambahkan data sekolah ${name} (NPSN: ${npsn})`,
      req.ip || '127.0.0.1'
    );

    res.status(201).json(newSchool);
  });

  app.put('/api/schools/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.schools.findIndex((s) => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Sekolah tidak ditemukan' });

    const supervisor = req.body.supervisorId ? db.supervisors.find((sp) => sp.id === req.body.supervisorId) : null;
    db.schools[index] = {
      ...db.schools[index],
      ...req.body,
      supervisorName: supervisor ? supervisor.name : db.schools[index].supervisorName
    };

    db.addAuditLog(
      'u-dinas',
      'Didik Setiawan, S.E',
      'ADMIN_DINAS',
      'Update Data Sekolah',
      `Memperbarui data sekolah ${db.schools[index].name}`,
      req.ip || '127.0.0.1'
    );

    res.json(db.schools[index]);
  });

  app.delete('/api/schools/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.schools.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Satuan pendidikan tidak ditemukan' });
    }

    const removedSchool = db.schools[index];

    // Clean up references in supervisors
    db.supervisors.forEach((sup) => {
      if (sup.assignedSchoolIds && sup.assignedSchoolIds.includes(id)) {
        sup.assignedSchoolIds = sup.assignedSchoolIds.filter((sid) => sid !== id);
      }
      if (sup.assignedSchoolNames && sup.assignedSchoolNames.includes(removedSchool.name)) {
        sup.assignedSchoolNames = sup.assignedSchoolNames.filter((sname) => sname !== removedSchool.name);
      }
    });

    // Remove from schools list
    db.schools.splice(index, 1);

    db.addAuditLog(
      'u-dinas',
      'Didik Setiawan, S.E',
      'ADMIN_DINAS',
      'Hapus Satuan Pendidikan',
      `Menghapus data satuan pendidikan ${removedSchool.name} (NPSN: ${removedSchool.npsn})`,
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: `Satuan pendidikan ${removedSchool.name} berhasil dihapus.`,
      id
    });
  });

  // Batch import schools from Excel/CSV
  app.post('/api/schools/batch', (req: Request, res: Response) => {
    const { items, updateExisting = true } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data satuan pendidikan tidak valid atau kosong' });
    }

    let addedCount = 0;
    let updatedCount = 0;
    const processed: any[] = [];

    for (const item of items) {
      if (!item.name || !item.npsn) continue;
      const cleanNpsn = String(item.npsn).trim();
      const cleanName = String(item.name).trim();

      const existingIndex = db.schools.findIndex(
        (s) => s.npsn === cleanNpsn || (item.id && s.id === item.id)
      );

      // Find supervisor
      let supervisor = item.supervisorId ? db.supervisors.find((sp) => sp.id === item.supervisorId) : null;
      if (!supervisor && item.supervisorName) {
        supervisor = db.supervisors.find((sp) =>
          sp.name.toLowerCase().includes(String(item.supervisorName).toLowerCase())
        ) || null;
      }

      if (existingIndex >= 0) {
        if (updateExisting) {
          db.schools[existingIndex] = {
            ...db.schools[existingIndex],
            ...item,
            npsn: cleanNpsn,
            name: cleanName,
            level: item.level || db.schools[existingIndex].level || 'SD',
            address: item.address || db.schools[existingIndex].address,
            subDistrict: item.subDistrict || item.subdistrict || db.schools[existingIndex].subDistrict || 'Sukomoro',
            city: item.city || db.schools[existingIndex].city || 'Kabupaten Magetan',
            principalName: item.principalName || db.schools[existingIndex].principalName || '-',
            supervisorId: supervisor ? supervisor.id : (item.supervisorId || db.schools[existingIndex].supervisorId),
            supervisorName: supervisor ? supervisor.name : (item.supervisorName || db.schools[existingIndex].supervisorName || '-'),
            phone: item.phone || db.schools[existingIndex].phone || '-',
            accreditation: item.accreditation || db.schools[existingIndex].accreditation || 'B',
            status: 'active'
          };
          processed.push(db.schools[existingIndex]);
          updatedCount++;
        }
      } else {
        const newSchool = {
          id: item.id || `sch-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          npsn: cleanNpsn,
          name: cleanName,
          level: item.level || 'SD',
          address: item.address || 'Magetan',
          subDistrict: item.subDistrict || item.subdistrict || 'Sukomoro',
          city: item.city || 'Kabupaten Magetan',
          principalName: item.principalName || '-',
          supervisorId: supervisor ? supervisor.id : item.supervisorId,
          supervisorName: supervisor ? supervisor.name : (item.supervisorName || '-'),
          phone: item.phone || '-',
          accreditation: item.accreditation || 'B',
          teacherCount: 0,
          status: 'active' as const
        };
        db.schools.push(newSchool);

        if (supervisor && !supervisor.assignedSchoolIds.includes(newSchool.id)) {
          supervisor.assignedSchoolIds.push(newSchool.id);
          supervisor.assignedSchoolNames?.push(newSchool.name);
        }

        processed.push(newSchool);
        addedCount++;
      }
    }

    db.addAuditLog(
      'u-dinas',
      'Didik Setiawan, S.E',
      'ADMIN_DINAS',
      'Unggah Serentak Satuan Pendidikan',
      `Import ${processed.length} satuan pendidikan (${addedCount} baru, ${updatedCount} diperbarui) via file Excel`,
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      total: processed.length,
      added: addedCount,
      updated: updatedCount,
      schools: processed
    });
  });

  // Template Excel Download endpoint
  app.get('/api/schools/template', (req: Request, res: Response) => {
    try {
      const headers = [
        'NPSN *',
        'Nama Satuan Pendidikan *',
        'Jenjang *',
        'Status Sekolah',
        'Alamat Sekolah *',
        'Kecamatan *',
        'Kabupaten / Kota *',
        'Nama Kepala Sekolah',
        'Nomor Telepon',
        'Email Sekolah',
        'Akreditasi',
        'Nama Pengawas Bina'
      ];

      const sampleRows = [
        {
          'NPSN *': '20501234',
          'Nama Satuan Pendidikan *': 'SD Negeri Tinap 3',
          'Jenjang *': 'SD',
          'Status Sekolah': 'Negeri',
          'Alamat Sekolah *': 'Jl. Raya Pendidikan No. 45, Desa Tinap',
          'Kecamatan *': 'Sukomoro',
          'Kabupaten / Kota *': 'Kabupaten Magetan',
          'Nama Kepala Sekolah': 'Hj. Sri Wahyuni, M.Pd.',
          'Nomor Telepon': '0351-891001',
          'Email Sekolah': 'sdntinap3@magetan.sch.id',
          'Akreditasi': 'A',
          'Nama Pengawas Bina': 'Drs. H. Bambang Sutrisno, M.Pd.'
        },
        {
          'NPSN *': '20501235',
          'Nama Satuan Pendidikan *': 'SD Negeri Tinap 1',
          'Jenjang *': 'SD',
          'Status Sekolah': 'Negeri',
          'Alamat Sekolah *': 'Jl. Pahlawan No. 12, Desa Tinap',
          'Kecamatan *': 'Sukomoro',
          'Kabupaten / Kota *': 'Kabupaten Magetan',
          'Nama Kepala Sekolah': 'Drs. Agus Priyanto, M.Pd.',
          'Nomor Telepon': '0351-891002',
          'Email Sekolah': 'sdntinap1@magetan.sch.id',
          'Akreditasi': 'A',
          'Nama Pengawas Bina': 'Drs. H. Bambang Sutrisno, M.Pd.'
        },
        {
          'NPSN *': '20509876',
          'Nama Satuan Pendidikan *': 'SMP Negeri 1 Sukamaju',
          'Jenjang *': 'SMP',
          'Status Sekolah': 'Negeri',
          'Alamat Sekolah *': 'Jl. Pemuda Bangsa No. 88',
          'Kecamatan *': 'Sukamaju',
          'Kabupaten / Kota *': 'Kabupaten Magetan',
          'Nama Kepala Sekolah': 'Budi Santoso, S.Pd., M.M.',
          'Nomor Telepon': '0351-892345',
          'Email Sekolah': 'smpn1sukamaju@magetan.sch.id',
          'Akreditasi': 'A',
          'Nama Pengawas Bina': 'Dr. Hj. Siti Rohmah, M.Pd.'
        },
        {
          'NPSN *': '20504421',
          'Nama Satuan Pendidikan *': 'TK Pembina Negeri Magetan',
          'Jenjang *': 'TK',
          'Status Sekolah': 'Negeri',
          'Alamat Sekolah *': 'Jl. Basuki Rahmat No. 10',
          'Kecamatan *': 'Magetan',
          'Kabupaten / Kota *': 'Kabupaten Magetan',
          'Nama Kepala Sekolah': 'Siti Maryam, S.Pd.AUD.',
          'Nomor Telepon': '0351-893321',
          'Email Sekolah': 'tkpembina@magetan.sch.id',
          'Akreditasi': 'A',
          'Nama Pengawas Bina': 'Dra. Endang Sulistyowati, M.Pd.'
        }
      ];

      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
      wsData['!cols'] = [
        { wch: 14 },
        { wch: 32 },
        { wch: 12 },
        { wch: 15 },
        { wch: 42 },
        { wch: 18 },
        { wch: 22 },
        { wch: 28 },
        { wch: 16 },
        { wch: 28 },
        { wch: 12 },
        { wch: 32 }
      ];
      XLSX.utils.book_append_sheet(wb, wsData, 'Data_Satuan_Pendidikan');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename="Template_Unggah_Satuan_Pendidikan.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal membuat file template Excel' });
    }
  });

  // ==========================================
  // 4. MASTER DATA: GURU, KEPALA SEKOLAH, PENGAWAS
  // ==========================================
  app.get('/api/teachers', (req: Request, res: Response) => {
    const { schoolId } = req.query;
    let list = db.teachers;
    if (schoolId) {
      list = list.filter((t) => t.schoolId === schoolId);
    }

    // Refresh dynamic summary flags
    const enriched = list.map((t) => {
      const teacherModules = db.modules.filter((m) => m.teacherId === t.id);
      const latestModule = teacherModules[0];
      const adminRecords = db.teacherAdminRecords.filter((r) => r.teacherId === t.id);
      const completedCount = adminRecords.filter((r) => r.isAvailable).length;
      const totalItems = db.adminItems.length || 1;
      const selfAdminPercentage = Math.round((completedCount / totalItems) * 100);
      
      // Nilai akhir administrasi guru yang digunakan adalah dari penilaian pengawas sekolah
      const isSupervisorEvaluated = !!t.adminVerifiedBySupervisor || adminRecords.some((r) => r.supervisorConfirmed !== undefined && r.supervisorScore !== undefined);
      const officialAdminScore = t.adminSupervisorScore ?? t.adminScore ?? (isSupervisorEvaluated ? (t.adminCompletion || selfAdminPercentage) : selfAdminPercentage);

      const mindset = db.mindsetAssessments.find((m) => m.teacherId === t.id);
      const supervision = db.supervisionRequests.find((s) => s.teacherId === t.id);

      return {
        ...t,
        moduleStatus: latestModule ? latestModule.status : ('BELUM_UPLOAD' as const),
        adminSelfCompletion: selfAdminPercentage,
        adminSupervisorScore: t.adminSupervisorScore,
        adminScore: officialAdminScore, // Nilai akhir resmi
        adminCompletion: officialAdminScore, // Kompatibilitas: nilai akhir yang digunakan adalah dari pengawas
        adminVerifiedBySupervisor: isSupervisorEvaluated,
        adminSupervisorStatus: t.adminSupervisorStatus || (isSupervisorEvaluated ? 'DISETUJUI' : 'BELUM_DINILAI'),
        mindsetCategory: mindset ? mindset.category : (t.mindsetCategory || 'Belum Dipetakan'),
        supervisionStatus: supervision
          ? (supervision.isCompleted ? 'SELESAI' : supervision.status)
          : (t.supervisionStatus || 'BELUM_TERJADWAL')
      };
    });

    res.json(enriched);
  });

  app.post('/api/teachers', (req: Request, res: Response) => {
    const { nip, nik, name, gender, subject, rankGrade, position, employmentStatus, email, phone, schoolId, joinYear } = req.body;
    const school = db.schools.find((s) => s.id === schoolId);

    const newUserId = `u-guru-${Date.now()}`;
    const newTeacherId = `t-${Date.now()}`;

    // Create user account
    const newUser = {
      id: newUserId,
      username: nip || `guru_${Date.now()}`,
      name,
      email,
      role: 'GURU' as const,
      nip,
      schoolId,
      phone,
      status: 'active' as const,
      createdAt: new Date().toISOString().split('T')[0]
    };
    db.users.push(newUser);

    const newTeacher = {
      id: newTeacherId,
      userId: newUserId,
      nip,
      nik: nik || '3520000000000000',
      name,
      gender: gender || 'L',
      subject: subject || 'Guru Kelas',
      rankGrade: rankGrade || 'Penata Muda / III/a',
      position: position || 'Guru Ahli Pertama',
      employmentStatus: employmentStatus || 'PNS',
      email,
      phone,
      schoolId,
      schoolName: school?.name || '-',
      joinYear: Number(joinYear) || new Date().getFullYear(),
      status: 'active' as const,
      moduleStatus: 'BELUM_UPLOAD' as const,
      adminCompletion: 0,
      mindsetCategory: 'Belum Dipetakan',
      supervisionStatus: 'BELUM_TERJADWAL' as const
    };
    db.teachers.push(newTeacher);

    db.addAuditLog(
      'u-dinas',
      'Admin Dinas',
      'ADMIN_DINAS',
      'Tambah Guru Baru',
      `Mendaftarkan guru baru: ${name} (NIP: ${nip}) di ${newTeacher.schoolName}`,
      req.ip || '127.0.0.1'
    );

    res.status(201).json(newTeacher);
  });

  app.put('/api/teachers/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.teachers.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    db.teachers[index] = { ...db.teachers[index], ...req.body };
    const userIndex = db.users.findIndex((u) => u.id === db.teachers[index].userId);
    if (userIndex !== -1) {
      db.users[userIndex].name = db.teachers[index].name;
      db.users[userIndex].email = db.teachers[index].email;
      db.users[userIndex].nip = db.teachers[index].nip;
    }

    db.addAuditLog(
      'u-dinas',
      'Admin Dinas',
      'ADMIN_DINAS',
      'Update Data Guru',
      `Memperbarui profil guru ${db.teachers[index].name}`,
      req.ip || '127.0.0.1'
    );

    res.json(db.teachers[index]);
  });

  app.delete('/api/teachers/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.teachers.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    const deleted = db.teachers[index];

    // Remove associated user account if present
    if (deleted.userId) {
      const uIndex = db.users.findIndex((u) => u.id === deleted.userId);
      if (uIndex !== -1) {
        db.users.splice(uIndex, 1);
      }
    }

    db.teachers.splice(index, 1);

    // Update school teacher count
    if (deleted.schoolId) {
      const sch = db.schools.find((s) => s.id === deleted.schoolId);
      if (sch && typeof sch.totalTeachers === 'number') {
        sch.totalTeachers = Math.max(0, sch.totalTeachers - 1);
      }
    }

    db.addAuditLog(
      'u-dinas',
      'Didik Setiawan, S.E',
      'ADMIN_DINAS',
      'Hapus Data Guru',
      `Menghapus data Guru: ${deleted.name} (NIP: ${deleted.nip}) dari ${deleted.schoolName}`,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, message: `Data guru ${deleted.name} berhasil dihapus` });
  });

  // Batch import teachers from Excel
  app.post('/api/teachers/batch', (req: Request, res: Response) => {
    const { items, updateExisting = true } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data guru tidak valid atau kosong' });
    }

    let addedCount = 0;
    let updatedCount = 0;
    const processed: any[] = [];

    for (const item of items) {
      const nip = item.nip ? String(item.nip).trim() : '-';
      const name = item.name ? String(item.name).trim() : '';
      if (!name) continue;

      let matchedIndex = -1;
      if (nip && nip !== '-' && nip.length > 4) {
        matchedIndex = db.teachers.findIndex((t) => t.nip === nip);
      }
      if (matchedIndex === -1 && item.schoolId) {
        matchedIndex = db.teachers.findIndex(
          (t) => t.schoolId === item.schoolId && t.name.toLowerCase().trim() === name.toLowerCase().trim()
        );
      }

      const school = db.schools.find((s) => s.id === item.schoolId);

      if (matchedIndex !== -1 && updateExisting) {
        // Update existing teacher
        db.teachers[matchedIndex] = {
          ...db.teachers[matchedIndex],
          ...item,
          schoolName: school ? school.name : db.teachers[matchedIndex].schoolName
        };

        // Sync associated user account
        if (db.teachers[matchedIndex].userId) {
          const uIndex = db.users.findIndex((u) => u.id === db.teachers[matchedIndex].userId);
          if (uIndex !== -1) {
            db.users[uIndex].name = db.teachers[matchedIndex].name;
            if (item.email) db.users[uIndex].email = item.email;
            if (nip !== '-') db.users[uIndex].nip = nip;
          }
        }

        processed.push(db.teachers[matchedIndex]);
        updatedCount++;
      } else if (matchedIndex === -1) {
        // Add new teacher
        const newTeacherId = `t-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const newUserId = `u-guru-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        const newUser = {
          id: newUserId,
          username: nip && nip !== '-' ? nip : `guru_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name,
          email: item.email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sekolah.belajar.id`,
          role: 'GURU' as const,
          nip: nip !== '-' ? nip : undefined,
          schoolId: item.schoolId,
          phone: item.phone || '',
          status: 'active' as const,
          createdAt: new Date().toISOString().split('T')[0]
        };
        db.users.push(newUser);

        const newTeacher = {
          id: newTeacherId,
          userId: newUserId,
          nip,
          nik: item.nik || '3520000000000000',
          nuptk: item.nuptk || '',
          name,
          gender: item.gender || 'L',
          teacherType: item.teacherType || 'Guru Kelas',
          subject: item.subject || 'Guru Kelas',
          classGrade: item.classGrade,
          rankGrade: item.rankGrade || 'Penata Muda / III/a',
          position: item.position || 'Guru Ahli Pertama',
          employmentStatus: item.employmentStatus || 'PNS',
          email: item.email || newUser.email,
          phone: item.phone || '',
          schoolId: item.schoolId,
          schoolName: school?.name || item.schoolName || '-',
          joinYear: item.joinYear || new Date().getFullYear(),
          status: 'active' as const,
          moduleStatus: 'BELUM_UPLOAD' as const,
          adminCompletion: 0,
          mindsetCategory: 'Belum Dipetakan',
          supervisionStatus: 'BELUM_TERJADWAL' as const
        };

        db.teachers.push(newTeacher);

        // Update school teacher count
        if (school) {
          school.teacherCount = (school.teacherCount || 0) + 1;
        }

        processed.push(newTeacher);
        addedCount++;
      }
    }

    db.addAuditLog(
      'u-dinas',
      'Didik Setiawan, S.E',
      'ADMIN_DINAS',
      'Unggah Serentak Data Guru',
      `Import ${processed.length} data guru (${addedCount} baru, ${updatedCount} diperbarui) via file Excel`,
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      total: processed.length,
      added: addedCount,
      updated: updatedCount,
      teachers: processed
    });
  });

  // Template Excel Download endpoint for teachers
  app.get('/api/teachers/template', (req: Request, res: Response) => {
    try {
      const headers = [
        'NIP *',
        'Nama Lengkap & Gelar *',
        'Jenis Guru *',
        'Mata Pelajaran / Tugas *',
        'NPSN / Nama Satuan Pendidikan *',
        'Jenis Kelamin',
        'Status Kepegawaian',
        'Pangkat / Golongan',
        'Jabatan',
        'Nomor Telepon / WhatsApp',
        'Email',
        'NIK',
        'NUPTK'
      ];

      const sampleRows = [
        {
          'NIP *': '198504152010012023',
          'Nama Lengkap & Gelar *': 'Sumarni, S.Pd.SD.',
          'Jenis Guru *': 'Guru Kelas',
          'Mata Pelajaran / Tugas *': 'Guru Kelas IV',
          'NPSN / Nama Satuan Pendidikan *': '20501234',
          'Jenis Kelamin': 'P',
          'Status Kepegawaian': 'PNS',
          'Pangkat / Golongan': 'Penata Tingkat I / III/d',
          'Jabatan': 'Guru Ahli Muda',
          'Nomor Telepon / WhatsApp': '081234567890',
          'Email': 'sumarni.sdntinap3@gmail.com',
          'NIK': '3520016504850001',
          'NUPTK': '4147763665300052'
        },
        {
          'NIP *': '198902102015021004',
          'Nama Lengkap & Gelar *': 'Ahmad Fauzi, S.Pd.I.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'PAI',
          'NPSN / Nama Satuan Pendidikan *': '20501234',
          'Jenis Kelamin': 'L',
          'Status Kepegawaian': 'PPPK',
          'Pangkat / Golongan': 'Ahli Pertama / IX',
          'Jabatan': 'Guru Ahli Pertama',
          'Nomor Telepon / WhatsApp': '081234567891',
          'Email': 'ahmad.fauzi@sekolah.belajar.id',
          'NIK': '3520011002890002',
          'NUPTK': '5248767666200043'
        },
        {
          'NIP *': '199108172019031008',
          'Nama Lengkap & Gelar *': 'Bagus Wahyudi, S.Pd.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'PJOK',
          'NPSN / Nama Satuan Pendidikan *': '20501234',
          'Jenis Kelamin': 'L',
          'Status Kepegawaian': 'PNS',
          'Pangkat / Golongan': 'Penata Muda / III/a',
          'Jabatan': 'Guru Ahli Pertama',
          'Nomor Telepon / WhatsApp': '081234567892',
          'Email': 'bagus.wahyudi@sekolah.belajar.id',
          'NIK': '3520011708910003',
          'NUPTK': '6349769667100034'
        },
        {
          'NIP *': '198711202011012019',
          'Nama Lengkap & Gelar *': 'Rina Anggraeni, M.Pd.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'IPAS',
          'NPSN / Nama Satuan Pendidikan *': '20501234',
          'Jenis Kelamin': 'P',
          'Status Kepegawaian': 'PNS',
          'Pangkat / Golongan': 'Penata / III/c',
          'Jabatan': 'Guru Ahli Muda',
          'Nomor Telepon / WhatsApp': '081234567893',
          'Email': 'rina.anggraeni@sekolah.belajar.id',
          'NIK': '3520016011870004',
          'NUPTK': '7450765666300025'
        },
        {
          'NIP *': '198305042008011009',
          'Nama Lengkap & Gelar *': 'Drs. Hendro Wibowo',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'Matematika',
          'NPSN / Nama Satuan Pendidikan *': '20509876',
          'Jenis Kelamin': 'L',
          'Status Kepegawaian': 'PNS',
          'Pangkat / Golongan': 'Pembina / IV/a',
          'Jabatan': 'Guru Ahli Madya',
          'Nomor Telepon / WhatsApp': '081234567894',
          'Email': 'hendro.wibowo@sekolah.belajar.id',
          'NIK': '3520020405830005',
          'NUPTK': '8551761664100016'
        },
        {
          'NIP *': '199203152020122018',
          'Nama Lengkap & Gelar *': 'Dewi Sartika, S.Pd.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'Pendidikan Pancasila',
          'NPSN / Nama Satuan Pendidikan *': '20509876',
          'Jenis Kelamin': 'P',
          'Status Kepegawaian': 'PPPK',
          'Pangkat / Golongan': 'Ahli Pertama / IX',
          'Jabatan': 'Guru Ahli Pertama',
          'Nomor Telepon / WhatsApp': '081234567895',
          'Email': 'dewi.sartika@sekolah.belajar.id',
          'NIK': '3520025503920006',
          'NUPTK': '9652770668200027'
        },
        {
          'NIP *': '199406212022031005',
          'Nama Lengkap & Gelar *': 'Rizky Pratama, S.Kom.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'TIK',
          'NPSN / Nama Satuan Pendidikan *': '20509876',
          'Jenis Kelamin': 'L',
          'Status Kepegawaian': 'PPPK',
          'Pangkat / Golongan': 'Ahli Pertama / IX',
          'Jabatan': 'Guru Ahli Pertama',
          'Nomor Telepon / WhatsApp': '081234567896',
          'Email': 'rizky.pratama@sekolah.belajar.id',
          'NIK': '3520022106940007',
          'NUPTK': '1753772669100038'
        },
        {
          'NIP *': '199512102023011002',
          'Nama Lengkap & Gelar *': 'Fajar Nugroho, S.Pd.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'KKA',
          'NPSN / Nama Satuan Pendidikan *': '20509876',
          'Jenis Kelamin': 'L',
          'Status Kepegawaian': 'GTT',
          'Pangkat / Golongan': 'Non ASN',
          'Jabatan': 'Guru Koding & KA',
          'Nomor Telepon / WhatsApp': '081234567897',
          'Email': 'fajar.nugroho@sekolah.belajar.id',
          'NIK': '3520021012950008',
          'NUPTK': '2854773670100049'
        },
        {
          'NIP *': '199009182016022007',
          'Nama Lengkap & Gelar *': 'Siti Nurhaliza, S.Pd.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'Bahasa Inggris',
          'NPSN / Nama Satuan Pendidikan *': '20509876',
          'Jenis Kelamin': 'P',
          'Status Kepegawaian': 'PNS',
          'Pangkat / Golongan': 'Penata Muda Tingkat I / III/b',
          'Jabatan': 'Guru Ahli Pertama',
          'Nomor Telepon / WhatsApp': '081234567898',
          'Email': 'siti.nurhaliza@sekolah.belajar.id',
          'NIK': '3520025809900009',
          'NUPTK': '3955768667200050'
        },
        {
          'NIP *': '198607142009022011',
          'Nama Lengkap & Gelar *': 'Tri Astuti, S.Pd.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'Bahasa Jawa',
          'NPSN / Nama Satuan Pendidikan *': '20501235',
          'Jenis Kelamin': 'P',
          'Status Kepegawaian': 'PNS',
          'Pangkat / Golongan': 'Penata Tingkat I / III/d',
          'Jabatan': 'Guru Ahli Muda',
          'Nomor Telepon / WhatsApp': '081234567899',
          'Email': 'tri.astuti@sekolah.belajar.id',
          'NIK': '3520015407860010',
          'NUPTK': '4056764665200061'
        },
        {
          'NIP *': '199304082021021003',
          'Nama Lengkap & Gelar *': 'Eko Prasetyo, S.Sos.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'IPS',
          'NPSN / Nama Satuan Pendidikan *': '20509876',
          'Jenis Kelamin': 'L',
          'Status Kepegawaian': 'PPPK',
          'Pangkat / Golongan': 'Ahli Pertama / IX',
          'Jabatan': 'Guru Ahli Pertama',
          'Nomor Telepon / WhatsApp': '081234567800',
          'Email': 'eko.prasetyo@sekolah.belajar.id',
          'NIK': '3520020804930011',
          'NUPTK': '5157771668100072'
        },
        {
          'NIP *': '199201052020012015',
          'Nama Lengkap & Gelar *': 'Lestari Handayani, S.Si.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'IPA',
          'NPSN / Nama Satuan Pendidikan *': '20509876',
          'Jenis Kelamin': 'P',
          'Status Kepegawaian': 'PNS',
          'Pangkat / Golongan': 'Penata Muda / III/a',
          'Jabatan': 'Guru Ahli Pertama',
          'Nomor Telepon / WhatsApp': '081234567801',
          'Email': 'lestari.handayani@sekolah.belajar.id',
          'NIK': '3520024501920012',
          'NUPTK': '6258770668200083'
        },
        {
          'NIP *': '199105122019022014',
          'Nama Lengkap & Gelar *': 'Novi Rahmawati, S.Psi.',
          'Jenis Guru *': 'Guru Mapel',
          'Mata Pelajaran / Tugas *': 'BK',
          'NPSN / Nama Satuan Pendidikan *': '20509876',
          'Jenis Kelamin': 'P',
          'Status Kepegawaian': 'PNS',
          'Pangkat / Golongan': 'Penata Muda Tingkat I / III/b',
          'Jabatan': 'Guru Bimbingan Konseling',
          'Nomor Telepon / WhatsApp': '081234567802',
          'Email': 'novi.rahmawati@sekolah.belajar.id',
          'NIK': '3520025205910013',
          'NUPTK': '7359769667200094'
        }
      ];

      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
      wsData['!cols'] = [
        { wch: 22 },
        { wch: 28 },
        { wch: 15 },
        { wch: 25 },
        { wch: 30 },
        { wch: 14 },
        { wch: 18 },
        { wch: 28 },
        { wch: 24 },
        { wch: 22 },
        { wch: 32 },
        { wch: 20 },
        { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, wsData, 'Data_Guru');

      const refRows = [
        { Kategori: 'PETUNJUK UMUM', Keterangan: 'Tanda bintang (*) menandakan kolom wajib diisi.' },
        { Kategori: 'JENIS GURU', Keterangan: 'Pilih: "Guru Kelas" atau "Guru Mapel".' },
        { Kategori: 'GURU KELAS', Keterangan: 'Isi dengan Guru Kelas I s/d VI.' },
        { Kategori: 'GURU MAPEL RESMI', Keterangan: 'Pilih salah satu: PAI, PJOK, IPA, IPS, IPAS, Matematika, Pendidikan Pancasila, TIK, KKA, Bahasa Inggris, Bahasa Jawa, Muatan Lokal, BK.' },
        { Kategori: 'SEKOLAH', Keterangan: 'Isi dengan 8 digit NPSN sekolah atau Nama Sekolah terdaftar.' }
      ];
      const wsRef = XLSX.utils.json_to_sheet(refRows);
      wsRef['!cols'] = [{ wch: 25 }, { wch: 95 }];
      XLSX.utils.book_append_sheet(wb, wsRef, 'Petunjuk_Referensi');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename="Template_Unggah_Data_Guru.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal membuat file template Excel guru' });
    }
  });

  app.get('/api/principals', (req: Request, res: Response) => {
    res.json(db.principals);
  });

  // ==========================================
  // 4. MASTER DATA: PENGAWAS SEKOLAH
  // ==========================================
  app.get('/api/supervisors', (req: Request, res: Response) => {
    // Enrich with dynamic school names & counts
    const enriched = db.supervisors.map((sp) => {
      const assignedSchools = db.schools.filter(
        (s) => sp.assignedSchoolIds && sp.assignedSchoolIds.includes(s.id)
      );
      const levelArray = Array.isArray(sp.levels) ? sp.levels : (sp.levels ? [sp.levels] : ['SD']);
      const kecamatanArray = Array.isArray(sp.wilayahKecamatan)
        ? sp.wilayahKecamatan
        : (sp.wilayahKecamatan ? [sp.wilayahKecamatan] : []);

      return {
        ...sp,
        levels: levelArray,
        levelSummary: levelArray.join(', '),
        wilayahKecamatan: kecamatanArray,
        kabupaten: sp.kabupaten || 'Kabupaten Magetan',
        assignedSchoolIds: assignedSchools.map((s) => s.id),
        assignedSchoolNames: assignedSchools.map((s) => s.name),
        totalAssignedSchools: assignedSchools.length
      };
    });
    res.json(enriched);
  });

  app.get('/api/supervisors/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const sp = db.supervisors.find((s) => s.id === id);
    if (!sp) return res.status(404).json({ error: 'Pengawas tidak ditemukan' });

    const assignedSchools = db.schools.filter(
      (s) => sp.assignedSchoolIds && sp.assignedSchoolIds.includes(s.id)
    );
    const levelArray = Array.isArray(sp.levels) ? sp.levels : (sp.levels ? [sp.levels] : ['SD']);
    const kecamatanArray = Array.isArray(sp.wilayahKecamatan)
      ? sp.wilayahKecamatan
      : (sp.wilayahKecamatan ? [sp.wilayahKecamatan] : []);

    res.json({
      ...sp,
      levels: levelArray,
      levelSummary: levelArray.join(', '),
      wilayahKecamatan: kecamatanArray,
      kabupaten: sp.kabupaten || 'Kabupaten Magetan',
      assignedSchoolIds: assignedSchools.map((s) => s.id),
      assignedSchoolNames: assignedSchools.map((s) => s.name),
      totalAssignedSchools: assignedSchools.length
    });
  });

  app.post('/api/supervisors', (req: Request, res: Response) => {
    const {
      nip,
      nik,
      name,
      email,
      phone,
      gender,
      rankGrade,
      levels,
      wilayahKecamatan,
      specialization,
      skNumber,
      skDate,
      assignedSchoolIds,
      status,
      notes
    } = req.body;

    if (!name || !nip) {
      return res.status(400).json({ error: 'Nama dan NIP pengawas wajib diisi' });
    }

    const newUserId = `u-pengawas-${Date.now()}`;
    const newSupervisorId = `sp-${Date.now()}`;

    const levelArray = Array.isArray(levels) && levels.length > 0 ? levels : ['SD'];
    const kecamatanArray = Array.isArray(wilayahKecamatan) ? wilayahKecamatan : (wilayahKecamatan ? [wilayahKecamatan] : ['Sukomoro']);
    const schoolIds = Array.isArray(assignedSchoolIds) ? assignedSchoolIds : [];

    // Create user login account for the supervisor
    const newUser = {
      id: newUserId,
      username: nip || `pengawas_${Date.now()}`,
      name,
      email: email || `${nip}@pendidikan.magetan.go.id`,
      role: 'PENGAWAS' as const,
      nip,
      phone: phone || '',
      assignedSchoolIds: schoolIds,
      status: 'active' as const,
      createdAt: new Date().toISOString().split('T')[0]
    };
    db.users.push(newUser);

    // Get school names
    const assignedSchools = db.schools.filter((s) => schoolIds.includes(s.id));
    const schoolNames = assignedSchools.map((s) => s.name);

    const newSupervisor = {
      id: newSupervisorId,
      userId: newUserId,
      nip,
      nik: nik || '',
      name,
      email: email || `${nip}@pendidikan.magetan.go.id`,
      phone: phone || '',
      gender: gender || 'L',
      rankGrade: rankGrade || 'Pembina Tingkat I / IV/b',
      levels: levelArray,
      levelSummary: levelArray.join(', '),
      wilayahKecamatan: kecamatanArray,
      kabupaten: 'Kabupaten Magetan',
      specialization: specialization || 'Supervisi Mutu & Pembelajaran Mendalam',
      skNumber: skNumber || `800/${Math.floor(100 + Math.random() * 900)}/403.101/2026`,
      skDate: skDate || new Date().toISOString().split('T')[0],
      assignedSchoolIds: schoolIds,
      assignedSchoolNames: schoolNames,
      status: status || 'active',
      notes: notes || '',
      createdAt: new Date().toISOString().split('T')[0]
    };
    db.supervisors.push(newSupervisor);

    // Update supervisorId on assigned schools
    schoolIds.forEach((schId) => {
      const sch = db.schools.find((s) => s.id === schId);
      if (sch) {
        sch.supervisorId = newSupervisorId;
        sch.supervisorName = name;
      }
    });

    db.addAuditLog(
      'u-dinas',
      'Admin Dinas',
      'ADMIN_DINAS',
      'Tambah Pengawas Sekolah',
      `Menambahkan data Pengawas Sekolah: ${name} (Jenjang: ${levelArray.join(', ')}, Wilayah: ${kecamatanArray.join(', ')})`,
      req.ip || '127.0.0.1'
    );

    res.status(201).json(newSupervisor);
  });

  app.put('/api/supervisors/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.supervisors.findIndex((s) => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Pengawas tidak ditemukan' });

    const existing = db.supervisors[index];
    const {
      nip,
      nik,
      name,
      email,
      phone,
      gender,
      rankGrade,
      levels,
      wilayahKecamatan,
      specialization,
      skNumber,
      skDate,
      assignedSchoolIds,
      status,
      notes
    } = req.body;

    const levelArray = levels ? (Array.isArray(levels) ? levels : [levels]) : existing.levels;
    const kecamatanArray = wilayahKecamatan
      ? (Array.isArray(wilayahKecamatan) ? wilayahKecamatan : [wilayahKecamatan])
      : existing.wilayahKecamatan;
    const schoolIds = assignedSchoolIds !== undefined
      ? (Array.isArray(assignedSchoolIds) ? assignedSchoolIds : [])
      : existing.assignedSchoolIds;

    const assignedSchools = db.schools.filter((s) => schoolIds.includes(s.id));
    const schoolNames = assignedSchools.map((s) => s.name);

    db.supervisors[index] = {
      ...existing,
      nip: nip !== undefined ? nip : existing.nip,
      nik: nik !== undefined ? nik : existing.nik,
      name: name !== undefined ? name : existing.name,
      email: email !== undefined ? email : existing.email,
      phone: phone !== undefined ? phone : existing.phone,
      gender: gender !== undefined ? gender : existing.gender,
      rankGrade: rankGrade !== undefined ? rankGrade : existing.rankGrade,
      levels: levelArray,
      levelSummary: Array.isArray(levelArray) ? levelArray.join(', ') : levelArray,
      wilayahKecamatan: kecamatanArray,
      specialization: specialization !== undefined ? specialization : existing.specialization,
      skNumber: skNumber !== undefined ? skNumber : existing.skNumber,
      skDate: skDate !== undefined ? skDate : existing.skDate,
      assignedSchoolIds: schoolIds,
      assignedSchoolNames: schoolNames,
      status: status !== undefined ? status : existing.status,
      notes: notes !== undefined ? notes : existing.notes,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    // Sync corresponding user record
    const userIndex = db.users.findIndex((u) => u.id === existing.userId);
    if (userIndex !== -1) {
      if (name) db.users[userIndex].name = name;
      if (email) db.users[userIndex].email = email;
      if (nip) db.users[userIndex].nip = nip;
      if (phone) db.users[userIndex].phone = phone;
      db.users[userIndex].assignedSchoolIds = schoolIds;
    }

    // Sync schools
    if (assignedSchoolIds !== undefined) {
      // Unlink previous schools not in new list
      db.schools.forEach((s) => {
        if (s.supervisorId === id && !schoolIds.includes(s.id)) {
          s.supervisorId = '';
          s.supervisorName = '-';
        }
      });
      // Link newly assigned schools
      schoolIds.forEach((schId: string) => {
        const sch = db.schools.find((s) => s.id === schId);
        if (sch) {
          sch.supervisorId = id;
          sch.supervisorName = db.supervisors[index].name;
        }
      });
    }

    db.addAuditLog(
      'u-dinas',
      'Admin Dinas',
      'ADMIN_DINAS',
      'Update Data Pengawas Sekolah',
      `Memperbarui profil Pengawas ${db.supervisors[index].name} (Wilayah: ${(kecamatanArray || []).join(', ')})`,
      req.ip || '127.0.0.1'
    );

    res.json(db.supervisors[index]);
  });

  app.delete('/api/supervisors/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.supervisors.findIndex((s) => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Pengawas tidak ditemukan' });

    const deleted = db.supervisors[index];

    // Unlink schools
    db.schools.forEach((s) => {
      if (s.supervisorId === id) {
        s.supervisorId = '';
        s.supervisorName = '-';
      }
    });

    db.supervisors.splice(index, 1);

    db.addAuditLog(
      'u-dinas',
      'Admin Dinas',
      'ADMIN_DINAS',
      'Hapus Pengawas Sekolah',
      `Menghapus data Pengawas ${deleted.name} (NIP: ${deleted.nip})`,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, message: `Pengawas ${deleted.name} berhasil dihapus` });
  });

  // ==========================================
  // 5. MUTASI GURU ANTAR SEKOLAH
  // ==========================================
  app.get('/api/mutations', (req: Request, res: Response) => {
    res.json(db.mutations);
  });

  app.post('/api/mutations', (req: Request, res: Response) => {
    const { teacherId, toSchoolId, mutationDate, skNumber, reason, notes, adminName, adminId } = req.body;
    const teacher = db.teachers.find((t) => t.id === teacherId);
    const toSchool = db.schools.find((s) => s.id === toSchoolId);

    if (!teacher || !toSchool) {
      return res.status(400).json({ error: 'Data guru atau sekolah tujuan tidak valid' });
    }

    const fromSchoolName = teacher.schoolName;
    const fromSchoolId = teacher.schoolId;

    if (fromSchoolId === toSchoolId) {
      return res.status(400).json({ error: 'Sekolah tujuan tidak boleh sama dengan sekolah saat ini' });
    }

    const mutationRecord = {
      id: `mut-${Date.now()}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherNip: teacher.nip,
      fromSchoolId,
      fromSchoolName,
      toSchoolId,
      toSchoolName: toSchool.name,
      mutationDate: mutationDate || new Date().toISOString().split('T')[0],
      skNumber: skNumber || `824/SK-MUT/DISDIK/${new Date().getFullYear()}`,
      reason: reason || 'Pemerataan Tenaga Pendidik',
      notes,
      createdBy: adminName || 'Admin Dinas Pendidikan',
      createdAt: new Date().toISOString().split('T')[0]
    };

    db.mutations.unshift(mutationRecord);

    // Update teacher's active school assignment
    teacher.schoolId = toSchoolId;
    teacher.schoolName = toSchool.name;

    // Update user link
    const user = db.users.find((u) => u.id === teacher.userId);
    if (user) {
      user.schoolId = toSchoolId;
    }

    db.addAuditLog(
      adminId || 'u-dinas',
      adminName || 'Admin Dinas',
      'ADMIN_DINAS',
      'Mutasi Guru Antar Sekolah',
      `Mutasi ${teacher.name} dari ${fromSchoolName} ke ${toSchool.name} (SK: ${mutationRecord.skNumber})`,
      req.ip || '127.0.0.1'
    );

    db.addNotification(
      teacher.userId,
      'Pemberitahuan SK Mutasi',
      `Anda telah dimutasikan dari ${fromSchoolName} ke ${toSchool.name} sesuai SK ${mutationRecord.skNumber}.`,
      'info'
    );

    res.status(201).json({ success: true, mutation: mutationRecord, teacher });
  });

  // ==========================================
  // 6. MODUL AJAR (TEACHING MODULES)
  // ==========================================
  app.get('/api/learning-modules', (req: Request, res: Response) => {
    const { teacherId, schoolId, status } = req.query;
    let list = db.modules;
    if (teacherId) list = list.filter((m) => m.teacherId === teacherId);
    if (schoolId) list = list.filter((m) => m.schoolId === schoolId);
    if (status) list = list.filter((m) => m.status === status);
    res.json(list);
  });

  app.post('/api/learning-modules', (req: Request, res: Response) => {
    const {
      teacherId,
      subject,
      gradeClass,
      semester,
      title,
      description,
      fileName,
      fileSize,
      fileType,
      fileUrl
    } = req.body;

    const teacher = db.teachers.find((t) => t.id === teacherId);
    const activeYear = db.educationYears.find((y) => y.isActive) || db.educationYears[0];

    const newModule = {
      id: `mod-${Date.now()}`,
      educationYearId: activeYear.id,
      educationYearName: `${activeYear.name} (${activeYear.semester})`,
      teacherId: teacher?.id || 't-1',
      teacherName: teacher?.name || 'Sumarni, S.Pd.SD.',
      schoolId: teacher?.schoolId || 'sch-1',
      schoolName: teacher?.schoolName || 'SD Negeri Tinap 3',
      subject: subject || teacher?.subject || 'IPAS',
      gradeClass: gradeClass || 'Fase B / Kelas 4',
      semester: semester || '1',
      title,
      description,
      fileName: fileName || (fileUrl ? 'Dokumen Modul Ajar (Google Drive)' : 'Modul_Ajar.pdf'),
      fileSize: fileType === 'link_drive' ? 'Tautan Google Drive' : (fileSize || 'Tautan Dokumen'),
      fileType: fileType || (fileUrl ? 'link_drive' : 'pdf'),
      fileUrl,
      version: 1,
      status: 'DIUPLOAD' as const,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      history: [
        {
          version: 1,
          fileName: fileName || (fileUrl ? 'Dokumen Modul Ajar (Google Drive)' : 'Modul_Ajar.pdf'),
          uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status: 'DIUPLOAD' as const
        }
      ]
    };

    db.modules.unshift(newModule);

    // Update teacher quick status
    if (teacher) {
      teacher.moduleStatus = 'DIUPLOAD';
    }

    db.addAuditLog(
      teacher?.userId || 'u-guru-1',
      teacher?.name || 'Guru',
      'GURU',
      fileType === 'link_drive' ? 'Tautkan Link Drive Modul Ajar' : 'Upload Modul Ajar',
      `Menautkan modul ajar "${title}" (${newModule.subject}) via Google Drive`,
      req.ip || '127.0.0.1'
    );

    // Notify Principal
    const principal = db.principals.find((p) => p.schoolId === newModule.schoolId);
    if (principal) {
      db.addNotification(
        principal.userId,
        'Modul Ajar Baru Ditautkan',
        `${newModule.teacherName} telah menautkan modul ajar "${title}" (Google Drive) untuk diperiksa.`,
        'info',
        '/modul-ajar'
      );
    }

    res.status(201).json(newModule);
  });

  app.put('/api/learning-modules/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, feedback, reviewerName, reviewerId } = req.body;
    const moduleItem = db.modules.find((m) => m.id === id);
    if (!moduleItem) return res.status(404).json({ error: 'Modul tidak ditemukan' });

    moduleItem.status = status;
    moduleItem.feedback = feedback;
    moduleItem.reviewedBy = reviewerName;
    moduleItem.reviewedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
    moduleItem.updatedAt = moduleItem.reviewedAt;

    // Update history
    if (moduleItem.history && moduleItem.history.length > 0) {
      const last = moduleItem.history[moduleItem.history.length - 1];
      last.status = status;
      last.feedback = feedback;
    }

    const teacher = db.teachers.find((t) => t.id === moduleItem.teacherId);
    if (teacher) {
      teacher.moduleStatus = status;
    }

    db.addAuditLog(
      reviewerId || 'u-ks-1',
      reviewerName || 'Kepala Sekolah',
      'KEPALA_SEKOLAH',
      'Review Modul Ajar',
      `Memperbarui status modul "${moduleItem.title}" menjadi ${status}. Catatan: ${feedback || '-'}`,
      req.ip || '127.0.0.1'
    );

    if (teacher) {
      const typeNotif = status === 'DISETUJUI' ? 'success' : status === 'PERLU_REVISI' ? 'warning' : 'info';
      db.addNotification(
        teacher.userId,
        `Status Modul Ajar: ${status}`,
        `Modul ajar "${moduleItem.title}" Anda telah ${status === 'DISETUJUI' ? 'disetujui' : status === 'PERLU_REVISI' ? 'memerlukan revisi: ' + feedback : 'diperiksa'}.`,
        typeNotif,
        '/modul-ajar'
      );
    }

    res.json(moduleItem);
  });

  // ==========================================
  // 7. CHECKLIST ADMINISTRASI PEMBELAJARAN
  // ==========================================
  app.get('/api/administration-items', (req: Request, res: Response) => {
    const sorted = [...db.adminItems].sort((a, b) => a.order - b.order);
    res.json(sorted);
  });

  app.post('/api/administration-items', (req: Request, res: Response) => {
    const { name, description, isRequired } = req.body;
    const newItem = {
      id: `adm-${Date.now()}`,
      name,
      description: description || '',
      isRequired: isRequired !== false,
      order: db.adminItems.length + 1
    };
    db.adminItems.push(newItem);

    db.addAuditLog(
      'u-dinas',
      'Admin Dinas',
      'ADMIN_DINAS',
      'Tambah Item Administrasi',
      `Menambahkan item checklist administrasi baru: "${name}"`,
      req.ip || '127.0.0.1'
    );

    res.status(201).json(newItem);
  });

  app.put('/api/administration-items/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.adminItems.findIndex((item) => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Item tidak ditemukan' });

    db.adminItems[index] = { ...db.adminItems[index], ...req.body };
    res.json(db.adminItems[index]);
  });

  app.delete('/api/administration-items/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.adminItems = db.adminItems.filter((i) => i.id !== id);
    res.json({ success: true });
  });

  app.get('/api/teacher-administration', (req: Request, res: Response) => {
    const { teacherId } = req.query;
    let list = db.teacherAdminRecords;
    if (teacherId) list = list.filter((r) => r.teacherId === teacherId);
    res.json(list);
  });

  app.get('/api/teacher-administration/checklists', (req: Request, res: Response) => {
    const { schoolId } = req.query;
    let targetTeachers = db.teachers.filter((t) => t.status === 'active');
    if (schoolId) {
      targetTeachers = targetTeachers.filter((t) => t.schoolId === schoolId);
    }

    const checklists = targetTeachers.map((teacher) => {
      const records = db.teacherAdminRecords.filter((r) => r.teacherId === teacher.id);
      const items = db.adminItems.map((item) => {
        const rec = records.find((r) => r.itemId === item.id);
        return {
          itemId: item.id,
          itemName: item.name,
          isRequired: item.isRequired,
          order: item.order,
          isCompleted: !!rec?.isAvailable,
          fileName: rec?.fileName,
          fileUrl: rec?.fileUrl || (rec?.fileName ? `/uploads/${rec.fileName}` : undefined),
          notes: rec?.notes || '',
          supervisorConfirmed: rec?.supervisorConfirmed ?? (rec?.status === 'DISETUJUI'),
          supervisorScore: rec?.supervisorScore,
          supervisorStatus: rec?.supervisorStatus || (rec?.status === 'DISETUJUI' ? 'SESUAI' : (rec?.status === 'PERLU_REVISI' ? 'PERLU_PERBAIKAN' : undefined)),
          supervisorFeedback: rec?.supervisorFeedback
        };
      });

      const completedCount = items.filter((i) => i.isCompleted).length;
      const totalCount = items.length || 1;
      const selfCompletionPercentage = Math.round((completedCount / totalCount) * 100);

      const isVerifiedBySupervisor = !!teacher.adminVerifiedBySupervisor || records.some((r) => r.supervisorConfirmed !== undefined && r.supervisorScore !== undefined);
      // Nilai akhir administrasi guru yang digunakan adalah hasil dari penilaian pengawas sekolah
      const finalScore = teacher.adminSupervisorScore ?? teacher.adminScore ?? (isVerifiedBySupervisor ? (teacher.adminCompletion || selfCompletionPercentage) : selfCompletionPercentage);

      return {
        id: `chk-${teacher.id}`,
        teacherId: teacher.id,
        teacherName: teacher.name,
        schoolId: teacher.schoolId,
        schoolName: teacher.schoolName,
        selfCompletionPercentage,
        completionPercentage: finalScore, // Nilai akhir resmi
        supervisorScore: teacher.adminSupervisorScore ?? (isVerifiedBySupervisor ? finalScore : undefined),
        isVerifiedBySupervisor,
        supervisorStatus: teacher.adminSupervisorStatus || (isVerifiedBySupervisor ? 'DISETUJUI' : 'BELUM_DINILAI'),
        supervisorNotes: teacher.adminSupervisorNotes,
        supervisorEvaluatorName: teacher.adminSupervisorEvaluatorName,
        supervisorEvaluatedAt: teacher.adminSupervisorEvaluatedAt,
        items,
        updatedAt: records[0]?.updatedAt || new Date().toISOString().split('T')[0]
      };
    });

    res.json(checklists);
  });

  app.get('/api/teacher-administration/checklist/:teacherId', (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const teacher = db.teachers.find((t) => t.id === teacherId);
    if (!teacher) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    const records = db.teacherAdminRecords.filter((r) => r.teacherId === teacherId);
    const items = db.adminItems.map((item) => {
      const rec = records.find((r) => r.itemId === item.id);
      return {
        itemId: item.id,
        itemName: item.name,
        isRequired: item.isRequired,
        order: item.order,
        isCompleted: !!rec?.isAvailable,
        fileName: rec?.fileName,
        fileUrl: rec?.fileUrl || (rec?.fileName ? `/uploads/${rec.fileName}` : undefined),
        notes: rec?.notes || '',
        supervisorConfirmed: rec?.supervisorConfirmed ?? (rec?.status === 'DISETUJUI'),
        supervisorScore: rec?.supervisorScore,
        supervisorStatus: rec?.supervisorStatus || (rec?.status === 'DISETUJUI' ? 'SESUAI' : (rec?.status === 'PERLU_REVISI' ? 'PERLU_PERBAIKAN' : undefined)),
        supervisorFeedback: rec?.supervisorFeedback
      };
    });

    const completedCount = items.filter((i) => i.isCompleted).length;
    const totalCount = items.length || 1;
    const selfCompletionPercentage = Math.round((completedCount / totalCount) * 100);

    const isVerifiedBySupervisor = !!teacher.adminVerifiedBySupervisor || records.some((r) => r.supervisorConfirmed !== undefined && r.supervisorScore !== undefined);
    const finalScore = teacher.adminSupervisorScore ?? teacher.adminScore ?? (isVerifiedBySupervisor ? (teacher.adminCompletion || selfCompletionPercentage) : selfCompletionPercentage);

    res.json({
      id: `chk-${teacher.id}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      schoolId: teacher.schoolId,
      schoolName: teacher.schoolName,
      selfCompletionPercentage,
      completionPercentage: finalScore, // Nilai akhir resmi dari penilaian pengawas
      supervisorScore: teacher.adminSupervisorScore ?? (isVerifiedBySupervisor ? finalScore : undefined),
      isVerifiedBySupervisor,
      supervisorStatus: teacher.adminSupervisorStatus || (isVerifiedBySupervisor ? 'DISETUJUI' : 'BELUM_DINILAI'),
      supervisorNotes: teacher.adminSupervisorNotes,
      supervisorEvaluatorName: teacher.adminSupervisorEvaluatorName,
      supervisorEvaluatedAt: teacher.adminSupervisorEvaluatedAt,
      items,
      updatedAt: records[0]?.updatedAt || new Date().toISOString().split('T')[0]
    });
  });

  app.put('/api/teacher-administration/checklist/:teacherId/item/:itemId', (req: Request, res: Response) => {
    const { teacherId, itemId } = req.params;
    const { isCompleted, fileName, fileUrl, notes } = req.body;

    const teacher = db.teachers.find((t) => t.id === teacherId);
    if (!teacher) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    const item = db.adminItems.find((i) => i.id === itemId);
    const itemName = item?.name || 'Dokumen Administrasi';

    const existingIndex = db.teacherAdminRecords.findIndex(
      (r) => r.teacherId === teacherId && r.itemId === itemId
    );

    const activeYear = db.educationYears.find((y) => y.isActive) || db.educationYears[0];

    const recordData = {
      id: existingIndex !== -1 ? db.teacherAdminRecords[existingIndex].id : `tar-${Date.now()}-${itemId}`,
      educationYearId: activeYear.id,
      teacherId,
      schoolId: teacher.schoolId,
      itemId,
      itemName,
      isAvailable: typeof isCompleted === 'boolean' ? isCompleted : true,
      fileName: fileName || (existingIndex !== -1 ? db.teacherAdminRecords[existingIndex].fileName : undefined),
      fileUrl: fileUrl || (existingIndex !== -1 ? db.teacherAdminRecords[existingIndex].fileUrl : undefined),
      notes: notes !== undefined ? notes : (existingIndex !== -1 ? db.teacherAdminRecords[existingIndex].notes : ''),
      status: isCompleted ? 'LENGKAP' : 'BELUM_LENGKAP',
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    if (existingIndex !== -1) {
      db.teacherAdminRecords[existingIndex] = {
        ...db.teacherAdminRecords[existingIndex],
        ...recordData
      };
    } else {
      db.teacherAdminRecords.push(recordData as any);
    }

    // Update teacher self percentage
    const teacherRecords = db.teacherAdminRecords.filter((r) => r.teacherId === teacherId);
    const completedCount = teacherRecords.filter((r) => r.isAvailable).length;
    const total = db.adminItems.length || 1;
    const selfPercent = Math.round((completedCount / total) * 100);
    teacher.adminSelfCompletion = selfPercent;
    if (!teacher.adminVerifiedBySupervisor) {
      teacher.adminCompletion = selfPercent;
    }

    const allItems = db.adminItems.map((admItem) => {
      const rec = teacherRecords.find((r) => r.itemId === admItem.id);
      return {
        itemId: admItem.id,
        itemName: admItem.name,
        isRequired: admItem.isRequired,
        order: admItem.order,
        isCompleted: !!rec?.isAvailable,
        fileName: rec?.fileName,
        fileUrl: rec?.fileUrl,
        notes: rec?.notes || '',
        supervisorConfirmed: rec?.supervisorConfirmed,
        supervisorScore: rec?.supervisorScore,
        supervisorStatus: rec?.supervisorStatus,
        supervisorFeedback: rec?.supervisorFeedback
      };
    });

    res.json({
      id: `chk-${teacher.id}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      schoolId: teacher.schoolId,
      schoolName: teacher.schoolName,
      selfCompletionPercentage: selfPercent,
      completionPercentage: teacher.adminCompletion || selfPercent,
      supervisorScore: teacher.adminSupervisorScore,
      isVerifiedBySupervisor: !!teacher.adminVerifiedBySupervisor,
      supervisorStatus: teacher.adminSupervisorStatus || 'BELUM_DINILAI',
      supervisorNotes: teacher.adminSupervisorNotes,
      supervisorEvaluatorName: teacher.adminSupervisorEvaluatorName,
      items: allItems,
      updatedAt: recordData.updatedAt
    });
  });

  // Evaluasi Administrasi & Perangkat Pembelajaran oleh Pengawas Sekolah (Penetapan Nilai Akhir)
  app.post('/api/teacher-administration/supervisor-evaluate', (req: Request, res: Response) => {
    const {
      teacherId,
      supervisorScore,
      supervisorNotes,
      supervisorStatus = 'DISETUJUI',
      evaluatorName = 'Drs. Bambang Hidayat, M.Pd.',
      evaluatorId = 'sp-1',
      evaluatorNip,
      itemEvaluations = []
    } = req.body;

    const teacher = db.teachers.find((t) => t.id === teacherId);
    if (!teacher) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    const activeYear = db.educationYears.find((y) => y.isActive) || db.educationYears[0];
    const evaluatedAt = new Date().toISOString().split('T')[0];

    // Update item-level evaluations
    if (Array.isArray(itemEvaluations) && itemEvaluations.length > 0) {
      itemEvaluations.forEach((itemEval: any) => {
        const existingIndex = db.teacherAdminRecords.findIndex(
          (r) => r.teacherId === teacherId && r.itemId === itemEval.itemId
        );
        if (existingIndex !== -1) {
          db.teacherAdminRecords[existingIndex].supervisorConfirmed = itemEval.supervisorConfirmed ?? true;
          db.teacherAdminRecords[existingIndex].supervisorScore = itemEval.supervisorScore;
          db.teacherAdminRecords[existingIndex].supervisorStatus = itemEval.supervisorStatus || 'SESUAI';
          db.teacherAdminRecords[existingIndex].supervisorFeedback = itemEval.supervisorFeedback || '';
          db.teacherAdminRecords[existingIndex].supervisorEvaluatedBy = evaluatorName;
          db.teacherAdminRecords[existingIndex].supervisorEvaluatedAt = evaluatedAt;
          db.teacherAdminRecords[existingIndex].status = itemEval.supervisorStatus === 'SESUAI' ? 'DISETUJUI' : 'PERLU_REVISI';
          db.teacherAdminRecords[existingIndex].verifiedBy = evaluatorName;
          db.teacherAdminRecords[existingIndex].verifiedAt = evaluatedAt;
        } else {
          const admItem = db.adminItems.find((i) => i.id === itemEval.itemId);
          db.teacherAdminRecords.push({
            id: `tar-${Date.now()}-${itemEval.itemId}`,
            educationYearId: activeYear.id,
            teacherId,
            schoolId: teacher.schoolId,
            itemId: itemEval.itemId,
            itemName: admItem?.name || 'Dokumen Administrasi',
            isAvailable: true,
            status: itemEval.supervisorStatus === 'SESUAI' ? 'DISETUJUI' : 'PERLU_REVISI',
            verifiedBy: evaluatorName,
            verifiedAt: evaluatedAt,
            supervisorConfirmed: itemEval.supervisorConfirmed ?? true,
            supervisorScore: itemEval.supervisorScore,
            supervisorStatus: itemEval.supervisorStatus || 'SESUAI',
            supervisorFeedback: itemEval.supervisorFeedback || '',
            supervisorEvaluatedBy: evaluatorName,
            supervisorEvaluatedAt: evaluatedAt,
            updatedAt: evaluatedAt
          });
        }
      });
    }

    // Nilai akhir administrasi guru yang digunakan adalah penilaian pengawas
    const numericScore = Math.min(100, Math.max(0, Math.round(Number(supervisorScore))));
    teacher.adminSupervisorScore = numericScore;
    teacher.adminScore = numericScore; // Nilai akhir resmi
    teacher.adminCompletion = numericScore; // Seluruh komponen membaca nilai akhir dari pengawas
    teacher.adminVerifiedBySupervisor = true;
    teacher.adminSupervisorStatus = supervisorStatus;
    teacher.adminSupervisorNotes = supervisorNotes || '';
    teacher.adminSupervisorEvaluatorName = evaluatorName;
    teacher.adminSupervisorEvaluatedAt = evaluatedAt;

    db.addAuditLog(
      evaluatorId,
      evaluatorName,
      'PENGAWAS',
      'Penilaian Administrasi Guru',
      `Menetapkan nilai akhir administrasi ${teacher.name}: ${numericScore}/100 (${supervisorStatus})`,
      req.ip || '127.0.0.1'
    );

    const teacherRecords = db.teacherAdminRecords.filter((r) => r.teacherId === teacherId);
    const completedCount = teacherRecords.filter((r) => r.isAvailable).length;
    const total = db.adminItems.length || 1;
    const selfPercent = Math.round((completedCount / total) * 100);

    const items = db.adminItems.map((item) => {
      const rec = teacherRecords.find((r) => r.itemId === item.id);
      return {
        itemId: item.id,
        itemName: item.name,
        isRequired: item.isRequired,
        order: item.order,
        isCompleted: !!rec?.isAvailable,
        fileName: rec?.fileName,
        fileUrl: rec?.fileUrl || (rec?.fileName ? `/uploads/${rec.fileName}` : undefined),
        notes: rec?.notes || '',
        supervisorConfirmed: rec?.supervisorConfirmed,
        supervisorScore: rec?.supervisorScore,
        supervisorStatus: rec?.supervisorStatus,
        supervisorFeedback: rec?.supervisorFeedback
      };
    });

    res.json({
      success: true,
      checklist: {
        id: `chk-${teacher.id}`,
        teacherId: teacher.id,
        teacherName: teacher.name,
        schoolId: teacher.schoolId,
        schoolName: teacher.schoolName,
        selfCompletionPercentage: selfPercent,
        completionPercentage: numericScore, // Nilai akhir resmi
        supervisorScore: numericScore,
        isVerifiedBySupervisor: true,
        supervisorStatus,
        supervisorNotes,
        supervisorEvaluatorName: evaluatorName,
        supervisorEvaluatedAt: evaluatedAt,
        items
      }
    });
  });

  // Konfirmasi Hasil Penilaian Diri Guru oleh Pengawas Sekolah
  app.post('/api/teacher-administration/confirm-self-assessment', (req: Request, res: Response) => {
    const {
      teacherId,
      evaluatorName = 'Drs. Bambang Hidayat, M.Pd.',
      evaluatorId = 'sp-1',
      supervisorScore,
      supervisorNotes = 'Hasil penilaian diri guru telah diverifikasi, dikonfirmasi, dan disahkan oleh Pengawas Sekolah sesuai standar kurikulum.'
    } = req.body;

    const teacher = db.teachers.find((t) => t.id === teacherId);
    if (!teacher) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    const evaluatedAt = new Date().toISOString().split('T')[0];
    const teacherRecords = db.teacherAdminRecords.filter((r) => r.teacherId === teacherId);
    const completedCount = teacherRecords.filter((r) => r.isAvailable).length;
    const total = db.adminItems.length || 1;
    const selfPercent = Math.round((completedCount / total) * 100);

    // Hitung nilai akhir pengawas: gunakan supervisorScore jika diberikan, atau proporsional berbasis penilaian diri guru
    const finalScore = supervisorScore !== undefined
      ? Math.min(100, Math.max(0, Math.round(Number(supervisorScore))))
      : Math.min(100, Math.max(0, Math.round(selfPercent >= 90 ? 95 : selfPercent >= 80 ? 88 : selfPercent)));

    // Set konfirmasi pengawas pada seluruh berkas yang telah diunggah oleh guru
    teacherRecords.forEach((rec) => {
      if (rec.isAvailable) {
        rec.supervisorConfirmed = true;
        rec.supervisorStatus = 'SESUAI';
        rec.supervisorScore = finalScore;
        rec.supervisorFeedback = 'Berkas terverifikasi lengkap dan sesuai standar.';
        rec.supervisorEvaluatedBy = evaluatorName;
        rec.supervisorEvaluatedAt = evaluatedAt;
        rec.status = 'DISETUJUI';
        rec.verifiedBy = evaluatorName;
        rec.verifiedAt = evaluatedAt;
      }
    });

    teacher.adminSupervisorScore = finalScore;
    teacher.adminScore = finalScore; // Nilai akhir resmi
    teacher.adminCompletion = finalScore; // Nilai akhir resmi yang digunakan sistem
    teacher.adminVerifiedBySupervisor = true;
    teacher.adminSupervisorStatus = 'DISETUJUI';
    teacher.adminSupervisorNotes = supervisorNotes;
    teacher.adminSupervisorEvaluatorName = evaluatorName;
    teacher.adminSupervisorEvaluatedAt = evaluatedAt;

    db.addAuditLog(
      evaluatorId,
      evaluatorName,
      'PENGAWAS',
      'Konfirmasi Penilaian Diri Guru',
      `Mengesahkan hasil penilaian diri ${teacher.name} dengan nilai akhir ${finalScore}/100`,
      req.ip || '127.0.0.1'
    );

    const items = db.adminItems.map((item) => {
      const rec = teacherRecords.find((r) => r.itemId === item.id);
      return {
        itemId: item.id,
        itemName: item.name,
        isRequired: item.isRequired,
        order: item.order,
        isCompleted: !!rec?.isAvailable,
        fileName: rec?.fileName,
        fileUrl: rec?.fileUrl || (rec?.fileName ? `/uploads/${rec.fileName}` : undefined),
        notes: rec?.notes || '',
        supervisorConfirmed: rec?.supervisorConfirmed,
        supervisorScore: rec?.supervisorScore,
        supervisorStatus: rec?.supervisorStatus,
        supervisorFeedback: rec?.supervisorFeedback
      };
    });

    res.json({
      success: true,
      checklist: {
        id: `chk-${teacher.id}`,
        teacherId: teacher.id,
        teacherName: teacher.name,
        schoolId: teacher.schoolId,
        schoolName: teacher.schoolName,
        selfCompletionPercentage: selfPercent,
        completionPercentage: finalScore,
        supervisorScore: finalScore,
        isVerifiedBySupervisor: true,
        supervisorStatus: 'DISETUJUI',
        supervisorNotes,
        supervisorEvaluatorName: evaluatorName,
        supervisorEvaluatedAt: evaluatedAt,
        items
      }
    });
  });

  app.post('/api/teacher-administration/save-bulk', (req: Request, res: Response) => {
    const { teacherId, schoolId, records, teacherName } = req.body;
    const activeYear = db.educationYears.find((y) => y.isActive) || db.educationYears[0];

    records.forEach((rec: any) => {
      const existingIndex = db.teacherAdminRecords.findIndex(
        (r) => r.teacherId === teacherId && r.itemId === rec.itemId
      );
      const recordData = {
        id: existingIndex !== -1 ? db.teacherAdminRecords[existingIndex].id : `tar-${Date.now()}-${rec.itemId}`,
        educationYearId: activeYear.id,
        teacherId,
        schoolId: schoolId || 'sch-1',
        itemId: rec.itemId,
        itemName: rec.itemName,
        isAvailable: !!rec.isAvailable,
        fileName: rec.fileName || (existingIndex !== -1 ? db.teacherAdminRecords[existingIndex].fileName : undefined),
        notes: rec.notes || '',
        status: rec.isAvailable ? (rec.status || 'LENGKAP') : 'BELUM_LENGKAP',
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      if (existingIndex !== -1) {
        db.teacherAdminRecords[existingIndex] = {
          ...db.teacherAdminRecords[existingIndex],
          ...recordData
        };
      } else {
        db.teacherAdminRecords.push(recordData as any);
      }
    });

    // Update teacher admin completion percentage
    const teacher = db.teachers.find((t) => t.id === teacherId);
    if (teacher) {
      const completed = records.filter((r: any) => r.isAvailable).length;
      const total = db.adminItems.length || 1;
      const selfPercent = Math.round((completed / total) * 100);
      teacher.adminSelfCompletion = selfPercent;
      // If supervisor hasn't set official score yet, display self completion as provisional
      if (!teacher.adminVerifiedBySupervisor) {
        teacher.adminCompletion = selfPercent;
      }
    }

    db.addAuditLog(
      teacher?.userId || 'u-guru-1',
      teacherName || teacher?.name || 'Guru',
      'GURU',
      'Update Checklist Administrasi',
      `Menyimpan kelengkapan administrasi pembelajaran (Penilaian Diri: ${teacher?.adminSelfCompletion}% lengkap)`,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, completion: teacher?.adminCompletion, selfCompletion: teacher?.adminSelfCompletion });
  });

  // ==========================================
  // 8. PEMETAAN POLA PIKIR GURU (MINDSET)
  // ==========================================
  app.get('/api/mindset/instruments', (req: Request, res: Response) => {
    res.json(db.mindsetInstruments);
  });

  app.get('/api/mindset/assessments', (req: Request, res: Response) => {
    const { teacherId, schoolId } = req.query;
    let list = db.mindsetAssessments;
    if (teacherId) list = list.filter((m) => m.teacherId === teacherId);
    if (schoolId) list = list.filter((m) => m.schoolId === schoolId);
    res.json(list);
  });

  app.post('/api/mindset/assessments', (req: Request, res: Response) => {
    const { teacherId, evaluatedById, evaluatedByName, answers, principalNotes, recommendations } = req.body;
    const teacher = db.teachers.find((t) => t.id === teacherId);
    const activeYear = db.educationYears.find((y) => y.isActive) || db.educationYears[0];

    const totalScore = answers.reduce((sum: number, a: any) => sum + Number(a.score || 0), 0);
    const maxScore = answers.length * 4;
    const percentage = Math.round((totalScore / maxScore) * 100);

    let category: 'Pola Pikir Berkembang' | 'Pola Pikir Berkembang dengan Pendampingan' | 'Pola Pikir Perlu Penguatan';
    if (percentage >= 80) {
      category = 'Pola Pikir Berkembang';
    } else if (percentage >= 60) {
      category = 'Pola Pikir Berkembang dengan Pendampingan';
    } else {
      category = 'Pola Pikir Perlu Penguatan';
    }

    const newAssessment = {
      id: `ma-${Date.now()}`,
      educationYearId: activeYear.id,
      teacherId: teacher?.id || teacherId,
      teacherName: teacher?.name || '-',
      schoolId: teacher?.schoolId || 'sch-1',
      schoolName: teacher?.schoolName || '-',
      evaluatedById: evaluatedById || 'u-ks-1',
      evaluatedByName: evaluatedByName || 'Kepala Sekolah',
      evaluatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      answers,
      totalScore,
      maxScore,
      percentage,
      category,
      principalNotes: principalNotes || 'Penilaian pemetaan pola pikir pembelajaran mendalam',
      recommendations: recommendations || [
        'Terus tingkatkan kolaborasi dan refleksi pembelajaran.',
        'Ikuti forum KKG/Komunitas Belajar untuk pengayaan strategi belajar aktif.'
      ]
    };

    // Update existing or push
    const existingIndex = db.mindsetAssessments.findIndex((m) => m.teacherId === teacherId);
    if (existingIndex !== -1) {
      db.mindsetAssessments[existingIndex] = newAssessment;
    } else {
      db.mindsetAssessments.push(newAssessment);
    }

    if (teacher) {
      teacher.mindsetCategory = category;
    }

    db.addAuditLog(
      evaluatedById || 'u-ks-1',
      evaluatedByName || 'Kepala Sekolah',
      'KEPALA_SEKOLAH',
      'Penilaian Pola Pikir Guru',
      `Menyelesaikan instrumen pola pikir untuk ${teacher?.name} (Hasil: ${category} - ${percentage}%)`,
      req.ip || '127.0.0.1'
    );

    if (teacher) {
      db.addNotification(
        teacher.userId,
        'Hasil Pemetaan Pola Pikir',
        `Kepala Sekolah telah menyelesaikan pemetaan pola pikir Anda: Kategori "${category}" (${percentage}%).`,
        'info',
        '/hasil-penilaian'
      );
    }

    res.status(201).json(newAssessment);
  });

  // ==========================================
  // 9. IMPLEMENTASI PEMBELAJARAN MENDALAM (PM)
  // ==========================================
  app.get('/api/deep-learning/aspects', (req: Request, res: Response) => {
    res.json(db.deepLearningAspects);
  });

  app.get('/api/deep-learning/assessments', (req: Request, res: Response) => {
    const { teacherId, schoolId } = req.query;
    let list = db.deepLearningAssessments;
    if (teacherId) list = list.filter((d) => d.teacherId === teacherId);
    if (schoolId) list = list.filter((d) => d.schoolId === schoolId);
    res.json(list);
  });

  app.post('/api/deep-learning/assessments', (req: Request, res: Response) => {
    const { teacherId, evaluatedById, evaluatedByName, aspectScores, notes } = req.body;
    const teacher = db.teachers.find((t) => t.id === teacherId);
    const activeYear = db.educationYears.find((y) => y.isActive) || db.educationYears[0];

    const avgScore = Math.round(
      aspectScores.reduce((sum: number, a: any) => sum + Number(a.averageScore || 0), 0) /
        (aspectScores.length || 1)
    );

    let level: 'Mulai Terlihat' | 'Berkembang' | 'Cakap' | 'Mahir';
    if (avgScore >= 85) level = 'Mahir';
    else if (avgScore >= 70) level = 'Cakap';
    else if (avgScore >= 55) level = 'Berkembang';
    else level = 'Mulai Terlihat';

    const newAssessment = {
      id: `dla-${Date.now()}`,
      educationYearId: activeYear.id,
      teacherId: teacher?.id || teacherId,
      teacherName: teacher?.name || '-',
      schoolId: teacher?.schoolId || 'sch-1',
      subject: teacher?.subject || 'IPAS',
      evaluatedById: evaluatedById || 'u-ks-1',
      evaluatedByName: evaluatedByName || 'Kepala Sekolah',
      aspectScores,
      overallScore: avgScore,
      overallLevel: level,
      notes: notes || 'Implementasi Pembelajaran Mendalam (PM)',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 10)
    };

    const existingIndex = db.deepLearningAssessments.findIndex((d) => d.teacherId === teacherId);
    if (existingIndex !== -1) {
      db.deepLearningAssessments[existingIndex] = newAssessment;
    } else {
      db.deepLearningAssessments.push(newAssessment);
    }

    db.addAuditLog(
      evaluatedById || 'u-ks-1',
      evaluatedByName || 'Kepala Sekolah',
      'KEPALA_SEKOLAH',
      'Evaluasi Pembelajaran Mendalam',
      `Penilaian 10 aspek PM untuk ${teacher?.name} (Skor: ${avgScore}, Kategori: ${level})`,
      req.ip || '127.0.0.1'
    );

    res.status(201).json(newAssessment);
  });

  // ==========================================
  // 10. PENGAJUAN & PERSETUJUAN JADWAL SUPERVISI
  // ==========================================
  app.get('/api/supervision-requests', (req: Request, res: Response) => {
    const { schoolId, supervisorId, status, teacherId } = req.query;
    let list = db.supervisionRequests;
    if (schoolId) list = list.filter((s) => s.schoolId === schoolId);
    if (supervisorId) list = list.filter((s) => s.supervisorId === supervisorId);
    if (status) list = list.filter((s) => s.status === status);
    if (teacherId) list = list.filter((s) => s.teacherId === teacherId);
    res.json(list);
  });

  app.post('/api/supervision-requests', (req: Request, res: Response) => {
    const {
      teacherId,
      subject,
      gradeClass,
      supervisionType,
      proposedDate1,
      proposedTime1,
      proposedDate2,
      proposedTime2,
      location,
      notes,
      supportingDocName,
      createdById,
      createdByName
    } = req.body;

    const teacher = db.teachers.find((t) => t.id === teacherId);
    const school = db.schools.find((s) => s.id === teacher?.schoolId);
    const supervisor = db.supervisors.find((sp) => sp.id === school?.supervisorId) || db.supervisors[0];
    const activeYear = db.educationYears.find((y) => y.isActive) || db.educationYears[0];

    const newRequest = {
      id: `sup-${Date.now()}`,
      educationYearId: activeYear.id,
      educationYearName: `${activeYear.name} (${activeYear.semester})`,
      schoolId: school?.id || 'sch-1',
      schoolName: school?.name || 'SD Negeri Tinap 3',
      teacherId: teacher?.id || 't-1',
      teacherName: teacher?.name || 'Guru',
      subject: subject || teacher?.subject || 'IPAS',
      gradeClass: gradeClass || 'Kelas 4',
      supervisionType: supervisionType || 'Supervisi Tematik Pembelajaran Mendalam',
      proposedDate1,
      proposedTime1: proposedTime1 || '08:00 - 09:30',
      proposedDate2,
      proposedTime2,
      location: location || `Ruang Kelas ${school?.name}`,
      notes,
      supportingDocName,
      status: 'DIAJUKAN' as const,
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      createdById: createdById || 'u-ks-1',
      createdByName: createdByName || 'Kepala Sekolah',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    db.supervisionRequests.unshift(newRequest);

    if (teacher) {
      teacher.supervisionStatus = 'DIAJUKAN';
    }

    db.addAuditLog(
      createdById || 'u-ks-1',
      createdByName || 'Kepala Sekolah',
      'KEPALA_SEKOLAH',
      'Pengajuan Jadwal Supervisi',
      `Mengajukan supervisi untuk ${newRequest.teacherName} pada ${proposedDate1} ke Pengawas ${supervisor.name}`,
      req.ip || '127.0.0.1'
    );

    // Notify Supervisor
    db.addNotification(
      supervisor.userId,
      'Pengajuan Jadwal Supervisi Masuk',
      `${school?.name} mengajukan jadwal supervisi untuk ${newRequest.teacherName} (${newRequest.subject}). Mohon diperiksa.`,
      'warning',
      '/persetujuan-supervisi'
    );

    res.status(201).json(newRequest);
  });

  app.put('/api/supervision-requests/:id/review', (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, approvedDate, approvedTime, supervisorNotes, rejectionReason, reviewerName, reviewerId } = req.body;
    // action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION'

    const reqItem = db.supervisionRequests.find((s) => s.id === id);
    if (!reqItem) return res.status(404).json({ error: 'Pengajuan supervisi tidak ditemukan' });

    const teacher = db.teachers.find((t) => t.id === reqItem.teacherId);
    const principal = db.principals.find((p) => p.schoolId === reqItem.schoolId);

    if (action === 'APPROVE') {
      reqItem.status = 'DISETUJUI';
      reqItem.approvedDate = approvedDate || reqItem.proposedDate1;
      reqItem.approvedTime = approvedTime || reqItem.proposedTime1;
      reqItem.supervisorNotes = supervisorNotes || 'Jadwal supervisi disetujui';
      reqItem.reviewedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
      reqItem.reportedToDinasAt = reqItem.reviewedAt;

      if (teacher) teacher.supervisionStatus = 'DISETUJUI';

      // Notify Teacher, Principal, Dinas
      if (teacher) {
        db.addNotification(
          teacher.userId,
          'Jadwal Supervisi Disetujui',
          `Jadwal supervisi Anda telah disetujui untuk tanggal ${reqItem.approvedDate} (${reqItem.approvedTime}) oleh ${reviewerName}.`,
          'success',
          '/jadwal-supervisi'
        );
      }
      if (principal) {
        db.addNotification(
          principal.userId,
          'Supervisi Disetujui Pengawas',
          `Pengawas ${reviewerName} menyetujui jadwal supervisi ${reqItem.teacherName} pada ${reqItem.approvedDate}.`,
          'success',
          '/kalender-supervisi'
        );
      }
      // Notify Dinas
      db.addNotification(
        'u-dinas',
        'Jadwal Supervisi Baru Masuk ke Dinas',
        `Jadwal supervisi ${reqItem.schoolName} (${reqItem.teacherName}) telah disetujui untuk ${reqItem.approvedDate}.`,
        'info',
        '/kalender-dinas'
      );
    } else if (action === 'REJECT') {
      reqItem.status = 'DITOLAK';
      reqItem.rejectionReason = rejectionReason || 'Pengajuan ditolak';
      reqItem.reviewedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

      if (teacher) teacher.supervisionStatus = 'DITOLAK';

      if (principal) {
        db.addNotification(
          principal.userId,
          'Pengajuan Supervisi Ditolak',
          `Pengajuan supervisi untuk ${reqItem.teacherName} ditolak. Alasan: ${rejectionReason}`,
          'error',
          '/pengajuan-supervisi'
        );
      }
    } else if (action === 'REQUEST_REVISION') {
      reqItem.status = 'PERLU_REVISI';
      reqItem.rejectionReason = rejectionReason || 'Perlu penyesuaian jadwal atau dokumen modul';
      reqItem.reviewedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

      if (teacher) teacher.supervisionStatus = 'PERLU_REVISI';

      if (principal) {
        db.addNotification(
          principal.userId,
          'Permintaan Revisi Jadwal Supervisi',
          `Pengawas meminta revisi jadwal supervisi ${reqItem.teacherName}: ${rejectionReason}`,
          'warning',
          '/pengajuan-supervisi'
        );
      }
    }

    db.addAuditLog(
      reviewerId || 'u-pengawas-1',
      reviewerName || 'Pengawas',
      'PENGAWAS',
      `Review Pengajuan Supervisi (${reqItem.status})`,
      `Pengawas memproses supervisi ${reqItem.teacherName} di ${reqItem.schoolName}: Status ${reqItem.status}`,
      req.ip || '127.0.0.1'
    );

    res.json(reqItem);
  });

  app.put('/api/supervision-requests/:id/complete', (req: Request, res: Response) => {
    const { id } = req.params;
    const { completionScore, completionNotes, supervisorName, supervisorId } = req.body;
    const reqItem = db.supervisionRequests.find((s) => s.id === id);
    if (!reqItem) return res.status(404).json({ error: 'Data supervisi tidak ditemukan' });

    reqItem.isCompleted = true;
    reqItem.completionScore = Number(completionScore) || 90;
    reqItem.completionNotes = completionNotes || 'Pelaksanaan supervisi tatap muka telah selesai dilaksanakan.';

    const teacher = db.teachers.find((t) => t.id === reqItem.teacherId);
    if (teacher) {
      teacher.supervisionStatus = 'SELESAI';
    }

    db.addAuditLog(
      supervisorId || 'u-pengawas-1',
      supervisorName || 'Pengawas',
      'PENGAWAS',
      'Selesai Pelaksanaan Supervisi',
      `Supervisi selesai untuk ${reqItem.teacherName} dengan skor evaluasi ${reqItem.completionScore}`,
      req.ip || '127.0.0.1'
    );

    if (teacher) {
      db.addNotification(
        teacher.userId,
        'Hasil Pelaksanaan Supervisi Selesai',
        `Pelaksanaan supervisi Anda telah selesai dinilai dengan skor ${reqItem.completionScore}. Catatan: ${completionNotes}`,
        'success',
        '/hasil-penilaian'
      );
    }

    res.json(reqItem);
  });

  // ==========================================
  // 11. DASHBOARD ANALYTICS & STATS
  // ==========================================
  app.get('/api/dashboard/stats', (req: Request, res: Response) => {
    const { role, schoolId, educationYearId, supervisorId } = req.query;

    let targetTeachers = db.teachers.filter((t) => t.status === 'active');
    let targetSchools = db.schools.filter((s) => s.status === 'active');
    let targetSupervisions = db.supervisionRequests;
    let targetModules = db.modules;

    if (schoolId) {
      targetTeachers = targetTeachers.filter((t) => t.schoolId === schoolId);
      targetSchools = targetSchools.filter((s) => s.id === schoolId);
      targetSupervisions = targetSupervisions.filter((s) => s.schoolId === schoolId);
      targetModules = targetModules.filter((m) => m.schoolId === schoolId);
    } else if (supervisorId) {
      const supervisor = db.supervisors.find((sp) => sp.id === supervisorId || sp.userId === supervisorId);
      const assigned = supervisor?.assignedSchoolIds || [];
      targetSchools = targetSchools.filter((s) => assigned.includes(s.id));
      targetTeachers = targetTeachers.filter((t) => assigned.includes(t.schoolId));
      targetSupervisions = targetSupervisions.filter((s) => assigned.includes(s.schoolId));
      targetModules = targetModules.filter((m) => assigned.includes(m.schoolId));
    }

    // Calculations
    const totalSchools = targetSchools.length;
    const totalSupervisors = db.supervisors.filter((s) => s.status === 'active').length;
    const totalPrincipals = db.principals.filter((p) => p.status === 'active').length;
    const totalTeachers = targetTeachers.length;

    // Module stats
    const uploadedModules = targetTeachers.filter(
      (t) => t.moduleStatus && ['DIUPLOAD', 'DIPERIKSA', 'DISETUJUI', 'PERLU_REVISI'].includes(t.moduleStatus)
    ).length;
    const approvedModules = targetTeachers.filter((t) => t.moduleStatus === 'DISETUJUI').length;
    const pendingModules = totalTeachers - uploadedModules;

    // Admin completeness stats
    const adminComplete = targetTeachers.filter((t) => (t.adminCompletion || 0) >= 80).length;
    const adminIncomplete = totalTeachers - adminComplete;

    // Supervision status
    const supApproved = targetSupervisions.filter((s) => s.status === 'DISETUJUI').length;
    const supCompleted = targetSupervisions.filter((s) => s.isCompleted).length;
    const supPending = targetSupervisions.filter((s) => s.status === 'DIAJUKAN').length;
    const supRevision = targetSupervisions.filter((s) => s.status === 'PERLU_REVISI').length;

    // Mindset distribution
    const mindsetBerkembang = targetTeachers.filter(
      (t) => t.mindsetCategory === 'Pola Pikir Berkembang'
    ).length;
    const mindsetPendampingan = targetTeachers.filter(
      (t) => t.mindsetCategory === 'Pola Pikir Berkembang dengan Pendampingan'
    ).length;
    const mindsetPenguatan = targetTeachers.filter(
      (t) => t.mindsetCategory === 'Pola Pikir Perlu Penguatan'
    ).length;
    const mindsetBelum = totalTeachers - (mindsetBerkembang + mindsetPendampingan + mindsetPenguatan);

    // Deep Learning average across 10 aspects
    const dlAssessments = db.deepLearningAssessments;
    const dlAspects = db.deepLearningAspects.map((aspect) => {
      const allScoresForAspect: number[] = [];
      dlAssessments.forEach((dla) => {
        const found = dla.aspectScores.find((sc) => sc.aspectId === aspect.id);
        if (found) allScoresForAspect.push(found.averageScore);
      });
      const avg =
        allScoresForAspect.length > 0
          ? Math.round(allScoresForAspect.reduce((a, b) => a + b, 0) / allScoresForAspect.length)
          : 85;
      return {
        id: aspect.id,
        name: aspect.name.split('(')[0].trim(),
        score: avg
      };
    });

    // School breakdown
    const schoolBreakdown = targetSchools.map((sch) => {
      const schTeachers = db.teachers.filter((t) => t.schoolId === sch.id && t.status === 'active');
      const schModulesApproved = schTeachers.filter((t) => t.moduleStatus === 'DISETUJUI').length;
      const schAdminAvg =
        schTeachers.length > 0
          ? Math.round(
              schTeachers.reduce((sum, t) => sum + (t.adminCompletion || 0), 0) / schTeachers.length
            )
          : 0;
      const schSupDone = db.supervisionRequests.filter(
        (s) => s.schoolId === sch.id && (s.status === 'DISETUJUI' || s.isCompleted)
      ).length;

      return {
        id: sch.id,
        name: sch.name,
        level: sch.level,
        principal: sch.principalName,
        supervisor: sch.supervisorName,
        teacherCount: schTeachers.length,
        modulesApproved: schModulesApproved,
        adminAverage: schAdminAvg,
        supervisionCount: schSupDone
      };
    });

    res.json({
      totalSchools,
      totalSupervisors,
      totalPrincipals,
      totalTeachers,
      uploadedModules,
      approvedModules,
      pendingModules,
      adminComplete,
      adminIncomplete,
      supervisionStats: {
        total: targetSupervisions.length,
        approved: supApproved,
        completed: supCompleted,
        pending: supPending,
        revision: supRevision
      },
      mindsetDistribution: {
        berkembang: mindsetBerkembang,
        pendampingan: mindsetPendampingan,
        penguatan: mindsetPenguatan,
        belumDipetakan: Math.max(0, mindsetBelum)
      },
      deepLearningAspects: dlAspects,
      schoolBreakdown
    });
  });

  // ==========================================
  // 11.B TEACHER PERFORMANCE & PROGRESS TRENDS
  // ==========================================
  const generateTeacherTrends = (teacher: any) => {
    // Deterministic seed based on teacher id characters
    const charCodeSum = (teacher.id || 't-1').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
    const baseOffset = (charCodeSum % 14) - 7; // -7 to +6

    const currentAdminComp = teacher.adminCompletion || 90;
    const isApprovedMod = teacher.moduleStatus === 'DISETUJUI';
    const isGoodMindset = teacher.mindsetCategory === 'Pola Pikir Berkembang';

    // Base current period scores (2026/2027 Ganjil)
    const curPerangkat = Math.min(98, Math.max(68, currentAdminComp + (isApprovedMod ? 4 : -2)));
    const curSupervisi = Math.min(99, Math.max(70, 88 + baseOffset + (isGoodMindset ? 4 : -2)));
    const curDeepLearning = Math.min(96, Math.max(68, 86 + baseOffset));
    const curMindset = isGoodMindset ? 92 : teacher.mindsetCategory?.includes('Pendampingan') ? 80 : 72;

    const periodsDef = [
      { id: 'ey-2024-ganjil', name: '2024/2025', semester: 'Ganjil' as const, label: 'Ganjil 2024/2025', factor: -7.5 },
      { id: 'ey-2024-genap', name: '2024/2025', semester: 'Genap' as const, label: 'Genap 2024/2025', factor: -5.0 },
      { id: 'ey-2025-ganjil', name: '2025/2026', semester: 'Ganjil' as const, label: 'Ganjil 2025/2026', factor: -3.2 },
      { id: 'ey-2025-genap', name: '2025/2026', semester: 'Genap' as const, label: 'Genap 2025/2026', factor: -1.5 },
      { id: 'ey-2026-ganjil', name: '2026/2027', semester: 'Ganjil' as const, label: 'Ganjil 2026/2027 (Aktif)', factor: 0.0, isCurrent: true }
    ];

    let prevOverall = 0;
    const historyPeriods = periodsDef.map((p, idx) => {
      const pSupervisi = Math.min(100, Math.max(60, Math.round((curSupervisi + p.factor * 1.1 + ((idx % 2 === 0 ? 0.5 : -0.3))) * 10) / 10));
      const pPerangkat = Math.min(100, Math.max(60, Math.round((curPerangkat + p.factor * 0.95 + ((idx % 3 === 0 ? -0.4 : 0.6))) * 10) / 10));
      const pDeepLearning = Math.min(100, Math.max(60, Math.round((curDeepLearning + p.factor * 1.05) * 10) / 10));
      const pMindset = Math.min(100, Math.max(60, Math.round((curMindset + p.factor * 0.8) * 10) / 10));

      const overall = Math.round(((pSupervisi * 0.35) + (pPerangkat * 0.35) + (pDeepLearning * 0.2) + (pMindset * 0.1)) * 10) / 10;

      let deltaScore = 0;
      let deltaPercentage = 0;
      let trend: 'PENINGKATAN' | 'STABIL' | 'PENURUNAN' = 'STABIL';

      if (idx > 0 && prevOverall > 0) {
        deltaScore = Math.round((overall - prevOverall) * 10) / 10;
        deltaPercentage = Math.round(((deltaScore / prevOverall) * 100) * 10) / 10;
        if (deltaScore > 0.3) trend = 'PENINGKATAN';
        else if (deltaScore < -0.3) trend = 'PENURUNAN';
        else trend = 'STABIL';
      }

      prevOverall = overall;

      const predicate =
        overall >= 90 ? 'Amat Baik' : overall >= 80 ? 'Baik' : overall >= 70 ? 'Cukup' : 'Perlu Bimbingan';

      return {
        periodId: p.id,
        periodName: p.name,
        semester: p.semester,
        periodLabel: p.label,
        isCurrentPeriod: !!p.isCurrent,
        supervisionScore: pSupervisi,
        perangkatScore: pPerangkat,
        deepLearningScore: pDeepLearning,
        mindsetScore: pMindset,
        overallScore: overall,
        predicate,
        trend,
        deltaScore,
        deltaPercentage,
        evaluatedDate: p.isCurrent ? '2026-08-18' : idx === 3 ? '2026-01-20' : idx === 2 ? '2025-08-22' : idx === 1 ? '2025-01-15' : '2024-08-19',
        evaluatorName: 'Drs. Bambang Hidayat, M.Pd.',
        evaluatorRole: 'Pengawas Pembina Dinas',
        supervisionAspects: {
          perencanaan: Math.min(100, Math.round((pSupervisi + 1.2) * 10) / 10),
          pelaksanaan: Math.min(100, Math.round((pSupervisi - 0.8) * 10) / 10),
          asesmen: Math.min(100, Math.round((pSupervisi + 0.5) * 10) / 10),
          manajemenKelas: Math.min(100, Math.round((pSupervisi + 1.0) * 10) / 10)
        },
        perangkatAspects: {
          modulAjar: Math.min(100, Math.round((pPerangkat + 1.5) * 10) / 10),
          dokumenAdministrasi: Math.min(100, Math.round((pPerangkat - 0.5) * 10) / 10),
          kktpDanAsesmen: Math.min(100, Math.round((pPerangkat - 1.0) * 10) / 10),
          programTahunanSemester: Math.min(100, Math.round((pPerangkat + 0.8) * 10) / 10)
        },
        catatanPembinaan:
          overall >= 90
            ? `Penyampaian materi dan diferensiasi pembelajaran sangat kontekstual. Keterlibatan peserta didik aktif dan mandiri. Rekomendasi dipertahankan dan ditularkan dalam KKG.`
            : overall >= 80
            ? `Pembelajaran berjalan baik dan perangkat lengkap. Disarankan penguatan pada teknik asesmen formatif berkelanjutan dan variasi ice breaking.`
            : `Perlu pendampingan lebih intensif dalam penyusunan rubrik asesmen autentik dan pemanfaatan media digital interaktif.`,
        rekomendasi: [
          'Penguatan penerapan 10 Prinsip Pembelajaran Mendalam (Deep Learning)',
          'Optimalisasi Asesmen Berdiferensiasi dan Portofolio Digital Siswa',
          'Peningkatan keterlibatan aktif dalam Komunitas Belajar (Kombel) Guru'
        ],
        moduleUploadCount: idx + 2,
        adminDocumentCount: Math.min(16, 12 + idx)
      };
    });

    const currentPeriod = historyPeriods[historyPeriods.length - 1];
    const prevPeriod = historyPeriods[historyPeriods.length - 2];

    const currentScore = currentPeriod.overallScore;
    const previousScore = prevPeriod.overallScore;
    const overallDelta = Math.round((currentScore - previousScore) * 10) / 10;
    const overallDeltaPercentage = Math.round(((overallDelta / previousScore) * 100) * 10) / 10;
    const overallTrend: 'PENINGKATAN' | 'STABIL' | 'PENURUNAN' =
      overallDelta > 0.3 ? 'PENINGKATAN' : overallDelta < -0.3 ? 'PENURUNAN' : 'STABIL';

    const competencyRadar = [
      { dimension: 'Perencanaan Modul & ATP', score: currentPeriod.perangkatAspects.modulAjar, target: 95, fullMark: 100 },
      { dimension: 'Supervisi & Observasi Kelas', score: currentPeriod.supervisionAspects.pelaksanaan, target: 95, fullMark: 100 },
      { dimension: 'Pembelajaran Mendalam (PM)', score: currentPeriod.deepLearningScore, target: 90, fullMark: 100 },
      { dimension: 'Asesmen & Evaluasi Hasil', score: currentPeriod.supervisionAspects.asesmen, target: 90, fullMark: 100 },
      { dimension: 'Administrasi Pembelajaran', score: currentPeriod.perangkatAspects.dokumenAdministrasi, target: 95, fullMark: 100 },
      { dimension: 'Pola Pikir & Refleksi Guru', score: currentPeriod.mindsetScore, target: 90, fullMark: 100 }
    ];

    const strengthHighlights = [
      `Kelengkapan modul ajar dan Alur Tujuan Pembelajaran (ATP) mencapai skor ${currentPeriod.perangkatAspects.modulAjar}`,
      `Suasana kelas menyenangkan (Joyful Learning) dan manajemen waktu terkelola dengan baik`,
      `Konsistensi tindak lanjut hasil supervisi periode sebelumnya menunjukkan kenaikan positif`
    ];

    const improvementAreas = [
      'Pemanfaatan instrumen asesmen diagnostik awal non-kognitif untuk pemetaan profil belajar siswa',
      'Pengayaan materi berbasis studi kasus nyata di lingkungan sekitar Kab. Magetan'
    ];

    const summaryRecommendations = [
      'Mengikuti program pengimbasan praktik baik guru inspiratif di tingkat Korwil/Dinas',
      'Mempertahankan tren peningkatan kualitas proses supervisi akademik secara berkelanjutan'
    ];

    return {
      teacher,
      currentScore,
      previousScore,
      overallDelta,
      overallDeltaPercentage,
      overallTrend,
      currentPredicate: currentPeriod.predicate,
      historyPeriods,
      competencyRadar,
      strengthHighlights,
      improvementAreas,
      summaryRecommendations
    };
  };

  app.get('/api/teacher-performance-trends', (req: Request, res: Response) => {
    const { schoolId, supervisorId } = req.query;
    let list = db.teachers.filter((t) => t.status === 'active');
    if (schoolId) {
      list = list.filter((t) => t.schoolId === schoolId);
    }
    if (supervisorId) {
      const supervisor = db.supervisors.find((sp) => sp.id === supervisorId || sp.userId === supervisorId);
      if (supervisor?.assignedSchoolIds) {
        list = list.filter((t) => supervisor.assignedSchoolIds.includes(t.schoolId));
      }
    }

    const result = list.map((teacher) => generateTeacherTrends(teacher));
    res.json(result);
  });

  app.get('/api/teacher-performance-trends/:teacherId', (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const teacher = db.teachers.find((t) => t.id === teacherId || t.userId === teacherId || t.nip === teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Data guru tidak ditemukan' });
    }
    const result = generateTeacherTrends(teacher);
    res.json(result);
  });

  // ==========================================
  // 12. NOTIFICATIONS & AUDIT LOGS
  // ==========================================
  app.get('/api/notifications', (req: Request, res: Response) => {
    const { userId } = req.query;
    let list = db.notifications;
    if (userId) {
      list = list.filter((n) => n.userId === userId);
    }
    res.json(list);
  });

  app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
    const { id } = req.params;
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
    res.json({ success: true });
  });

  app.post('/api/notifications/mark-all-read', (req: Request, res: Response) => {
    const { userId } = req.body;
    db.notifications.forEach((n) => {
      if (!userId || n.userId === userId) {
        n.isRead = true;
      }
    });
    res.json({ success: true });
  });

  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const { limit, role } = req.query;
    let list = db.auditLogs;
    if (role) {
      list = list.filter((log) => log.userRole === role);
    }
    const max = Number(limit) || 100;
    res.json(list.slice(0, max));
  });

  // ==========================================
  // 12. PENGATURAN APLIKASI & PROFIL ADMIN DINAS
  // ==========================================
  app.get('/api/app-settings', (req: Request, res: Response) => {
    res.json(db.appSettings);
  });

  app.put('/api/app-settings', (req: Request, res: Response) => {
    const {
      appName,
      appShortName,
      agencyName,
      appSubtitle,
      tagline,
      description,
      logoType,
      logoPreset,
      logoUrl,
      primaryColor,
      templatePreset,
      sidebarStyle,
      cardRadius,
      density,
      fontFamily,
      navbarStyle,
      bgPattern,
      enableAnnouncement,
      announcementText,
      announcementType,
      footerText,
      contactEmail,
      contactPhone,
      adminName,
      adminId
    } = req.body;

    db.appSettings = {
      ...db.appSettings,
      appName: appName ?? db.appSettings.appName,
      appShortName: appShortName ?? db.appSettings.appShortName,
      agencyName: agencyName ?? db.appSettings.agencyName,
      appSubtitle: appSubtitle ?? db.appSettings.appSubtitle,
      tagline: tagline ?? db.appSettings.tagline,
      description: description ?? db.appSettings.description,
      logoType: logoType ?? db.appSettings.logoType,
      logoPreset: logoPreset ?? db.appSettings.logoPreset,
      logoUrl: logoUrl !== undefined ? logoUrl : db.appSettings.logoUrl,
      primaryColor: primaryColor ?? db.appSettings.primaryColor,
      templatePreset: templatePreset ?? db.appSettings.templatePreset,
      sidebarStyle: sidebarStyle ?? db.appSettings.sidebarStyle,
      cardRadius: cardRadius ?? db.appSettings.cardRadius,
      density: density ?? db.appSettings.density,
      fontFamily: fontFamily ?? db.appSettings.fontFamily,
      navbarStyle: navbarStyle ?? db.appSettings.navbarStyle,
      bgPattern: bgPattern ?? db.appSettings.bgPattern,
      enableAnnouncement: enableAnnouncement !== undefined ? enableAnnouncement : db.appSettings.enableAnnouncement,
      announcementText: announcementText !== undefined ? announcementText : db.appSettings.announcementText,
      announcementType: announcementType ?? db.appSettings.announcementType,
      footerText: footerText ?? db.appSettings.footerText,
      contactEmail: contactEmail ?? db.appSettings.contactEmail,
      contactPhone: contactPhone ?? db.appSettings.contactPhone,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedBy: adminName || 'Admin Dinas'
    };

    db.addAuditLog(
      adminId || 'u-dinas',
      adminName || 'Admin Dinas',
      'ADMIN_DINAS',
      'Update Tampilan & Template Aplikasi',
      `Memperbarui tampilan visual (Template: ${db.appSettings.templatePreset || 'kustom'}, Tema Warna: ${db.appSettings.primaryColor}, Sidebar: ${db.appSettings.sidebarStyle}) untuk seluruh akun pengguna`,
      req.ip || '127.0.0.1'
    );

    res.json(db.appSettings);
  });

  app.get('/api/admin/profile', (req: Request, res: Response) => {
    const adminUser = db.users.find((u) => u.role === 'ADMIN_DINAS') || db.users[0];
    res.json(adminUser);
  });

  app.put('/api/admin/profile', (req: Request, res: Response) => {
    const { id, name, nip, email, phone, position, avatarUrl, newPassword } = req.body;
    const adminUser = db.users.find((u) => u.id === (id || 'u-dinas') || u.role === 'ADMIN_DINAS');
    if (!adminUser) return res.status(404).json({ error: 'User admin tidak ditemukan' });

    if (name) adminUser.name = name;
    if (nip) adminUser.nip = nip;
    if (email) adminUser.email = email;
    if (phone) adminUser.phone = phone;
    if (position) adminUser.position = position;
    if (avatarUrl !== undefined) adminUser.avatarUrl = avatarUrl;

    db.addAuditLog(
      adminUser.id,
      adminUser.name,
      'ADMIN_DINAS',
      'Update Profil Admin Dinas',
      `Admin Dinas memperbarui data profil personal dan kontak (NIP: ${adminUser.nip})`,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, user: adminUser });
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'User tidak ditemukan' });

    db.users[index] = {
      ...db.users[index],
      ...req.body
    };

    db.addAuditLog(
      req.body.adminId || id,
      req.body.adminName || db.users[index].name,
      db.users[index].role,
      'Update Profil Pengguna',
      `Memperbarui profil pengguna ${db.users[index].name}`,
      req.ip || '127.0.0.1'
    );

    res.json(db.users[index]);
  });

  // Reset database to initial seed
  app.post('/api/seed/reset', (req: Request, res: Response) => {
    db.seedInitialData();
    res.json({ success: true, message: 'Database reset to initial demo state' });
  });

  // ==========================================
  // VITE MIDDLEWARE & STATIC SERVING SETUP
  // ==========================================
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (typeof __filename !== 'undefined' && __filename.includes('server.cjs')) ||
    (process.argv[1] && process.argv[1].includes('server.cjs'));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Resolve static dist path cleanly across environments
    const candidatePaths = [
      path.resolve(process.cwd(), 'dist'),
      typeof __dirname !== 'undefined' ? path.resolve(__dirname) : '',
      typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../dist') : ''
    ].filter(Boolean);

    const distPath = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html'))) || path.resolve(process.cwd(), 'dist');

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SI-SUPERVISI PM Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
