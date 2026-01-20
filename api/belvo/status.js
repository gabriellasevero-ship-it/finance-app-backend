export default function handler(req, res) {
  const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
  const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;
  const BELVO_ENV = process.env.BELVO_ENV || 'sandbox';

  const isConfigured = !!(BELVO_SECRET_ID && BELVO_SECRET_PASSWORD);

  res.json({
    configured: isConfigured,
    environment: BELVO_ENV,
    message: isConfigured 
      ? 'Belvo está configurado e pronto para uso' 
      : 'Belvo não está configurado. Configure BELVO_SECRET_ID e BELVO_SECRET_PASSWORD.'
  });
}
