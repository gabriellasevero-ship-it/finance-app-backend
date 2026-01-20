import Belvo from 'belvo';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Belvo config
const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;
const BELVO_ENV = process.env.BELVO_ENV || 'sandbox';
const BELVO_BASE_URL = BELVO_ENV === 'production' 
  ? 'https://api.belvo.com' 
  : 'https://sandbox.belvo.com';

// Helper para criar cliente Belvo
async function getBelvoClient() {
  if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
    throw new Error('Belvo não configurado');
  }
  const client = new Belvo(BELVO_SECRET_ID, BELVO_SECRET_PASSWORD, BELVO_BASE_URL);
  await client.connect();
  return client;
}

// Helper para mapear tipo de conta
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

// Helper para CORS
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req;
  const path = url.replace('/api', '').split('?')[0];

  try {
    // ============ HEALTH ============
    if (path === '/health' || path === '') {
      return res.json({ 
        status: 'ok', 
        message: 'API rodando 🚀',
        timestamp: new Date().toISOString()
      });
    }

    // ============ CONNECT BANK (legacy) ============
    if (path === '/connect-bank' && req.method === 'POST') {
      const { institution } = req.body;
      if (!institution) {
        return res.status(400).json({ error: 'Instituição não informada' });
      }
      return res.json({
        message: 'Banco conectado com sucesso',
        institution,
        accounts: [{ id: 'acc_1', name: 'Conta Corrente', balance: 3500 }]
      });
    }

    // ============ DEBTS ============
    if (path === '/debts') {
      if (req.method === 'GET') {
        const { user_id } = req.query;
        let query = supabase.from('debts').select('*');
        if (user_id) query = query.eq('user_id', user_id);
        query = query.eq('ativo', true);
        const { data, error } = await query;
        if (error) throw error;
        return res.json(data || []);
      }
      
      if (req.method === 'POST') {
        const { nome, tipo, parcela_mensal, parcelas_restantes, saldo_estimado, user_id, impacto_psicologico = 3, prioridade_manual = 3 } = req.body;
        if (!user_id) return res.status(400).json({ error: 'user_id é obrigatório' });
        const { data, error } = await supabase.from('debts').insert([{
          nome, tipo, parcela_mensal, parcelas_restantes, saldo_estimado, user_id, impacto_psicologico, prioridade_manual, ativo: true
        }]).select().single();
        if (error) throw error;
        return res.json(data);
      }
    }

    // DEBTS by ID
    if (path.startsWith('/debts/')) {
      const id = path.replace('/debts/', '');
      
      if (req.method === 'PUT') {
        const { data, error } = await supabase.from('debts').update(req.body).eq('id', id).select().single();
        if (error) throw error;
        return res.json(data);
      }
      
      if (req.method === 'DELETE') {
        const { error } = await supabase.from('debts').update({ ativo: false }).eq('id', id);
        if (error) throw error;
        return res.json({ message: 'Dívida deletada com sucesso' });
      }
    }

    // ============ BELVO STATUS ============
    if (path === '/belvo/status') {
      const isConfigured = !!(BELVO_SECRET_ID && BELVO_SECRET_PASSWORD);
      return res.json({
        configured: isConfigured,
        environment: BELVO_ENV,
        message: isConfigured ? 'Belvo está configurado e pronto para uso' : 'Belvo não está configurado.'
      });
    }

    // ============ BELVO WIDGET TOKEN ============
    if (path === '/belvo/widget-token' && req.method === 'POST') {
      const client = await getBelvoClient();
      const { link_id } = req.body || {};
      
      let tokenResponse;
      if (link_id) {
        tokenResponse = await client.widgetToken.create({ link: link_id, scopes: 'read_institutions,write_links,read_links' });
      } else {
        tokenResponse = await client.widgetToken.create();
      }
      
      return res.json({ access: tokenResponse.access, refresh: tokenResponse.refresh, environment: BELVO_ENV });
    }

    // ============ BELVO INSTITUTIONS ============
    if (path === '/belvo/institutions' && req.method === 'GET') {
      const client = await getBelvoClient();
      const { country = 'BR' } = req.query;
      const institutions = await client.institutions.list({ country_code: country, page_size: 100 });
      
      return res.json(institutions.map(inst => ({
        id: inst.name,
        name: inst.display_name,
        type: inst.type,
        logo: inst.logo || null,
        country: inst.country_codes,
        features: inst.features || []
      })));
    }

    // ============ BELVO REGISTER LINK ============
    if (path === '/belvo/register-link' && req.method === 'POST') {
      const { link_id, user_id, institution } = req.body;
      if (!link_id || !user_id) return res.status(400).json({ error: 'link_id e user_id são obrigatórios' });

      const client = await getBelvoClient();
      const linkDetails = await client.links.detail(link_id);

      const { data: savedLink, error: dbError } = await supabase.from('belvo_links').insert([{
        id: link_id, user_id, institution: institution || linkDetails.institution, status: linkDetails.status, created_at: new Date().toISOString()
      }]).select().single();

      if (dbError && dbError.code === '23505') {
        await supabase.from('belvo_links').update({ status: linkDetails.status, updated_at: new Date().toISOString() }).eq('id', link_id);
      }

      const accounts = await client.accounts.retrieve(link_id);
      for (const account of accounts) {
        await supabase.from('accounts').upsert({
          id: account.id, user_id, belvo_link_id: link_id, institution_id: institution || linkDetails.institution,
          tipo: mapAccountType(account.type), saldo_atual: account.balance?.current || 0, nome: account.name, numero: account.number, updated_at: new Date().toISOString()
        });
      }

      return res.json({
        success: true, link: savedLink,
        accounts: accounts.map(acc => ({ id: acc.id, name: acc.name, type: acc.type, balance: acc.balance?.current || 0, currency: acc.currency })),
        message: 'Banco conectado com sucesso!'
      });
    }

    // ============ BELVO LINKS ============
    if (path === '/belvo/links' && req.method === 'GET') {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id é obrigatório' });
      
      const { data, error } = await supabase.from('belvo_links').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    }

    // BELVO LINKS by ID (delete)
    if (path.startsWith('/belvo/links/') && req.method === 'DELETE') {
      const linkId = path.replace('/belvo/links/', '');
      const { user_id } = req.body || {};

      const client = await getBelvoClient();
      await client.links.delete(linkId);
      await supabase.from('belvo_links').delete().eq('id', linkId);
      if (user_id) await supabase.from('accounts').delete().eq('belvo_link_id', linkId).eq('user_id', user_id);

      return res.json({ success: true, message: 'Banco desconectado com sucesso' });
    }

    // ============ BELVO ACCOUNTS ============
    if (path.startsWith('/belvo/accounts/') && req.method === 'GET') {
      const linkId = path.replace('/belvo/accounts/', '');
      const client = await getBelvoClient();
      const accounts = await client.accounts.retrieve(linkId);
      
      return res.json(accounts.map(acc => ({
        id: acc.id, name: acc.name, type: acc.type, subtype: acc.subtype, number: acc.number,
        balance: { current: acc.balance?.current || 0, available: acc.balance?.available || 0 },
        currency: acc.currency, institution: acc.institution
      })));
    }

    // ============ BELVO TRANSACTIONS ============
    if (path.startsWith('/belvo/transactions/') && req.method === 'GET') {
      const linkId = path.replace('/belvo/transactions/', '');
      const { date_from, date_to } = req.query;
      
      const dateTo = date_to || new Date().toISOString().split('T')[0];
      const dateFrom = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const client = await getBelvoClient();
      const transactions = await client.transactions.retrieve(linkId, dateFrom, dateTo);

      return res.json(transactions.map(tx => ({
        id: tx.id, account_id: tx.account?.id, amount: tx.amount, type: tx.type, status: tx.status,
        description: tx.description, category: tx.category, subcategory: tx.subcategory,
        merchant: tx.merchant?.name, value_date: tx.value_date, created_at: tx.created_at
      })));
    }

    // ============ BELVO SYNC ============
    if (path.startsWith('/belvo/sync/') && req.method === 'POST') {
      const linkId = path.replace('/belvo/sync/', '');
      const { user_id } = req.body;
      if (!linkId || !user_id) return res.status(400).json({ error: 'linkId e user_id são obrigatórios' });

      const client = await getBelvoClient();
      const accounts = await client.accounts.retrieve(linkId);

      for (const account of accounts) {
        await supabase.from('accounts').upsert({
          id: account.id, user_id, belvo_link_id: linkId, institution_id: account.institution,
          tipo: mapAccountType(account.type), saldo_atual: account.balance?.current || 0,
          nome: account.name, numero: account.number, updated_at: new Date().toISOString()
        });
      }

      await supabase.from('belvo_links').update({ status: 'valid', last_sync: new Date().toISOString() }).eq('id', linkId);

      return res.json({ success: true, accounts_synced: accounts.length, message: 'Dados sincronizados com sucesso' });
    }

    // ============ 404 ============
    return res.status(404).json({ error: 'Endpoint não encontrado', path });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}
