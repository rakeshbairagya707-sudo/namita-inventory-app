/* =========================================================
   NAMITA STORE ACCOUNTING + BILLING + INVENTORY + E-COMMERCE
   ========================================================= */
(function () {
  "use strict";

  /* =======================================================
     SUPABASE CONFIGURATION & CLIENT
     ======================================================= */
  const SUPABASE_URL = "https://ekcgmmtusasqziirkohd.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_A2fNVKm3AGDq25-UroB-4Q_V3mcLrUO";

  if (!window.supabase) {
    document.getElementById("app").innerHTML = `
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
  const $ = (selector) => document.querySelector(selector);
  const money = (value) => "₹" + Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (value) => Number(value || 0);
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[c]));
  const uid = () => "NS-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
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
      <div class="bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[92vh] overflow-hidden">
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
     COMMON UI COMPONENTS
     ======================================================= */
  function card(title, value, icon, extra = "") {
    return `
      <div class="bg-white rounded-2xl border shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-slate-500">${title}</div>
            <div class="text-2xl font-bold mt-2">${value}</div>
            ${extra}
          </div>
          <div class="text-3xl">${icon}</div>
        </div>
      </div>`;
  }

  function sectionHeader(title, subtitle, buttonText = "", buttonAction = "") {
    return `
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h2 class="text-2xl font-bold">${title}</h2>
          <p class="text-sm text-slate-500 mt-1">${subtitle || ""}</p>
        </div>
        ${buttonText ? `<button onclick="${buttonAction}" class="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:opacity-90 text-white px-5 py-3 rounded-xl font-semibold shadow-md">+ ${buttonText}</button>` : ""}
      </div>`;
  }

  /* =======================================================
     APP STATE & DATA LOADING
     ======================================================= */
  let page = "dashboard";
  let products = [], customers = [], suppliers = [], categories = [], sales = [], purchases = [], expenses = [], cart = [];
  let businessSettings = { business_name: "NAMITA STORE" };

  async function safeSelect(table) {
    try {
      const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    } catch { return []; }
  }

  async function loadAll() {
    [products, customers, suppliers, categories, sales, purchases, expenses] = await Promise.all([
      safeSelect("products"), safeSelect("customers"), safeSelect("suppliers"),
      safeSelect("categories"), safeSelect("sales"), safeSelect("purchases"), safeSelect("expenses")
    ]);
    render();
  }

  /* =======================================================
     NAVIGATION & LAYOUT
     ======================================================= */
  const menuGroups = [
    { title: "MAIN", items: [["dashboard", "📊", "Dashboard"]] },
    { title: "SALES & POS", items: [["pos", "🔥", "POS Billing"], ["sales", "🧾", "Sales History"]] },
    { title: "INVENTORY", items: [["products", "📦", "Products"], ["categories", "🗂️", "Categories"]] },
    { title: "PURCHASE", items: [["purchase", "🛒", "New Purchase"], ["purchaseHistory", "📋", "Purchase History"]] },
    { title: "PARTIES", items: [["customers", "👥", "Customers"], ["suppliers", "🚚", "Suppliers"]] },
    { title: "ACCOUNTING", items: [["expenses", "➖", "Expenses"], ["reports", "📈", "Reports"]] }
  ];

  function renderSidebar() {
    return `
      <aside id="ns-sidebar" class="fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white transition-transform overflow-y-auto">
        <div class="p-5 border-b border-slate-800">
          <div class="text-2xl font-black">NAMITA STORE</div>
          <div class="text-xs text-slate-400 mt-1">Accounting & Inventory</div>
        </div>
        <div class="p-3">
          ${menuGroups.map(g => `
            <div class="mb-4">
              <div class="text-[10px] font-bold text-slate-500 px-3 mb-2">${g.title}</div>
              ${g.items.map(([id, icon, label]) => `
                <button onclick="window.nsGo('${id}')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 ${page === id ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}">
                  <span>${icon}</span><span>${label}</span>
                </button>
              `).join("")}
            </div>
          `).join("")}
        </div>
      </aside>`;
  }

  window.nsGo = function (p) {
    page = p;
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
  };

  /* =======================================================
     VIEWS & MODULES (POS, PURCHASE, EXPENSES, ETC)
     ======================================================= */

  // 1. Dashboard View
  function dashboardView() {
    const todaySale = sales.filter(s => String(s.created_at).slice(0, 10) === today()).reduce((a, b) => a + num(b.total_amount), 0);
    const totalDue = customers.reduce((a, b) => a + num(b.due_amount), 0);
    return `
      ${sectionHeader("Dashboard", "ব্যবসার এক নজর হালচাল")}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        ${card("আজকের Sales", money(todaySale), "💰")}
        ${card("মোট Products", products.length, "📦")}
        ${card("Customer Due", money(totalDue), "👥")}
        ${card("মোট Purchase", purchases.length, "🛒")}
      </div>`;
  }

  // 2. POS View & Logic
  function posView() {
    return `
      ${sectionHeader("POS Billing", "দ্রুত বিল করার সুবিধা")}
      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white p-4 border rounded-2xl">
          <input type="text" id="pos-search" oninput="window.nsFilterPos()" placeholder="Search Products..." class="w-full border p-3 rounded-xl mb-4">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="pos-grid">
            ${products.map(p => `
              <div onclick="window.nsAddToCart('${p.id}')" class="border p-3 rounded-xl cursor-pointer hover:border-indigo-500">
                <div class="font-bold text-sm">${esc(p.name)}</div>
                <div class="text-xs text-slate-500">Stock: ${stockQty(p)}</div>
                <div class="text-indigo-600 font-bold mt-1">${money(salePrice(p))}</div>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="bg-white p-4 border rounded-2xl">
          <h3 class="font-bold border-b pb-2 mb-3">Cart Details</h3>
          <div id="cart-list" class="space-y-2 max-h-60 overflow-y-auto mb-4">
            ${cart.length === 0 ? '<div class="text-slate-400 text-center py-5">কার্ট খালি আছে</div>' : cart.map(item => `
              <div class="flex justify-between items-center text-sm border-b pb-2">
                <div><b>${esc(item.name)}</b><br>${item.qty} x ${money(item.price)}</div>
                <button onclick="window.nsRemoveCart('${item.id}')" class="text-red-500">✕</button>
              </div>
            `).join("")}
          </div>
          <div class="border-t pt-3 space-y-2">
            <div class="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${money(cart.reduce((a, b) => a + (b.qty * b.price), 0))}</span>
            </div>
            <button onclick="window.nsCheckout()" class="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mt-3">Complete Order</button>
          </div>
        </div>
      </div>`;
  }

  window.nsAddToCart = function(id) {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    const existing = cart.find(x => x.id === id);
    if (existing) existing.qty++;
    else cart.push({ id: p.id, name: p.name, price: salePrice(p), qty: 1 });
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
      toast("বিক্রি সফল হয়েছে!");
      cart = [];
      await loadAll();
    } else {
      toast("ত্রুটি হয়েছে: " + error.message, "error");
    }
  };

  // 3. Products List View
  function productsView() {
    return `
      ${sectionHeader("Products", "পণ্য বিবরণী", "নতুন Product", "window.nsAddProduct()")}
      <div class="bg-white border rounded-2xl overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-slate-50 border-b">
            <tr><th class="p-4">নাম</th><th class="p-4">Purchase Price</th><th class="p-4">Sale Price</th><th class="p-4">Stock</th></tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr class="border-b">
                <td class="p-4 font-bold">${esc(p.name)}</td>
                <td class="p-4">${money(purchasePrice(p))}</td>
                <td class="p-4 text-emerald-600 font-bold">${money(salePrice(p))}</td>
                <td class="p-4">${stockQty(p)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
  }

  window.nsAddProduct = function () {
    modal("নতুন Product যুক্ত করুন", `
      <form onsubmit="window.nsSaveProduct(event)" class="space-y-4">
        <div><label class="font-bold text-sm">Product Name *</label><input name="name" required class="w-full border rounded-xl p-3 mt-1"></div>
        <div class="grid md:grid-cols-2 gap-4">
          <div><label class="font-bold text-sm">Purchase Price</label><input name="purchase_price" type="number" step="0.01" value="0" class="w-full border rounded-xl p-3 mt-1"></div>
          <div><label class="font-bold text-sm">Sale Price *</label><input name="sale_price" type="number" step="0.01" required class="w-full border rounded-xl p-3 mt-1"></div>
        </div>
        <div><label class="font-bold text-sm">Stock</label><input name="stock" type="number" value="0" class="w-full border rounded-xl p-3 mt-1"></div>
        <button class="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold">Save</button>
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
    await db.from("products").insert(payload);
    nsCloseModal();
    toast("প্রোডাক্ট সফলভাবে সংরক্ষণ করা হয়েছে");
    await loadAll();
  };

  /* =======================================================
     MAIN RENDER FUNCTION
     ======================================================= */
  function render() {
    const app = document.getElementById("app");
    if (!app) return;

    let content = "";
    switch (page) {
      case "dashboard": content = dashboardView(); break;
      case "pos": content = posView(); break;
      case "products": content = productsView(); break;
      default: content = `<div class="p-10 text-center font-bold text-slate-400">ফাংশনটি নির্মাণাধীন রয়েছে (${page})</div>`;
    }

    app.innerHTML = `
      <div class="min-h-screen bg-slate-100 flex">
        ${renderSidebar()}
        <div class="flex-1 flex flex-col min-w-0">
          <header class="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
            <h1 class="font-black text-xl text-slate-800">${esc(businessSettings.business_name)}</h1>
            <button onclick="window.nsGo('pos')" class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold">+ New POS Bill</button>
          </header>
          <main class="p-6 overflow-y-auto flex-1">${content}</main>
        </div>
      </div>`;
  }

  // Initial Initialization
  loadAll();
})();
