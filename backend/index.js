const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors()); // Mengizinkan request dari domain lain (frontend kita)
app.use(express.json({ extended: false })); // Mem-parsing body request sebagai JSON

// Rute Definisi
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/transactionRoutes"));

app.get("/", (req, res) => res.send("API Berjalan..."));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
