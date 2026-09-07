/* =========================================================
   NAMITA STORE - PHASE 4: LEDGER, REPORTS & CUSTOMERS
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
  let currentTab = "ledger";
  let customers = [], sales = [];

  async function safeSelect(table) {
    try {
      const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false });
      return error ? [] : (data || []);
    } catch { return []; }
  }

  async function loadAll() {
    [customers, sales] = await Promise.all([
      safeSelect("customers"), safeSelect("sales")
    ]);
    render();
  }

  window.switchTab = (tab) => {
    currentTab = tab;
    render();
  };

  /* VIEWS */
  function ledgerView() {
    const totalDue = customers.reduce((a, b) => a + num(b.due_amount), 0);

    return `
      <div class="space-y-6">
        <div class="flex justify-between items-center border-b pb-3">
          <h2 class="text-2xl font-bold text-slate-800">👥 Customer Ledger & Due Management</h2>
          <button onclick="window.nsAddCustomer()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow">+ Add Customer</button>
        </div>

        <div class="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex justify-between items-center">
          <div>
            <div class="text-xs font-bold text-amber-800 uppercase">মোট বাজারের বাকি (Total Customer Due)</div>
            <div class="text-2xl font-bold text-amber-900 mt-1">${money(totalDue)}</div>
          </div>
        </div>

        <div class="bg-white border rounded-2xl overflow-x-auto shadow-sm p-4">
          <h3 class="font-bold text-lg mb-3 text-slate-800 border-b pb-2">Customer List</h3>
          <table class="w-full text-sm text-left text-slate-700">
            <thead class="bg-slate-50 border-b">
              <tr>
                <th class="p-3">নাম</th>
                <th class="p-3">ফোন নম্বর</th>
                <th class="p-3">ঠিকানা</th>
                <th class="p-3 text-right">বাকি পরিমাণ</th>
                <th class="p-3 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              ${customers.length === 0 ? '<tr><td colspan="5" class="p-4 text-center text-slate-400">কোনো কাস্টমার যুক্ত করা হয়নি</td></tr>' : customers.map(c => `
                <tr class="border-b hover:bg-slate-50">
                  <td class="p-3 font-bold text-slate-800">${esc(c.name)}</td>
                  <td class="p-3 text-slate-600">${esc(c.phone || "N/A")}</td>
                  <td class="p-3 text-slate-500">${esc(c.address || "N/A")}</td>
                  <td class="p-3 text-right font-bold ${num(c.due_amount) > 0 ? 'text-red-600' : 'text-emerald-600'}">${money(c.due_amount)}</td>
                  <td class="p-3 text-center">
                    <button onclick="window.nsCollectDue('${c.id}', '${esc(c.name)}', ${num(c.due_amount)})" class="bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold transition">পেমেন্ট গ্রহণ</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /* ACTIONS */
  window.nsAddCustomer = () => {
    modal("নতুন কাস্টমার যুক্ত করুন", `
      <form onsubmit="window.nsSaveCustomer(event)" class="space-y-4">
        <div>
          <label class="font-bold text-xs">Customer Name *</label>
          <input name="name" required placeholder="কাস্টমারের নাম" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500">
        </div>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="font-bold text-xs">Phone Number</label>
            <input name="phone" placeholder="017xxxxxxxx" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500">
          </div>
          <div>
            <label class="font-bold text-xs">Opening Due (বাকি থাকলে)</label>
            <input name="due_amount" type="number" step="0.01" placeholder="0.00" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500">
          </div>
        </div>
        <div>
          <label class="font-bold text-xs">Address</label>
          <textarea name="address" rows="2" placeholder="ঠিকানা" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500"></textarea>
        </div>
        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-bold shadow">Save Customer</button>
      </form>`);
  };

  window.nsSaveCustomer = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get("name"),
      phone: fd.get("phone"),
      address: fd.get("address"),
      due_amount: num(fd.get("due_amount")),
      created_at: dateTime()
    };

    const { error } = await db.from("customers").insert(payload);
    if (!error) {
      nsCloseModal();
      toast("কাস্টমার যুক্ত হয়েছে!");
      await loadAll();
    } else {
      toast("ত্রুটি: " + error.message, "error");
    }
  };

  window.nsCollectDue = (id, name, currentDue) => {
    modal(`বাকি আদায়: ${name}`, `
      <form onsubmit="window.nsProcessDuePayment(event, '${id}', ${currentDue})" class="space-y-4">
        <div class="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
          <div>কাস্টমার: <b>${name}</b></div>
          <div>বর্তমান বাকি: <b class="text-red-600">${money(currentDue)}</b></div>
        </div>
        <div>
          <label class="font-bold text-xs">জমা দেওয়ার পরিমাণ (₹) *</label>
          <input name="amount" type="number" max="${currentDue}" step="0.01" required placeholder="0.00" class="w-full border rounded-xl p-2.5 mt-1 focus:outline-indigo-500">
        </div>
        <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold shadow">টাকা জমা নিন</button>
      </form>`, "max-w-md");
  };

  window.nsProcessDuePayment = async (e, id, currentDue) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payAmt = num(fd.get("amount"));
    const newDue = Math.max(0, currentDue - payAmt);

    const { error } = await db.from("customers").update({ due_amount: newDue }).eq("id", id);
    if (!error) {
      nsCloseModal();
      toast("বাকি পেমেন্ট গ্রহণ করা হয়েছে!");
      await loadAll();
    } else {
      toast("ত্রুটি: " + error.message, "error");
    }
  };

  function render() {
    const main = document.getElementById("main-content");
    if (!main) return;
    main.innerHTML = ledgerView();
  }

  loadAll();
})();
