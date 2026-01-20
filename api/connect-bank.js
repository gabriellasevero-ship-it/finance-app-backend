export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { institution } = req.body;

    if (!institution) {
      return res.status(400).json({ error: 'Instituição não informada' });
    }

    // Resposta mock para compatibilidade
    return res.status(200).json({
      message: 'Banco conectado com sucesso',
      institution,
      accounts: [
        {
          id: 'acc_1',
          name: 'Conta Corrente',
          balance: 3500
        }
      ]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao conectar banco' });
  }
}
