(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const KEY = "namita_store_data";
  const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
  const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const esc = x => String(x ?? "").replace(/[&<>"']/g, c =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));

  let data = JSON.parse(localStorage.getItem(KEY) || "null") || {
    store:"NAMITA STORE", phone:"", address:"",
    products:[], customers:[], suppliers:[], sales:[], purchases:[], orders:[]
  };

  ["products","customers","suppliers","sales","purchases","orders"].forEach(k => {
    if (!Array.isArray(data[k])) data[k] = [];
  });

  const save = () => localStorage.setItem(KEY, JSON.stringify(data));
  let current = "dashboard";
  let cart = [];

  const menu = {
    dashboard:"📊 Dashboard",
    products:"📦 Products",
    sales:"🧾 Sales",
    purchase:"📥 Purchase",
    customers:"👥 Customers",
    suppliers:"🏭 Suppliers",
    orders:"🛒 Orders",
    settings:"⚙️ Settings"
  };

  function layout() {
    $("#app").innerHTML = `
      <div class="flex min-h-screen">
        <aside id="side" class="sidebar w-64 p-4 text-white">
          <h1 class="text-xl font-bold text-center">${esc(data.store)}</h1>
          <p class="text-center border-b border-white/30 pb-4 mb-4">
            Inventory System
          </p>
          <nav class="space-y-1">
            ${Object.entries(menu).map(([key,value]) => `
              <button data-page="${key}" class="nav-btn w-full text-left p-3 rounded-lg">
                ${value}
              </button>`).join("")}
          </nav>
        </aside>

        <main class="flex-1">
          <header class="bg-white border-b p-4 flex items-center gap-2">
            <button data-action="menu" class="bg-teal-700 text-white p-2 rounded">☰</button>
            <h2 id="title" class="font-bold text-xl"></h2>
          </header>
          <section id="content" class="p-5"></section>
        </main>
      </div>

      <div id="modal" class="hidden fixed inset-0 bg-black/60 z-50
        items-center justify-center p-4">
        <div class="bg-white rounded-xl p-5 w-full max-w-lg">
          <div class="flex justify-between mb-4">
            <h2 id="modalTitle" class="font-bold text-xl"></h2>
            <button data-action="close" class="text-2xl">×</button>
          </div>
          <div id="modalBody"></div>
        </div>
      </div>`;
  }

  function openModal(title, html) {
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = html;
    $("#modal").className =
      "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4";
  }

  function closeModal() {
    $("#modal").className = "hidden";
  }

  function field(label, name, value="", type="text") {
    return `
      <label class="block mb-3">${label}
        <input name="${name}" type="${type}" value="${esc(value)}">
      </label>`;
  }

  function dashboard() {
    const sales = data.sales.reduce((a,x) => a + Number(x.total || 0), 0);
    return `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card"><small>Total Products</small>
          <b class="text-2xl block">${data.products.length}</b></div>
        <div class="card"><small>Total Sales</small>
          <b class="text-2xl block">${money(sales)}</b></div>
        <div class="card"><small>Customers</small>
          <b class="text-2xl block">${data.customers.length}</b></div>
        <div class="card"><small>Suppliers</small>
          <b class="text-2xl block">${data.suppliers.length}</b></div>
      </div>
      <div class="card">
        <button data-page="products" class="bg-teal-700 text-white p-3 rounded mr-2">
          Add Product
        </button>
        <button data-page="sales" class="bg-blue-600 text-white p-3 rounded">
          New Sale
        </button>
      </div>`;
  }

  function products() {
    return `
      <div class="card">
        <div class="flex items-center mb-4">
          <h2 class="font-bold text-xl mr-auto">Products</h2>
          <button data-action="product-form"
            class="bg-teal-700 text-white p-3 rounded">＋ Add Product</button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <tr class="bg-slate-100">
              <th class="p-3 text-left">Name</th>
              <th class="p-3 text-left">SKU</th>
              <th class="p-3 text-left">Price</th>
              <th class="p-3 text-left">Stock</th>
              <th class="p-3 text-left">Action</th>
            </tr>
            ${data.products.map(p => `
              <tr class="border-b">
                <td class="p-3">${esc(p.name)}</td>
                <td class="p-3">${esc(p.sku)}</td>
                <td class="p-3">${money(p.price)}</td>
                <td class="p-3">${p.stock}</td>
                <td class="p-3">
                  <button data-action="edit-product" data-id="${p.id}"
                    class="text-blue-600 mr-2">Edit</button>
                  <button data-action="delete-product" data-id="${p.id}"
                    class="text-red-600">Delete</button>
                </td>
              </tr>`).join("")}
          </table>
        </div>
      </div>`;
  }

  function productForm(old={}) {
    openModal(old.id ? "Edit Product" : "Add Product", `
      <form id="product-form">
        ${field("Product Name","name",old.name)}
        ${field("SKU","sku",old.sku)}
        ${field("Price","price",old.price,"number")}
        ${field("Stock","stock",old.stock,"number")}
        <button class="bg-green-600 text-white p-3 rounded">Save Product</button>
      </form>`);
  }

  function people(type) {
    const key = type === "Customer" ? "customers" : "suppliers";
    return `
      <div class="card">
        <div class="flex items-center mb-4">
          <h2 class="font-bold text-xl mr-auto">${type}s</h2>
          <button data-action="person-form" data-type="${type}"
            class="bg-teal-700 text-white p-3 rounded">＋ Add ${type}</button>
        </div>
        ${data[key].map(x => `
          <div class="border-b p-3 flex">
            <span class="mr-auto">${esc(x.name)} — ${esc(x.phone)}</span>
            <button data-action="delete-person" data-type="${key}"
              data-id="${x.id}" class="text-red-600">Delete</button>
          </div>`).join("")}
      </div>`;
  }

  function personForm(type) {
    openModal(`Add ${type}`, `
      <form id="person-form">
        ${field("Name","name")}
        ${field("Phone","phone")}
        ${field("Address","address")}
        <input type="hidden" name="type" value="${type}">
        <button class="bg-green-600 text-white p-3 rounded">Save</button>
      </form>`);
  }

  function sales() {
    return `
      <div class="grid md:grid-cols-2 gap-5">
        <div class="card">
          <h2 class="font-bold text-xl mb-3">Products</h2>
          ${data.products.map(p => `
            <button data-action="add-cart" data-id="${p.id}"
              class="border p-3 rounded-lg m-1 text-left">
              ${esc(p.name)}<br>${money(p.price)} | Stock: ${p.stock}
            </button>`).join("")}
        </div>
        <div class="card">
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
    const total = cart.reduce((a,p) => a + p.price * p.qty, 0);
    $("#cart").innerHTML = cart.length
      ? cart.map(p => `
        <div class="border-b p-2 flex">
          <span class="mr-auto">${esc(p.name)} × ${p.qty}</span>
          <b>${money(p.price * p.qty)}</b>
        </div>`).join("") + `<hr><b>Total: ${money(total)}</b>`
      : "<p>Cart খালি।</p>";
  }

  function purchase() {
    return `<div class="card">
      <h2 class="font-bold text-xl mb-3">Purchase</h2>
      <p>Products-এর stock পরিবর্তন করতে Products menu ব্যবহার করুন।</p>
    </div>`;
  }

  function orders() {
    return `<div class="card">
      <h2 class="font-bold text-xl mb-3">Orders</h2>
      <p>এখনও কোনো order নেই।</p>
    </div>`;
  }

  function settings() {
    return `<div class="card">
      <h2 class="font-bold text-xl mb-4">Settings</h2>
      <form id="settings-form">
        ${field("Store Name","store",data.store)}
        ${field("Phone","phone",data.phone)}
        ${field("Address","address",data.address)}
        <button class="bg-teal-700 text-white p-3 rounded">Save Settings</button>
      </form>
    </div>`;
  }

  function render() {
    $("#title").textContent = menu[current];
    document.querySelectorAll(".nav-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.page === current));

    const pages = {
      dashboard, products, sales, purchase,
      customers: () => people("Customer"),
      suppliers: () => people("Supplier"),
      orders, settings
    };

    $("#content").innerHTML = pages[current]();
    if (current === "sales") renderCart();
  }

  document.addEventListener("click", e => {
    const pageButton = e.target.closest("[data-page]");
    if (pageButton) {
      current = pageButton.dataset.page;
      render();
      return;
    }

    const button = e.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const itemId = button.dataset.id;

    if (action === "menu") $("#side").classList.toggle("hidden");
    if (action === "close") closeModal();
    if (action === "product-form") productForm();

    if (action === "edit-product") {
      productForm(data.products.find(p => p.id === itemId));
    }

    if (action === "delete-product") {
      data.products = data.products.filter(p => p.id !== itemId);
      save();
      render();
    }

    if (action === "person-form") personForm(button.dataset.type);

    if (action === "delete-person") {
      data[button.dataset.type] =
        data[button.dataset.type].filter(x => x.id !== itemId);
      save();
      render();
    }

    if (action === "add-cart") {
      const p = data.products.find(x => x.id === itemId);
      if (!p || p.stock < 1) return alert("Stock নেই।");
      const old = cart.find(x => x.id === itemId);
      if (old) old.qty++;
      else cart.push({ id:p.id, name:p.name, price:Number(p.price), qty:1 });
      renderCart();
    }

    if (action === "complete-sale") {
      if (!cart.length) return alert("Cart খালি।");
      const total = cart.reduce((a,p) => a + p.price * p.qty, 0);
      cart.forEach(x => {
        const p = data.products.find(y => y.id === x.id);
        p.stock -= x.qty;
      });
      data.sales.push({ id:id(), date:new Date().toISOString(), total });
      save();
      cart = [];
      render();
      alert("Sale সংরক্ষণ হয়েছে।");
    }
  });

  document.addEventListener("submit", e => {
    e.preventDefault();
    const form = new FormData(e.target);

    if (e.target.id === "product-form") {
      const item = {
        id:id(),
        name:form.get("name"),
        sku:form.get("sku"),
        price:Number(form.get("price") || 0),
        stock:Number(form.get("stock") || 0)
      };
      data.products.push(item);
      save();
      closeModal();
      render();
    }

    if (e.target.id === "person-form") {
      const key = form.get("type") === "Customer" ? "customers" : "suppliers";
      data[key].push({
        id:id(),
        name:form.get("name"),
        phone:form.get("phone"),
        address:form.get("address")
      });
      save();
      closeModal();
      render();
    }

    if (e.target.id === "settings-form") {
      data.store = form.get("store") || "NAMITA STORE";
      data.phone = form.get("phone");
      data.address = form.get("address");
      save();
      layout();
      render();
    }
  });

  layout();
  render();
})();
