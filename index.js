// ============================================================
// NAMITA STORE
// Accounting & Inventory + POS
// FULL WORKING BASE VERSION
// ============================================================

const app = document.getElementById("app");
const STORAGE_KEY = "namita_store_full_v1";

const DEFAULT_DATA = {
  products: [],
  customers: [],
  suppliers: [],
  sales: [],
  purchases: [],
  payments: [],
  expenses: [],
  stockAdjustments: [],
  settings: {
    businessName: "NAMITA STORE",
    phone: "",
    address: "",
    currency: "₹",
    taxRate: 0,
    invoicePrefix: "INV",
    purchasePrefix: "PUR",
    barcodeTemplates: [
      "25x50 - 2 Line",
      "25x50 - 1 Line",
      "15x25 - 4 Line"
    ],
    selectedBarcodeTemplate: "25x50 - 2 Line"
  }
};

let data = loadData();

let currentPage = "dashboard";
let editingId = null;
let searchText = "";
let posCart = [];
let purchaseCart = [];
let toastTimer = null;

// ============================================================
// DATA
// ============================================================

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        ...clone(DEFAULT_DATA),
        ...parsed,
        settings: {
          ...clone(DEFAULT_DATA.settings),
          ...(parsed.settings || {})
        }
      };
    }
  } catch (e) {
    console.error(e);
  }

  return clone(DEFAULT_DATA);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function id(prefix) {
  return prefix + Date.now() + Math.floor(Math.random() * 999);
}

function money(n) {
  return data.settings.currency +
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
}

function num(v) {
  return Number(v || 0);
}

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dateTime() {
  return new Date().toISOString();
}

function toast(message, error = false) {
  const old = document.getElementById("toast");
  if (old) old.remove();

  const el = document.createElement("div");

  el.id = "toast";
  el.className =
    "fixed right-5 bottom-5 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-white " +
    (error ? "bg-red-600" : "bg-slate-900");

  el.textContent = message;
  document.body.appendChild(el);

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    el.remove();
  }, 2500);
}

// ============================================================
// NAVIGATION
// ============================================================

const titles = {
  dashboard: "Dashboard",
  pos: "POS / Sales",
  purchase: "Purchase",
  products: "Products / Inventory",
  customers: "Customers",
  suppliers: "Suppliers",
  payments: "Due / Payments",
  history: "Transaction History",
  expenses: "Expenses",
  cash: "Cash & Accounts",
  reports: "Reports",
  barcode: "Barcode",
  settings: "Settings"
};

function navigate(page) {
  currentPage = page;
  editingId = null;
  searchText = "";

  if (page !== "pos") posCart = [];
  if (page !== "purchase") purchaseCart = [];

  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function toggleSidebar() {
  const s = document.getElementById("sidebar");
  if (s) s.classList.toggle("open");
}

function nav(page, icon, text) {
  return `
    <button
      onclick="navigate('${page}')"
      class="nav-btn ${
        currentPage === page ? "active" : ""
      } w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
    >
      <span class="text-lg">${icon}</span>
      <span>${text}</span>
    </button>
  `;
}

// ============================================================
// RENDER
// ============================================================

function r
