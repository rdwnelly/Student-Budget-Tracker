const API_URL = "http://localhost:5050/api";

// =================== LOGIN ===================
if (window.location.pathname.endsWith("login.html")) {
  document.getElementById("loginForm").onsubmit = async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const res = await fetch(API_URL + "/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      window.location = "dashboard.html";
    } else {
      document.getElementById("loginError").innerText =
        data.msg || "Login gagal";
    }
  };
}

// =================== REGISTER ===================
if (window.location.pathname.endsWith("register.html")) {
  document.getElementById("registerForm").onsubmit = async function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const res = await fetch(API_URL + "/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      window.location = "login.html";
    } else {
      document.getElementById("registerError").innerText =
        data.msg || "Registrasi gagal";
    }
  };
}

// =================== DASHBOARD ===================
if (window.location.pathname.endsWith("dashboard.html")) {
  const token = localStorage.getItem("token");
  if (!token) window.location = "login.html";

  // LOGOUT
  document.getElementById("logoutBtn").onclick = function () {
    localStorage.removeItem("token");
    window.location = "login.html";
  };

  // --- FETCH KATEGORI ---
  async function fetchCategories() {
    const res = await fetch(API_URL + "/budget/categories", {
      headers: { Authorization: token },
    });
    return await res.json();
  }

  // --- RENDER & RELOAD KATEGORI ---
  async function reloadCategories() {
    const cats = await fetchCategories();
    const categorySel = document.getElementById("category");
    const budgetCatSel = document.getElementById("budgetCategory");
    const categoryList = document.getElementById("categoryList");
    if (categorySel) categorySel.innerHTML = "";
    if (budgetCatSel) budgetCatSel.innerHTML = "";
    if (categoryList) categoryList.innerHTML = "";

    cats.forEach((c) => {
      // Dropdown form transaksi & budget
      if (c.id) {
        let opt1 = document.createElement("option");
        opt1.value = c.id;
        opt1.text = c.name;
        if (categorySel) categorySel.appendChild(opt1);

        let opt2 = document.createElement("option");
        opt2.value = c.id;
        opt2.text = c.name;
        if (budgetCatSel) budgetCatSel.appendChild(opt2);
      }
      // List kategori yang bisa diedit (hanya kategori custom, ada user_id)
      if (c.user_id && categoryList) {
        let li = document.createElement("li");
        li.innerHTML = `<span>${c.name} (${
          c.is_income ? "Pemasukan" : "Pengeluaran"
        })</span> 
          <button class="edit-cat-btn" onclick="editCategoryPrompt(${c.id},'${
          c.name
        }')">Edit</button>`;
        categoryList.appendChild(li);
      }
    });
  }
  window.reloadCategories = reloadCategories;
  reloadCategories();

  // --- TAMBAH KATEGORI BARU ---
  document.getElementById("addCategoryForm").onsubmit = async function (e) {
    e.preventDefault();
    const name = document.getElementById("newCategoryName").value;
    const is_income =
      document.getElementById("newCategoryType").value === "true";
    if (!name) return;
    const res = await fetch(API_URL + "/budget/category", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ name, is_income }),
    });
    if (res.ok) {
      document.getElementById("newCategoryName").value = "";
      reloadCategories();
      alert("Kategori berhasil ditambahkan!");
    } else {
      alert("Gagal tambah kategori!");
    }
  };

  // --- EDIT KATEGORI ---
  window.editCategoryPrompt = function (id, oldName) {
    const newName = prompt("Edit nama kategori:", oldName);
    if (newName && newName !== oldName) {
      fetch(API_URL + `/budget/category/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ name: newName }),
      })
        .then((r) => r.json())
        .then((data) => {
          reloadCategories();
          alert(data.msg || "Kategori diubah!");
        });
    }
  };

  // --- SUBMIT TRANSAKSI ---
  document.getElementById("trxForm").onsubmit = async function (e) {
    e.preventDefault();
    const category_id = document.getElementById("category").value;
    const amount = Number(document.getElementById("amount").value);
    const type = document.getElementById("type").value;
    const note = document.getElementById("note").value || "";

    if (!category_id || !amount || !type) {
      alert("Semua kolom wajib diisi!");
      return;
    }
    if (isNaN(category_id)) {
      alert("Kategori harus dipilih dari daftar!");
      return;
    }

    const res = await fetch(API_URL + "/budget/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({
        category_id: Number(category_id),
        amount,
        type,
        note,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Transaksi berhasil dicatat!");
      window.location.reload();
    } else {
      alert(data.msg || "Gagal mencatat transaksi!");
    }
  };

  // --- SUBMIT BUDGET ---
  document.getElementById("budgetForm").onsubmit = async function (e) {
    e.preventDefault();
    const category_id = document.getElementById("budgetCategory").value;
    const amount = Number(document.getElementById("budgetAmount").value);
    const month = document.getElementById("budgetMonth").value;

    if (!category_id || !amount || !month) {
      alert("Semua kolom wajib diisi!");
      return;
    }
    if (isNaN(category_id)) {
      alert("Kategori harus dipilih dari daftar!");
      return;
    }

    const res = await fetch(API_URL + "/budget/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ category_id: Number(category_id), amount, month }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Budget tersimpan!");
      window.location.reload();
    } else {
      alert(data.msg || "Gagal menyimpan budget!");
    }
  };

  // === HELPER: AMBIL BULAN SEKARANG ===
  function getCurrentMonth() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }
  if (document.getElementById("monthTitle")) {
    document.getElementById("monthTitle").innerText = getCurrentMonth();
  }

  // === FETCH STATISTIK UNTUK CHART ===
  async function fetchStats() {
    const res = await fetch(
      API_URL + `/budget/stats?month=${getCurrentMonth()}`,
      {
        headers: { Authorization: token },
      }
    );
    return await res.json();
  }

  fetchStats().then((stats) => {
    let totalIncome = 0,
      totalExpense = 0;
    const categories = [],
      amounts = [];
    stats.forEach((s) => {
      if (s.type === "income") totalIncome += Number(s.total);
      else totalExpense += Number(s.total);
      categories.push(s.name);
      amounts.push(Number(s.total));
    });
    if (document.getElementById("totalIncome"))
      document.getElementById("totalIncome").innerText = "Rp" + totalIncome;
    if (document.getElementById("totalExpense"))
      document.getElementById("totalExpense").innerText = "Rp" + totalExpense;
    if (document.getElementById("remainingBudget"))
      document.getElementById("remainingBudget").innerText =
        "Rp" + (totalIncome - totalExpense);

    // Pie chart (komposisi pengeluaran)
    if (document.getElementById("pieChart")) {
      new Chart(document.getElementById("pieChart"), {
        type: "pie",
        data: {
          labels: categories,
          datasets: [{ data: amounts }],
        },
      });
    }

    // Bar chart (perbandingan bulanan)
    if (document.getElementById("barChart")) {
      new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
          labels: categories,
          datasets: [{ label: "Pengeluaran", data: amounts }],
        },
      });
    }
  });
}
