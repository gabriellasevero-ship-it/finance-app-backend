
import { DebtType, Institution, Debt } from './types';

export const INSTITUTIONS: Institution[] = [
  { id: 'itau', nome: 'Itaú', logo: 'https://logo.clearbit.com/itau.com.br' },
  { id: 'nubank', nome: 'Nubank', logo: 'https://logo.clearbit.com/nubank.com.br' },
  { id: 'caixa', nome: 'Caixa', logo: 'https://logo.clearbit.com/caixa.gov.br' },
  { id: 'c6', nome: 'C6 Bank', logo: 'https://logo.clearbit.com/c6bank.com.br' },
];

export const INITIAL_DEBTS: Debt[] = [
  {
    id: '1',
    nome: 'Crédito Consignado',
    tipo: DebtType.CONSIGNADO,
    parcela_mensal: 950,
    parcelas_restantes: 24,
    saldo_estimado: 18000,
    impacto_psicologico: 4,
    prioridade_manual: 5,
    ativo: true,
  },
  {
    id: '2',
    nome: 'Empréstimo Pessoal Nubank',
    tipo: DebtType.BANCO,
    parcela_mensal: 450,
    parcelas_restantes: 12,
    saldo_estimado: 4800,
    impacto_psicologico: 3,
    prioridade_manual: 3,
    ativo: true,
  }
];

export const THEME_COLORS = {
  primary: '#0f172a', // Slate 900
  secondary: '#334155', // Slate 700
  accent: '#10b981', // Emerald 500
  danger: '#f43f5e', // Rose 500
  warning: '#f59e0b', // Amber 500
};
