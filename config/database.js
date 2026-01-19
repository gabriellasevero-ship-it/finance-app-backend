const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase não configurado no backend. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
}

// Usa Service Role Key no backend para bypass de RLS quando necessário
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Pool-like interface para compatibilidade com código existente
const pool = {
  query: async (text, params) => {
    try {
      // Parse simples de queries SQL para Supabase
      // Para queries mais complexas, use diretamente o cliente Supabase
      
      if (text.includes('SELECT') && text.includes('FROM debts')) {
        const { data, error } = await supabase
          .from('debts')
          .select('*');
        
        if (error) throw error;
        return { rows: data || [] };
      }
      
      if (text.includes('INSERT INTO debts')) {
        const [nome, tipo, parcela_mensal, parcelas_restantes, saldo_estimado] = params;
        const { data, error } = await supabase
          .from('debts')
          .insert([{
            nome,
            tipo,
            parcela_mensal,
            parcelas_restantes,
            saldo_estimado
          }])
          .select()
          .single();
        
        if (error) throw error;
        return { rows: [data] };
      }
      
      // Fallback genérico
      throw new Error('Query não suportada. Use o cliente Supabase diretamente.');
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};

module.exports = pool;
module.exports.supabase = supabase;
