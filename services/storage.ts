
import { User, Debt, Account } from '../types';

const STORAGE_KEYS = {
  USER: 'dfp_user',
  DEBTS: 'dfp_debts',
  ACCOUNTS: 'dfp_accounts'
};

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

export { STORAGE_KEYS };
