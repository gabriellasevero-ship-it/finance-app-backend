import React, { useState } from 'react';
import { User } from '../types';

interface OnboardingProps {
  onComplete: (user: User) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    salario_liquido: 0
  });

  const nextStep = () => setStep(prev => prev + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Gera um ID único para o usuário
    const uniqueId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onComplete({
      id: uniqueId,
      nome: formData.nome,
      email: formData.email,
      salario_liquido: formData.salario_liquido
    });
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
          <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 animate-slideUp">
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
                disabled={!formData.nome || !formData.salario_liquido}
                className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg ${
                  formData.nome && formData.salario_liquido
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/10'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                Começar a usar
              </button>
              
              <p className="text-xs text-slate-500 text-center">
                Você poderá conectar seus bancos via Open Finance nas configurações.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
