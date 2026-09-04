"use strict";

const SUPABASE_URL = "https://ekcgmtusasqziirkohd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_A2fNVKm3AGDq25-UroB-4Q_V3mcLrUO";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
  const p = await db.from("products").select("*").order("created_at");
  const c = await db.from("customers").select("*").order("created_at");
  const s = await db.from("suppliers").select("*").order("created_at");

  if (p.error || c.error || s.error) {
    alert("Supabase সংযোগ বা Database policy সমস্যা হয়েছে।");
    console.error(p.error || c.error || s.error);
    return;
  }

  products = p.data || [];
  customers = c.data || [];
  suppliers = s.data || [];
  render();
}

function layout() {
  $("#app").innerHTML = `
    <div class="flex min-h-screen">
      <aside class="w-64 bg-teal-800 text-white p-4">
        <h1 class="text-xl font-bold text-center mb-5">NAMITA STORE</h1>
        ${[
          ["dashboard","📊 Dashboard"],
          ["products","📦 Products"],
          ["sales","🧾 POS Sales"],
          ["customers","👥 Customers"],
          ["suppliers","🏭 Suppliers"]
        ].map(x => `
          <button data-page="${x[0]}"
            class="w-full text-left p-3 rounded hover:bg-teal-700 mb-1">
            ${x[1]}
          </button>`).join("")}
      </aside>

      <main class="flex-1">
        <header class="bg-white p-4 border-b">
          <h2 id="title" class="font-bold text-xl"></h2>
        </header>
        <section id="content" class="p-5"></section>
      </main>
    </div>

    <div id="modal" class="hidden fixed inset-0 bg-black/60
      items-center justify-center p-4">
      <div class="bg-white rounded-xl p-5 w-full max-w-lg">
        <div class="flex justify-between">
          <h2 id="modalTitle" class="font-bold text-xl"></h2>
          <button data-action="close" class="text-2xl">×</button>
        </div>
        <div id="modalBody" class="mt-4"></div>
      </div>
    </div>`;
}

function modal(title, html) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = html;
  $("#modal").className =
    "fixed inset-0 bg-black/60 flex items-center justify-center p-4";
}

function closeModal() {
  $("#modal").className = "hidden";
}

function dashboard() {
  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5">
        <small>মোট পণ্য</small>
        <b class="text-2xl block">${products.length}</b>
      </div>
      <div class="bg-white rounded-xl p-5">
        <small>Customer</small>
        <b class="text-2xl block">${customers.length}</b>
      </div>
      <div class="bg-white rounded-xl p-5">
        <small>Supplier</small>
        <b class="text-2xl block">${suppliers.length}</b>
      </div>
      <div class="bg-white rounded-xl p-5">
        <small>Low Stock</small>
        <b class="text-2xl block">
          ${products.filter(p => p.stock <= p.minimum_stock).length}
        </b>
      </div>
    </div>`;
}

function productsPage() {
  return `
    <div class="bg-white rounded-xl p-5">
      <div class="flex mb-4">
        <h2 class="font-bold text-xl mr-auto">Products</h2>
        <button data-action="add-product"
          class="bg-teal-700 text-white px-4 py-2 rounded">
          ＋ Add Product
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <tr class="bg-slate-100">
            <th class="p-3 text-left">Name</th>
            <th class="p-3 text-left">SKU</th>
            <th class="p-3 text-left">Sale Price</th>
            <th class="p-3 text-left">Stock</th>
            <th class="p-3 text-left">Action</th>
          </tr>
          ${products.map(p => `
            <tr class="border-b">
              <td class="p-3">${esc(p.name)}</td>
              <td class="p-3">${esc(p.sku)}</td>
              <td class="p-3">${money(p.sale_price)}</td>
              <td class="p-3">${p.stock}</td>
              <td class="p-3">
                <button data-action="delete-product" data-id="${p.id}"
                  class="text-red-600">Delete</button>
              </td>
            </tr>`).join("")}
        </table>
      </div>
    </div>`;
}

function salesPage() {
  return `
    <div class="grid md:grid-cols-2 gap-5">
      <div class="bg-white rounded-xl p-5">
        <h2 class="font-bold text-xl mb-3">Products</h2>
        ${products.map(p => `
          <button data-action="add-cart" data-id="${p.id}"
            class="border rounded p-3 m-1 text-left">
            ${esc(p.name)}<br>
            ${money(p.sale_price)} | Stock: ${p.stock}
          </button>`).join("")}
      </div>

      <div class="bg-white rounded-xl p-5">
        <h2 class="font-bold text-xl mb-3">Cart</h2>
        <div id="cart"></div>
        <button data-action="complete-sale"
          class="bg-green-600 text-white p-3 rounded mt-3">
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
      <div class="border-b p-2 flex">
        <span class="mr-auto">${esc(x.name)} × ${x.qty}</span>
        <b>${money(x.price * x.qty)}</b>
      </div>`).join("") + `<hr><b>Total: ${money(total)}</b>`
    : "Cart খালি।";
}

function people(type) {
  const list = type === "Customer" ? customers : suppliers;

  return `
    <div class="bg-white rounded-xl p-5">
      <div class="flex mb-4">
        <h2 class="font-bold text-xl mr-auto">${type}s</h2>
        <button data-action="add-person" data-type="${type}"
          class="bg-teal-700 text-white px-4 py-2 rounded">
          ＋ Add
        </button>
      </div>
      ${list.map(x => `
        <div class="border-b p-3">
          ${esc(x.name)} — ${esc(x.phone || "")}
        </div>`).join("")}
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
      <form id="productForm">
        <input name="name" placeholder="Product Name" required>
        <input name="sku" placeholder="SKU" required>
        <input name="price" type="number" placeholder="Sale Price" required>
        <input name="stock" type="number" placeholder="Stock" required>
        <input name="minimum" type="number" value="5"
          placeholder="Minimum Stock">
        <button class="bg-green-600 text-white p-3 rounded mt-3">
          Save Product
        </button>
      </form>`);
  }

  if (btn.dataset.action === "delete-product") {
    if (!confirm("Product মুছবেন?")) return;
    await db.from("products").delete().eq("id", btn.dataset.id);
    await load();
  }

  if (btn.dataset.action === "add-cart") {
    const p = products.find(x => x.id === btn.dataset.id);
    if (!p || p.stock < 1) return alert("Stock নেই।");

    const old = cart.find(x => x.id === p.id);
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

    if (sale.error) return alert("Sale সংরক্ষণ হয়নি।");

    for (const x of cart) {
      const p = products.find(y => y.id === x.id);
      await db.from("products")
        .update({ stock: Number(p.stock) - x.qty })
        .eq("id", x.id);

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
    alert("Sale সংরক্ষণ হয়েছে।");
  }

  if (btn.dataset.action === "add-person") {
    modal("Add " + btn.dataset.type, `
      <form id="personForm">
        <input name="name" placeholder="Name" required>
        <input name="phone" placeholder="Phone">
        <input name="address" placeholder="Address">
        <input type="hidden" name="type" value="${btn.dataset.type}">
        <button class="bg-green-600 text-white p-3 rounded mt-3">
          Save
        </button>
      </form>`);
  }
});

document.addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target);

  if (e.target.id === "productForm") {
    await db.from("products").insert({
      name: f.get("name"),
      sku: f.get("sku"),
      sale_price: Number(f.get("price")),
      mrp: Number(f.get("price")),
      stock: Number(f.get("stock")),
      minimum_stock: Number(f.get("minimum") || 5)
    });
    closeModal();
    await load();
  }

  if (e.target.id === "personForm") {
    const table = f.get("type") === "Customer"
      ? "customers"
      : "suppliers";

    await db.from(table).insert({
      name: f.get("name"),
      phone: f.get("phone"),
      address: f.get("address")
    });

    closeModal();
    await load();
  }
});

layout();
load();
