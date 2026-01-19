
import React from 'react';
import { Debt, User } from '../types';

interface ProgressProps {
  debts: Debt[];
  user: User;
}

const Progress: React.FC<ProgressProps> = ({ debts, user }) => {
  const totalMonthlyDebt = debts.reduce((acc, curr) => acc + (curr.ativo ? curr.parcela_mensal : 0), 0);
  const recoveredMoney = user.salario_liquido * 0.15; // Simulação de economia gerada por decisões
  const installmentsEliminated = 4; // Mock de progresso
  const monthsOfFreedom = Math.floor(recoveredMoney / 500); // Exemplo simples

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Progresso Psicológico</h1>
        <p className="text-slate-500">Porque comportamento e bem-estar importam mais que planilhas.</p>
      </div>

      {/* Destaque Principal: Poder de Escolha */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <i className="fa-solid fa-heart-pulse text-[15rem]"></i>
        </div>
        <div className="relative z-10">
          <p className="text-emerald-100 font-medium mb-2 uppercase tracking-widest text-xs">Poder de escolha recuperado</p>
          <h2 className="text-5xl font-black mb-4">R$ {recoveredMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-2xl font-normal text-emerald-100">/mês</span></h2>
          <p className="text-emerald-50 text-lg max-w-md">
            Você não está apenas pagando boletos. Você está comprando sua liberdade de volta.
          </p>
        </div>
      </div>

      {/* Grid de Indicadores Psicológicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
            <i className="fa-solid fa-hourglass-half text-xl"></i>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{monthsOfFreedom}</h3>
          <p className="text-sm font-medium text-slate-500">Meses de Liberdade Ganhos</p>
          <p className="text-xs text-slate-400 mt-2">Tempo total reduzido das suas dívidas através de amortizações inteligentes.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
            <i className="fa-solid fa-calendar-xmark text-xl"></i>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{installmentsEliminated}</h3>
          <p className="text-sm font-medium text-slate-500">Parcelas Eliminadas</p>
          <p className="text-xs text-slate-400 mt-2">Quantas "fatias" mensais deixaram de existir no seu planejamento anual.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
            <i className="fa-solid fa-shield-halved text-xl"></i>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">82%</h3>
          <p className="text-sm font-medium text-slate-500">Nível de Segurança</p>
          <p className="text-xs text-slate-400 mt-2">Relação entre sua reserva imediata e suas contas fixas do mês.</p>
        </div>
      </div>

      {/* Lista de Conquistas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <i className="fa-solid fa-award text-emerald-500"></i>
          <h3 className="font-bold text-slate-900">Suas Conquistas Recentes</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-check text-emerald-600"></i>
            </div>
            <div>
              <p className="font-bold text-slate-900">Primeiro passo dado</p>
              <p className="text-sm text-slate-500">Você conectou suas contas e mapeou todas as suas dívidas ativas.</p>
            </div>
            <div className="ml-auto text-xs font-bold text-slate-400">02 Mar</div>
          </div>

          <div className="flex items-center gap-4 opacity-50 grayscale">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-lock text-slate-400"></i>
            </div>
            <div>
              <p className="font-bold text-slate-900">Mês do Fôlego</p>
              <p className="text-sm text-slate-500">Conquiste ao reduzir seu comprometimento mensal em 10%.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 opacity-50 grayscale">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-lock text-slate-400"></i>
            </div>
            <div>
              <p className="font-bold text-slate-900">Zero Emocional</p>
              <p className="text-sm text-slate-500">Quite totalmente uma dívida marcada com impacto psicológico alto.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-center text-white">
        <h3 className="text-xl font-bold mb-2">“Você não precisa ganhar mais dinheiro. Precisa decidir melhor com o que já ganha.”</h3>
        <p className="text-slate-400 text-sm">Continue firme. Cada pequena amortização é uma vitória contra a ansiedade.</p>
      </div>
    </div>
  );
};

export default Progress;
