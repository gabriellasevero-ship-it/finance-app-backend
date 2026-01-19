const express = require("express");
const router = express.Router();
const debtsController = require('../controllers/debts.controller');

// Rotas de dívidas
router.post("/debts", debtsController.createDebt);
router.get("/debts", debtsController.listDebts);
router.put("/debts/:id", debtsController.updateDebt);
router.delete("/debts/:id", debtsController.deleteDebt);

// Rotas de conexão bancária
router.post("/connect-bank", debtsController.connectBank);

module.exports = router;
