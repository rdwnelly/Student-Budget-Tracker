// Cek otentikasi saat halaman dimuat
if (!localStorage.getItem("token")) {
  window.location.href = "index.html";
}

// =================================
// KONFIGURASI GLOBAL
// =================================
const API_BASE_URL = "http://localhost:3000";
const token = localStorage.getItem("token");
const headers = {
  "Content-Type": "application/json",
  "x-auth-token": token,
};

// =================================
// ELEMEN DOM
// =================================
const userNameEl = document.getElementById("user-name");
const logoutBtn = document.getElementById("logout-btn");

// Form Transaksi
const transactionForm = document.getElementById("transaction-form");
const transactionCategorySelect = document.getElementById(
  "transaction-category-select"
);
const transactionAmountInput = document.getElementById("transaction-amount");
const transactionDescriptionInput = document.getElementById(
  "transaction-description"
);
const transactionDateInput = document.getElementById("transaction-date");
const transactionList = document.getElementById("transaction-list");

// Tombol Modal
const manageBudgetBtn = document.getElementById("manage-budget-btn");
const manageCategoriesBtn = document.getElementById("manage-categories-btn");

// Modal Edit Transaksi
const editTransactionModal = document.getElementById("edit-transaction-modal");
const editTransactionForm = document.getElementById("edit-transaction-form");
const editTransactionIdInput = document.getElementById("edit-transaction-id");
const editTransactionDateInput = document.getElementById(
  "edit-transaction-date"
);
const editTransactionCategorySelect = document.getElementById(
  "edit-transaction-category"
);
const editTransactionAmountInput = document.getElementById(
  "edit-transaction-amount"
);
const editTransactionDescriptionInput = document.getElementById(
  "edit-transaction-description"
);

// Modal Kategori
const categoryModal = document.getElementById("category-modal");
const categoryForm = document.getElementById("category-form");
const categoryIdInput = document.getElementById("category-id");
const categoryNameInput = document.getElementById("category-name");
const categoryTypeSelect = document.getElementById("category-type");
const customCategoryList = document.getElementById("custom-category-list");
const cancelEditCategoryBtn = document.getElementById(
  "cancel-edit-category-btn"
);

// Modal Budget
const budgetModal = document.getElementById("budget-modal");
const budgetForm = document.getElementById("budget-form");
const budgetCategorySelect = document.getElementById("budget-category-select");
const budgetAmountInput = document.getElementById("budget-amount");
const currentBudgetsList = document.getElementById("current-budgets-list");

// Chart instances
let pieChart, barChart;
let allCategories = []; // Menyimpan semua kategori untuk digunakan kembali

// =================================
// INISIALISASI & EVENT LISTENERS UTAMA
// =================================

// Fungsi utama yang dijalankan saat halaman dimuat
async function initializeDashboard() {
  await getUserData();
  await loadCategories();
  await loadTransactions();
  await loadDashboardData();
  // Set tanggal default ke hari ini
  transactionDateInput.valueAsDate = new Date();
}

// Event Listener untuk Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "index.html";
});

// Panggil fungsi inisialisasi
document.addEventListener("DOMContentLoaded", initializeDashboard);

// =================================
// FUNGSI API & DATA LOADING
// =================================

// 1. Ambil data user
async function getUserData() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth`, { headers });
    const user = await res.json();
    userNameEl.textContent = `Halo, ${user.nama}!`;
  } catch (err) {
    console.error("Gagal mengambil data user:", err);
  }
}

// 2. Muat kategori, simpan, dan perbarui semua dropdown
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`, { headers });
    allCategories = await res.json();
    populateCategoryDropdowns();
  } catch (err) {
    console.error("Gagal memuat kategori:", err);
  }
}

// 3. Muat dan tampilkan riwayat transaksi
async function loadTransactions() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions`, { headers });
    const transactions = await res.json();

    transactionList.innerHTML = ""; // Kosongkan tabel
    transactions.forEach(renderTransactionRow);
  } catch (err) {
    console.error("Gagal memuat transaksi:", err);
  }
}

// 4. Muat data untuk dashboard (charts dan alerts)
async function loadDashboardData() {
  const today = new Date();
  const month = today.getMonth() + 1; // getMonth() is 0-indexed
  const year = today.getFullYear();

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/dashboard?month=${month}&year=${year}`,
      { headers }
    );
    const data = await res.json();

    renderPieChart(data.expenseComposition);
    renderBarChart(data.monthlyComparison);
    renderBudgetAlerts(data.budgetAlerts);
  } catch (err) {
    console.error("Gagal memuat data dashboard:", err);
  }
}

// =================================
// MANAJEMEN TRANSAKSI (CREATE, UPDATE, DELETE)
// =================================

// Form untuk tambah transaksi baru
transactionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const transactionData = {
    category_id: transactionCategorySelect.value,
    amount: transactionAmountInput.value,
    description: transactionDescriptionInput.value,
    transaction_date: transactionDateInput.value,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: "POST",
      headers,
      body: JSON.stringify(transactionData),
    });

    if (!res.ok) throw new Error("Gagal menambahkan transaksi");

    transactionForm.reset();
    transactionDateInput.valueAsDate = new Date();
    await loadTransactions();
    await loadDashboardData();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// Form untuk edit transaksi
editTransactionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = editTransactionIdInput.value;
  const transactionData = {
    category_id: editTransactionCategorySelect.value,
    amount: editTransactionAmountInput.value,
    description: editTransactionDescriptionInput.value,
    transaction_date: editTransactionDateInput.value,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(transactionData),
    });
    if (!res.ok) throw new Error("Gagal memperbarui transaksi");

    closeModal(editTransactionModal);
    await loadTransactions();
    await loadDashboardData();
  } catch (err) {
    alert(err.message);
  }
});

// Fungsi untuk hapus transaksi
async function deleteTransaction(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Gagal menghapus transaksi");

    await loadTransactions();
    await loadDashboardData();
  } catch (err) {
    alert(err.message);
  }
}

// =================================
// MANAJEMEN KATEGORI (CREATE, UPDATE, DELETE)
// =================================

// Buka Modal Kategori
manageCategoriesBtn.addEventListener("click", () => {
  loadCustomCategories();
  openModal(categoryModal);
});

// Form untuk tambah/edit kategori
categoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = categoryIdInput.value;
  const isEditing = !!id;

  const categoryData = {
    name: categoryNameInput.value,
    type: categoryTypeSelect.value,
  };

  const url = isEditing
    ? `${API_BASE_URL}/api/categories/${id}`
    : `${API_BASE_URL}/api/categories`;
  const method = isEditing ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(categoryData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.msg || "Gagal menyimpan kategori");

    resetCategoryForm();
    await loadCategories(); // Muat ulang semua kategori
    await loadCustomCategories(); // Muat ulang daftar di modal
  } catch (err) {
    alert(err.message);
  }
});

// Muat kategori custom ke dalam modal
async function loadCustomCategories() {
  const customCategories = allCategories.filter((cat) => !cat.is_default);
  customCategoryList.innerHTML = "";
  customCategories.forEach((cat) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${cat.name}</td>
            <td>${cat.type === "pemasukan" ? "Pemasukan" : "Pengeluaran"}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-warning" onclick="prepareEditCategory('${
                  cat.category_id
                }', '${cat.name}', '${cat.type}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCategory('${
                  cat.category_id
                }')">Hapus</button>
            </td>
        `;
    customCategoryList.appendChild(row);
  });
}

// Siapkan form untuk edit kategori
function prepareEditCategory(id, name, type) {
  categoryIdInput.value = id;
  categoryNameInput.value = name;
  categoryTypeSelect.value = type;
  cancelEditCategoryBtn.style.display = "inline-block";
  categoryNameInput.focus();
}

// Hapus kategori
async function deleteCategory(id) {
  if (
    !confirm(
      "Yakin ingin menghapus kategori ini? Ini tidak bisa dilakukan jika kategori sudah pernah digunakan."
    )
  )
    return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers,
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.msg || "Gagal menghapus kategori");

    await loadCategories();
    await loadCustomCategories();
  } catch (err) {
    alert(err.message);
  }
}

// Reset form kategori
cancelEditCategoryBtn.addEventListener("click", resetCategoryForm);
function resetCategoryForm() {
  categoryForm.reset();
  categoryIdInput.value = "";
  cancelEditCategoryBtn.style.display = "none";
}

// =================================
// MANAJEMEN BUDGET
// =================================

// Buka Modal Budget
manageBudgetBtn.addEventListener("click", () => {
  loadBudgetsIntoModal();
  openModal(budgetModal);
});

// Form untuk set budget
budgetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const today = new Date();
  const budgetData = {
    category_id: budgetCategorySelect.value,
    amount: budgetAmountInput.value,
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/budgets`, {
      method: "POST",
      headers,
      body: JSON.stringify(budgetData),
    });
    if (!res.ok) throw new Error("Gagal menyimpan budget");

    budgetForm.reset();
    await loadBudgetsIntoModal();
    await loadDashboardData();
  } catch (err) {
    alert(err.message);
  }
});

// Muat daftar budget ke dalam modal
async function loadBudgetsIntoModal() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const res = await fetch(
    `${API_BASE_URL}/api/budgets?month=${month}&year=${year}`,
    { headers }
  );
  const budgets = await res.json();

  currentBudgetsList.innerHTML = "";
  if (budgets.length === 0) {
    currentBudgetsList.innerHTML =
      "<p>Belum ada budget yang diatur untuk bulan ini.</p>";
    return;
  }

  budgets.forEach((b) => {
    const item = document.createElement("p");
    item.innerHTML = `<strong>${b.category_name}:</strong> Rp ${Number(
      b.amount
    ).toLocaleString("id-ID")}`;
    currentBudgetsList.appendChild(item);
  });
}

// =================================
// FUNGSI RENDER & UI HELPERS
// =================================

// Fungsi untuk mengisi semua dropdown kategori
function populateCategoryDropdowns() {
  const selects = [
    transactionCategorySelect,
    editTransactionCategorySelect,
    budgetCategorySelect,
  ];
  selects.forEach((select) => {
    select.innerHTML = "";

    // Kelompokkan berdasarkan tipe
    const pemasukanGroup = document.createElement("optgroup");
    pemasukanGroup.label = "Pemasukan";
    const pengeluaranGroup = document.createElement("optgroup");
    pengeluaranGroup.label = "Pengeluaran";

    allCategories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.category_id;
      option.textContent = cat.name;
      if (cat.type === "pemasukan") {
        pemasukanGroup.appendChild(option);
      } else {
        pengeluaranGroup.appendChild(option);
      }
    });

    // Tambahkan hanya jika ada isinya
    if (select.id === "budget-category-select") {
      // Budget hanya untuk pengeluaran
      select.appendChild(pengeluaranGroup);
    } else {
      if (pemasukanGroup.childElementCount > 0)
        select.appendChild(pemasukanGroup);
      if (pengeluaranGroup.childElementCount > 0)
        select.appendChild(pengeluaranGroup);
    }
  });
}

// Render 1 baris transaksi di tabel
function renderTransactionRow(tx) {
  const row = document.createElement("tr");
  const amountColor = tx.type === "pemasukan" ? "green" : "red";
  const amountSign = tx.type === "pemasukan" ? "+" : "-";

  // Format tanggal ke YYYY-MM-DD untuk input date
  const dateForInput = new Date(tx.transaction_date)
    .toISOString()
    .split("T")[0];

  row.innerHTML = `
    <td>${new Date(tx.transaction_date).toLocaleDateString("id-ID")}</td>
    <td>${tx.category_name}</td>
    <td>${tx.description || "-"}</td>
    <td style="color: ${amountColor}; font-weight: bold;">${amountSign} Rp ${Number(
    tx.amount
  ).toLocaleString("id-ID")}</td>
    <td class="action-buttons">
        <button class="btn btn-sm btn-warning" onclick='openEditModal(
            "${tx.transaction_id}",
            "${dateForInput}",
            "${tx.category_id}",
            "${tx.amount}",
            "${tx.description.replace(/'/g, "\\'")}"
        )'>Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTransaction('${
          tx.transaction_id
        }')">Hapus</button>
    </td>
  `;
  transactionList.appendChild(row);
}

// Buka Modal Edit Transaksi dan isi datanya
function openEditModal(id, date, categoryId, amount, description) {
  editTransactionIdInput.value = id;
  editTransactionDateInput.value = date;
  editTransactionCategorySelect.value = categoryId;
  editTransactionAmountInput.value = amount;
  editTransactionDescriptionInput.value = description;
  openModal(editTransactionModal);
}

// Fungsi untuk render Pie Chart
function renderPieChart(data) {
  const ctx = document.getElementById("expense-pie-chart").getContext("2d");
  const labels = data.map((item) => item.category_name);
  const values = data.map((item) => item.total_amount);

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#ff3b30",
            "#ff9500",
            "#ffcc00",
            "#34c759",
            "#007aff",
            "#5856d6",
            "#af52de",
          ],
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

// Fungsi untuk render Bar Chart
function renderBarChart(data) {
  const ctx = document.getElementById("monthly-bar-chart").getContext("2d");
  const labels = data.map((item) =>
    new Date(item.month).toLocaleString("id-ID", {
      month: "short",
      year: "2-digit",
    })
  );
  const pemasukan = data.map((item) => item.total_pemasukan);
  const pengeluaran = data.map((item) => item.total_pengeluaran);

  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Pemasukan",
          data: pemasukan,
          backgroundColor: "rgba(52, 199, 89, 0.7)",
        },
        {
          label: "Pengeluaran",
          data: pengeluaran,
          backgroundColor: "rgba(255, 59, 48, 0.7)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
    },
  });
}

// Fungsi untuk render Peringatan Budget
function renderBudgetAlerts(data) {
  const container = document.getElementById("budget-alerts");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML =
      "<p>Anda belum mengatur budget pengeluaran untuk bulan ini. Atur sekarang untuk melacak pengeluaran Anda!</p>";
    return;
  }

  data.forEach((item) => {
    const percentage = Math.min(Math.round(item.percentage_spent), 100);
    let colorClass = "bg-success";
    if (percentage > 90) colorClass = "#ff3b30"; // red
    else if (percentage > 75) colorClass = "#ff9500"; // orange

    const alertEl = document.createElement("div");
    alertEl.className = "alert";
    alertEl.innerHTML = `
        <p>
            <strong>${item.category_name}:</strong> 
            Rp ${Number(item.total_spent).toLocaleString("id-ID")} dari 
            Rp ${Number(item.budget_amount).toLocaleString("id-ID")} 
            (<strong>${Math.round(item.percentage_spent)}%</strong>)
        </p>
        <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${percentage}%; background-color: ${colorClass};"></div>
        </div>
    `;
    container.appendChild(alertEl);
  });
}

// =================================
// MANAJEMEN MODAL
// =================================
const allModals = document.querySelectorAll(".modal");

function openModal(modal) {
  modal.style.display = "block";
}

function closeModal(modal) {
  modal.style.display = "none";
}

// Menutup modal jika user klik di luar kontennya atau tombol close
window.onclick = function (event) {
  allModals.forEach((modal) => {
    if (event.target == modal) {
      closeModal(modal);
    }
  });
};

document.querySelectorAll(".close-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    closeModal(this.closest(".modal"));
  });
});