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
    const { linkId } = req.query;

    if (!linkId) {
      return res.status(400).json({ error: 'linkId é obrigatório' });
    }

    const client = new Belvo(BELVO_SECRET_ID, BELVO_SECRET_PASSWORD, BELVO_BASE_URL);
    await client.connect();

    const accounts = await client.accounts.retrieve(linkId);

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
