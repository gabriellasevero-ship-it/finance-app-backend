import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DebtManager from './components/DebtManager';
import Simulator from './components/Simulator';
import Plan from './components/Plan';
import Progress from './components/Progress';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { User, Debt, Account, Institution } from './types';
import { saveUser, saveDebts, getDebts, saveAccounts, getAccounts } from './services/storage';
import { authService } from './services/authService';
import { api } from './services/api';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password'>('login');

  // Verificar se é redirecionamento de reset de senha
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setAuthMode('reset-password');
    }
  }, []);

  // Initial Data Load & Auth Check
  useEffect(() => {
    const initializeApp = async () => {
      // 1. Verificar Backend
      const health = await api.checkBackendHealth();
      setIsBackendOnline(health.success);

      // 2. Verificar sessão de autenticação
      const session = await authService.getSession();
      
      if (session.isAuthenticated && session.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        
        // Carregar dívidas e contas do usuário autenticado
        const storedDebts = await getDebts(session.user.id);
        const storedAccounts = await getAccounts(session.user.id);
        
        setDebts(storedDebts);
        setAccounts(storedAccounts);
      }
      
      setIsLoading(false);
    };

    initializeApp();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        setIsAuthenticated(true);
        
        // Carregar dados do usuário
        const storedDebts = await getDebts(authUser.id);
        const storedAccounts = await getAccounts(authUser.id);
        setDebts(storedDebts);
        setAccounts(storedAccounts);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setDebts([]);
        setAccounts([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Persist changes
  useEffect(() => {
    if (user) {
      saveUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      saveDebts(user.id, debts);
    }
  }, [debts, user]);

  useEffect(() => {
    if (user) {
      saveAccounts(user.id, accounts);
    }
  }, [accounts, user]);

  // Handler de sucesso na autenticação
  const handleAuthSuccess = async (authUser: User) => {
    setUser(authUser);
    setIsAuthenticated(true);
    
    // Carregar dados do usuário
    const storedDebts = await getDebts(authUser.id);
    const storedAccounts = await getAccounts(authUser.id);
    setDebts(storedDebts);
    setAccounts(storedAccounts);

    // Limpar hash da URL se houver
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Handler de logout
  const handleLogout = async () => {
    const result = await authService.signOut();
    if (result.success) {
      setUser(null);
      setIsAuthenticated(false);
      setDebts([]);
      setAccounts([]);
      setActiveTab('dashboard');
    }
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

  // Tela de carregamento inicial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Carregando...</p>
      </div>
    );
  }

  // Tela de autenticação (login/cadastro/recuperar senha)
  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} initialMode={authMode} />;
  }

  // App principal (usuário autenticado)
  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userName={user?.nome || 'Usuário'}
      onLogout={handleLogout}
    >
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
