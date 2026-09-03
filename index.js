(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const key = "namita_store_data";
  const money = n => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const uid = p => `${p}_${Date.now()}`;
  const esc = v => String(v ?? "").replace(/[&<>"']/g, x =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[x]));

  let db = JSON.parse(localStorage.getItem(key) || "null") || {
    products: [], customers: [], suppliers: [], sales: [],
    purchases: [], payments: [], store: "NAMITA STORE"
  };

  let current = "dashboard";
  let cart = [];

  const menu = {
    dashboard: "📊 Dashboard",
    sales: "🧾 Sales / POS",
    purchase: "📥 Purchase",
    products: "📦 Products & Stock",
    customers: "👥 Customers",
    suppliers: "🏭 Suppliers",
    payments: "💰 Due / Payments",
    reports: "📑 Reports",
    settings: "⚙️ Settings"
  };

  function save() {
    localStorage.setItem(key, JSON.stringify(db));
  }

  function layout() {
    $("#app").innerHTML = `
      <aside id="side">
        <h2>${esc(db.store)}</h2>
        <small>Accounting & Inventory</small>
        <nav>${Object.entries(menu).map(([id, name]) =>
          `<button data-page="${id}">${name}</button>`).join("")}</nav>
      </aside>
      <main>
        <header>
          <button data-action="menu">☰</button>
          <b id="title"></b>
          <span>${new Date().toLocaleDateString()}</span>
        </header>
        <section id="content"></section>
      </main>`;
  }

  function stat(name, value) {
    return `<div class="stat"><small>${name}</small><strong>${value}</strong></div>`;
  }

  function table(head, rows) {
    return rows.length ? `<div class="table"><table>
      <thead><tr>${head.map(x => `<th>${x}</th>`).join("")}</tr></thead>
      <tbody>${rows.join("")}</tbody></table></div>`
      : `<p class="empty">কোনো তথ্য পাওয়া যায়নি।</p>`;
  }

  function dashboard() {
    const sale = db.sales.reduce((a, x) => a + Number(x.total), 0);
    const purchase = db.purchases.reduce((a, x) => a + Number(x.total), 0);
    const profit = db.sales.reduce((a, x) => a + Number(x.profit), 0);
    const due = db.customers.reduce((a, x) => a + Number(x.due || 0), 0);

    return `
      <div class="grid">
        ${stat("মোট বিক্রয়", money(sale))}
        ${stat("মোট ক্রয়", money(purchase))}
        ${stat("মোট লাভ", money(profit))}
        ${stat("Customer Due", money(due))}
        ${stat("মোট পণ্য", db.products.length)}
        ${stat("মোট Customer", db.customers.length)}
        ${stat("মোট Supplier", db.suppliers.length)}
      </div>
      <div class="card">
        <h2>Quick Actions</h2>
        <button data-page="sales">🧾 New Sale</button>
        <button data-action="add-product">📦 Add Product</button>
        <button data-action="add-customer">👥 Add Customer</button>
        <button data-page="purchase">📥 New Purchase</button>
      </div>
      <div class="card"><h2>Low Stock</h2>${
        table(["Product", "SKU", "Stock"], db.products
          .filter(x => Number(x.stock) <= Number(x.minimum || 5))
          .map(x => `<tr><td>${esc(x.name)}</td><td>${esc(x.sku)}</td><td>${x.stock}</td></tr>`))
      }</div>`;
  }

  function products() {
    return `<div class="card">
      <div class="bar"><h2>Products & Stock</h2>
      <button data-action="add-product">＋ Add Product</button></div>
      ${table(["Name","SKU","Purchase","Sale","Stock","Action"], db.products.map(x =>
        `<tr><td>${esc(x.name)}</td><td>${esc(x.sku)}</td>
        <td>${money(x.purchase)}</td><td>${money(x.sale)}</td><td>${x.stock}</td>
        <td><button data-action="edit-product" data-id="${x.id}">Edit</button>
        <button class="red" data-action="delete-product" data-id="${x.id}">Delete</button></td></tr>`))}
    </div>`;
  }

  function customers() {
    return `<div class="card">
      <div class="bar"><h2>Customers</h2>
      <button data-action="add-customer">＋ Add Customer</button></div>
      ${table(["Name","Mobile","Address","Due","Action"], db.customers.map(x =>
        `<tr><td>${esc(x.name)}</td><td>${esc(x.phone)}</td><td>${esc(x.address)}</td>
        <td>${money(x.due)}</td><td><button class="red" data-action="delete-customer" data-id="${x.id}">Delete</button></td></tr>`))}
    </div>`;
  }

  function suppliers() {
    return `<div class="card">
      <div class="bar"><h2>Suppliers</h2>
      <button data-action="add-supplier">＋ Add Supplier</button></div>
      ${table(["Name","Mobile","Address"], db.suppliers.map(x =>
        `<tr><td>${esc(x.name)}</td><td>${esc(x.phone)}</td><td>${esc(x.address)}</td></tr>`))}
    </div>`;
  }

  function purchase() {
    return `<div class="card">
      <h2>Purchase Entry</h2>
      <select id="purchaseProduct">
        ${db.products.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join("")}
      </select>
      <input id="purchaseQty" type="number" min="1" placeholder="Quantity">
      <input id="purchasePrice" type="number" min="0" placeholder="Purchase Price">
      <button data-action="save-purchase">Save Purchase</button>
    </div>
    <div class="card">${table(["Date","Product","Quantity","Total"], db.purchases.map(x =>
      `<tr><td>${x.date}</td><td>${esc(x.name)}</td><td>${x.qty}</td><td>${money(x.total)}</td></tr>`))}</div>`;
  }

  function sales() {
    return `<div class="pos">
      <div>
        <div class="card">
          <h2>Sales / POS</h2>
          <input id="search" placeholder="Product name বা SKU search করুন">
          <div id="picker"></div>
        </div>
        <div class="card"><h3>Cart</h3><div id="cart"></div></div>
      </div>
      <div class="card">
        <h3>Sale Summary</h3>
        <select id="customer">
          <option value="">Walk-in Customer</option>
          ${db.customers.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join("")}
        </select>
        <select id="payment"><option>Cash</option><option>UPI</option>
          <option>Card</option><option>Credit</option></select>
        <input id="discount" type="number" value="0" placeholder="Discount">
        <div id="summary"></div>
        <button data-action="complete-sale">Complete Sale</button>
        <button class="light" data-action="clear-cart">Clear Cart</button>
      </div>
    </div>`;
  }

  function renderPOS() {
    const query = ($("#search")?.value || "").toLowerCase();
    $("#picker").innerHTML = db.products.filter(x =>
      `${x.name} ${x.sku} ${x.barcode || ""}`.toLowerCase().includes(query)
    ).map(x => `<button class="product" data-action="add-cart" data-id="${x.id}">
      <b>${esc(x.name)}</b><br><small>SKU: ${esc(x.sku)} | Stock: ${x.stock}</small><br>
      <strong>${money(x.sale)}</strong>
    </button>`).join("") || `<p class="empty">Product পাওয়া যায়নি।</p>`;

    renderCart();
  }

  function renderCart() {
    if (!$("#cart")) return;

    const subtotal = cart.reduce((a, x) => a + x.qty * x.price, 0);
    const discount = Number($("#discount")?.value || 0);
    const total = Math.max(0, subtotal - discount);

    $("#cart").innerHTML = cart.length ? cart.map(x => `
      <div class="cart-row">
        <span>${esc(x.name)}</span>
        <input type="number" min="1" max="${x.stock}" value="${x.qty}" data-qty="${x.id}">
        <b>${money(x.qty * x.price)}</b>
        <button class="red" data-action="remove-cart" data-id="${x.id}">×</button>
      </div>`).join("") : `<p class="empty">Cart খালি।</p>`;

    $("#summary").innerHTML = `
      <div class="summary">Subtotal: <b>${money(subtotal)}</b><br>
      Discount: <b>${money(discount)}</b><hr>
      <strong>Total: ${money(total)}</strong></div>`;
  }

  function payments() {
    return `<div class="card">
      <h2>Due Payment</h2>
      <select id="dueCustomer">
        ${db.customers.map(x => `<option value="${x.id}">${esc(x.name)} — ${money(x.due)}</option>`).join("")}
      </select>
      <input id="dueAmount" type="number" min="1" placeholder="Payment Amount">
      <button data-action="receive-payment">Receive Payment</button>
    </div>`;
  }

  function reports() {
    return `<div class="grid">
      ${stat("Total Sales", money(db.sales.reduce((a,x) => a + x.total, 0)))}
      ${stat("Total Profit", money(db.sales.reduce((a,x) => a + x.profit, 0)))}
      ${stat("Invoices", db.sales.length)}
      ${stat("Purchases", db.purchases.length)}
    </div>
    <div class="card">${table(["Invoice","Date","Customer","Payment","Total"],
      db.sales.map(x => `<tr><td>${x.id}</td><td>${x.date}</td>
      <td>${esc(x.customer)}</td><td>${x.payment}</td><td>${money(x.total)}</td></tr>`))}</div>`;
  }

  function settings() {
    return `<div class="card">
      <h2>Settings</h2>
      <input id="storeName" value="${esc(db.store)}" placeholder="Business Name">
      <button data-action="save-settings">Save Settings</button>
      <button class="red" data-action="reset">Reset All Data</button>
    </div>`;
  }

  function render() {
    $("#title").textContent = menu[current];
    document.querySelectorAll("nav button").forEach(x =>
      x.classList.toggle("active", x.dataset.page === current));

    const pages = { dashboard, sales, purchase, products, customers, suppliers, payments, reports, settings };
    $("#content").innerHTML = pages[current]();

    if (current === "sales") renderPOS();
  }

  function addProduct(existing = null) {
    const name = prompt("Product Name:", existing?.name || "");
    if (!name) return;

    const product = {
      id: existing?.id || uid("P"),
      name,
      sku: prompt("SKU:", existing?.sku || `SKU-${Date.now()}`),
      barcode: prompt("Barcode:", existing?.barcode || ""),
      purchase: Number(prompt("Purchase Price:", existing?.purchase || 0)),
      sale: Number(prompt("Sale Price:", existing?.sale || 0)),
      stock: Number(prompt("Stock:", existing?.stock || 0)),
      minimum: Number(prompt("Minimum Stock:", existing?.minimum || 5))
    };

    const index = db.products.findIndex(x => x.id === product.id);
    index >= 0 ? db.products[index] = product : db.products.push(product);
    save();
    render();
    alert("Product সংরক্ষণ হয়েছে।");
  }

  function addCustomer() {
    const name = prompt("Customer Name:");
    if (!name) return;

    db.customers.push({
      id: uid("C"), name,
      phone: prompt("Mobile:", ""),
      address: prompt("Address:", ""),
      due: 0
    });
    save();
    render();
  }

  function addSupplier() {
    const name = prompt("Supplier Name:");
    if (!name) return;

    db.suppliers.push({
      id: uid("S"), name,
      phone: prompt("Mobile:", ""),
      address: prompt("Address:", ""),
      due: 0
    });
    save();
    render();
  }

  function completeSale() {
    if (!cart.length) return alert("Cart খালি।");

    const customer = db.customers.find(x => x.id === $("#customer").value);
    const payment = $("#payment").value;
    const discount = Number($("#discount").value || 0);
    const subtotal = cart.reduce((a, x) => a + x.qty * x.price, 0);
    const total = Math.max(0, subtotal - discount);

    for (const item of cart) {
      const product = db.products.find(x => x.id === item.id);
      if (!product || product.stock < item.qty) return alert("Stock যথেষ্ট নেই।");
    }

    let profit = 0;

    cart.forEach(item => {
      const product = db.products.find(x => x.id === item.id);
      product.stock -= item.qty;
      profit += (item.price - product.purchase) * item.qty;
    });

    if (customer && payment === "Credit") customer.due += total;

    db.sales.push({
      id: uid("INV"),
      date: new Date().toISOString().slice(0, 10),
      customer: customer?.name || "Walk-in Customer",
      payment, total, profit: profit - discount,
      items: [...cart]
    });

    cart = [];
    save();
    current = "dashboard";
    render();
    alert("বিক্রয় সফল হয়েছে।");
  }

  document.addEventListener("click", e => {
    const page = e.target.closest("[data-page]");
    if (page) {
      current = page.dataset.page;
      render();
      return;
    }

    const a = e.target.closest("[data-action]");
    if (!a) return;

    const action = a.dataset.action;
    const id = a.dataset.id;

    if (action === "menu") $("#side").classList.toggle("open");
    if (action === "add-product") addProduct();
    if (action === "edit-product") addProduct(db.products.find(x => x.id === id));
    if (action === "add-customer") addCustomer();
    if (action === "add-supplier") addSupplier();

    if (action === "delete-product" && confirm("Product মুছে ফেলবেন?")) {
      db.products = db.products.filter(x => x.id !== id);
      save(); render();
    }

    if (action === "delete-customer" && confirm("Customer মুছে ফেলবেন?")) {
      db.customers = db.customers.filter(x => x.id !== id);
      save(); render();
    }

    if (action === "add-cart") {
      const product = db.products.find(x => x.id === id);
      if (!product || product.stock < 1) return alert("Stock নেই।");

      const old = cart.find(x => x.id === id);
      if (old) {
        if (old.qty >= product.stock) return alert("Stock যথেষ্ট নেই।");
        old.qty++;
      } else {
        cart.push({ id, name: product.name, price: product.sale, qty: 1, stock: product.stock });
      }
      renderCart();
    }

    if (action === "remove-cart") {
      cart = cart.filter(x => x.id !== id);
      renderCart();
    }

    if (action === "clear-cart") {
      cart = [];
      renderCart();
    }

    if (action === "complete-sale") completeSale();

    if (action === "save-purchase") {
      const product = db.products.find(x => x.id === $("#purchaseProduct").value);
      const qty = Number($("#purchaseQty").value);
      const price = Number($("#purchasePrice").value);

      if (!product || qty <= 0) return alert("সঠিক তথ্য দিন।");

      product.stock += qty;
      db.purchases.push({
        id: uid("PUR"),
        date: new Date().toISOString().slice(0, 10),
        name: product.name, qty, total: qty * price
      });
      save(); render(); alert("Purchase সংরক্ষণ হয়েছে।");
    }

    if (action === "receive-payment") {
      const customer = db.customers.find(x => x.id === $("#dueCustomer").value);
      const amount = Number($("#dueAmount").value);

      if (!customer || amount <= 0) return alert("সঠিক তথ্য দিন।");

      customer.due = Math.max(0, customer.due - amount);
      db.payments.push({ date: new Date().toISOString().slice(0, 10), name: customer.name, amount });
      save(); render(); alert("Payment সংরক্ষণ হয়েছে।");
    }

    if (action === "save-settings") {
      db.store = $("#storeName").value || "NAMITA STORE";
      save(); layout(); render();
    }

    if (action === "reset" && confirm("সব তথ্য মুছে ফেলবেন?")) {
      localStorage.removeItem(key);
      location.reload();
    }
  });

  document.addEventListener("input", e => {
    if (e.target.id === "search") renderPOS();
    if (e.target.id === "discount") renderCart();
  });

  document.addEventListener("change", e => {
    if (!e.target.dataset.qty) return;
    const item = cart.find(x => x.id === e.target.dataset.qty);
    if (item) item.qty = Math.max(1, Math.min(Number(e.target.value), item.stock));
    renderCart();
  });

  const style = document.createElement("style");
  style.textContent = `
    *{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#172033;font-family:Arial,sans-serif}
    #app{display:flex;min-height:100vh}#side{width:245px;background:#0f766e;color:#fff;position:fixed;inset:0 auto 0 0;padding:20px 12px}
    #side h2{text-align:center;margin:5px 0}#side small{display:block;text-align:center;margin-bottom:20px}
    nav button{display:block;width:100%;padding:13px;margin:4px 0;border:0;border-radius:8px;background:transparent;color:#fff;text-align:left;cursor:pointer}
    nav button:hover,nav button.active{background:#fff;color:#0f766e}main{margin-left:245px;width:calc(100% - 245px)}
    header{height:65px;background:#fff;border-bottom:1px solid #ddd;padding:18px 24px;display:flex;justify-content:space-between}
    header button,button{border:0;border-radius:8px;background:#0f766e;color:#fff;padding:10px 14px;margin:4px;cursor:pointer;font-weight:bold}
    button.red{background:#dc2626}button.light{background:#e2e8f0;color:#172033}.content,#content{padding:22px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}.stat,.card{background:#fff;border-radius:13px;padding:18px;margin-bottom:18px;box-shadow:0 2px 10px #0000000d}
    .stat strong{display:block;font-size:23px;margin-top:8px}.stat small{color:#64748b}.bar{display:flex;align-items:center}
    input,select{display:block;width:100%;padding:11px;margin:8px 0;border:1px solid #cbd5e1;border-radius:7px}
    .table{overflow:auto}table{width:100%;border-collapse:collapse;min-width:600px}th,td{padding:11px;border-bottom:1px solid #e5e7eb;text-align:left}th{background:#f8fafc}
    .empty{text-align:center;color:#64748b;padding:25px}.pos{display:grid;grid-template-columns:1.5fr 1fr;gap:18px}
    #picker{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.product{text-align:left;background:#fff;color:#172033;border:1px solid #ddd}
    .cart-row{display:grid;grid-template-columns:1fr 80px 110px 35px;gap:8px;align-items:center;border-bottom:1px solid #ddd;padding:10px 0}
    .summary{background:#f8fafc;padding:15px;margin:15px 0;line-height:2}.summary strong{font-size:20px}
    @media(max-width:800px){#side{transform:translateX(-100%);z-index:5;transition:.2s}#side.open{transform:translateX(0)}main{margin-left:0;width:100%}.grid{grid-template-columns:repeat(2,1fr)}.pos{grid-template-columns:1fr}}
    @media(max-width:500px){.grid,#picker{grid-template-columns:1fr}.content,#content{padding:12px}}
  `;
  document.head.appendChild(style);

  layout();
  render();
})();
