
import React, { useState } from 'react';
import { User, Account, Institution } from '../types';
import { INSTITUTIONS } from '../constants';

interface SettingsProps {
  user: User;
  onUpdateUser: (userData: User) => void;
  accounts: Account[];
  onConnectBank: (institution: Institution) => void;
  onDisconnectBank: (institutionId: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, accounts, onConnectBank, onDisconnectBank }) => {
  const [salario, setSalario] = useState(user.salario_liquido);
  const [nome, setNome] = useState(user.nome);

  const connectedInstitutionIds = new Set(accounts.map(a => a.institution_id));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ ...user, nome, salario_liquido: salario });
    alert("Perfil atualizado com sucesso!");
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ajustes e Conexões</h1>
        <p className="text-slate-500">Gerencie seu perfil e suas integrações Open Finance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna de Perfil */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-user-gear text-emerald-500"></i> Seu Perfil
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Nome de Exibição</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Salário Líquido (R$)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                  value={salario}
                  onChange={e => setSalario(Number(e.target.value))}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Salvar Alterações
              </button>
            </form>
          </div>

          <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl">
            <h4 className="text-rose-900 font-bold mb-2 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i> Zona de Perigo
            </h4>
            <p className="text-rose-700 text-sm mb-4">Ao excluir sua conta, todos os dados de dívidas e simulações serão perdidos permanentemente.</p>
            <button className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl hover:bg-rose-600 transition-colors">
              Apagar Meus Dados
            </button>
          </div>
        </div>

        {/* Coluna de Conexões */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bancos Conectados */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-link text-emerald-500"></i> Bancos Conectados
            </h3>
            <div className="space-y-4">
              {Array.from(connectedInstitutionIds).map(instId => {
                const inst = INSTITUTIONS.find(i => i.id === instId);
                if (!inst) return null;
                return (
                  <div key={instId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <img src={inst.logo} alt={inst.nome} className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-900">{inst.nome}</p>
                        <p className="text-xs text-emerald-600 font-medium">Sincronizado via Open Finance</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onDisconnectBank(instId)}
                      className="text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors"
                    >
                      Desconectar
                    </button>
                  </div>
                );
              })}
              {connectedInstitutionIds.size === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-slate-400 text-sm">Nenhum banco conectado no momento.</p>
                </div>
              )}
            </div>
          </div>

          {/* Conectar Novos Bancos */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-plus text-emerald-500"></i> Adicionar Nova Conexão
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {INSTITUTIONS.filter(inst => !connectedInstitutionIds.has(inst.id)).map(inst => (
                <button
                  key={inst.id}
                  onClick={() => onConnectBank(inst)}
                  className="flex flex-col items-center p-4 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                >
                  <img src={inst.logo} alt={inst.nome} className="w-12 h-12 rounded-xl object-contain mb-3 bg-white p-1 shadow-sm group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-700">{inst.nome}</span>
                </button>
              ))}
            </div>
            {INSTITUTIONS.filter(inst => !connectedInstitutionIds.has(inst.id)).length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">Todos os bancos disponíveis já estão conectados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
