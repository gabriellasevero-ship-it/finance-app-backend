
import React, { useState } from 'react';
import { Debt, DebtType } from '../types';

interface DebtManagerProps {
  debts: Debt[];
  onUpdate: (debt: Debt) => void;
  onAdd: (debt: Debt) => void;
  onRemove: (id: string) => void;
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, onUpdate, onAdd, onRemove }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDebt, setNewDebt] = useState<Partial<Debt>>({
    nome: '',
    tipo: DebtType.BANCO,
    parcela_mensal: 0,
    parcelas_restantes: 1,
    saldo_estimado: 0,
    impacto_psicologico: 3,
    prioridade_manual: 3,
    ativo: true
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newDebt as Debt);
    setShowAddModal(false);
    setNewDebt({
      nome: '', tipo: DebtType.BANCO, parcela_mensal: 0, parcelas_restantes: 1, saldo_estimado: 0, impacto_psicologico: 3, prioridade_manual: 3, ativo: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Centro de Ataque</h1>
          <p className="text-slate-500">Gerencie e priorize suas dívidas estrategicamente.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Nova Dívida
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {debts.map(debt => (
          <div key={debt.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onRemove(debt.id)} className="text-slate-300 hover:text-rose-500">
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
            
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded mb-2 inline-block">
                  {debt.tipo}
                </span>
                <h3 className="text-xl font-bold text-slate-900">{debt.nome}</h3>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Parcela Mensal</p>
                <p className="text-lg font-bold text-slate-900">R$ {debt.parcela_mensal.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Saldo Devedor</p>
                <p className="font-bold text-slate-700">R$ {debt.saldo_estimado.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Tempo Restante</p>
                <p className="font-bold text-slate-700">{debt.parcelas_restantes} meses</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Peso Emocional:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button 
                      key={i} 
                      onClick={() => onUpdate({ ...debt, impacto_psicologico: i })}
                      className={`w-3 h-3 rounded-full transition-colors ${i <= debt.impacto_psicologico ? 'bg-rose-400' : 'bg-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
              <button className="text-emerald-600 text-xs font-bold hover:underline">Simular Quitação</button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Cadastrar Dívida</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Identificação da Dívida</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="Ex: Consignado Banco X" value={newDebt.nome} onChange={e => setNewDebt({...newDebt, nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={newDebt.tipo} onChange={e => setNewDebt({...newDebt, tipo: e.target.value as DebtType})}>
                    {Object.values(DebtType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Valor da Parcela</label>
                  <input required type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="0,00" value={newDebt.parcela_mensal || ''} onChange={e => setNewDebt({...newDebt, parcela_mensal: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Parcelas Restantes</label>
                  <input required type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="Ex: 24" value={newDebt.parcelas_restantes || ''} onChange={e => setNewDebt({...newDebt, parcelas_restantes: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Saldo Devedor (Est.)</label>
                  <input required type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="0,00" value={newDebt.saldo_estimado || ''} onChange={e => setNewDebt({...newDebt, saldo_estimado: Number(e.target.value)})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all">Salvar Dívida</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManager;
