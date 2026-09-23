import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, EducationYear, NotificationItem, AppSettings } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole | null;
  isAuthenticated: boolean;
  appSettings: AppSettings | null;
  activeEducationYear: EducationYear | null;
  allEducationYears: EducationYear[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  demoUsers: User[];
  isLoading: boolean;
  login: (identifier?: string, password?: string, role?: string, userId?: string) => Promise<boolean>;
  switchUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  setActiveEducationYearById: (id: string) => Promise<void>;
  hasPermission: (permissionName: string) => boolean;
  refreshGlobalData: () => Promise<void>;
  updateAppSettings: (newSettings: Partial<AppSettings>) => Promise<AppSettings | null>;
  updateCurrentUserProfile: (profileData: Partial<User> & { newPassword?: string }) => Promise<boolean>;
}

const DEFAULT_DEMO_USERS: User[] = [
  {
    id: 'u-guru-1',
    username: 'sumarni_guru',
    name: 'Sumarni, S.Pd.SD.',
    email: 'sumarni.sdntinap3@gmail.com',
    role: 'GURU',
    nip: '198504152009022007',
    schoolId: 'sch-1',
    phone: '081398765432',
    status: 'active',
    createdAt: '2026-01-01'
  },
  {
    id: 'u-ks-1',
    username: 'ks_tinap3',
    name: 'Hj. Sri Wahyuni, M.Pd.',
    email: 'sri.wahyuni@sdntinap3.sch.id',
    role: 'KEPALA_SEKOLAH',
    nip: '197508141999032003',
    schoolId: 'sch-1',
    phone: '081234567893',
    status: 'active',
    createdAt: '2026-01-01'
  },
  {
    id: 'u-pengawas-1',
    username: 'pengawas_bambang',
    name: 'Drs. H. Bambang Sutrisno, M.Pd.',
    email: 'bambang.pengawas@pendidikan.go.id',
    role: 'PENGAWAS',
    nip: '196803151992031004',
    phone: '081234567891',
    assignedSchoolIds: ['sch-1', 'sch-2'],
    status: 'active',
    createdAt: '2026-01-01'
  },
  {
    id: 'u-dinas',
    username: 'admin123',
    name: 'Didik Setiawan, S.E',
    email: 'dinas@pendidikan.go.id',
    role: 'ADMIN_DINAS',
    nip: '197405121998031002',
    password: 'admin123',
    phone: '081234567890',
    status: 'active',
    createdAt: '2026-01-01'
  }
];

const DEFAULT_YEARS: EducationYear[] = [
  {
    id: 'ey-2026-1',
    name: '2026/2027',
    semester: 'Ganjil',
    startDate: '2026-07-15',
    endDate: '2026-12-20',
    isActive: true,
    notes: 'Tahun Ajaran Aktif - Implementasi Kurikulum Merdeka & PM'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>(DEFAULT_DEMO_USERS);
  const [activeEducationYear, setActiveEducationYear] = useState<EducationYear | null>(DEFAULT_YEARS[0]);
  const [allEducationYears, setAllEducationYears] = useState<EducationYear[]>(DEFAULT_YEARS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize data
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const [usersList, yearsList, settings] = await Promise.all([
        api.getDemoUsers().catch((err) => {
          console.warn('Gagal memuat pengguna via API, menggunakan data default:', err);
          return DEFAULT_DEMO_USERS;
        }),
        api.getEducationYears().catch((err) => {
          console.warn('Gagal memuat tahun ajaran via API, menggunakan data default:', err);
          return DEFAULT_YEARS;
        }),
        api.getAppSettings().catch(() => null)
      ]);

      const validUsers = usersList && usersList.length > 0 ? usersList : DEFAULT_DEMO_USERS;
      const validYears = yearsList && yearsList.length > 0 ? yearsList : DEFAULT_YEARS;

      setDemoUsers(validUsers);
      setAllEducationYears(validYears);
      if (settings) {
        setAppSettings(settings);
      }

      const activeYr = validYears.find((y) => y.isActive) || validYears[0] || null;
      setActiveEducationYear(activeYr);

      // Check saved user in session/localStorage or default to user
      const isLoggedOut = localStorage.getItem('si_supervisi_logged_out') === 'true';
      const savedUserId = localStorage.getItem('si_supervisi_user_id');

      let initialUser: User | null = null;
      if (!isLoggedOut) {
        if (savedUserId) {
          initialUser = validUsers.find((u) => u.id === savedUserId) || null;
        }
        if (!initialUser) {
          // Default to Guru Sumarni (user account) or Admin Dinas
          initialUser = validUsers.find((u) => u.email === 'sumarni.sdntinap3@gmail.com') ||
                        validUsers.find((u) => u.role === 'GURU') ||
                        validUsers.find((u) => u.role === 'ADMIN_DINAS') ||
                        validUsers[0] || null;
        }
      }

      setCurrentUser(initialUser);
      if (initialUser) {
        localStorage.setItem('si_supervisi_user_id', initialUser.id);
        api.getNotifications(initialUser.id).then(setNotifications).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to initialize auth state:', err);
      // Fallback: Ensure user Sumarni is active even if network failed
      const isLoggedOut = localStorage.getItem('si_supervisi_logged_out') === 'true';
      if (!isLoggedOut) {
        const fallbackUser = DEFAULT_DEMO_USERS[0];
        setCurrentUser(fallbackUser);
        localStorage.setItem('si_supervisi_user_id', fallbackUser.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const refreshNotifications = async () => {
    if (!currentUser) return;
    try {
      const notifs = await api.getNotifications(currentUser.id);
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to refresh notifications:', err);
    }
  };

  const refreshGlobalData = async () => {
    try {
      const [usersList, yearsList, settings] = await Promise.all([
        api.getDemoUsers().catch(() => DEFAULT_DEMO_USERS),
        api.getEducationYears().catch(() => DEFAULT_YEARS),
        api.getAppSettings().catch(() => null)
      ]);
      const validUsers = usersList && usersList.length > 0 ? usersList : DEFAULT_DEMO_USERS;
      const validYears = yearsList && yearsList.length > 0 ? yearsList : DEFAULT_YEARS;
      setDemoUsers(validUsers);
      setAllEducationYears(validYears);
      if (settings) setAppSettings(settings);
      const activeYr = validYears.find((y) => y.isActive) || validYears[0] || null;
      setActiveEducationYear(activeYr);
      if (currentUser) {
        const notifs = await api.getNotifications(currentUser.id).catch(() => []);
        setNotifications(notifs);
      }
    } catch (err) {
      console.error('Error refreshing global data:', err);
    }
  };

  const updateAppSettings = async (newSettings: Partial<AppSettings>): Promise<AppSettings | null> => {
    try {
      const updated = await api.updateAppSettings({
        ...newSettings,
        adminName: currentUser?.name || 'Didik Setiawan, S.E',
        adminId: currentUser?.id || 'u-dinas'
      });
      setAppSettings(updated);
      return updated;
    } catch (err) {
      console.error('Error updating app settings:', err);
      return null;
    }
  };

  const updateCurrentUserProfile = async (profileData: Partial<User> & { newPassword?: string }): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await api.updateAdminProfile({
        id: currentUser.id,
        ...profileData
      });
      if (res && res.user) {
        const updatedUser = { ...currentUser, ...res.user };
        setCurrentUser(updatedUser);
        setDemoUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating user profile:', err);
      return false;
    }
  };

  const login = async (identifier?: string, password?: string, role?: string, userId?: string): Promise<boolean> => {
    try {
      const res = await api.login(identifier, password, role, userId);
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.removeItem('si_supervisi_logged_out');
        localStorage.setItem('si_supervisi_user_id', res.user.id);
        api.getNotifications(res.user.id).then(setNotifications).catch(() => {});
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('API login failed, attempting local fallback authentication:', err?.message);
      // Resilient Fallback: Match against available demoUsers
      const cleanId = (identifier || '').trim().toLowerCase();
      const strippedCleanId = cleanId.replace(/[\s.-]/g, '');

      const matchedUser = demoUsers.find((u) => {
        if (userId && u.id === userId) return true;
        if (role && u.role === role) return true;
        if (!cleanId) return false;

        const matchEmail = u.email?.toLowerCase() === cleanId || u.email?.toLowerCase().includes(cleanId);
        const matchUsername = u.username?.toLowerCase() === cleanId;
        const matchNip = u.nip && (u.nip === cleanId || u.nip.replace(/[\s.-]/g, '') === strippedCleanId);
        const matchName = u.name.toLowerCase().includes(cleanId);

        return matchEmail || matchUsername || matchNip || matchName;
      }) || (cleanId.includes('sumarni') ? demoUsers.find((u) => u.email === 'sumarni.sdntinap3@gmail.com') : null);

      if (matchedUser) {
        setCurrentUser(matchedUser);
        localStorage.removeItem('si_supervisi_logged_out');
        localStorage.setItem('si_supervisi_user_id', matchedUser.id);
        return true;
      }

      throw err;
    }
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.removeItem('si_supervisi_logged_out');
    localStorage.setItem('si_supervisi_user_id', user.id);
    api.getNotifications(user.id).then((notifs) => setNotifications(notifs));
  };

  const switchRole = (role: UserRole) => {
    const targetUser = demoUsers.find((u) => u.role === role);
    if (targetUser) {
      switchUser(targetUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('si_supervisi_user_id');
    localStorage.setItem('si_supervisi_logged_out', 'true');
    setCurrentUser(null);
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      await api.markAllNotificationsRead(currentUser.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const setActiveEducationYearById = async (id: string) => {
    try {
      await api.activateEducationYear(id);
      const updatedYears = await api.getEducationYears();
      setAllEducationYears(updatedYears);
      const active = updatedYears.find((y) => y.id === id) || null;
      setActiveEducationYear(active);
    } catch (err) {
      console.error('Error setting active year:', err);
    }
  };

  // Permission Matrix verification
  const hasPermission = (permissionName: string): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;

    switch (permissionName) {
      case 'MANAGE_SCHOOL':
      case 'MANAGE_TEACHER':
      case 'MANAGE_PRINCIPAL':
      case 'MANAGE_SUPERVISOR':
      case 'MUTATE_TEACHER':
      case 'MANAGE_EDUCATION_YEAR':
      case 'VIEW_ALL_SCHOOLS':
      case 'VIEW_AUDIT_LOGS':
        return role === 'ADMIN_DINAS';

      case 'VIEW_ASSIGNED_SCHOOLS':
      case 'APPROVE_SUPERVISION':
      case 'MONITOR_SUPERVISION_ZONE':
        return role === 'PENGAWAS' || role === 'ADMIN_DINAS';

      case 'VIEW_SCHOOL_TEACHERS':
      case 'REVIEW_MODULE':
      case 'REVIEW_ADMINISTRATION':
      case 'ASSESS_MINDSET':
      case 'ASSESS_DEEP_LEARNING':
      case 'CREATE_SUPERVISION_REQUEST':
        return role === 'KEPALA_SEKOLAH' || role === 'ADMIN_DINAS';

      case 'UPLOAD_MODULE':
      case 'MANAGE_OWN_ADMINISTRATION':
      case 'VIEW_OWN_RESULT':
      case 'VIEW_OWN_SCHEDULE':
        return role === 'GURU' || role === 'ADMIN_DINAS';

      default:
        return true;
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        activeEducationYear,
        allEducationYears,
        notifications,
        unreadNotificationCount,
        demoUsers,
        isLoading,
        login,
        switchUser,
        switchRole,
        logout,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        setActiveEducationYearById,
        hasPermission,
        refreshGlobalData,
        appSettings,
        updateAppSettings,
        updateCurrentUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
