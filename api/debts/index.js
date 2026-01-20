import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // POST - Criar dívida
  if (req.method === 'POST') {
    try {
      const {
        nome,
        tipo,
        parcela_mensal,
        parcelas_restantes,
        saldo_estimado,
        user_id,
        impacto_psicologico = 3,
        prioridade_manual = 3,
      } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id é obrigatório' });
      }

      const { data, error } = await supabase
        .from('debts')
        .insert([{
          nome,
          tipo,
          parcela_mensal,
          parcelas_restantes,
          saldo_estimado,
          user_id,
          impacto_psicologico,
          prioridade_manual,
          ativo: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating debt:', error);
        return res.status(500).json({ error: 'Erro ao criar dívida' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error in createDebt:', error);
      res.status(500).json({ error: 'Erro ao criar dívida' });
    }
    return;
  }

  // GET - Listar dívidas
  if (req.method === 'GET') {
    try {
      const { user_id } = req.query;

      let query = supabase
        .from('debts')
        .select('*');

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      query = query.eq('ativo', true);

      const { data, error } = await query;

      if (error) {
        console.error('Error listing debts:', error);
        return res.status(500).json({ error: 'Erro ao listar dívidas' });
      }

      res.json(data || []);
    } catch (error) {
      console.error('Error in listDebts:', error);
      res.status(500).json({ error: 'Erro ao listar dívidas' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
