"use strict";

const SUPABASE_URL = "https://ekcgmtusasqziirkohd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_A2fNVKm3AGDq25-UroB-4Q_V3mcLrUO";

// Supabase client initialization
const { createClient } = window.supabase || supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = s => document.querySelector(s);
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const esc = x => String(x ?? "").replace(/[&<>"']/g, c =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));

let page = "dashboard";
let products = [];
let customers = [];
let suppliers = [];
let cart = [];

async function load() {
  const p = await db.from("products").select("*").order("created_at", { ascending: false });
  const c = await db.from("customers").select("*").order("created_at", { ascending: false });
  const s = await db.from("suppliers").select("*").order("created_at", { ascending: false });

  if (p.error || c.error || s.error) {
    console.error(p.error || c.error || s.error);
    alert("Supabase সংযোগ বা Database policy সমস্যা হয়েছে।");
    return;
  }

  products = p.data || [];
  customers = c.data || [];
  suppliers = s.data || [];
  render();
}

function layout() {
  $("#app").innerHTML = `
    <div class="flex flex-col md:flex-row min-h-screen">
      <aside class="w-full md:w-64 bg-teal-800 text-white p-4">
        <h1 class="text-xl font-bold text-center mb-5">NAMITA STORE</h1>
        <div class="flex flex-col gap-1">
          ${[
            ["dashboard","📊 Dashboard"],
            ["products","📦 Products"],
            ["sales","🧾 POS Sales"],
            ["customers","👥 Customers"],
            ["suppliers","🏭 Suppliers"]
          ].map(x => `
            <button data-page="${x[0]}"
              class="w-full text-left p-3 rounded hover:bg-teal-700 transition">
              ${x[1]}
            </button>`).join("")}
        </div>
      </aside>

      <main class="flex-1 bg-slate-100">
        <header class="bg-white p-4 border-b shadow-sm">
          <h2 id="title" class="font-bold text-xl text-slate-800"></h2>
        </header>
        <section id="content" class="p-5"></section>
      </main>
    </div>

    <div id="modal" class="hidden fixed inset-0 bg-black/60 items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl p-5 w-full max-w-lg shadow-2xl">
        <div class="flex justify-between items-center border-b pb-3">
          <h2 id="modalTitle" class="font-bold text-xl"></h2>
          <button data-action="close" class="text-2xl font-bold text-slate-500 hover:text-black">×</button>
        </div>
        <div id="modalBody" class="mt-4"></div>
      </div>
    </div>`;
}

function modal(title, html) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = html;
  $("#modal").className = "fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50";
}

function closeModal() {
  $("#modal").className = "hidden";
}

function dashboard() {
  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-sm border">
        <small class="text-slate-500 font-semibold">মোট পণ্য</small>
        <b class="text-2xl block text-slate-800 mt-1">${products.length}</b>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border">
        <small class="text-slate-500 font-semibold">Customer</small>
        <b class="text-2xl block text-slate-800 mt-1">${customers.length}</b>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border">
        <small class="text-slate-500 font-semibold">Supplier</small>
        <b class="text-2xl block text-slate-800 mt-1">${suppliers.length}</b>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border">
        <small class="text-slate-500 font-semibold">Low Stock</small>
        <b class="text-2xl block text-red-600 mt-1">
          ${products.filter(p => Number(p.stock) <= Number(p.minimum_stock || 0)).length}
        </b>
      </div>
    </div>`;
}

function productsPage() {
  return `
    <div class="bg-white rounded-xl p-5 shadow-sm border">
      <div class="flex items-center mb-4">
        <h2 class="font-bold text-xl mr-auto">Products List</h2>
        <button data-action="add-product"
          class="bg-teal-700 text-white px-4 py-2 rounded hover:bg-teal-800 transition">
          ＋ Add Product
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-100 border-b">
              <th class="p-3">Name</th>
              <th class="p-3">SKU</th>
              <th class="p-3">Sale Price</th>
              <th class="p-3">Stock</th>
              <th class="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            ${products.length ? products.map(p => `
              <tr class="border-b hover:bg-slate-50">
                <td class="p-3 font-medium">${esc(p.name)}</td>
                <td class="p-3 text-slate-600">${esc(p.sku)}</td>
                <td class="p-3 font-semibold">${money(p.sale_price)}</td>
                <td class="p-3">${p.stock}</td>
                <td class="p-3">
                  <button data-action="delete-product" data-id="${p.id}"
                    class="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>`).join("") : `<tr><td colspan="5" class="p-4 text-center text-slate-500">কোনো পণ্য পাওয়া যায়নি।</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
}

function salesPage() {
  return `
    <div class="grid md:grid-cols-2 gap-5">
      <div class="bg-white rounded-xl p-5 shadow-sm border">
        <h2 class="font-bold text-xl mb-3">Products</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${products.map(p => `
            <button data-action="add-cart" data-id="${p.id}"
              class="border rounded-lg p-3 text-left hover:border-teal-600 hover:bg-teal-50 transition">
              <div class="font-semibold">${esc(p.name)}</div>
              <div class="text-sm text-slate-600">${money(p.sale_price)} | Stock: ${p.stock}</div>
            </button>`).join("")}
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border">
        <h2 class="font-bold text-xl mb-3">Cart</h2>
        <div id="cart" class="min-h-[150px]"></div>
        <button data-action="complete-sale"
          class="w-full bg-green-600 text-white p-3 rounded-lg font-bold mt-4 hover:bg-green-700 transition">
          Complete Sale
        </button>
      </div>
    </div>`;
}

function renderCart() {
  if (!$("#cart")) return;

  const total = cart.reduce((a, x) => a + x.price * x.qty, 0);

  $("#cart").innerHTML = cart.length
    ? cart.map(x => `
      <div class="border-b py-2 flex justify-between items-center">
        <span>${esc(x.name)} × ${x.qty}</span>
        <b class="text-slate-800">${money(x.price * x.qty)}</b>
      </div>`).join("") + `<div class="mt-3 text-right text-lg"><b>Total: ${money(total)}</b></div>`
    : `<p class="text-slate-400 py-4 text-center">Cart খালি।</p>`;
}

function people(type) {
  const list = type === "Customer" ? customers : suppliers;

  return `
    <div class="bg-white rounded-xl p-5 shadow-sm border">
      <div class="flex items-center mb-4">
        <h2 class="font-bold text-xl mr-auto">${type}s</h2>
        <button data-action="add-person" data-type="${type}"
          class="bg-teal-700 text-white px-4 py-2 rounded hover:bg-teal-800 transition">
          ＋ Add ${type}
        </button>
      </div>
      <div class="divide-y">
        ${list.length ? list.map(x => `
          <div class="py-3 flex justify-between">
            <span class="font-medium">${esc(x.name)}</span>
            <span class="text-slate-500">${esc(x.phone || "No Phone")}</span>
          </div>`).join("") : `<p class="text-slate-400 text-center py-4">কোনো তথ্য নেই।</p>`}
      </div>
    </div>`;
}

function render() {
  const titles = {
    dashboard: "Dashboard",
    products: "Products",
    sales: "POS Sales",
    customers: "Customers",
    suppliers: "Suppliers"
  };

  $("#title").textContent = titles[page];

  const views = {
    dashboard,
    products: productsPage,
    sales: salesPage,
    customers: () => people("Customer"),
    suppliers: () => people("Supplier")
  };

  $("#content").innerHTML = views[page]();
  if (page === "sales") renderCart();
}

document.addEventListener("click", async e => {
  const pageBtn = e.target.closest("[data-page]");
  if (pageBtn) {
    page = pageBtn.dataset.page;
    render();
    return;
  }

  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  if (btn.dataset.action === "close") closeModal();

  if (btn.dataset.action === "add-product") {
    modal("Add Product", `
      <form id="productForm" class="flex flex-col gap-3">
        <input name="name" placeholder="Product Name" class="border p-2 rounded w-full" required>
        <input name="sku" placeholder="SKU" class="border p-2 rounded w-full" required>
        <input name="price" type="number" step="any" placeholder="Sale Price" class="border p-2 rounded w-full" required>
        <input name="stock" type="number" placeholder="Stock" class="border p-2 rounded w-full" required>
        <input name="minimum" type="number" value="5" placeholder="Minimum Stock" class="border p-2 rounded w-full">
        <button class="bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 transition mt-2">
          Save Product
        </button>
      </form>`);
  }

  if (btn.dataset.action === "delete-product") {
    if (!confirm("আপনি কি নিশ্চিত এই Product-টি মুছে ফেলতে চান?")) return;
    await db.from("products").delete().eq("id", btn.dataset.id);
    await load();
  }

  if (btn.dataset.action === "add-cart") {
    const p = products.find(x => String(x.id) === String(btn.dataset.id));
    if (!p || Number(p.stock) < 1) return alert("Stock নেই।");

    const old = cart.find(x => String(x.id) === String(p.id));
    if (old) old.qty++;
    else cart.push({
      id: p.id,
      name: p.name,
      price: Number(p.sale_price),
      qty: 1
    });

    renderCart();
  }

  if (btn.dataset.action === "complete-sale") {
    if (!cart.length) return alert("Cart খালি।");

    const total = cart.reduce((a, x) => a + x.price * x.qty, 0);

    const sale = await db.from("sales").insert({
      invoice_no: "INV-" + Date.now(),
      total,
      subtotal: total,
      paid: total,
      due: 0,
      payment_method: "Cash"
    }).select().single();

    if (sale.error) {
      console.error(sale.error);
      return alert("Sale সংরক্ষণ হয়নি। Supabase RLS Policy চেক করুন।");
    }

    for (const x of cart) {
      const p = products.find(y => String(y.id) === String(x.id));
      if (p) {
        await db.from("products")
          .update({ stock: Number(p.stock) - x.qty })
          .eq("id", x.id);
      }

      await db.from("sale_items").insert({
        sale_id: sale.data.id,
        product_id: x.id,
        quantity: x.qty,
        price: x.price,
        total: x.qty * x.price
      });
    }

    cart = [];
    await load();
    alert("Sale সফলভাবে সংরক্ষণ হয়েছে!");
  }

  if (btn.dataset.action === "add-person") {
    modal("Add " + btn.dataset.type, `
      <form id="personForm" class="flex flex-col gap-3">
        <input name="name" placeholder="Name" class="border p-2 rounded w-full" required>
        <input name="phone" placeholder="Phone" class="border p-2 rounded w-full">
        <input name="address" placeholder="Address" class="border p-2 rounded w-full">
        <input type="hidden" name="type" value="${btn.dataset.type}">
        <button class="bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 transition mt-2">
          Save
        </button>
      </form>`);
  }
});

document.addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target);

  if (e.target.id === "productForm") {
    const { error } = await db.from("products").insert({
      name: f.get("name"),
      sku: f.get("sku"),
      sale_price: Number(f.get("price")),
      mrp: Number(f.get("price")),
      stock: Number(f.get("stock")),
      minimum_stock: Number(f.get("minimum") || 5)
    });

    if (error) {
      alert("পণ্য যোগ করা সম্ভব হয়নি: " + error.message);
    } else {
      closeModal();
      await load();
    }
  }

  if (e.target.id === "personForm") {
    const table = f.get("type") === "Customer" ? "customers" : "suppliers";

    const { error } = await db.from(table).insert({
      name: f.get("name"),
      phone: f.get("phone"),
      address: f.get("address")
    });

    if (error) {
      alert("তথ্য সেভ করা সম্ভব হয়নি: " + error.message);
    } else {
      closeModal();
      await load();
    }
  }
});

// App Initialization
layout();
load();
