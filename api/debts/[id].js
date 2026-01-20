import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  // PUT - Atualizar dívida
  if (req.method === 'PUT') {
    try {
      const updates = req.body;

      const { data, error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating debt:', error);
        return res.status(500).json({ error: 'Erro ao atualizar dívida' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error in updateDebt:', error);
      res.status(500).json({ error: 'Erro ao atualizar dívida' });
    }
    return;
  }

  // DELETE - Deletar dívida (soft delete)
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('debts')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('Error deleting debt:', error);
        return res.status(500).json({ error: 'Erro ao deletar dívida' });
      }

      res.json({ message: 'Dívida deletada com sucesso' });
    } catch (error) {
      console.error('Error in deleteDebt:', error);
      res.status(500).json({ error: 'Erro ao deletar dívida' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
