(function () {
  "use strict";

  const KEY = "namita_store_data_v1";
  const $ = (s, p = document) => p.querySelector(s);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]
  );
  const money = v => `₹${Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2
  })}`;
  const uid = p => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  let data = JSON.parse(localStorage.getItem(KEY) || "null") || {
    products: [],
    customers: [],
    suppliers: [],
    sales: [],
    purchases: [],
    payments: [],
    settings: { name: "NAMITA STORE", phone: "", address: "" }
  };

  let page = "dashboard";
  let cart = [];

  function save() {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function toast(message) {
    const old = $("#toast");
    if (old) old.remove();

    const el = document.createElement("div");
    el.id = "toast";
    el.textContent = message;
    el.style.cssText =
      "position:fixed;right:20px;bottom:20px;background:#0f766e;color:white;padding:13px 20px;border-radius:9px;z-index:9999;font-weight:bold";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  const pages = {
    dashboard: "Dashboard",
    sales: "Sales / POS",
    purchases: "Purchase",
    products: "Products & Stock",
    customers: "Customers",
    suppliers: "Suppliers",
    payments: "Due / Payments",
    reports: "Reports",
    settings: "Settings"
  };

  function layout() {
    $("#app").innerHTML = `
      <div class="ns-app">
        <aside class="ns-sidebar" id="sidebar">
          <div class="ns-logo">
            <h2>${esc(data.settings.name)}</h2>
            <small>Accounting & Inventory</small>
          </div>
          <nav class="ns-nav">
            ${Object.entries(pages).map(([key, title]) => `
              <button class="nav-link" data-page="${key}">${icon(key)} ${title}</button>
            `).join("")}
          </nav>
        </aside>

        <main class="ns-main">
          <header class="ns-top">
            <div>
              <button class="ns-btn light ns-mobile-menu" data-action="menu">☰</button>
              <strong id="pageTitle"></strong>
            </div>
            <span>${new Date().toLocaleDateString("en-IN")}</span>
          </header>
          <section class="ns-content" id="content"></section>
        </main>
      </div>
    `;
  }

  function icon(p) {
    return {
      dashboard: "📊", sales: "🧾", purchases: "📥",
      products: "📦", customers: "👥", suppliers: "🏭",
      payments: "💰", reports: "📑", settings: "⚙️"
    }[p] || "•";
  }

  function stat(title, value) {
    return `
      <div class="ns-stat">
        <small>${title}</small>
        <strong>${value}</strong>
      </div>
    `;
  }

  function dashboard() {
    const sales = data.sales.reduce((a, x) => a + Number(x.total), 0);
    const purchases = data.purchases.reduce((a, x) => a + Number(x.total), 0);
    const profit = data.sales.reduce((a, x) => a + Number(x.profit || 0), 0);
    const stock = data.products.reduce((a, x) => a + Number(x.stock) * Number(x.purchase), 0);
    const due = data.customers.reduce((a, x) => a + Number(x.due || 0), 0);

    return `
      <div class="ns-grid">
        ${stat("মোট বিক্রয়", money(sales))}
        ${stat("মোট ক্রয়", money(purchases))}
        ${stat("মোট লাভ", money(profit))}
        ${stat("Customer Receivable", money(due))}
        ${stat("বর্তমান Stock Value", money(stock))}
        ${stat("মোট পণ্য", data.products.length)}
        ${stat("মোট Customer", data.customers.length)}
        ${stat("মোট Supplier", data.suppliers.length)}
      </div>

      <div class="ns-card">
        <h2>Quick Actions</h2>
        <div class="ns-shortcuts">
          <button class="ns-shortcut nav-link" data-page="sales">🧾 নতুন বিক্রয়</button>
          <button class="ns-shortcut nav-link" data-page="purchases">📥 নতুন ক্রয়</button>
          <button class="ns-shortcut nav-link" data-page="products">📦 পণ্য যোগ</button>
          <button class="ns-shortcut nav-link" data-page="customers">👥 Customer যোগ</button>
        </div>
      </div>

      <div class="ns-card">
        <h2>Low Stock Alert</h2>
        ${productTable(data.products.filter(p => Number(p.stock) <= Number(p.minStock || 0)))}
      </div>
    `;
  }

  function productTable(list) {
    if (!list.length) return `<div class="ns-empty">কোনো তথ্য পাওয়া যায়নি।</div>`;

    return `
      <div class="ns-table-wrap"><table>
        <thead><tr>
          <th>নাম</th><th>SKU</th><th>ক্রয় মূল্য</th>
          <th>বিক্রয় মূল্য</th><th>স্টক</th><th>Action</th>
        </tr></thead>
        <tbody>
          ${list.map(p => `
            <tr>
              <td>${esc(p.name)}</td>
              <td>${esc(p.sku)}</td>
              <td>${money(p.purchase)}</td>
              <td>${money(p.sale)}</td>
              <td>${p.stock}</td>
              <td>
                <button class="ns-btn red" data-action="delete-product" data-id="${p.id}">মুছুন</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table></div>
    `;
  }

  function products() {
    return `
      <div class="ns-card">
        <h2>Products & Stock</h2>
        <form id="productForm" class="ns-form">
          ${field("name", "Product Name", "required")}
          ${field("sku", "SKU / Code", "required")}
          ${field("barcode", "Barcode")}
          ${field("category", "Category")}
          ${field("purchase", "Purchase Price", "type='number' required")}
          ${field("sale", "Sale Price", "type='number' required")}
          ${field("stock", "Opening Stock", "type='number' required")}
          ${field("minStock", "Minimum Stock", "type='number' value='5'")}
          <div class="ns-actions ns-full">
            <button class="ns-btn green">পণ্য সংরক্ষণ</button>
          </div>
        </form>
      </div>
      <div class="ns-card">${productTable(data.products)}</div>
    `;
  }

  function customers() {
    return `
      <div class="ns-card">
        <h2>Customer Management</h2>
        <form id="customerForm" class="ns-form">
          ${field("name", "Customer Name", "required")}
          ${field("phone", "Mobile Number")}
          ${field("address", "Address")}
          <div class="ns-actions ns-full">
            <button class="ns-btn green">Customer সংরক্ষণ</button>
          </div>
        </form>
      </div>
      <div class="ns-card">
        ${simpleTable(
          ["নাম", "মোবাইল", "ঠিকানা", "বকেয়া"],
          data.customers.map(x => [x.name, x.phone, x.address, money(x.due)])
        )}
      </div>
    `;
  }

  function suppliers() {
    return `
      <div class="ns-card">
        <h2>Supplier Management</h2>
        <form id="supplierForm" class="ns-form">
          ${field("name", "Supplier Name", "required")}
          ${field("phone", "Mobile Number")}
          ${field("address", "Address")}
          <div class="ns-actions ns-full">
            <button class="ns-btn green">Supplier সংরক্ষণ</button>
          </div>
        </form>
      </div>
      <div class="ns-card">
        ${simpleTable(
          ["নাম", "মোবাইল", "ঠিকানা", "বকেয়া"],
          data.suppliers.map(x => [x.name, x.phone, x.address, money(x.due)])
        )}
      </div>
    `;
  }

  function sales() {
    return `
      <div class="ns-sale-layout">
        <div>
          <div class="ns-card">
            <h2>Sales / POS</h2>
            <input id="saleSearch" class="ns-field-input"
              placeholder="Product name, SKU বা Barcode search করুন">
            <div id="saleProducts" class="ns-product-picker"></div>
          </div>
          <div class="ns-card">
            <h3>Cart</h3>
            <div id="cartArea"></div>
          </div>
        </div>
        <div class="ns-card">
          <h3>Sale Summary</h3>
          <select id="saleCustomer" class="ns-field-input">
            <option value="">Walk-in Customer</option>
            ${data.customers.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}
          </select>
          <select id="paymentMethod" class="ns-field-input" style="margin-top:10px">
            <option>Cash</option><option>UPI</option><option>Card</option>
            <option>Bank Transfer</option><option>Credit</option>
          </select>
          <input id="discount" class="ns-field-input" type="number"
            placeholder="Discount" value="0" style="margin-top:10px">
          <div id="saleTotal"></div>
          <button class="ns-btn green" data-action="complete-sale">Complete Sale</button>
          <button class="ns-btn light" data-action="clear-cart">Clear Cart</button>
        </div>
      </div>
    `;
  }

  function renderSaleProducts() {
    const box = $("#saleProducts");
    if (!box) return;

    const q = ($("#saleSearch")?.value || "").toLowerCase();
    const list = data.products.filter(p =>
      `${p.name} ${p.sku} ${p.barcode || ""}`.toLowerCase().includes(q)
    );

    box.innerHTML = list.map(p => `
      <button class="ns-product-mini" data-action="add-cart" data-id="${p.id}">
        <b>${esc(p.name)}</b><br>
        <small>${esc(p.sku)} | Stock: ${p.stock}</small><br>
        <strong>${money(p.sale)}</strong>
      </button>
    `).join("") || `<div class="ns-empty">Product পাওয়া যায়নি।</div>`;
  }

  function renderCart() {
    const area = $("#cartArea");
    if (!area) return;

    const subtotal = cart.reduce((a, x) => a + x.price * x.qty, 0);
    const discount = Number($("#discount")?.value || 0);
    const total = Math.max(0, subtotal - discount);

    area.innerHTML = cart.length ? cart.map(x => `
      <div class="ns-cart-row">
        <span><b>${esc(x.name)}</b><br>${money(x.price)}</span>
        <input type="number" min="1" max="${x.stock}" value="${x.qty}"
          data-action="cart-qty" data-id="${x.id}">
        <b>${money(x.price * x.qty)}</b>
        <button class="ns-btn red" data-action="remove-cart" data-id="${x.id}">×</button>
      </div>
    `).join("") : `<div class="ns-empty">Cart খালি।</div>`;

    $("#saleTotal").innerHTML = `
      <div class="ns-total-box">
        <div class="ns-total-line"><span>Subtotal</span><b>${money(subtotal)}</b></div>
        <div class="ns-total-line"><span>Discount</span><b>${money(discount)}</b></div>
        <div class="ns-total-line big"><span>Total</span><b>${money(total)}</b></div>
      </div>
    `;
  }

  function purchases() {
    return `
      <div class="ns-card">
        <h2>Purchase Entry</h2>
        <form id="purchaseForm" class="ns-form">
          ${field("product", "Product Name", "required")}
          ${field("qty", "Quantity", "type='number' required")}
          ${field("price", "Purchase Price", "type='number' required")}
          <div class="ns-actions ns-full">
            <button class="ns-btn green">Purchase সংরক্ষণ</button>
          </div>
        </form>
      </div>
      <div class="ns-card">
        ${simpleTable(
          ["তারিখ", "Product", "Quantity", "Total"],
          data.purchases.map(x => [x.date, x.product, x.qty, money(x.total)])
        )}
      </div>
    `;
  }

  function payments() {
    return `
      <div class="ns-card">
        <h2>Due / Payment Entry</h2>
        <form id="paymentForm" class="ns-form">
          ${field("name", "Customer Name", "required")}
          ${field("amount", "Amount", "type='number' required")}
          <div class="ns-field">
            <label>Type</label>
            <select name="type"><option>Receive</option><option>Pay</option></select>
          </div>
          <div class="ns-actions ns-full">
            <button class="ns-btn green">Payment সংরক্ষণ</button>
          </div>
        </form>
      </div>
      <div class="ns-card">
        ${simpleTable(
          ["নাম", "পরিমাণ", "Type", "তারিখ"],
          data.payments.map(x => [x.name, money(x.amount), x.type, x.date])
        )}
      </div>
    `;
  }

  function reports() {
    const sales = data.sales.reduce((a, x) => a + Number(x.total), 0);
    const profit = data.sales.reduce((a, x) => a + Number(x.profit || 0), 0);

    return `
      <div class="ns-grid">
        ${stat("Total Sales", money(sales))}
        ${stat("Total Profit", money(profit))}
        ${stat("Total Purchase", money(data.purchases.reduce((a, x) => a + x.total, 0)))}
        ${stat("Sales Invoice", data.sales.length)}
      </div>
      <div class="ns-card">
        <h2>Sales Report</h2>
        ${simpleTable(
          ["Invoice", "Date", "Customer", "Payment", "Total"],
          data.sales.map(x => [x.id, x.date, x.customer, x.payment, money(x.total)])
        )}
      </div>
    `;
  }

  function settings() {
    return `
      <div class="ns-card">
        <h2>Business Settings</h2>
        <form id="settingsForm" class="ns-form">
          ${field("name", "Business Name", `value="${esc(data.settings.name)}" required`)}
          ${field("phone", "Mobile", `value="${esc(data.settings.phone)}"`)}
          ${field("address", "Address", `value="${esc(data.settings.address)}"`)}
          <div class="ns-actions ns-full">
            <button class="ns-btn green">Settings সংরক্ষণ</button>
            <button type="button" class="ns-btn red" data-action="reset-data">সব ডেটা মুছুন</button>
          </div>
        </form>
      </div>
    `;
  }

  function field(name, label, attrs = "") {
    return `
      <div class="ns-field">
        <label>${label}</label>
        <input name="${name}" ${attrs}>
      </div>
    `;
  }

  function simpleTable(headers, rows) {
    return rows.length ? `
      <div class="ns-table-wrap"><table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(row => `
          <tr>${row.map(v => `<td>${esc(v)}</td>`).join("")}</tr>
        `).join("")}</tbody>
      </table></div>
    ` : `<div class="ns-empty">কোনো তথ্য নেই।</div>`;
  }

  function render() {
    $("#pageTitle").textContent = pages[page];
    document.querySelectorAll(".nav-link").forEach(x =>
      x.classList.toggle("active", x.dataset.page === page)
    );

    $("#content").innerHTML =
      page === "dashboard" ? dashboard() :
      page === "sales" ? sales() :
      page === "purchases" ? purchases() :
      page === "products" ? products() :
      page === "customers" ? customers() :
      page === "suppliers" ? suppliers() :
      page === "payments" ? payments() :
      page === "reports" ? reports() : settings();

    if (page === "sales") {
      renderSaleProducts();
      renderCart();
    }
  }

  document.addEventListener("click", e => {
    const nav = e.target.closest("[data-page]");
    if (nav) {
      page = nav.dataset.page;
      $("#sidebar").classList.remove("open");
      render();
      return;
    }

    const action = e.target.closest("[data-action]");
    if (!action) return;

    const id = action.dataset.id;

    if (action.dataset.action === "menu") {
      $("#sidebar").classList.toggle("open");
    }

    if (action.dataset.action === "add-cart") {
      const p = data.products.find(x => x.id === id);
      if (!p || p.stock <= 0) return toast("Stock নেই।");
      const old = cart.find(x => x.id === id);
      if (old) {
        if (old.qty >= p.stock) return toast("পর্যাপ্ত stock নেই।");
        old.qty++;
      } else {
        cart.push({ id, name: p.name, price: Number(p.sale), qty: 1, stock: Number(p.stock) });
      }
      renderCart();
    }

    if (action.dataset.action === "remove-cart") {
      cart = cart.filter(x => x.id !== id);
      renderCart();
    }

    if (action.dataset.action === "clear-cart") {
      cart = [];
      renderCart();
    }

    if (action.dataset.action === "delete-product") {
      if (confirm("এই পণ্যটি মুছে ফেলবেন?")) {
        data.products = data.products.filter(x => x.id !== id);
        save();
        render();
        toast("পণ্য মুছে ফেলা হয়েছে।");
      }
    }

    if (action.dataset.action === "complete-sale") completeSale();

    if (action.dataset.action === "reset-data" && confirm("সব ডেটা মুছে ফেলবেন?")) {
      localStorage.removeItem(KEY);
      location.reload();
    }
  });

  document.addEventListener("input", e => {
    if (e.target.id === "saleSearch") renderSaleProducts();
    if (e.target.id === "discount") renderCart();
  });

  document.addEventListener("change", e => {
    if (e.target.dataset.action === "cart-qty") {
      const item = cart.find(x => x.id === e.target.dataset.id);
      if (item) item.qty = Math.max(1, Math.min(Number(e.target.value), item.stock));
      renderCart();
    }
  });

  document.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(e.target);

    if (e.target.id === "productForm") {
      data.products.push({
        id: uid("PRD"),
        name: f.get("name"),
        sku: f.get("sku"),
        barcode: f.get("barcode"),
        category: f.get("category"),
        purchase: Number(f.get("purchase")),
        sale: Number(f.get("sale")),
        stock: Number(f.get("stock")),
        minStock: Number(f.get("minStock") || 0)
      });
      save();
      e.target.reset();
      render();
      toast("পণ্য সংরক্ষণ হয়েছে।");
    }

    if (e.target.id === "customerForm") {
      data.customers.push({
        id: uid("CUS"),
        name: f.get("name"),
        phone: f.get("phone"),
        address: f.get("address"),
        due: 0
      });
      save();
      e.target.reset();
      render();
      toast("Customer সংরক্ষণ হয়েছে।");
    }

    if (e.target.id === "supplierForm") {
      data.suppliers.push({
        id: uid("SUP"),
        name: f.get("name"),
        phone: f.get("phone"),
        address: f.get("address"),
        due: 0
      });
      save();
      e.target.reset();
      render();
      toast("Supplier সংরক্ষণ হয়েছে।");
    }

    if (e.target.id === "purchaseForm") {
      const product = data.products.find(x =>
        x.name.toLowerCase() === String(f.get("product")).toLowerCase()
      );

      if (!product) return toast("আগে Product তৈরি করুন।");

      const qty = Number(f.get("qty"));
      const price = Number(f.get("price"));

      product.stock += qty;
      data.purchases.push({
        id: uid("PUR"),
        date: new Date().toISOString().slice(0, 10),
        product: product.name,
        qty,
        total: qty * price
      });
      save();
      e.target.reset();
      render();
      toast("Purchase সংরক্ষণ হয়েছে।");
    }

    if (e.target.id === "paymentForm") {
      const name = String(f.get("name"));
      const amount = Number(f.get("amount"));
      const customer = data.customers.find(x => x.name.toLowerCase() === name.toLowerCase());

      if (customer) {
        customer.due = Math.max(0, Number(customer.due) - amount);
      }

      data.payments.push({
        id: uid("PAY"),
        name,
        amount,
        type: f.get("type"),
        date: new Date().toISOString().slice(0, 10)
      });
      save();
      e.target.reset();
      render();
      toast("Payment সংরক্ষণ হয়েছে।");
    }

    if (e.target.id === "settingsForm") {
      data.settings.name = f.get("name");
      data.settings.phone = f.get("phone");
      data.settings.address = f.get("address");
      save();
      layout();
      render();
      toast("Settings সংরক্ষণ হয়েছে।");
    }
  });

  function completeSale() {
    if (!cart.length) return toast("Cart খালি।");

    const subtotal = cart.reduce((a, x) => a + x.price * x.qty, 0);
    const discount = Number($("#discount")?.value || 0);
    const total = Math.max(0, subtotal - discount);
    const payment = $("#paymentMethod")?.value || "Cash";
    const customerId = $("#saleCustomer")?.value || "";
    const customer = data.customers.find(x => x.id === customerId);

    cart.forEach(item => {
      const p = data.products.find(x => x.id === item.id);
      p.stock -= item.qty;
    });

    if (customer && payment === "Credit") customer.due += total;

    data.sales.push({
      id: uid("SAL"),
      date: new Date().toISOString().slice(0, 10),
      customer: customer?.name || "Walk-in Customer",
      payment,
      subtotal,
      discount,
      total,
      profit: cart.reduce((a, x) => {
        const p = data.products.find(y => y.id === x.id);
        return a + (x.price - Number(p.purchase)) * x.qty;
      }, 0) - discount,
      items: cart
    });

    save();
    cart = [];
    toast("বিক্রয় সফল হয়েছে।");
    page = "dashboard";
    render();
  }

  layout();
  render();
})();
