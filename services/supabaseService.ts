import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Debt, Account, Institution } from '../types';

// As variáveis de ambiente serão carregadas pelo Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verifica se Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Só cria o cliente se as credenciais existirem
let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.info('ℹ️ Supabase não configurado. Usando localStorage como fallback.');
}

export { supabase };

// ============ USERS ============
export const userService = {
  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;
    return data as User;
  },

  async createUser(userData: Partial<User> & { nome: string; salario_liquido: number }): Promise<User | null> {
    if (!supabase) return null;
    
    // Gerar ID se não tiver (para guest users)
    const userId = userData.id || localStorage.getItem('guest_user_id') || Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guest_user_id', userId);

    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, ...userData }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      // Se falhar por conflito (já existe), tentar buscar pelo ID
      if (error.code === '23505') {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        return existingUser as User | null;
      }
      return null;
    }
    return data as User;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    return data as User;
  },
};

// ============ DEBTS ============
export const debtService = {
  async getDebts(userId: string): Promise<Debt[]> {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching debts:', error);
      return [];
    }
    return data as Debt[];
  },

  async createDebt(userId: string, debtData: Omit<Debt, 'id' | 'user_id'>): Promise<Debt | null> {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('debts')
      .insert([{ user_id: userId, ...debtData }])
      .select()
      .single();

    if (error) {
      console.error('Error creating debt:', error);
      return null;
    }
    return data as Debt;
  },

  async updateDebt(debtId: string, updates: Partial<Debt>): Promise<Debt | null> {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', debtId)
      .select()
      .single();

    if (error) {
      console.error('Error updating debt:', error);
      return null;
    }
    return data as Debt;
  },

  async deleteDebt(debtId: string): Promise<boolean> {
    if (!supabase) return false;
    
    const { error } = await supabase
      .from('debts')
      .update({ ativo: false })
      .eq('id', debtId);

    if (error) {
      console.error('Error deleting debt:', error);
      return false;
    }
    return true;
  },
};

// ============ ACCOUNTS ============
export const accountService = {
  async getAccounts(userId: string): Promise<Account[]> {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
    return data as Account[];
  },

  async createAccount(userId: string, accountData: Omit<Account, 'id' | 'user_id'>): Promise<Account | null> {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ user_id: userId, ...accountData }])
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return null;
    }
    return data as Account;
  },

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<Account | null> {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) {
      console.error('Error updating account:', error);
      return null;
    }
    return data as Account;
  },

  async deleteAccount(accountId: string): Promise<boolean> {
    if (!supabase) return false;
    
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      console.error('Error deleting account:', error);
      return false;
    }
    return true;
  },
};

