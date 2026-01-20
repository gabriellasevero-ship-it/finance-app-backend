import Belvo from 'belvo';

const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;
const BELVO_ENV = process.env.BELVO_ENV || 'sandbox';

const BELVO_BASE_URL = BELVO_ENV === 'production' 
  ? 'https://api.belvo.com' 
  : 'https://sandbox.belvo.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { linkId, date_from, date_to } = req.query;

    if (!linkId) {
      return res.status(400).json({ error: 'linkId é obrigatório' });
    }

    const client = new Belvo(BELVO_SECRET_ID, BELVO_SECRET_PASSWORD, BELVO_BASE_URL);
    await client.connect();

    // Default: últimos 30 dias
    const dateTo = date_to || new Date().toISOString().split('T')[0];
    const dateFrom = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const transactions = await client.transactions.retrieve(linkId, dateFrom, dateTo);

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
