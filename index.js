/* =========================================================
   NAMITA STORE - PHASE 2: POS, BILLING, INVOICE & GST
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
  let products = [], categories = [], sales = [], cart = [];
  let posDiscount = 0, posGstRate = 0, paymentMode = "Cash";

  async function safeSelect(table) {
    try {
      const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false });
      return error ? [] : (data || []);
    } catch { return []; }
  }

  async function loadAll() {
    [products, categories, sales] = await Promise.all([
      safeSelect("products"), safeSelect("categories"), safeSelect("sales")
    ]);
    render();
  }

  window.switchTab = (tab) => {
    currentTab = tab;
    render();
  };

  /* VIEWS */
  function posView() {
    const subtotal = cart.reduce((a, b) => a + (b.qty * b.price), 0);
    const tax = (subtotal * posGstRate) / 100;
    const grandTotal = Math.max(0, subtotal + tax - posDiscount);

    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b pb-3">
          <h2 class="text-2xl font-bold text-slate-800">🔥 POS & Billing System</h2>
          <div class="flex gap-2">
            <button onclick="window.switchTab('products')" class="bg-slate-800 text-white px-3 py-2 rounded-xl text-sm font-bold">📦 Inventory Panel</button>
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Product Selector -->
          <div class="lg:col-span-2 bg-white p-4 border rounded-2xl shadow-sm">
            <div class="flex gap-2 mb-4">
              <input type="text" id="pos-search" oninput="window.nsFilterPos(this.value)" placeholder="Search Name or Scan Barcode/SKU..." class="w-full border p-3 rounded-xl focus:outline-indigo-500 font-mono text-sm">
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[550px] overflow-y-auto" id="pos-grid">
              ${products.map(p => `
                <div onclick="window.nsAddToCart('${p.id}')" class="border p-3 rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition bg-white">
                  <div class="text-xs font-mono text-slate-400">${esc(p.sku || "NO-SKU")}</div>
                  <div class="font-bold text-sm text-slate-800 truncate">${esc(p.name)}</div>
                  <div class="text-xs text-slate-500 mt-1">Stock: <b class="${num(p.stock) <= 5 ? 'text-red-500' : 'text-slate-700'}">${num(p.stock)}</b></div>
                  <div class="text-indigo-600 font-bold mt-2">${money(p.sale_price)}</div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Checkout Cart -->
          <div class="bg-white p-4 border rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="font-bold border-b pb-2 mb-3 text-slate-800 flex justify-between">
                <span>Cart Details</span>
                <button onclick="window.nsClearCart()" class="text-xs text-red-500 font-normal">Clear All</button>
              </h3>
              <div id="cart-list" class="space-y-2 max-h-60 overflow-y-auto mb-4">
                ${cart.length === 0 ? '<div class="text-slate-400 text-center py-10">কার্ট খালি রয়েছে</div>' : cart.map(item => `
                  <div class="flex justify-between items-center text-sm border-b pb-2">
                    <div class="flex-1 pr-2">
                      <div class="font-bold text-slate-800 truncate">${esc(item.name)}</div>
                      <div class="text-xs text-slate-500">${money(item.price)} x ${item.qty}</div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button onclick="window.nsChangeQty('${item.id}', -1)" class="w-6 h-6 bg-slate-100 rounded text-slate-600 font-bold">-</button>
                      <span class="font-bold text-xs">${item.qty}</span>
                      <button onclick="window.nsChangeQty('${item.id}', 1)" class="w-6 h-6 bg-slate-100 rounded text-slate-600 font-bold">+</button>
                      <button onclick="window.nsRemoveCart('${item.id}')" class="text-red-500 ml-2 font-bold">✕</button>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- Billing Summary & Calculations -->
            <div class="border-t pt-3 space-y-2">
              <div class="flex justify-between text-sm text-slate-600"><span>Subtotal:</span><span>${money(subtotal)}</span></div>
              <div class="flex justify-between items-center text-sm">
                <span>GST Tax (%):</span>
                <input type="number" value="${posGstRate}" onchange="window.nsSetGst(this.value)" class="w-16 border rounded p-1 text-right text-xs">
              </div>
              <div class="flex justify-between items-center text-sm">
                <span>Discount (₹):</span>
                <input type="number" value="${posDiscount}" onchange="window.nsSetDiscount(this.value)" class="w-20 border rounded p-1 text-right text-xs">
              </div>
              <div class="flex justify-between items-center text-sm">
                <span>Payment Mode:</span>
                <select onchange="window.nsSetPaymentMode(this.value)" class="border rounded p-1 text-xs font-bold">
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="Card">Card</option>
                  <option value="Credit">Credit (Due)</option>
                </select>
              </div>
              <div class="flex justify-between font-bold text-lg text-slate-800 border-t pt-2">
                <span>Grand Total:</span>
                <span class="text-emerald-600">${money(grandTotal)}</span>
              </div>
              <button onclick="window.nsCheckout()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-md transition mt-2">Complete Sale & Print</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* POS ACTIONS */
  window.nsFilterPos = (q) => {
    const grid = document.getElementById("pos-grid");
    if (!grid) return;
    const query = q.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query) || String(p.sku || "").toLowerCase().includes(query));
    grid.innerHTML = filtered.map(p => `
      <div onclick="window.nsAddToCart('${p.id}')" class="border p-3 rounded-xl cursor-pointer hover:border-indigo-500 transition">
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
    if (num(p.stock) <= 0) return toast("প্রোডাক্টটি আউট অফ স্টক রয়েছে!", "warning");
    const existing = cart.find(x => x.id === id);
    if (existing) {
      if (existing.qty + 1 > p.stock) return toast("পর্যাপ্ত স্টক নেই", "warning");
      existing.qty++;
    } else {
      cart.push({ id: p.id, name: p.name, price: num(p.sale_price), qty: 1 });
    }
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
  window.nsSetPaymentMode = (v) => { paymentMode = v; };

  window.nsCheckout = async () => {
    if (!cart.length) return toast("কার্টে কোনো প্রোডাক্ট নেই", "warning");

    const invoiceNumber = invNo();
    const subtotal = cart.reduce((a, b) => a + (b.qty * b.price), 0);
    const tax = (subtotal * posGstRate) / 100;
    const totalAmount = Math.max(0, subtotal + tax - posDiscount);

    const salePayload = {
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
      discount: posDiscount,
      tax_amount: tax,
      payment_mode: paymentMode,
      items: cart,
      created_at: dateTime()
    };

    const { error } = await db.from("sales").insert(salePayload);
    if (!error) {
      for (const item of cart) {
        const p = products.find(x => String(x.id) === String(item.id));
        if (p) {
          await db.from("products").update({ stock: Math.max(0, num(p.stock) - item.qty) }).eq("id", p.id);
        }
      }
      toast("বিক্রি সফল হয়েছে!");
      window.nsPrintInvoice(invoiceNumber, cart, totalAmount, tax, posDiscount);
      cart = [];
      posDiscount = 0;
      await loadAll();
    } else {
      toast("ত্রুটি: " + error.message, "error");
    }
  };

  window.nsPrintInvoice = (inv, items, total, tax, disc) => {
    modal(`Invoice: ${inv}`, `
      <div id="print-area" class="p-4 font-mono text-slate-800 text-sm">
        <div class="text-center border-b pb-2 mb-2">
          <h2 class="text-xl font-bold">NAMITA STORE</h2>
          <p class="text-xs">Main Road, Inventory Branch</p>
          <p class="text-xs">Invoice: ${inv} | Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <table class="w-full text-xs text-left mb-3">
          <tr class="border-b"><th class="py-1">Item</th><th>Qty</th><th class="text-right">Price</th></tr>
          ${items.map(i => `<tr><td class="py-1">${esc(i.name)}</td><td>${i.qty}</td><td class="text-right">${money(i.price * i.qty)}</td></tr>`).join("")}
        </table>
        <div class="border-t pt-2 text-xs space-y-1">
          <div class="flex justify-between"><span>Tax/GST:</span><span>${money(tax)}</span></div>
          <div class="flex justify-between"><span>Discount:</span><span>-${money(disc)}</span></div>
          <div class="flex justify-between font-bold text-sm"><span>Total Paid:</span><span>${money(total)}</span></div>
        </div>
        <button onclick="window.print()" class="w-full bg-slate-800 text-white p-2 rounded-xl mt-4 font-bold">Print Invoice</button>
      </div>`, "max-w-md");
  };

  function render() {
    const main = document.getElementById("main-content");
    if (!main) return;
    main.innerHTML = posView();
  }

  loadAll();
})();
