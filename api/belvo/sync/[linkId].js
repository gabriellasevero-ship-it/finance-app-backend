import Belvo from 'belvo';
import { createClient } from '@supabase/supabase-js';

const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;
const BELVO_ENV = process.env.BELVO_ENV || 'sandbox';

const BELVO_BASE_URL = BELVO_ENV === 'production' 
  ? 'https://api.belvo.com' 
  : 'https://sandbox.belvo.com';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

function mapAccountType(belvoType) {
  const typeMap = {
    'CHECKING': 'corrente',
    'SAVINGS': 'poupanca',
    'CREDIT_CARD': 'cartao',
    'LOAN': 'emprestimo',
    'PENSION': 'previdencia'
  };
  return typeMap[belvoType] || 'corrente';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { linkId } = req.query;
    const { user_id } = req.body;

    if (!linkId || !user_id) {
      return res.status(400).json({ error: 'linkId e user_id são obrigatórios' });
    }

    const client = new Belvo(BELVO_SECRET_ID, BELVO_SECRET_PASSWORD, BELVO_BASE_URL);
    await client.connect();

    // Busca contas atualizadas
    const accounts = await client.accounts.retrieve(linkId);

    // Atualiza no Supabase
    for (const account of accounts) {
      await supabase
        .from('accounts')
        .upsert({
          id: account.id,
          user_id: user_id,
          belvo_link_id: linkId,
          institution_id: account.institution,
          tipo: mapAccountType(account.type),
          saldo_atual: account.balance?.current || 0,
          nome: account.name,
          numero: account.number,
          updated_at: new Date().toISOString()
        });
    }

    // Atualiza status do link
    await supabase
      .from('belvo_links')
      .update({ 
        status: 'valid',
        last_sync: new Date().toISOString() 
      })
      .eq('id', linkId);

    res.json({
      success: true,
      accounts_synced: accounts.length,
      message: 'Dados sincronizados com sucesso'
    });
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    res.status(500).json({ error: 'Erro ao sincronizar dados' });
  }
};
