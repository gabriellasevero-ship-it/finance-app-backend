import React, { useState, useEffect } from 'react';
import { User, Account, Institution } from '../types';
import { INSTITUTIONS } from '../constants';
import { api } from '../services/api';
import BelvoWidget from './BelvoWidget';

interface SettingsProps {
  user: User;
  onUpdateUser: (userData: User) => void;
  accounts: Account[];
  onConnectBank: (institution: Institution) => void;
  onDisconnectBank: (institutionId: string) => void;
}

interface BelvoLink {
  id: string;
  institution: string;
  status: string;
  last_sync?: string;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, accounts, onConnectBank, onDisconnectBank }) => {
  const [salario, setSalario] = useState(user.salario_liquido);
  const [nome, setNome] = useState(user.nome);
  
  // Estados para Belvo
  const [belvoConfigured, setBelvoConfigured] = useState<boolean | null>(null);
  const [belvoLinks, setBelvoLinks] = useState<BelvoLink[]>([]);
  const [showBelvoWidget, setShowBelvoWidget] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string | undefined>();
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const connectedInstitutionIds = new Set(accounts.map(a => a.institution_id));

  // Verifica se Belvo está configurado e carrega links
  useEffect(() => {
    const checkBelvoStatus = async () => {
      const status = await api.belvo.checkStatus();
      setBelvoConfigured(status.success);
      
      if (status.success) {
        const linksResponse = await api.belvo.listLinks(user.id);
        if (linksResponse.success && linksResponse.data) {
          setBelvoLinks(linksResponse.data);
        }
      }
    };
    
    checkBelvoStatus();
  }, [user.id]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ ...user, nome, salario_liquido: salario });
    alert("Perfil atualizado com sucesso!");
  };

  // Handler para conectar via Belvo
  const handleConnectWithBelvo = (institution?: string) => {
    setSelectedInstitution(institution);
    setShowBelvoWidget(true);
  };

  // Handler de sucesso do widget Belvo
  const handleBelvoSuccess = async (linkId: string, institution: string, accounts: unknown[]) => {
    setShowBelvoWidget(false);
    
    // Atualiza a lista de links
    const linksResponse = await api.belvo.listLinks(user.id);
    if (linksResponse.success && linksResponse.data) {
      setBelvoLinks(linksResponse.data);
    }

    // Notifica o componente pai sobre as novas contas
    // Aqui você pode adaptar para o formato esperado pelo App.tsx
    alert(`Banco ${institution} conectado com sucesso! ${(accounts as unknown[]).length} conta(s) sincronizada(s).`);
  };

  // Handler para sincronizar dados de um link
  const handleSyncLink = async (linkId: string) => {
    setIsSyncing(linkId);
    
    const result = await api.belvo.syncLink(linkId, user.id);
    
    if (result.success) {
      alert('Dados sincronizados com sucesso!');
      // Atualiza lista de links
      const linksResponse = await api.belvo.listLinks(user.id);
      if (linksResponse.success && linksResponse.data) {
        setBelvoLinks(linksResponse.data);
      }
    } else {
      alert('Erro ao sincronizar: ' + result.message);
    }
    
    setIsSyncing(null);
  };

  // Handler para desconectar via Belvo
  const handleDisconnectBelvo = async (linkId: string) => {
    if (!confirm('Deseja realmente desconectar este banco?')) return;
    
    const result = await api.belvo.deleteLink(linkId, user.id);
    
    if (result.success) {
      setBelvoLinks(prev => prev.filter(l => l.id !== linkId));
      alert('Banco desconectado com sucesso!');
    } else {
      alert('Erro ao desconectar: ' + result.message);
    }
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

          {/* Status Belvo */}
          <div className={`p-6 rounded-3xl border ${belvoConfigured ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
            <h4 className={`font-bold mb-2 flex items-center gap-2 ${belvoConfigured ? 'text-emerald-900' : 'text-amber-900'}`}>
              <i className={`fa-solid ${belvoConfigured ? 'fa-check-circle' : 'fa-info-circle'}`}></i> 
              Open Finance (Belvo)
            </h4>
            <p className={`text-sm ${belvoConfigured ? 'text-emerald-700' : 'text-amber-700'}`}>
              {belvoConfigured === null 
                ? 'Verificando status...' 
                : belvoConfigured 
                  ? 'Integração ativa. Conecte seus bancos de forma segura.' 
                  : 'Integração não configurada. Usando modo de demonstração.'}
            </p>
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
          {/* Bancos Conectados via Belvo */}
          {belvoConfigured && belvoLinks.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <i className="fa-solid fa-shield-check text-emerald-500"></i> Conexões Open Finance
              </h3>
              <div className="space-y-4">
                {belvoLinks.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-slate-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-building-columns text-white"></i>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{link.institution}</p>
                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <i className="fa-solid fa-lock text-[10px]"></i>
                          Conexão segura via Open Finance
                          {link.last_sync && (
                            <span className="text-slate-400 ml-2">
                              • Última sync: {new Date(link.last_sync).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleSyncLink(link.id)}
                        disabled={isSyncing === link.id}
                        className="text-emerald-600 hover:text-emerald-700 font-bold text-sm transition-colors disabled:opacity-50"
                      >
                        {isSyncing === link.id ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fa-solid fa-rotate"></i>
                        )}
                      </button>
                      <button 
                        onClick={() => handleDisconnectBelvo(link.id)}
                        className="text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bancos Conectados (modo legado/demo) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-link text-emerald-500"></i> 
              {belvoConfigured ? 'Conexões de Demonstração' : 'Bancos Conectados'}
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
                        <p className="text-xs text-slate-500 font-medium">
                          {belvoConfigured ? 'Modo demonstração' : 'Sincronizado via Open Finance'}
                        </p>
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
              {connectedInstitutionIds.size === 0 && belvoLinks.length === 0 && (
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
            
            {/* Botão principal para Open Finance */}
            {belvoConfigured && (
              <div className="mb-6">
                <button
                  onClick={() => handleConnectWithBelvo()}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                >
                  <i className="fa-solid fa-building-columns text-lg"></i>
                  <span>Conectar Banco via Open Finance</span>
                  <i className="fa-solid fa-shield-check text-emerald-200"></i>
                </button>
                <p className="text-center text-xs text-slate-500 mt-2">
                  Conexão segura e criptografada. Seus dados bancários nunca são armazenados.
                </p>
              </div>
            )}

            {/* Lista de bancos para modo demo ou fallback */}
            <div className={belvoConfigured ? 'opacity-60' : ''}>
              {belvoConfigured && (
                <p className="text-xs text-slate-400 mb-4 text-center">
                  Ou use o modo de demonstração:
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {INSTITUTIONS.filter(inst => !connectedInstitutionIds.has(inst.id)).map(inst => (
                  <button
                    key={inst.id}
                    onClick={() => belvoConfigured ? handleConnectWithBelvo(inst.id) : onConnectBank(inst)}
                    className="flex flex-col items-center p-4 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                  >
                    <img src={inst.logo} alt={inst.nome} className="w-12 h-12 rounded-xl object-contain mb-3 bg-white p-1 shadow-sm group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-700">{inst.nome}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {INSTITUTIONS.filter(inst => !connectedInstitutionIds.has(inst.id)).length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">Todos os bancos disponíveis já estão conectados.</p>
            )}
          </div>
        </div>
      </div>

      {/* Belvo Widget Modal */}
      {showBelvoWidget && (
        <BelvoWidget
          userId={user.id}
          institution={selectedInstitution}
          onSuccess={handleBelvoSuccess}
          onError={(error) => {
            setShowBelvoWidget(false);
            alert('Erro: ' + error);
          }}
          onClose={() => setShowBelvoWidget(false)}
        />
      )}
    </div>
  );
};

export default Settings;
