const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// Ganti baris require yang lama dengan ini
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  setBudget,
  getBudgets, // Tambahkan ini
  getDashboardData,
} = require("../controllers/transactionController");

// Semua rute di sini dilindungi dan memerlukan token
router.use(authMiddleware);

// --- Rute untuk Kategori ---
router.get("/categories", getCategories);
router.post("/categories", addCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// --- Rute untuk Transaksi ---
router.get("/transactions", getTransactions);
router.post("/transactions", addTransaction);
router.put("/transactions/:id", updateTransaction); // Rute baru untuk update
router.delete("/transactions/:id", deleteTransaction); // Rute baru untuk hapus

// --- Rute untuk Budget ---
router.get("/budgets", getBudgets); // Rute baru untuk mengambil budget
router.post("/budgets", setBudget);

// --- Rute untuk Data Dashboard ---
router.get("/dashboard", getDashboardData);

module.exports = router;
