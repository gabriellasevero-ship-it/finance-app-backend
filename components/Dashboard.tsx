
import React, { useState, useEffect } from 'react';
import { User, Debt, Account } from '../types';
import { getFinancialInsight } from '../services/geminiService';
import { api } from '../services/api';

interface DashboardProps {
  user: User;
  debts: Debt[];
  accounts: Account[];
  isBackendOnline?: boolean | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user, debts, accounts, isBackendOnline }) => {
  const [insight, setInsight] = useState<string>('Carregando análise estratégica...');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      const text = await getFinancialInsight(user, debts);
      setInsight(text || '');
    };
    fetchInsight();
  }, [user, debts]);

  const handleManualSync = async () => {
    setSyncing(true);
    const health = await api.checkBackendHealth();
    alert(health.message);
    setSyncing(false);
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.saldo_atual, 0);
  const totalMonthlyDebt = debts.reduce((acc, curr) => acc + (curr.ativo ? curr.parcela_mensal : 0), 0);
  const commitmentRatio = (totalMonthlyDebt / user.salario_liquido) * 100;
  const availableMoney = totalBalance - totalMonthlyDebt;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Olá, {user.nome}</h1>
            {isBackendOnline !== null && (
              <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                isBackendOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                {isBackendOnline ? 'Backend Online' : 'Backend Offline'}
              </span>
            )}
          </div>
          <p className="text-slate-500">Aqui está a visão real do seu dinheiro hoje.</p>
        </div>
        <button 
          onClick={handleManualSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <i className={`fa-solid fa-rotate ${syncing ? 'animate-spin' : ''}`}></i> 
          {syncing ? 'Sincronizando...' : 'Atualizar Dados'}
        </button>
      </div>

      {/* Grid de Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Patrimônio de Curto Prazo</p>
          <h2 className="text-3xl font-bold text-slate-900">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 w-fit">
            <i className="fa-solid fa-circle-check"></i> Dinheiro em conta
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Comprometimento Mensal</p>
          <h2 className={`text-3xl font-bold ${commitmentRatio > 30 ? 'text-rose-500' : 'text-slate-900'}`}>
            {commitmentRatio.toFixed(1)}%
          </h2>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${commitmentRatio > 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(commitmentRatio, 100)}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {commitmentRatio > 30 ? 'Atenção: Acima do limite ideal (30%)' : 'Excelente: Dentro do limite saudável'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10">
          <p className="text-slate-400 text-sm font-medium mb-1">Dinheiro Realmente Livre</p>
          <h2 className="text-3xl font-bold">R$ {availableMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <p className="mt-4 text-xs text-slate-400 italic">Saldo total - Compromissos do mês</p>
        </div>
      </div>

      {/* Alerta Inteligente AI */}
      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-start">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <i className="fa-solid fa-brain text-xl"></i>
        </div>
        <div>
          <h3 className="font-bold text-emerald-900 mb-1 flex items-center gap-2">
            Insight Estratégico AI <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider text-emerald-700">Beta</span>
          </h3>
          <div className="text-emerald-800 leading-relaxed whitespace-pre-wrap">
            {insight}
          </div>
        </div>
      </div>

      {/* Resumo de Dívidas Ativas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Suas Dívidas Ativas</h3>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase">
            {debts.length} Contratos
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {debts.map(debt => (
            <div key={debt.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  debt.impacto_psicologico > 3 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500'
                }`}>
                  <i className="fa-solid fa-file-invoice-dollar"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{debt.nome}</h4>
                  <p className="text-xs text-slate-500">{debt.tipo} • {debt.parcelas_restantes} meses restantes</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">R$ {debt.parcela_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < debt.impacto_psicologico ? 'bg-rose-400' : 'bg-slate-200'}`}></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
