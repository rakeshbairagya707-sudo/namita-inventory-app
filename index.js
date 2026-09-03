(function () {
  "use strict";

  const $ = (s, p = document) => p.querySelector(s);
  const money = n => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const id = p => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
  const load = (k, d = []) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
  const save = () => {
    localStorage.setItem("ns_products", JSON.stringify(products));
    localStorage.setItem("ns_customers", JSON.stringify(customers));
    localStorage.setItem("ns_suppliers", JSON.stringify(suppliers));
    localStorage.setItem("ns_sales", JSON.stringify(sales));
    localStorage.setItem("ns_purchases", JSON.stringify(purchases));
    localStorage.setItem("ns_payments", JSON.stringify(payments));
  };

  let products = load("ns_products");
  let customers = load("ns_customers");
  let suppliers = load("ns_suppliers");
  let sales = load("ns_sales");
  let purchases = load("ns_purchases");
  let payments = load("ns_payments");
  let cart = [];
  let currentPage = "dashboard";

  const names = {
    dashboard: "Dashboard", sales: "Sales / POS", purchase: "Purchase",
    products: "Products & Stock", customers: "Customers", suppliers: "Suppliers",
    payments: "Due / Payments", reports: "Reports", settings: "Settings"
  };

  const nav = Object.entries(names).map(([p, n]) =>
    `<button class="nav-btn" data-page="${p}">${n}</button>`).join("");

  document.querySelector("#app").innerHTML = `
    <div class="ns-app">
      <aside class="ns-sidebar" id="sidebar">
        <div class="ns-logo"><h2>NAMITA STORE</h2><small>Accounting & Inventory</small></div>
        <nav class="ns-nav">${nav}</nav>
      </aside>
      <main class="ns-main">
        <header class="ns-top">
          <button class="ns-btn light" data-action="menu">☰</button>
          <strong id="pageTitle"></strong>
          <span>${new Date().toLocaleDateString("en-IN")}</span>
        </header>
        <section class="ns-content" id="content"></section>
      </main>
    </div>
    <div class="ns-modal" id="modal">
      <div class="ns-modal-box">
        <div class="ns-modal-head"><h2 id="modalTitle"></h2>
          <button class="ns-close" data-action="close">×</button>
        </div>
        <div id="modalBody"></div>
      </div>
    </div>
  `;

  function toast(message) {
    const old = $("#nsToast");
    if (old) old.remove();
    const el = document.createElement("div");
    el.id = "nsToast";
    el.textContent = message;
    el.style.cssText = "position:fixed;right:18px;bottom:18px;background:#0f766e;color:#fff;padding:13px 18px;border-radius:9px;z-index:9999;font-weight:bold";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  function modal(title, html) {
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = html;
    $("#modal").classList.add("show");
  }

  function closeModal() {
    $("#modal").classList.remove("show");
  }

  function field(name, label, type = "text", value = "") {
    return `<div class="ns-field"><label>${label}</label>
      <input name="${name}" type="${type}" value="${esc(value)}" required></div>`;
  }

  function stat(label, value) {
    return `<div class="ns-stat"><small>${label}</small><strong>${value}</strong></div>`;
  }

  function table(headers, rows) {
    if (!rows.length) return `<div class="ns-empty">কোনো তথ্য পাওয়া যায়নি।</div>`;
    return `<div class="ns-table-wrap"><table><thead><tr>
      ${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>
      ${rows.join("")}</tbody></table></div>`;
  }

  function dashboard() {
    const totalSales = sales.reduce((a, x) => a + Number(x.total), 0);
    const totalPurchase = purchases.reduce((a, x) => a + Number(x.total), 0);
    const profit = sales.reduce((a, x) => a + Number(x.profit), 0);
    const stockValue = products.reduce((a, x) => a + Number(x.stock) * Number(x.purchase), 0);
    const due = customers.reduce((a, x) => a + Number(x.due || 0), 0);

    return `<div class="ns-grid">
      ${stat("মোট বিক্রয়", money(totalSales))}
      ${stat("মোট ক্রয়", money(totalPurchase))}
      ${stat("মোট লাভ", money(profit))}
      ${stat("Customer Due", money(due))}
      ${stat("Stock Value", money(stockValue))}
      ${stat("মোট পণ্য", products.length)}
      ${stat("মোট Customer", customers.length)}
      ${stat("মোট Supplier", suppliers.length)}
    </div>
    <div class="ns-card"><h2>Quick Actions</h2><div class="ns-shortcuts">
      <button class="ns-shortcut" data-page="sales">🧾 New Sale</button>
      <button class="ns-shortcut" data-action="add-product">📦 Add Product</button>
      <button class="ns-shortcut" data-action="add-customer">👤 Add Customer</button>
      <button class="ns-shortcut" data-page="purchase">📥 New Purchase</button>
    </div></div>
    <div class="ns-card"><h2>Low Stock Alert</h2>
      ${table(["Product", "SKU", "Stock", "Minimum"], products
        .filter(p => Number(p.stock) <= Number(p.minStock))
        .map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.sku)}</td>
        <td>${p.stock}</td><td>${p.minStock}</td></tr>`))}
    </div>`;
  }

  function productsPage() {
    return `<div class="ns-card"><div class="ns-toolbar">
      <h2 style="margin-right:auto">Products & Stock</h2>
      <button class="ns-btn" data-action="add-product">+ Add Product</button>
    </div>${table(
      ["Name", "SKU", "Purchase", "Sale", "Stock", "Action"],
      products.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.sku)}</td>
        <td>${money(p.purchase)}</td><td>${money(p.sale)}</td><td>${p.stock}</td>
        <td><button class="ns-btn blue" data-action="edit-product" data-id="${p.id}">Edit</button>
        <button class="ns-btn red" data-action="delete-product" data-id="${p.id}">Delete</button></td></tr>`)
    )}</div>`;
  }

  function productModal(product = {}) {
    modal(product.id ? "Edit Product" : "Add Product", `<form id="productForm" class="ns-form">
      <input type="hidden" name="id" value="${esc(product.id || "")}">
      ${field("name", "Product Name", "text", product.name)}
      ${field("sku", "SKU / Code", "text", product.sku)}
      ${field("barcode", "Barcode", "text", product.barcode)}
      ${field("category", "Category", "text", product.category)}
      ${field("purchase", "Purchase Price", "number", product.purchase)}
      ${field("sale", "Sale Price", "number", product.sale)}
      ${field("stock", "Stock", "number", product.stock)}
      ${field("minStock", "Minimum Stock", "number", product.minStock || 5)}
      <div class="ns-actions ns-full"><button class="ns-btn green">Save Product</button></div>
    </form>`);
  }

  function customersPage() {
    return `<div class="ns-card"><div class="ns-toolbar">
      <h2 style="margin-right:auto">Customers</h2>
      <button class="ns-btn" data-action="add-customer">+ Add Customer</button>
    </div>${table(["Name", "Mobile", "Address", "Due", "Action"], customers.map(c =>
      `<tr><td>${esc(c.name)}</td><td>${esc(c.phone)}</td><td>${esc(c.address)}</td>
      <td>${money(c.due)}</td><td><button class="ns-btn red" data-action="delete-customer" data-id="${c.id}">Delete</button></td></tr>`))}</div>`;
  }

  function customerModal() {
    modal("Add Customer", `<form id="customerForm" class="ns-form">
      ${field("name", "Customer Name")}
      ${field("phone", "Mobile")}
      ${field("address", "Address")}
      <div class="ns-actions ns-full"><button class="ns-btn green">Save Customer</button></div>
    </form>`);
  }

  function suppliersPage() {
    return `<div class="ns-card"><div class="ns-toolbar">
      <h2 style="margin-right:auto">Suppliers</h2>
      <button class="ns-btn" data-action="add-supplier">+ Add Supplier</button>
    </div>${table(["Name", "Mobile", "Address", "Due", "Action"], suppliers.map(s =>
      `<tr><td>${esc(s.name)}</td><td>${esc(s.phone)}</td><td>${esc(s.address)}</td>
      <td>${money(s.due)}</td><td><button class="ns-btn red" data-action="delete-supplier" data-id="${s.id}">Delete</button></td></tr>`))}</div>`;
  }

  function supplierModal() {
    modal("Add Supplier", `<form id="supplierForm" class="ns-form">
      ${field("name", "Supplier Name")}
      ${field("phone", "Mobile")}
      ${field("address", "Address")}
      <div class="ns-actions ns-full"><button class="ns-btn green">Save Supplier</button></div>
    </form>`);
  }

  function salesPage() {
    return `<div class="ns-sale-layout"><div>
      <div class="ns-card"><h2>Sales / POS</h2>
        <input id="posSearch" class="ns-field-input" placeholder="Product name, SKU বা barcode search করুন">
        <div id="picker" class="ns-product-picker"></div>
      </div>
      <div class="ns-card"><h3>Cart</h3><div id="cart"></div></div>
    </div><div class="ns-card"><h3>Sale Summary</h3>
      <select id="saleCustomer" class="ns-field-input"><option value="">Walk-in Customer</option>
      ${customers.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select>
      <select id="salePayment" class="ns-field-input"><option>Cash</option><option>UPI</option>
      <option>Card</option><option>Bank Transfer</option><option>Credit</option></select>
      <input id="discount" class="ns-field-input" type="number" value="0" placeholder="Discount">
      <div id="summary"></div><button class="ns-btn green" data-action="complete-sale">Complete Sale</button>
      <button class="ns-btn light" data-action="clear-cart">Clear Cart</button>
    </div></div>`;
  }

  function renderPOS() {
    const q = ($("#posSearch")?.value || "").toLowerCase();
    $("#picker").innerHTML = products.filter(p =>
      `${p.name} ${p.sku} ${p.barcode || ""}`.toLowerCase().includes(q)
    ).map(p => `<button class="ns-product-mini" data-action="add-cart" data-id="${p.id}">
      <b>${esc(p.name)}</b><br><small>SKU: ${esc(p.sku)} | Stock: ${p.stock}</small><br><strong>${money(p.sale)}</strong>
    </button>`).join("") || `<div class="ns-empty">Product পাওয়া যায়নি।</div>`;
    renderCart();
  }

  function renderCart() {
    if (!$("#cart")) return;
    const subtotal = cart.reduce((a, x) => a + x.qty * x.price, 0);
    const discount = Number($("#discount")?.value || 0);
    $("#cart").innerHTML = cart.length ? cart.map(x => `<div class="ns-cart-row">
      <span><b>${esc(x.name)}</b><br>${money(x.price)}</span>
      <input type="number" min="1" max="${x.stock}" value="${x.qty}" data-qty="${x.id}">
      <b>${money(x.qty * x.price)}</b>
      <button class="ns-btn red" data-action="remove-cart" data-id="${x.id}">×</button>
    </div>`).join("") : `<div class="ns-empty">Cart খালি।</div>`;
    $("#summary").innerHTML = `<div class="ns-total-box">
      <div class="ns-total-line"><span>Subtotal</span><b>${money(subtotal)}</b></div>
      <div class="ns-total-line"><span>Discount</span><b>${money(discount)}</b></div>
      <div class="ns-total-line big"><span>Total</span><b>${money(Math.max(0, subtotal - discount))}</b></div>
    </div>`;
  }

  function purchasePage() {
    return `<div class="ns-card"><h2>Purchase Entry</h2>
      <form id="purchaseForm" class="ns-form">
        <div class="ns-field"><label>Product</label><select name="product" required>
        ${products.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></div>
        ${field("qty", "Quantity", "number")}
        ${field("price", "Purchase Price", "number")}
        <div class="ns-actions ns-full"><button class="ns-btn green">Save Purchase</button></div>
      </form>
    </div><div class="ns-card">${table(["Date", "Product", "Qty", "Total"],
      purchases.map(p => `<tr><td>${p.date}</td><td>${esc(p.name)}</td><td>${p.qty}</td><td>${money(p.total)}</td></tr>`))}</div>`;
  }

  function paymentsPage() {
    return `<div class="ns-card"><h2>Customer Payment</h2>
      <form id="paymentForm" class="ns-form">
      <div class="ns-field"><label>Customer</label><select name="customer" required>
      ${customers.map(c => `<option value="${c.id}">${esc(c.name)} — ${money(c.due)}</option>`).join("")}</select></div>
      ${field("amount", "Amount", "number")}
      <div class="ns-actions ns-full"><button class="ns-btn green">Receive Payment</button></div>
      </form></div>`;
  }

  function reportsPage() {
    return `<div class="ns-grid">${stat("Total Sales", money(sales.reduce((a, x) => a + x.total, 0)))}
      ${stat("Total Profit", money(sales.reduce((a, x) => a + x.profit, 0)))}
      ${stat("Invoices", sales.length)}${stat("Purchases", purchases.length)}</div>
      <div class="ns-card"><h2>Sales Report</h2>${table(["Invoice", "Date", "Customer", "Payment", "Total"],
      sales.map(s => `<tr><td>${s.id}</td><td>${s.date}</td><td>${esc(s.customer)}</td><td>${s.payment}</td><td>${money(s.total)}</td></tr>`))}</div>`;
  }

  function settingsPage() {
    return `<div class="ns-card"><h2>Settings</h2><form id="settingsForm" class="ns-form">
      ${field("store", "Business Name", "text", localStorage.getItem("ns_store") || "NAMITA STORE")}
      ${field("phone", "Mobile", "text", localStorage.getItem("ns_phone") || "")}
      <div class="ns-actions ns-full"><button class="ns-btn green">Save Settings</button>
      <button type="button" class="ns-btn red" data-action="reset">Reset All Data</button></div>
    </form></div>`;
  }

  function render() {
    $("#pageTitle").textContent = names[currentPage];
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === currentPage));
    $("#content").innerHTML = {
      dashboard, sales: salesPage, purchase: purchasePage, products: productsPage,
      customers: customersPage, suppliers: suppliersPage, payments: paymentsPage,
      reports: reportsPage, settings: settingsPage
    }[currentPage]();
    if (currentPage === "sales") renderPOS();
  }

  function completeSale() {
    if (!cart.length) return toast("Cart খালি।");
    const discount = Number($("#discount").value || 0);
    const subtotal = cart.reduce((a, x) => a + x.qty * x.price, 0);
    const total = Math.max(0, subtotal - discount);
    const customer = customers.find(c => c.id === $("#saleCustomer").value);
    const payment = $("#salePayment").value;

    for (const item of cart) {
      const p = products.find(x => x.id === item.id);
      if (!p || Number(p.stock) < item.qty) return toast(`${item.name} এর stock কম।`);
    }

    cart.forEach(item => products.find(p => p.id === item.id).stock -= item.qty);
    if (customer && payment === "Credit") customer.due = Number(customer.due || 0) + total;

    sales.push({
      id: id("SAL"), date: new Date().toISOString().slice(0, 10),
      customer: customer?.name || "Walk-in Customer", payment, subtotal, discount, total,
      profit: cart.reduce((a, x) => {
        const p = products.find(y => y.id === x.id);
        return a + (x.price - Number(p.purchase)) * x.qty;
      }, 0) - discount, items: cart
    });

    cart = [];
    save();
    toast("বিক্রয় সফল হয়েছে।");
    currentPage = "dashboard";
    render();
  }

  document.addEventListener("click", e => {
    const pageButton = e.target.closest("[data-page]");
    if (pageButton) {
      currentPage = pageButton.dataset.page;
      $("#sidebar").classList.remove("open");
      render();
      return;
    }

    const a = e.target.closest("[data-action]");
    if (!a) return;
    const action = a.dataset.action;

    if (action === "menu") $("#sidebar").classList.toggle("open");
    if (action === "close") closeModal();
    if (action === "add-product") productModal();
    if (action === "add-customer") customerModal();
    if (action === "add-supplier") supplierModal();

    if (action === "edit-product") productModal(products.find(p => p.id === a.dataset.id));

    if (action === "delete-product" && confirm("Product মুছে ফেলবেন?")) {
      products = products.filter(p => p.id !== a.dataset.id); save(); render(); toast("Product মুছে ফেলা হয়েছে।");
    }

    if (action === "delete-customer" && confirm("Customer মুছে ফেলবেন?")) {
      customers = customers.filter(c => c.id !== a.dataset.id); save(); render();
    }

    if (action === "delete-supplier" && confirm("Supplier মুছে ফেলবেন?")) {
      suppliers = suppliers.filter(s => s.id !== a.dataset.id); save(); render();
    }

    if (action === "add-cart") {
      const p = products.find(x => x.id === a.dataset.id);
      const old = cart.find(x => x.id === p.id);
      if (!p || p.stock <= 0) return toast("Stock নেই।");
      if (old) {
        if (old.qty >= p.stock) return toast("পর্যাপ্ত stock নেই।");
        old.qty++;
      } else cart.push({ id: p.id, name: p.name, price: Number(p.sale), qty: 1, stock: Number(p.stock) });
      renderCart();
    }

    if (action === "remove-cart") {
      cart = cart.filter(x => x.id !== a.dataset.id); renderCart();
    }

    if (action === "clear-cart") {
      cart = []; renderCart();
    }

    if (action === "complete-sale") completeSale();

    if (action === "reset" && confirm("সব ডেটা মুছে ফেলবেন?")) {
      ["ns_products", "ns_customers", "ns_suppliers", "ns_sales", "ns_purchases", "ns_payments"].forEach(k => localStorage.removeItem(k));
      location.reload();
    }
  });

  document.addEventListener("input", e => {
    if (e.target.id === "posSearch") renderPOS();
    if (e.target.id === "discount") renderCart();
  });

  document.addEventListener("change", e => {
    if (e.target.dataset.qty) {
      const item = cart.find(x => x.id === e.target.dataset.qty);
      if (item) item.qty = Math.max(1, Math.min(Number(e.target.value), item.stock));
      renderCart();
    }
  });

  document.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(e.target);

    if (e.target.id === "productForm") {
      const item = {
        id: f.get("id") || id("PRD"), name: f.get("name"), sku: f.get("sku"),
        barcode: f.get("barcode"), category: f.get("category"),
        purchase: Number(f.get("purchase")), sale: Number(f.get("sale")),
        stock: Number(f.get("stock")), minStock: Number(f.get("minStock") || 0)
      };
      const index = products.findIndex(p => p.id === item.id);
      index >= 0 ? products[index] = item : products.push(item);
      save(); closeModal(); render(); toast("Product সংরক্ষণ হয়েছে।");
    }

    if (e.target.id === "customerForm") {
      customers.push({ id: id("CUS"), name: f.get("name"), phone: f.get("phone"), address: f.get("address"), due: 0 });
      save(); closeModal(); render(); toast("Customer সংরক্ষণ হয়েছে।");
    }

    if (e.target.id === "supplierForm") {
      suppliers.push({ id: id("SUP"), name: f.get("name"), phone: f.get("phone"), address: f.get("address"), due: 0 });
      save(); closeModal(); render(); toast("Supplier সংরক্ষণ হয়েছে।");
    }

    if (e.target.id === "purchaseForm") {
      const p = products.find(x => x.id === f.get("product"));
      const qty = Number(f.get("qty")), price = Number(f.get("price"));
      if (!p) return toast("আগে Product যোগ করুন।");
      p.stock = Number(p.stock) + qty;
      purchases.push({ id: id("PUR"), date: new Date().toISOString().slice(0, 10), name: p.name, qty, total: qty * price });
      save(); render(); toast("Purchase সংরক্ষণ হয়েছে।");
    }

    if (e.target.id === "paymentForm") {
      const c = customers.find(x => x.id === f.get("customer"));
      const amount = Number(f.get("amount"));
      if (c) c.due = Math.max(0, Number(c.due || 0) - amount);
      payments.push({ id: id("PAY"), date: new Date().toISOString().slice(0, 10), name: c?.name || "", amount });
      save(); render(); toast("Payment সংরক্ষণ হয়েছে।");
    }

    if (e.target.id === "settingsForm") {
      localStorage.setItem("ns_store", f.get("store"));
      localStorage.setItem("ns_phone", f.get("phone"));
      toast("Settings সংরক্ষণ হয়েছে।");
    }
  });

  if (!products.length) {
    products.push({ id: id("PRD"), name: "Sample Product", sku: "NS-001", barcode: "890000000001", category: "General", purchase: 100, sale: 149, stock: 20, minStock: 5 });
    save();
  }

  render();
})();
