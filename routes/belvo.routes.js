const express = require("express");
const router = express.Router();
const debtsController = require('../controllers/debts.controller');
const belvoController = require('../controllers/belvo.controller');

// ============ ROTAS DE DÍVIDAS ============
router.post("/debts", debtsController.createDebt);
router.get("/debts", debtsController.listDebts);
router.put("/debts/:id", debtsController.updateDebt);
router.delete("/debts/:id", debtsController.deleteDebt);

// Rota legada de conexão bancária (mantida para compatibilidade)
router.post("/connect-bank", debtsController.connectBank);

// ============ ROTAS BELVO - OPEN FINANCE ============

// Status e configuração
router.get("/belvo/status", belvoController.checkStatus);

// Widget - Token de acesso para o Belvo Connect Widget
router.post("/belvo/widget-token", belvoController.getWidgetToken);

// Instituições - Lista bancos disponíveis
router.get("/belvo/institutions", belvoController.listInstitutions);

// Links (conexões bancárias)
router.post("/belvo/register-link", belvoController.registerLink);
router.get("/belvo/links", belvoController.listUserLinks);
router.delete("/belvo/links/:linkId", belvoController.deleteLink);

// Contas
router.get("/belvo/accounts/:linkId", belvoController.getAccounts);

// Transações
router.get("/belvo/transactions/:linkId", belvoController.getTransactions);

// Saldos
router.get("/belvo/balances/:linkId", belvoController.getBalances);

// Sincronização
router.post("/belvo/sync/:linkId", belvoController.syncLink);

module.exports = router;
