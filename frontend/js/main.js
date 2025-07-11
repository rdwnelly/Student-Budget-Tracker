// Periksa otentikasi saat halaman dimuat
if (!localStorage.getItem("token")) {
  window.location.href = "index.html";
}

const API_BASE_URL = "http://localhost:3000";
const token = localStorage.getItem("token");
const headers = {
  "Content-Type": "application/json",
  "x-auth-token": token,
};

// Elemen DOM
const userNameEl = document.getElementById("user-name");
const logoutBtn = document.getElementById("logout-btn");
const categorySelect = document.getElementById("category-select");
const transactionForm = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const transactionDateEl = document.getElementById("transaction-date");

// Chart instances
let pieChart, barChart;

// Fungsi untuk logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "index.html";
});

// Fungsi utama yang dijalankan saat halaman dimuat
async function initializeDashboard() {
  await getUserData();
  await loadCategories();
  await loadTransactions();
  await loadDashboardData();
  // Set tanggal default ke hari ini
  transactionDateEl.valueAsDate = new Date();
}

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

// 2. Muat kategori ke dalam dropdown
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`, { headers });
    const categories = await res.json();

    // Kosongkan select sebelum mengisi
    categorySelect.innerHTML = "";

    // Buat optgroup untuk pemasukan dan pengeluaran
    const pemasukanGroup = document.createElement("optgroup");
    pemasukanGroup.label = "Pemasukan";
    const pengeluaranGroup = document.createElement("optgroup");
    pengeluaranGroup.label = "Pengeluaran";

    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.category_id;
      option.textContent = cat.name;
      if (cat.type === "pemasukan") {
        pemasukanGroup.appendChild(option);
      } else {
        pengeluaranGroup.appendChild(option);
      }
    });

    categorySelect.appendChild(pemasukanGroup);
    categorySelect.appendChild(pengeluaranGroup);
  } catch (err) {
    console.error("Gagal memuat kategori:", err);
  }
}

// 3. Tambah transaksi baru
transactionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const category_id = categorySelect.value;
  const amount = document.getElementById("amount").value;
  const description = document.getElementById("description").value;
  const transaction_date = transactionDateEl.value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        category_id,
        amount,
        description,
        transaction_date,
      }),
    });

    if (!res.ok) {
      throw new Error("Gagal menambahkan transaksi");
    }

    transactionForm.reset();
    transactionDateEl.valueAsDate = new Date();
    await loadTransactions(); // Muat ulang daftar transaksi
    await loadDashboardData(); // Muat ulang data chart
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// 4. Muat dan tampilkan riwayat transaksi
async function loadTransactions() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions`, { headers });
    const transactions = await res.json();

    transactionList.innerHTML = ""; // Kosongkan tabel
    transactions.forEach((tx) => {
      const row = document.createElement("tr");
      const amountColor = tx.type === "pemasukan" ? "green" : "red";
      const amountSign = tx.type === "pemasukan" ? "+" : "-";

      row.innerHTML = `
                <td>${new Date(tx.transaction_date).toLocaleDateString(
                  "id-ID"
                )}</td>
                <td>${tx.category_name}</td>
                <td>${tx.description || "-"}</td>
                <td style="color: ${amountColor};">${amountSign} Rp ${Number(
        tx.amount
      ).toLocaleString("id-ID")}</td>
            `;
      transactionList.appendChild(row);
    });
  } catch (err) {
    console.error("Gagal memuat transaksi:", err);
  }
}

// 5. Muat data untuk dashboard (charts dan alerts)
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

// Fungsi untuk render Pie Chart
function renderPieChart(data) {
  const ctx = document.getElementById("expense-pie-chart").getContext("2d");
  const labels = data.map((item) => item.category_name);
  const values = data.map((item) => item.total_amount);

  if (pieChart) {
    pieChart.destroy();
  }

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
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
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

  if (barChart) {
    barChart.destroy();
  }

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
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Fungsi untuk render Peringatan Budget
function renderBudgetAlerts(data) {
  const container = document.getElementById("budget-alerts");
  container.innerHTML = ""; // Kosongkan

  if (data.length === 0) {
    container.innerHTML = "<p>Anda belum mengatur budget untuk bulan ini.</p>";
    return;
  }

  data.forEach((item) => {
    const percentage = Math.round(item.percentage_spent);
    let color = "green";
    if (percentage > 90) color = "red";
    else if (percentage > 75) color = "orange";

    const alertEl = document.createElement("div");
    alertEl.innerHTML = `
            <p><strong>${item.category_name}:</strong> Rp ${Number(
      item.total_spent
    ).toLocaleString("id-ID")} dari Rp ${Number(
      item.budget_amount
    ).toLocaleString("id-ID")} (${percentage}%)</p>
            <div style="background: #eee; border-radius: 5px; overflow: hidden;">
                <div style="width: ${percentage}%; background: ${color}; height: 10px;"></div>
            </div>
        `;
    container.appendChild(alertEl);
  });
}

// Jalankan fungsi inisialisasi
initializeDashboard();
