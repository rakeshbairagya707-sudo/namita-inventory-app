/* =========================================================
   NAMITA STORE ACCOUNTING + BILLING + INVENTORY
   ========================================================= */
(function () {
  "use strict";

  /* =======================================================
     SUPABASE CONFIGURATION & CLIENT
     ======================================================= */
  const SUPABASE_URL = "https://ekcgmmtusasqziirkohd.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_A2fNVKm3AGDq25-UroB-4Q_V3mcLrUO";

  if (!window.supabase) {
    document.getElementById("main-content").innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-6">
        <div class="bg-white rounded-2xl shadow p-8 max-w-lg text-center">
          <h2 class="text-2xl font-bold text-red-600 mb-3">Supabase লোড হয়নি</h2>
          <p class="text-slate-600">Internet connection এবং index.html-এর Supabase script পরীক্ষা করুন।</p>
        </div>
      </div>`;
    return;
  }

  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /* =======================================================
     HELPERS & UTILITIES
     ======================================================= */
  const money = (value) => "₹" + Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (value) => Number(value || 0);
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const dateTime = () => new Date().toISOString();
  const salePrice = (p) => num(p?.sale_price ?? p?.price ?? p?.mrp ?? 0);
  const purchasePrice = (p) => num(p?.purchase_price ?? 0);
  const stockQty = (p) => num(p?.stock ?? 0);

  function toast(message, type = "success") {
    const old = document.getElementById("ns-toast");
    if (old) old.remove();
    const color = type === "error" ? "bg-red-600" : type === "warning" ? "bg-amber-500" : "bg-emerald-600";
    const div = document.createElement("div");
    div.id = "ns-toast";
    div.className = "fixed right-5 bottom-5 z-[9999] px-5 py-3 rounded-xl text-white shadow-2xl " + color;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }

  function modal(title, content, size = "max-w-3xl") {
    const old = document.getElementById("ns-modal");
    if (old) old.remove();
    const div = document.createElement("div");
    div.id = "ns-modal";
    div.className = "fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4";
    div.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[92vh] overflow-hidden text-slate-800">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-xl font-bold">${esc(title)}</h3>
          <button onclick="window.nsCloseModal()" class="text-2xl text-slate-500 hover:text-red-600">×</button>
        </div>
        <div class="p-5 overflow-y-auto max-h-[calc(92vh-70px)]">${content}</div>
      </div>`;
    document.body.appendChild(div);
  }

  window.nsCloseModal = function () {
    const m = document.getElementById("ns-modal");
    if (m) m.remove();
  };

  /* =======================================================
     APP STATE & DATA LOADING
     ======================================================= */
  let currentTab = "dashboard";
  let products = [], customers = [], suppliers = [], sales = [], purchases = [], cart = [];

  async function safeSelect(table) {
    try {
      const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    } catch { return []; }
  }

  async function loadAll() {
    [products, customers, suppliers, sales, purchases] = await Promise.all([
      safeSelect("products"), safeSelect("customers"), safeSelect("suppliers"),
      safeSelect("sales"), safeSelect("purchases")
    ]);
    render();
  }

  window.switchTab = function (tab) {
    currentTab = tab;
    render();
  };

  /* =======================================================
     VIEWS
     ======================================================= */

  // 1. Dashboard
  function dashboardView() {
    const todaySale = sales.filter(s => String(s.created_at).slice(0, 10) === today()).reduce((a, b) => a + num(b.total_amount), 0);
    const totalDue = customers.reduce((a, b) => a + num(b.due_amount), 0);

    return `
      <div class="space-y-6">
        <div class="flex justify-between items-center border-b pb-4">
          <h2 class="text-2xl font-bold text-slate-800">📊 Dashboard</h2>
          <span class="text-sm text-slate-500">তারিখ: ${today()}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border shadow-sm">
            <div class="text-slate-500 text-sm">আজকের বিক্রয়</div>
            <div class="text-2xl font-bold text-emerald-600 mt-1">${money(todaySale)}</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border shadow-sm">
            <div class="text-slate-500 text-sm">মোট প্রোডাক্ট</div>
            <div class="text-2xl font-bold text-indigo-600 mt-1">${products.length} টি</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border shadow-sm">
            <div class="text-slate-500 text-sm">কাস্টমার বাকি (Due)</div>
            <div class="text-2xl font-bold text-amber-600 mt-1">${money(totalDue)}</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border shadow-sm">
            <div class="text-slate-500 text-sm">মোট সাপ্লায়ার</div>
            <div class="text-2xl font-bold text-slate-700 mt-1">${suppliers.length} জন</div>
          </div>
        </div>
      </div>`;
  }

  // 2. POS Billing
  function posView() {
    return `
      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-slate-800 border-b pb-2">🔥 POS Billing</h2>
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white p-4 border rounded-2xl">
            <input type="text" id="pos-search" oninput="window.nsFilterPos(this.value)" placeholder="Search products..." class="w-full border p-3 rounded-xl mb-4 focus:outline-indigo-500">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="pos-grid">
              ${products.map(p => `
                <div onclick="window.nsAddToCart('${p.id}')" class="border p-3 rounded-xl cursor-pointer hover:border-indigo-500 transition hover:shadow-sm">
                  <div class="font-bold text-sm text-slate-800">${esc(p.name)}</div>
                  <div class="text-xs text-slate-500 mt-1">Stock: ${stockQty(p)}</div>
                  <div class="text-indigo-600 font-bold mt-2">${money(salePrice(p))}</div>
                </div>
              `).join("")}
            </div>
          </div>
          <div class="bg-white p-4 border rounded-2xl flex flex-col justify-between">
            <div>
              <h3 class="font-bold border-b pb-2 mb-3 text-slate-800">Cart Details</h3>
              <div id="cart-list" class="space-y-2 max-h-60 overflow-y-auto mb-4">
                ${cart.length === 0 ? '<div class="text-slate-400 text-center py-8">কার্ট খালি আছে</div>' : cart.map(item => `
                  <div class="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <div class="font-bold text-slate-800">${esc(item.name)}</div>
                      <div class="text-xs text-slate-500">${item.qty} x ${money(item.price)}</div>
                    </div>
                    <button onclick="window.nsRemoveCart('${item.id}')" class="text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded">✕</button>
                  </div>
                `).join("")}
              </div>
            </div>
            <div class="border-t pt-4 space-y-3">
              <div class="flex justify-between font-bold text-lg text-slate-800">
                <span>Total:</span>
                <span>${money(cart.reduce((a, b) => a + (b.qty * b.price), 0))}</span>
              </div>
              <button onclick="window.nsCheckout()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-md transition">Complete Order</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  // 3. Products View
  function productsView() {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b pb-3">
          <h2 class="text-2xl font-bold text-slate-800">📦 Products</h2>
          <button onclick="window.nsAddProduct()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold shadow">+ Add Product</button>
        </div>
        <div class="bg-white border rounded-2xl overflow-x-auto shadow-sm">
          <table class="w-full text-sm text-left text-slate-700">
            <thead class="bg-slate-50 border-b">
              <tr>
                <th class="p-4">প্রোডাক্টের নাম</th>
                <th class="p-4">Purchase Price</th>
                <th class="p-4">Sale Price</th>
                <th class="p-4">Stock</th>
              </tr>
            </thead>
            <tbody>
              ${products.length === 0 ? '<tr><td colspan="4" class="p-4 text-center text-slate-400">কোনো প্রোডাক্ট পাওয়া যায়নি</td></tr>' : products.map(p => `
                <tr class="border-b hover:bg-slate-50">
                  <td class="p-4 font-bold text-slate-800">${esc(p.name)}</td>
                  <td class="p-4">${money(purchasePrice(p))}</td>
                  <td class="p-4 text-emerald-600 font-bold">${money(salePrice(p))}</td>
                  <td class="p-4">${stockQty(p)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // 4. Suppliers View
  function suppliersView() {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b pb-3">
          <h2 class="text-2xl font-bold text-slate-800">🚚 Suppliers</h2>
        </div>
        <div class="bg-white border rounded-2xl overflow-x-auto shadow-sm p-4">
          <p class="text-slate-600">সাপ্লায়ারদের তালিকা এখানে প্রদর্শিত হবে।</p>
        </div>
      </div>`;
  }

  // 5. Customers View
  function customersView() {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b pb-3">
          <h2 class="text-2xl font-bold text-slate-800">👥 Customers</h2>
        </div>
        <div class="bg-white border rounded-2xl overflow-x-auto shadow-sm p-4">
          <p class="text-slate-600">কাস্টমারদের তথ্য ও বাকির হিসাব এখানে প্রদর্শিত হবে।</p>
        </div>
      </div>`;
  }

  /* =======================================================
     POS & PRODUCT ACTIONS
     ======================================================= */
  window.nsFilterPos = function(query) {
    const grid = document.getElementById("pos-grid");
    if (!grid) return;
    const filtered = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    grid.innerHTML = filtered.map(p => `
      <div onclick="window.nsAddToCart('${p.id}')" class="border p-3 rounded-xl cursor-pointer hover:border-indigo-500 transition">
        <div class="font-bold text-sm text-slate-800">${esc(p.name)}</div>
        <div class="text-xs text-slate-500 mt-1">Stock: ${stockQty(p)}</div>
        <div class="text-indigo-600 font-bold mt-2">${money(salePrice(p))}</div>
      </div>
    `).join("");
  };

  window.nsAddToCart = function(id) {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    const existing = cart.find(x => x.id === id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id: p.id, name: p.name, price: salePrice(p), qty: 1 });
    }
    render();
  };

  window.nsRemoveCart = function(id) {
    cart = cart.filter(x => x.id !== id);
    render();
  };

  window.nsCheckout = async function() {
    if (!cart.length) return toast("কার্টে কোনো প্রোডাক্ট নেই", "warning");
    const total = cart.reduce((a, b) => a + (b.qty * b.price), 0);
    const payload = { total_amount: total, created_at: dateTime(), items: cart };
    
    const { error } = await db.from("sales").insert(payload);
    if (!error) {
      toast("বিক্রি সফলভাবে সম্পন্ন হয়েছে!");
      cart = [];
      await loadAll();
    } else {
      toast("ত্রুটি: " + error.message, "error");
    }
  };

  window.nsAddProduct = function () {
    modal("নতুন Product যুক্ত করুন", `
      <form onsubmit="window.nsSaveProduct(event)" class="space-y-4">
        <div>
          <label class="font-bold text-sm text-slate-700">Product Name *</label>
          <input name="name" required class="w-full border rounded-xl p-3 mt-1 focus:outline-indigo-500">
        </div>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="font-bold text-sm text-slate-700">Purchase Price</label>
            <input name="purchase_price" type="number" step="0.01" value="0" class="w-full border rounded-xl p-3 mt-1 focus:outline-indigo-500">
          </div>
          <div>
            <label class="font-bold text-sm text-slate-700">Sale Price *</label>
            <input name="sale_price" type="number" step="0.01" required class="w-full border rounded-xl p-3 mt-1 focus:outline-indigo-500">
          </div>
        </div>
        <div>
          <label class="font-bold text-sm text-slate-700">Stock</label>
          <input name="stock" type="number" value="0" class="w-full border rounded-xl p-3 mt-1 focus:outline-indigo-500">
        </div>
        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-bold shadow">Save Product</button>
      </form>`);
  };

  window.nsSaveProduct = async function (e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get("name"),
      purchase_price: num(fd.get("purchase_price")),
      sale_price: num(fd.get("sale_price")),
      stock: num(fd.get("stock")),
      created_at: dateTime()
    };
    
    const { error } = await db.from("products").insert(payload);
    if (!error) {
      nsCloseModal();
      toast("প্রোডাক্ট সফলভাবে সংরক্ষণ করা হয়েছে");
      await loadAll();
    } else {
      toast("ত্রুটি: " + error.message, "error");
    }
  };

  /* =======================================================
     MAIN RENDER FUNCTION
     ======================================================= */
  function render() {
    const main = document.getElementById("main-content");
    if (!main) return;

    switch (currentTab) {
      case "dashboard": main.innerHTML = dashboardView(); break;
      case "pos": main.innerHTML = posView(); break;
      case "products": main.innerHTML = productsView(); break;
      case "suppliers": main.innerHTML = suppliersView(); break;
      case "customers": main.innerHTML = customersView(); break;
      default: main.innerHTML = dashboardView();
    }
  }

  // App Initialization
  loadAll();
})();
