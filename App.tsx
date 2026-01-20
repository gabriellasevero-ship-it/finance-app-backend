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
import { saveUser, getUser, saveDebts, getDebts, saveAccounts, getAccounts } from './services/storage';
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

      // 2. Carregar dados (tenta Supabase primeiro, depois localStorage)
      const storedUser = await getUser();
      const userId = storedUser?.id || '';

      if (storedUser) {
        setUser(storedUser);
        
        // Carregar dívidas e contas (do Supabase ou localStorage)
        const storedDebts = await getDebts(userId);
        const storedAccounts = await getAccounts(userId);
        
        setDebts(storedDebts);
        setAccounts(storedAccounts);
        setIsFirstAccess(false);
      }
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Persist changes (tenta Supabase, depois localStorage como fallback)
  useEffect(() => {
    if (user) {
      saveUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (debts.length > 0 && user) {
      saveDebts(user.id, debts);
    }
  }, [debts, user]);

  useEffect(() => {
    if (accounts.length > 0 && user) {
      saveAccounts(user.id, accounts);
    }
  }, [accounts, user]);

  const handleCompleteOnboarding = async (userData: User) => {
    // Salvar usuário no Supabase/localStorage
    await saveUser(userData);
    setUser(userData);
    
    // Usuário começa sem dívidas e contas - deve conectar via Open Finance em Settings
    setAccounts([]);
    setDebts([]);
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

  // Função de conexão de banco (modo demonstração - sem dados reais)
  // Para conexão real, usar Open Finance via Settings
  const handleConnectBank = async (inst: Institution) => {
    // Modo demonstração: apenas adiciona a instituição como conectada
    // sem dados de saldo (será preenchido quando sincronizar via Open Finance)
    const demoAccount: Account = {
      id: `demo_${inst.id}_${Date.now()}`,
      institution_id: inst.id,
      tipo: 'corrente',
      saldo_atual: 0, // Sem saldo mockado
      updated_at: new Date().toISOString(),
    };
    
    setAccounts(prev => [...prev, demoAccount]);
    
    if (user) {
      await saveAccounts(user.id, [...accounts, demoAccount]);
    }
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
