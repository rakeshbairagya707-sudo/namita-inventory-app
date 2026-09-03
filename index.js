/* =========================================================
   NAMITA STORE — ACCOUNTING & INVENTORY
   COMPLETE SINGLE FILE APPLICATION
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     STORAGE
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

  const $ = id => document.getElementById(id);

  const esc = value =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const num = value => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const money = value => {
    const currency = settings && settings.currency
      ? settings.currency
      : "₹";

    return currency + num(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const today = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const nowISO = () => new Date().toISOString();

  const uid = prefix =>
    prefix + "_" +
    Date.now() + "_" +
    Math.random().toString(36).slice(2, 8);

  function load(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      console.error(e);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(e);
      toast("Data save failed.");
    }
  }

  /* =======================================================
     DATA
     ======================================================= */

  let products = load(KEY.products, []);
  let customers = load(KEY.customers, []);
  let suppliers = load(KEY.suppliers, []);
  let purchases = load(KEY.purchases, []);
  let sales = load(KEY.sales, []);
  let payments = load(KEY.payments, []);
  let stockHistory = load(KEY.stockHistory, []);
  let ecommerce = load(KEY.ecommerce, []);

  let settings = load(KEY.settings, {
    store: "NAMITA STORE",
    phone: "",
    address: "",
    currency: "₹"
  });

  let barcodeSettings = load(KEY.barcode, {
    template: "25x50-2",
    showStore: true,
    showProduct: true,
    showBarcode: true,
    showPrice: true,
    showSku: true,
    margin: 0,
    gap: 0
  });

  products = Array.isArray(products) ? products : [];
  customers = Array.isArray(customers) ? customers : [];
  suppliers = Array.isArray(suppliers) ? suppliers : [];
  purchases = Array.isArray(purchases) ? purchases : [];
  sales = Array.isArray(sales) ? sales : [];
  payments = Array.isArray(payments) ? payments : [];
  stockHistory = Array.isArray(stockHistory) ? stockHistory : [];
  ecommerce = Array.isArray(ecommerce) ? ecommerce : [];

  let cart = [];
  let purchaseDraft = [];
  let barcodeQueue = [];

  let currentPage = "dashboard";

  let editingProductId = null;
  let editingCustomerId = null;
  let editingSupplierId = null;
  let editingEcommerceId = null;

  /* =======================================================
     NORMALIZE OLD DATA
     ======================================================= */

  products.forEach(p => {
    p.stock = num(p.stock);
    p.purchase = num(p.purchase);
    p.sale = num(p.sale);
    p.mrp = num(p.mrp);
    p.minStock = num(p.minStock);
    p.gst = num(p.gst);
    p.sku = p.sku || "";
    p.barcode = p.barcode || "";
    p.category = p.category || "General";
    p.unit = p.unit || "PCS";
  });

  customers.forEach(c => {
    c.due = num(c.due);
  });

  suppliers.forEach(s => {
    s.due = num(s.due);
  });

  /* =======================================================
     CSS
     ======================================================= */

  const style = document.createElement("style");

  style.textContent = `
    * {
      box-sizing:border-box;
    }

    body {
      margin:0;
      background:#f1f5f9;
      color:#172033;
      font-family:Arial,"Noto Sans",sans-serif;
    }

    button,input,select,textarea {
      font:inherit;
    }

    button {
      cursor:pointer;
    }

    .ns-app {
      min-height:100vh;
      display:flex;
    }

    .ns-sidebar {
      width:245px;
      position:fixed;
      left:0;
      top:0;
      bottom:0;
      overflow-y:auto;
      z-index:100;
      padding:15px 11px;
      color:white;
      background:linear-gradient(180deg,#0f766e,#115e59);
    }

    .ns-logo {
      text-align:center;
      padding:10px 5px 20px;
      margin-bottom:14px;
      border-bottom:1px solid rgba(255,255,255,.2);
    }

    .ns-logo h2 {
      margin:0;
      font-size:21px;
    }

    .ns-logo small {
      opacity:.75;
    }

    .ns-nav button {
      display:block;
      width:100%;
      border:0;
      color:white;
      background:transparent;
      padding:11px 12px;
      margin:3px 0;
      border-radius:9px;
      text-align:left;
    }

    .ns-nav button:hover {
      background:rgba(255,255,255,.13);
    }

    .ns-nav button.active {
      color:#115e59;
      background:white;
      font-weight:bold;
    }

    .ns-main {
      width:calc(100% - 245px);
      margin-left:245px;
      min-height:100vh;
    }

    .ns-top {
      position:sticky;
      top:0;
      z-index:50;
      padding:13px 20px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      background:white;
      border-bottom:1px solid #e2e8f0;
    }

    .ns-top h1 {
      margin:0;
      font-size:20px;
    }

    .ns-content {
      padding:20px;
    }

    .ns-card {
      background:white;
      border:1px solid #e2e8f0;
      border-radius:15px;
      padding:18px;
      margin-bottom:18px;
      box-shadow:0 5px 18px rgba(15,23,42,.04);
    }

    .ns-card h2,
    .ns-card h3 {
      margin-top:0;
    }

    .ns-grid {
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:14px;
    }

    .ns-stat {
      background:white;
      border:1px solid #e2e8f0;
      border-radius:14px;
      padding:17px;
    }

    .ns-stat small {
      color:#64748b;
    }

    .ns-stat strong {
      display:block;
      font-size:24px;
      margin-top:6px;
    }

    .ns-form {
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:12px;
    }

    .ns-field {
      display:flex;
      flex-direction:column;
      gap:5px;
    }

    .ns-field label {
      font-size:13px;
      font-weight:bold;
      color:#334155;
    }

    .ns-field input,
    .ns-field select,
    .ns-field textarea {
      width:100%;
      padding:10px 11px;
      border:1px solid #cbd5e1;
      border-radius:8px;
      background:white;
      outline:none;
    }

    .ns-field input:focus,
    .ns-field select:focus,
    .ns-field textarea:focus {
      border-color:#0f766e;
      box-shadow:0 0 0 2px rgba(15,118,110,.1);
    }

    .ns-field textarea {
      min-height:80px;
      resize:vertical;
    }

    .ns-full {
      grid-column:1/-1;
    }

    .ns-actions {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-top:15px;
    }

    .ns-btn {
      border:0;
      border-radius:8px;
      padding:9px 13px;
      background:#0f766e;
      color:white;
      font-weight:bold;
    }

    .ns-btn:hover {
      opacity:.9;
    }

    .ns-btn.green {
      background:#15803d;
    }

    .ns-btn.red {
      background:#dc2626;
    }

    .ns-btn.orange {
      background:#ea580c;
    }

    .ns-btn.blue {
      background:#2563eb;
    }

    .ns-btn.secondary {
      background:#475569;
    }

    .ns-btn.light {
      background:#e2e8f0;
      color:#172033;
    }

    .ns-btn.purple {
      background:#7c3aed;
    }

    .ns-table-wrap {
      overflow:auto;
    }

    table {
      width:100%;
      border-collapse:collapse;
      min-width:700px;
    }

    th,td {
      padding:9px 10px;
      border-bottom:1px solid #e5e7eb;
      text-align:left;
      vertical-align:middle;
    }

    th {
      background:#f8fafc;
      font-size:13px;
    }

    .ns-badge {
      display:inline-block;
      padding:4px 8px;
      border-radius:20px;
      background:#e2e8f0;
      font-size:12px;
      font-weight:bold;
    }

    .ns-badge.green {
      color:#166534;
      background:#dcfce7;
    }

    .ns-badge.red {
      color:#991b1b;
      background:#fee2e2;
    }

    .ns-badge.orange {
      color:#9a3412;
      background:#ffedd5;
    }

    .ns-badge.blue {
      color:#1e40af;
      background:#dbeafe;
    }

    .ns-toolbar {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      align-items:center;
      margin-bottom:15px;
    }

    .ns-toolbar input,
    .ns-toolbar select {
      padding:9px;
      border:1px solid #cbd5e1;
      border-radius:8px;
    }

    .ns-empty {
      padding:30px;
      text-align:center;
      color:#64748b;
    }

    .ns-shortcuts {
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:12px;
    }

    .ns-shortcut {
      border:1px solid #dbe4e4;
      background:white;
      border-radius:12px;
      padding:17px;
      text-align:left;
      font-weight:bold;
    }

    .ns-shortcut:hover {
      border-color:#0f766e;
    }

    .ns-sale-layout {
      display:grid;
      grid-template-columns:1.5fr 1fr;
      gap:18px;
    }

    .ns-product-picker {
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:10px;
      margin-top:13px;
    }

    .ns-product-mini {
      border:1px solid #dbe4e4;
      background:white;
      border-radius:10px;
      padding:12px;
      text-align:left;
    }

    .ns-product-mini:hover {
      border-color:#0f766e;
      background:#f0fdfa;
    }

    .ns-cart-row {
      display:grid;
      grid-template-columns:1fr 90px 110px 35px;
      gap:7px;
      align-items:center;
      padding:9px 0;
      border-bottom:1px solid #e5e7eb;
    }

    .ns-total-box {
      background:#f8fafc;
      border-radius:10px;
      padding:14px;
      margin-top:12px;
    }

    .ns-total-line {
      display:flex;
      justify-content:space-between;
      padding:5px 0;
    }

    .ns-total-line.big {
      border-top:1px solid #cbd5e1;
      margin-top:7px;
      padding-top:10px;
      font-size:21px;
      font-weight:bold;
    }

    .ns-modal {
      position:fixed;
      inset:0;
      background:rgba(15,23,42,.6);
      display:none;
      align-items:center;
      justify-content:center;
      padding:15px;
      z-index:1000;
    }

    .ns-modal.show {
      display:flex;
    }

    .ns-modal-box {
      width:min(1000px,100%);
      max-height:94vh;
      overflow:auto;
      background:white;
      border-radius:15px;
      padding:20px;
    }

    .ns-modal-head {
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin-bottom:15px;
    }

    .ns-close {
      width:35px;
      height:35px;
      border:0;
      border-radius:50%;
      background:#fee2e2;
      color:#991b1b;
      font-size:19px;
    }

    .ns-mobile-menu {
      display:none;
    }

    .ns-summary-grid {
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:10px;
    }

    .ns-summary-box {
      padding:13px;
      border-radius:10px;
      background:#f8fafc;
      border:1px solid #e2e8f0;
    }

    .ns-color-title {
      padding:10px 12px;
      border-radius:8px;
      background:#f0fdfa;
      color:#115e59;
      font-weight:bold;
      margin-bottom:12px;
    }

    .ns-online-card {
      border:1px solid #e2e8f0;
      border-radius:12px;
      overflow:hidden;
      background:white;
    }

    .ns-online-card .pic {
      height:130px;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#f1f5f9;
      font-size:45px;
    }

    .ns-online-card .body {
      padding:12px;
    }

    .ns-online-grid {
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:12px;
    }

    .ns-print-sheet {
      display:grid;
      gap:0;
      align-content:start;
      background:white;
    }

    .ns-sticker {
      background:white;
      color:#000;
      border:1px solid #111;
      overflow:hidden;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      text-align:center;
      padding:1.2mm;
      line-height:1.05;
    }

    .ns-sticker svg {
      max-width:95%;
      height:auto;
    }

    .t25x50x2 {
      grid-template-columns:repeat(1,50mm);
    }

    .t25x50x1 {
      grid-template-columns:repeat(1,50mm);
    }

    .t15x25x4 {
      grid-template-columns:repeat(4,25mm);
      width:100mm;
    }

    .t30x50x2 {
      grid-template-columns:repeat(1,50mm);
    }

    .t20x40x2 {
      grid-template-columns:repeat(1,40mm);
    }

    .t20x30x3 {
      grid-template-columns:repeat(1,30mm);
    }

    .s25x50x2 {
      width:50mm;
      height:25mm;
      min-height:25mm;
      max-height:25mm;
    }

    .s25x50x1 {
      width:50mm;
      height:25mm;
      min-height:25mm;
      max-height:25mm;
    }

    .s15x25x4 {
      width:25mm;
      height:15mm;
      min-height:15mm;
      max-height:15mm;
      font-size:7px;
    }

    .s30x50x2 {
      width:50mm;
      height:30mm;
      min-height:30mm;
      max-height:30mm;
    }

    .s20x40x2 {
      width:40mm;
      height:20mm;
      min-height:20mm;
      max-height:20mm;
      font-size:8px;
    }

    .s20x30x3 {
      width:30mm;
      height:20mm;
      min-height:20mm;
      max-height:20mm;
      font-size:8px;
    }

    .ns-barcode-stage {
      min-height:350px;
      overflow:auto;
      padding:25px;
      background:#e5e7eb;
      display:flex;
      justify-content:center;
      align-items:flex-start;
    }

    .ns-inline-total {
      display:flex;
      justify-content:space-between;
      padding:5px 0;
    }

    .ns-danger {
      color:#b91c1c;
      font-weight:bold;
    }

    .ns-success {
      color:#15803d;
      font-weight:bold;
    }

    @media(max-width:1100px) {
      .ns-grid {
        grid-template-columns:repeat(2,1fr);
      }

      .ns-form {
        grid-template-columns:repeat(2,1fr);
      }

      .ns-sale-layout {
        grid-template-columns:1fr;
      }

      .ns-product-picker {
        grid-template-columns:repeat(2,1fr);
      }

      .ns-shortcuts {
        grid-template-columns:repeat(2,1fr);
      }

      .ns-online-grid {
        grid-template-columns:repeat(2,1fr);
      }
    }

    @media(max-width:750px) {
      .ns-sidebar {
        transform:translateX(-100%);
        transition:.2s;
      }

      .ns-sidebar.open {
        transform:translateX(0);
      }

      .ns-main {
        width:100%;
        margin-left:0;
      }

      .ns-mobile-menu {
        display:inline-block;
      }

      .ns-grid,
      .ns-form,
      .ns-summary-grid {
        grid-template-columns:1fr;
      }

      .ns-shortcuts,
      .ns-online-grid {
        grid-template-columns:1fr;
      }

      .ns-content {
        padding:12px;
      }

      .ns-product-picker {
        grid-template-columns:1fr;
      }

      .ns-top {
        padding:12px;
      }
    }

    @media print {
      body * {
        visibility:hidden !important;
      }

      #barcodePrintArea,
      #barcodePrintArea * {
        visibility:visible !important;
      }

      #barcodePrintArea {
        position:absolute;
        left:0;
        top:0;
        margin:0 !important;
        padding:0 !important;
        background:white !important;
      }

      .ns-sticker {
        break-inside:avoid;
        page-break-inside:avoid;
      }
    }
  `;

  document.head.appendChild(style);

  /* =======================================================
     APP SHELL
     ======================================================= */

  const app = $("app");

  if (!app) {
    console.error("Element #app not found.");
    return;
  }

  app.innerHTML = `
    <div class="ns-app">

      <aside class="ns-sidebar" id="nsSidebar">

        <div class="ns-logo">
          <h2>NAMITA STORE</h2>
          <small>Accounting & Inventory</small>
        </div>

        <div class="ns-nav">

          <button data-page="dashboard">▣ Dashboard</button>
          <button data-page="seller">🧾 Seller Panel</button>
          <button data-page="sales">🛒 Sales / POS</button>
          <button data-page="purchase">📥 Purchase</button>
          <button data-page="products">📦 Products & Stock</button>
          <button data-page="customers">👤 Customers</button>
          <button data-page="suppliers">🏭 Suppliers</button>
          <button data-page="payments">💰 Due / Payments</button>
          <button data-page="history">📋 Transaction History</button>
          <button data-page="barcode">🏷️ Barcode Settings</button>
          <button data-page="reports">📊 Reports</button>
          <button data-page="ecommerce">🛍️ E-Commerce</button>
          <button data-page="settings">⚙️ Settings</button>

        </div>
      </aside>

      <main class="ns-main">

        <header class="ns-top">

          <div>
            <button
              class="ns-btn light ns-mobile-menu"
              id="mobileMenu"
            >☰</button>

            <span style="margin-left:8px">
              <strong id="pageTitle">Dashboard</strong>
            </span>
          </div>

          <div id="topDate"></div>

        </header>

        <div
          class="ns-content"
          id="pageContent"
        ></div>

      </main>

    </div>

    <div class="ns-modal" id="nsModal">

      <div class="ns-modal-box">

        <div class="ns-modal-head">

          <h2 id="modalTitle" style="margin:0"></h2>

          <button
            class="ns-close"
            onclick="closeModal()"
          >×</button>

        </div>

        <div id="modalBody"></div>

      </div>

    </div>
  `;

  $("topDate").textContent =
    new Date().toLocaleDateString("en-IN");

  $("mobileMenu").onclick = () => {
    $("nsSidebar").classList.toggle("open");
  };

  document.querySelectorAll(".ns-nav button").forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
      $("nsSidebar").classList.remove("open");
    });
  });

  /* =======================================================
     MODAL / TOAST
     ======================================================= */

  function openModal(title, html) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = html;
    $("nsModal").classList.add("show");
  }

  window.closeModal = function () {
    $("nsModal").classList.remove("show");
  };

  function toast(message) {
    const old = $("nsToast");
    if (old) old.remove();

    const el = document.createElement("div");

    el.id = "nsToast";

    el.style.cssText = `
      position:fixed;
      right:18px;
      bottom:18px;
      z-index:99999;
      background:#0f766e;
      color:white;
      padding:12px 18px;
      border-radius:10px;
      box-shadow:0 8px 25px rgba(0,0,0,.2);
      font-weight:bold;
    `;

    el.textContent = message;

    document.body.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 2500);
  }

  window.toast = toast;

  /* =======================================================
     SAVE ALL
     ======================================================= */

  function saveAll() {
    save(KEY.products, products);
    save(KEY.customers, customers);
    save(KEY.suppliers, suppliers);
    save(KEY.purchases, purchases);
    save(KEY.sales, sales);
    save(KEY.payments, payments);
    save(KEY.stockHistory, stockHistory);
    save(KEY.ecommerce, ecommerce);
    save(KEY.settings, settings);
    save(KEY.barcode, barcodeSettings);
  }

  /* =======================================================
     FINDERS
     ======================================================= */

  function findProduct(id) {
    return products.find(
      p => String(p.id) === String(id)
    );
  }

  function findCustomer(id) {
    return customers.find(
      c => String(c.id) === String(id)
    );
  }

  function findSupplier(id) {
    return suppliers.find(
      s => String(s.id) === String(id)
    );
  }

  /* =======================================================
     DASHBOARD
     ======================================================= */

  function totalSales() {
    return sales.reduce(
      (sum, x) => sum + num(x.total),
      0
    );
  }

  function totalPurchases() {
    return purchases.reduce(
      (sum, x) => sum + num(x.total),
      0
    );
  }

  function totalCustomerDue() {
    return customers.reduce(
      (sum, x) => sum + num(x.due),
      0
    );
  }

  function totalSupplierDue() {
    return suppliers.reduce(
      (sum, x) => sum + num(x.due),
      0
    );
  }

  function stockValue() {
    return products.reduce(
      (sum, p) =>
        sum + num(p.stock) * num(p.purchase),
      0
    );
  }

  function todaySales() {
    return sales
      .filter(x => x.date === today())
      .reduce(
        (sum, x) => sum + num(x.total),
        0
      );
  }

  function todayProfit() {
    return sales
      .filter(x => x.date === today())
      .reduce(
        (sum, x) => sum + num(x.profit),
        0
      );
  }

  function dashboardPage() {
    return `
      <div class="ns-grid">

        <div class="ns-stat">
          <small>Total Products</small>
          <strong>${products.length}</strong>
        </div>

        <div class="ns-stat">
          <small>Stock Value</small>
          <strong>${money(stockValue())}</strong>
        </div>

        <div class="ns-stat">
          <small>Total Sales</small>
          <strong>${money(totalSales())}</strong>
        </div>

        <div class="ns-stat">
          <small>Total Purchase</small>
          <strong>${money(totalPurchases())}</strong>
        </div>

        <div class="ns-stat">
          <small>Customer Due</small>
          <strong>${money(totalCustomerDue())}</strong>
        </div>

        <div class="ns-stat">
          <small>Supplier Due</small>
          <strong>${money(totalSupplierDue())}</strong>
        </div>

        <div class="ns-stat">
          <small>Today's Sales</small>
          <strong>${money(todaySales())}</strong>
        </div>

        <div class="ns-stat">
          <small>Today's Profit</small>
          <strong>${money(todayProfit())}</strong>
        </div>

      </div>

      <div class="ns-card">

        <h2>Quick Actions</h2>

        <div class="ns-shortcuts">

          <button class="ns-shortcut"
            onclick="showPage('sales')">
            🛒 New Sale
          </button>

          <button class="ns-shortcut"
            onclick="showPage('purchase')">
            📥 New Purchase
          </button>

          <button class="ns-shortcut"
            onclick="openProductModal()">
            ＋ Add Product
          </button>

          <button class="ns-shortcut"
            onclick="openCustomerModal()">
            ＋ Add Customer
          </button>

          <button class="ns-shortcut"
            onclick="openSupplierModal()">
            ＋ Add Supplier
          </button>

          <button class="ns-shortcut"
            onclick="showPage('payments')">
            💰 Receive / Pay
          </button>

          <button class="ns-shortcut"
            onclick="showPage('barcode')">
            🏷️ Barcode
          </button>

          <button class="ns-shortcut"
            onclick="showPage('reports')">
            📊 Reports
          </button>

        </div>

      </div>

      <div class="ns-card">
        <h2>Low Stock</h2>
        ${lowStockTable()}
      </div>

      <div class="ns-card">
        <h2>Recent Sales</h2>
        ${salesTable(
          sales.slice().reverse().slice(0,10)
        )}
      </div>
    `;
  }

  function lowStockTable() {

    const list = products.filter(
      p => num(p.stock) <= num(p.minStock)
    );

    if (!list.length) {
      return `
        <div class="ns-empty">
          No low-stock products.
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

            ${list.map(p => `
              <tr>
                <td>${esc(p.name)}</td>
                <td>${esc(p.sku)}</td>
                <td>${num(p.stock)}</td>
                <td>${num(p.minStock)}</td>
                <td>
                  <span class="ns-badge red">
                    Low Stock
                  </span>
                </td>
              </tr>
            `).join("")}

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

        <h2>Seller Panel</h2>

        <div class="ns-grid">

          <div class="ns-stat">
            <small>Customers</small>
            <strong>${customers.length}</strong>
          </div>

          <div class="ns-stat">
            <small>Customer Due</small>
            <strong>${money(totalCustomerDue())}</strong>
          </div>

          <div class="ns-stat">
            <small>Today's Sales</small>
            <strong>${money(todaySales())}</strong>
          </div>

          <div class="ns-stat">
            <small>Today's Profit</small>
            <strong>${money(todayProfit())}</strong>
          </div>

        </div>

      </div>

      <div class="ns-card">

        <h3>Seller Quick Actions</h3>

        <div class="ns-shortcuts">

          <button class="ns-shortcut"
            onclick="showPage('sales')">
            🛒 New Sale / POS
          </button>

          <button class="ns-shortcut"
            onclick="showPage('payments')">
            💰 Customer Payment
          </button>

          <button class="ns-shortcut"
            onclick="openCustomerModal()">
            👤 Add Customer
          </button>

          <button class="ns-shortcut"
            onclick="showPage('history')">
            📋 Transaction History
          </button>

        </div>

      </div>

      <div class="ns-card">

        <h3>Product Stock Management</h3>

        ${productTable(products.slice(0,20))}

      </div>

      <div class="ns-card">
        <h3>Recent Sales</h3>
        ${salesTable(
          sales.slice().reverse().slice(0,10)
        )}
      </div>
    `;
  }

  /* =======================================================
     PRODUCT CRUD
     ======================================================= */

  window.openProductModal = function(id) {

    editingProductId = id || null;

    const p = id ? findProduct(id) : null;

    openModal(
      p ? "Edit Product" : "Add Product",
      `
        <div class="ns-color-title">
          Product Information
        </div>

        <div class="ns-form">

          <div class="ns-field">
            <label>Product Name *</label>
            <input id="prdName"
              value="${esc(p?.name || "")}">
          </div>

          <div class="ns-field">
            <label>SKU</label>
            <input id="prdSku"
              value="${esc(p?.sku || "")}">
          </div>

          <div class="ns-field">
            <label>Barcode</label>
            <input id="prdBarcode"
              value="${esc(p?.barcode || "")}">
          </div>

          <div class="ns-field">
            <label>Category</label>
            <input id="prdCategory"
              value="${esc(p?.category || "General")}">
          </div>

          <div class="ns-field">
            <label>Purchase Price</label>
            <input id="prdPurchase"
              type="number"
              min="0"
              value="${num(p?.purchase)}">
          </div>

          <div class="ns-field">
            <label>Sale Price</label>
            <input id="prdSale"
              type="number"
              min="0"
              value="${num(p?.sale)}">
          </div>

          <div class="ns-field">
            <label>MRP *</label>
            <input id="prdMrp"
              type="number"
              min="0"
              value="${num(p?.mrp)}">
          </div>

          <div class="ns-field">
            <label>Stock</label>
            <input id="prdStock"
              type="number"
              min="0"
              value="${num(p?.stock)}">
          </div>

          <div class="ns-field">
            <label>Minimum Stock</label>
            <input id="prdMin"
              type="number"
              min="0"
              value="${num(p?.minStock)}">
          </div>

          <div class="ns-field">
            <label>GST %</label>
            <input id="prdGst"
              type="number"
              min="0"
              value="${num(p?.gst)}">
          </div>

          <div class="ns-field">
            <label>HSN</label>
            <input id="prdHsn"
              value="${esc(p?.hsn || "")}">
          </div>

          <div class="ns-field">
            <label>Unit</label>
            <select id="prdUnit">
              ${["PCS","BOX","KG","GM","LTR","ML","PAIR","SET"]
                .map(u =>
                  `<option ${p?.unit === u ? "selected":""}>
                    ${u}
                  </option>`
                ).join("")}
            </select>
          </div>

          <div class="ns-field ns-full">
            <label>Description</label>
            <textarea id="prdDescription">${esc(
              p?.description || ""
            )}</textarea>
          </div>

        </div>

        <div class="ns-actions">

          <button class="ns-btn green"
            onclick="saveProduct()">
            💾 Save Product
          </button>

          ${
            p
              ? `
                <button class="ns-btn orange"
                  onclick="changeProductStock('${esc(p.id)}')">
                  📦 Change Stock
                </button>

                <button class="ns-btn red"
                  onclick="deleteProduct('${esc(p.id)}')">
                  🗑 Delete
                </button>
              `
              : ""
          }

          <button class="ns-btn light"
            onclick="closeModal()">
            Cancel
          </button>

        </div>
      `
    );
  };

  window.saveProduct = function() {

    const name = $("prdName")?.value.trim();

    if (!name) {
      toast("Product name is required.");
      return;
    }

    const data = {
      name,
      sku: $("prdSku")?.value.trim() || "",
      barcode: $("prdBarcode")?.value.trim() || "",
      category: $("prdCategory")?.value.trim() || "General",
      purchase: num($("prdPurchase")?.value),
      sale: num($("prdSale")?.value),
      mrp: num($("prdMrp")?.value),
      stock: num($("prdStock")?.value),
      minStock: num($("prdMin")?.value),
      gst: num($("prdGst")?.value),
      hsn: $("prdHsn")?.value.trim() || "",
      unit: $("prdUnit")?.value || "PCS",
      description:
        $("prdDescription")?.value.trim() || ""
    };

    if (editingProductId) {

      const p = findProduct(editingProductId);

      if (p) {
        Object.assign(p, data);
      }

      toast("Product updated.");

    } else {

      products.push({
        id: uid("PRD"),
        ...data,
        createdAt: nowISO()
      });

      toast("Product added.");
    }

    saveAll();
    closeModal();
    showPage(currentPage);
  };

  window.deleteProduct = function(id) {

    const p = findProduct(id);

    if (!p) return;

    if (
      !confirm(
        `Delete product "${p.name}"?`
      )
    ) {
      return;
    }

    products = products.filter(
      x => String(x.id) !== String(id)
    );

    cart = cart.filter(
      x => String(x.productId) !== String(id)
    );

    ecommerce = ecommerce.filter(
      x => String(x.productId) !== String(id)
    );

    saveAll();

    closeModal();

    toast("Product deleted.");

    showPage(currentPage);
  };

  window.changeProductStock = function(id) {

    const p = findProduct(id);

    if (!p) return;

    openModal(
      "Stock Adjustment",
      `
        <div class="ns-form">

          <div class="ns-field">
            <label>Product</label>
            <input value="${esc(p.name)}" disabled>
          </div>

          <div class="ns-field">
            <label>Current Stock</label>
            <input value="${num(p.stock)}" disabled>
          </div>

          <div class="ns-field">
            <label>Action</label>
            <select id="stockAction">
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
              <option value="set">Set Stock</option>
            </select>
          </div>

          <div class="ns-field">
            <label>Quantity</label>
            <input id="stockQty"
              type="number"
              min="0"
              value="1">
          </div>

          <div class="ns-field ns-full">
            <label>Note</label>
            <input id="stockNote"
              placeholder="Reason for stock adjustment">
          </div>

        </div>

        <div class="ns-actions">

          <button class="ns-btn green"
            onclick="applyStockAdjustment('${esc(id)}')">
            Save Adjustment
          </button>

          <button class="ns-btn light"
            onclick="closeModal()">
            Cancel
          </button>

        </div>
      `
    );
  };

  window.applyStockAdjustment = function(id) {

    const p = findProduct(id);

    if (!p) return;

    const action = $("stockAction").value;
    const qty = num($("stockQty").value);
    const note = $("stockNote").value.trim();

    const oldStock = num(p.stock);

    if (action === "increase") {
      p.stock = oldStock + qty;
    } else if (action === "decrease") {
      p.stock = Math.max(0, oldStock - qty);
    } else {
      p.stock = qty;
    }

    stockHistory.push({
      id: uid("ST"),
      date: today(),
      type: "Adjustment",
      productId: p.id,
      product: p.name,
      qty: p.stock - oldStock,
      balance: p.stock,
      reference: note || "Manual Stock Adjustment"
    });

    saveAll();
    closeModal();
    toast("Stock updated.");
    showPage(currentPage);
  };

  function productTable(list) {

    if (!list.length) {
      return `
        <div class="ns-empty">
          No products found.
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
              <th>Barcode</th>
              <th>Purchase</th>
              <th>Sale</th>
              <th>MRP</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${list.map(p => `
              <tr>

                <td>
                  <strong>${esc(p.name)}</strong>
                  <br>
                  <small>${esc(p.category)}</small>
                </td>

                <td>${esc(p.sku)}</td>

                <td>${esc(p.barcode)}</td>

                <td>${money(p.purchase)}</td>

                <td>${money(p.sale)}</td>

                <td>${money(p.mrp)}</td>

                <td>
                  ${
                    num(p.stock) <= num(p.minStock)
                      ? `<span class="ns-badge red">
                           ${num(p.stock)}
                         </span>`
                      : `<span class="ns-badge green">
                           ${num(p.stock)}
                         </span>`
                  }
                </td>

                <td>

                  <button class="ns-btn blue"
                    onclick="openProductModal('${esc(p.id)}')">
                    Edit
                  </button>

                  <button class="ns-btn orange"
                    onclick="changeProductStock('${esc(p.id)}')">
                    Stock
                  </button>

                  <button class="ns-btn red"
                    onclick="deleteProduct('${esc(p.id)}')">
                    Delete
                  </button>

                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  function productsPage() {

    return `
      <div class="ns-card">

        <div class="ns-toolbar">

          <input
            id="productSearch"
            placeholder="Search product..."
            oninput="renderProductsTable()">

          <button class="ns-btn green"
            onclick="openProductModal()">
            ＋ Add Product
          </button>

        </div>

        <div id="productsTableArea">
          ${productTable(products)}
        </div>

      </div>
    `;
  }

  window.renderProductsTable = function() {

    const q =
      $("productSearch")?.value
        .toLowerCase()
        .trim() || "";

    const list = products.filter(p => {

      const text = [
        p.name,
        p.sku,
        p.barcode,
        p.category
      ].join(" ").toLowerCase();

      return !q || text.includes(q);
    });

    if ($("productsTableArea")) {
      $("productsTableArea").innerHTML =
        productTable(list);
    }
  };

  /* =======================================================
     PURCHASE
     ======================================================= */

  function purchasePage() {

    const subtotal = purchaseDraft.reduce(
      (sum, item) =>
        sum + num(item.qty) * num(item.cost),
      0
    );

    return `
      <div class="ns-card">

        <h2>📥 Purchase Entry</h2>

        <div class="ns-form">

          <div class="ns-field">
            <label>Supplier</label>

            <select id="purchaseSupplier">

              <option value="">
                Select Supplier
              </option>

              ${suppliers.map(s => `
                <option value="${esc(s.id)}">
                  ${esc(s.name)}
                  ${
                    num(s.due) > 0
                      ? " — Due " + money(s.due)
                      : ""
                  }
                </option>
              `).join("")}

            </select>
          </div>

          <div class="ns-field">
            <label>Invoice Number</label>
            <input id="purchaseInvoice"
              placeholder="Supplier invoice no.">
          </div>

          <div class="ns-field">
            <label>Purchase Discount</label>
            <input id="purchaseDiscount"
              type="number"
              min="0"
              value="0"
              oninput="refreshPurchaseTotal()">
          </div>

          <div class="ns-field">
            <label>Payment Now</label>
            <input id="purchasePaid"
              type="number"
              min="0"
              value="0"
              oninput="refreshPurchaseTotal()">
          </div>

          <div class="ns-field ns-full">
            <label>Notes</label>
            <input id="purchaseNotes"
              placeholder="Optional note">
          </div>

        </div>

      </div>

      <div class="ns-card">

        <h3>Add Purchase Product</h3>

        <div class="ns-form">

          <div class="ns-field ns-full">
            <label>Product</label>

            <select id="purchaseProduct">

              <option value="">
                Select existing product
              </option>

              ${products.map(p => `
                <option value="${esc(p.id)}">
                  ${esc(p.name)}
                  ${
                    p.sku
                      ? " — " + esc(p.sku)
                      : ""
                  }
                </option>
              `).join("")}

            </select>
          </div>

          <div class="ns-field">
            <label>Quantity</label>
            <input id="purchaseQty"
              type="number"
              min="1"
              value="1">
          </div>

          <div class="ns-field">
            <label>Purchase Cost</label>
            <input id="purchaseCost"
              type="number"
              min="0"
              value="0">
          </div>

          <div class="ns-field">
            <label>Sale Price</label>
            <input id="purchaseSale"
              type="number"
              min="0"
              value="0">
          </div>

          <div class="ns-field">
            <label>MRP</label>
            <input id="purchaseMrp"
              type="number"
              min="0"
              value="0">
          </div>

          <div class="ns-field">
            <label>Barcode</label>
            <input id="purchaseBarcode"
              placeholder="Barcode">
          </div>

          <div class="ns-field">
            <label>SKU</label>
            <input id="purchaseSku"
              placeholder="SKU">
          </div>

        </div>

        <div class="ns-actions">

          <button class="ns-btn blue"
            onclick="addPurchaseItem()">
            ＋ Add to Purchase
          </button>

          <button class="ns-btn light"
            onclick="newPurchaseProduct()">
            ＋ New Product
          </button>

        </div>

      </div>

      <div class="ns-card">

        <h3>Purchase Items</h3>

        <div id="purchaseItemsArea">
          ${purchaseItemsHTML()}
        </div>

      </div>

      <div class="ns-card">

        <div id="purchaseSummary">
          ${purchaseSummaryHTML()}
        </div>

        <div class="ns-actions">

          <button class="ns-btn green"
            onclick="completePurchase()">
            💾 Complete Purchase
          </button>

          <button class="ns-btn purple"
            onclick="openPurchaseBarcodeEditor()">
            🏷️ Barcode Print List
          </button>

          <button class="ns-btn light"
            onclick="clearPurchase()">
            Clear
          </button>

        </div>

      </div>
    `;
  }

  window.newPurchaseProduct = function() {
    openProductModal();
  };

  window.addPurchaseItem = function() {

    const productId = $("purchaseProduct").value;

    if (!productId) {
      toast("Select a product.");
      return;
    }

    const product = findProduct(productId);

    if (!product) {
      toast("Product not found.");
      return;
    }

    const qty = Math.max(
      1,
      Math.floor(num($("purchaseQty").value))
    );

    const cost = num($("purchaseCost").value);
    const sale = num($("purchaseSale").value);
    const mrp = num($("purchaseMrp").value);
    const barcode =
      $("purchaseBarcode").value.trim() ||
      product.barcode ||
      "";
    const sku =
      $("purchaseSku").value.trim() ||
      product.sku ||
      "";

    const existing =
      purchaseDraft.find(
        x => String(x.productId) === String(productId)
      );

    if (existing) {

      existing.qty += qty;

      if (cost > 0) existing.cost = cost;
      if (sale > 0) existing.sale = sale;
      if (mrp > 0) existing.mrp = mrp;
      if (barcode) existing.barcode = barcode;
      if (sku) existing.sku = sku;

    } else {

      purchaseDraft.push({
        id: uid("PI"),
        productId: product.id,
        name: product.name,
        sku,
        barcode,
        qty,
        cost,
        sale: sale || num(product.sale),
        mrp: mrp || num(product.mrp)
      });
    }

    renderPurchaseParts();

    toast("Product added to purchase.");
  };

  function purchaseItemsHTML() {

    if (!purchaseDraft.length) {
      return `
        <div class="ns-empty">
          No purchase items.
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
              <th>Barcode</th>
              <th>Qty</th>
              <th>Cost</th>
              <th>Sale</th>
              <th>MRP</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${purchaseDraft.map(item => `
              <tr>

                <td>${esc(item.name)}</td>

                <td>${esc(item.sku)}</td>

                <td>${esc(item.barcode)}</td>

                <td>
                  <input
                    style="width:75px"
                    type="number"
                    min="1"
                    value="${num(item.qty)}"
                    onchange="changePurchaseQty(
                      '${esc(item.id)}',
                      this.value
                    )">
                </td>

                <td>${money(item.cost)}</td>

                <td>${money(item.sale)}</td>

                <td>${money(item.mrp)}</td>

                <td>
                  ${money(
                    num(item.qty) *
                    num(item.cost)
                  )}
                </td>

                <td>
                  <button
                    class="ns-btn red"
                    onclick="removePurchaseItem('${esc(item.id)}')">
                    ×
                  </button>
                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  window.changePurchaseQty = function(id, value) {

    const item = purchaseDraft.find(
      x => String(x.id) === String(id)
    );

    if (!item) return;

    item.qty = Math.max(
      1,
      Math.floor(num(value))
    );

    renderPurchaseParts();
  };

  window.removePurchaseItem = function(id) {

    purchaseDraft =
      purchaseDraft.filter(
        x => String(x.id) !== String(id)
      );

    renderPurchaseParts();
  };

  function purchaseSummaryHTML() {

    const subtotal = purchaseDraft.reduce(
      (sum, x) =>
        sum + num(x.qty) * num(x.cost),
      0
    );

    const discount =
      num($("purchaseDiscount")?.value);

    const total = Math.max(
      0,
      subtotal - discount
    );

    const paid =
      Math.min(
        total,
        Math.max(
          0,
          num($("purchasePaid")?.value)
        )
      );

    const due = Math.max(
      0,
      total - paid
    );

    return `
      <div class="ns-summary-grid">

        <div class="ns-summary-box">
          <small>Subtotal</small>
          <strong>${money(subtotal)}</strong>
        </div>

        <div class="ns-summary-box">
          <small>Discount</small>
          <strong>${money(discount)}</strong>
        </div>

        <div class="ns-summary-box">
          <small>Total</small>
          <strong>${money(total)}</strong>
        </div>

        <div class="ns-summary-box">
          <small>Paid</small>
          <strong>${money(paid)}</strong>
        </div>

        <div class="ns-summary-box">
          <small>Supplier Due</small>
          <strong>${money(due)}</strong>
        </div>

      </div>
    `;
  }

  window.refreshPurchaseTotal = function() {

    if ($("purchaseSummary")) {
      $("purchaseSummary").innerHTML =
        purchaseSummaryHTML();
    }
  };

  function renderPurchaseParts() {

    if ($("purchaseItemsArea")) {
      $("purchaseItemsArea").innerHTML =
        purchaseItemsHTML();
    }

    refreshPurchaseTotal();
  }

  window.clearPurchase = function() {

    purchaseDraft = [];

    showPage("purchase");

    toast("Purchase cleared.");
  };

  window.completePurchase = function() {

    if (!purchaseDraft.length) {
      toast("Add purchase items first.");
      return;
    }

    const supplierId =
      $("purchaseSupplier").value;

    const supplier =
      findSupplier(supplierId);

    const invoice =
      $("purchaseInvoice").value.trim();

    const discount =
      num($("purchaseDiscount").value);

    const notes =
      $("purchaseNotes").value.trim();

    const subtotal = purchaseDraft.reduce(
      (sum, x) =>
        sum + num(x.qty) * num(x.cost),
      0
    );

    const total = Math.max(
      0,
      subtotal - discount
    );

    const paid = Math.min(
      total,
      Math.max(
        0,
        num($("purchasePaid").value)
      )
    );

    const due = Math.max(
      0,
      total - paid
    );

    const items = [];

    purchaseDraft.forEach(item => {

      let product = findProduct(item.productId);

      if (!product) {
        return;
      }

      const oldStock = num(product.stock);

      product.stock =
        oldStock + num(item.qty);

      if (item.cost > 0) {
        product.purchase = num(item.cost);
      }

      if (item.sale > 0) {
        product.sale = num(item.sale);
      }

      if (item.mrp > 0) {
        product.mrp = num(item.mrp);
      }

      if (item.barcode) {
        product.barcode = item.barcode;
      }

      if (item.sku) {
        product.sku = item.sku;
      }

      items.push({
        productId: product.id,
        product: product.name,
        sku: product.sku,
        barcode: product.barcode,
        qty: num(item.qty),
        cost: num(item.cost),
        sale: num(product.sale),
        mrp: num(product.mrp),
        total:
          num(item.qty) *
          num(item.cost)
      });

      stockHistory.push({
        id: uid("ST"),
        date: today(),
        type: "Purchase",
        productId: product.id,
        product: product.name,
        qty: num(item.qty),
        balance: product.stock,
        reference: invoice || "Purchase"
      });
    });

    const purchase = {
      id: uid("PUR"),
      date: today(),
      invoice,
      supplierId: supplier?.id || "",
      supplier: supplier?.name || "Cash Supplier",
      items,
      subtotal,
      discount,
      total,
      paid,
      due,
      notes
    };

    purchases.push(purchase);

    if (supplier && due > 0) {
      supplier.due =
        num(supplier.due) + due;
    }

    if (supplier && paid > 0) {
      payments.push({
        id: uid("PAY"),
        date: today(),
        type: "Supplier Payment",
        partyId: supplier.id,
        party: supplier.name,
        amount: paid,
        note: "Purchase payment",
        reference: purchase.id
      });
    }

    saveAll();

    /*
       IMPORTANT:
       Barcode quantity automatically starts with
       exact purchase quantity.
    */

    items.forEach(item => {

      const existing =
        barcodeQueue.find(
          x =>
            String(x.productId) ===
            String(item.productId)
        );

      if (existing) {

        existing.qty += num(item.qty);

      } else {

        barcodeQueue.push({
          productId: item.productId,
          name: item.product,
          sku: item.sku,
          barcode: item.barcode,
          price: item.sale,
          mrp: item.mrp,
          qty: num(item.qty)
        });
      }
    });

    purchaseDraft = [];

    saveAll();

    toast("Purchase completed successfully.");

    showPage("purchase");
  };

  /* =======================================================
     SALES / POS
     ======================================================= */

  function salesPage() {

    const subtotal = cart.reduce(
      (sum, x) =>
        sum + num(x.qty) * num(x.price),
      0
    );

    return `
      <div class="ns-sale-layout">

        <div>

          <div class="ns-card">

            <h2>🛒 New Sale / POS</h2>

            <div class="ns-form">

              <div class="ns-field ns-full">
                <label>
                  Search Product / SKU / Barcode
                </label>

                <input
                  id="posSearch"
                  placeholder="Type product name or scan barcode..."
                  oninput="renderProductPicker()">
              </div>

              <div class="ns-field">
                <label>Customer</label>

                <select id="saleCustomer"
                  onchange="refreshSaleCustomerInfo()">

                  <option value="">
                    Walk-in Customer
                  </option>

                  ${customers.map(c => `
                    <option value="${esc(c.id)}">
                      ${esc(c.name)}
                    </option>
                  `).join("")}

                </select>

                <div
                  id="saleCustomerDue"
                  style="font-size:12px;color:#b45309;margin-top:4px">
                </div>

              </div>

              <div class="ns-field">
                <label>Payment Method</label>

                <select id="salePayment"
                  onchange="refreshSaleTotal()">

                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>Credit</option>

                </select>
              </div>

              <div class="ns-field">
                <label>Discount</label>

                <input
                  id="saleDiscount"
                  type="number"
                  min="0"
                  value="0"
                  oninput="refreshSaleTotal()">
              </div>

              <div class="ns-field">
                <label>Paid Amount</label>

                <input
                  id="salePaid"
                  type="number"
                  min="0"
                  value=""
                  placeholder="Full amount"
                  oninput="refreshSaleTotal()">
              </div>

              <div class="ns-field ns-full">
                <label>Notes</label>

                <input
                  id="saleNotes"
                  placeholder="Optional note">
              </div>

            </div>

            <div
              id="productPicker"
              class="ns-product-picker">
              ${productPickerHTML()}
            </div>

          </div>

          <div class="ns-card">

            <h3>Cart</h3>

            <div id="cartArea">
              ${cartHTML()}
            </div>

          </div>

        </div>

        <div>

          <div class="ns-card">

            <h3>Sale Summary</h3>

            <div id="saleSummary">
              ${saleSummaryHTML(
                subtotal,
                0,
                subtotal,
                subtotal,
                0
              )}
            </div>

            <div class="ns-actions">

              <button
                class="ns-btn green"
                onclick="completeSale()">
                Complete Sale
              </button>

              <button
                class="ns-btn light"
                onclick="clearCart()">
                Clear Cart
              </button>

            </div>

          </div>

        </div>

      </div>
    `;
  }

  function productPickerHTML() {

    const q =
      ($("posSearch")?.value || "")
        .toLowerCase()
        .trim();

    const list = products.filter(p => {

      const text = [
        p.name,
        p.sku,
        p.barcode,
        p.category
      ].join(" ").toLowerCase();

      return !q || text.includes(q);
    }).slice(0,30);

    if (!list.length) {
      return `
        <div class="ns-empty">
          No products found.
        </div>
      `;
    }

    return list.map(p => `
      <button
        class="ns-product-mini"
        onclick="addToCart('${esc(p.id)}')">

        <strong>${esc(p.name)}</strong>

        <br>

        <small>
          SKU: ${esc(p.sku || "-")}
        </small>

        <br>

        <small>
          Stock: ${num(p.stock)}
        </small>

        <br>

        <strong>
          ${money(p.sale)}
        </strong>

      </button>
    `).join("");
  }

  window.renderProductPicker = function() {

    if ($("productPicker")) {
      $("productPicker").innerHTML =
        productPickerHTML();
    }
  };

  window.addToCart = function(id) {

    const product = findProduct(id);

    if (!product) return;

    if (num(product.stock) <= 0) {
      toast("Product is out of stock.");
      return;
    }

    const existing = cart.find(
      x =>
        String(x.productId) ===
        String(id)
    );

    if (existing) {

      if (
        num(existing.qty) >=
        num(product.stock)
      ) {
        toast("Not enough stock.");
        return;
      }

      existing.qty++;

    } else {

      cart.push({
        productId: product.id,
        qty: 1,
        price: num(product.sale)
      });
    }

    renderSalesParts();
  };

  function cartHTML() {

    if (!cart.length) {
      return `
        <div class="ns-empty">
          Cart is empty.
        </div>
      `;
    }

    return cart.map(item => {

      const p = findProduct(item.productId);

      if (!p) return "";

      return `
        <div class="ns-cart-row">

          <div>
            <strong>${esc(p.name)}</strong>
            <br>
            <small>${money(item.price)}</small>
          </div>

          <input
            type="number"
            min="1"
            max="${num(p.stock)}"
            value="${num(item.qty)}"
            onchange="
              changeCartQty(
                '${esc(p.id)}',
                this.value
              )
            ">

          <strong>
            ${money(
              num(item.qty) *
              num(item.price)
            )}
          </strong>

          <button
            class="ns-btn red"
            style="padding:6px"
            onclick="
              removeFromCart('${esc(p.id)}')
            ">
            ×
          </button>

        </div>
      `;
    }).join("");
  }

  window.changeCartQty = function(id,value) {

    const item = cart.find(
      x =>
        String(x.productId) ===
        String(id)
    );

    const p = findProduct(id);

    if (!item || !p) return;

    let qty = Math.max(
      1,
      Math.floor(num(value))
    );

    qty = Math.min(
      qty,
      num(p.stock)
    );

    if (qty <= 0) {
      cart = cart.filter(
        x =>
          String(x.productId) !==
          String(id)
      );
    } else {
      item.qty = qty;
    }

    renderSalesParts();
  };

  window.removeFromCart = function(id) {

    cart = cart.filter(
      x =>
        String(x.productId) !==
        String(id)
    );

    renderSalesParts();
  };

  window.clearCart = function() {
    cart = [];
    renderSalesParts();
  };

  function saleSummaryHTML(
    subtotal,
    discount,
    total,
    paid,
    due
  ) {

    return `
      <div class="ns-total-box">

        <div class="ns-total-line">
          <span>Subtotal</span>
          <strong>${money(subtotal)}</strong>
        </div>

        <div class="ns-total-line">
          <span>Discount</span>
          <strong>${money(discount)}</strong>
        </div>

        <div class="ns-total-line big">
          <span>Total</span>
          <strong>${money(total)}</strong>
        </div>

        <div class="ns-total-line">
          <span>Paid</span>
          <strong>${money(paid)}</strong>
        </div>

        <div class="ns-total-line">
          <span>Due</span>
          <strong class="${
            due > 0
              ? "ns-danger"
              : "ns-success"
          }">
            ${money(due)}
          </strong>
        </div>

      </div>
    `;
  }

  window.refreshSaleTotal = function() {

    const subtotal = cart.reduce(
      (sum,x) =>
        sum + num(x.qty) * num(x.price),
      0
    );

    const discount =
      Math.max(
        0,
        num($("saleDiscount")?.value)
      );

    const total =
      Math.max(
        0,
        subtotal - discount
      );

    const method =
      $("salePayment")?.value || "Cash";

    let paid;

    if (method === "Credit") {
      paid = 0;

      if ($("salePaid")) {
        $("salePaid").value = "0";
      }

    } else {

      const field =
        $("salePaid")?.value;

      paid =
        field === "" || field == null
          ? total
          : Math.min(
              total,
              Math.max(0,num(field))
            );
    }

    const due =
      Math.max(0,total - paid);

    if ($("saleSummary")) {

      $("saleSummary").innerHTML =
        saleSummaryHTML(
          subtotal,
          discount,
          total,
          paid,
          due
        );
    }
  };

  window.refreshSaleCustomerInfo = function() {

    const id =
      $("saleCustomer")?.value || "";

    const c = findCustomer(id);

    const el = $("saleCustomerDue");

    if (!el) return;

    if (c && num(c.due) > 0) {
      el.textContent =
        "Current Due: " + money(c.due);
    } else {
      el.textContent =
        "Current Due: ₹0.00";
    }
  };

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

  window.completeSale = function() {

    if (!cart.length) {
      toast("Cart is empty.");
      return;
    }

    const customerId =
      $("saleCustomer").value;

    const customer =
      findCustomer(customerId);

    const payment =
      $("salePayment").value || "Cash";

    const discount =
      Math.max(
        0,
        num($("saleDiscount").value)
      );

    const notes =
      $("saleNotes").value.trim();

    const subtotal = cart.reduce(
      (sum,x) =>
        sum + num(x.qty) * num(x.price),
      0
    );

    const total =
      Math.max(
        0,
        subtotal - discount
      );

    let paid;

    if (payment === "Credit") {

      paid = 0;

    } else {

      const field =
        $("salePaid").value;

      paid =
        field === ""
          ? total
          : Math.min(
              total,
              Math.max(0,num(field))
            );
    }

    const due =
      Math.max(
        0,
        total - paid
      );

    const saleItems = [];

    for (const item of cart) {

      const p =
        findProduct(item.productId);

      if (!p) continue;

      if (
        num(p.stock) <
        num(item.qty)
      ) {

        toast(
          "Not enough stock: " +
          p.name
        );

        return;
      }

      saleItems.push({
        productId:p.id,
        product:p.name,
        sku:p.sku,
        barcode:p.barcode,
        qty:num(item.qty),
        price:num(item.price),
        purchase:num(p.purchase),
        total:
          num(item.qty) *
          num(item.price),
        profit:
          num(item.qty) *
          (
            num(item.price) -
            num(p.purchase)
          )
      });
    }

    if (!saleItems.length) {
      toast("No valid products.");
      return;
    }

    saleItems.forEach(item => {

      const p =
        findProduct(item.productId);

      if (!p) return;

      p.stock =
        Math.max(
          0,
          num(p.stock) -
          num(item.qty)
        );

      stockHistory.push({
        id:uid("ST"),
        date:today(),
        type:"Sale",
        productId:p.id,
        product:p.name,
        qty:-num(item.qty),
        balance:num(p.stock),
        reference:"Sale"
      });
    });

    const profit =
      saleItems.reduce(
        (sum,item) =>
          sum + num(item.profit),
        0
      ) - discount;

    const sale = {
      id:uid("SAL"),
      date:today(),
      time:new Date().toLocaleTimeString("en-IN"),
      customerId:customer?.id || "",
      customer:
        customer?.name ||
        "Walk-in Customer",
      payment,
      items:saleItems,
      subtotal,
      discount,
      total,
      paid,
      due,
      profit,
      notes
    };

    sales.push(sale);

    if (customer && due > 0) {
      customer.due =
        num(customer.due) + due;
    }

    if (customer && paid > 0) {

      payments.push({
        id:uid("PAY"),
        date:today(),
        type:"Customer Payment",
        partyId:customer.id,
        party:customer.name,
        amount:paid,
        note:"Sale payment",
        reference:sale.id
      });
    }

    saveAll();

    cart = [];

    toast("Sale completed successfully.");

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
              <th>Date</th>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${list.map(s => `
              <tr>

                <td>${esc(s.date)}</td>

                <td>${esc(s.id)}</td>

                <td>${esc(s.customer)}</td>

                <td>
                  <span class="ns-badge blue">
                    ${esc(s.payment)}
                  </span>
                </td>

                <td>${money(s.total)}</td>

                <td>${money(s.paid)}</td>

                <td>
                  ${
                    num(s.due) > 0
                      ? `<span class="ns-badge red">
                           ${money(s.due)}
                         </span>`
                      : money(0)
                  }
                </td>

                <td>
                  <button
                    class="ns-btn light"
                    onclick="viewSale('${esc(s.id)}')">
                    View
                  </button>
                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  window.viewSale = function(id) {

    const sale =
      sales.find(
        x =>
          String(x.id) ===
          String(id)
      );

    if (!sale) return;

    openModal(
      "Sale Details",
      `
        <p>
          <strong>Invoice:</strong>
          ${esc(sale.id)}
        </p>

        <p>
          <strong>Date:</strong>
          ${esc(sale.date)}
        </p>

        <p>
          <strong>Customer:</strong>
          ${esc(sale.customer)}
        </p>

        <p>
          <strong>Payment:</strong>
          ${esc(sale.payment)}
        </p>

        <div class="ns-summary-grid">

          <div class="ns-summary-box">
            Subtotal<br>
            <strong>${money(sale.subtotal)}</strong>
          </div>

          <div class="ns-summary-box">
            Discount<br>
            <strong>${money(sale.discount)}</strong>
          </div>

          <div class="ns-summary-box">
            Total<br>
            <strong>${money(sale.total)}</strong>
          </div>

          <div class="ns-summary-box">
            Paid<br>
            <strong>${money(sale.paid)}</strong>
          </div>

          <div class="ns-summary-box">
            Due<br>
            <strong>${money(sale.due)}</strong>
          </div>

          <div class="ns-summary-box">
            Profit<br>
            <strong>${money(sale.profit)}</strong>
          </div>

        </div>

        <h3>Items</h3>

        <div class="ns-table-wrap">

          <table>

            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>

              ${(sale.items || []).map(i => `
                <tr>
                  <td>${esc(i.product)}</td>
                  <td>${num(i.qty)}</td>
                  <td>${money(i.price)}</td>
                  <td>${money(i.total)}</td>
                </tr>
              `).join("")}

            </tbody>

          </table>

        </div>

        <div class="ns-actions">

          <button class="ns-btn blue"
            onclick="printSale('${esc(sale.id)}')">
            🖨️ Print Invoice
          </button>

        </div>
      `
    );
  };

  window.printSale = function(id) {

    const sale =
      sales.find(
        x => String(x.id) === String(id)
      );

    if (!sale) return;

    const win =
      window.open(
        "",
        "_blank",
        "width=800,height=900"
      );

    if (!win) {
      toast("Allow popups to print.");
      return;
    }

    win.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>${esc(sale.id)}</title>

        <style>
          body {
            font-family:Arial;
            padding:20px;
            color:#111;
          }

          h1 {
            text-align:center;
          }

          table {
            width:100%;
            border-collapse:collapse;
          }

          th,td {
            border:1px solid #ccc;
            padding:8px;
          }

          .right {
            text-align:right;
          }

          .total {
            font-size:20px;
            font-weight:bold;
          }
        </style>
      </head>

      <body>

        <h1>${esc(settings.store)}</h1>

        <p style="text-align:center">
          ${esc(settings.address || "")}
          ${settings.phone ? "<br>Phone: " + esc(settings.phone) : ""}
        </p>

        <hr>

        <p>
          <strong>Invoice:</strong>
          ${esc(sale.id)}
          <br>
          <strong>Date:</strong>
          ${esc(sale.date)}
          <br>
          <strong>Customer:</strong>
          ${esc(sale.customer)}
        </p>

        <table>

          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>

            ${(sale.items || []).map(i => `
              <tr>
                <td>${esc(i.product)}</td>
                <td>${num(i.qty)}</td>
                <td>${money(i.price)}</td>
                <td>${money(i.total)}</td>
              </tr>
            `).join("")}

          </tbody>

        </table>

        <p class="right">
          Subtotal: ${money(sale.subtotal)}
          <br>
          Discount: ${money(sale.discount)}
          <br>
          <span class="total">
            Total: ${money(sale.total)}
          </span>
          <br>
          Paid: ${money(sale.paid)}
          <br>
          Due: ${money(sale.due)}
        </p>

      </body>
      </html>
    `);

    win.document.close();

    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  /* =======================================================
     CUSTOMER CRUD
     ======================================================= */

  window.openCustomerModal = function(id) {

    editingCustomerId = id || null;

    const c = id ? findCustomer(id) : null;

    openModal(
      c ? "Edit Customer" : "Add Customer",
      `
        <div class="ns-form">

          <div class="ns-field">
            <label>Name *</label>
            <input id="cusName"
              value="${esc(c?.name || "")}">
          </div>

          <div class="ns-field">
            <label>Phone</label>
            <input id="cusPhone"
              value="${esc(c?.phone || "")}">
          </div>

          <div class="ns-field">
            <label>Email</label>
            <input id="cusEmail"
              value="${esc(c?.email || "")}">
          </div>

          <div class="ns-field">
            <label>Opening Due</label>
            <input id="cusDue"
              type="number"
              min="0"
              value="${num(c?.due)}">
          </div>

          <div class="ns-field ns-full">
            <label>Address</label>
            <textarea id="cusAddress">${esc(
              c?.address || ""
            )}</textarea>
          </div>

        </div>

        <div class="ns-actions">

          <button class="ns-btn green"
            onclick="saveCustomer()">
            Save Customer
          </button>

          ${
            c
              ? `
                <button class="ns-btn red"
                  onclick="deleteCustomer('${esc(c.id)}')">
                  Delete
                </button>
              `
              : ""
          }

        </div>
      `
    );
  };

  window.saveCustomer = function() {

    const name =
      $("cusName").value.trim();

    if (!name) {
      toast("Customer name is required.");
      return;
    }

    const data = {
      name,
      phone:$("cusPhone").value.trim(),
      email:$("cusEmail").value.trim(),
      due:num($("cusDue").value),
      address:$("cusAddress").value.trim()
    };

    if (editingCustomerId) {

      const c =
        findCustomer(editingCustomerId);

      if (c) Object.assign(c,data);

      toast("Customer updated.");

    } else {

      customers.push({
        id:uid("CUS"),
        ...data,
        createdAt:nowISO()
      });

      toast("Customer added.");
    }

    saveAll();
    closeModal();
    showPage("customers");
  };

  window.deleteCustomer = function(id) {

    if (!confirm("Delete this customer?")) {
      return;
    }

    customers =
      customers.filter(
        x => String(x.id) !== String(id)
      );

    saveAll();
    closeModal();
    showPage("customers");
  };

  function customersPage() {

    return `
      <div class="ns-card">

        <div class="ns-toolbar">

          <input
            id="customerSearch"
            placeholder="Search customer..."
            oninput="renderCustomers()">

          <button class="ns-btn green"
            onclick="openCustomerModal()">
            ＋ Add Customer
          </button>

        </div>

        <div id="customersArea">
          ${customerTable(customers)}
        </div>

      </div>
    `;
  }

  function customerTable(list) {

    if (!list.length) {
      return `
        <div class="ns-empty">
          No customers found.
        </div>
      `;
    }

    return `
      <div class="ns-table-wrap">

        <table>

          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Due</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${list.map(c => `
              <tr>

                <td>${esc(c.name)}</td>

                <td>${esc(c.phone)}</td>

                <td>${esc(c.email)}</td>

                <td>
                  ${
                    num(c.due) > 0
                      ? `<span class="ns-badge red">
                           ${money(c.due)}
                         </span>`
                      : money(0)
                  }
                </td>

                <td>

                  <button class="ns-btn blue"
                    onclick="openCustomerModal('${esc(c.id)}')">
                    Edit
                  </button>

                  <button class="ns-btn orange"
                    onclick="openPaymentModal('customer','${esc(c.id)}')">
                    Receive
                  </button>

                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  window.renderCustomers = function() {

    const q =
      ($("customerSearch")?.value || "")
        .toLowerCase()
        .trim();

    const list = customers.filter(c =>
      [
        c.name,
        c.phone,
        c.email
      ].join(" ")
       .toLowerCase()
       .includes(q)
    );

    $("customersArea").innerHTML =
      customerTable(list);
  };

  /* =======================================================
     SUPPLIERS
     ======================================================= */

  window.openSupplierModal = function(id) {

    editingSupplierId = id || null;

    const s = id ? findSupplier(id) : null;

    openModal(
      s ? "Edit Supplier" : "Add Supplier",
      `
        <div class="ns-form">

          <div class="ns-field">
            <label>Name *</label>
            <input id="supName"
              value="${esc(s?.name || "")}">
          </div>

          <div class="ns-field">
            <label>Phone</label>
            <input id="supPhone"
              value="${esc(s?.phone || "")}">
          </div>

          <div class="ns-field">
            <label>Email</label>
            <input id="supEmail"
              value="${esc(s?.email || "")}">
          </div>

          <div class="ns-field">
            <label>Opening Due</label>
            <input id="supDue"
              type="number"
              min="0"
              value="${num(s?.due)}">
          </div>

          <div class="ns-field ns-full">
            <label>Address</label>
            <textarea id="supAddress">${esc(
              s?.address || ""
            )}</textarea>
          </div>

        </div>

        <div class="ns-actions">

          <button class="ns-btn green"
            onclick="saveSupplier()">
            Save Supplier
          </button>

          ${
            s
              ? `
                <button class="ns-btn red"
                  onclick="deleteSupplier('${esc(s.id)}')">
                  Delete
                </button>
              `
              : ""
          }

        </div>
      `
    );
  };

  window.saveSupplier = function() {

    const name =
      $("supName").value.trim();

    if (!name) {
      toast("Supplier name is required.");
      return;
    }

    const data = {
      name,
      phone:$("supPhone").value.trim(),
      email:$("supEmail").value.trim(),
      due:num($("supDue").value),
      address:$("supAddress").value.trim()
    };

    if (editingSupplierId) {

      const s =
        findSupplier(editingSupplierId);

      if (s) Object.assign(s,data);

      toast("Supplier updated.");

    } else {

      suppliers.push({
        id:uid("SUP"),
        ...data,
        createdAt:nowISO()
      });

      toast("Supplier added.");
    }

    saveAll();
    closeModal();
    showPage("suppliers");
  };

  window.deleteSupplier = function(id) {

    if (!confirm("Delete this supplier?")) {
      return;
    }

    suppliers =
      suppliers.filter(
        x => String(x.id) !== String(id)
      );

    saveAll();
    closeModal();
    showPage("suppliers");
  };

  function suppliersPage() {

    return `
      <div class="ns-card">

        <div class="ns-toolbar">

          <input
            id="supplierSearch"
            placeholder="Search supplier..."
            oninput="renderSuppliers()">

          <button class="ns-btn green"
            onclick="openSupplierModal()">
            ＋ Add Supplier
          </button>

        </div>

        <div id="suppliersArea">
          ${supplierTable(suppliers)}
        </div>

      </div>
    `;
  }

  function supplierTable(list) {

    if (!list.length) {
      return `
        <div class="ns-empty">
          No suppliers found.
        </div>
      `;
    }

    return `
      <div class="ns-table-wrap">

        <table>

          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Due</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${list.map(s => `
              <tr>

                <td>${esc(s.name)}</td>

                <td>${esc(s.phone)}</td>

                <td>${esc(s.email)}</td>

                <td>
                  ${
                    num(s.due) > 0
                      ? `<span class="ns-badge red">
                           ${money(s.due)}
                         </span>`
                      : money(0)
                  }
                </td>

                <td>

                  <button class="ns-btn blue"
                    onclick="openSupplierModal('${esc(s.id)}')">
                    Edit
                  </button>

                  <button class="ns-btn orange"
                    onclick="openPaymentModal('supplier','${esc(s.id)}')">
                    Pay
                  </button>

                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  window.renderSuppliers = function() {

    const q =
      ($("supplierSearch")?.value || "")
        .toLowerCase()
        .trim();

    const list = suppliers.filter(s =>
      [
        s.name,
        s.phone,
        s.email
      ].join(" ")
       .toLowerCase()
       .includes(q)
    );

    $("suppliersArea").innerHTML =
      supplierTable(list);
  };

  /* =======================================================
     PAYMENTS / DUE
     ======================================================= */

  window.openPaymentModal = function(type,id) {

    const party =
      type === "customer"
        ? findCustomer(id)
        : findSupplier(id);

    if (!party) return;

    const label =
      type === "customer"
        ? "Receive From Customer"
        : "Pay Supplier";

    openModal(
      label,
      `
        <div class="ns-form">

          <div class="ns-field">
            <label>Name</label>
            <input value="${esc(party.name)}" disabled>
          </div>

          <div class="ns-field">
            <label>Current Due</label>
            <input value="${money(party.due)}" disabled>
          </div>

          <div class="ns-field">
            <label>Amount</label>
            <input
              id="paymentAmount"
              type="number"
              min="0"
              max="${num(party.due)}"
              value="${num(party.due)}">
          </div>

          <div class="ns-field">
            <label>Note</label>
            <input
              id="paymentNote"
              placeholder="Payment note">
          </div>

        </div>

        <div class="ns-actions">

          <button class="ns-btn green"
            onclick="savePayment('${type}','${esc(id)}')">
            Save Payment
          </button>

        </div>
      `
    );
  };

  window.savePayment = function(type,id) {

    const party =
      type === "customer"
        ? findCustomer(id)
        : findSupplier(id);

    if (!party) return;

    const amount =
      Math.min(
        num(party.due),
        Math.max(
          0,
          num($("paymentAmount").value)
        )
      );

    if (amount <= 0) {
      toast("Enter a valid amount.");
      return;
    }

    party.due =
      Math.max(
        0,
        num(party.due) - amount
      );

    payments.push({
      id:uid("PAY"),
      date:today(),
      type:
        type === "customer"
          ? "Customer Payment"
          : "Supplier Payment",
      partyId:party.id,
      party:party.name,
      amount,
      note:
        $("paymentNote").value.trim()
    });

    saveAll();

    closeModal();

    toast("Payment saved.");

    showPage("payments");
  };

  function paymentsPage() {

    const customerDue =
      totalCustomerDue();

    const supplierDue =
      totalSupplierDue();

    return `
      <div class="ns-grid">

        <div class="ns-stat">
          <small>Total Customer Due</small>
          <strong>${money(customerDue)}</strong>
        </div>

        <div class="ns-stat">
          <small>Total Supplier Due</small>
          <strong>${money(supplierDue)}</strong>
        </div>

        <div class="ns-stat">
          <small>Total Customers</small>
          <strong>${customers.length}</strong>
        </div>

        <div class="ns-stat">
          <small>Total Suppliers</small>
          <strong>${suppliers.length}</strong>
        </div>

      </div>

      <div class="ns-card">

        <h2>Customer Due</h2>

        ${customerDueTable()}

      </div>

      <div class="ns-card">

        <h2>Supplier Due</h2>

        ${supplierDueTable()}

      </div>

      <div class="ns-card">

        <h2>Recent Payments</h2>

        ${paymentTable(
          payments.slice().reverse().slice(0,30)
        )}

      </div>
    `;
  }

  function customerDueTable() {

    const list =
      customers.filter(c => num(c.due) > 0);

    if (!list.length) {
      return `
        <div class="ns-empty">
          No customer due.
        </div>
      `;
    }

    return `
      <div class="ns-table-wrap">

        <table>

          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Due</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${list.map(c => `
              <tr>

                <td>${esc(c.name)}</td>
                <td>${esc(c.phone)}</td>

                <td>
                  <span class="ns-badge red">
                    ${money(c.due)}
                  </span>
                </td>

                <td>
                  <button class="ns-btn green"
                    onclick="openPaymentModal('customer','${esc(c.id)}')">
                    Receive
                  </button>
                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  function supplierDueTable() {

    const list =
      suppliers.filter(s => num(s.due) > 0);

    if (!list.length) {
      return `
        <div class="ns-empty">
          No supplier due.
        </div>
      `;
    }

    return `
      <div class="ns-table-wrap">

        <table>

          <thead>
            <tr>
              <th>Supplier</th>
              <th>Phone</th>
              <th>Due</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${list.map(s => `
              <tr>

                <td>${esc(s.name)}</td>
                <td>${esc(s.phone)}</td>

                <td>
                  <span class="ns-badge red">
                    ${money(s.due)}
                  </span>
                </td>

                <td>
                  <button class="ns-btn orange"
                    onclick="openPaymentModal('supplier','${esc(s.id)}')">
                    Pay
                  </button>
                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  function paymentTable(list) {

    if (!list.length) {
      return `
        <div class="ns-empty">
          No payment records.
        </div>
      `;
    }

    return `
      <div class="ns-table-wrap">

        <table>

          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Party</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>

          <tbody>

            ${list.map(p => `
              <tr>
                <td>${esc(p.date)}</td>
                <td>${esc(p.type)}</td>
                <td>${esc(p.party)}</td>
                <td>${money(p.amount)}</td>
                <td>${esc(p.note || "")}</td>
              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  /* =======================================================
     HISTORY
     ======================================================= */

  function historyPage() {

    const transactions = [
      ...sales.map(x => ({
        date:x.date,
        type:"Sale",
        ref:x.id,
        party:x.customer,
        amount:x.total,
        due:x.due
      })),

      ...purchases.map(x => ({
        date:x.date,
        type:"Purchase",
        ref:x.id,
        party:x.supplier,
        amount:x.total,
        due:x.due
      })),

      ...payments.map(x => ({
        date:x.date,
        type:x.type,
        ref:x.id,
        party:x.party,
        amount:x.amount,
        due:0
      }))
    ].sort(
      (a,b) =>
        String(b.date).localeCompare(
          String(a.date)
        )
    );

    return `
      <div class="ns-card">

        <div class="ns-toolbar">

          <input
            id="historySearch"
            placeholder="Search history..."
            oninput="renderHistory()">

          <select
            id="historyType"
            onchange="renderHistory()">

            <option value="">All</option>
            <option value="Sale">Sale</option>
            <option value="Purchase">Purchase</option>
            <option value="Customer Payment">
              Customer Payment
            </option>
            <option value="Supplier Payment">
              Supplier Payment
            </option>

          </select>

        </div>

        <div id="historyArea">
          ${historyTable(transactions)}
        </div>

      </div>
    `;
  }

  function historyTable(list) {

    if (!list.length) {
      return `
        <div class="ns-empty">
          No transactions found.
        </div>
      `;
    }

    return `
      <div class="ns-table-wrap">

        <table>

          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Reference</th>
              <th>Party</th>
              <th>Amount</th>
              <th>Due</th>
            </tr>
          </thead>

          <tbody>

            ${list.map(x => `
              <tr>

                <td>${esc(x.date)}</td>

                <td>
                  <span class="ns-badge blue">
                    ${esc(x.type)}
                  </span>
                </td>

                <td>${esc(x.ref)}</td>

                <td>${esc(x.party)}</td>

                <td>${money(x.amount)}</td>

                <td>${money(x.due)}</td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  window.renderHistory = function() {

    const q =
      ($("historySearch")?.value || "")
        .toLowerCase()
        .trim();

    const type =
      $("historyType")?.value || "";

    const transactions = [
      ...sales.map(x => ({
        date:x.date,
        type:"Sale",
        ref:x.id,
        party:x.customer,
        amount:x.total,
        due:x.due
      })),

      ...purchases.map(x => ({
        date:x.date,
        type:"Purchase",
        ref:x.id,
        party:x.supplier,
        amount:x.total,
        due:x.due
      })),

      ...payments.map(x => ({
        date:x.date,
        type:x.type,
        ref:x.id,
        party:x.party,
        amount:x.amount,
        due:0
      }))
    ];

    const filtered =
      transactions.filter(x => {

        const text = [
          x.type,
          x.ref,
          x.party
        ].join(" ").toLowerCase();

        return (
          (!q || text.includes(q)) &&
          (!type || x.type === type)
        );
      });

    $("historyArea").innerHTML =
      historyTable(filtered);
  };

  /* =======================================================
     BARCODE
     ======================================================= */

  const barcodeTemplates = {
    "25x50-2": {
      label:"25×50 – 2 Line",
      sheet:"t25x50x2",
      sticker:"s25x50x2"
    },

    "25x50-1": {
      label:"25×50 – 1 Line",
      sheet:"t25x50x1",
      sticker:"s25x50x1"
    },

    "15x25-4": {
      label:"15×25 – 4 Line / 4 Column",
      sheet:"t15x25x4",
      sticker:"s15x25x4"
    },

    "30x50-2": {
      label:"30×50 – 2 Line",
      sheet:"t30x50x2",
      sticker:"s30x50x2"
    },

    "20x40-2": {
      label:"20×40 – 2 Line",
      sheet:"t20x40x2",
      sticker:"s20x40x2"
    },

    "20x30-3": {
      label:"20×30 – 3 Line",
      sheet:"t20x30x3",
      sticker:"s20x30x3"
    }
  };

  function barcodePage() {

    return `
      <div class="ns-card">

        <h2>🏷️ Barcode Settings</h2>

        <div class="ns-form">

          <div class="ns-field">
            <label>Template</label>

            <select
              id="barcodeTemplate"
              onchange="changeBarcodeTemplate()">

              ${Object.entries(barcodeTemplates)
                .map(([key,t]) => `
                  <option
                    value="${key}"
                    ${
                      barcodeSettings.template === key
                        ? "selected"
                        : ""
                    }>
                    ${t.label}
                  </option>
                `).join("")}

            </select>
          </div>

          <div class="ns-field">
            <label>Page Margin (mm)</label>

            <input
              id="barcodeMargin"
              type="number"
              min="0"
              value="${num(barcodeSettings.margin)}"
              onchange="saveBarcodeSettings()">
          </div>

          <div class="ns-field">
            <label>Column / Row Gap (mm)</label>

            <input
              id="barcodeGap"
              type="number"
              min="0"
              value="${num(barcodeSettings.gap)}"
              onchange="saveBarcodeSettings()">
          </div>

        </div>

        <div class="ns-actions">

          <button class="ns-btn light"
            onclick="toggleBarcodeOption('showStore')">
            Store: ${barcodeSettings.showStore ? "ON" : "OFF"}
          </button>

          <button class="ns-btn light"
            onclick="toggleBarcodeOption('showProduct')">
            Product: ${barcodeSettings.showProduct ? "ON" : "OFF"}
          </button>

          <button class="ns-btn light"
            onclick="toggleBarcodeOption('showBarcode')">
            Barcode: ${barcodeSettings.showBarcode ? "ON" : "OFF"}
          </button>

          <button class="ns-btn light"
            onclick="toggleBarcodeOption('showPrice')">
            Price: ${barcodeSettings.showPrice ? "ON" : "OFF"}
          </button>

          <button class="ns-btn light"
            onclick="toggleBarcodeOption('showSku')">
            SKU: ${barcodeSettings.showSku ? "ON" : "OFF"}
          </button>

        </div>

      </div>

      <div class="ns-card">

        <h3>Barcode Queue</h3>

        <p style="color:#64748b">
          Purchase quantity অনুযায়ী barcode এখানে যোগ হবে।
          Print করার আগে quantity পরিবর্তন বা item remove করতে পারবেন।
        </p>

        ${barcodeQueueTable()}

        <div class="ns-actions">

          <button class="ns-btn purple"
            onclick="openBarcodeEditor()">
            ✏️ Edit Print List
          </button>

          <button class="ns-btn green"
            onclick="printBarcodeQueue()">
            🖨️ Print Barcodes
          </button>

          <button class="ns-btn red"
            onclick="clearBarcodeQueue()">
            Clear List
          </button>

        </div>

      </div>

      <div class="ns-card">

        <h3>Barcode Preview</h3>

        <div class="ns-barcode-stage">
          ${barcodePreviewHTML()}
        </div>

      </div>

      <div id="barcodePrintArea"></div>
    `;
  }

  function barcodeQueueTable() {

    if (!barcodeQueue.length) {
      return `
        <div class="ns-empty">
          Barcode print list is empty.
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
              <th>Barcode</th>
              <th>Price</th>
              <th>MRP</th>
              <th>Qty</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${barcodeQueue.map((x,i) => `
              <tr>

                <td>${esc(x.name)}</td>
                <td>${esc(x.sku)}</td>
                <td>${esc(x.barcode)}</td>
                <td>${money(x.price)}</td>
                <td>${money(x.mrp)}</td>

                <td>
                  <input
                    style="width:80px"
                    type="number"
                    min="1"
                    value="${num(x.qty)}"
                    onchange="changeBarcodeQty(${i},this.value)">
                </td>

                <td>
                  <button
                    class="ns-btn red"
                    onclick="removeBarcodeItem(${i})">
                    Remove
                  </button>
                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  window.changeBarcodeTemplate = function() {

    barcodeSettings.template =
      $("barcodeTemplate").value;

    saveAll();

    showPage("barcode");
  };

  window.saveBarcodeSettings = function() {

    barcodeSettings.margin =
      Math.max(
        0,
        num($("barcodeMargin")?.value)
      );

    barcodeSettings.gap =
      Math.max(
        0,
        num($("barcodeGap")?.value)
      );

    saveAll();

    toast("Barcode settings saved.");
  };

  window.toggleBarcodeOption = function(key) {

    barcodeSettings[key] =
      !barcodeSettings[key];

    saveAll();

    showPage("barcode");
  };

  window.changeBarcodeQty = function(index,value) {

    if (!barcodeQueue[index]) return;

    barcodeQueue[index].qty =
      Math.max(
        1,
        Math.floor(num(value))
      );

    showPage("barcode");
  };

  window.removeBarcodeItem = function(index) {

    barcodeQueue.splice(index,1);

    showPage("barcode");
  };

  window.clearBarcodeQueue = function() {

    if (!barcodeQueue.length) return;

    if (!confirm("Clear barcode print list?")) {
      return;
    }

    barcodeQueue = [];

    showPage("barcode");
  };

  function barcodeSVG(value) {

    value = String(value || "");

    if (!value) {
      return `
        <svg width="150" height="35"></svg>
      `;
    }

    /*
       Simple deterministic barcode visual.
       The value is printed below as text as well.
       This avoids external libraries and works offline.
    */

    let seed = 0;

    for (let i=0;i<value.length;i++) {
      seed =
        (seed * 31 +
        value.charCodeAt(i)) >>> 0;
    }

    let bars = "";

    const total = 80;

    for (let i=0;i<total;i++) {

      seed =
        (seed * 1664525 + 1013904223) >>> 0;

      const width =
        1 + (seed % 3);

      const black =
        ((seed >>> 8) & 1) === 1;

      if (black) {
        bars += `
          <rect
            x="${i * 2}"
            y="0"
            width="${width}"
            height="35"
            fill="#000"/>
        `;
      }
    }

    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 160 35"
        width="150"
        height="35"
        preserveAspectRatio="none">
        <rect width="160" height="35" fill="#fff"/>
        ${bars}
      </svg>
    `;
  }

  function stickerHTML(item, template) {

    const productLine =
      barcodeSettings.showProduct
        ? `<div style="font-weight:bold;font-size:8px">
             ${esc(item.name)}
           </div>`
        : "";

    const storeLine =
      barcodeSettings.showStore
        ? `<div style="font-size:7px">
             ${esc(settings.store)}
           </div>`
        : "";

    const skuLine =
      barcodeSettings.showSku && item.sku
        ? `<div style="font-size:7px">
             SKU: ${esc(item.sku)}
           </div>`
        : "";

    const priceLine =
      barcodeSettings.showPrice
        ? `<div style="font-size:8px;font-weight:bold">
             ${money(item.price)}
             ${
               num(item.mrp) > 0
                 ? " | MRP " + money(item.mrp)
                 : ""
             }
           </div>`
        : "";

    const barcodeLine =
      barcodeSettings.showBarcode
        ? `
          ${barcodeSVG(item.barcode)}
          <div style="font-size:7px">
            ${esc(item.barcode)}
          </div>
        `
        : "";

    return `
      <div class="ns-sticker ${template.sticker}">

        ${storeLine}
        ${productLine}
        ${skuLine}
        ${barcodeLine}
        ${priceLine}

      </div>
    `;
  }

  function expandedBarcodeItems() {

    const output = [];

    barcodeQueue.forEach(item => {

      const qty =
        Math.max(
          0,
          Math.floor(num(item.qty))
        );

      for (let i=0;i<qty;i++) {
        output.push(item);
      }
    });

    return output;
  }

  function barcodePreviewHTML() {

    const template =
      barcodeTemplates[
        barcodeSettings.template
      ] || barcodeTemplates["25x50-2"];

    const items =
      expandedBarcodeItems().slice(0,20);

    if (!items.length) {
      return `
        <div class="ns-empty">
          No barcode preview.
        </div>
      `;
    }

    return `
      <div
        class="ns-print-sheet ${template.sheet}"
        style="
          gap:${num(barcodeSettings.gap)}mm;
          margin:${num(barcodeSettings.margin)}mm;
        ">

        ${items.map(
          item => stickerHTML(item,template)
        ).join("")}

      </div>
    `;
  }

  window.openBarcodeEditor = function() {

    if (!barcodeQueue.length) {
      toast("Barcode list is empty.");
      return;
    }

    openModal(
      "Edit Barcode Print List",
      `
        <p style="color:#64748b">
          এখানে প্রতিটি product-এর barcode quantity
          পরিবর্তন করতে পারবেন। চাইলে item remove করতে পারবেন।
        </p>

        <div class="ns-table-wrap">

          <table>

            <thead>
              <tr>
                <th>Product</th>
                <th>Barcode</th>
                <th>Current Qty</th>
                <th>New Qty</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              ${barcodeQueue.map((x,i) => `
                <tr>

                  <td>${esc(x.name)}</td>

                  <td>${esc(x.barcode)}</td>

                  <td>${num(x.qty)}</td>

                  <td>
                    <input
                      id="bq_${i}"
                      type="number"
                      min="0"
                      value="${num(x.qty)}"
                      style="width:90px">
                  </td>

                  <td>
                    <button
                      class="ns-btn red"
                      onclick="removeBarcodeFromEditor(${i})">
                      Remove
                    </button>
                  </td>

                </tr>
              `).join("")}

            </tbody>

          </table>

        </div>

        <div class="ns-actions">

          <button
            class="ns-btn green"
            onclick="saveBarcodeEditor()">
            💾 Save List
          </button>

          <button
            class="ns-btn blue"
            onclick="saveBarcodeEditor(); printBarcodeQueue();">
            🖨️ Save & Print
          </button>

          <button
            class="ns-btn light"
            onclick="closeModal()">
            Cancel
          </button>

        </div>
      `
    );
  };

  window.removeBarcodeFromEditor = function(index) {

    barcodeQueue.splice(index,1);

    openBarcodeEditor();
  };

  window.saveBarcodeEditor = function() {

    barcodeQueue =
      barcodeQueue
        .map((x,i) => ({
          ...x,
          qty:
            Math.max(
              0,
              Math.floor(
                num(
                  $(`bq_${i}`)?.value
                )
              )
            )
        }))
        .filter(x => x.qty > 0);

    closeModal();

    showPage("barcode");

    toast("Barcode print list updated.");
  };

  window.openPurchaseBarcodeEditor =
    function() {

      if (!barcodeQueue.length) {
        toast(
          "No barcode items available."
        );
        return;
      }

      openBarcodeEditor();
    };

  window.printBarcodeQueue = function() {

    if (!barcodeQueue.length) {
      toast("Barcode list is empty.");
      return;
    }

    const template =
      barcodeTemplates[
        barcodeSettings.template
      ];

    const items =
      expandedBarcodeItems();

    if (!items.length) {
      toast("Barcode quantity is zero.");
      return;
    }

    const win =
      window.open(
        "",
        "_blank",
        "width=900,height=900"
      );

    if (!win) {
      toast("Please allow popups.");
      return;
    }

    win.document.write(`
      <!doctype html>

      <html>

      <head>

        <title>Barcode Print</title>

        <style>

          @page {
            margin:0;
          }

          html,body {
            margin:0;
            padding:0;
            background:white;
          }

          body {
            font-family:Arial,sans-serif;
          }

          .sheet {
            display:grid;
            grid-template-columns:
              ${
                barcodeSettings.template === "15x25-4"
                  ? "repeat(4,25mm)"
                  : "repeat(1,auto)"
              };
            gap:${num(barcodeSettings.gap)}mm;
            margin:${num(barcodeSettings.margin)}mm;
            align-content:start;
          }

          .sticker {
            background:white;
            color:#000;
            border:1px solid #111;
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            text-align:center;
            overflow:hidden;
            padding:1.2mm;
            line-height:1.05;
            break-inside:avoid;
            page-break-inside:avoid;
          }

          .sticker svg {
            width:95%;
            height:auto;
          }

          ${
            template.sticker === "s25x50x2"
              ? `
                .sticker {
                  width:50mm;
                  height:25mm;
                }
              `
              : ""
          }

          ${
            template.sticker === "s25x50x1"
              ? `
                .sticker {
                  width:50mm;
                  height:25mm;
                }
              `
              : ""
          }

          ${
            template.sticker === "s15x25x4"
              ? `
                .sticker {
                  width:25mm;
                  height:15mm;
                  min-height:15mm;
                  max-height:15mm;
                  font-size:7px;
                }
              `
              : ""
          }

          ${
            template.sticker === "s30x50x2"
              ? `
                .sticker {
                  width:50mm;
                  height:30mm;
                }
              `
              : ""
          }

          ${
            template.sticker === "s20x40x2"
              ? `
                .sticker {
                  width:40mm;
                  height:20mm;
                  font-size:8px;
                }
              `
              : ""
          }

          ${
            template.sticker === "s20x30x3"
              ? `
                .sticker {
                  width:30mm;
                  height:20mm;
                  font-size:8px;
                }
              `
              : ""
          }

        </style>

      </head>

      <body>

        <div class="sheet">

          ${items.map(item => {

            const productLine =
              barcodeSettings.showProduct
                ? `<div style="font-weight:bold;font-size:8px">
                     ${esc(item.name)}
                   </div>`
                : "";

            const storeLine =
              barcodeSettings.showStore
                ? `<div style="font-size:7px">
                     ${esc(settings.store)}
                   </div>`
                : "";

            const skuLine =
              barcodeSettings.showSku && item.sku
                ? `<div style="font-size:7px">
                     SKU: ${esc(item.sku)}
                   </div>`
                : "";

            const priceLine =
              barcodeSettings.showPrice
                ? `<div style="font-size:8px;font-weight:bold">
                     ${money(item.price)}
                     ${
                       num(item.mrp) > 0
                         ? " | MRP " + money(item.mrp)
                         : ""
                     }
                   </div>`
                : "";

            const barcodeLine =
              barcodeSettings.showBarcode
                ? `
                  ${barcodeSVG(item.barcode)}
                  <div style="font-size:7px">
                    ${esc(item.barcode)}
                  </div>
                `
                : "";

            return `
              <div class="sticker">

                ${storeLine}
                ${productLine}
                ${skuLine}
                ${barcodeLine}
                ${priceLine}

              </div>
            `;

          }).join("")}

        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        <\/script>

      </body>

      </html>
    `);

    win.document.close();
  };

  /* =======================================================
     REPORTS
     ======================================================= */

  function reportsPage() {

    const sales = totalSales();
    const purchasesTotal = totalPurchases();
    const profit = sales.reduce(
      (sum,x) =>
        sum + num(x.profit),
      0
    );

    return `
      <div class="ns-grid">

        <div class="ns-stat">
          <small>Total Sales</small>
          <strong>${money(sales)}</strong>
        </div>

        <div class="ns-stat">
          <small>Total Purchase</small>
          <strong>${money(purchasesTotal)}</strong>
        </div>

        <div class="ns-stat">
          <small>Total Profit</small>
          <strong>${money(profit)}</strong>
        </div>

        <div class="ns-stat">
          <small>Stock Value</small>
          <strong>${money(stockValue())}</strong>
        </div>

      </div>

      <div class="ns-card">

        <h2>Sales Report</h2>

        ${salesTable(
          salesDataForReport()
        )}

      </div>

      <div class="ns-card">

        <h2>Stock Report</h2>

        ${productTable(products)}

      </div>
    `;
  }

  function salesDataForReport() {
    return sales
      .slice()
      .reverse()
      .slice(0,100);
  }

  /* =======================================================
     E-COMMERCE
     ======================================================= */

  function ecommercePage() {

    const onlineProducts =
      products.map(p => {

        let item =
          ecommerce.find(
            x =>
              String(x.productId) ===
              String(p.id)
          );

        if (!item) {

          item = {
            id:uid("EC"),
            productId:p.id,
            published:false,
            onlinePrice:num(p.sale),
            featured:false,
            image:"",
            description:p.description || ""
          };
        }

        return {
          product:p,
          online:item
        };
      });

    return `
      <div class="ns-card">

        <h2>🛍️ E-Commerce Management</h2>

        <p style="color:#64748b">
          Products can be managed for your online catalog.
          This section works offline using local storage.
        </p>

        <div class="ns-table-wrap">

          <table>

            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Online Price</th>
                <th>Published</th>
                <th>Featured</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              ${onlineProducts.map(x => {

                const e = x.online;

                return `
                  <tr>

                    <td>${esc(x.product.name)}</td>

                    <td>${num(x.product.stock)}</td>

                    <td>${money(
                      e.onlinePrice
                    )}</td>

                    <td>
                      ${
                        e.published
                          ? `<span class="ns-badge green">
                               Published
                             </span>`
                          : `<span class="ns-badge">
                               Hidden
                             </span>`
                      }
                    </td>

                    <td>
                      ${
                        e.featured
                          ? "⭐ Yes"
                          : "No"
                      }
                    </td>

                    <td>
                      <button
                        class="ns-btn blue"
                        onclick="openEcommerceModal('${esc(x.product.id)}')">
                        Manage
                      </button>
                    </td>

                  </tr>
                `;

              }).join("")}

            </tbody>

          </table>

        </div>

      </div>

      <div class="ns-card">

        <h2>Online Catalog Preview</h2>

        <div class="ns-online-grid">

          ${onlineProducts
            .filter(x => x.online.published)
            .map(x => `
              <div class="ns-online-card">

                <div class="pic">
                  ${
                    x.online.image
                      ? `<img
                          src="${esc(x.online.image)}"
                          style="width:100%;height:100%;object-fit:cover"
                          onerror="this.style.display='none'">`
                      : "📦"
                  }
                </div>

                <div class="body">

                  <strong>
                    ${esc(x.product.name)}
                  </strong>

                  <p>
                    ${esc(
                      x.online.description ||
                      x.product.description ||
                      ""
                    )}
                  </p>

                  <strong>
                    ${money(x.online.onlinePrice)}
                  </strong>

                </div>

              </div>
            `).join("")}

        </div>

      </div>
    `;
  }

  window.openEcommerceModal = function(productId) {

    const p = findProduct(productId);

    if (!p) return;

    let e =
      ecommerce.find(
        x =>
          String(x.productId) ===
          String(productId)
      );

    if (!e) {

      e = {
        id:uid("EC"),
        productId:p.id,
        published:false,
        onlinePrice:num(p.sale),
        featured:false,
        image:"",
        description:p.description || ""
      };

      ecommerce.push(e);
    }

    editingEcommerceId = e.id;

    openModal(
      "E-Commerce Product",
      `
        <div class="ns-form">

          <div class="ns-field">
            <label>Product</label>
            <input
              value="${esc(p.name)}"
              disabled>
          </div>

          <div class="ns-field">
            <label>Online Price</label>
            <input
              id="ecoPrice"
              type="number"
              min="0"
              value="${num(e.onlinePrice)}">
          </div>

          <div class="ns-field">
            <label>Published</label>

            <select id="ecoPublished">
              <option value="yes"
                ${e.published ? "selected":""}>
                Yes
              </option>

              <option value="no"
                ${!e.published ? "selected":""}>
                No
              </option>
            </select>
          </div>

          <div class="ns-field">
            <label>Featured</label>

            <select id="ecoFeatured">
              <option value="yes"
                ${e.featured ? "selected":""}>
                Yes
              </option>

              <option value="no"
                ${!e.featured ? "selected":""}>
                No
              </option>
            </select>
          </div>

          <div class="ns-field ns-full">
            <label>Image URL</label>
            <input
              id="ecoImage"
              value="${esc(e.image || "")}"
              placeholder="https://...">
          </div>

          <div class="ns-field ns-full">
            <label>Online Description</label>

            <textarea
              id="ecoDescription">${esc(
                e.description || ""
              )}</textarea>
          </div>

        </div>

        <div class="ns-actions">

          <button class="ns-btn green"
            onclick="saveEcommerce('${esc(productId)}')">
            Save
          </button>

        </div>
      `
    );
  };

  window.saveEcommerce = function(productId) {

    const p = findProduct(productId);

    if (!p) return;

    let e =
      ecommerce.find(
        x =>
          String(x.productId) ===
          String(productId)
      );

    if (!e) {

      e = {
        id:uid("EC"),
        productId:p.id
      };

      ecommerce.push(e);
    }

    e.onlinePrice =
      num($("ecoPrice").value);

    e.published =
      $("ecoPublished").value === "yes";

    e.featured =
      $("ecoFeatured").value === "yes";

    e.image =
      $("ecoImage").value.trim();

    e.description =
      $("ecoDescription").value.trim();

    saveAll();

    closeModal();

    toast("E-Commerce settings saved.");

    showPage("ecommerce");
  };

  /* =======================================================
     SETTINGS
     ======================================================= */

  function settingsPage() {

    return `
      <div class="ns-card">

        <h2>⚙️ Store Settings</h2>

        <div class="ns-form">

          <div class="ns-field">
            <label>Store Name</label>

            <input
              id="setStore"
              value="${esc(settings.store)}">
          </div>

          <div class="ns-field">
            <label>Phone</label>

            <input
              id="setPhone"
              value="${esc(settings.phone)}">
          </div>

          <div class="ns-field">
            <label>Currency</label>

            <input
              id="setCurrency"
              value="${esc(settings.currency)}">
          </div>

          <div class="ns-field ns-full">
            <label>Address</label>

            <textarea
              id="setAddress">${esc(
                settings.address
              )}</textarea>
          </div>

        </div>

        <div class="ns-actions">

          <button class="ns-btn green"
            onclick="saveSettings()">
            💾 Save Settings
          </button>

        </div>

      </div>

      <div class="ns-card">

        <h2>Backup & Restore</h2>

        <p style="color:#64748b">
          Backup your local store data as JSON.
        </p>

        <div class="ns-actions">

          <button class="ns-btn blue"
            onclick="backupData()">
            ⬇️ Backup Data
          </button>

          <label
            class="ns-btn orange"
            style="display:inline-block">

            ⬆️ Restore Data

            <input
              type="file"
              accept=".json"
              onchange="restoreData(event)"
              style="display:none">

          </label>

        </div>

      </div>

      <div class="ns-card">

        <h2>Danger Zone</h2>

        <button
          class="ns-btn red"
          onclick="clearAllData()">
          🗑️ Clear All Application Data
        </button>

      </div>
    `;
  }

  window.saveSettings = function() {

    settings.store =
      $("setStore").value.trim() ||
      "NAMITA STORE";

    settings.phone =
      $("setPhone").value.trim();

    settings.currency =
      $("setCurrency").value.trim() ||
      "₹";

    settings.address =
      $("setAddress").value.trim();

    saveAll();

    toast("Settings saved.");

    showPage("settings");
  };

  window.backupData = function() {

    const data = {
      products,
      customers,
      suppliers,
      purchases,
      sales,
      payments,
      stockHistory,
      ecommerce,
      settings,
      barcodeSettings,
      exportedAt:nowISO()
    };

    const blob =
      new Blob(
        [JSON.stringify(data,null,2)],
        {type:"application/json"}
      );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      "namita-store-backup-" +
      today() +
      ".json";

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);

    toast("Backup created.");
  };

  window.restoreData = function(event) {

    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = function() {

      try {

        const data =
          JSON.parse(
            reader.result
          );

        if (
          !confirm(
            "Restore backup? Current local data will be replaced."
          )
        ) {
          return;
        }

        products =
          Array.isArray(data.products)
            ? data.products
            : [];

        customers =
          Array.isArray(data.customers)
            ? data.customers
            : [];

        suppliers =
          Array.isArray(data.suppliers)
            ? data.suppliers
            : [];

        purchases =
          Array.isArray(data.purchases)
            ? data.purchases
            : [];

        sales =
          Array.isArray(data.sales)
            ? data.sales
            : [];

        payments =
          Array.isArray(data.payments)
            ? data.payments
            : [];

        stockHistory =
          Array.isArray(data.stockHistory)
            ? data.stockHistory
            : [];

        ecommerce =
          Array.isArray(data.ecommerce)
            ? data.ecommerce
            : [];

        settings =
          data.settings || settings;

        barcodeSettings =
          data.barcodeSettings ||
          barcodeSettings;

        saveAll();

        toast("Backup restored.");

        showPage("dashboard");

      } catch (e) {

        console.error(e);

        toast(
          "Invalid backup file."
        );
      }
    };

    reader.readAsText(file);
  };

  window.clearAllData = function() {

    if (
      !confirm(
        "WARNING: Delete all NAMITA STORE data?"
      )
    ) {
      return;
    }

    if (
      !confirm(
        "This cannot be undone. Continue?"
      )
    ) {
      return;
    }

    Object.values(KEY).forEach(key =>
      localStorage.removeItem(key)
    );

    location.reload();
  };

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const pageRenderers = {

    dashboard:dashboardPage,

    seller:sellerPage,

    sales:salesPage,

    purchase:purchasePage,

    products:productsPage,

    customers:customersPage,

    suppliers:suppliersPage,

    payments:paymentsPage,

    history:historyPage,

    barcode:barcodePage,

    reports:reportsPage,

    ecommerce:ecommercePage,

    settings:settingsPage
  };

  const pageNames = {

    dashboard:"Dashboard",
    seller:"Seller Panel",
    sales:"Sales / POS",
    purchase:"Purchase",
    products:"Products & Stock",
    customers:"Customers",
    suppliers:"Suppliers",
    payments:"Due / Payments",
    history:"Transaction History",
    barcode:"Barcode Settings",
    reports:"Reports",
    ecommerce:"E-Commerce",
    settings:"Settings"
  };

  window.showPage = function(page) {

    currentPage =
      pageRenderers[page]
        ? page
        : "dashboard";

    document
      .querySelectorAll(".ns-nav button")
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.page === currentPage
        );

      });

    $("pageTitle").textContent =
      pageNames[currentPage];

    $("pageContent").innerHTML =
      pageRenderers[currentPage]();

    if (currentPage === "sales") {
      renderProductPicker();
      refreshSaleTotal();
      refreshSaleCustomerInfo();
    }
  };

  /* =======================================================
     BARCODE SCANNER
     ======================================================= */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Enter" ||
        document.activeElement?.id !==
          "posSearch"
      ) {
        return;
      }

      const value =
        document.activeElement.value
          .trim();

      if (!value) return;

      const product =
        products.find(
          p =>
            String(p.barcode) === value ||
            String(p.sku) === value
        );

      if (product) {

        addToCart(product.id);

        document.activeElement.value = "";

        renderProductPicker();

        event.preventDefault();
      }
    }
  );

  /* =======================================================
     SAMPLE PRODUCT
     ======================================================= */

  if (!products.length) {

    products.push({
      id:uid("PRD"),
      name:"Sample Product",
      sku:"NS-001",
      barcode:"890100000001",
      category:"General",
      purchase:100,
      sale:149,
      mrp:160,
      stock:20,
      minStock:5,
      gst:18,
      hsn:"",
      unit:"PCS",
      description:"",
      createdAt:nowISO()
    });

    save(KEY.products,products);
  }

  /* =======================================================
     START APPLICATION
     ======================================================= */

  showPage("dashboard");

})();
