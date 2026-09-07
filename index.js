/* =========================================================
   NAMITA STORE - PHASE 1: INVENTORY & STOCK MANAGEMENT
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
  let currentTab = "products";
  let products = [], categories = [], brands = [];

  async function safeSelect(table) {
    try {
      const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false });
      return error ? [] : (data || []);
    } catch { return []; }
  }

  async function loadAll() {
    [products, categories, brands] = await Promise.all([
      safeSelect("products"), safeSelect("categories"), safeSelect("brands")
    ]);
    render();
  }

  window.switchTab = (tab) => {
    currentTab = tab;
    render();
  };

  /* VIEWS */
  function productsView() {
    const lowStockCount = products.filter(p => num(p.stock) <= num(p.min_stock || 5)).length;
    return `
      <div class="space-y-4">
        <div class="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b pb-3">
          <div>
            <h2 class="text-2xl font-bold text-slate-800">📦 Inventory Management</h2>
            <p class="text-xs text-slate-500">Low Stock Items: <span class="font-bold text-amber-600">${lowStockCount}</span></p>
          </div>
          <div class="flex gap-2">
            <button onclick="window.nsAddCategory()" class="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-bold">+ Category</button>
            <button onclick="window.nsAddProduct()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow">+ Add Product</button>
          </div>
        </div>

        <div class="bg-white border rounded-2xl overflow-x-auto shadow-sm">
          <table class="w-full text-sm text-left text-slate-700">
            <thead class="bg-slate-50 border-b">
              <tr>
                <th class="p-4">SKU / Barcode</th>
                <th class="p-4">Product Name</th>
                <th class="p-4">Category</th>
                <th class="p-4">MRP / Sale Price</th>
                <th class="p-4">Stock</th>
                <th class="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              ${products.length === 0 ? '<tr><td colspan="6" class="p-4 text-center text-slate-400">কোনো প্রোডাক্ট পাওয়া যায়নি</td></tr>' : products.map(p => {
                const isLow = num(p.stock) <= num(p.min_stock || 5);
                return `
                  <tr class="border-b hover:bg-slate-50">
                    <td class="p-4 font-mono text-xs">${esc(p.sku || p.barcode || "-")}</td>
                    <td class="p-4 font-bold text-slate-800">${esc(p.name)}</td>
                    <td class="p-4"><span class="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs">${esc(p.category || "General")}</span></td>
                    <td class="p-4"><span class="text-xs text-slate-400 line-through">${money(p.mrp)}</span> <b class="text-emerald-600">${money(p.sale_price)}</b></td>
                    <td class="p-4"><span class="px-2 py-1 rounded-lg text-xs font-bold ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">${num(p.stock)}</span></td>
                    <td class="p-4 text-center">
                      <button onclick="window.nsAdjustStock('${p.id}')" class="text-xs bg-amber-500 text-white px-2 py-1 rounded-md font-bold">Stock Adj.</button>
                    </td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /* ACTIONS & MODALS */
  window.nsAddProduct = () => {
    modal("নতুন Product যুক্ত করুন (Full Details)", `
      <form onsubmit="window.nsSaveProduct(event)" class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div><label class="font-bold text-xs">Product Name *</label><input name="name" required class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></div>
          <div><label class="font-bold text-xs">SKU / Barcode</label><input name="sku" placeholder="Auto / Manual" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></div>
        </div>
        <div class="grid md:grid-cols-3 gap-4">
          <div>
            <label class="font-bold text-xs">Category</label>
            <select name="category" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500">
              <option value="General">General</option>
              ${categories.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("")}
            </select>
          </div>
          <div><label class="font-bold text-xs">Rack Location</label><input name="rack" placeholder="Rack A-1" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></div>
          <div><label class="font-bold text-xs">Min Stock Level</label><input name="min_stock" type="number" value="5" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></div>
        </div>
        <div class="grid md:grid-cols-3 gap-4">
          <div><label class="font-bold text-xs">Purchase Price</label><input name="purchase_price" type="number" step="0.01" value="0" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></div>
          <div><label class="font-bold text-xs">MRP</label><input name="mrp" type="number" step="0.01" value="0" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></div>
          <div><label class="font-bold text-xs">Sale Price *</label><input name="sale_price" type="number" step="0.01" required class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></div>
        </div>
        <div><label class="font-bold text-xs">Opening Stock</label><input name="stock" type="number" value="0" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></div>
        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-bold shadow">Save Product</button>
      </form>`);
  };

  window.nsSaveProduct = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get("name"),
      sku: fd.get("sku") || "SKU-" + Date.now().toString(36).toUpperCase(),
      category: fd.get("category"),
      rack: fd.get("rack"),
      min_stock: num(fd.get("min_stock")),
      purchase_price: num(fd.get("purchase_price")),
      mrp: num(fd.get("mrp")),
      sale_price: num(fd.get("sale_price")),
      stock: num(fd.get("stock")),
      created_at: dateTime()
    };
    const { error } = await db.from("products").insert(payload);
    if (!error) {
      nsCloseModal();
      toast("প্রোডাক্ট সংরক্ষণ করা হয়েছে!");
      await loadAll();
    } else {
      toast("ত্রুটি: " + error.message, "error");
    }
  };

  window.nsAddCategory = () => {
    modal("নতুন Category যুক্ত করুন", `
      <form onsubmit="window.nsSaveCategory(event)" class="space-y-4">
        <div><label class="font-bold text-xs">Category Name *</label><input name="name" required class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></div>
        <button type="submit" class="w-full bg-slate-800 text-white p-3 rounded-xl font-bold shadow">Save Category</button>
      </form>`, "max-w-md");
  };

  window.nsSaveCategory = async (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get("name");
    const { error } = await db.from("categories").insert({ name, created_at: dateTime() });
    if (!error) {
      nsCloseModal();
      toast("ক্যাটাগরি যুক্ত করা হয়েছে!");
      await loadAll();
    } else {
      toast("ত্রুটি: " + error.message, "error");
    }
  };

  window.nsAdjustStock = (id) => {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    modal(`Stock Adjustment - ${esc(p.name)}`, `
      <form onsubmit="window.nsSaveStockAdj(event, '${p.id}')" class="space-y-4">
        <div><label class="font-bold text-xs">বর্তমান স্টক: ${num(p.stock)}</label></div>
        <div><label class="font-bold text-xs">নতুন স্টক পরিমাণ *</label><input name="stock" type="number" value="${num(p.stock)}" required class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></div>
        <button type="submit" class="w-full bg-amber-600 text-white p-3 rounded-xl font-bold shadow">Update Stock</button>
      </form>`, "max-w-md");
  };

  window.nsSaveStockAdj = async (e, id) => {
    e.preventDefault();
    const stock = num(new FormData(e.target).get("stock"));
    const { error } = await db.from("products").update({ stock }).eq("id", id);
    if (!error) {
      nsCloseModal();
      toast("স্টক আপডেট হয়েছে!");
      await loadAll();
    } else {
      toast("ত্রুটি: " + error.message, "error");
    }
  };

  function render() {
    const main = document.getElementById("main-content");
    if (!main) return;
    main.innerHTML = productsView();
  }

  loadAll();
})();
