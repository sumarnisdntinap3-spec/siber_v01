import {
  User,
  EducationYear,
  School,
  Teacher,
  Principal,
  Supervisor,
  TeacherMutation,
  LearningModule,
  AdministrationItem,
  TeacherAdministrationRecord,
  TeacherAdministrationChecklist,
  MindsetInstrument,
  MindsetAssessment,
  TeacherMindsetAssessment,
  DeepLearningAspect,
  DeepLearningAssessment,
  SupervisionRequest,
  NotificationItem,
  AuditLog,
  AppSettings,
  TeacherPeriodTrend,
  TeacherPerformanceOverview
} from '../types';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        if (!res.ok) {
          throw new Error(`Permintaan gagal (${res.status}: ${res.statusText})`);
        }
        const text = await res.text();
        try {
          return JSON.parse(text) as T;
        } catch {
          return [] as unknown as T;
        }
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Permintaan gagal (${res.status})`);
      }
      return data;
    } catch (err: any) {
      attempt++;
      const isNetworkError =
        err?.name === 'TypeError' ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('network') ||
        err?.message?.includes('Load failed');

      if (isNetworkError && attempt <= maxRetries) {
        // Wait briefly before retrying
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
        continue;
      }

      if (isNetworkError) {
        throw new Error('Koneksi ke server terputus. Silakan periksa jaringan Anda atau coba sesaat lagi.');
      }
      throw err;
    }
  }

  throw new Error('Permintaan ke server gagal diproses.');
}


export const api = {
  // Demo Users & Auth
  async getDemoUsers(): Promise<User[]> {
    return request<User[]>(`${BASE_URL}/auth/demo-users`);
  },

  async login(identifier?: string, password?: string, role?: string, userId?: string): Promise<{ success: boolean; token: string; user: User }> {
    return request<{ success: boolean; token: string; user: User }>(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role, userId })
    });
  },

  async resetPassword(userId: string, adminName: string, adminId: string) {
    return request<any>(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, adminName, adminId })
    });
  },

  // Education Years
  async getEducationYears(): Promise<EducationYear[]> {
    return request<EducationYear[]>(`${BASE_URL}/education-years`);
  },

  async createEducationYear(data: Partial<EducationYear>): Promise<EducationYear> {
    return request<EducationYear>(`${BASE_URL}/education-years`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async activateEducationYear(id: string): Promise<EducationYear> {
    return request<EducationYear>(`${BASE_URL}/education-years/${id}/activate`, {
      method: 'PUT'
    });
  },

  // Schools
  async getSchools(): Promise<School[]> {
    return request<School[]>(`${BASE_URL}/schools`);
  },

  async getSchoolById(id: string): Promise<School> {
    return request<School>(`${BASE_URL}/schools/${id}`);
  },

  async createSchool(data: Partial<School>): Promise<School> {
    return request<School>(`${BASE_URL}/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async updateSchool(id: string, data: Partial<School>): Promise<School> {
    return request<School>(`${BASE_URL}/schools/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async deleteSchool(id: string): Promise<{ success: boolean; message: string; id: string }> {
    return request(`${BASE_URL}/schools/${id}`, {
      method: 'DELETE'
    });
  },

  async importSchoolsBatch(data: { items: Partial<School>[]; updateExisting?: boolean }): Promise<{
    success: boolean;
    total: number;
    added: number;
    updated: number;
    schools: School[];
  }> {
    return request(`${BASE_URL}/schools/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Teachers
  async getTeachers(schoolId?: string): Promise<Teacher[]> {
    const url = schoolId ? `${BASE_URL}/teachers?schoolId=${schoolId}` : `${BASE_URL}/teachers`;
    return request<Teacher[]>(url);
  },

  async createTeacher(data: Partial<Teacher>): Promise<Teacher> {
    return request<Teacher>(`${BASE_URL}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
    return request<Teacher>(`${BASE_URL}/teachers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async deleteTeacher(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE_URL}/teachers/${id}`, {
      method: 'DELETE'
    });
  },

  async importTeachersBatch(data: {
    items: Partial<Teacher>[];
    updateExisting?: boolean;
  }): Promise<{
    success: boolean;
    total: number;
    added: number;
    updated: number;
    teachers: Teacher[];
  }> {
    return request<{
      success: boolean;
      total: number;
      added: number;
      updated: number;
      teachers: Teacher[];
    }>(`${BASE_URL}/teachers/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Principals & Supervisors
  async getPrincipals(): Promise<Principal[]> {
    return request<Principal[]>(`${BASE_URL}/principals`);
  },

  async getSupervisors(): Promise<Supervisor[]> {
    return request<Supervisor[]>(`${BASE_URL}/supervisors`);
  },

  async getSupervisorById(id: string): Promise<Supervisor> {
    return request<Supervisor>(`${BASE_URL}/supervisors/${id}`);
  },

  async createSupervisor(data: Partial<Supervisor>): Promise<Supervisor> {
    return request<Supervisor>(`${BASE_URL}/supervisors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async updateSupervisor(id: string, data: Partial<Supervisor>): Promise<Supervisor> {
    return request<Supervisor>(`${BASE_URL}/supervisors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async deleteSupervisor(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE_URL}/supervisors/${id}`, {
      method: 'DELETE'
    });
  },

  // Mutations
  async getMutations(): Promise<TeacherMutation[]> {
    return request<TeacherMutation[]>(`${BASE_URL}/mutations`);
  },

  async createMutation(data: {
    teacherId: string;
    toSchoolId: string;
    mutationDate?: string;
    effectiveDate?: string;
    skNumber?: string;
    reason: string;
    notes?: string;
    adminName?: string;
    adminId?: string;
  }) {
    return request<any>(`${BASE_URL}/mutations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async processMutation(idOrData: any, optionalData?: any) {
    const isSingleArg = !optionalData;
    const bodyData = isSingleArg ? idOrData : optionalData;
    const id = isSingleArg ? idOrData.teacherId : idOrData;

    return this.createMutation(bodyData);
  },

  // Modules (Modul Ajar)
  async getLearningModules(params?: { teacherId?: string; schoolId?: string; status?: string }): Promise<LearningModule[]> {
    const query = new URLSearchParams(params as any).toString();
    return request<LearningModule[]>(`${BASE_URL}/learning-modules${query ? '?' + query : ''}`);
  },

  async uploadLearningModule(data: any): Promise<LearningModule> {
    return request<LearningModule>(`${BASE_URL}/learning-modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async createLearningModule(data: any): Promise<LearningModule> {
    return this.uploadLearningModule(data);
  },

  async updateModuleStatus(id: string, data: { status: string; feedback?: string; reviewerName: string; reviewerId: string }): Promise<LearningModule> {
    return request<LearningModule>(`${BASE_URL}/learning-modules/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async reviewLearningModule(id: string, data: any): Promise<LearningModule> {
    return this.updateModuleStatus(id, data);
  },

  // Administration Checklist
  async getAdminItems(): Promise<AdministrationItem[]> {
    return request<AdministrationItem[]>(`${BASE_URL}/administration-items`);
  },

  async getAdministrationItems(): Promise<AdministrationItem[]> {
    return this.getAdminItems();
  },

  async createAdminItem(data: Partial<AdministrationItem>): Promise<AdministrationItem> {
    return request<AdministrationItem>(`${BASE_URL}/administration-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async createAdministrationItem(data: Partial<AdministrationItem>): Promise<AdministrationItem> {
    return this.createAdminItem(data);
  },

  async updateAdminItem(id: string, data: Partial<AdministrationItem>): Promise<AdministrationItem> {
    return request<AdministrationItem>(`${BASE_URL}/administration-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async deleteAdminItem(id: string) {
    return request<any>(`${BASE_URL}/administration-items/${id}`, { method: 'DELETE' });
  },

  async getTeacherAdministration(teacherId?: string): Promise<TeacherAdministrationRecord[]> {
    const url = teacherId ? `${BASE_URL}/teacher-administration?teacherId=${teacherId}` : `${BASE_URL}/teacher-administration`;
    return request<TeacherAdministrationRecord[]>(url);
  },

  async getTeacherAdministrationChecklists(params?: { schoolId?: string }): Promise<TeacherAdministrationChecklist[]> {
    const query = new URLSearchParams(params as any).toString();
    return request<TeacherAdministrationChecklist[]>(`${BASE_URL}/teacher-administration/checklists${query ? '?' + query : ''}`);
  },

  async getTeacherChecklistByTeacherId(teacherId: string): Promise<TeacherAdministrationChecklist> {
    return request<TeacherAdministrationChecklist>(`${BASE_URL}/teacher-administration/checklist/${teacherId}`);
  },

  async updateTeacherChecklistItem(teacherId: string, itemId: string, data: any): Promise<TeacherAdministrationChecklist> {
    return request<TeacherAdministrationChecklist>(`${BASE_URL}/teacher-administration/checklist/${teacherId}/item/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async saveTeacherAdministrationBulk(data: {
    teacherId: string;
    schoolId: string;
    records: any[];
    teacherName?: string;
  }) {
    return request<any>(`${BASE_URL}/teacher-administration/save-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Evaluasi Administrasi oleh Pengawas Sekolah (Nilai Akhir Resmi)
  async evaluateTeacherAdministration(data: {
    teacherId: string;
    supervisorScore: number;
    supervisorNotes?: string;
    supervisorStatus?: string;
    evaluatorName?: string;
    evaluatorId?: string;
    evaluatorNip?: string;
    itemEvaluations?: {
      itemId: string;
      supervisorConfirmed: boolean;
      supervisorScore?: number;
      supervisorStatus?: string;
      supervisorFeedback?: string;
    }[];
  }): Promise<TeacherAdministrationChecklist> {
    return request<TeacherAdministrationChecklist>(`${BASE_URL}/teacher-administration/supervisor-evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Konfirmasi Hasil Penilaian Diri Guru oleh Pengawas
  async confirmTeacherSelfAssessment(
    teacherId: string,
    options?: {
      evaluatorName?: string;
      evaluatorId?: string;
      evaluatorNip?: string;
      supervisorScore?: number;
      supervisorNotes?: string;
    }
  ): Promise<TeacherAdministrationChecklist> {
    return request<TeacherAdministrationChecklist>(`${BASE_URL}/teacher-administration/confirm-self-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId, ...options })
    });
  },

  // Mindset Assessment (Pemetaan Pola Pikir)
  async getMindsetInstruments(): Promise<MindsetInstrument[]> {
    return request<MindsetInstrument[]>(`${BASE_URL}/mindset/instruments`);
  },

  async getMindsetAssessments(params?: { teacherId?: string; schoolId?: string }): Promise<TeacherMindsetAssessment[]> {
    const query = new URLSearchParams(params as any).toString();
    return request<TeacherMindsetAssessment[]>(`${BASE_URL}/mindset/assessments${query ? '?' + query : ''}`);
  },

  async submitMindsetAssessment(data: any): Promise<TeacherMindsetAssessment> {
    return request<TeacherMindsetAssessment>(`${BASE_URL}/mindset/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async createMindsetAssessment(data: any): Promise<TeacherMindsetAssessment> {
    return this.submitMindsetAssessment(data);
  },

  // Deep Learning (Pembelajaran Mendalam)
  async getDeepLearningAspects(): Promise<DeepLearningAspect[]> {
    return request<DeepLearningAspect[]>(`${BASE_URL}/deep-learning/aspects`);
  },

  async getDeepLearningAssessments(params?: { teacherId?: string; schoolId?: string }): Promise<DeepLearningAssessment[]> {
    const query = new URLSearchParams(params as any).toString();
    return request<DeepLearningAssessment[]>(`${BASE_URL}/deep-learning/assessments${query ? '?' + query : ''}`);
  },

  async submitDeepLearningAssessment(data: any): Promise<DeepLearningAssessment> {
    return request<DeepLearningAssessment>(`${BASE_URL}/deep-learning/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async createDeepLearningAssessment(data: any): Promise<DeepLearningAssessment> {
    return this.submitDeepLearningAssessment(data);
  },

  // Supervision Workflow & Schedules
  async getSupervisionRequests(params?: { schoolId?: string; supervisorId?: string; status?: string; teacherId?: string }): Promise<SupervisionRequest[]> {
    const query = new URLSearchParams(params as any).toString();
    return request<SupervisionRequest[]>(`${BASE_URL}/supervision-requests${query ? '?' + query : ''}`);
  },

  async createSupervisionRequest(data: any): Promise<SupervisionRequest> {
    return request<SupervisionRequest>(`${BASE_URL}/supervision-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async reviewSupervisionRequest(id: string, data: {
    action?: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
    status?: string;
    approvedDate?: string;
    approvedTime?: string;
    supervisorNotes?: string;
    notes?: string;
    rejectionReason?: string;
    supervisorId?: string;
    supervisorName?: string;
    reviewerName?: string;
    reviewerId?: string;
  }): Promise<SupervisionRequest> {
    return request<SupervisionRequest>(`${BASE_URL}/supervision-requests/${id}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async approveSupervisionRequest(id: string, data: any): Promise<SupervisionRequest> {
    return this.reviewSupervisionRequest(id, data);
  },

  async completeSupervision(id: string, data: {
    score?: number;
    completionScore?: number;
    feedback?: string;
    completionNotes?: string;
    supervisorName?: string;
    supervisorId?: string;
  }): Promise<SupervisionRequest> {
    return request<SupervisionRequest>(`${BASE_URL}/supervision-requests/${id}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Dashboard Stats
  async getDashboardStats(params?: { role?: string; schoolId?: string; supervisorId?: string; educationYearId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<any>(`${BASE_URL}/dashboard/stats${query ? '?' + query : ''}`);
  },

  // Notifications
  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    const url = userId ? `${BASE_URL}/notifications?userId=${userId}` : `${BASE_URL}/notifications`;
    return request<NotificationItem[]>(url);
  },

  async markNotificationRead(id: string) {
    return request<any>(`${BASE_URL}/notifications/${id}/read`, { method: 'POST' });
  },

  async markAllNotificationsRead(userId?: string) {
    return request<any>(`${BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  },

  // Audit Logs
  async getAuditLogs(params?: { limit?: number; role?: string }): Promise<AuditLog[]> {
    const query = new URLSearchParams(params as any).toString();
    return request<AuditLog[]>(`${BASE_URL}/audit-logs${query ? '?' + query : ''}`);
  },

  // App Settings & Branding
  async getAppSettings(): Promise<AppSettings> {
    return request<AppSettings>(`${BASE_URL}/app-settings`);
  },

  async updateAppSettings(data: Partial<AppSettings> & { adminName?: string; adminId?: string }): Promise<AppSettings> {
    return request<AppSettings>(`${BASE_URL}/app-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Admin Profile & User Management
  async getAdminProfile(): Promise<User> {
    return request<User>(`${BASE_URL}/admin/profile`);
  },

  async updateAdminProfile(data: {
    id?: string;
    name?: string;
    nip?: string;
    email?: string;
    phone?: string;
    position?: string;
    avatarUrl?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; user: User }> {
    return request<{ success: boolean; user: User }>(`${BASE_URL}/admin/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    return request<User>(`${BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Teacher Performance & Progress Trends
  async getTeacherPerformanceOverview(teacherId: string): Promise<TeacherPerformanceOverview> {
    return request<TeacherPerformanceOverview>(`${BASE_URL}/teacher-performance-trends/${teacherId}`);
  },

  async getAllTeacherPerformanceTrends(params?: { schoolId?: string; supervisorId?: string }): Promise<TeacherPerformanceOverview[]> {
    const searchParams = new URLSearchParams();
    if (params?.schoolId) searchParams.append('schoolId', params.schoolId);
    if (params?.supervisorId) searchParams.append('supervisorId', params.supervisorId);
    const query = searchParams.toString();
    return request<TeacherPerformanceOverview[]>(`${BASE_URL}/teacher-performance-trends${query ? `?${query}` : ''}`);
  },

  // Reset demo seed
  async resetDemoData() {
    return request<any>(`${BASE_URL}/seed/reset`, { method: 'POST' });
  },

  // Supabase Status & Manual Sync
  async getSupabaseStatus(): Promise<{
    configured: boolean;
    projectName?: string;
    projectId?: string;
    tablesReady?: boolean;
    counts?: {
      schools: number;
      teachers: number;
      supervisors: number;
      users: number;
    };
    message?: string;
    error?: string;
  }> {
    return request(`${BASE_URL}/supabase/status`);
  },

  async syncAllToSupabase(): Promise<{
    success: boolean;
    message: string;
    synced?: { schools: number; supervisors: number; teachers: number };
    currentCounts?: { schools: number; teachers: number; supervisors: number; users: number };
  }> {
    return request(`${BASE_URL}/supabase/sync-all`, {
      method: 'POST'
    });
  }
};
