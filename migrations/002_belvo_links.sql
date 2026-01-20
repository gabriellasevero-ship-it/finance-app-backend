-- Migration: Adiciona suporte a conexões Belvo (Open Finance)
-- Criado em: 2026-01-19
-- NOTA: Esta versão usa UUID para compatibilidade com o schema existente

-- ============ LIMPAR TENTATIVAS ANTERIORES ============
DROP TABLE IF EXISTS belvo_transactions CASCADE;
DROP TABLE IF EXISTS belvo_links CASCADE;

-- Remover colunas se existirem
ALTER TABLE accounts DROP COLUMN IF EXISTS belvo_link_id;
ALTER TABLE accounts DROP COLUMN IF EXISTS nome;
ALTER TABLE accounts DROP COLUMN IF EXISTS numero;

-- ============ TABELA BELVO_LINKS ============
-- Armazena as conexões bancárias criadas via Belvo

CREATE TABLE belvo_links (
  id TEXT PRIMARY KEY,                    -- ID do link na Belvo (string)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,              -- Nome/ID da instituição na Belvo
  status TEXT DEFAULT 'valid',            -- Status: valid, invalid, unconfirmed, token_required
  access_mode TEXT DEFAULT 'recurrent',   -- single ou recurrent
  last_sync TIMESTAMPTZ,                  -- Última sincronização
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_belvo_links_user_id ON belvo_links(user_id);
CREATE INDEX idx_belvo_links_institution ON belvo_links(institution);
CREATE INDEX idx_belvo_links_status ON belvo_links(status);

-- ============ ATUALIZA TABELA ACCOUNTS ============
-- Adiciona referência ao link Belvo nas contas

ALTER TABLE accounts 
ADD COLUMN belvo_link_id TEXT REFERENCES belvo_links(id) ON DELETE SET NULL;

ALTER TABLE accounts 
ADD COLUMN nome TEXT;

ALTER TABLE accounts 
ADD COLUMN numero TEXT;

-- Índice para buscar contas por link
CREATE INDEX idx_accounts_belvo_link ON accounts(belvo_link_id);

-- ============ TABELA BELVO_TRANSACTIONS ============
-- Armazena transações sincronizadas da Belvo (opcional, para cache/histórico)

CREATE TABLE belvo_transactions (
  id TEXT PRIMARY KEY,                    -- ID da transação na Belvo
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  belvo_link_id TEXT REFERENCES belvo_links(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  type TEXT,                              -- INFLOW, OUTFLOW
  status TEXT,                            -- PENDING, PROCESSED, UNCATEGORIZED
  description TEXT,
  category TEXT,
  subcategory TEXT,
  merchant TEXT,
  value_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries comuns
CREATE INDEX idx_belvo_transactions_user ON belvo_transactions(user_id);
CREATE INDEX idx_belvo_transactions_account ON belvo_transactions(account_id);
CREATE INDEX idx_belvo_transactions_date ON belvo_transactions(value_date);
CREATE INDEX idx_belvo_transactions_category ON belvo_transactions(category);

-- ============ RLS (Row Level Security) ============

ALTER TABLE belvo_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE belvo_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas para desenvolvimento (permite tudo)
CREATE POLICY "Allow all on belvo_links" ON belvo_links
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on belvo_transactions" ON belvo_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- ============ TRIGGER PARA ATUALIZAR updated_at ============

CREATE OR REPLACE FUNCTION update_belvo_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_belvo_links_updated_at
  BEFORE UPDATE ON belvo_links
  FOR EACH ROW
  EXECUTE FUNCTION update_belvo_links_updated_at();

-- ============ COMENTÁRIOS ============

COMMENT ON TABLE belvo_links IS 'Conexões bancárias via Belvo Open Finance';
COMMENT ON TABLE belvo_transactions IS 'Cache de transações sincronizadas da Belvo';
