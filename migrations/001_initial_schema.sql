-- ============================================
-- Migration: Initial Schema
-- Descrição: Cria todas as tabelas necessárias
-- Esta migration pode ser executada múltiplas vezes com segurança
-- ============================================

-- Primeiro, dropar tudo que já existe (se necessário para recomeçar do zero)
-- Comente estas linhas se quiser manter dados existentes:
-- DROP TABLE IF EXISTS alerts CASCADE;
-- DROP TABLE IF EXISTS debts CASCADE;
-- DROP TABLE IF EXISTS accounts CASCADE;
-- DROP TABLE IF EXISTS institutions CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Dropar políticas existentes (se houver tabelas)
DO $$ 
BEGIN
  -- Dropar políticas de users
  DROP POLICY IF EXISTS "Users can view own data" ON public.users;
  DROP POLICY IF EXISTS "Users can update own data" ON public.users;
  DROP POLICY IF EXISTS "Users can do all" ON public.users;
  
  -- Dropar políticas de debts
  DROP POLICY IF EXISTS "Users can view own debts" ON public.debts;
  DROP POLICY IF EXISTS "Users can manage own debts" ON public.debts;
  DROP POLICY IF EXISTS "Users can do all debts" ON public.debts;
  
  -- Dropar políticas de accounts
  DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
  DROP POLICY IF EXISTS "Users can manage own accounts" ON public.accounts;
  DROP POLICY IF EXISTS "Users can do all accounts" ON public.accounts;
  
  -- Dropar políticas de alerts
  DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
  DROP POLICY IF EXISTS "Users can do all alerts" ON public.alerts;
END $$;

-- Desabilitar RLS temporariamente (se as tabelas existirem)
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alerts DISABLE ROW LEVEL SECURITY;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  salario_liquido DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Criar índice único para email (se não existir)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON public.users(email) WHERE email IS NOT NULL;

-- Tabela de Instituições Financeiras
CREATE TABLE IF NOT EXISTS public.institutions (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Inserir instituições padrão (só se não existirem)
INSERT INTO public.institutions (id, nome, logo) VALUES
  ('itau', 'Itaú', 'https://logo.clearbit.com/itau.com.br'),
  ('nubank', 'Nubank', 'https://logo.clearbit.com/nubank.com.br'),
  ('caixa', 'Caixa', 'https://logo.clearbit.com/caixa.gov.br'),
  ('c6', 'C6 Bank', 'https://logo.clearbit.com/c6bank.com.br')
ON CONFLICT (id) DO NOTHING;

-- Tabela de Contas Bancárias
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'poupanca')),
  saldo_atual DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Adicionar foreign keys apenas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_accounts_user'
  ) THEN
    ALTER TABLE public.accounts 
    ADD CONSTRAINT fk_accounts_user 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_accounts_institution'
  ) THEN
    ALTER TABLE public.accounts 
    ADD CONSTRAINT fk_accounts_institution 
    FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
  END IF;
END $$;

-- Tabela de Dívidas
CREATE TABLE IF NOT EXISTS public.debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Consignado', 'Banco', 'Contrato', 'Cartão de Crédito')),
  parcela_mensal DECIMAL(10, 2) NOT NULL,
  parcelas_restantes INTEGER NOT NULL,
  saldo_estimado DECIMAL(10, 2) NOT NULL,
  impacto_psicologico INTEGER CHECK (impacto_psicologico >= 1 AND impacto_psicologico <= 5) DEFAULT 3,
  prioridade_manual INTEGER CHECK (prioridade_manual >= 1 AND prioridade_manual <= 5) DEFAULT 3,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Adicionar foreign key apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_debts_user'
  ) THEN
    ALTER TABLE public.debts 
    ADD CONSTRAINT fk_debts_user 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Tabela de Alertas
CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('comprometimento', 'evento', 'conquista')),
  mensagem TEXT NOT NULL,
  visto BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Adicionar foreign key apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_alerts_user'
  ) THEN
    ALTER TABLE public.alerts 
    ADD CONSTRAINT fk_alerts_user 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_ativo ON public.debts(ativo);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_institution_id ON public.accounts(institution_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_visto ON public.alerts(visto);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar triggers existentes antes de criar
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
DROP TRIGGER IF EXISTS update_debts_updated_at ON public.debts;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at 
  BEFORE UPDATE ON public.debts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simplificadas para desenvolvimento
-- Permitem acesso total quando autenticação não está configurada
-- Para produção, ajuste essas políticas para usar auth.uid()

-- Política para users: permitir tudo durante desenvolvimento
CREATE POLICY "Users can do all" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- Política para debts: permitir tudo durante desenvolvimento
CREATE POLICY "Users can do all debts" ON public.debts
  FOR ALL USING (true) WITH CHECK (true);

-- Política para accounts: permitir tudo durante desenvolvimento
CREATE POLICY "Users can do all accounts" ON public.accounts
  FOR ALL USING (true) WITH CHECK (true);

-- Política para alerts: permitir tudo durante desenvolvimento
CREATE POLICY "Users can do all alerts" ON public.alerts
  FOR ALL USING (true) WITH CHECK (true);
