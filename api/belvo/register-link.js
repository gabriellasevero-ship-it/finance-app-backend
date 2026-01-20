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
    const { link_id, user_id, institution } = req.body;

    if (!link_id || !user_id) {
      return res.status(400).json({ 
        error: 'link_id e user_id são obrigatórios' 
      });
    }

    const client = new Belvo(BELVO_SECRET_ID, BELVO_SECRET_PASSWORD, BELVO_BASE_URL);
    await client.connect();

    // Verifica o link na Belvo
    const linkDetails = await client.links.detail(link_id);

    // Salva no Supabase
    const { data: savedLink, error: dbError } = await supabase
      .from('belvo_links')
      .insert([{
        id: link_id,
        user_id: user_id,
        institution: institution || linkDetails.institution,
        status: linkDetails.status,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
        const { data: updatedLink } = await supabase
          .from('belvo_links')
          .update({ status: linkDetails.status, updated_at: new Date().toISOString() })
          .eq('id', link_id)
          .select()
          .single();
        
        return res.json({
          success: true,
          link: updatedLink,
          message: 'Link atualizado com sucesso'
        });
      }
      throw dbError;
    }

    // Busca contas associadas ao link
    const accounts = await client.accounts.retrieve(link_id);

    // Salva as contas no Supabase
    for (const account of accounts) {
      await supabase
        .from('accounts')
        .upsert({
          id: account.id,
          user_id: user_id,
          belvo_link_id: link_id,
          institution_id: institution || linkDetails.institution,
          tipo: mapAccountType(account.type),
          saldo_atual: account.balance?.current || 0,
          nome: account.name,
          numero: account.number,
          updated_at: new Date().toISOString()
        });
    }

    res.json({
      success: true,
      link: savedLink,
      accounts: accounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance: acc.balance?.current || 0,
        currency: acc.currency
      })),
      message: 'Banco conectado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao registrar link:', error);
    res.status(500).json({ 
      error: 'Erro ao registrar conexão bancária',
      details: error.message 
    });
  }
};
