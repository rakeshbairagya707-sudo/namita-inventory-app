(function () {
  "use strict";

  const store = {
    products: JSON.parse(localStorage.getItem("ns_products") || "[]"),
    customers: JSON.parse(localStorage.getItem("ns_customers") || "[]"),
    sales: JSON.parse(localStorage.getItem("ns_sales") || "[]")
  };

  const save = () => {
    Object.entries(store).forEach(([key, value]) =>
      localStorage.setItem(`ns_${key}`, JSON.stringify(value))
    );
  };

  const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2
  })}`;

  const id = (prefix) => `${prefix}_${Date.now()}`;
  const app = document.getElementById("app");

  const pages = {
    dashboard: "ড্যাশবোর্ড",
    products: "পণ্য ও স্টক",
    customers: "কাস্টমার",
    sales: "সেলস / POS"
  };

  function shell() {
    app.innerHTML = `
      <div class="flex min-h-screen">
        <aside id="sidebar" class="w-64 shrink-0 bg-teal-800 text-white p-4">
          <h2 class="text-xl font-bold text-center mb-6">NAMITA STORE</h2>
          <nav class="space-y-2">
            ${Object.entries(pages).map(([key, name]) => `
              <button onclick="showPage('${key}')"
                class="nav-btn w-full text-left rounded-lg px-4 py-3"
                data-page="${key}">${name}</button>
            `).join("")}
          </nav>
        </aside>

        <main class="flex-1 min-w-0">
          <header class="bg-white border-b p-4 flex justify-between">
            <button class="md:hidden" onclick="sidebar.classList.toggle('hidden')">☰</button>
            <h1 id="title" class="font-bold"></h1>
            <span>${new Date().toLocaleDateString("bn-BD")}</span>
          </header>
          <section id="content" class="p-4 md:p-6"></section>
        </main>
      </div>
    `;
  }

  function dashboard() {
    const sales = store.sales.reduce((s, x) => s + Number(x.total), 0);
    const stock = store.products.reduce(
      (s, x) => s + Number(x.stock) * Number(x.purchase), 0
    );

    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${stat("মোট পণ্য", store.products.length)}
        ${stat("মোট বিক্রয়", money(sales))}
        ${stat("স্টক মূল্য", money(stock))}
        ${stat("কাস্টমার", store.customers.length)}
      </div>

      <div class="card p-5 mt-6">
        <h2 class="text-xl font-bold mb-4">দ্রুত কাজ</h2>
        <div class="flex flex-wrap gap-3">
          <button class="ns-btn" onclick="showPage('sales')">নতুন বিক্রয়</button>
          <button class="ns-btn" onclick="openProduct()">পণ্য যোগ করুন</button>
          <button class="ns-btn" onclick="openCustomer()">কাস্টমার যোগ করুন</button>
        </div>
      </div>

      <div class="card p-5 mt-6">
        <h2 class="text-xl font-bold mb-4">Low Stock Alert</h2>
        ${store.products.filter(p => Number(p.stock) <= Number(p.minStock || 0)).length
          ? productTable(store.products.filter(p => Number(p.stock) <= Number(p.minStock || 0)))
          : `<p class="text-slate-500">কোনো low-stock পণ্য নেই।</p>`}
      </div>
    `;
  }

  function stat(label, value) {
    return `
      <div class="card p-5">
        <p class="text-slate-500">${label}</p>
        <strong class="block text-2xl mt-2">${value}</strong>
      </div>
    `;
  }

  function productsPage() {
    return `
      <div class="flex justify-between items-center mb-5">
        <h2 class="text-2xl font-bold">পণ্য ও স্টক</h2>
        <button class="ns-btn" onclick="openProduct()">+ পণ্য যোগ</button>
      </div>
      <div class="card p-4">
        ${productTable(store.products)}
      </div>
    `;
  }

  function productTable(list) {
    if (!list.length) return `<p class="text-center text-slate-500 p-6">কোনো পণ্য নেই।</p>`;

    return `
      <div class="overflow-auto">
        <table>
          <thead><tr>
            <th>নাম</th><th>SKU</th><th>ক্রয় মূল্য</th>
            <th>বিক্রয় মূল্য</th><th>স্টক</th><th>অ্যাকশন</th>
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
                  <button class="ns-btn red" onclick="deleteProduct('${p.id}')">মুছুন</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function customersPage() {
    return `
      <div class="flex justify-between items-center mb-5">
        <h2 class="text-2xl font-bold">কাস্টমার</h2>
        <button class="ns-btn" onclick="openCustomer()">+ কাস্টমার যোগ</button>
      </div>
      <div class="card p-4 overflow-auto">
        <table>
          <thead><tr><th>নাম</th><th>মোবাইল</th><th>বকেয়া</th></tr></thead>
          <tbody>
            ${store.customers.map(c => `
              <tr><td>${esc(c.name)}</td><td>${esc(c.phone)}</td>
              <td>${money(c.due)}</td></tr>
            `).join("") || `<tr><td colspan="3">কোনো কাস্টমার নেই।</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  function salesPage() {
    return `
      <div class="card p-5">
        <h2 class="text-2xl font-bold mb-4">নতুন বিক্রয় / POS</h2>
        <input id="saleSearch" class="w-full border rounded-lg p-3"
          placeholder="পণ্যের নাম বা SKU লিখুন..." oninput="renderSaleProducts()">
        <div id="saleProducts" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"></div>
        <div id="cart" class="mt-6"></div>
        <button class="ns-btn green mt-4" onclick="completeSale()">বিক্রয় সম্পন্ন করুন</button>
      </div>
    `;
  }

  function renderSaleProducts() {
    const q = (document.getElementById("saleSearch")?.value || "").toLowerCase();
    const list = store.products.filter(p =>
      `${p.name} ${p.sku} ${p.barcode || ""}`.toLowerCase().includes(q)
    );

    document.getElementById("saleProducts").innerHTML = list.map(p => `
      <button class="card p-4 text-left" onclick="addCart('${p.id}')">
        <b>${esc(p.name)}</b><br>
        <small>${esc(p.sku)} | স্টক: ${p.stock}</small>
        <strong class="block mt-2">${money(p.sale)}</strong>
      </button>
    `).join("") || `<p>পণ্য পাওয়া যায়নি।</p>`;
  }

  let cart = [];

  function renderCart() {
    const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
    document.getElementById("cart").innerHTML = `
      <h3 class="font-bold mb-2">কার্ট</h3>
      ${cart.map(x => `
        <div class="flex justify-between border-b py-2">
          <span>${esc(x.name)} × ${x.qty}</span>
          <b>${money(x.price * x.qty)}</b>
        </div>
      `).join("") || `<p>কার্ট খালি।</p>`}
      <div class="text-right text-xl font-bold mt-3">মোট: ${money(total)}</div>
    `;
  }

  window.addCart = (productId) => {
    const p = store.products.find(x => x.id === productId);
    if (!p || p.stock <= 0) return alert("স্টক নেই।");

    const item = cart.find(x => x.id === productId);
    if (item) item.qty++;
    else cart.push({ id: p.id, name: p.name, price: Number(p.sale), qty: 1 });
    renderCart();
  };

  window.completeSale = () => {
    if (!cart.length) return alert("কার্ট খালি।");

    const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
    cart.forEach(x => {
      const p = store.products.find(p => p.id === x.id);
      p.stock = Math.max(0, Number(p.stock) - x.qty);
    });

    store.sales.push({ id: id("SALE"), date: new Date().toISOString(), total, items: cart });
    cart = [];
    save();
    alert("বিক্রয় সফল হয়েছে।");
    showPage("dashboard");
  };

  window.openProduct = () => {
    const name = prompt("পণ্যের নাম:");
    if (!name) return;
    const sale = Number(prompt("বিক্রয় মূল্য:", "0"));
    const purchase = Number(prompt("ক্রয় মূল্য:", "0"));
    const stock = Number(prompt("স্টক:", "0"));

    store.products.push({
      id: id("PRD"), name, sku: `SKU-${Date.now()}`,
      purchase, sale, stock, minStock: 5
    });
    save();
    showPage("products");
  };

  window.openCustomer = () => {
    const name = prompt("কাস্টমারের নাম:");
    if (!name) return;
    const phone = prompt("মোবাইল নম্বর:", "");
    store.customers.push({ id: id("CUS"), name, phone, due: 0 });
    save();
    showPage("customers");
  };

  window.deleteProduct = (productId) => {
    if (!confirm("পণ্যটি মুছে ফেলবেন?")) return;
    store.products = store.products.filter(p => p.id !== productId);
    save();
    showPage("products");
  };

  window.showPage = (page) => {
    document.getElementById("title").textContent = pages[page] || pages.dashboard;
    document.querySelectorAll(".nav-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.page === page)
    );

    const content = document.getElementById("content");
    content.innerHTML = page === "dashboard" ? dashboard()
      : page === "products" ? productsPage()
      : page === "customers" ? customersPage()
      : salesPage();

    if (page === "sales") {
      renderSaleProducts();
      renderCart();
    }
  };

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]
    );
  }

  shell();
  showPage("dashboard");
})();
