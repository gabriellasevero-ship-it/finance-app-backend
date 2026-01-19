const { supabase } = require('../config/database');

exports.createDebt = async (req, res) => {
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
};

exports.listDebts = async (req, res) => {
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
};

exports.updateDebt = async (req, res) => {
  try {
    const { id } = req.params;
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
};

exports.deleteDebt = async (req, res) => {
  try {
    const { id } = req.params;

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
};

exports.connectBank = async (req, res) => {
  try {
    const { institution } = req.body;

    if (!institution) {
      return res.status(400).json({ error: 'Instituição não informada' });
    }

    // 🔮 Aqui no futuro entra Belvo SDK
    // const link = await belvo.links.create(...)

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
};
