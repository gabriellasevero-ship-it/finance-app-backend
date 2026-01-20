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
    if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
      return res.status(503).json({ error: 'Belvo não configurado' });
    }

    const client = new Belvo(BELVO_SECRET_ID, BELVO_SECRET_PASSWORD, BELVO_BASE_URL);
    await client.connect();

    const { country = 'BR' } = req.query;
    
    const institutions = await client.institutions.list({
      country_code: country,
      page_size: 100
    });
    
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
