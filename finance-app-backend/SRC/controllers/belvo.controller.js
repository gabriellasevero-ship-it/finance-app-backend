{\rtf1\ansi\ansicpg1252\cocoartf2513
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww10800\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const belvoClient = require('../config/belvo');\
\
exports.createWidgetToken = async (req, res) => \{\
  try \{\
    const token = await belvoClient.widgetToken.create(\{\
      scopes: ['read_institutions', 'read_accounts', 'read_transactions'],\
    \});\
\
    res.json(token);\
  \} catch (err) \{\
    res.status(500).json(\{ error: err.message \});\
  \}\
\};\
\
exports.getAccounts = async (req, res) => \{\
  try \{\
    const accounts = await belvoClient.accounts.list(\{\
      link: req.params.linkId,\
    \});\
\
    res.json(accounts);\
  \} catch (err) \{\
    res.status(500).json(\{ error: err.message \});\
  \}\
\};\
\
exports.getTransactions = async (req, res) => \{\
  try \{\
    const transactions = await belvoClient.transactions.list(\{\
      link: req.params.linkId,\
    \});\
\
    res.json(transactions);\
  \} catch (err) \{\
    res.status(500).json(\{ error: err.message \});\
  \}\
\};\
}