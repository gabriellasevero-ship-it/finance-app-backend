
import React, { useState } from 'react';
import { User, Institution } from '../types';
import { INSTITUTIONS } from '../constants';

interface OnboardingProps {
  onComplete: (user: User, selectedBanks: Institution[]) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    salario_liquido: 0
  });
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

  const nextStep = () => setStep(prev => prev + 1);

  const toggleBank = (id: string) => {
    setSelectedBankIds(prev => 
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBanks = INSTITUTIONS.filter(inst => selectedBankIds.includes(inst.id));
    onComplete({
      id: '1',
      nome: formData.nome,
      email: formData.email,
      salario_liquido: formData.salario_liquido
    }, selectedBanks);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {step === 1 && (
          <div className="text-center animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
              <i className="fa-solid fa-rocket text-4xl"></i>
            </div>
            <h1 className="text-3xl font-bold mb-4">Bem-vindo à sua Liberdade Financeira</h1>
            <p className="text-slate-400 mb-10 text-lg">
              Este app não é para controlar centavos. É para tomar decisões melhores com o seu dinheiro.
            </p>
            <button
              onClick={nextStep}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              Começar minha jornada <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 animate-slideUp">
            <h2 className="text-2xl font-bold mb-2">Configure seu Perfil</h2>
            <p className="text-slate-400 mb-8">Precisamos de alguns dados estratégicos.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Como quer ser chamado?</label>
                <input
                  required
                  type="text"
                  placeholder="Seu nome"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Qual seu Salário Líquido mensal?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                  <input
                    required
                    type="number"
                    placeholder="0,00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={formData.salario_liquido || ''}
                    onChange={e => setFormData({...formData, salario_liquido: Number(e.target.value)})}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 italic">* O valor que cai na conta após descontos.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
              >
                Próximo passo
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 animate-slideUp">
            <h2 className="text-2xl font-bold mb-2">Conectar Contas</h2>
            <p className="text-slate-400 mb-8">Selecione seus bancos para importar dados via Open Finance.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {INSTITUTIONS.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => toggleBank(inst.id)}
                  className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                    selectedBankIds.includes(inst.id) 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  <img src={inst.logo} alt={inst.nome} className="w-12 h-12 rounded-xl object-contain mb-3 bg-white p-1" />
                  <span className="text-xs font-bold">{inst.nome}</span>
                  {selectedBankIds.includes(inst.id) && (
                    <div className="mt-2 text-[10px] text-emerald-400 font-bold uppercase">Selecionado</div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={selectedBankIds.length === 0}
              className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg ${
                selectedBankIds.length > 0 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/10' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Conectar e Finalizar
            </button>
            <button 
              onClick={() => setStep(2)}
              className="w-full mt-4 text-slate-500 hover:text-slate-300 text-sm font-medium"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
