const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
// Ganti baris require yang lama dengan ini
const {
  getCategories,
  addTransaction,
  getTransactions,
  setBudget,
  getDashboardData,
  updateTransaction,
  deleteTransaction,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/transactionController");

// Semua rute di sini dilindungi dan memerlukan token
router.use(authMiddleware);

// Rute untuk kategori
router.get("/categories", getCategories);

// Rute untuk transaksi
router.post("/transactions", addTransaction);
router.get("/transactions", getTransactions);

// Rute untuk budget
router.post("/budgets", setBudget);

// Rute untuk data dashboard
router.get("/dashboard", getDashboardData);

module.exports = router;
