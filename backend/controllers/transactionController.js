const db = require("../config/db");

// ===============================================
// FUNGSI UNTUK KATEGORI
// ===============================================

// Mengambil semua kategori (default dan milik user)
exports.getCategories = async (req, res) => {
  try {
    const categories = await db.query(
      "SELECT * FROM categories WHERE is_default = TRUE OR user_id = $1 ORDER BY type, name",
      [req.user.id]
    );
    res.json(categories.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Menambah kategori baru oleh user
exports.addCategory = async (req, res) => {
  const { name, type } = req.body;
  try {
    const newCategory = await db.query(
      "INSERT INTO categories (user_id, name, type, is_default) VALUES ($1, $2, $3, FALSE) RETURNING *",
      [req.user.id, name, type]
    );
    res.json(newCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Mengupdate kategori milik user
exports.updateCategory = async (req, res) => {
  const { name, type } = req.body;
  const { id } = req.params;
  try {
    const updatedCategory = await db.query(
      "UPDATE categories SET name = $1, type = $2 WHERE category_id = $3 AND user_id = $4 RETURNING *",
      [name, type, id, req.user.id]
    );
    if (updatedCategory.rows.length === 0) {
      return res
        .status(404)
        .json({
          msg: "Kategori tidak ditemukan atau Anda tidak punya hak akses.",
        });
    }
    res.json(updatedCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Menghapus kategori milik user
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Cek dulu apakah kategori ini dipakai di transaksi
    const usage = await db.query(
      "SELECT 1 FROM transactions WHERE category_id = $1",
      [id]
    );
    if (usage.rows.length > 0) {
      return res
        .status(400)
        .json({
          msg: "Tidak bisa menghapus kategori yang sudah digunakan dalam transaksi.",
        });
    }

    const deletedCategory = await db.query(
      "DELETE FROM categories WHERE category_id = $1 AND user_id = $2 AND is_default = FALSE RETURNING *",
      [id, req.user.id]
    );
    if (deletedCategory.rows.length === 0) {
      return res
        .status(404)
        .json({
          msg: "Kategori tidak ditemukan, tidak bisa dihapus, atau bukan milik Anda.",
        });
    }
    res.json({ msg: "Kategori berhasil dihapus." });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ===============================================
// FUNGSI UNTUK TRANSAKSI
// ===============================================

// Menambah transaksi baru
exports.addTransaction = async (req, res) => {
  const { category_id, amount, description, transaction_date } = req.body;
  try {
    const newTransaction = await db.query(
      "INSERT INTO transactions (user_id, category_id, amount, description, transaction_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.id, category_id, amount, description, transaction_date]
    );
    res.json(newTransaction.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Mengambil semua transaksi user
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await db.query(
      `SELECT t.*, c.name as category_name, c.type 
             FROM transactions t
             JOIN categories c ON t.category_id = c.category_id
             WHERE t.user_id = $1
             ORDER BY t.transaction_date DESC, t.created_at DESC`,
      [req.user.id]
    );
    res.json(transactions.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Mengupdate transaksi
exports.updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { category_id, amount, description, transaction_date } = req.body;
  try {
    const updatedTransaction = await db.query(
      `UPDATE transactions 
             SET category_id = $1, amount = $2, description = $3, transaction_date = $4
             WHERE transaction_id = $5 AND user_id = $6 RETURNING *`,
      [category_id, amount, description, transaction_date, id, req.user.id]
    );

    if (updatedTransaction.rows.length === 0) {
      return res.status(404).json({ msg: "Transaksi tidak ditemukan." });
    }
    res.json(updatedTransaction.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Menghapus transaksi
exports.deleteTransaction = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteOp = await db.query(
      "DELETE FROM transactions WHERE transaction_id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ msg: "Transaksi tidak ditemukan." });
    }
    res.json({ msg: "Transaksi berhasil dihapus." });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ===============================================
// FUNGSI UNTUK BUDGET
// ===============================================

// Mengatur atau update budget
exports.setBudget = async (req, res) => {
  const { category_id, amount, month, year } = req.body;
  try {
    const budget = await db.query(
      `INSERT INTO budgets (user_id, category_id, amount, month, year)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, category_id, month, year)
             DO UPDATE SET amount = EXCLUDED.amount
             RETURNING *`,
      [req.user.id, category_id, amount, month, year]
    );
    res.json(budget.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Mengambil budget yang sudah di-set user
exports.getBudgets = async (req, res) => {
  const { month, year } = req.query;
  try {
    const budgets = await db.query(
      `SELECT b.category_id, c.name as category_name, b.amount, c.type
             FROM budgets b
             JOIN categories c ON b.category_id = c.category_id
             WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3`,
      [req.user.id, month, year]
    );
    res.json(budgets.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ===============================================
// FUNGSI UNTUK DASHBOARD
// ===============================================

// Mengambil data untuk visualisasi dashboard
exports.getDashboardData = async (req, res) => {
  const { month, year } = req.query;
  const userId = req.user.id;

  try {
    // 1. Data untuk Pie Chart: Komposisi pengeluaran bulan ini
    const expenseCompositionQuery = `
            SELECT c.name as category_name, SUM(t.amount) as total_amount
            FROM transactions t
            JOIN categories c ON t.category_id = c.category_id
            WHERE t.user_id = $1
              AND c.type = 'pengeluaran'
              AND EXTRACT(MONTH FROM t.transaction_date) = $2
              AND EXTRACT(YEAR FROM t.transaction_date) = $3
            GROUP BY c.name;
        `;
    const expenseComposition = await db.query(expenseCompositionQuery, [
      userId,
      month,
      year,
    ]);

    // 2. Data untuk Peringatan Budget
    const budgetAlertQuery = `
            WITH monthly_expenses AS (
                SELECT
                    category_id,
                    SUM(amount) as total_spent
                FROM transactions
                WHERE
                    user_id = $1
                    AND EXTRACT(MONTH FROM transaction_date) = $2
                    AND EXTRACT(YEAR FROM transaction_date) = $3
                GROUP BY category_id
            )
            SELECT
                b.category_id,
                c.name as category_name,
                b.amount as budget_amount,
                COALESCE(me.total_spent, 0) as total_spent,
                (COALESCE(me.total_spent, 0) / b.amount) * 100 as percentage_spent
            FROM budgets b
            JOIN categories c ON b.category_id = c.category_id
            LEFT JOIN monthly_expenses me ON b.category_id = me.category_id
            WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3;
        `;
    const budgetAlerts = await db.query(budgetAlertQuery, [
      userId,
      month,
      year,
    ]);

    // 3. Data untuk Bar Chart: Perbandingan pengeluaran beberapa bulan terakhir
    const monthlyComparisonQuery = `
            SELECT 
                TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') as month,
                SUM(CASE WHEN c.type = 'pemasukan' THEN t.amount ELSE 0 END) as total_pemasukan,
                SUM(CASE WHEN c.type = 'pengeluaran' THEN t.amount ELSE 0 END) as total_pengeluaran
            FROM transactions t
            JOIN categories c ON t.category_id = c.category_id
            WHERE t.user_id = $1
              AND t.transaction_date >= NOW() - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', transaction_date)
            ORDER BY month;
        `;
    const monthlyComparison = await db.query(monthlyComparisonQuery, [userId]);

    res.json({
      expenseComposition: expenseComposition.rows,
      budgetAlerts: budgetAlerts.rows,
      monthlyComparison: monthlyComparison.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};