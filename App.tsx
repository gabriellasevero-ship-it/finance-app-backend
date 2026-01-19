
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DebtManager from './components/DebtManager';
import Simulator from './components/Simulator';
import Plan from './components/Plan';
import Progress from './components/Progress';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { User, Debt, Account, Institution } from './types';
import { INITIAL_DEBTS } from './constants';
import { saveToStorage, getFromStorage, STORAGE_KEYS } from './services/storage';
import { api } from './services/api';

const App: React.FC = () => {
  const [isFirstAccess, setIsFirstAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Initial Data Load & Backend Health Check
  useEffect(() => {
    const initializeApp = async () => {
      // 1. Verificar Backend
      const health = await api.checkBackendHealth();
      setIsBackendOnline(health.success);

      // 2. Carregar dados locais
      const storedUser = getFromStorage<User>(STORAGE_KEYS.USER);
      const storedDebts = getFromStorage<Debt[]>(STORAGE_KEYS.DEBTS);
      const storedAccounts = getFromStorage<Account[]>(STORAGE_KEYS.ACCOUNTS);

      if (storedUser) {
        setUser(storedUser);
        setDebts(storedDebts || INITIAL_DEBTS);
        setAccounts(storedAccounts || []);
        setIsFirstAccess(false);
      }
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Persist changes to local storage (Fallback)
  useEffect(() => {
    if (user) saveToStorage(STORAGE_KEYS.USER, user);
  }, [user]);

  useEffect(() => {
    if (debts.length > 0) saveToStorage(STORAGE_KEYS.DEBTS, debts);
  }, [debts]);

  useEffect(() => {
    if (accounts.length > 0) saveToStorage(STORAGE_KEYS.ACCOUNTS, accounts);
  }, [accounts]);

  const handleCompleteOnboarding = (userData: User, selectedBanks: Institution[]) => {
    setUser(userData);
    
    // Para o onboarding, também poderíamos disparar as conexões via backend, 
    // mas aqui mantemos o mock inicial para rapidez da UI e usamos a API no Settings.
    const initialAccounts: Account[] = selectedBanks.map(inst => ({
      id: Math.random().toString(36).substr(2, 9),
      institution_id: inst.id,
      tipo: 'corrente',
      saldo_atual: Math.floor(Math.random() * 3000) + 500,
      updated_at: new Date().toISOString(),
    }));

    setAccounts(initialAccounts);
    setDebts(INITIAL_DEBTS);
    setIsFirstAccess(false);
  };

  const handleUpdateDebt = (updatedDebt: Debt) => {
    setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d));
  };

  const handleAddDebt = (newDebt: Debt) => {
    const debtWithId = { ...newDebt, id: Math.random().toString(36).substr(2, 9) };
    setDebts(prev => [...prev, debtWithId]);
  };

  const handleRemoveDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
  };

  // FUNÇÃO ATUALIZADA COM CHAMADA REAL AO BACKEND
  const handleConnectBank = async (inst: Institution) => {
    setIsLoading(true);
    
    const result = await api.connectBank(inst.id);
    
    if (result.success) {
      // Se o backend retornou dados específicos da conta, usamos eles.
      // Caso contrário (se for apenas um OK), geramos dados locais para a UI.
      const newAccount: Account = result.data?.account || {
        id: Math.random().toString(36).substr(2, 9),
        institution_id: inst.id,
        tipo: 'corrente',
        saldo_atual: Math.floor(Math.random() * 5000) + 100,
        updated_at: new Date().toISOString(),
      };
      
      setAccounts(prev => [...prev, newAccount]);
      alert(result.message);
    } else {
      alert("Erro ao conectar banco no backend: " + result.message);
    }
    
    setIsLoading(false);
  };

  const handleDisconnectBank = (instId: string) => {
    if (confirm(`Deseja realmente desconectar o banco ${instId}?`)) {
      setAccounts(prev => prev.filter(a => a.institution_id !== instId));
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (isLoading && !isFirstAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse">Sincronizando via API...</p>
      </div>
    );
  }

  if (isFirstAccess) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userName={user?.nome || 'Usuário'}>
      {activeTab === 'dashboard' && (
        <Dashboard user={user!} debts={debts} accounts={accounts} isBackendOnline={isBackendOnline} />
      )}
      {activeTab === 'debts' && (
        <DebtManager debts={debts} onUpdate={handleUpdateDebt} onAdd={handleAddDebt} onRemove={handleRemoveDebt} />
      )}
      {activeTab === 'simulator' && (
        <Simulator user={user!} debts={debts} />
      )}
      {activeTab === 'plan' && (
        <Plan debts={debts} user={user!} />
      )}
      {activeTab === 'progress' && (
        <Progress debts={debts} user={user!} />
      )}
      {activeTab === 'settings' && (
        <Settings 
          user={user!} 
          onUpdateUser={handleUpdateUser}
          accounts={accounts}
          onConnectBank={handleConnectBank}
          onDisconnectBank={handleDisconnectBank}
        />
      )}
    </Layout>
  );
};

export default App;
