/* =========================================================
   NAMITA STORE — Accounting & Inventory
   COMPLETE CORRECTED APPLICATION
   PART 1 / 3
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

  const money = (value) =>
    "₹" +
    num(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const today = () => new Date().toISOString().slice(0, 10);

  const uid = (prefix) =>
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 8);

  function load(key, fallback = []) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("Load error:", key, error);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Save error:", key, error);
      toast("Could not save data.");
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
    showSku: true
  });

  let cart = [];
  let purchaseDraft = [];

  let currentPage = "dashboard";

  let editingProductId = null;
  let editingCustomerId = null;
  let editingSupplierId = null;

  /* =======================================================
     CSS
     ======================================================= */

  const style = document.createElement("style");

  style.textContent = `
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #f4f7f7;
      color: #172033;
      font-family: Arial, "Noto Sans", sans-serif;
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

    .ns-app {
      display: flex;
      min-height: 100vh;
    }

    .ns-sidebar {
      width: 245px;
      background: linear-gradient(180deg, #0f766e, #115e59);
      color: #fff;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      overflow-y: auto;
      padding: 18px 12px;
      z-index: 50;
    }

    .ns-logo {
      text-align: center;
      padding: 8px 4px 20px;
      border-bottom: 1px solid rgba(255,255,255,.18);
      margin-bottom: 15px;
    }

    .ns-logo h2 {
      margin: 0;
      font-size: 21px;
    }

    .ns-logo small {
      opacity: .75;
    }

    .ns-nav button {
      width: 100%;
      border: 0;
      color: #fff;
      background: transparent;
      padding: 12px 13px;
      margin: 3px 0;
      border-radius: 10px;
      text-align: left;
    }

    .ns-nav button:hover {
      background: rgba(255,255,255,.12);
    }

    .ns-nav button.active {
      background: #fff;
      color: #115e59;
      font-weight: bold;
    }

    .ns-main {
      margin-left: 245px;
      width: calc(100% - 245px);
      min-height: 100vh;
    }

    .ns-top {
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      padding: 14px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 20;
    }

    .ns-top h1 {
      font-size: 20px;
      margin: 0;
    }

    .ns-content {
      padding: 22px;
    }

    .ns-card {
      background: #fff;
      border: 1px solid #e4e9e9;
      border-radius: 15px;
      padding: 18px;
      margin-bottom: 18px;
      box-shadow: 0 4px 18px rgba(15,118,110,.05);
    }

    .ns-card h2,
    .ns-card h3 {
      margin-top: 0;
    }

    .ns-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }

    .ns-stat {
      background: #fff;
      border: 1px solid #e4e9e9;
      border-radius: 15px;
      padding: 18px;
    }

    .ns-stat small {
      color: #64748b;
    }

    .ns-stat strong {
      display: block;
      font-size: 25px;
      margin-top: 7px;
    }

    .ns-form {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
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
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #fff;
    }

    .ns-field textarea {
      min-height: 75px;
      resize: vertical;
    }

    .ns-full {
      grid-column: 1 / -1;
    }

    .ns-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 15px;
    }

    .ns-btn {
      border: 0;
      border-radius: 8px;
      padding: 10px 14px;
      background: #0f766e;
      color: #fff;
      font-weight: bold;
    }

    .ns-btn:hover {
      opacity: .9;
    }

    .ns-btn.secondary {
      background: #475569;
    }

    .ns-btn.green {
      background: #15803d;
    }

    .ns-btn.red {
      background: #dc2626;
    }

    .ns-btn.orange {
      background: #ea580c;
    }

    .ns-btn.blue {
      background: #2563eb;
    }

    .ns-btn.light {
      background: #e2e8f0;
      color: #172033;
    }

    .ns-table-wrap {
      overflow: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 700px;
    }

    th,
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      vertical-align: middle;
    }

    th {
      background: #f8fafc;
      font-size: 13px;
    }

    .ns-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 20px;
      font-size: 12px;
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

    .ns-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      align-items: center;
      margin-bottom: 15px;
    }

    .ns-toolbar input,
    .ns-toolbar select {
      padding: 9px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }

    .ns-empty {
      padding: 30px;
      text-align: center;
      color: #64748b;
    }

    .ns-modal {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,.58);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 15px;
    }

    .ns-modal.show {
      display: flex;
    }

    .ns-modal-box {
      background: #fff;
      width: min(900px, 100%);
      max-height: 92vh;
      overflow: auto;
      border-radius: 15px;
      padding: 20px;
    }

    .ns-modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .ns-close {
      border: 0;
      background: #fee2e2;
      color: #991b1b;
      width: 35px;
      height: 35px;
      border-radius: 50%;
      font-size: 18px;
    }

    .ns-sale-layout {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 18px;
    }

    .ns-product-picker {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 12px;
    }

    .ns-product-mini {
      border: 1px solid #dbe4e4;
      background: #fff;
      border-radius: 10px;
      padding: 12px;
      text-align: left;
    }

    .ns-product-mini:hover {
      border-color: #0f766e;
    }

    .ns-cart-row {
      display: grid;
      grid-template-columns: 1fr 80px 100px 35px;
      gap: 7px;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .ns-total-box {
      background: #f8fafc;
      border-radius: 10px;
      padding: 14px;
      margin-top: 12px;
    }

    .ns-total-line {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }

    .ns-total-line.big {
      font-size: 20px;
      font-weight: bold;
      border-top: 1px solid #cbd5e1;
      margin-top: 6px;
      padding-top: 10px;
    }

    .ns-shortcuts {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .ns-shortcut {
      border: 1px solid #e2e8f0;
      background: #fff;
      border-radius: 12px;
      padding: 18px;
      text-align: left;
      font-weight: bold;
    }

    .ns-shortcut:hover {
      border-color: #0f766e;
    }

    .ns-barcode-stage {
      background: #e5e7eb;
      min-height: 380px;
      padding: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: auto;
    }

    .ns-sticker {
      background: #fff;
      border: 1px solid #111;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 7px;
      color: #111;
    }

    .ns-sticker.s25x50 {
      width: 50mm;
      min-height: 25mm;
    }

    .ns-sticker.s25x50.one {
      min-height: 25mm;
    }

    .ns-sticker.s15x25 {
      width: 25mm;
      min-height: 15mm;
      font-size: 8px;
    }

    .ns-sticker svg {
      max-width: 90%;
      height: auto;
    }

    .ns-mobile-menu {
      display: none;
    }

    @media (max-width: 1050px) {
      .ns-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .ns-form {
        grid-template-columns: repeat(2, 1fr);
      }

      .ns-sale-layout {
        grid-template-columns: 1fr;
      }

      .ns-product-picker {
        grid-template-columns: repeat(2, 1fr);
      }

      .ns-shortcuts {
        grid-template-columns: repeat(2, 1fr);
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
        display: inline-block;
      }

      .ns-grid,
      .ns-form {
        grid-template-columns: 1fr;
      }

      .ns-shortcuts {
        grid-template-columns: 1fr;
      }

      .ns-content {
        padding: 12px;
      }

      .ns-top {
        padding: 12px;
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
            >
              ☰
            </button>

            <span style="margin-left:8px">
              <strong id="pageTitle">Dashboard</strong>
            </span>

          </div>

          <div>
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
            onclick="closeModal()"
          >
            ×
          </button>

        </div>

        <div id="modalBody"></div>

      </div>

    </div>
  `;

  $("topDate").textContent =
    new Date().toLocaleDateString("en-IN");

  /* =======================================================
     NAVIGATION
     ======================================================= */

  document
    .querySelectorAll(".ns-nav button")
    .forEach((button) => {

      button.addEventListener("click", () => {

        showPage(button.dataset.page);

        $("nsSidebar").classList.remove("open");

      });

    });

  $("mobileMenu").onclick = () => {
    $("nsSidebar").classList.toggle("open");
  };

  /* =======================================================
     DASHBOARD
     ======================================================= */

  function dashboardPage() {

    const stockValue = products.reduce(
      (total, product) =>
        total +
        num(product.stock) *
        num(product.purchase),
      0
    );

    const salesTotal = sales.reduce(
      (total, sale) =>
        total + num(sale.total),
      0
    );

    const purchaseTotal = purchases.reduce(
      (total, purchase) =>
        total + num(purchase.total),
      0
    );

    const customerDue = customers.reduce(
      (total, customer) =>
        total + num(customer.due),
      0
    );

    const supplierDue = suppliers.reduce(
      (total, supplier) =>
        total + num(supplier.due),
      0
    );

    return `
      <div class="ns-grid">

        <div class="ns-stat">
          <small>Total Products</small>
          <strong>${products.length}</strong>
        </div>

        <div class="ns-stat">
          <small>Stock Value</small>
          <strong>${money(stockValue)}</strong>
        </div>

        <div class="ns-stat">
          <small>Total Sales</small>
          <strong>${money(salesTotal)}</strong>
        </div>

        <div class="ns-stat">
          <small>Total Purchase</small>
          <strong>${money(purchaseTotal)}</strong>
        </div>

        <div class="ns-stat">
          <small>Customer Due</small>
          <strong>${money(customerDue)}</strong>
        </div>

        <div class="ns-stat">
          <small>Supplier Due</small>
          <strong>${money(supplierDue)}</strong>
        </div>

        <div class="ns-stat">
          <small>Customers</small>
          <strong>${customers.length}</strong>
        </div>

        <div class="ns-stat">
          <small>Suppliers</small>
          <strong>${suppliers.length}</strong>
        </div>

      </div>

      <div class="ns-card">

        <h2>Quick Actions</h2>

        <div class="ns-shortcuts">

          <button
            class="ns-shortcut"
            onclick="showPage('sales')"
          >
            🛒 New Sale
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
            ＋ Add Product
          </button>

          <button
            class="ns-shortcut"
            onclick="openCustomerModal()"
          >
            ＋ Add Customer
          </button>

          <button
            class="ns-shortcut"
            onclick="openSupplierModal()"
          >
            ＋ Add Supplier
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
            🏷️ Print Barcode
          </button>

          <button
            class="ns-shortcut"
            onclick="showPage('reports')"
          >
            📊 View Reports
          </button>

        </div>

      </div>

      <div class="ns-card">

        <h2>Low Stock</h2>

        ${lowStockTable()}

      </div>
    `;
  }

  function lowStockTable() {

    const rows = products.filter(
      (product) =>
        num(product.stock) <=
        num(product.minStock)
    );

    if (!rows.length) {
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

            ${rows
              .map(
                (product) => `
                  <tr>

                    <td>
                      ${esc(product.name)}
                    </td>

                    <td>
                      ${esc(product.sku)}
                    </td>

                    <td>
                      ${num(product.stock)}
                    </td>

                    <td>
                      ${num(product.minStock)}
                    </td>

                    <td>
                      <span class="ns-badge red">
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

    const due = customers.reduce(
      (total, customer) =>
        total + num(customer.due),
      0
    );

    const todaySales = sales
      .filter((sale) => sale.date === today())
      .reduce(
        (total, sale) =>
          total + num(sale.total),
        0
      );

    return `
      <div class="ns-card">

        <h2>Seller Panel</h2>

        <p style="color:#64748b">
          Fast billing, customer due,
          payments and sales management.
        </p>

        <div class="ns-grid">

          <div class="ns-stat">
            <small>Customers</small>
            <strong>${customers.length}</strong>
          </div>

          <div class="ns-stat">
            <small>Customer Due</small>
            <strong>${money(due)}</strong>
          </div>

          <div class="ns-stat">
            <small>Today's Sales</small>
            <strong>${money(todaySales)}</strong>
          </div>

          <div class="ns-stat">
            <small>Today's Profit</small>
            <strong>${money(todayProfit())}</strong>
          </div>

        </div>

      </div>

      <div class="ns-card">

        <h3>Quick Seller Actions</h3>

        <div class="ns-shortcuts">

          <button
            class="ns-shortcut"
            onclick="showPage('sales')"
          >
            🛒 New Sale / POS
          </button>

          <button
            class="ns-shortcut"
            onclick="showPage('payments')"
          >
            💰 Customer Payment
          </button>

          <button
            class="ns-shortcut"
            onclick="openCustomerModal()"
          >
            👤 Add Customer
          </button>

          <button
            class="ns-shortcut"
            onclick="showPage('history')"
          >
            📋 Transaction History
          </button>

        </div>

      </div>

      <div class="ns-card">

        <h3>Recent Sales</h3>

        ${salesTable(
          sales
            .slice()
            .reverse()
            .slice(0, 10)
        )}

      </div>
    `;
  }

  function todayProfit() {

    return sales
      .filter((sale) => sale.date === today())
      .reduce(
        (total, sale) =>
          total + num(sale.profit),
        0
      );
  }

  /* =======================================================
     SALES / POS
     ======================================================= */

  function salesPage() {

    const subtotal = cart.reduce(
      (total, item) =>
        total +
        num(item.qty) *
        num(item.price),
      0
    );

    return `
      <div class="ns-sale-layout">

        <div>

          <div class="ns-card">

            <h2>New Sale / POS</h2>

            <div class="ns-form">

              <div class="ns-field ns-full">

                <label>
                  Search Product / SKU / Barcode
                </label>

                <input
                  id="posSearch"
                  placeholder="Scan barcode or type product name..."
                  oninput="renderProductPicker()"
                >

              </div>

              <div class="ns-field">

                <label>Customer</label>

                <select id="saleCustomer">

                  <option value="">
                    Walk-in Customer
                  </option>

                  ${customers
                    .map(
                      (customer) => `
                        <option value="${esc(customer.id)}">
                          ${esc(customer.name)}
                          ${
                            num(customer.due) > 0
                              ? " — Due " +
                                money(customer.due)
                              : ""
                          }
                        </option>
                      `
                    )
                    .join("")}

                </select>

              </div>

              <div class="ns-field">

                <label>Payment Method</label>

                <select id="salePayment">

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
                  oninput="refreshSaleTotal()"
                >

              </div>

              <div class="ns-field">

                <label>Notes</label>

                <input
                  id="saleNotes"
                  placeholder="Optional note"
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
                subtotal
              )}
            </div>

            <div class="ns-actions">

              <button
                class="ns-btn green"
                onclick="completeSale()"
              >
                Complete Sale
              </button>

              <button
                class="ns-btn light"
                onclick="clearCart()"
              >
                Clear Cart
              </button>

            </div>

          </div>

        </div>

      </div>
    `;
  }

  function productPickerHTML() {

    const query = (
      $("posSearch")?.value || ""
    )
      .toLowerCase()
      .trim();

    const list = products
      .filter((product) => {

        const text = [
          product.name,
          product.sku,
          product.barcode,
          product.category
        ]
          .join(" ")
          .toLowerCase();

        return !query || text.includes(query);
      })
      .slice(0, 30);

    if (!list.length) {

      return `
        <div class="ns-empty">
          No products found.
        </div>
      `;
    }

    return list
      .map(
        (product) => `
          <button
            class="ns-product-mini"
            onclick="addToCart('${esc(product.id)}')"
          >

            <strong>
              ${esc(product.name)}
            </strong>

            <br>

            <small>
              ${esc(product.sku || "")}
            </small>

            <br>

            <small>
              Stock: ${num(product.stock)}
            </small>

            <br>

            <strong>
              ${money(product.sale)}
            </strong>

          </button>
        `
      )
      .join("");
  }

  function cartHTML() {

    if (!cart.length) {

      return `
        <div class="ns-empty">
          Cart is empty.
        </div>
      `;
    }

    return cart
      .map((item) => {

        const product = products.find(
          (p) =>
            String(p.id) ===
            String(item.productId)
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
                ${money(item.price)}
              </small>

            </div>

            <input
              type="number"
              min="1"
              max="${num(product.stock)}"
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
              class="ns-btn red"
              style="padding:6px"
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

      </div>
    `;
  }

  window.renderProductPicker = function () {

    const element = $("productPicker");

    if (element) {
      element.innerHTML =
        productPickerHTML();
    }
  };

  window.addToCart = function (id) {

    const product = products.find(
      (p) =>
        String(p.id) ===
        String(id)
    );

    if (!product) {
      return;
    }

    const existing = cart.find(
      (item) =>
        String(item.productId) ===
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

      existing.qty =
        num(existing.qty) + 1;

    } else {

      if (num(product.stock) <= 0) {

        toast(
          "Product is out of stock."
        );

        return;
      }

      cart.push({
        productId: product.id,
        qty: 1,
        price: num(product.sale)
      });
    }

    renderSalesParts();
  };

  window.changeCartQty = function (
    id,
    value
  ) {

    const item = cart.find(
      (x) =>
        String(x.productId) ===
        String(id)
    );

    const product = products.find(
      (x) =>
        String(x.id) ===
        String(id)
    );

    if (!item || !product) {
      return;
    }

    let quantity =
      Math.max(
        1,
        Math.floor(num(value))
      );

    quantity = Math.min(
      quantity,
      num(product.stock)
    );

    if (quantity <= 0) {
      cart = cart.filter(
        (x) =>
          String(x.productId) !==
          String(id)
      );
    } else {
      item.qty = quantity;
    }

    renderSalesParts();
  };

  window.removeFromCart = function (id) {

    cart = cart.filter(
      (item) =>
        String(item.productId) !==
        String(id)
    );

    renderSalesParts();
  };

  window.clearCart = function () {

    cart = [];

    renderSalesParts();
  };

  window.refreshSaleTotal = function () {

    const subtotal = cart.reduce(
      (total, item) =>
        total +
        num(item.qty) *
        num(item.price),
      0
    );

    const discount = num(
      $("saleDiscount")?.value
    );

    const finalTotal = Math.max(
      0,
      subtotal - discount
    );

    const summary = $("saleSummary");

    if (summary) {

      summary.innerHTML =
        saleSummaryHTML(
          subtotal,
          discount,
          finalTotal
        );
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
  }

  window.completeSale = function () {

    if (!cart.length) {

      toast("Cart is empty.");

      return;
    }

    const customerId =
      $("saleCustomer")?.value || "";

    const payment =
      $("salePayment")?.value ||
      "Cash";

    const discount = num(
      $("saleDiscount")?.value
    );

    const notes =
      $("saleNotes")?.value || "";

    const subtotal = cart.reduce(
      (total, item) =>
        total +
        num(item.qty) *
        num(item.price),
      0
    );

    const total = Math.max(
      0,
      subtotal - discount
    );

    let paid = total;

    if (payment === "Credit") {
      paid = 0;
    }

    const due = Math.max(
      0,
      total - paid
    );

    const customer =
      customers.find(
        (c) =>
          String(c.id) ===
          String(customerId)
      );

    const saleItems = [];

    for (const cartItem of cart) {

      const product =
        products.find(
          (p) =>
            String(p.id) ===
            String(cartItem.productId)
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

        productId: product.id,

        product: product.name,

        sku: product.sku,

        qty: num(cartItem.qty),

        price: num(cartItem.price),

        purchase: num(product.purchase),

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

    saleItems.forEach((item) => {

      const product =
        products.find(
          (p) =>
            String(p.id) ===
            String(item.productId)
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

        id: uid("ST"),

        date: today(),

        type: "Sale",

        productId: product.id,

        product: product.name,

        qty: -num(item.qty),

        balance: num(product.stock),

        reference: "Sale"

      });
    });

    const sale = {

      id: uid("SAL"),

      date: today(),

      customerId:
        customer?.id || "",

      customer:
        customer?.name ||
        "Walk-in Customer",

      payment,

      items: saleItems,

      subtotal,

      discount,

      total,

      paid,

      due,

      profit:
        saleItems.reduce(
          (sum, item) =>
            sum + num(item.profit),
          0
        ) - discount,

      notes

    };

    sales.push(sale);

    if (customer && due > 0) {

      customer.due =
        num(customer.due) +
        due;
    }

    saveAll();

    cart = [];

    toast(
      "Sale completed successfully."
    );

    showPage("sales");
  };

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
              <th>Due</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${list
              .map(
                (sale) => `
                  <tr>

                    <td>
                      ${esc(sale.date)}
                    </td>

                    <td>
                      ${esc(sale.id)}
                    </td>

                    <td>
                      ${esc(sale.customer)}
                    </td>

                    <td>
                      ${esc(sale.payment)}
                    </td>

                    <td>
                      ${money(sale.total)}
                    </td>

                    <td>
                      ${money(sale.due)}
                    </td>

                    <td>

                      <button
                        class="ns-btn light"
                        onclick="
                          viewSale('${esc(sale.id)}')
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

  window.viewSale = function (id) {

    const sale = sales.find(
      (item) =>
        String(item.id) ===
        String(id)
    );

    if (!sale) {
      return;
    }

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

        <p>
          <strong>Subtotal:</strong>
          ${money(sale.subtotal)}
        </p>

        <p>
          <strong>Discount:</strong>
          ${money(sale.discount)}
        </p>

        <p>
          <strong>Total:</strong>
          <strong>${money(sale.total)}</strong>
        </p>

        <p>
          <strong>Paid:</strong>
          ${money(sale.paid)}
        </p>

        <p>
          <strong>Due:</strong>
          ${money(sale.due)}
        </p>

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

              ${sale.items
                .map(
                  (item) => `
                    <tr>

                      <td>
                        ${esc(item.product)}
                      </td>

                      <td>
                        ${num(item.qty)}
                      </td>

                      <td>
                        ${money(item.price)}
                      </td>

                      <td>
                        ${money(item.total)}
                      </td>

                    </tr>
                  `
                )
                .join("")}

            </tbody>

          </table>

        </div>
      `
    );
  };

  /* =======================================================
     MODAL
     ======================================================= */

  function openModal(title, html) {

    $("modalTitle").textContent =
      title;

    $("modalBody").innerHTML =
      html;

    $("nsModal").classList.add(
      "show"
    );
  }

  window.closeModal = function () {

    $("nsModal").classList.remove(
      "show"
    );
  };

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

    element.id = "nsToast";

    element.style.cssText = `
      position:fixed;
      right:18px;
      bottom:18px;
      background:#0f766e;
      color:#fff;
      padding:12px 18px;
      border-radius:10px;
      z-index:9999;
      box-shadow:0 8px 25px rgba(0,0,0,.2);
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

    }, 2500);
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

  /* =======================================================
     NAVIGATION — FINAL
     ======================================================= */

  const pageRenderers = {

    dashboard: dashboardPage,

    seller: sellerPage,

    sales: salesPage

  };

  const pageAfterRender = {

    sales() {
      renderProductPicker();
      refreshSaleTotal();
    }

  };

  window.showPage = function (page) {

    currentPage = page;

    document
      .querySelectorAll(
        ".ns-nav button"
      )
      .forEach((button) => {

        button.classList.toggle(
          "active",
          button.dataset.page ===
            page
        );

      });

    const names = {

      dashboard:
        "Dashboard",

      seller:
        "Seller Panel",

      sales:
        "Sales / POS",

      purchase:
        "Purchase",

      products:
        "Products & Stock",

      customers:
        "Customers",

      suppliers:
        "Suppliers",

      payments:
        "Due / Payments",

      history:
        "Transaction History",

      barcode:
        "Barcode Settings",

      reports:
        "Reports",

      ecommerce:
        "E-Commerce",

      settings:
        "Settings"

    };

    $("pageTitle").textContent =
      names[page] ||
      "Dashboard";

    const renderer =
      pageRenderers[page] ||
      pageRenderers.dashboard;

    $("pageContent").innerHTML =
      renderer();

    if (
      pageAfterRender[page]
    ) {
      pageAfterRender[page]();
    }
  };

  /* =======================================================
     BARCODE SCANNER — BASIC
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
        document.activeElement.value
          .trim();

      if (!value) {
        return;
      }

      const product =
        products.find(
          (item) =>
            String(item.barcode) ===
              value ||
            String(item.sku) ===
              value
        );

      if (product) {

        addToCart(
          product.id
        );

        document.activeElement.value =
          "";

        renderProductPicker();

        event.preventDefault();
      }
    }
  );

  /* =======================================================
     SAMPLE DATA
     ======================================================= */

  if (!products.length) {

    products = [

      {
        id: uid("PRD"),

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
          new Date().toISOString()
      }

    ];

    save(
      KEY.products,
      products
    );
  }

  /* =======================================================
     START
     ======================================================= */

  showPage("dashboard");

})();
