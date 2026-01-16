{\rtf1\ansi\ansicpg1252\cocoartf2513
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww10800\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const pool = require('../config/database');\
\
exports.createDebt = async (req, res) => \{\
  const \{\
    nome,\
    tipo,\
    parcela_mensal,\
    parcelas_restantes,\
    saldo_estimado,\
  \} = req.body;\
\
  const result = await pool.query(\
    `INSERT INTO debts \
     (nome, tipo, parcela_mensal, parcelas_restantes, saldo_estimado)\
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,\
    [nome, tipo, parcela_mensal, parcelas_restantes, saldo_estimado]\
  );\
\
  res.json(result.rows[0]);\
\};\
\
exports.listDebts = async (_, res) => \{\
  const result = await pool.query('SELECT * FROM debts');\
  res.json(result.rows);\
\};\
}