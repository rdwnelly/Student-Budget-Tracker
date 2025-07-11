const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Fungsi untuk Registrasi User Baru
exports.register = async (req, res) => {
  const { nama, email, password } = req.body;

  try {
    // Cek apakah email sudah terdaftar
    let user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length > 0) {
      return res.status(400).json({ msg: "Email sudah terdaftar" });
    }

    // Enkripsi password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan user baru ke database
    const newUser = await db.query(
      "INSERT INTO users (nama, email, password) VALUES ($1, $2, $3) RETURNING user_id, nama, email",
      [nama, email, hashedPassword]
    );

    // Buat token JWT
    const payload = { user: { id: newUser.rows[0].user_id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Fungsi untuk Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cek apakah email ada
    let user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ msg: "Email atau password salah" });
    }

    // Cek password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Email atau password salah" });
    }

    // Buat token JWT
    const payload = { user: { id: user.rows[0].user_id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Fungsi untuk mendapatkan data user yang sedang login
exports.getLoggedInUser = async (req, res) => {
  try {
    const user = await db.query(
      "SELECT user_id, nama, email FROM users WHERE user_id = $1",
      [req.user.id]
    );
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
