const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getLoggedInUser,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// @route   POST api/auth/register
// @desc    Registrasi user baru
router.post("/register", register);

// @route   POST api/auth/login
// @desc    Login user & dapatkan token
router.post("/login", login);

// @route   GET api/auth
// @desc    Dapatkan data user yang login
router.get("/", authMiddleware, getLoggedInUser);

module.exports = router;
