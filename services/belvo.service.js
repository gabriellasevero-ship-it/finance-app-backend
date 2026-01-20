const Belvo = require('belvo').default;

// Configuração do cliente Belvo
// Em sandbox: https://sandbox.belvo.com
// Em produção: https://api.belvo.com
const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;
const BELVO_ENV = process.env.BELVO_ENV || 'sandbox'; // 'sandbox' ou 'production'

const BELVO_BASE_URL = BELVO_ENV === 'production' 
  ? 'https://api.belvo.com' 
  : 'https://sandbox.belvo.com';

let belvoClient = null;

/**
 * Inicializa e retorna o cliente Belvo
 */
const getClient = async () => {
  if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
    throw new Error('Credenciais Belvo não configuradas. Configure BELVO_SECRET_ID e BELVO_SECRET_PASSWORD.');
  }

  if (!belvoClient) {
    belvoClient = new Belvo(BELVO_SECRET_ID, BELVO_SECRET_PASSWORD, BELVO_BASE_URL);
    await belvoClient.connect();
  }

  return belvoClient;
};

/**
 * Verifica se as credenciais Belvo estão configuradas
 */
const isConfigured = () => {
  return !!(BELVO_SECRET_ID && BELVO_SECRET_PASSWORD);
};

// ============ WIDGET ACCESS TOKEN ============

/**
 * Gera um token de acesso para o Belvo Connect Widget
 * O widget permite que o usuário conecte suas contas de forma segura
 */
const createWidgetAccessToken = async () => {
  const client = await getClient();
  
  const response = await client.widgetToken.create();
  return response;
};

/**
 * Gera token de acesso com escopo específico (para atualizar link existente)
 */
const createWidgetAccessTokenForLink = async (linkId) => {
  const client = await getClient();
  
  const response = await client.widgetToken.create({
    link: linkId,
    scopes: 'read_institutions,write_links,read_links'
  });
  return response;
};

// ============ INSTITUTIONS ============

/**
 * Lista todas as instituições disponíveis
 * @param {string} countryCode - Código do país (BR, MX, CO)
 */
const listInstitutions = async (countryCode = 'BR') => {
  const client = await getClient();
  
  const institutions = await client.institutions.list({
    country_code: countryCode,
    page_size: 100
  });
  
  return institutions;
};

/**
 * Busca detalhes de uma instituição específica
 */
const getInstitution = async (institutionId) => {
  const client = await getClient();
  
  const institution = await client.institutions.detail(institutionId);
  return institution;
};

// ============ LINKS ============

/**
 * Registra um link criado pelo widget
 * Após o usuário completar o fluxo no widget, recebemos o link_id
 */
const registerLink = async (linkId) => {
  const client = await getClient();
  
  // Busca detalhes do link para confirmar que foi criado
  const link = await client.links.detail(linkId);
  return link;
};

/**
 * Lista todos os links (conexões) do usuário
 */
const listLinks = async () => {
  const client = await getClient();
  
  const links = await client.links.list();
  return links;
};

/**
 * Busca detalhes de um link específico
 */
const getLinkDetails = async (linkId) => {
  const client = await getClient();
  
  const link = await client.links.detail(linkId);
  return link;
};

/**
 * Atualiza as credenciais de um link (quando expiram)
 */
const updateLink = async (linkId, password, password2 = null) => {
  const client = await getClient();
  
  const updateData = { password };
  if (password2) {
    updateData.password2 = password2;
  }
  
  const link = await client.links.update(linkId, updateData);
  return link;
};

/**
 * Remove um link (desconecta o banco)
 */
const deleteLink = async (linkId) => {
  const client = await getClient();
  
  await client.links.delete(linkId);
  return { success: true };
};

// ============ ACCOUNTS ============

/**
 * Busca todas as contas de um link
 */
const getAccounts = async (linkId) => {
  const client = await getClient();
  
  const accounts = await client.accounts.retrieve(linkId);
  return accounts;
};

/**
 * Lista contas com filtros
 */
const listAccounts = async (filters = {}) => {
  const client = await getClient();
  
  const accounts = await client.accounts.list(filters);
  return accounts;
};

// ============ BALANCES ============

/**
 * Busca saldos das contas de um link
 */
const getBalances = async (linkId, dateFrom, dateTo) => {
  const client = await getClient();
  
  const balances = await client.balances.retrieve(linkId, dateFrom, dateTo);
  return balances;
};

// ============ TRANSACTIONS ============

/**
 * Busca transações de um link em um período
 * @param {string} linkId - ID do link
 * @param {string} dateFrom - Data inicial (YYYY-MM-DD)
 * @param {string} dateTo - Data final (YYYY-MM-DD)
 */
const getTransactions = async (linkId, dateFrom, dateTo) => {
  const client = await getClient();
  
  const transactions = await client.transactions.retrieve(linkId, dateFrom, dateTo);
  return transactions;
};

/**
 * Lista transações com filtros
 */
const listTransactions = async (filters = {}) => {
  const client = await getClient();
  
  const transactions = await client.transactions.list(filters);
  return transactions;
};

// ============ OWNERS ============

/**
 * Busca informações do titular da conta
 */
const getOwners = async (linkId) => {
  const client = await getClient();
  
  const owners = await client.owners.retrieve(linkId);
  return owners;
};

// ============ INCOME ============

/**
 * Busca informações de renda (se disponível)
 */
const getIncomes = async (linkId) => {
  const client = await getClient();
  
  try {
    const incomes = await client.incomes.retrieve(linkId);
    return incomes;
  } catch (error) {
    // Nem todas as instituições suportam income
    console.log('Income não disponível para este link:', error.message);
    return null;
  }
};

module.exports = {
  isConfigured,
  getClient,
  createWidgetAccessToken,
  createWidgetAccessTokenForLink,
  listInstitutions,
  getInstitution,
  registerLink,
  listLinks,
  getLinkDetails,
  updateLink,
  deleteLink,
  getAccounts,
  listAccounts,
  getBalances,
  getTransactions,
  listTransactions,
  getOwners,
  getIncomes,
  BELVO_ENV
};
