/* =========================================================
   NAMITA STORE — Accounting & Inventory
   COMPLETE CORRECTED APPLICATION
   PART 1 / 3
   IMPORTANT: DO NOT ADD `})();` AT THE END OF THIS PART.
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     STORAGE KEYS
     ======================================================= */

  const KEY = {
    products: "ns_products",
    customers: "ns_customers",
    suppliers: "ns_suppliers",
    purchases: "ns_purchases",
    sales: "ns_sales",
    payments: "ns_payments",
    stockHistory: "ns_stock_history",
    ecommerce: "ns_ecommerce",
    settings: "ns_settings",
    barcode: "ns_barcode_settings"
  };

  /* =======================================================
     HELPERS
     ======================================================= */

  const $ = (id) => document.getElementById(id);

  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const money = (value) => {
    const currency =
      settings &&
      settings.currency
        ? settings.currency
        : "₹";

    return (
      currency +
      num(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  };

  const today = () =>
    new Date().toISOString().slice(0, 10);

  const nowISO = () =>
    new Date().toISOString();

  const uid = (prefix) =>
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 9);

  function load(key, fallback) {
    try {
      const value = localStorage.getItem(key);

      if (!value) {
        return fallback;
      }

      const parsed = JSON.parse(value);

      return parsed ?? fallback;
    } catch (error) {
      console.error("Load error:", key, error);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error("Save error:", key, error);
      toast("Data could not be saved.");
    }
  }

  function clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function findProduct(id) {
    return products.find(
      (p) =>
        String(p.id) === String(id)
    );
  }

  function findCustomer(id) {
    return customers.find(
      (c) =>
        String(c.id) === String(id)
    );
  }

  function findSupplier(id) {
    return suppliers.find(
      (s) =>
        String(s.id) === String(id)
    );
  }

  function productName(id) {
    return (
      findProduct(id)?.name ||
      "Unknown Product"
    );
  }

  /* =======================================================
     DATA
     ======================================================= */

  let products = load(
    KEY.products,
    []
  );

  let customers = load(
    KEY.customers,
    []
  );

  let suppliers = load(
    KEY.suppliers,
    []
  );

  let purchases = load(
    KEY.purchases,
    []
  );

  let sales = load(
    KEY.sales,
    []
  );

  let payments = load(
    KEY.payments,
    []
  );

  let stockHistory = load(
    KEY.stockHistory,
    []
  );

  let ecommerce = load(
    KEY.ecommerce,
    []
  );

  let settings = load(
    KEY.settings,
    {
      store: "NAMITA STORE",
      phone: "",
      address: "",
      currency: "₹"
    }
  );

  let barcodeSettings = load(
    KEY.barcode,
    {
      template: "25x50-2",
      showStore: true,
      showProduct: true,
      showBarcode: true,
      showPrice: true,
      showSku: true,
      pageMargin: 0,
      columnGap: 0,
      rowGap: 0
    }
  );

  /* -------------------------------------------------------
     Compatibility with older data
     ------------------------------------------------------- */

  if (!Array.isArray(products)) {
    products = [];
  }

  if (!Array.isArray(customers)) {
    customers = [];
  }

  if (!Array.isArray(suppliers)) {
    suppliers = [];
  }

  if (!Array.isArray(purchases)) {
    purchases = [];
  }

  if (!Array.isArray(sales)) {
    sales = [];
  }

  if (!Array.isArray(payments)) {
    payments = [];
  }

  if (!Array.isArray(stockHistory)) {
    stockHistory = [];
  }

  if (!Array.isArray(ecommerce)) {
    ecommerce = [];
  }

  /* -------------------------------------------------------
     Normalize old product records
     ------------------------------------------------------- */

  products = products.map((p) => ({
    id: p.id || uid("PRD"),
    name: p.name || "",
    sku: p.sku || "",
    barcode: p.barcode || "",
    category: p.category || "General",
    purchase: num(p.purchase),
    sale: num(p.sale),
    mrp: num(
      p.mrp ?? p.sale
    ),
    stock: num(p.stock),
    minStock: num(p.minStock),
    gst: num(p.gst),
    hsn: p.hsn || "",
    unit: p.unit || "PCS",
    description: p.description || "",
    createdAt:
      p.createdAt || nowISO(),
    updatedAt:
      p.updatedAt || nowISO()
  }));

  customers = customers.map((c) => ({
    id: c.id || uid("CUS"),
    name: c.name || "",
    phone: c.phone || "",
    address: c.address || "",
    due: num(c.due),
    createdAt:
      c.createdAt || nowISO()
  }));

  suppliers = suppliers.map((s) => ({
    id: s.id || uid("SUP"),
    name: s.name || "",
    phone: s.phone || "",
    address: s.address || "",
    due: num(s.due),
    createdAt:
      s.createdAt || nowISO()
  }));

  /* =======================================================
     STATE
     ======================================================= */

  let cart = [];

  let purchaseDraft = [];

  let barcodeQueue = [];

  let currentPage = "dashboard";

  let editingProductId = null;

  let editingCustomerId = null;

  let editingSupplierId = null;

  let editingEcommerceId = null;

  /* =======================================================
     CSS
     ======================================================= */

  const style =
    document.createElement("style");

  style.textContent = `
    * {
      box-sizing: border-box;
    }

    :root {
      --primary: #0f766e;
      --primary-dark: #115e59;
      --secondary: #2563eb;
      --green: #15803d;
      --red: #dc2626;
      --orange: #ea580c;
      --purple: #7c3aed;
      --yellow: #ca8a04;
      --dark: #172033;
      --muted: #64748b;
      --border: #e2e8f0;
      --bg: #f1f5f9;
      --white: #ffffff;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--dark);
      font-family:
        Arial,
        "Noto Sans Bengali",
        "Noto Sans",
        sans-serif;
    }

    button,
    input,
    select,
    textarea {
      font: inherit;
    }

    button {
      cursor: pointer;
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: 2px solid rgba(15,118,110,.18);
      border-color: var(--primary) !important;
    }

    .ns-app {
      display: flex;
      min-height: 100vh;
    }

    /* SIDEBAR */

    .ns-sidebar {
      width: 255px;
      background:
        linear-gradient(
          180deg,
          #0f766e 0%,
          #115e59 55%,
          #134e4a 100%
        );
      color: #fff;
      position: fixed;
      inset: 0 auto 0 0;
      overflow-y: auto;
      padding: 16px 11px;
      z-index: 100;
      box-shadow:
        5px 0 25px rgba(0,0,0,.12);
    }

    .ns-logo {
      text-align: center;
      padding:
        10px
        5px
        20px;
      border-bottom:
        1px solid
        rgba(255,255,255,.18);
      margin-bottom: 14px;
    }

    .ns-logo-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(255,255,255,.14);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 25px;
      margin-bottom: 7px;
    }

    .ns-logo h2 {
      margin: 0;
      font-size: 21px;
      letter-spacing: .4px;
    }

    .ns-logo small {
      opacity: .75;
      display: block;
      margin-top: 4px;
    }

    .ns-nav button {
      width: 100%;
      border: 0;
      color: #fff;
      background: transparent;
      padding: 11px 12px;
      margin: 3px 0;
      border-radius: 10px;
      text-align: left;
      transition: .15s;
    }

    .ns-nav button:hover {
      background:
        rgba(255,255,255,.13);
      transform: translateX(2px);
    }

    .ns-nav button.active {
      background: #fff;
      color: var(--primary-dark);
      font-weight: bold;
      box-shadow:
        0 4px 12px
        rgba(0,0,0,.12);
    }

    /* MAIN */

    .ns-main {
      margin-left: 255px;
      width: calc(100% - 255px);
      min-height: 100vh;
    }

    .ns-top {
      background: rgba(255,255,255,.97);
      border-bottom:
        1px solid
        var(--border);
      padding:
        13px
        22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(10px);
    }

    .ns-top-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ns-top h1,
    .ns-top strong {
      margin: 0;
      font-size: 20px;
    }

    .ns-top-date {
      color: var(--muted);
      font-size: 13px;
    }

    .ns-content {
      padding: 20px;
      max-width: 1800px;
      margin: auto;
    }

    /* CARDS */

    .ns-card {
      background: var(--white);
      border:
        1px solid
        var(--border);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 18px;
      box-shadow:
        0 5px 20px
        rgba(15,118,110,.045);
    }

    .ns-card h2,
    .ns-card h3 {
      margin-top: 0;
    }

    .ns-card-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }

    .ns-card-title h2,
    .ns-card-title h3 {
      margin: 0;
    }

    /* STATS */

    .ns-grid {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }

    .ns-stat {
      background: #fff;
      border:
        1px solid
        var(--border);
      border-radius: 15px;
      padding: 17px;
      position: relative;
      overflow: hidden;
    }

    .ns-stat::after {
      content: "";
      position: absolute;
      width: 55px;
      height: 55px;
      right: -17px;
      bottom: -17px;
      border-radius: 50%;
      background:
        rgba(15,118,110,.07);
    }

    .ns-stat small {
      color: var(--muted);
      font-size: 12px;
    }

    .ns-stat strong {
      display: block;
      font-size: 24px;
      margin-top: 7px;
    }

    /* FORMS */

    .ns-form {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 13px;
    }

    .ns-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .ns-field label {
      font-size: 13px;
      font-weight: bold;
      color: #334155;
    }

    .ns-field input,
    .ns-field select,
    .ns-field textarea {
      width: 100%;
      padding: 10px 11px;
      border:
        1px solid
        #cbd5e1;
      border-radius: 9px;
      background: #fff;
      min-height: 40px;
    }

    .ns-field textarea {
      min-height: 80px;
      resize: vertical;
    }

    .ns-full {
      grid-column: 1 / -1;
    }

    /* BUTTONS */

    .ns-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 15px;
    }

    .ns-btn {
      border: 0;
      border-radius: 9px;
      padding: 10px 14px;
      background: var(--primary);
      color: #fff;
      font-weight: bold;
      transition: .15s;
    }

    .ns-btn:hover {
      transform: translateY(-1px);
      opacity: .93;
    }

    .ns-btn.secondary {
      background: #475569;
    }

    .ns-btn.green {
      background: var(--green);
    }

    .ns-btn.red {
      background: var(--red);
    }

    .ns-btn.orange {
      background: var(--orange);
    }

    .ns-btn.blue {
      background: var(--secondary);
    }

    .ns-btn.purple {
      background: var(--purple);
    }

    .ns-btn.yellow {
      background: var(--yellow);
    }

    .ns-btn.light {
      background: #e2e8f0;
      color: var(--dark);
    }

    .ns-btn.small {
      padding: 6px 9px;
      font-size: 12px;
    }

    /* TABLE */

    .ns-table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 700px;
    }

    th,
    td {
      padding: 10px;
      border-bottom:
        1px solid
        #e5e7eb;
      text-align: left;
      vertical-align: middle;
    }

    th {
      background: #f8fafc;
      font-size: 12px;
      color: #334155;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    tr:hover td {
      background: #fafafa;
    }

    /* BADGES */

    .ns-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      background: #e2e8f0;
    }

    .ns-badge.green {
      background: #dcfce7;
      color: #166534;
    }

    .ns-badge.red {
      background: #fee2e2;
      color: #991b1b;
    }

    .ns-badge.orange {
      background: #ffedd5;
      color: #9a3412;
    }

    .ns-badge.blue {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .ns-badge.purple {
      background: #ede9fe;
      color: #6d28d9;
    }

    /* TOOLBAR */

    .ns-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      align-items: center;
      margin-bottom: 15px;
    }

    .ns-toolbar input,
    .ns-toolbar select {
      padding: 9px 10px;
      border:
        1px solid
        #cbd5e1;
      border-radius: 8px;
      background: #fff;
    }

    /* EMPTY */

    .ns-empty {
      padding: 30px 15px;
      text-align: center;
      color: var(--muted);
      border-radius: 10px;
      background: #f8fafc;
    }

    /* QUICK ACTIONS */

    .ns-shortcuts {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0,1fr));
      gap: 11px;
    }

    .ns-shortcut {
      border:
        1px solid
        var(--border);
      background: #fff;
      border-radius: 13px;
      padding: 16px;
      text-align: left;
      font-weight: bold;
      color: var(--dark);
      transition: .15s;
    }

    .ns-shortcut:hover {
      border-color: var(--primary);
      box-shadow:
        0 5px 15px
        rgba(15,118,110,.08);
      transform: translateY(-1px);
    }

    /* POS */

    .ns-sale-layout {
      display: grid;
      grid-template-columns:
        minmax(0,1.65fr)
        minmax(320px,.85fr);
      gap: 18px;
      align-items: start;
    }

    .ns-pos-header {
      background:
        linear-gradient(
          135deg,
          #0f766e,
          #0d9488
        );
      color: #fff;
      border-radius: 15px;
      padding: 17px;
      margin-bottom: 15px;
    }

    .ns-pos-header h2 {
      margin: 0 0 5px;
    }

    .ns-pos-header small {
      opacity: .8;
    }

    .ns-product-picker {
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0,1fr));
      gap: 10px;
      margin-top: 13px;
    }

    .ns-product-mini {
      border:
        1px solid
        #dbe4e4;
      background: #fff;
      border-radius: 12px;
      padding: 12px;
      text-align: left;
      min-height: 125px;
      transition: .15s;
    }

    .ns-product-mini:hover {
      border-color: var(--primary);
      box-shadow:
        0 5px 16px
        rgba(15,118,110,.08);
    }

    .ns-product-mini .p-name {
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
    }

    .ns-product-mini .p-price {
      display: block;
      margin-top: 7px;
      color: var(--primary);
      font-size: 16px;
      font-weight: bold;
    }

    .ns-stock-ok {
      color: #166534;
    }

    .ns-stock-low {
      color: #b45309;
    }

    .ns-stock-out {
      color: #b91c1c;
    }

    .ns-cart-row {
      display: grid;
      grid-template-columns:
        minmax(160px,1fr)
        85px
        110px
        38px;
      gap: 8px;
      align-items: center;
      padding: 10px 0;
      border-bottom:
        1px solid
        #e5e7eb;
    }

    .ns-cart-row input {
      width: 100%;
      padding: 8px;
      border:
        1px solid
        #cbd5e1;
      border-radius: 7px;
    }

    .ns-total-box {
      background:
        linear-gradient(
          180deg,
          #f8fafc,
          #f1f5f9
        );
      border-radius: 12px;
      padding: 14px;
      margin-top: 12px;
      border:
        1px solid
        #e2e8f0;
    }

    .ns-total-line {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 5px 0;
    }

    .ns-total-line.big {
      font-size: 21px;
      font-weight: bold;
      border-top:
        1px solid
        #cbd5e1;
      margin-top: 7px;
      padding-top: 11px;
    }

    .ns-payment-box {
      background: #f0fdfa;
      border:
        1px solid
        #ccfbf1;
      border-radius: 12px;
      padding: 13px;
      margin-top: 13px;
    }

    /* MODAL */

    .ns-modal {
      position: fixed;
      inset: 0;
      background:
        rgba(15,23,42,.62);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 15px;
    }

    .ns-modal.show {
      display: flex;
    }

    .ns-modal-box {
      background: #fff;
      width: min(950px,100%);
      max-height: 93vh;
      overflow: auto;
      border-radius: 17px;
      padding: 20px;
      box-shadow:
        0 20px 60px
        rgba(0,0,0,.25);
    }

    .ns-modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }

    .ns-close {
      border: 0;
      background: #fee2e2;
      color: #991b1b;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 20px;
    }

    /* DASHBOARD */

    .ns-dashboard-banner {
      background:
        linear-gradient(
          135deg,
          #115e59,
          #0f766e,
          #0d9488
        );
      color: #fff;
      border-radius: 17px;
      padding: 22px;
      margin-bottom: 18px;
      box-shadow:
        0 8px 25px
        rgba(15,118,110,.15);
    }

    .ns-dashboard-banner h2 {
      margin: 0 0 5px;
    }

    .ns-dashboard-banner p {
      margin: 0;
      opacity: .85;
    }

    /* MOBILE */

    .ns-mobile-menu {
      display: none;
    }

    /* TOAST */

    #nsToast {
      max-width: 380px;
    }

    /* PRINT */

    @media print {
      body {
        background: #fff !important;
      }

      .ns-sidebar,
      .ns-top,
      .ns-no-print,
      button {
        display: none !important;
      }

      .ns-main {
        margin-left: 0 !important;
        width: 100% !important;
      }

      .ns-content {
        padding: 0 !important;
      }
    }

    @media (max-width: 1200px) {
      .ns-grid {
        grid-template-columns:
          repeat(3, minmax(0,1fr));
      }

      .ns-shortcuts {
        grid-template-columns:
          repeat(3, minmax(0,1fr));
      }
    }

    @media (max-width: 1000px) {
      .ns-sale-layout {
        grid-template-columns: 1fr;
      }

      .ns-form {
        grid-template-columns:
          repeat(2, minmax(0,1fr));
      }

      .ns-product-picker {
        grid-template-columns:
          repeat(2, minmax(0,1fr));
      }
    }

    @media (max-width: 750px) {
      .ns-sidebar {
        transform: translateX(-100%);
        transition: .2s;
      }

      .ns-sidebar.open {
        transform: translateX(0);
      }

      .ns-main {
        margin-left: 0;
        width: 100%;
      }

      .ns-mobile-menu {
        display: inline-flex;
      }

      .ns-grid,
      .ns-form {
        grid-template-columns: 1fr;
      }

      .ns-shortcuts {
        grid-template-columns: 1fr;
      }

      .ns-product-picker {
        grid-template-columns: 1fr;
      }

      .ns-content {
        padding: 12px;
      }

      .ns-top {
        padding: 12px;
      }

      .ns-cart-row {
        grid-template-columns:
          1fr 70px 90px 35px;
      }
    }
  `;

  document.head.appendChild(style);

  /* =======================================================
     APP SHELL
     ======================================================= */

  const app = $("app");

  if (!app) {
    console.error(
      "NAMITA STORE: Element #app not found."
    );
    return;
  }

  app.innerHTML = `
    <div class="ns-app">

      <aside
        class="ns-sidebar"
        id="nsSidebar"
      >

        <div class="ns-logo">

          <div class="ns-logo-icon">
            🏪
          </div>

          <h2>
            NAMITA STORE
          </h2>

          <small>
            Accounting & Inventory
          </small>

        </div>

        <div class="ns-nav">

          <button data-page="dashboard">
            🏠 Dashboard
          </button>

          <button data-page="seller">
            🧾 Seller Panel
          </button>

          <button data-page="sales">
            🛒 Sales / POS
          </button>

          <button data-page="purchase">
            📥 Purchase
          </button>

          <button data-page="products">
            📦 Products & Stock
          </button>

          <button data-page="customers">
            👤 Customers
          </button>

          <button data-page="suppliers">
            🏭 Suppliers
          </button>

          <button data-page="payments">
            💰 Due / Payments
          </button>

          <button data-page="history">
            📋 Transaction History
          </button>

          <button data-page="barcode">
            🏷️ Barcode Settings
          </button>

          <button data-page="reports">
            📊 Reports
          </button>

          <button data-page="ecommerce">
            🛍️ E-Commerce
          </button>

          <button data-page="settings">
            ⚙️ Settings
          </button>

        </div>

      </aside>

      <main class="ns-main">

        <header class="ns-top">

          <div class="ns-top-left">

            <button
              class="ns-btn light ns-mobile-menu"
              id="mobileMenu"
              type="button"
            >
              ☰
            </button>

            <strong id="pageTitle">
              Dashboard
            </strong>

          </div>

          <div class="ns-top-date">
            <span id="topDate"></span>
          </div>

        </header>

        <div
          class="ns-content"
          id="pageContent"
        ></div>

      </main>

    </div>

    <div
      class="ns-modal"
      id="nsModal"
    >

      <div class="ns-modal-box">

        <div class="ns-modal-head">

          <h2
            id="modalTitle"
            style="margin:0"
          ></h2>

          <button
            class="ns-close"
            id="modalClose"
            type="button"
          >
            ×
          </button>

        </div>

        <div id="modalBody"></div>

      </div>

    </div>
  `;

  $("topDate").textContent =
    new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  /* =======================================================
     NAVIGATION EVENTS
     ======================================================= */

  document
    .querySelectorAll(".ns-nav button")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          showPage(
            button.dataset.page
          );

          $("nsSidebar")
            .classList
            .remove("open");

        }
      );

    });

  $("mobileMenu").addEventListener(
    "click",
    () => {

      $("nsSidebar")
        .classList
        .toggle("open");

    }
  );

  $("modalClose").addEventListener(
    "click",
    closeModal
  );

  $("nsModal").addEventListener(
    "click",
    (event) => {

      if (
        event.target.id ===
        "nsModal"
      ) {
        closeModal();
      }

    }
  );

  /* =======================================================
     MODAL
     ======================================================= */

  function openModal(
    title,
    html
  ) {

    $("modalTitle").textContent =
      title;

    $("modalBody").innerHTML =
      html;

    $("nsModal")
      .classList
      .add("show");
  }

  window.openModal =
    openModal;

  function closeModal() {

    $("nsModal")
      .classList
      .remove("show");
  }

  window.closeModal =
    closeModal;

  /* =======================================================
     TOAST
     ======================================================= */

  function toast(message) {

    const old =
      document.getElementById(
        "nsToast"
      );

    if (old) {
      old.remove();
    }

    const element =
      document.createElement("div");

    element.id =
      "nsToast";

    element.style.cssText = `
      position:fixed;
      right:18px;
      bottom:18px;
      background:#0f766e;
      color:#fff;
      padding:13px 18px;
      border-radius:11px;
      z-index:99999;
      box-shadow:
        0 8px 25px
        rgba(0,0,0,.22);
      font-weight:bold;
    `;

    element.textContent =
      message;

    document.body.appendChild(
      element
    );

    setTimeout(() => {

      if (element.parentNode) {
        element.remove();
      }

    }, 2800);
  }

  window.toast = toast;

  /* =======================================================
     SAVE ALL
     ======================================================= */

  function saveAll() {

    save(
      KEY.products,
      products
    );

    save(
      KEY.customers,
      customers
    );

    save(
      KEY.suppliers,
      suppliers
    );

    save(
      KEY.purchases,
      purchases
    );

    save(
      KEY.sales,
      sales
    );

    save(
      KEY.payments,
      payments
    );

    save(
      KEY.stockHistory,
      stockHistory
    );

    save(
      KEY.ecommerce,
      ecommerce
    );

    save(
      KEY.settings,
      settings
    );

    save(
      KEY.barcode,
      barcodeSettings
    );
  }

  window.saveAll =
    saveAll;

  /* =======================================================
     DASHBOARD
     ======================================================= */

  function totalSales() {
    return sales.reduce(
      (sum, sale) =>
        sum + num(sale.total),
      0
    );
  }

  function totalPurchases() {
    return purchases.reduce(
      (sum, purchase) =>
        sum + num(purchase.total),
      0
    );
  }

  function totalCustomerDue() {
    return customers.reduce(
      (sum, customer) =>
        sum + num(customer.due),
      0
    );
  }

  function totalSupplierDue() {
    return suppliers.reduce(
      (sum, supplier) =>
        sum + num(supplier.due),
      0
    );
  }

  function stockValue() {
    return products.reduce(
      (sum, product) =>
        sum +
        num(product.stock) *
        num(product.purchase),
      0
    );
  }

  function todaySales() {
    return sales
      .filter(
        (sale) =>
          sale.date === today()
      )
      .reduce(
        (sum, sale) =>
          sum + num(sale.total),
        0
      );
  }

  function todayProfit() {
    return sales
      .filter(
        (sale) =>
          sale.date === today()
      )
      .reduce(
        (sum, sale) =>
          sum + num(sale.profit),
        0
      );
  }

  function lowStockProducts() {
    return products.filter(
      (product) =>
        num(product.stock) <=
        num(product.minStock)
    );
  }

  function dashboardPage() {

    return `
      <div class="ns-dashboard-banner">

        <h2>
          Welcome to ${esc(
            settings.store ||
            "NAMITA STORE"
          )}
        </h2>

        <p>
          Sales, Purchase, Stock,
          Customer Due, Supplier Due
          and Barcode Management
        </p>

      </div>

      <div class="ns-grid">

        <div class="ns-stat">
          <small>Total Products</small>
          <strong>
            ${products.length}
          </strong>
        </div>

        <div class="ns-stat">
          <small>Stock Value</small>
          <strong>
            ${money(stockValue())}
          </strong>
        </div>

        <div class="ns-stat">
          <small>Total Sales</small>
          <strong>
            ${money(totalSales())}
          </strong>
        </div>

        <div class="ns-stat">
          <small>Total Purchase</small>
          <strong>
            ${money(totalPurchases())}
          </strong>
        </div>

        <div class="ns-stat">
          <small>Customer Due</small>
          <strong>
            ${money(totalCustomerDue())}
          </strong>
        </div>

        <div class="ns-stat">
          <small>Supplier Due</small>
          <strong>
            ${money(totalSupplierDue())}
          </strong>
        </div>

        <div class="ns-stat">
          <small>Today's Sales</small>
          <strong>
            ${money(todaySales())}
          </strong>
        </div>

        <div class="ns-stat">
          <small>Today's Profit</small>
          <strong>
            ${money(todayProfit())}
          </strong>
        </div>

      </div>

      <div class="ns-card">

        <div class="ns-card-title">

          <h2>
            Quick Actions
          </h2>

        </div>

        <div class="ns-shortcuts">

          <button
            class="ns-shortcut"
            onclick="showPage('sales')"
          >
            🛒 New Sale / POS
          </button>

          <button
            class="ns-shortcut"
            onclick="showPage('purchase')"
          >
            📥 New Purchase
          </button>

          <button
            class="ns-shortcut"
            onclick="openProductModal()"
          >
            📦 Add Product
          </button>

          <button
            class="ns-shortcut"
            onclick="openCustomerModal()"
          >
            👤 Add Customer
          </button>

          <button
            class="ns-shortcut"
            onclick="openSupplierModal()"
          >
            🏭 Add Supplier
          </button>

          <button
            class="ns-shortcut"
            onclick="showPage('payments')"
          >
            💰 Receive / Pay
          </button>

          <button
            class="ns-shortcut"
            onclick="showPage('barcode')"
          >
            🏷️ Barcode
          </button>

          <button
            class="ns-shortcut"
            onclick="showPage('reports')"
          >
            📊 Reports
          </button>

        </div>

      </div>

      <div class="ns-card">

        <div class="ns-card-title">

          <h2>
            Low Stock Products
          </h2>

          <button
            class="ns-btn orange small"
            onclick="showPage('products')"
          >
            Manage Stock
          </button>

        </div>

        ${lowStockTable()}

      </div>

      <div class="ns-card">

        <div class="ns-card-title">

          <h2>
            Recent Sales
          </h2>

          <button
            class="ns-btn light small"
            onclick="showPage('history')"
          >
            View All
          </button>

        </div>

        ${salesTable(
          sales
            .slice()
            .reverse()
            .slice(0, 8)
        )}

      </div>
    `;
  }

  function lowStockTable() {

    const rows =
      lowStockProducts();

    if (!rows.length) {

      return `
        <div class="ns-empty">
          ✅ No low-stock products.
        </div>
      `;
    }

    return `
      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Minimum</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            ${rows
              .map(
                (product) => `
                  <tr>

                    <td>
                      <strong>
                        ${esc(product.name)}
                      </strong>
                    </td>

                    <td>
                      ${esc(
                        product.sku ||
                        "-"
                      )}
                    </td>

                    <td>
                      ${num(product.stock)}
                      ${esc(
                        product.unit ||
                        "PCS"
                      )}
                    </td>

                    <td>
                      ${num(
                        product.minStock
                      )}
                    </td>

                    <td>
                      <span
                        class="ns-badge red"
                      >
                        Low Stock
                      </span>
                    </td>

                  </tr>
                `
              )
              .join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  /* =======================================================
     SELLER PANEL
     ======================================================= */

  function sellerPage() {

    return `
      <div class="ns-card">

        <div class="ns-pos-header">

          <h2>
            🧾 Seller Panel
          </h2>

          <small>
            Quick access for sales,
            customers, stock and payments.
          </small>

        </div>

        <div class="ns-grid">

          <div class="ns-stat">
            <small>Customers</small>
            <strong>
              ${customers.length}
            </strong>
          </div>

          <div class="ns-stat">
            <small>Customer Due</small>
            <strong>
              ${money(totalCustomerDue())}
            </strong>
          </div>

          <div class="ns-stat">
            <small>Today's Sales</small>
            <strong>
              ${money(todaySales())}
            </strong>
          </div>

          <div class="ns-stat">
            <small>Today's Profit</small>
            <strong>
              ${money(todayProfit())}
            </strong>
          </div>

        </div>

      </div>

      <div class="ns-card">

        <div class="ns-card-title">

          <h3>
            Seller Quick Actions
          </h3>

        </div>

        <div class="ns-shortcuts">

          <button
            class="ns-shortcut"
            onclick="showPage('sales')"
          >
            🛒 New Sale / POS
          </button>

          <button
            class="ns-shortcut"
            onclick="openCustomerModal()"
          >
            👤 Add Customer
          </button>

          <button
            class="ns-shortcut"
            onclick="showPage('products')"
          >
            📦 Manage Products
          </button>

          <button
            class="ns-shortcut"
            onclick="showPage('payments')"
          >
            💰 Receive Customer Payment
          </button>

        </div>

      </div>

      <div class="ns-card">

        <div class="ns-card-title">

          <h3>
            Product Management
          </h3>

          <button
            class="ns-btn green small"
            onclick="openProductModal()"
          >
            ＋ Add Product
          </button>

        </div>

        ${sellerProductTable()}

      </div>

      <div class="ns-card">

        <div class="ns-card-title">

          <h3>
            Recent Sales
          </h3>

        </div>

        ${salesTable(
          sales
            .slice()
            .reverse()
            .slice(0, 10)
        )}

      </div>
    `;
  }

  function sellerProductTable() {

    if (!products.length) {

      return `
        <div class="ns-empty">
          No products available.
        </div>
      `;
    }

    return `
      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Sale Price</th>
              <th>MRP</th>
              <th>Actions</th>
            </tr>

          </thead>

          <tbody>

            ${products
              .slice()
              .sort(
                (a,b) =>
                  String(a.name)
                    .localeCompare(
                      String(b.name)
                    )
              )
              .map(
                (product) => `
                  <tr>

                    <td>
                      <strong>
                        ${esc(product.name)}
                      </strong>
                    </td>

                    <td>
                      ${esc(
                        product.sku ||
                        "-"
                      )}
                    </td>

                    <td>
                      ${num(
                        product.stock
                      )}
                      ${esc(
                        product.unit ||
                        "PCS"
                      )}
                    </td>

                    <td>
                      ${money(
                        product.sale
                      )}
                    </td>

                    <td>
                      ${money(
                        product.mrp
                      )}
                    </td>

                    <td>

                      <div
                        class="ns-actions"
                        style="margin:0"
                      >

                        <button
                          class="ns-btn blue small"
                          onclick="
                            openProductModal(
                              '${esc(product.id)}'
                            )
                          "
                        >
                          Edit
                        </button>

                        <button
                          class="ns-btn orange small"
                          onclick="
                            changeProductStock(
                              '${esc(product.id)}'
                            )
                          "
                        >
                          Stock
                        </button>

                        <button
                          class="ns-btn red small"
                          onclick="
                            deleteProduct(
                              '${esc(product.id)}'
                            )
                          "
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>
                `
              )
              .join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  /* =======================================================
     SALES / POS
     ======================================================= */

  function salesPage() {

    const subtotal =
      cart.reduce(
        (sum, item) =>
          sum +
          num(item.qty) *
          num(item.price),
        0
      );

    const discount =
      num(
        $("saleDiscount")?.value
      );

    const total =
      Math.max(
        0,
        subtotal - discount
      );

    return `
      <div class="ns-sale-layout">

        <div>

          <div class="ns-card">

            <div class="ns-pos-header">

              <h2>
                🛒 New Sale / POS
              </h2>

              <small>
                Search product, scan barcode
                or select products below.
              </small>

            </div>

            <div class="ns-form">

              <div class="ns-field ns-full">

                <label>
                  🔎 Search Product /
                  SKU / Barcode
                </label>

                <input
                  id="posSearch"
                  autocomplete="off"
                  placeholder="
                    Scan barcode or type
                    product name...
                  "
                  oninput="
                    renderProductPicker()
                  "
                >

              </div>

              <div class="ns-field">

                <label>
                  Customer
                </label>

                <select
                  id="saleCustomer"
                  onchange="
                    refreshSaleCustomerInfo()
                  "
                >

                  <option value="">
                    Walk-in Customer
                  </option>

                  ${customers
                    .map(
                      (customer) => `
                        <option
                          value="${esc(
                            customer.id
                          )}"
                        >
                          ${esc(
                            customer.name
                          )}
                        </option>
                      `
                    )
                    .join("")}

                </select>

                <small
                  id="selectedCustomerDue"
                  style="
                    color:#dc2626;
                    font-weight:bold;
                  "
                ></small>

              </div>

              <div class="ns-field">

                <label>
                  Payment Method
                </label>

                <select
                  id="salePayment"
                  onchange="
                    refreshSaleTotal()
                  "
                >
                  <option>
                    Cash
                  </option>

                  <option>
                    UPI
                  </option>

                  <option>
                    Card
                  </option>

                  <option>
                    Bank Transfer
                  </option>

                  <option>
                    Credit
                  </option>
                </select>

              </div>

              <div class="ns-field">

                <label>
                  Discount
                </label>

                <input
                  id="saleDiscount"
                  type="number"
                  min="0"
                  step="0.01"
                  value="0"
                  oninput="
                    refreshSaleTotal()
                  "
                >

              </div>

              <div class="ns-field">

                <label>
                  Notes
                </label>

                <input
                  id="saleNotes"
                  placeholder="
                    Optional note
                  "
                >

              </div>

            </div>

            <div
              id="productPicker"
              class="ns-product-picker"
            >
              ${productPickerHTML()}
            </div>

          </div>

          <div class="ns-card">

            <div class="ns-card-title">

              <h3>
                🛒 Cart
              </h3>

              <span
                class="ns-badge blue"
              >
                ${cart.length}
                item type(s)
              </span>

            </div>

            <div id="cartArea">
              ${cartHTML()}
            </div>

          </div>

        </div>

        <div>

          <div class="ns-card">

            <h3>
              💳 Sale Summary
            </h3>

            <div id="saleSummary">
              ${saleSummaryHTML(
                subtotal,
                discount,
                total
              )}
            </div>

            <div
              id="salePaymentBox"
              class="ns-payment-box"
            >
              ${salePaymentHTML(total)}
            </div>

            <div
              class="ns-actions"
              style="
                display:grid;
                grid-template-columns:1fr 1fr;
              "
            >

              <button
                class="ns-btn green"
                onclick="completeSale()"
              >
                ✅ Complete Sale
              </button>

              <button
                class="ns-btn light"
                onclick="clearCart()"
              >
                🗑️ Clear Cart
              </button>

            </div>

          </div>

        </div>

      </div>
    `;
  }

  function productPickerHTML() {

    const query =
      (
        $("posSearch")?.value ||
        ""
      )
        .toLowerCase()
        .trim();

    const list =
      products
        .filter((product) => {

          const text = [
            product.name,
            product.sku,
            product.barcode,
            product.category
          ]
            .join(" ")
            .toLowerCase();

          return (
            !query ||
            text.includes(query)
          );
        })
        .slice(0, 40);

    if (!list.length) {

      return `
        <div
          class="ns-empty"
          style="grid-column:1/-1"
        >
          No products found.
        </div>
      `;
    }

    return list
      .map(
        (product) => {

          const stock =
            num(product.stock);

          const stockClass =
            stock <= 0
              ? "ns-stock-out"
              : stock <=
                  num(product.minStock)
                ? "ns-stock-low"
                : "ns-stock-ok";

          return `
            <button
              type="button"
              class="ns-product-mini"
              onclick="
                addToCart(
                  '${esc(product.id)}'
                )
              "
              ${stock <= 0 ? "disabled" : ""}
              style="
                ${
                  stock <= 0
                    ? "opacity:.55;cursor:not-allowed;"
                    : ""
                }
              "
            >

              <span class="p-name">
                ${esc(product.name)}
              </span>

              <small>
                SKU:
                ${esc(
                  product.sku ||
                  "-"
                )}
              </small>

              <br>

              <small>
                Barcode:
                ${esc(
                  product.barcode ||
                  "-"
                )}
              </small>

              <br>

              <small
                class="${stockClass}"
              >
                Stock:
                ${stock}
                ${esc(
                  product.unit ||
                  "PCS"
                )}
              </small>

              <span class="p-price">
                ${money(product.sale)}
              </span>

            </button>
          `;
        }
      )
      .join("");
  }

  function cartHTML() {

    if (!cart.length) {

      return `
        <div class="ns-empty">
          🛒 Cart is empty.
          Select a product to start billing.
        </div>
      `;
    }

    return cart
      .map((item) => {

        const product =
          findProduct(
            item.productId
          );

        if (!product) {
          return "";
        }

        return `
          <div class="ns-cart-row">

            <div>

              <strong>
                ${esc(product.name)}
              </strong>

              <br>

              <small>
                ${esc(
                  product.sku ||
                  ""
                )}
                •
                ${money(item.price)}
              </small>

            </div>

            <input
              type="number"
              min="1"
              max="${num(
                product.stock
              )}"
              step="1"
              value="${num(item.qty)}"
              onchange="
                changeCartQty(
                  '${esc(product.id)}',
                  this.value
                )
              "
            >

            <strong>
              ${money(
                num(item.qty) *
                num(item.price)
              )}
            </strong>

            <button
              type="button"
              class="ns-btn red small"
              onclick="
                removeFromCart(
                  '${esc(product.id)}'
                )
              "
            >
              ×
            </button>

          </div>
        `;
      })
      .join("");
  }

  function saleSummaryHTML(
    subtotal,
    discount,
    total
  ) {

    return `
      <div class="ns-total-box">

        <div class="ns-total-line">
          <span>
            Subtotal
          </span>

          <strong>
            ${money(subtotal)}
          </strong>
        </div>

        <div class="ns-total-line">
          <span>
            Discount
          </span>

          <strong>
            ${money(discount)}
          </strong>
        </div>

        <div class="ns-total-line big">
          <span>
            Total
          </span>

          <strong>
            ${money(total)}
          </strong>
        </div>

      </div>
    `;
  }

  function salePaymentHTML(total) {

    const payment =
      $("salePayment")?.value ||
      "Cash";

    const defaultPaid =
      payment === "Credit"
        ? 0
        : total;

    return `
      <div class="ns-form"
           style="
             grid-template-columns:
               repeat(2,minmax(0,1fr));
           ">

        <div class="ns-field">

          <label>
            Paid Amount
          </label>

          <input
            id="salePaid"
            type="number"
            min="0"
            max="${total}"
            step="0.01"
            value="${defaultPaid}"
            oninput="
              refreshSaleDue()
            "
          >

        </div>

        <div class="ns-field">

          <label>
            Due Amount
          </label>

          <input
            id="saleDue"
            type="number"
            readonly
            value="${Math.max(
              0,
              total - defaultPaid
            ).toFixed(2)}"
            style="
              background:#fff7ed;
              color:#c2410c;
              font-weight:bold;
            "
          >

        </div>

      </div>
    `;
  }

  window.renderProductPicker =
    function () {

      const element =
        $("productPicker");

      if (element) {
        element.innerHTML =
          productPickerHTML();
      }
    };

  window.addToCart =
    function (id) {

      const product =
        findProduct(id);

      if (!product) {
        toast(
          "Product not found."
        );
        return;
      }

      if (
        num(product.stock) <= 0
      ) {
        toast(
          "Product is out of stock."
        );
        return;
      }

      const existing =
        cart.find(
          (item) =>
            String(item.productId) ===
            String(id)
        );

      if (existing) {

        if (
          num(existing.qty) >=
          num(product.stock)
        ) {

          toast(
            "Not enough stock."
          );

          return;
        }

        existing.qty =
          num(existing.qty) + 1;

      } else {

        cart.push({
          productId:
            product.id,
          qty: 1,
          price:
            num(product.sale)
        });

      }

      renderSalesParts();
    };

  window.changeCartQty =
    function (
      id,
      value
    ) {

      const item =
        cart.find(
          (x) =>
            String(x.productId) ===
            String(id)
        );

      const product =
        findProduct(id);

      if (
        !item ||
        !product
      ) {
        return;
      }

      let quantity =
        Math.floor(
          num(value)
        );

      if (
        !Number.isFinite(quantity)
      ) {
        quantity = 1;
      }

      quantity =
        Math.max(
          1,
          quantity
        );

      quantity =
        Math.min(
          quantity,
          num(product.stock)
        );

      if (
        num(product.stock) <= 0
      ) {

        cart =
          cart.filter(
            (x) =>
              String(
                x.productId
              ) !==
              String(id)
          );

      } else {

        item.qty =
          quantity;

      }

      renderSalesParts();
    };

  window.removeFromCart =
    function (id) {

      cart =
        cart.filter(
          (item) =>
            String(
              item.productId
            ) !==
            String(id)
        );

      renderSalesParts();
    };

  window.clearCart =
    function () {

      cart = [];

      renderSalesParts();
    };

  window.refreshSaleTotal =
    function () {

      const subtotal =
        cart.reduce(
          (sum, item) =>
            sum +
            num(item.qty) *
            num(item.price),
          0
        );

      const discount =
        Math.max(
          0,
          num(
            $("saleDiscount")?.value
          )
        );

      const total =
        Math.max(
          0,
          subtotal - discount
        );

      const summary =
        $("saleSummary");

      if (summary) {

        summary.innerHTML =
          saleSummaryHTML(
            subtotal,
            discount,
            total
          );
      }

      const paymentBox =
        $("salePaymentBox");

      if (paymentBox) {

        paymentBox.innerHTML =
          salePaymentHTML(
            total
          );
      }
    };

  window.refreshSaleDue =
    function () {

      const total =
        getCurrentSaleTotal();

      const paidInput =
        $("salePaid");

      const dueInput =
        $("saleDue");

      if (
        !paidInput ||
        !dueInput
      ) {
        return;
      }

      let paid =
        Math.max(
          0,
          num(paidInput.value)
        );

      paid =
        Math.min(
          total,
          paid
        );

      paidInput.value =
        paid.toFixed(2);

      dueInput.value =
        Math.max(
          0,
          total - paid
        ).toFixed(2);
    };

  function getCurrentSaleTotal() {

    const subtotal =
      cart.reduce(
        (sum, item) =>
          sum +
          num(item.qty) *
          num(item.price),
        0
      );

    const discount =
      Math.max(
        0,
        num(
          $("saleDiscount")?.value
        )
      );

    return Math.max(
      0,
      subtotal - discount
    );
  }

  function renderSalesParts() {

    if ($("cartArea")) {

      $("cartArea").innerHTML =
        cartHTML();
    }

    if ($("productPicker")) {

      $("productPicker").innerHTML =
        productPickerHTML();
    }

    refreshSaleTotal();

    refreshSaleCustomerInfo();
  }

  window.refreshSaleCustomerInfo =
    function () {

      const output =
        $("selectedCustomerDue");

      const select =
        $("saleCustomer");

      if (
        !output ||
        !select
      ) {
        return;
      }

      const customer =
        findCustomer(
          select.value
        );

      if (
        customer &&
        num(customer.due) > 0
      ) {

        output.textContent =
          "Current Due: " +
          money(customer.due);

      } else {

        output.textContent =
          customer
            ? "Current Due: ₹0.00"
            : "";
      }
    };

  /* =======================================================
     COMPLETE SALE
     ======================================================= */

  window.completeSale =
    function () {

      if (!cart.length) {

        toast(
          "Cart is empty."
        );

        return;
      }

      const customerId =
        $("saleCustomer")?.value ||
        "";

      const payment =
        $("salePayment")?.value ||
        "Cash";

      const discount =
        Math.max(
          0,
          num(
            $("saleDiscount")?.value
          )
        );

      const notes =
        $("saleNotes")?.value ||
        "";

      const subtotal =
        cart.reduce(
          (sum, item) =>
            sum +
            num(item.qty) *
            num(item.price),
          0
        );

      const total =
        Math.max(
          0,
          subtotal - discount
        );

      let paid =
        num(
          $("salePaid")?.value
        );

      if (
        payment === "Credit"
      ) {
        paid = 0;
      }

      paid =
        Math.max(
          0,
          Math.min(
            total,
            paid
          )
        );

      const due =
        Math.max(
          0,
          total - paid
        );

      const customer =
        findCustomer(
          customerId
        );

      if (
        due > 0 &&
        !customer
      ) {

        toast(
          "Select a customer for a sale with due amount."
        );

        return;
      }

      const saleItems = [];

      for (
        const cartItem of cart
      ) {

        const product =
          findProduct(
            cartItem.productId
          );

        if (!product) {
          continue;
        }

        if (
          num(product.stock) <
          num(cartItem.qty)
        ) {

          toast(
            "Not enough stock for " +
            product.name
          );

          return;
        }

        saleItems.push({

          productId:
            product.id,

          product:
            product.name,

          sku:
            product.sku || "",

          barcode:
            product.barcode || "",

          qty:
            num(cartItem.qty),

          price:
            num(cartItem.price),

          purchase:
            num(product.purchase),

          mrp:
            num(product.mrp),

          total:
            num(cartItem.qty) *
            num(cartItem.price),

          profit:
            num(cartItem.qty) *
            (
              num(cartItem.price) -
              num(product.purchase)
            )

        });
      }

      if (!saleItems.length) {

        toast(
          "No valid products in cart."
        );

        return;
      }

      /* -----------------------------------------------
         STOCK UPDATE
         ----------------------------------------------- */

      saleItems.forEach(
        (item) => {

          const product =
            findProduct(
              item.productId
            );

          if (!product) {
            return;
          }

          product.stock =
            Math.max(
              0,
              num(product.stock) -
              num(item.qty)
            );

          stockHistory.push({

            id:
              uid("ST"),

            date:
              today(),

            type:
              "Sale",

            productId:
              product.id,

            product:
              product.name,

            qty:
              -num(item.qty),

            balance:
              num(product.stock),

            reference:
              "Sale"

          });

        }
      );

      /* -----------------------------------------------
         SALE RECORD
         ----------------------------------------------- */

      const sale = {

        id:
          uid("SAL"),

        date:
          today(),

        time:
          new Date()
            .toLocaleTimeString(
              "en-IN"
            ),

        customerId:
          customer?.id || "",

        customer:
          customer?.name ||
          "Walk-in Customer",

        payment,

        items:
          saleItems,

        subtotal,

        discount,

        total,

        paid,

        due,

        profit:
          saleItems.reduce(
            (sum, item) =>
              sum +
              num(item.profit),
            0
          ) -
          discount,

        notes

      };

      sales.push(sale);

      /* -----------------------------------------------
         CUSTOMER DUE
         ----------------------------------------------- */

      if (
        customer &&
        due > 0
      ) {

        customer.due =
          num(customer.due) +
          due;

      }

      /* -----------------------------------------------
         PAYMENT RECORD
         ----------------------------------------------- */

      if (
        customer &&
        paid > 0
      ) {

        payments.push({

          id:
            uid("PAY"),

          date:
            today(),

          type:
            "Customer Payment",

          partyId:
            customer.id,

          party:
            customer.name,

          amount:
            paid,

          method:
            payment,

          reference:
            sale.id,

          note:
            "Payment received with sale"

        });

      }

      saveAll();

      cart = [];

      toast(
        "Sale completed successfully."
      );

      showPage("sales");
    };

  /* =======================================================
     SALES TABLE
     ======================================================= */

  function salesTable(list) {

    if (!list.length) {

      return `
        <div class="ns-empty">
          No sales found.
        </div>
      `;
    }

    return `
      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>

              <th>
                Date
              </th>

              <th>
                Invoice
              </th>

              <th>
                Customer
              </th>

              <th>
                Payment
              </th>

              <th>
                Total
              </th>

              <th>
                Paid
              </th>

              <th>
                Due
              </th>

              <th>
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            ${list
              .map(
                (sale) => `
                  <tr>

                    <td>
                      ${esc(
                        sale.date ||
                        ""
                      )}
                    </td>

                    <td>
                      <strong>
                        ${esc(
                          sale.id
                        )}
                      </strong>
                    </td>

                    <td>
                      ${esc(
                        sale.customer ||
                        "Walk-in Customer"
                      )}
                    </td>

                    <td>
                      ${esc(
                        sale.payment ||
                        ""
                      )}
                    </td>

                    <td>
                      ${money(
                        sale.total
                      )}
                    </td>

                    <td>
                      ${money(
                        sale.paid
                      )}
                    </td>

                    <td>
                      ${
                        num(sale.due) > 0
                          ? `
                            <span
                              class="ns-badge red"
                            >
                              ${money(
                                sale.due
                              )}
                            </span>
                          `
                          : `
                            <span
                              class="ns-badge green"
                            >
                              Paid
                            </span>
                          `
                      }
                    </td>

                    <td>

                      <button
                        type="button"
                        class="ns-btn light small"
                        onclick="
                          viewSale(
                            '${esc(
                              sale.id
                            )}'
                          )
                        "
                      >
                        View
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  window.viewSale =
    function (id) {

      const sale =
        sales.find(
          (item) =>
            String(item.id) ===
            String(id)
        );

      if (!sale) {
        toast(
          "Sale not found."
        );
        return;
      }

      openModal(
        "Sale Details",
        `
          <div class="ns-form">

            <div class="ns-field">
              <label>
                Invoice
              </label>
              <input
                readonly
                value="${esc(
                  sale.id
                )}"
              >
            </div>

            <div class="ns-field">
              <label>
                Date
              </label>
              <input
                readonly
                value="${esc(
                  sale.date || ""
                )}"
              >
            </div>

            <div class="ns-field">
              <label>
                Customer
              </label>
              <input
                readonly
                value="${esc(
                  sale.customer ||
                  "Walk-in Customer"
                )}"
              >
            </div>

            <div class="ns-field">
              <label>
                Payment
              </label>
              <input
                readonly
                value="${esc(
                  sale.payment ||
                  ""
                )}"
              >
            </div>

          </div>

          <div class="ns-total-box">

            <div class="ns-total-line">
              <span>
                Subtotal
              </span>
              <strong>
                ${money(
                  sale.subtotal
                )}
              </strong>
            </div>

            <div class="ns-total-line">
              <span>
                Discount
              </span>
              <strong>
                ${money(
                  sale.discount
                )}
              </strong>
            </div>

            <div class="ns-total-line">
              <span>
                Paid
              </span>
              <strong>
                ${money(
                  sale.paid
                )}
              </strong>
            </div>

            <div class="ns-total-line">
              <span>
                Due
              </span>
              <strong>
                ${money(
                  sale.due
                )}
              </strong>
            </div>

            <div class="ns-total-line big">
              <span>
                Total
              </span>
              <strong>
                ${money(
                  sale.total
                )}
              </strong>
            </div>

          </div>

          <h3>
            Items
          </h3>

          <div class="ns-table-wrap">

            <table>

              <thead>

                <tr>
                  <th>
                    Product
                  </th>
                  <th>
                    Qty
                  </th>
                  <th>
                    Price
                  </th>
                  <th>
                    Total
                  </th>
                </tr>

              </thead>

              <tbody>

                ${(sale.items || [])
                  .map(
                    (item) => `
                      <tr>

                        <td>
                          ${esc(
                            item.product
                          )}
                        </td>

                        <td>
                          ${num(
                            item.qty
                          )}
                        </td>

                        <td>
                          ${money(
                            item.price
                          )}
                        </td>

                        <td>
                          ${money(
                            item.total
                          )}
                        </td>

                      </tr>
                    `
                  )
                  .join("")}

              </tbody>

            </table>

          </div>

          ${
            sale.notes
              ? `
                <div class="ns-card"
                     style="
                       margin-top:15px;
                       margin-bottom:0;
                     ">
                  <strong>
                    Notes:
                  </strong>
                  ${esc(
                    sale.notes
                  )}
                </div>
              `
              : ""
          }
        `
      );
    };

  /* =======================================================
     BASIC BARCODE SCANNER
     ======================================================= */

  document.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key !==
        "Enter"
      ) {
        return;
      }

      if (
        document.activeElement?.id !==
        "posSearch"
      ) {
        return;
      }

      const value =
        document.activeElement
          .value
          .trim();

      if (!value) {
        return;
      }

      const product =
        products.find(
          (item) =>
            String(
              item.barcode
            ) === value ||
            String(
              item.sku
            ) === value
        );

      if (product) {

        addToCart(
          product.id
        );

        document.activeElement
          .value = "";

        renderProductPicker();

        event.preventDefault();

      } else {

        toast(
          "Barcode / SKU not found."
        );

      }

    }
  );

  /* =======================================================
     SAMPLE DATA
     Only created when there are no products.
     ======================================================= */

  if (!products.length) {

    products = [

      {
        id:
          uid("PRD"),

        name:
          "Sample Product",

        sku:
          "NS-001",

        barcode:
          "890100000001",

        category:
          "General",

        purchase:
          100,

        sale:
          149,

        mrp:
          160,

        stock:
          20,

        minStock:
          5,

        gst:
          18,

        hsn:
          "",

        unit:
          "PCS",

        description:
          "",

        createdAt:
          nowISO(),

        updatedAt:
          nowISO()

      }

    ];

    save(
      KEY.products,
      products
    );
  }

  /* =======================================================
     IMPORTANT
     PART 2 WILL CONTINUE INSIDE THIS SAME IIFE.
     DO NOT ADD:
     
     })();

     HERE.
     ======================================================= */
