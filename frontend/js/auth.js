const API_URL = "http://localhost:3000/api/auth";
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginEl = document.getElementById("login");
const registerEl = document.getElementById("register");
const messageEl = document.getElementById("auth-message");

// Cek jika sudah login, langsung redirect ke dashboard
if (localStorage.getItem("token")) {
  window.location.href = "dashboard.html";
}

// Event Listeners untuk ganti form
document.getElementById("show-register").addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.style.display = "none";
  registerForm.style.display = "block";
});

document.getElementById("show-login").addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.style.display = "none";
  loginForm.style.display = "block";
});

// Event Listener untuk Login
loginEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.msg || "Gagal login");
    }

    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } catch (err) {
    messageEl.textContent = err.message;
  }
});

// Event Listener untuk Registrasi
registerEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nama = document.getElementById("register-nama").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.msg || "Gagal mendaftar");
    }

    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } catch (err) {
    messageEl.textContent = err.message;
  }
});