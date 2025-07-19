require("dotenv").config();
const express = require("express");
const app = express();

// Middleware CORS manual, anti error
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Import routes
const userRoutes = require("./routes/user");
const budgetRoutes = require("./routes/budget");

app.use("/api/users", userRoutes);
app.use("/api/budget", budgetRoutes);

// Jalankan server di PORT (ganti sesuai kebutuhan, misal 5050)
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
