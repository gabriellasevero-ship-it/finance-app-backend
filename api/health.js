export default function handler(req, res) {
  res.json({ 
    status: 'ok', 
    message: 'API rodando 🚀',
    timestamp: new Date().toISOString()
  });
}
