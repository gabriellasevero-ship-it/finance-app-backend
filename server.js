const express = require('express');
const cors = require('cors');
require('dotenv').config();

const belvoRoutes = require('./routes/belvo.routes');

const app = express();

app.use(cors());
app.use(express.json());

// registra as rotas
app.use('/api', belvoRoutes);

// health check
app.get('/', (req, res) => {
  res.send('API rodando 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
