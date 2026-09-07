/* =========================================================
   NAMITA STORE - PHASE 5: ALL-IN-ONE MASTER APP INTEGRATION
   ========================================================= */
(function () {
  "use strict";

  const SUPABASE_URL = "https://ekcgmmtusasqziirkohd.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_A2fNVKm3AGDq25-UroB-4Q_V3mcLrUO";

  if (!window.supabase) {
    document.getElementById("main-content").innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-6">
        <div class="bg-white rounded-2xl shadow p-8 max-w-lg text-center">
          <h2 class="text-2xl font-bold text-red-600 mb-3">Supabase লোড হয়নি</h2>
          <p class="text-slate-600">Internet connection এবং index.html পরীক্ষা করুন।</p>
        </div>
      </div>`;
    return;
  }

  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /* UTILITIES */
  const money = (v) => "₹" + Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const num = (v) => Number(v || 0);
  const esc = (v) => String(v ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[c]));
  const dateTime = () => new Date().toISOString();
  const today = () => new Date().toISOString().slice(0, 10);
  const invNo = () => "INV-" + Date.now().toString().slice(-6);

  function toast(msg, type = "success") {
    const old = document.getElementById("ns-toast");
    if (old) old.remove();
    const color = type === "error" ? "bg-red-600" : type === "warning" ? "bg-amber-500" : "bg-emerald-600";
    const div = document.createElement("div");
    div.id = "ns-toast";
    div.className = `fixed right-5 bottom-5 z-[9999] px-5 py-3 rounded-xl text-white shadow-2xl ${color}`;
    div.textContent = msg;
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

  window.nsCloseModal = () => {
    const m = document.getElementById("ns-modal");
    if (m) m.remove();
  };

  /* STATE */
  let currentTab = "pos";
  let products = [], categories = [], sales = [], expenses = [], customers = [], cart = [];
  let posDiscount = 0, posGstRate = 0, paymentMode = "Cash";

  async function safeSelect(table) {
    try {
      const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false });
      return error ? [] : (data || []);
    } catch { return []; }
  }

  async function loadAll() {
    [products, categories, sales, expenses, customers] = await Promise.all([
      safeSelect("products"), safeSelect("categories"), safeSelect("sales"), safeSelect("expenses"), safeSelect("customers")
    ]);
    render();
  }

  window.switchTab = (tab) => {
    currentTab = tab;
    render();
  };

  /* NAVIGATION BAR */
  function renderHeader() {
    return `
      <nav class="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50 mb-6">
        <div class="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <h1 class="text-xl font-extrabold tracking-wide text-indigo-400">🏪 NAMITA STORE ERP</h1>
          <div class="flex gap-2 overflow-x-auto text-sm font-bold">
            <button onclick="window.switchTab('pos')" class="px-3 py-2 rounded-xl ${currentTab === 'pos' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}">🔥 POS Billing</button>
            <button onclick="window.switchTab('products')" class="px-3 py-2 rounded-xl ${currentTab === 'products' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}">📦 Inventory</button>
            <button onclick="window.switchTab('accounts')" class="px-3 py-2 rounded-xl ${currentTab === 'accounts' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}">💰 Accounts</button>
            <button onclick="window.switchTab('ledger')" class="px-3 py-2 rounded-xl ${currentTab === 'ledger' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}">👥 Customers Due</button>
          </div>
        </div>
      </nav>`;
  }

  /* POS VIEW */
  function posView() {
    const subtotal = cart.reduce((a, b) => a + (b.qty * b.price), 0);
    const tax = (subtotal * posGstRate) / 100;
    const grandTotal = Math.max(0, subtotal + tax - posDiscount);

    return `
      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white p-4 border rounded-2xl shadow-sm">
          <input type="text" id="pos-search" oninput="window.nsFilterPos(this.value)" placeholder="Search Name or Scan Barcode/SKU..." class="w-full border p-3 rounded-xl focus:outline-indigo-500 font-mono text-sm mb-4">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto" id="pos-grid">
            ${products.map(p => `
              <div onclick="window.nsAddToCart('${p.id}')" class="border p-3 rounded-xl cursor-pointer hover:border-indigo-500 transition bg-white">
                <div class="text-xs font-mono text-slate-400">${esc(p.sku || "NO-SKU")}</div>
                <div class="font-bold text-sm text-slate-800 truncate">${esc(p.name)}</div>
                <div class="text-xs text-slate-500 mt-1">Stock: <b class="${num(p.stock) <= 5 ? 'text-red-500' : 'text-slate-700'}">${num(p.stock)}</b></div>
                <div class="text-indigo-600 font-bold mt-2">${money(p.sale_price)}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="bg-white p-4 border rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex justify-between font-bold border-b pb-2 mb-3"><span>Cart</span><button onclick="window.nsClearCart()" class="text-xs text-red-500 font-normal">Clear</button></div>
            <div id="cart-list" class="space-y-2 max-h-56 overflow-y-auto mb-4">
              ${cart.length === 0 ? '<div class="text-slate-400 text-center py-8 text-sm">কার্ট খালি রয়েছে</div>' : cart.map(item => `
                <div class="flex justify-between items-center text-sm border-b pb-2">
                  <div class="flex-1 pr-2"><div class="font-bold text-slate-800 truncate">${esc(item.name)}</div><div class="text-xs text-slate-500">${money(item.price)} x ${item.qty}</div></div>
                  <div class="flex items-center gap-2">
                    <button onclick="window.nsChangeQty('${item.id}', -1)" class="w-6 h-6 bg-slate-100 rounded font-bold">-</button>
                    <span class="font-bold text-xs">${item.qty}</span>
                    <button onclick="window.nsChangeQty('${item.id}', 1)" class="w-6 h-6 bg-slate-100 rounded font-bold">+</button>
                    <button onclick="window.nsRemoveCart('${item.id}')" class="text-red-500 ml-2 font-bold">✕</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="border-t pt-3 space-y-2">
            <div class="flex justify-between text-sm"><span>Subtotal:</span><span>${money(subtotal)}</span></div>
            <div class="flex justify-between items-center text-sm"><span>GST (%):</span><input type="number" value="${posGstRate}" onchange="window.nsSetGst(this.value)" class="w-16 border rounded p-1 text-right text-xs"></div>
            <div class="flex justify-between items-center text-sm"><span>Discount (₹):</span><input type="number" value="${posDiscount}" onchange="window.nsSetDiscount(this.value)" class="w-20 border rounded p-1 text-right text-xs"></div>
            <div class="flex justify-between font-bold text-lg border-t pt-2"><span>Grand Total:</span><span class="text-emerald-600">${money(grandTotal)}</span></div>
            <button onclick="window.nsCheckout()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow transition mt-2">Sale & Print</button>
          </div>
        </div>
      </div>`;
  }

  /* PRODUCTS VIEW */
  function productsView() {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b pb-3">
          <h2 class="text-xl font-bold">📦 Inventory Products</h2>
          <button onclick="window.nsAddProductModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold">+ Add Product</button>
        </div>
        <div class="bg-white border rounded-2xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 border-b"><tr><th class="p-3">SKU</th><th class="p-3">Name</th><th class="p-3">Stock</th><th class="p-3">Purchase Price</th><th class="p-3">Sale Price</th></tr></thead>
            <tbody>
              ${products.map(p => `<tr class="border-b"><td class="p-3 font-mono text-xs">${esc(p.sku || "N/A")}</td><td class="p-3 font-bold">${esc(p.name)}</td><td class="p-3 font-bold">${num(p.stock)}</td><td class="p-3">${money(p.purchase_price)}</td><td class="p-3 text-indigo-600 font-bold">${money(p.sale_price)}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /* ACCOUNTS VIEW */
  function accountsView() {
    const todaySales = sales.filter(s => String(s.created_at).slice(0, 10) === today()).reduce((a, b) => a + num(b.total_amount), 0);
    const todayExpenses = expenses.filter(e => String(e.created_at).slice(0, 10) === today()).reduce((a, b) => a + num(b.amount), 0);

    return `
      <div class="space-y-6">
        <div class="flex justify-between items-center border-b pb-3">
          <h2 class="text-xl font-bold">💰 Accounts Summary</h2>
          <button onclick="window.nsAddExpenseModal()" class="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold">+ Add Expense</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-5 rounded-2xl border shadow-sm"><div class="text-xs text-slate-500 font-bold">আজকের বিক্রি</div><div class="text-2xl font-bold text-emerald-600 mt-1">${money(todaySales)}</div></div>
          <div class="bg-white p-5 rounded-2xl border shadow-sm"><div class="text-xs text-slate-500 font-bold">আজকের খরচ</div><div class="text-2xl font-bold text-rose-600 mt-1">${money(todayExpenses)}</div></div>
        </div>
      </div>`;
  }

  /* CUSTOMERS VIEW */
  function ledgerView() {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b pb-3"><h2 class="text-xl font-bold">👥 Customer Ledger</h2></div>
        <div class="bg-white border rounded-2xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 border-b"><tr><th class="p-3">Name</th><th class="p-3">Phone</th><th class="p-3 text-right">Due Amount</th></tr></thead>
            <tbody>
              ${customers.map(c => `<tr class="border-b"><td class="p-3 font-bold">${esc(c.name)}</td><td class="p-3">${esc(c.phone || "N/A")}</td><td class="p-3 text-right font-bold text-red-600">${money(c.due_amount)}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /* GLOBAL ACTIONS */
  window.nsFilterPos = (q) => {
    const grid = document.getElementById("pos-grid");
    if (!grid) return;
    const query = q.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query) || String(p.sku || "").toLowerCase().includes(query));
    grid.innerHTML = filtered.map(p => `
      <div onclick="window.nsAddToCart('${p.id}')" class="border p-3 rounded-xl cursor-pointer hover:border-indigo-500 transition bg-white">
        <div class="text-xs font-mono text-slate-400">${esc(p.sku || "NO-SKU")}</div>
        <div class="font-bold text-sm text-slate-800 truncate">${esc(p.name)}</div>
        <div class="text-xs text-slate-500 mt-1">Stock: ${num(p.stock)}</div>
        <div class="text-indigo-600 font-bold mt-2">${money(p.sale_price)}</div>
      </div>
    `).join("");
  };

  window.nsAddToCart = (id) => {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    if (num(p.stock) <= 0) return toast("আউট অফ স্টক!", "warning");
    const existing = cart.find(x => x.id === id);
    if (existing) existing.qty++;
    else cart.push({ id: p.id, name: p.name, price: num(p.sale_price), qty: 1 });
    render();
  };

  window.nsChangeQty = (id, delta) => {
    const item = cart.find(x => x.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
    render();
  };

  window.nsRemoveCart = (id) => { cart = cart.filter(x => x.id !== id); render(); };
  window.nsClearCart = () => { cart = []; render(); };
  window.nsSetGst = (v) => { posGstRate = num(v); render(); };
  window.nsSetDiscount = (v) => { posDiscount = num(v); render(); };

  window.nsCheckout = async () => {
    if (!cart.length) return toast("কার্ট খালি", "warning");
    const invoiceNumber = invNo();
    const subtotal = cart.reduce((a, b) => a + (b.qty * b.price), 0);
    const tax = (subtotal * posGstRate) / 100;
    const totalAmount = Math.max(0, subtotal + tax - posDiscount);

    const { error } = await db.from("sales").insert({ invoice_number: invoiceNumber, total_amount: totalAmount, discount: posDiscount, tax_amount: tax, payment_mode: paymentMode, items: cart, created_at: dateTime() });
    if (!error) {
      for (const item of cart) {
        const p = products.find(x => String(x.id) === String(item.id));
        if (p) await db.from("products").update({ stock: Math.max(0, num(p.stock) - item.qty) }).eq("id", p.id);
      }
      toast("বিক্রি সফল হয়েছে!");
      cart = [];
      await loadAll();
    } else { toast("ত্রুটি: " + error.message, "error"); }
  };

  function render() {
    const main = document.getElementById("main-content");
    if (!main) return;
    let content = "";
    if (currentTab === "pos") content = posView();
    else if (currentTab === "products") content = productsView();
    else if (currentTab === "accounts") content = accountsView();
    else if (currentTab === "ledger") content = ledgerView();

    main.innerHTML = renderHeader() + `<div class="max-w-7xl mx-auto px-4 pb-12">${content}</div>`;
  }

  loadAll();
})();
