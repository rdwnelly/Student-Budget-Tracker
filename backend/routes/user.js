const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashed]
    );

    // Insert kategori default ke DB
    const defaultCats = [
      { name: "Uang Kiriman Ortu", is_income: true },
      { name: "Beasiswa", is_income: true },
      { name: "Biaya Kos", is_income: false },
      { name: "Fotokopi & Print", is_income: false },
      { name: "Nongkrong", is_income: false },
      { name: "Transportasi", is_income: false },
      { name: "Belanja Online", is_income: false },
      { name: "Praktikum", is_income: false }
    ];
    const userId = user.rows[0].id;
    for (let c of defaultCats) {
      await pool.query(
        "INSERT INTO categories (name, user_id, is_income) VALUES ($1, $2, $3)",
        [c.name, userId, c.is_income]
      );
    }

    res.status(201).json({ msg: "Registrasi berhasil!" });
  } catch (err) {
    res.status(400).json({ msg: "Email sudah terdaftar!" });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (!userRes.rows.length)
      return res.status(400).json({ msg: "Email tidak ditemukan" });
    const user = userRes.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ msg: "Password salah" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
