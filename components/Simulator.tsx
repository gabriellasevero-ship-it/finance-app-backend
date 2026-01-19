
import React, { useState } from 'react';
import { Debt, User } from '../types';
import { simulateScenario } from '../services/geminiService';

interface SimulatorProps {
  user: User;
  debts: Debt[];
}

const Simulator: React.FC<SimulatorProps> = ({ user, debts }) => {
  const [windfall, setWindfall] = useState<number>(0);
  const [priority, setPriority] = useState('Liberar Salário');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    if (windfall <= 0) return;
    setIsSimulating(true);
    const simulationResult = await simulateScenario(debts, windfall, priority);
    setResult(simulationResult);
    setIsSimulating(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Simulador de Decisão</h1>
        <p className="text-slate-500">O que acontece se você tiver um dinheiro extra hoje?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Quanto dinheiro você tem disponível?</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500" 
                placeholder="20.000,00"
                value={windfall || ''}
                onChange={e => setWindfall(Number(e.target.value))}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Ex: PLR, 13º salário, venda de bem, bônus.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Qual seu principal objetivo?</label>
            <div className="grid grid-cols-1 gap-3">
              {['Liberar Salário', 'Quitar mais rápido', 'Menor custo emocional'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    priority === p ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <span className="font-semibold">{p}</span>
                  {priority === p && <i className="fa-solid fa-circle-check text-emerald-500"></i>}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSimulate}
            disabled={isSimulating || windfall <= 0}
            className={`w-full py-5 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${
              isSimulating || windfall <= 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'
            }`}
          >
            {isSimulating ? (
              <><i className="fa-solid fa-spinner animate-spin"></i> Processando Cenários...</>
            ) : (
              <><i className="fa-solid fa-wand-magic-sparkles"></i> Simular Melhor Impacto</>
            )}
          </button>
        </div>

        <div className="flex flex-col justify-center">
          {result ? (
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl animate-fadeIn relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <i className="fa-solid fa-lightbulb text-9xl"></i>
              </div>
              <div className="relative z-10">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 block">Sugestão de Ataque</span>
                <h3 className="text-3xl font-bold mb-6">Foque em: {debts.find(d => d.id === result.bestDebtId)?.nome || 'Pagar Dívida'}</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                    <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Salário Livre</p>
                    <p className="text-2xl font-bold">+R$ {result.monthlySavings.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                    <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Tempo Reduzido</p>
                    <p className="text-2xl font-bold">{result.monthsReduced} meses</p>
                  </div>
                </div>

                <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30">
                  <p className="text-sm leading-relaxed italic">
                    "{result.explanation}"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-3xl text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100">
                <i className="fa-solid fa-chart-line text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-400">Pronto para comparar?</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm">Insira um valor e escolha sua prioridade para ver o impacto nos próximos meses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulator;
