/* =========================================================
   NAMITA STORE - PHASE 3: ACCOUNTS, EXPENSES & DAY BOOK
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

  function modal(title, content, size = "max-w-2xl") {
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
  let currentTab = "accounts";
  let sales = [], expenses = [];

  async function safeSelect(table) {
    try {
      const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false });
      return error ? [] : (data || []);
    } catch { return []; }
  }

  async function loadAll() {
    [sales, expenses] = await Promise.all([
      safeSelect("sales"), safeSelect("expenses")
    ]);
    render();
  }

  window.switchTab = (tab) => {
    currentTab = tab;
    render();
  };

  /* VIEWS */
  function accountsView() {
    const todaySales = sales.filter(s => String(s.created_at).slice(0, 10) === today()).reduce((a, b) => a + num(b.total_amount), 0);
    const todayExpenses = expenses.filter(e => String(e.created_at).slice(0, 10) === today()).reduce((a, b) => a + num(b.amount), 0);
    const totalSales = sales.reduce((a, b) => a + num(b.total_amount), 0);
    const totalExpenses = expenses.reduce((a, b) => a + num(b.amount), 0);
    const netProfit = totalSales - totalExpenses;

    return `
      <div class="space-y-6">
        <div class="flex justify-between items-center border-b pb-3">
          <h2 class="text-2xl font-bold text-slate-800">💰 Accounting & Expenses</h2>
          <button onclick="window.nsAddExpense()" class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow">+ Add Expense</button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border shadow-sm">
            <div class="text-xs text-slate-500 font-bold uppercase">আজকের বিক্রি</div>
            <div class="text-2xl font-bold text-emerald-600 mt-1">${money(todaySales)}</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border shadow-sm">
            <div class="text-xs text-slate-500 font-bold uppercase">আজকের খরচ</div>
            <div class="text-2xl font-bold text-rose-600 mt-1">${money(todayExpenses)}</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border shadow-sm">
            <div class="text-xs text-slate-500 font-bold uppercase">মোট লাভ / ক্ষতি</div>
            <div class="text-2xl font-bold ${netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'} mt-1">${money(netProfit)}</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border shadow-sm">
            <div class="text-xs text-slate-500 font-bold uppercase">মোট খরচ</div>
            <div class="text-2xl font-bold text-slate-700 mt-1">${money(totalExpenses)}</div>
          </div>
        </div>

        <!-- Expense History Table -->
        <div class="bg-white border rounded-2xl overflow-x-auto shadow-sm p-4">
          <h3 class="font-bold text-lg mb-3 text-slate-800 border-b pb-2">Expenses History</h3>
          <table class="w-full text-sm text-left text-slate-700">
            <thead class="bg-slate-50 border-b">
              <tr>
                <th class="p-3">তারিখ</th>
                <th class="p-3">খরচের বিবরণ</th>
                <th class="p-3">ক্যাটাগরি</th>
                <th class="p-3 text-right">পরিমাণ</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.length === 0 ? '<tr><td colspan="4" class="p-4 text-center text-slate-400">কোনো খরচের রেকর্ড পাওয়া যায়নি</td></tr>' : expenses.map(e => `
                <tr class="border-b hover:bg-slate-50">
                  <td class="p-3 text-xs text-slate-500">${new Date(e.created_at).toLocaleDateString()}</td>
                  <td class="p-3 font-bold text-slate-800">${esc(e.title)}</td>
                  <td class="p-3"><span class="bg-rose-50 text-rose-600 px-2 py-1 rounded text-xs font-bold">${esc(e.category || "General")}</span></td>
                  <td class="p-3 text-right font-bold text-rose-600">${money(e.amount)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /* ACTIONS */
  window.nsAddExpense = () => {
    modal("নতুন Expense যুক্ত করুন", `
      <form onsubmit="window.nsSaveExpense(event)" class="space-y-4">
        <div>
          <label class="font-bold text-xs">Expense Title / বিবরণ *</label>
          <input name="title" required placeholder="যেমন: দোকান ভাড়া, কারেন্ট বিল" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500">
        </div>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="font-bold text-xs">Category</label>
            <select name="category" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500">
              <option value="Rent">Rent (ভাড়া)</option>
              <option value="Electricity">Electricity (বিদ্যুৎ)</option>
              <option value="Salary">Salary (বেতন)</option>
              <option value="Transport">Transport (পরিবহন)</option>
              <option value="Other">Other Expenses</option>
            </select>
          </div>
          <div>
            <label class="font-bold text-xs">Amount (টাকা) *</label>
            <input name="amount" type="number" step="0.01" required placeholder="0.00" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500">
          </div>
        </div>
        <button type="submit" class="w-full bg-rose-600 hover:bg-rose-700 text-white p-3 rounded-xl font-bold shadow">Save Expense</button>
      </form>`);
  };

  window.nsSaveExpense = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      title: fd.get("title"),
      category: fd.get("category"),
      amount: num(fd.get("amount")),
      created_at: dateTime()
    };

    const { error } = await db.from("expenses").insert(payload);
    if (!error) {
      nsCloseModal();
      toast("খরচের বিবরণ যুক্ত করা হয়েছে!");
      await loadAll();
    } else {
      toast("ত্রুটি: " + error.message, "error");
    }
  };

  function render() {
    const main = document.getElementById("main-content");
    if (!main) return;
    main.innerHTML = accountsView();
  }

  loadAll();
})();
