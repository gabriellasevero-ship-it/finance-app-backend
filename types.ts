
export enum DebtType {
  CONSIGNADO = 'Consignado',
  BANCO = 'Banco',
  CONTRATO = 'Contrato',
  CARTAO = 'Cartão de Crédito'
}

export interface User {
  id: string;
  nome: string;
  email: string;
  salario_liquido: number;
}

export interface Institution {
  id: string;
  nome: string;
  logo: string;
}

export interface Account {
  id: string;
  institution_id: string;
  tipo: 'corrente' | 'poupanca';
  saldo_atual: number;
  updated_at: string;
}

export interface Debt {
  id: string;
  nome: string;
  tipo: DebtType;
  parcela_mensal: number;
  parcelas_restantes: number;
  saldo_estimado: number;
  impacto_psicologico: number; // 1-5
  prioridade_manual: number; // 1-5
  ativo: boolean;
}

export interface SimulationResult {
  scenario: string;
  salario_liberado: number;
  meses_reduzidos: number;
  tempo_total_restante: number;
}

export interface Alert {
  id: string;
  tipo: 'comprometimento' | 'evento' | 'conquista';
  mensagem: string;
  visto: boolean;
  created_at: string;
}
