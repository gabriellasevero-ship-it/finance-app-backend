const express = require('express');
const cors = require('cors');

const belvoRoutes = require('./routes/belvo.routes');
const debtsRoutes = require('./routes/debts.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/belvo', belvoRoutes);
app.use('/debts', debtsRoutes);

module.exports = app;
