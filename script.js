localStorage.removeItem("stz_menu");
const menuStorageKey = "stz_menu";
const testimonyStorageKey = "stz_testimonials";
const authStorageKey = "stz_admin";
const menuGrid = document.getElementById("menuGrid");
const loginToggle = document.getElementById("loginToggle");
const logoutBtn = document.getElementById("logoutBtn");
const loginPopup = document.getElementById("loginPopup");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const adminSection = document.getElementById("adminSection");
const addMenuForm = document.getElementById("addMenuForm");
const editMenuId = document.getElementById("editMenuId");
const productDescription = document.getElementById("productDescription");
const productImageFile = document.getElementById("productImageFile");
const submitMenuBtn = document.getElementById("submitMenuBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const testimonyForm = document.getElementById("testimonyForm");
const testimonyName = document.getElementById("testimonyName");
const testimonyMessage = document.getElementById("testimonyMessage");
const testimonialGrid = document.getElementById("testimonialGrid");
const testimonialAdminCard = document.getElementById("testimonialAdminCard");
const testimonialAdminList = document.getElementById("testimonialAdminList");

let currentEditMenuId = null;

const defaultMenu = [
  {
    id: "menu-1",
    name: "Seblak Super Pedas",
    price: 39000,
    image: "images/seblakpedas.jpeg",
    description: "Seblak khas Teh Zara dengan bumbu otentik dan sensasi pedas mantap."
  },
  {
    id: "menu-2",
    name: "Seblak Komplit Zara",
    price: 45000,
    image: "images/seblakkomplit.jpg",
    description: "Varian komplit untuk penggemar tekstur dan rasa seimbang."
  },
  {
    id: "menu-3",
    name: "Seblak Level 10",
    price: 48000,
    image: "images/seblaklvl10.jpg",
    description: "Level pedas ekstra untuk pencinta cabai sejati dan rasa mendalam."
  }
];

const defaultTestimonials = [];

const fallbackUsers = [
  { username: "admin", password: "zara123" },
  { username: "staff", password: "pedas2026" }
];

function getAuthUser() {
  const raw = localStorage.getItem(authStorageKey);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function isAdmin() {
  return Boolean(getAuthUser());
}

async function fetchJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Gagal memuat");
    return await response.json();
  } catch {
    return fallback;
  }
}

async function loadMenuData() {
  const stored = localStorage.getItem(menuStorageKey);
  if (stored) return JSON.parse(stored);

  const menuData = await fetchJson("menu.json", defaultMenu);
  localStorage.setItem(menuStorageKey, JSON.stringify(menuData));
  return menuData;
}

function saveMenuData(menuItems) {
  localStorage.setItem(menuStorageKey, JSON.stringify(menuItems));
}

async function loadTestimonials() {
  const stored = localStorage.getItem(testimonyStorageKey);
  if (stored) return JSON.parse(stored);

  localStorage.setItem(testimonyStorageKey, JSON.stringify(defaultTestimonials));
  return defaultTestimonials;
}

function saveTestimonials(testimonials) {
  localStorage.setItem(testimonyStorageKey, JSON.stringify(testimonials));
}

function formatPrice(value) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

function createMenuCard(item) {
  const card = document.createElement("article");
  card.className = "menu-card";
  card.innerHTML = `
    <img src="${item.image}" alt="${item.name}" />
    <div class="menu-card-content">
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <div class="menu-meta">
        <span class="menu-price">${formatPrice(item.price)}</span>
        ${isAdmin() ? `
          <div class="menu-actions-admin">
            <button class="btn btn-primary edit-btn" data-id="${item.id}">Edit</button>
            <button class="btn btn-ghost delete-btn" data-id="${item.id}">Hapus</button>
          </div>
        ` : ""}
      </div>
    </div>
  `;
  return card;
}

function renderMenu(menuItems) {
  menuGrid.innerHTML = "";
  if (!menuItems.length) {
    menuGrid.innerHTML = '<p class="empty-state">Tidak ada menu tersedia saat ini.</p>';
    return;
  }

  menuItems.forEach((item) => {
    const card = createMenuCard(item);
    menuGrid.appendChild(card);
  });

  if (isAdmin()) {
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const confirmed = confirm("Hapus menu ini? Anda tidak dapat membatalkannya.");
        if (!confirmed) return;
        const menuData = await loadMenuData();
        const nextMenu = menuData.filter((item) => item.id !== button.dataset.id);
        saveMenuData(nextMenu);
        renderMenu(nextMenu);
      });
    });

    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const menuData = await loadMenuData();
        const item = menuData.find((entry) => entry.id === button.dataset.id);
        if (!item) return;
        enterEditMode(item);
      });
    });
  }
}

function createTestimonialCard(testimony, adminView = false) {
  const card = document.createElement("article");
  card.className = "testimonial-card";
  card.innerHTML = `
    <div class="testimonial-header">
      <strong>${testimony.name}</strong>
      <span class="testimonial-status ${testimony.status}">${testimony.status}</span>
    </div>
    <p>${testimony.message}</p>
    ${adminView ? `
      <div class="testimonial-actions">
        ${testimony.status === "pending" ? `<button class="btn btn-approve approve-btn" data-id="${testimony.id}">Approve</button>` : ""}
        <button class="btn btn-delete delete-testimony-btn" data-id="${testimony.id}">Hapus</button>
      </div>
    ` : ""}
  `;
  return card;
}

function renderTestimonials(testimonials) {
  if (!testimonialGrid) return;
  const approved = testimonials.filter((item) => item.status === "approved");
  testimonialGrid.innerHTML = "";
  if (!approved.length) {
    testimonialGrid.innerHTML = '<p class="empty-state">Belum ada testimoni yang disetujui.</p>';
    return;
  }

  approved.forEach((item) => {
    testimonialGrid.appendChild(createTestimonialCard(item));
  });
}

function renderAdminTestimonials(testimonials) {
  if (!testimonialAdminList) return;
  testimonialAdminList.innerHTML = "";
  if (!testimonials.length) {
    testimonialAdminList.innerHTML = '<p class="empty-state">Tidak ada testimoni.</p>';
    return;
  }

  testimonials.forEach((item) => {
    const card = createTestimonialCard(item, true);
    testimonialAdminList.appendChild(card);
  });

  document.querySelectorAll(".approve-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const testimonials = await loadTestimonials();
      const next = testimonials.map((entry) => entry.id === button.dataset.id ? { ...entry, status: "approved" } : entry);
      saveTestimonials(next);
      renderTestimonials(next);
      renderAdminTestimonials(next);
    });
  });

  document.querySelectorAll(".delete-testimony-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const confirmed = confirm("Hapus testimoni ini?");
      if (!confirmed) return;
      const testimonials = await loadTestimonials();
      const next = testimonials.filter((entry) => entry.id !== button.dataset.id);
      saveTestimonials(next);
      renderTestimonials(next);
      renderAdminTestimonials(next);
    });
  });
}

function resetMenuForm() {
  currentEditMenuId = null;
  editMenuId.value = "";
  addMenuForm.reset();
  productDescription.value = "";
  submitMenuBtn.textContent = "Tambah Menu";
  cancelEditBtn.classList.add("hidden");
}

function enterEditMode(item) {
  currentEditMenuId = item.id;
  editMenuId.value = item.id;
  document.getElementById("productName").value = item.name;
  document.getElementById("productDescription").value = item.description || "";
  document.getElementById("productPrice").value = item.price;
  productImageFile.value = "";
  submitMenuBtn.textContent = "Update Menu";
  cancelEditBtn.classList.remove("hidden");
}

async function handleMenuSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const description = document.getElementById("productDescription").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const file = productImageFile.files[0];

  if (!name || !price || !description) return;

  const menuData = await loadMenuData();
  const imageBase = file ? await fileToBase64(file) : null;

  if (currentEditMenuId) {
    const nextMenu = menuData.map((item) => {
      if (item.id !== currentEditMenuId) return item;
      return {
        ...item,
        name,
        description,
        price,
        image: imageBase || item.image
      };
    });
    saveMenuData(nextMenu);
    renderMenu(nextMenu);
    resetMenuForm();
    return;
  }

  const newMenu = {
    id: `menu-${Date.now()}`,
    name,
    description,
    price,
    image: imageBase || "images/hero-seblak.jpg"
  };
  const nextMenu = [newMenu, ...menuData];
  saveMenuData(nextMenu);
  renderMenu(nextMenu);
  resetMenuForm();
}

async function handleTestimonySubmit(event) {
  event.preventDefault();
  const name = testimonyName.value.trim();
  const message = testimonyMessage.value.trim();
  if (!name || !message) return;

  const testimonials = await loadTestimonials();
  const next = [
    {
      id: `testimony-${Date.now()}`,
      name,
      message,
      status: "pending"
    },
    ...testimonials
  ];

  saveTestimonials(next);
  renderTestimonials(next);
  testimonyName.value = "";
  testimonyMessage.value = "";
  alert("Testimoni Anda telah dikirim dan menunggu approval admin.");
}

function updateAuthUI() {
  if (isAdmin()) {
    loginToggle.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    adminSection.classList.remove("hidden");
    testimonialAdminCard.classList.remove("hidden");
    loginPopup.classList.add("hidden");
  } else {
    loginToggle.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    adminSection.classList.add("hidden");
    testimonialAdminCard.classList.add("hidden");
  }
}

function togglePopup() {
  loginPopup.classList.toggle("hidden");
}

async function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = "";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    loginError.textContent = "Masukkan username dan password.";
    return;
  }

  const users = await fetchJson("users.json", fallbackUsers);
  const matched = users.find((user) => user.username === username && user.password === password);

  if (!matched) {
    loginError.textContent = "Username atau password salah.";
    return;
  }

  localStorage.setItem(authStorageKey, JSON.stringify({ username: matched.username }));
  updateAuthUI();
  const [menuData, testimonyData] = await Promise.all([loadMenuData(), loadTestimonials()]);
  renderMenu(menuData);
  renderAdminTestimonials(testimonyData);
  renderTestimonials(testimonyData);
  loginForm.reset();
}

function handleLogout() {
  localStorage.removeItem(authStorageKey);
  updateAuthUI();
  resetMenuForm();
  loadMenuData().then(renderMenu);
  loadTestimonials().then((data) => {
    renderTestimonials(data);
  });
}

function handleCancelEdit() {
  resetMenuForm();
}

document.addEventListener("DOMContentLoaded", async () => {
  loginToggle.addEventListener("click", togglePopup);
  logoutBtn.addEventListener("click", handleLogout);
  loginForm.addEventListener("submit", handleLogin);
  addMenuForm.addEventListener("submit", handleMenuSubmit);
  cancelEditBtn.addEventListener("click", handleCancelEdit);
  testimonyForm.addEventListener("submit", handleTestimonySubmit);

  document.addEventListener("click", (event) => {
    if (!loginPopup.contains(event.target) && !loginToggle.contains(event.target)) {
      loginPopup.classList.add("hidden");
    }
  });

  updateAuthUI();

  const [menuData, testimonyData] = await Promise.all([loadMenuData(), loadTestimonials()]);
  renderMenu(menuData);
  renderTestimonials(testimonyData);
  if (isAdmin()) renderAdminTestimonials(testimonyData);
});
