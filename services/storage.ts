
import { User, Debt, Account } from '../types';
import { isSupabaseConfigured, userService, debtService, accountService } from './supabaseService';

const STORAGE_KEYS = {
  USER: 'dfp_user',
  DEBTS: 'dfp_debts',
  ACCOUNTS: 'dfp_accounts'
};

// Fallback para localStorage quando Supabase não estiver configurado
export const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getFromStorage = <T>(key: string): T | null => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const clearStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
};

// Funções híbridas: tentam usar Supabase, mas fazem fallback para localStorage
export const saveUser = async (user: User): Promise<void> => {
  if (isSupabaseConfigured()) {
    const existingUser = await userService.getCurrentUser();
    if (existingUser) {
      await userService.updateUser(user.id, user);
    } else {
      await userService.createUser(user);
    }
  }
  saveToStorage(STORAGE_KEYS.USER, user);
};

export const getUser = async (): Promise<User | null> => {
  if (isSupabaseConfigured()) {
    const user = await userService.getCurrentUser();
    if (user) return user;
  }
  return getFromStorage<User>(STORAGE_KEYS.USER);
};

export const saveDebts = async (userId: string, debts: Debt[]): Promise<void> => {
  if (isSupabaseConfigured()) {
    // Sincronizar cada dívida com Supabase
    for (const debt of debts) {
      if (debt.id) {
        await debtService.updateDebt(debt.id, debt);
      } else {
        await debtService.createDebt(userId, debt);
      }
    }
  }
  saveToStorage(STORAGE_KEYS.DEBTS, debts);
};

export const getDebts = async (userId: string): Promise<Debt[]> => {
  if (isSupabaseConfigured()) {
    const debts = await debtService.getDebts(userId);
    if (debts.length > 0) {
      saveToStorage(STORAGE_KEYS.DEBTS, debts); // Cache local
      return debts;
    }
  }
  return getFromStorage<Debt[]>(STORAGE_KEYS.DEBTS) || [];
};

export const saveAccounts = async (userId: string, accounts: Account[]): Promise<void> => {
  if (isSupabaseConfigured()) {
    // Sincronizar cada conta com Supabase
    for (const account of accounts) {
      if (account.id) {
        await accountService.updateAccount(account.id, account);
      } else {
        await accountService.createAccount(userId, account);
      }
    }
  }
  saveToStorage(STORAGE_KEYS.ACCOUNTS, accounts);
};

export const getAccounts = async (userId: string): Promise<Account[]> => {
  if (isSupabaseConfigured()) {
    const accounts = await accountService.getAccounts(userId);
    if (accounts.length > 0) {
      saveToStorage(STORAGE_KEYS.ACCOUNTS, accounts); // Cache local
      return accounts;
    }
  }
  return getFromStorage<Account[]>(STORAGE_KEYS.ACCOUNTS) || [];
};

export { STORAGE_KEYS };
