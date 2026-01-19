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

// health check endpoint (usado pelo frontend)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API rodando 🚀',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
