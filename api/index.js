// Helper para CORS
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Lazy load dependencies
let supabase = null;
let BelvoClass = null;

function getSupabase() {
  if (!supabase) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
    );
  }
  return supabase;
}

async function getBelvoClient() {
  const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
  const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;
  const BELVO_ENV = process.env.BELVO_ENV || 'sandbox';
  const BELVO_BASE_URL = BELVO_ENV === 'production' ? 'https://api.belvo.com' : 'https://sandbox.belvo.com';
  
  if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
    throw new Error('Belvo não configurado. BELVO_SECRET_ID ou BELVO_SECRET_PASSWORD não definidos.');
  }
  
  if (!BelvoClass) {
    BelvoClass = require('belvo').default;
  }
  
  try {
    const client = new BelvoClass(BELVO_SECRET_ID, BELVO_SECRET_PASSWORD, BELVO_BASE_URL);
    await client.connect();
    return client;
  } catch (connectError) {
    console.error('Erro ao conectar com Belvo:', connectError);
    const errorMessage = connectError.response?.data?.detail || connectError.message || 'Falha na autenticação';
    throw new Error(`Falha ao autenticar com Belvo (${BELVO_ENV}): ${errorMessage}`);
  }
}

function mapAccountType(belvoType) {
  const typeMap = { 'CHECKING': 'corrente', 'SAVINGS': 'poupanca', 'CREDIT_CARD': 'cartao', 'LOAN': 'emprestimo', 'PENSION': 'previdencia' };
  return typeMap[belvoType] || 'corrente';
}

export default async function handler(req, res) {
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawPath = req.url || '';
  const path = rawPath.replace('/api', '').split('?')[0] || '';
  const BELVO_ENV = process.env.BELVO_ENV || 'sandbox';

  // Debug: log do path para diagnóstico
  console.log('Request path:', { rawPath, parsedPath: path, method: req.method });

  try {
    // ============ HEALTH ============
    if (path === '/health' || path === '' || path === '/') {
      return res.json({ 
        status: 'ok', 
        message: 'API rodando',
        timestamp: new Date().toISOString()
      });
    }

    // ============ CONNECT BANK (legacy) ============
    if (path === '/connect-bank' && req.method === 'POST') {
      const { institution } = req.body || {};
      if (!institution) return res.status(400).json({ error: 'Instituição não informada' });
      return res.json({
        message: 'Banco conectado com sucesso',
        institution,
        accounts: [{ id: 'acc_1', name: 'Conta Corrente', balance: 3500 }]
      });
    }

    // ============ DEBTS ============
    if (path === '/debts') {
      const db = getSupabase();
      if (req.method === 'GET') {
        const user_id = req.query?.user_id;
        let query = db.from('debts').select('*');
        if (user_id) query = query.eq('user_id', user_id);
        query = query.eq('ativo', true);
        const { data, error } = await query;
        if (error) throw error;
        return res.json(data || []);
      }
      
      if (req.method === 'POST') {
        const { nome, tipo, parcela_mensal, parcelas_restantes, saldo_estimado, user_id, impacto_psicologico = 3, prioridade_manual = 3 } = req.body || {};
        if (!user_id) return res.status(400).json({ error: 'user_id é obrigatório' });
        const { data, error } = await db.from('debts').insert([{
          nome, tipo, parcela_mensal, parcelas_restantes, saldo_estimado, user_id, impacto_psicologico, prioridade_manual, ativo: true
        }]).select().single();
        if (error) throw error;
        return res.json(data);
      }
    }

    // DEBTS by ID
    if (path.startsWith('/debts/')) {
      const db = getSupabase();
      const id = path.replace('/debts/', '');
      
      if (req.method === 'PUT') {
        const { data, error } = await db.from('debts').update(req.body).eq('id', id).select().single();
        if (error) throw error;
        return res.json(data);
      }
      
      if (req.method === 'DELETE') {
        const { error } = await db.from('debts').update({ ativo: false }).eq('id', id);
        if (error) throw error;
        return res.json({ message: 'Dívida deletada com sucesso' });
      }
    }

    // ============ BELVO STATUS ============
    if (path === '/belvo/status') {
      const isConfigured = !!(process.env.BELVO_SECRET_ID && process.env.BELVO_SECRET_PASSWORD);
      return res.json({
        configured: isConfigured,
        environment: BELVO_ENV,
        message: isConfigured ? 'Belvo está configurado e pronto para uso' : 'Belvo não está configurado.'
      });
    }

    // ============ BELVO DEBUG (não expõe credenciais completas) ============
    if (path === '/belvo/debug') {
      const secretId = process.env.BELVO_SECRET_ID || '';
      const secretPassword = process.env.BELVO_SECRET_PASSWORD || '';
      const belvoEnv = process.env.BELVO_ENV || 'sandbox';
      
      // Mascara as credenciais para debug seguro
      const maskCredential = (str) => {
        if (!str) return '(não definido)';
        if (str.length <= 8) return `${str.substring(0, 2)}***`;
        return `${str.substring(0, 4)}...${str.substring(str.length - 4)} (${str.length} chars)`;
      };

      const debugInfo = {
        timestamp: new Date().toISOString(),
        environment: belvoEnv,
        baseUrl: belvoEnv === 'production' ? 'https://api.belvo.com' : 'https://sandbox.belvo.com',
        credentials: {
          secretId: {
            defined: !!secretId,
            preview: maskCredential(secretId),
            length: secretId.length
          },
          secretPassword: {
            defined: !!secretPassword,
            preview: maskCredential(secretPassword),
            length: secretPassword.length
          }
        },
        envVarsAvailable: {
          BELVO_SECRET_ID: !!process.env.BELVO_SECRET_ID,
          BELVO_SECRET_PASSWORD: !!process.env.BELVO_SECRET_PASSWORD,
          BELVO_ENV: !!process.env.BELVO_ENV,
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY
        }
      };

      // Tenta conectar para testar as credenciais
      try {
        const client = await getBelvoClient();
        debugInfo.connectionTest = {
          success: true,
          message: 'Conexão com Belvo estabelecida com sucesso'
        };
      } catch (testError) {
        debugInfo.connectionTest = {
          success: false,
          error: testError.message,
          hint: 'Verifique se as credenciais estão corretas no painel do Belvo'
        };
      }

      return res.json(debugInfo);
    }

    // ============ BELVO WIDGET TOKEN ============
    if (path === '/belvo/widget-token' && req.method === 'POST') {
      try {
        const client = await getBelvoClient();
        const { link_id } = req.body || {};
        
        let tokenResponse;
        if (link_id) {
          tokenResponse = await client.widgetToken.create({ link: link_id, scopes: 'read_institutions,write_links,read_links' });
        } else {
          tokenResponse = await client.widgetToken.create();
        }
        
        return res.json({ access: tokenResponse.access, refresh: tokenResponse.refresh, environment: BELVO_ENV });
      } catch (tokenError) {
        console.error('Erro ao obter widget token:', tokenError);
        const errorMessage = tokenError.message || 'Erro desconhecido';
        const errorDetails = tokenError.response?.data || tokenError.detail || null;
        
        return res.status(500).json({ 
          error: 'Erro ao gerar token do widget',
          message: errorMessage,
          details: errorDetails,
          hint: 'Verifique se as credenciais BELVO_SECRET_ID e BELVO_SECRET_PASSWORD estão corretas e se a conta Belvo está ativa.'
        });
      }
    }

    // ============ BELVO INSTITUTIONS ============
    if (path === '/belvo/institutions' && req.method === 'GET') {
      const client = await getBelvoClient();
      const country = req.query?.country || 'BR';
      const institutions = await client.institutions.list({ country_code: country, page_size: 100 });
      
      return res.json(institutions.map(inst => ({
        id: inst.name, name: inst.display_name, type: inst.type, logo: inst.logo || null, country: inst.country_codes, features: inst.features || []
      })));
    }

    // ============ BELVO REGISTER LINK ============
    if (path === '/belvo/register-link' && req.method === 'POST') {
      const db = getSupabase();
      const { link_id, user_id, institution } = req.body || {};
      if (!link_id || !user_id) return res.status(400).json({ error: 'link_id e user_id são obrigatórios' });

      const client = await getBelvoClient();
      const linkDetails = await client.links.detail(link_id);

      const { data: savedLink, error: dbError } = await db.from('belvo_links').insert([{
        id: link_id, user_id, institution: institution || linkDetails.institution, status: linkDetails.status, created_at: new Date().toISOString()
      }]).select().single();

      if (dbError && dbError.code === '23505') {
        await db.from('belvo_links').update({ status: linkDetails.status, updated_at: new Date().toISOString() }).eq('id', link_id);
      }

      const accounts = await client.accounts.retrieve(link_id);
      for (const account of accounts) {
        await db.from('accounts').upsert({
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
      const db = getSupabase();
      const user_id = req.query?.user_id;
      if (!user_id) return res.status(400).json({ error: 'user_id é obrigatório' });
      
      const { data, error } = await db.from('belvo_links').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    }

    // BELVO LINKS by ID (delete)
    if (path.startsWith('/belvo/links/') && req.method === 'DELETE') {
      const db = getSupabase();
      const linkId = path.replace('/belvo/links/', '');
      const { user_id } = req.body || {};

      const client = await getBelvoClient();
      await client.links.delete(linkId);
      await db.from('belvo_links').delete().eq('id', linkId);
      if (user_id) await db.from('accounts').delete().eq('belvo_link_id', linkId).eq('user_id', user_id);

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
      const date_from = req.query?.date_from;
      const date_to = req.query?.date_to;
      
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
      const db = getSupabase();
      const linkId = path.replace('/belvo/sync/', '');
      const { user_id } = req.body || {};
      if (!linkId || !user_id) return res.status(400).json({ error: 'linkId e user_id são obrigatórios' });

      const client = await getBelvoClient();
      const accounts = await client.accounts.retrieve(linkId);

      for (const account of accounts) {
        await db.from('accounts').upsert({
          id: account.id, user_id, belvo_link_id: linkId, institution_id: account.institution,
          tipo: mapAccountType(account.type), saldo_atual: account.balance?.current || 0,
          nome: account.name, numero: account.number, updated_at: new Date().toISOString()
        });
      }

      await db.from('belvo_links').update({ status: 'valid', last_sync: new Date().toISOString() }).eq('id', linkId);

      return res.json({ success: true, accounts_synced: accounts.length, message: 'Dados sincronizados com sucesso' });
    }

    // ============ 404 ============
    return res.status(404).json({ error: 'Endpoint não encontrado', path });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}
