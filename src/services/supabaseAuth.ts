import { supabase } from '../supabaseClient';
import type { User, Session, AuthError, AuthResponse } from '@supabase/supabase-js';

export interface AuthResult<T = any> {
  success: boolean;
  data?: T | null;
  error?: AuthError | Error | null;
  message?: string;
}

/**
 * Supabase Authentication Service
 * Handles user sign-in, sign-up, sign-out, session tracking, and user state.
 */
export const supabaseAuth = {
  /**
   * Sign in using email and password
   * @param email - User's registered email address
   * @param password - User's password
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return {
          success: false,
          error,
          message: error.message || 'Gagal masuk dengan Supabase Auth'
        };
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'Berhasil masuk ke akun'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err,
        message: err.message || 'Terjadi kesalahan pada layanan autentikasi'
      };
    }
  },

  /**
   * Alias for signInWithEmail using an object parameter
   */
  async signIn({ email, password }: { email: string; password: string }) {
    return this.signInWithEmail(email, password);
  },

  /**
   * Sign out current user and clear local session
   */
  async signOut(): Promise<AuthResult<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return {
          success: false,
          error,
          message: error.message || 'Gagal keluar dari sesi'
        };
      }

      return {
        success: true,
        message: 'Berhasil keluar (Signed out)'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err,
        message: err.message || 'Terjadi kesalahan saat logout'
      };
    }
  },

  /**
   * Register / Sign up a new user with email and password
   * @param email - User's email
   * @param password - Desired password
   * @param metadata - Optional user profile metadata (e.g. name, role, schoolId)
   */
  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, any>
  ): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata || {}
        }
      });

      if (error) {
        return {
          success: false,
          error,
          message: error.message || 'Gagal mendaftar akun baru'
        };
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'Registrasi berhasil. Silakan periksa email konfirmasi jika verifikasi diaktifkan.'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err,
        message: err.message || 'Terjadi kesalahan saat pendaftaran'
      };
    }
  },

  /**
   * Get the current active session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  },

  /**
   * Get currently authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return user;
    } catch {
      return null;
    }
  },

  /**
   * Check if a user is currently logged in
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return Boolean(session && session.user);
  },

  /**
   * Listen to auth state changes (e.g. SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
   * @param callback Callback receiving event and current session
   * @returns Unsubscribe subscription
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  },

  /**
   * Send password reset email
   */
  async resetPasswordForEmail(email: string, redirectTo?: string): Promise<AuthResult<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo
      });

      if (error) {
        return {
          success: false,
          error,
          message: error.message || 'Gagal mengirim instruksi reset kata sandi'
        };
      }

      return {
        success: true,
        message: 'Petunjuk reset kata sandi telah dikirim ke email Anda.'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err,
        message: err.message
      };
    }
  }
};

export default supabaseAuth;
