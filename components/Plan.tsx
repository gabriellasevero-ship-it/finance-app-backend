
import React from 'react';
import { Debt, User } from '../types';

interface PlanProps {
  debts: Debt[];
  user: User;
}

const Plan: React.FC<PlanProps> = ({ debts, user }) => {
  const months = ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'];
  const totalDebtBalance = debts.reduce((acc, curr) => acc + curr.saldo_estimado, 0);
  const monthlyCommitment = debts.reduce((acc, curr) => acc + curr.parcela_mensal, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plano Mensal Automático</h1>
          <p className="text-slate-500">Sua jornada passo-a-passo até a liberdade financeira.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400">Total a Pagar</p>
          <p className="text-xl font-bold text-slate-900">R$ {totalDebtBalance.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-6">Timeline de Progresso (12 meses)</h3>
        <div className="relative pt-8 pb-4 px-4 overflow-x-auto">
          <div className="flex min-w-[800px] justify-between items-end gap-2 relative">
             <div className="absolute top-[-20px] left-0 right-0 h-0.5 bg-slate-100 z-0"></div>
             
             {months.map((month, idx) => {
               // Simple simulation of debt decreasing over time
               const progress = 100 - (idx * 8); 
               return (
                 <div key={month} className="flex flex-col items-center flex-1 group">
                   <div className="text-xs font-bold text-slate-400 mb-4">{month}</div>
                   <div className="w-full max-w-[40px] bg-slate-100 rounded-t-lg relative transition-all group-hover:bg-slate-200" style={{ height: `${progress * 2}px` }}>
                     <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t-lg transition-all" style={{ height: `${(progress/100) * 100}%` }}></div>
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
            <i className="fa-solid fa-flag-checkered"></i> Metas de Curto Prazo
          </h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center mt-0.5"><i className="fa-solid fa-check text-[10px]"></i></div>
              <p className="text-sm">Reduzir comprometimento abaixo de 25% (Faltam {((monthlyCommitment / user.salario_liquido - 0.25) * 100).toFixed(0)}%)</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 border border-white/40 rounded flex items-center justify-center mt-0.5"></div>
              <p className="text-sm">Quitar a dívida mais emocional (Nubank)</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 border border-white/40 rounded flex items-center justify-center mt-0.5"></div>
              <p className="text-sm">Economizar R$ 500 para amortização extra</p>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-heart-pulse text-rose-500"></i> Progresso Psicológico
          </h4>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span>Poder de escolha recuperado</span>
                <span className="text-emerald-500">65%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="w-[65%] h-full bg-emerald-500"></div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-xs text-slate-500 italic">"Você recuperou R$ 2.869/mês de poder de escolha nos últimos 6 meses ao gerenciar suas taxas e prioridades."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plan;
