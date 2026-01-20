import Belvo from 'belvo';

const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;
const BELVO_ENV = process.env.BELVO_ENV || 'sandbox';

const BELVO_BASE_URL = BELVO_ENV === 'production' 
  ? 'https://api.belvo.com' 
  : 'https://sandbox.belvo.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
      return res.status(503).json({ 
        error: 'Belvo não configurado',
        message: 'Configure as credenciais Belvo no servidor'
      });
    }

    const client = new Belvo(BELVO_SECRET_ID, BELVO_SECRET_PASSWORD, BELVO_BASE_URL);
    await client.connect();

    const { link_id } = req.body || {};
    
    let tokenResponse;
    if (link_id) {
      tokenResponse = await client.widgetToken.create({
        link: link_id,
        scopes: 'read_institutions,write_links,read_links'
      });
    } else {
      tokenResponse = await client.widgetToken.create();
    }

    res.json({
      access: tokenResponse.access,
      refresh: tokenResponse.refresh,
      environment: BELVO_ENV
    });
  } catch (error) {
    console.error('Erro ao gerar widget token:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar token do widget',
      details: error.message 
    });
  }
};
