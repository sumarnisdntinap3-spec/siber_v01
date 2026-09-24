export const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'polar-drive-c6rpq';

export const FIREBASE_DATABASE_ID =
  process.env.FIREBASE_FIRESTORE_DATABASE_ID ||
  process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  'ai-studio-sibersupervisiin-e85c9c5d-7154-4dfc-b7cd-825c1e32ea17';

export const FIREBASE_API_KEY =
  process.env.FIREBASE_API_KEY ||
  process.env.VITE_FIREBASE_API_KEY ||
  'AIzaSyAp4R41XoGv7BynqHeWT67c8M_ULHs_Sy4';

const BASE_FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents`;

/**
 * Converts standard JS object to Firestore REST API field map
 */
export function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  if (!obj || typeof obj !== 'object') return fields;

  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined || val === null) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: val.toString() };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((item) => {
            if (typeof item === 'string') return { stringValue: item };
            if (typeof item === 'number') {
              return Number.isInteger(item) ? { integerValue: item.toString() } : { doubleValue: item };
            }
            if (typeof item === 'boolean') return { booleanValue: item };
            if (typeof item === 'object' && item !== null) return { mapValue: { fields: toFirestoreFields(item) } };
            return { stringValue: String(item) };
          })
        }
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    } else {
      fields[key] = { stringValue: String(val) };
    }
  }

  return fields;
}

/**
 * Converts Firestore REST Document to JS object
 */
export function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (!fields || typeof fields !== 'object') return result;

  for (const [k, v] of Object.entries(fields)) {
    if ('stringValue' in v) result[k] = v.stringValue;
    else if ('integerValue' in v) result[k] = parseInt(v.integerValue, 10);
    else if ('doubleValue' in v) result[k] = parseFloat(v.doubleValue);
    else if ('booleanValue' in v) result[k] = v.booleanValue;
    else if ('nullValue' in v) result[k] = null;
    else if ('arrayValue' in v) {
      result[k] = (v.arrayValue.values || []).map((item: any) => {
        if ('stringValue' in item) return item.stringValue;
        if ('integerValue' in item) return parseInt(item.integerValue, 10);
        if ('doubleValue' in item) return parseFloat(item.doubleValue);
        if ('booleanValue' in item) return item.booleanValue;
        if ('mapValue' in item) return fromFirestoreFields(item.mapValue.fields);
        return item;
      });
    } else if ('mapValue' in v) {
      result[k] = fromFirestoreFields(v.mapValue.fields);
    }
  }

  return result;
}

/**
 * Write a document to a Firestore collection
 */
export async function writeFirestoreDoc(
  collection: string,
  docId: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const cleanDocId = encodeURIComponent(String(docId).trim());
    const url = `${BASE_FIRESTORE_URL}/${collection}/${cleanDocId}?key=${FIREBASE_API_KEY}`;
    const payload = {
      fields: toFirestoreFields({
        ...data,
        updatedAt: new Date().toISOString()
      })
    };

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Firebase] Gagal simpan ${collection}/${docId}:`, res.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Firebase] Error writeFirestoreDoc ${collection}/${docId}:`, err);
    return false;
  }
}

/**
 * Delete a document from a Firestore collection
 */
export async function deleteFirestoreDoc(collection: string, docId: string): Promise<boolean> {
  try {
    const cleanDocId = encodeURIComponent(String(docId).trim());
    const url = `${BASE_FIRESTORE_URL}/${collection}/${cleanDocId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn(`[Firebase] Error deleteFirestoreDoc ${collection}/${docId}:`, err);
    return false;
  }
}

/**
 * List documents from a Firestore collection using runQuery
 */
export async function listFirestoreDocs(collection: string, pageSize = 100): Promise<any[]> {
  try {
    const url = `${BASE_FIRESTORE_URL}:runQuery?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collection }],
          limit: pageSize
        }
      })
    });
    if (!res.ok) {
      console.warn(`[Firebase] listFirestoreDocs ${collection} HTTP error:`, res.status);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const items: any[] = [];
    for (const entry of data) {
      if (!entry.document || !entry.document.fields) continue;
      const parts = (entry.document.name || '').split('/');
      const id = parts[parts.length - 1];
      items.push({
        id,
        ...fromFirestoreFields(entry.document.fields)
      });
    }
    return items;
  } catch (err) {
    console.warn(`[Firebase] Error listFirestoreDocs ${collection}:`, err);
    return [];
  }
}

/**
 * Check Firebase Firestore connectivity and health
 */
export async function checkFirebaseHealth(): Promise<{
  connected: boolean;
  projectId: string;
  databaseId: string;
  message: string;
  collections: Record<string, number>;
}> {
  try {
    // Write / read test connection document
    const testOk = await writeFirestoreDoc('test', 'connection', {
      status: 'active',
      testedAt: new Date().toISOString(),
      appName: 'SIBER-PM Magetan'
    });

    if (!testOk) {
      return {
        connected: false,
        projectId: FIREBASE_PROJECT_ID,
        databaseId: FIREBASE_DATABASE_ID,
        message: 'Koneksi ke Firebase Firestore gagal atau ditolak izin.',
        collections: {}
      };
    }

    // Probe collections count
    const [schools, teachers, supervisors, supervisions, reflectiveNotes] = await Promise.all([
      listFirestoreDocs('schools', 50).catch(() => []),
      listFirestoreDocs('teachers', 50).catch(() => []),
      listFirestoreDocs('supervisors', 50).catch(() => []),
      listFirestoreDocs('supervisions', 50).catch(() => []),
      listFirestoreDocs('reflectiveNotes', 50).catch(() => [])
    ]);

    return {
      connected: true,
      projectId: FIREBASE_PROJECT_ID,
      databaseId: FIREBASE_DATABASE_ID,
      message: 'Koneksi ke Cloud Firestore aktif dan operasional.',
      collections: {
        schools: schools.length,
        teachers: teachers.length,
        supervisors: supervisors.length,
        supervisions: supervisions.length,
        reflectiveNotes: reflectiveNotes.length
      }
    };
  } catch (err: any) {
    return {
      connected: false,
      projectId: FIREBASE_PROJECT_ID,
      databaseId: FIREBASE_DATABASE_ID,
      message: `Error koneksi Firebase: ${err.message}`,
      collections: {}
    };
  }
}

/**
 * Synchronize single school to Firestore
 */
export async function syncSchoolToFirebase(school: any): Promise<boolean> {
  if (!school || !school.id) return false;
  return writeFirestoreDoc('schools', school.id, {
    id: school.id,
    npsn: school.npsn || '',
    name: school.name || '',
    address: school.address || '',
    subDistrict: school.subDistrict || 'Sukomoro',
    city: school.city || 'Kabupaten Magetan',
    principalName: school.principalName || '',
    supervisorId: school.supervisorId || '',
    supervisorName: school.supervisorName || '',
    phone: school.phone || '',
    accreditation: school.accreditation || 'A',
    status: school.status || 'active',
    teacherCount: school.teacherCount || 0
  });
}

/**
 * Synchronize single teacher to Firestore
 */
export async function syncTeacherToFirebase(teacher: any, user?: any): Promise<boolean> {
  if (!teacher || !teacher.id) return false;
  return writeFirestoreDoc('teachers', teacher.id, {
    id: teacher.id,
    userId: teacher.userId || (user ? user.id : ''),
    nip: teacher.nip || '',
    name: teacher.name || '',
    schoolId: teacher.schoolId || '',
    schoolName: teacher.schoolName || '',
    employmentStatus: teacher.employmentStatus || 'PNS',
    rankGrade: teacher.rankGrade || '',
    position: teacher.position || 'Guru Kelas',
    subject: teacher.subject || 'Tematik / Guru Kelas',
    educationLevel: teacher.educationLevel || 'S1 PGSD',
    phone: teacher.phone || (user ? user.phone : ''),
    email: teacher.email || (user ? user.email : '')
  });
}

/**
 * Synchronize single supervisor to Firestore
 */
export async function syncSupervisorToFirebase(supervisor: any, user?: any): Promise<boolean> {
  if (!supervisor || !supervisor.id) return false;
  return writeFirestoreDoc('supervisors', supervisor.id, {
    id: supervisor.id,
    userId: supervisor.userId || (user ? user.id : ''),
    nip: supervisor.nip || '',
    name: supervisor.name || '',
    email: supervisor.email || (user ? user.email : ''),
    phone: supervisor.phone || (user ? user.phone : ''),
    rankGrade: supervisor.rankGrade || 'Pembina Tingkat I / IV/b',
    levels: supervisor.levels || ['SD'],
    wilayahKecamatan: supervisor.wilayahKecamatan || ['Sukomoro'],
    assignedSchoolIds: supervisor.assignedSchoolIds || [],
    assignedSchoolNames: supervisor.assignedSchoolNames || [],
    skNumber: supervisor.skNumber || '',
    skDate: supervisor.skDate || '',
    status: supervisor.status || 'active'
  });
}

/**
 * Synchronize single supervision request/evaluation to Firestore
 */
export async function syncSupervisionToFirebase(supervision: any): Promise<boolean> {
  if (!supervision || !supervision.id) return false;
  return writeFirestoreDoc('supervisions', supervision.id, {
    id: supervision.id,
    teacherId: supervision.teacherId || '',
    teacherName: supervision.teacherName || '',
    schoolId: supervision.schoolId || '',
    schoolName: supervision.schoolName || '',
    subject: supervision.subject || '',
    date: supervision.date || '',
    time: supervision.time || '',
    status: supervision.status || 'DIAJUKAN',
    supervisorId: supervision.supervisorId || '',
    supervisorName: supervision.supervisorName || '',
    finalScore: supervision.finalScore || 0,
    aspects: supervision.aspects || [],
    comments: supervision.comments || [],
    notes: supervision.notes || ''
  });
}

/**
 * Delete school from Firestore
 */
export async function deleteSchoolFromFirebase(schoolId: string): Promise<boolean> {
  return deleteFirestoreDoc('schools', schoolId);
}

/**
 * Delete teacher from Firestore
 */
export async function deleteTeacherFromFirebase(teacherId: string): Promise<boolean> {
  return deleteFirestoreDoc('teachers', teacherId);
}

/**
 * Delete supervisor from Firestore
 */
export async function deleteSupervisorFromFirebase(supervisorId: string): Promise<boolean> {
  return deleteFirestoreDoc('supervisors', supervisorId);
}

/**
 * Synchronize single reflective note to Firestore
 */
export async function syncReflectiveNoteToFirebase(note: any): Promise<boolean> {
  if (!note || !note.id) return false;
  return writeFirestoreDoc('reflectiveNotes', note.id, {
    id: note.id,
    supervisionId: note.supervisionId || '',
    teacherId: note.teacherId || '',
    teacherName: note.teacherName || '',
    teacherNip: note.teacherNip || '',
    teacherEmail: note.teacherEmail || '',
    schoolId: note.schoolId || '',
    schoolName: note.schoolName || '',
    supervisorId: note.supervisorId || '',
    supervisorName: note.supervisorName || '',
    subject: note.subject || '',
    grade: note.grade || '',
    topic: note.topic || '',
    supervisionDate: note.supervisionDate || '',
    reflectionDate: note.reflectionDate || new Date().toISOString().split('T')[0],
    whatWentWell: note.whatWentWell || '',
    challengesFaced: note.challengesFaced || '',
    studentResponse: note.studentResponse || '',
    actionPlanForNext: note.actionPlanForNext || '',
    satisfactionScore: Number(note.satisfactionScore) || 85,
    supportNeeded: note.supportNeeded || '',
    supervisorFeedback: note.supervisorFeedback || '',
    supervisorFeedbackDate: note.supervisorFeedbackDate || '',
    supervisorFeedbackBy: note.supervisorFeedbackBy || '',
    status: note.status || 'DIKIRIM',
    createdAt: note.createdAt || new Date().toISOString(),
    updatedAt: note.updatedAt || new Date().toISOString()
  });
}

/**
 * Delete reflective note from Firestore
 */
export async function deleteReflectiveNoteFromFirebase(noteId: string): Promise<boolean> {
  return deleteFirestoreDoc('reflectiveNotes', noteId);
}

