exports.connectBank = (req, res) => {
  const { institution } = req.body;

  if (!institution) {
    return res.status(400).json({ error: "Instituição não informada" });
  }

  const newAccount = {
    id: Date.now(),
    institution_id: institution.id,
    institution_name: institution.name,
    balance: Math.floor(Math.random() * 5000),
    updated_at: new Date().toISOString()
  };

  return res.status(201).json(newAccount);
};
