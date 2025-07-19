const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Middleware Auth
function auth(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ msg: "Token dibutuhkan" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token tidak valid" });
  }
}

// Ambil kategori dari DB untuk user (default + custom)
router.get("/categories", auth, async (req, res) => {
  try {
    const dbCats = await pool.query(
      "SELECT id, name, is_income, user_id FROM categories WHERE user_id=$1",
      [req.user]
    );
    res.json(dbCats.rows);
  } catch (err) {
    res.status(500).json({ msg: "Gagal load kategori" });
  }
});

// Tambah kategori custom
router.post("/category", auth, async (req, res) => {
  const { name, is_income } = req.body;
  if (!name) return res.status(400).json({ msg: "Nama kategori wajib diisi!" });
  try {
    const result = await pool.query(
      "INSERT INTO categories (name, user_id, is_income) VALUES ($1, $2, $3) RETURNING *",
      [name, req.user, is_income || false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ msg: "Gagal menambah kategori" });
  }
});

// Edit kategori custom user
router.put("/category/:id", auth, async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  if (!name) return res.status(400).json({ msg: "Nama kategori wajib diisi!" });
  try {
    // Pastikan hanya user yang punya kategori tsb yang bisa edit
    const check = await pool.query(
      "SELECT * FROM categories WHERE id=$1 AND user_id=$2",
      [id, req.user]
    );
    if (!check.rows.length)
      return res.status(404).json({ msg: "Kategori tidak ditemukan" });

    const result = await pool.query(
      "UPDATE categories SET name=$1 WHERE id=$2 RETURNING *",
      [name, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ msg: "Gagal edit kategori" });
  }
});

// Tambah transaksi
router.post("/transaction", auth, async (req, res) => {
  const { category_id, amount, type, note } = req.body;
  if (!category_id || !amount || !type) {
    return res.status(400).json({ msg: "Isi semua data transaksi!" });
  }
  try {
    const trx = await pool.query(
      "INSERT INTO transactions (user_id, category_id, amount, type, note) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user, category_id, amount, type, note]
    );
    res.json(trx.rows[0]);
  } catch (err) {
    res.status(400).json({ msg: "Gagal menambah transaksi" });
  }
});

// Tambah/atur budget bulanan
router.post("/budget", auth, async (req, res) => {
  const { category_id, month, amount } = req.body;
  if (!category_id || !amount || !month) {
    return res.status(400).json({ msg: "Isi semua data budget!" });
  }
  try {
    const bgt = await pool.query(
      "INSERT INTO budgets (user_id, category_id, month, amount) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user, category_id, month, amount]
    );
    res.json(bgt.rows[0]);
  } catch (err) {
    res.status(400).json({ msg: "Gagal menambah budget" });
  }
});

// Statistik pengeluaran/pemasukan untuk chart
router.get("/stats", auth, async (req, res) => {
  const { month } = req.query;
  try {
    const data = await pool.query(
      `
      SELECT c.name, t.type, SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id=$1 AND to_char(t.created_at, 'YYYY-MM')=$2
      GROUP BY c.name, t.type
    `,
      [req.user, month]
    );
    res.json(data.rows);
  } catch (err) {
    res.status(500).json({ msg: "Gagal ambil statistik" });
  }
});

module.exports = router;
