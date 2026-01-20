const belvoService = require('../services/belvo.service');
const { supabase } = require('../config/database');

/**
 * Verifica se Belvo está configurado
 */
exports.checkStatus = async (req, res) => {
  try {
    const isConfigured = belvoService.isConfigured();
    
    res.json({
      configured: isConfigured,
      environment: belvoService.BELVO_ENV,
      message: isConfigured 
        ? 'Belvo está configurado e pronto para uso' 
        : 'Belvo não está configurado. Configure BELVO_SECRET_ID e BELVO_SECRET_PASSWORD.'
    });
  } catch (error) {
    console.error('Erro ao verificar status Belvo:', error);
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
};

/**
 * Gera token de acesso para o Belvo Connect Widget
 * POST /api/belvo/widget-token
 */
exports.getWidgetToken = async (req, res) => {
  try {
    if (!belvoService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Belvo não configurado',
        message: 'Configure as credenciais Belvo no servidor'
      });
    }

    const { link_id } = req.body;
    
    let tokenResponse;
    if (link_id) {
      // Token para atualizar link existente
      tokenResponse = await belvoService.createWidgetAccessTokenForLink(link_id);
    } else {
      // Token para criar novo link
      tokenResponse = await belvoService.createWidgetAccessToken();
    }

    res.json({
      access: tokenResponse.access,
      refresh: tokenResponse.refresh,
      environment: belvoService.BELVO_ENV
    });
  } catch (error) {
    console.error('Erro ao gerar widget token:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar token do widget',
      details: error.message 
    });
  }
};

/**
 * Lista instituições disponíveis
 * GET /api/belvo/institutions
 */
exports.listInstitutions = async (req, res) => {
  try {
    if (!belvoService.isConfigured()) {
      return res.status(503).json({ error: 'Belvo não configurado' });
    }

    const { country = 'BR' } = req.query;
    
    const institutions = await belvoService.listInstitutions(country);
    
    // Mapeia para formato simplificado
    const simplified = institutions.map(inst => ({
      id: inst.name,
      name: inst.display_name,
      type: inst.type,
      logo: inst.logo || null,
      country: inst.country_codes,
      features: inst.features || []
    }));

    res.json(simplified);
  } catch (error) {
    console.error('Erro ao listar instituições:', error);
    res.status(500).json({ error: 'Erro ao listar instituições' });
  }
};

/**
 * Registra um link após o usuário completar o widget
 * POST /api/belvo/register-link
 */
exports.registerLink = async (req, res) => {
  try {
    const { link_id, user_id, institution } = req.body;

    if (!link_id || !user_id) {
      return res.status(400).json({ 
        error: 'link_id e user_id são obrigatórios' 
      });
    }

    // Verifica o link na Belvo
    const linkDetails = await belvoService.registerLink(link_id);

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
      // Se já existe, atualiza o status
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
    const accounts = await belvoService.getAccounts(link_id);

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

/**
 * Lista links (conexões) de um usuário
 * GET /api/belvo/links
 */
exports.listUserLinks = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }

    const { data: links, error } = await supabase
      .from('belvo_links')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(links || []);
  } catch (error) {
    console.error('Erro ao listar links:', error);
    res.status(500).json({ error: 'Erro ao listar conexões' });
  }
};

/**
 * Busca contas de um link específico
 * GET /api/belvo/accounts/:linkId
 */
exports.getAccounts = async (req, res) => {
  try {
    const { linkId } = req.params;

    if (!linkId) {
      return res.status(400).json({ error: 'linkId é obrigatório' });
    }

    const accounts = await belvoService.getAccounts(linkId);

    res.json(accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      number: acc.number,
      balance: {
        current: acc.balance?.current || 0,
        available: acc.balance?.available || 0
      },
      currency: acc.currency,
      institution: acc.institution
    })));
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    res.status(500).json({ error: 'Erro ao buscar contas' });
  }
};

/**
 * Busca transações de um link
 * GET /api/belvo/transactions/:linkId
 */
exports.getTransactions = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { date_from, date_to } = req.query;

    if (!linkId) {
      return res.status(400).json({ error: 'linkId é obrigatório' });
    }

    // Default: últimos 30 dias
    const dateTo = date_to || new Date().toISOString().split('T')[0];
    const dateFrom = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const transactions = await belvoService.getTransactions(linkId, dateFrom, dateTo);

    res.json(transactions.map(tx => ({
      id: tx.id,
      account_id: tx.account?.id,
      amount: tx.amount,
      type: tx.type,
      status: tx.status,
      description: tx.description,
      category: tx.category,
      subcategory: tx.subcategory,
      merchant: tx.merchant?.name,
      value_date: tx.value_date,
      created_at: tx.created_at
    })));
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
};

/**
 * Sincroniza dados de um link (atualiza contas e saldos)
 * POST /api/belvo/sync/:linkId
 */
exports.syncLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { user_id } = req.body;

    if (!linkId || !user_id) {
      return res.status(400).json({ error: 'linkId e user_id são obrigatórios' });
    }

    // Busca contas atualizadas
    const accounts = await belvoService.getAccounts(linkId);

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

/**
 * Desconecta um banco (remove link)
 * DELETE /api/belvo/links/:linkId
 */
exports.deleteLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { user_id } = req.body;

    if (!linkId) {
      return res.status(400).json({ error: 'linkId é obrigatório' });
    }

    // Remove da Belvo
    await belvoService.deleteLink(linkId);

    // Remove do Supabase
    await supabase
      .from('belvo_links')
      .delete()
      .eq('id', linkId);

    // Remove contas associadas
    if (user_id) {
      await supabase
        .from('accounts')
        .delete()
        .eq('belvo_link_id', linkId)
        .eq('user_id', user_id);
    }

    res.json({
      success: true,
      message: 'Banco desconectado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desconectar banco:', error);
    res.status(500).json({ error: 'Erro ao desconectar banco' });
  }
};

/**
 * Busca saldos das contas
 * GET /api/belvo/balances/:linkId
 */
exports.getBalances = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { date_from, date_to } = req.query;

    if (!linkId) {
      return res.status(400).json({ error: 'linkId é obrigatório' });
    }

    const dateTo = date_to || new Date().toISOString().split('T')[0];
    const dateFrom = date_from || dateTo;

    const balances = await belvoService.getBalances(linkId, dateFrom, dateTo);

    res.json(balances);
  } catch (error) {
    console.error('Erro ao buscar saldos:', error);
    res.status(500).json({ error: 'Erro ao buscar saldos' });
  }
};

// ============ HELPERS ============

/**
 * Mapeia tipo de conta Belvo para tipo interno
 */
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
