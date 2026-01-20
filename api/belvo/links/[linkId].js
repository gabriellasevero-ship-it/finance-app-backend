import Belvo from 'belvo';
import { createClient } from '@supabase/supabase-js';

const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;
const BELVO_ENV = process.env.BELVO_ENV || 'sandbox';

const BELVO_BASE_URL = BELVO_ENV === 'production' 
  ? 'https://api.belvo.com' 
  : 'https://sandbox.belvo.com';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { linkId } = req.query;

  // DELETE - Desconectar banco
  if (req.method === 'DELETE') {
    try {
      const { user_id } = req.body || {};

      const client = new Belvo(BELVO_SECRET_ID, BELVO_SECRET_PASSWORD, BELVO_BASE_URL);
      await client.connect();

      // Remove da Belvo
      await client.links.delete(linkId);

      // Remove do Supabase
      await supabase
        .from('belvo_links')
        .delete()
        .eq('id', linkId);

      // Remove contas associadas
      if (user_id) {
        await supabase
          .from('accounts')
          .delete()
          .eq('belvo_link_id', linkId)
          .eq('user_id', user_id);
      }

      res.json({
        success: true,
        message: 'Banco desconectado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao desconectar banco:', error);
      res.status(500).json({ error: 'Erro ao desconectar banco' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
