"use strict";

const SUPABASE_URL = "https://ekcgmmtusasqziirkohd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_A2fNVKm3AGDq25-UroB-4Q_V3mcLrUO";

const { createClient } = window.supabase || supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = s => document.querySelector(s);
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const esc = x => String(x ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[c]));

let page = "dashboard";
let products = [];
let customers = [];
let suppliers = [];
let cart = [];
let selectedCustomer = "";

async function load() {
  const p = await db.from("products").select("*").order("created_at", { ascending: false });
  const c = await db.from("customers").select("*").order("created_at", { ascending: false });
  const s = await db.from("suppliers").select("*").order("created_at", { ascending: false });

  products = p.data || [];
  customers = c.data || [];
  suppliers = s.data || [];
  render();
}

function nav(p) {
  page = p;
  render();
}

function render() {
  const root = $("#app");
  root.innerHTML = `
    <div class="min-h-screen flex flex-col md:flex-row bg-slate-100 text-slate-800">
      <aside class="w-full md:w-64 bg-slate-900 text-white p-4 space-y-4">
        <h1 class="text-xl font-bold border-b border-slate-700 pb-3">NAMITA STORE</h1>
        <nav class="space-y-2">
          <button onclick="nav('dashboard')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 ${page==='dashboard'?'bg-slate-800 font-bold':''}">📊 Dashboard</button>
          <button onclick="nav('products')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 ${page==='products'?'bg-slate-800 font-bold':''}">📦 Products</button>
          <button onclick="nav('pos')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 ${page==='pos'?'bg-slate-800 font-bold':''}">🧾 POS Sales</button>
          <button onclick="nav('customers')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 ${page==='customers'?'bg-slate-800 font-bold':''}">👥 Customers (খাতা)</button>
          <button onclick="nav('suppliers')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 ${page==='suppliers'?'bg-slate-800 font-bold':''}">🚚 Suppliers (সাপ্লায়ার)</button>
        </nav>
      </aside>
      <main class="flex-1 p-4 md:p-8">${view()}</main>
    </div>
  `;
}

function view() {
  if (page === "dashboard") {
    const totalProd = products.length;
    const totalStock = products.reduce((a, b) => a + Number(b.stock || 0), 0);
    const lowStock = products.filter(p => p.stock <= 5).length;

    return `
      <h2 class="text-2xl font-bold mb-4">Dashboard Overview</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white p-4 rounded shadow">
          <p class="text-gray-500 text-sm">Total Products</p>
          <h3 class="text-2xl font-bold">${totalProd}</h3>
        </div>
        <div class="bg-white p-4 rounded shadow">
          <p class="text-gray-500 text-sm">Total Stock Quantity</p>
          <h3 class="text-2xl font-bold">${totalStock}</h3>
        </div>
        <div class="bg-white p-4 rounded shadow">
          <p class="text-gray-500 text-sm">Low Stock Alert (<= 5)</p>
          <h3 class="text-2xl font-bold text-red-600">${lowStock}</h3>
        </div>
      </div>
    `;
  }

  if (page === "products") {
    return `
      <h2 class="text-2xl font-bold mb-4">Product Management</h2>
      <form onsubmit="addProduct(event)" class="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input id="p_name" placeholder="Product Name" required class="border p-2 rounded w-full" />
        <input id="p_price" type="number" step="0.01" placeholder="Sale Price (₹)" required class="border p-2 rounded w-full" />
        <input id="p_stock" type="number" placeholder="Stock Qty" required class="border p-2 rounded w-full" />
        <button class="bg-indigo-600 text-white rounded p-2 hover:bg-indigo-700 font-bold">+ Add Product</button>
      </form>
      <div class="bg-white rounded shadow overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-100 border-b">
              <th class="p-3">Name</th>
              <th class="p-3">Price</th>
              <th class="p-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr class="border-b">
                <td class="p-3 font-semibold">${esc(p.name)}</td>
                <td class="p-3">${money(p.price)}</td>
                <td class="p-3 ${p.stock <= 5 ? 'text-red-600 font-bold' : ''}">${p.stock}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (page === "pos") {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return `
      <h2 class="text-2xl font-bold mb-4">POS Terminal</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 bg-white p-4 rounded shadow">
          <h3 class="font-bold text-lg mb-3">Products</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            ${products.map(p => `
              <div onclick="addToCart('${p.id}')" class="border p-3 rounded cursor-pointer hover:border-indigo-600 bg-slate-50">
                <p class="font-bold">${esc(p.name)}</p>
                <p class="text-sm text-gray-600">${money(p.price)}</p>
                <p class="text-xs ${p.stock <= 5 ? 'text-red-500' : 'text-gray-400'}">Stock: ${p.stock}</p>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="bg-white p-4 rounded shadow flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-lg mb-3">Cart</h3>
            <div class="mb-3">
              <label class="block text-xs font-bold text-gray-600 mb-1">কাস্টমার সিলেক্ট করুন:</label>
              <select onchange="selectedCustomer=this.value" class="w-full border p-2 rounded text-sm">
                <option value="">সাধারণ কাস্টমার (Cash)</option>
                ${customers.map(c => `<option value="${esc(c.name)}">${esc(c.name)} (${esc(c.phone || 'No Phone')})</option>`).join('')}
              </select>
            </div>
            <div class="space-y-2 max-h-48 overflow-y-auto border-t pt-2">
              ${cart.length === 0 ? '<p class="text-gray-400 text-sm">Cart is empty</p>' : ''}
              ${cart.map(item => `
                <div class="flex justify-between items-center text-sm border-b pb-1">
                  <div>
                    <p class="font-bold">${esc(item.name)}</p>
                    <p class="text-xs text-gray-500">${money(item.price)} x ${item.quantity}</p>
                  </div>
                  <p class="font-bold">${money(item.price * item.quantity)}</p>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="border-t pt-4 mt-4">
            <div class="flex justify-between font-bold text-xl mb-4">
              <span>Total:</span>
              <span>${money(total)}</span>
            </div>
            <button onclick="completeSale()" class="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700">Complete Sale & Print</button>
          </div>
        </div>
      </div>
    `;
  }

  if (page === "customers") {
    return `
      <h2 class="text-2xl font-bold mb-4">Customer Management (খাতা)</h2>
      <form onsubmit="addCustomer(event)" class="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input id="c_name" placeholder="Customer Name" required class="border p-2 rounded w-full" />
        <input id="c_phone" placeholder="Phone Number" class="border p-2 rounded w-full" />
        <button class="bg-indigo-600 text-white rounded p-2 hover:bg-indigo-700 font-bold">+ Add Customer</button>
      </form>
      <div class="bg-white rounded shadow overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-100 border-b">
              <th class="p-3">Name</th>
              <th class="p-3">Phone</th>
            </tr>
          </thead>
          <tbody>
            ${customers.length === 0 ? '<tr><td colspan="2" class="p-3 text-gray-400">No customers found</td></tr>' : ''}
            ${customers.map(c => `
              <tr class="border-b">
                <td class="p-3 font-semibold">${esc(c.name)}</td>
                <td class="p-3">${esc(c.phone || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (page === "suppliers") {
    return `
      <h2 class="text-2xl font-bold mb-4">Supplier Management</h2>
      <form onsubmit="addSupplier(event)" class="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input id="s_name" placeholder="Supplier / Company Name" required class="border p-2 rounded w-full" />
        <input id="s_phone" placeholder="Phone Number" class="border p-2 rounded w-full" />
        <button class="bg-indigo-600 text-white rounded p-2 hover:bg-indigo-700 font-bold">+ Add Supplier</button>
      </form>
      <div class="bg-white rounded shadow overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-100 border-b">
              <th class="p-3">Company Name</th>
              <th class="p-3">Phone</th>
            </tr>
          </thead>
          <tbody>
            ${suppliers.length === 0 ? '<tr><td colspan="2" class="p-3 text-gray-400">No suppliers found</td></tr>' : ''}
            ${suppliers.map(s => `
              <tr class="border-b">
                <td class="p-3 font-semibold">${esc(s.name)}</td>
                <td class="p-3">${esc(s.phone || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

async function addProduct(e) {
  e.preventDefault();
  const name = $("#p_name").value;
  const price = parseFloat($("#p_price").value);
  const stock = parseInt($("#p_stock").value);

  const { data, error } = await db.from("products").insert([{ name, price, stock }]).select();
  if (error) alert("Error adding product");
  else {
    products.unshift(data[0]);
    render();
  }
}

async function addCustomer(e) {
  e.preventDefault();
  const name = $("#c_name").value;
  const phone = $("#c_phone").value;

  const { data, error } = await db.from("customers").insert([{ name, phone }]).select();
  if (error) alert("Error adding customer");
  else {
    customers.unshift(data[0]);
    render();
  }
}

async function addSupplier(e) {
  e.preventDefault();
  const name = $("#s_name").value;
  const phone = $("#s_phone").value;

  const { data, error } = await db.from("suppliers").insert([{ name, phone }]).select();
  if (error) alert("Error adding supplier");
  else {
    suppliers.unshift(data[0]);
    render();
  }
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p || p.stock <= 0) return alert("Out of stock!");
  const existing = cart.find(x => x.id === id);
  if (existing) {
    if (existing.quantity < p.stock) existing.quantity++;
    else alert("Cannot exceed stock level!");
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, quantity: 1 });
  }
  render();
}

async function completeSale() {
  if (cart.length === 0) return alert("Cart empty!");

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const custName = selectedCustomer || "Walk-in Customer";

  const { data: sale, error: saleErr } = await db.from("sales").insert([{ total_amount: total, customer_name: custName }]).select();
  if (saleErr) return alert("Sale error!");

  for (const item of cart) {
    const prod = products.find(p => p.id === item.id);
    if (prod) {
      const newStock = prod.stock - item.quantity;
      await db.from("products").update({ stock: newStock }).eq("id", item.id);
      prod.stock = newStock;
    }
  }

  printInvoice({ customer_name: custName }, [...cart]);

  cart = [];
  selectedCustomer = "";
  render();
}

function printInvoice(saleData, itemsData) {
  const printArea = document.getElementById("print-section");
  if (!printArea) return;

  let itemsRows = "";
  let totalAmount = 0;

  itemsData.forEach((item, index) => {
    const itemTotal = item.quantity * item.price;
    totalAmount += itemTotal;
    itemsRows += `
      <tr>
        <td style="padding: 4px; border-bottom: 1px dashed #ccc;">${index + 1}</td>
        <td style="padding: 4px; border-bottom: 1px dashed #ccc;">${item.name}</td>
        <td style="padding: 4px; border-bottom: 1px dashed #ccc; text-align: center;">${item.quantity}</td>
        <td style="padding: 4px; border-bottom: 1px dashed #ccc; text-align: right;">₹${item.price}</td>
        <td style="padding: 4px; border-bottom: 1px dashed #ccc; text-align: right;">₹${itemTotal}</td>
      </tr>
    `;
  });

  printArea.innerHTML = `
    <div style="font-family: monospace; width: 80mm; padding: 10px; background: #fff; margin: auto;">
      <h2 style="text-align: center; margin: 0; font-size: 18px;">NAMITA STORE</h2>
      <p style="text-align: center; margin: 2px 0; font-size: 12px;">মোবাইল/ক্যাশ মেমো</p>
      <hr style="border-top: 1px dashed #000; margin: 8px 0;" />
      <p style="font-size: 11px; margin: 2px 0;">তারিখ: ${new Date().toLocaleString('bn-IN')}</p>
      <p style="font-size: 11px; margin: 2px 0;">কাস্টমার: ${saleData.customer_name}</p>
      <hr style="border-top: 1px dashed #000; margin: 8px 0;" />
      <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left;">#</th>
            <th style="text-align: left;">আইটেম</th>
            <th style="text-align: center;">পরিমাণ</th>
            <th style="text-align: right;">দর</th>
            <th style="text-align: right;">মোট</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <hr style="border-top: 1px dashed #000; margin: 8px 0;" />
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
        <span>সর্বমোট:</span>
        <span>₹${totalAmount}</span>
      </div>
      <hr style="border-top: 1px dashed #000; margin: 8px 0;" />
      <p style="text-align: center; font-size: 10px; margin-top: 10px;">ধন্যবাদ! আবার আসবেন।</p>
    </div>
  `;

  printArea.classList.remove("hidden");
  window.print();
  printArea.classList.add("hidden");
}

load();
