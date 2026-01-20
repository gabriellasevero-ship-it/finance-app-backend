import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // GET - Listar links do usuário
  if (req.method === 'GET') {
    try {
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id é obrigatório' });
      }

      const { data: links, error } = await supabase
        .from('belvo_links')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json(links || []);
    } catch (error) {
      console.error('Erro ao listar links:', error);
      res.status(500).json({ error: 'Erro ao listar conexões' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
