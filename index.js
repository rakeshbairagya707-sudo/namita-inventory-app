/* =========================================================
   NAMITA STORE
   ACCOUNTING + BILLING + INVENTORY + E-COMMERCE
   FULL FRONTEND APPLICATION
   Replace the complete old index.js with this file.
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     SUPABASE
     ======================================================= */

  const SUPABASE_URL = "https://ekcgmmtusasqziirkohd.supabase.co";
  const SUPABASE_ANON_KEY =
    "sb_publishable_A2fNVKm3AGDq25-UroB-4Q_V3mcLrUO";

  if (!window.supabase) {
    document.getElementById("app").innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-6">
        <div class="bg-white rounded-2xl shadow p-8 max-w-lg text-center">
          <h2 class="text-2xl font-bold text-red-600 mb-3">
            Supabase লোড হয়নি
          </h2>
          <p class="text-slate-600">
            Internet connection এবং index.html-এর Supabase script পরীক্ষা করুন।
          </p>
        </div>
      </div>
    `;
    return;
  }

  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /* =======================================================
     HELPERS
     ======================================================= */

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const money = (value) =>
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const num = (value) => Number(value || 0);

  const esc = (value) =>
    String(value ?? "").replace(/[&<>'"]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#039;",
      '"': "&quot;",
    }[c]));

  const uid = () =>
    "NS-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.random().toString(36).slice(2, 7).toUpperCase();

  const today = () => new Date().toISOString().slice(0, 10);

  const dateTime = () => new Date().toISOString();

  const salePrice = (p) =>
    num(p?.sale_price ?? p?.price ?? p?.mrp ?? 0);

  const purchasePrice = (p) =>
    num(p?.purchase_price ?? 0);

  const stockQty = (p) => num(p?.stock ?? 0);

  function toast(message, type = "success") {
    const old = document.getElementById("ns-toast");
    if (old) old.remove();

    const color =
      type === "error"
        ? "bg-red-600"
        : type === "warning"
        ? "bg-amber-500"
        : "bg-emerald-600";

    const div = document.createElement("div");
    div.id = "ns-toast";
    div.className =
      "fixed right-5 bottom-5 z-[9999] px-5 py-3 rounded-xl text-white shadow-2xl " +
      color;

    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => div.remove(), 3000);
  }

  function modal(title, content, size = "max-w-3xl") {
    const old = document.getElementById("ns-modal");
    if (old) old.remove();

    const div = document.createElement("div");
    div.id = "ns-modal";
    div.className =
      "fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4";

    div.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[92vh] overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-xl font-bold">${esc(title)}</h3>
          <button onclick="window.nsCloseModal()"
            class="text-2xl text-slate-500 hover:text-red-600">
            ×
          </button>
        </div>

        <div class="p-5 overflow-y-auto max-h-[calc(92vh-70px)]">
          ${content}
        </div>
      </div>
    `;

    document.body.appendChild(div);
  }

  window.nsCloseModal = function () {
    const m = document.getElementById("ns-modal");
    if (m) m.remove();
  };

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
      </div>
    `;
  }

  function emptyState(message = "কোনো তথ্য পাওয়া যায়নি") {
    return `
      <div class="bg-white rounded-2xl border p-10 text-center text-slate-500">
        <div class="text-4xl mb-3">📭</div>
        <div>${esc(message)}</div>
      </div>
    `;
  }

  function sectionHeader(title, subtitle, buttonText = "", buttonAction = "") {
    return `
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h2 class="text-2xl font-bold">${title}</h2>
          <p class="text-sm text-slate-500 mt-1">${subtitle || ""}</p>
        </div>

        ${
          buttonText
            ? `
          <button onclick="${buttonAction}"
            class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold">
            + ${buttonText}
          </button>
        `
            : ""
        }
      </div>
    `;
  }

  /* =======================================================
     APP STATE
     ======================================================= */

  let page = "dashboard";

  let products = [];
  let customers = [];
  let suppliers = [];
  let categories = [];
  let brands = [];
  let sales = [];
  let purchases = [];
  let expenses = [];
  let incomes = [];
  let payments = [];
  let onlineOrders = [];
  let warehouses = [];

  let cart = [];
  let selectedCustomer = "";

  let businessSettings = {
    business_name: "NAMITA STORE",
    phone: "",
    address: "",
    email: "",
    gstin: "",
    currency: "₹",
  };

  /* =======================================================
     DATABASE LOAD
     ======================================================= */

  async function safeSelect(table, queryBuilder) {
    try {
      const query = queryBuilder
        ? queryBuilder(db.from(table))
        : db.from(table).select("*");

      const { data, error } = await query;

      if (error) {
        console.warn(table, error);
        return [];
      }

      return data || [];
    } catch (e) {
      console.warn(table, e);
      return [];
    }
  }

  async function loadAll() {
    try {
      [
        products,
        customers,
        suppliers,
        categories,
        brands,
        sales,
        purchases,
        expenses,
        incomes,
        payments,
        onlineOrders,
        warehouses,
      ] = await Promise.all([
        safeSelect("products", (q) =>
          q.select("*").order("created_at", { ascending: false })
        ),

        safeSelect("customers", (q) =>
          q.select("*").order("created_at", { ascending: false })
        ),

        safeSelect("suppliers", (q) =>
          q.select("*").order("created_at", { ascending: false })
        ),

        safeSelect("categories", (q) =>
          q.select("*").order("name")
        ),

        safeSelect("brands", (q) =>
          q.select("*").order("name")
        ),

        safeSelect("sales", (q) =>
          q.select("*").order("created_at", { ascending: false }).limit(500)
        ),

        safeSelect("purchases", (q) =>
          q.select("*").order("created_at", { ascending: false }).limit(500)
        ),

        safeSelect("expenses", (q) =>
          q.select("*").order("created_at", { ascending: false }).limit(500)
        ),

        safeSelect("income", (q) =>
          q.select("*").order("created_at", { ascending: false }).limit(500)
        ),

        safeSelect("payments", (q) =>
          q.select("*").order("created_at", { ascending: false }).limit(500)
        ),

        safeSelect("online_orders", (q) =>
          q.select("*").order("created_at", { ascending: false }).limit(500)
        ),

        safeSelect("warehouses", (q) =>
          q.select("*").order("created_at")
        ),
      ]);

      try {
        const { data } = await db
          .from("business_settings")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (data) businessSettings = { ...businessSettings, ...data };
      } catch (_) {}

      render();
    } catch (error) {
      console.error(error);
      toast("ডেটা লোড করতে সমস্যা হয়েছে", "error");
    }
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const menuGroups = [
    {
      title: "MAIN",
      items: [
        ["dashboard", "📊", "Dashboard"],
      ],
    },

    {
      title: "SALES",
      items: [
        ["pos", "🔥", "POS Billing"],
        ["sales", "🧾", "Sales History"],
        ["salesReturn", "↩️", "Sales Return"],
        ["customerPayment", "💰", "Payment Collection"],
      ],
    },

    {
      title: "INVENTORY",
      items: [
        ["products", "📦", "Products"],
        ["categories", "🗂️", "Categories"],
        ["brands", "🏷️", "Brands"],
        ["variants", "🔹", "Product Variants"],
        ["stock", "📊", "Stock Management"],
        ["stockAdjustment", "🛠️", "Stock Adjustment"],
        ["stockTransfer", "🔄", "Stock Transfer"],
        ["stockHistory", "📜", "Stock History"],
        ["lowStock", "⚠️", "Low Stock"],
      ],
    },

    {
      title: "PURCHASE",
      items: [
        ["purchase", "🛒", "New Purchase"],
        ["purchaseHistory", "📋", "Purchase History"],
        ["purchaseReturn", "↩️", "Purchase Return"],
        ["purchaseOrders", "📝", "Purchase Orders"],
        ["supplierPayment", "💳", "Supplier Payment"],
      ],
    },

    {
      title: "PARTIES",
      items: [
        ["customers", "👥", "Customers"],
        ["customerDue", "⚠️", "Customer Due"],
        ["suppliers", "🚚", "Suppliers"],
        ["supplierDue", "⚠️", "Supplier Due"],
      ],
    },

    {
      title: "ACCOUNTING",
      items: [
        ["accounts", "📒", "Accounts"],
        ["accountGroups", "📚", "Account Groups"],
        ["cashBank", "💵", "Cash & Bank"],
        ["cashTransfer", "🔁", "Cash/Bank Transfer"],
        ["income", "➕", "Income"],
        ["expenses", "➖", "Expenses"],
        ["journal", "📓", "Journal Entry"],
        ["ledger", "📖", "Ledger"],
        ["trialBalance", "⚖️", "Trial Balance"],
        ["profitLoss", "📈", "Profit & Loss"],
        ["balanceSheet", "🏦", "Balance Sheet"],
      ],
    },

    {
      title: "REPORTS",
      items: [
        ["salesReport", "📊", "Sales Report"],
        ["purchaseReport", "📊", "Purchase Report"],
        ["stockReport", "📦", "Stock Report"],
        ["dueReport", "⚠️", "Due Report"],
        ["expenseReport", "💸", "Expense Report"],
        ["incomeReport", "💰", "Income Report"],
        ["profitReport", "📈", "Profit Report"],
        ["dayBook", "📅", "Day Book"],
      ],
    },

    {
      title: "E-COMMERCE",
      items: [
        ["ecommerceProducts", "🛍️", "Online Products"],
        ["productImages", "🖼️", "Product Images"],
        ["onlineOrders", "📦", "Online Orders"],
        ["onlinePayments", "💳", "Online Payments"],
        ["shipping", "🚚", "Shipping"],
        ["orderTracking", "📍", "Order Tracking"],
        ["onlineReturns", "↩️", "Online Returns"],
        ["wishlist", "❤️", "Wishlist"],
      ],
    },

    {
      title: "TOOLS",
      items: [
        ["barcode", "🔳", "Barcode Generator"],
        ["barcodeTemplates", "🏷️", "Barcode Templates"],
        ["invoiceTemplates", "🧾", "Invoice Templates"],
      ],
    },

    {
      title: "SYSTEM",
      items: [
        ["users", "👤", "Users & Permissions"],
        ["activity", "📝", "Activity Log"],
        ["notifications", "🔔", "Notifications"],
        ["settings", "⚙️", "Settings"],
      ],
    },
  ];

  function renderSidebar() {
    return `
      <aside id="ns-sidebar"
        class="fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white
               transform -translate-x-full md:translate-x-0 transition-transform
               overflow-y-auto">

        <div class="p-5 border-b border-slate-800">
          <div class="text-2xl font-black tracking-wide">NAMITA STORE</div>
          <div class="text-xs text-slate-400 mt-1">
            Accounting • Billing • Inventory
          </div>
        </div>

        <div class="p-3">
          ${menuGroups
            .map(
              (group) => `
            <div class="mb-5">
              <div class="text-[10px] font-bold tracking-widest text-slate-500 px-3 mb-2">
                ${group.title}
              </div>

              ${group.items
                .map(
                  ([id, icon, label]) => `
                <button
                  onclick="window.nsGo('${id}')"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1
                  ${
                    page === id
                      ? "bg-emerald-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }">
                  <span class="w-6 text-center">${icon}</span>
                  <span>${label}</span>
                </button>
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}
        </div>
      </aside>
    `;
  }

  window.nsToggleSidebar = function () {
    const s = document.getElementById("ns-sidebar");
    if (!s) return;

    s.classList.toggle("-translate-x-full");
  };

  window.nsGo = function (p) {
    page = p;
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();

    const sidebar = document.getElementById("ns-sidebar");
    if (window.innerWidth < 768 && sidebar) {
      sidebar.classList.add("-translate-x-full");
    }
  };

  /* =======================================================
     TOP BAR
     ======================================================= */

  function renderTopbar() {
    return `
      <header class="bg-white border-b sticky top-0 z-40">
        <div class="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <button
              onclick="window.nsToggleSidebar()"
              class="md:hidden bg-slate-100 px-3 py-2 rounded-lg">
              ☰
            </button>

            <div>
              <div class="font-bold">${esc(
                businessSettings.business_name || "NAMITA STORE"
              )}</div>
              <div class="text-xs text-slate-500">
                ${new Date().toLocaleDateString("bn-IN")}
              </div>
            </div>
          </div>

          <button
            onclick="window.nsGo('pos')"
            class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold">
            + নতুন বিল
          </button>
        </div>
      </header>
    `;
  }

  /* =======================================================
     DASHBOARD
     ======================================================= */

  function getTodaySales() {
    return sales
      .filter((s) => String(s.created_at || "").slice(0, 10) === today())
      .reduce((sum, s) => sum + num(s.total_amount), 0);
  }

  function getTodayPurchase() {
    return purchases
      .filter((p) => String(p.created_at || "").slice(0, 10) === today())
      .reduce((sum, p) => sum + num(p.total_amount), 0);
  }

  function getCustomerDue() {
    return customers.reduce(
      (sum, c) => sum + num(c.due_amount),
      0
    );
  }

  function getSupplierDue() {
    return suppliers.reduce(
      (sum, s) => sum + num(s.due_amount),
      0
    );
  }

  function getStockQty() {
    return products.reduce(
      (sum, p) => sum + stockQty(p),
      0
    );
  }

  function getStockValue() {
    return products.reduce(
      (sum, p) => sum + stockQty(p) * purchasePrice(p),
      0
    );
  }

  function getLowStock() {
    return products.filter(
      (p) =>
        stockQty(p) <=
        num(p.minimum_stock ?? 5)
    );
  }

  function dashboardPage() {
    const low = getLowStock();

    return `
      ${sectionHeader(
        "Dashboard",
        "ব্যবসার বর্তমান হিসাব ও গুরুত্বপূর্ণ তথ্য"
      )}

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${card("আজকের Sales", money(getTodaySales()), "💰")}
        ${card("আজকের Purchase", money(getTodayPurchase()), "🛒")}
        ${card("Customer Due", money(getCustomerDue()), "⚠️")}
        ${card("Supplier Due", money(getSupplierDue()), "🚚")}
        ${card("মোট Products", products.length, "📦")}
        ${card("মোট Stock", getStockQty(), "📊")}
        ${card("Stock Value", money(getStockValue()), "💎")}
        ${card("Online Orders", onlineOrders.length, "🛍️")}
      </div>

      <div class="grid lg:grid-cols-2 gap-5 mt-6">

        <div class="bg-white border rounded-2xl p-5">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-lg">Low Stock Products</h3>
            <button onclick="window.nsGo('lowStock')"
              class="text-emerald-600 text-sm font-semibold">
              সব দেখুন
            </button>
          </div>

          ${
            low.length
              ? `
            <div class="space-y-2">
              ${low
                .slice(0, 8)
                .map(
                  (p) => `
                  <div class="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                    <div>
                      <div class="font-semibold">${esc(p.name)}</div>
                      <div class="text-xs text-slate-500">
                        ${esc(p.sku || p.barcode || "")}
                      </div>
                    </div>
                    <div class="font-bold text-red-600">
                      ${stockQty(p)}
                    </div>
                  </div>
                `
                )
                .join("")}
            </div>
          `
              : `
            <div class="text-emerald-600 bg-emerald-50 p-4 rounded-xl">
              ✅ সব Product-এর Stock ঠিক আছে
            </div>
          `
          }
        </div>

        <div class="bg-white border rounded-2xl p-5">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-lg">সাম্প্রতিক Sales</h3>
            <button onclick="window.nsGo('sales')"
              class="text-emerald-600 text-sm font-semibold">
              সব দেখুন
            </button>
          </div>

          ${
            sales.length
              ? `
            <div class="space-y-2">
              ${sales
                .slice(0, 8)
                .map(
                  (s) => `
                  <div class="flex justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <div class="font-semibold">
                        ${esc(s.invoice_no || "Invoice")}
                      </div>
                      <div class="text-xs text-slate-500">
                        ${esc(s.customer_name || "Walk-in Customer")}
                      </div>
                    </div>
                    <div class="font-bold">${money(
                      s.total_amount
                    )}</div>
                  </div>
                `
                )
                .join("")}
            </div>
          `
              : emptyState("এখনও কোনো Sales নেই")
          }
        </div>

      </div>

      <div class="grid md:grid-cols-4 gap-4 mt-6">
        <button onclick="window.nsGo('pos')"
          class="bg-white border rounded-2xl p-5 hover:shadow">
          🔥<br><b>নতুন বিল</b>
        </button>

        <button onclick="window.nsGo('purchase')"
          class="bg-white border rounded-2xl p-5 hover:shadow">
          🛒<br><b>নতুন Purchase</b>
        </button>

        <button onclick="window.nsGo('customerDue')"
          class="bg-white border rounded-2xl p-5 hover:shadow">
          ⚠️<br><b>Customer Due</b>
        </button>

        <button onclick="window.nsGo('reports')"
          class="bg-white border rounded-2xl p-5 hover:shadow">
          📈<br><b>Reports</b>
        </button>
      </div>
    `;
  }

  /* =======================================================
     PRODUCTS
     ======================================================= */

  function productsPage() {
    return `
      ${sectionHeader(
        "Products",
        "Product, price, stock, barcode এবং inventory management",
        "নতুন Product",
        "window.nsAddProduct()"
      )}

      <div class="bg-white border rounded-2xl overflow-hidden">

        <div class="p-4 border-b flex flex-col md:flex-row gap-3">
          <input id="product-search"
            oninput="window.nsFilterProducts()"
            placeholder="Product / SKU / Barcode খুঁজুন..."
            class="border rounded-xl px-4 py-3 flex-1">

          <select id="product-category"
            onchange="window.nsFilterProducts()"
            class="border rounded-xl px-4 py-3">
            <option value="">সব Category</option>
            ${categories
              .map(
                (c) =>
                  `<option value="${esc(c.name)}">${esc(c.name)}</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="text-left p-4">Product</th>
                <th class="text-left p-4">SKU/Barcode</th>
                <th class="text-right p-4">Purchase</th>
                <th class="text-right p-4">Sale</th>
                <th class="text-right p-4">Stock</th>
                <th class="text-center p-4">Action</th>
              </tr>
            </thead>

            <tbody id="product-table-body">
              ${productRows(products)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function productRows(list) {
    if (!list.length) {
      return `
        <tr>
          <td colspan="6" class="p-10 text-center text-slate-500">
            কোনো Product নেই
          </td>
        </tr>
      `;
    }

    return list
      .map(
        (p) => `
      <tr class="border-t hover:bg-slate-50">
        <td class="p-4">
          <div class="font-semibold">${esc(p.name)}</div>
          <div class="text-xs text-slate-500">
            ${esc(p.category || "")}
          </div>
        </td>

        <td class="p-4">
          ${esc(p.sku || "-")}<br>
          <span class="text-xs text-slate-500">
            ${esc(p.barcode || "")}
          </span>
        </td>

        <td class="p-4 text-right">
          ${money(purchasePrice(p))}
        </td>

        <td class="p-4 text-right font-semibold">
          ${money(salePrice(p))}
        </td>

        <td class="p-4 text-right">
          <span class="${
            stockQty(p) <= num(p.minimum_stock ?? 5)
              ? "text-red-600 font-bold"
              : "text-emerald-600 font-semibold"
          }">
            ${stockQty(p)}
          </span>
        </td>

        <td class="p-4 text-center">
          <button onclick="window.nsEditProduct('${p.id}')"
            class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 mr-1">
            Edit
          </button>

          <button onclick="window.nsDeleteProduct('${p.id}')"
            class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600">
            Delete
          </button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  window.nsFilterProducts = function () {
    const search =
      ($("#product-search")?.value || "").toLowerCase();

    const category =
      $("#product-category")?.value || "";

    const list = products.filter((p) => {
      const text = [
        p.name,
        p.sku,
        p.barcode,
        p.brand,
      ]
        .join(" ")
        .toLowerCase();

      return (
        text.includes(search) &&
        (!category || p.category === category)
      );
    });

    const body = $("#product-table-body");
    if (body) body.innerHTML = productRows(list);
  };

  window.nsAddProduct = function () {
    modal(
      "নতুন Product",
      `
      <form onsubmit="window.nsSaveProduct(event)" class="grid md:grid-cols-2 gap-4">

        <div>
          <label class="text-sm font-semibold">Product Name *</label>
          <input name="name" required class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">SKU</label>
          <input name="sku" class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Barcode</label>
          <input name="barcode" class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Category</label>
          <input name="category" list="category-list"
            class="w-full border rounded-xl px-4 py-3 mt-1">
          <datalist id="category-list">
            ${categories.map((c) => `<option>${esc(c.name)}</option>`).join("")}
          </datalist>
        </div>

        <div>
          <label class="text-sm font-semibold">Brand</label>
          <input name="brand" class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Unit</label>
          <input name="unit" value="pcs" class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Purchase Price</label>
          <input name="purchase_price" type="number" step="0.01" value="0"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Sale Price *</label>
          <input name="sale_price" type="number" step="0.01" value="0" required
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">MRP</label>
          <input name="mrp" type="number" step="0.01" value="0"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Opening Stock</label>
          <input name="stock" type="number" step="0.01" value="0"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Minimum Stock</label>
          <input name="minimum_stock" type="number" step="0.01" value="5"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Tax %</label>
          <input name="tax_rate" type="number" step="0.01" value="0"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Description</label>
          <textarea name="description"
            class="w-full border rounded-xl px-4 py-3 mt-1"></textarea>
        </div>

        <div class="md:col-span-2 flex justify-end">
          <button class="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold">
            Save Product
          </button>
        </div>
      </form>
      `
    );
  };

  window.nsSaveProduct = async function (event) {
    event.preventDefault();

    const fd = new FormData(event.target);

    const purchase = num(fd.get("purchase_price"));
    const sale = num(fd.get("sale_price"));

    const payload = {
      name: fd.get("name"),
      sku: fd.get("sku") || null,
      barcode: fd.get("barcode") || null,
      category: fd.get("category") || null,
      brand: fd.get("brand") || null,
      unit: fd.get("unit") || "pcs",
      purchase_price: purchase,
      sale_price: sale,
      price: sale,
      mrp: num(fd.get("mrp")),
      stock: num(fd.get("stock")),
      minimum_stock: num(fd.get("minimum_stock")),
      tax_rate: num(fd.get("tax_rate")),
      description: fd.get("description") || null,
      is_active: true,
    };

    const { error } = await db.from("products").insert(payload);

    if (error) {
      console.error(error);
      toast("Product Save হয়নি: " + error.message, "error");
      return;
    }

    nsCloseModal();
    toast("Product সফলভাবে যোগ হয়েছে");
    await loadAll();
  };

  window.nsEditProduct = function (id) {
    const p = products.find((x) => String(x.id) === String(id));
    if (!p) return;

    modal(
      "Product Edit",
      `
      <form onsubmit="window.nsUpdateProduct(event, '${id}')"
        class="grid md:grid-cols-2 gap-4">

        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Product Name</label>
          <input name="name" value="${esc(p.name)}" required
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">SKU</label>
          <input name="sku" value="${esc(p.sku || "")}"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Barcode</label>
          <input name="barcode" value="${esc(p.barcode || "")}"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Purchase Price</label>
          <input name="purchase_price" type="number" step="0.01"
            value="${purchasePrice(p)}"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Sale Price</label>
          <input name="sale_price" type="number" step="0.01"
            value="${salePrice(p)}"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Stock</label>
          <input name="stock" type="number" step="0.01"
            value="${stockQty(p)}"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="text-sm font-semibold">Minimum Stock</label>
          <input name="minimum_stock" type="number" step="0.01"
            value="${num(p.minimum_stock ?? 5)}"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div class="md:col-span-2 flex justify-end">
          <button class="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">
            Update Product
          </button>
        </div>

      </form>
      `
    );
  };

  window.nsUpdateProduct = async function (event, id) {
    event.preventDefault();

    const fd = new FormData(event.target);
    const sale = num(fd.get("sale_price"));

    const { error } = await db
      .from("products")
      .update({
        name: fd.get("name"),
        sku: fd.get("sku") || null,
        barcode: fd.get("barcode") || null,
        purchase_price: num(fd.get("purchase_price")),
        sale_price: sale,
        price: sale,
        stock: num(fd.get("stock")),
        minimum_stock: num(fd.get("minimum_stock")),
      })
      .eq("id", id);

    if (error) {
      toast(error.message, "error");
      return;
    }

    nsCloseModal();
    toast("Product Updated");
    await loadAll();
  };

  window.nsDeleteProduct = async function (id) {
    if (!confirm("এই Product delete করতে চান?")) return;

    const { error } = await db
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      toast("Delete করা যায়নি: " + error.message, "error");
      return;
    }

    toast("Product deleted");
    await loadAll();
  };

  /* =======================================================
     POS
     ======================================================= */

  function posPage() {
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    return `
      ${sectionHeader(
        "POS Billing",
        "দ্রুত Sales Invoice তৈরি করুন"
      )}

      <div class="grid xl:grid-cols-3 gap-5">

        <div class="xl:col-span-2">

          <div class="bg-white border rounded-2xl p-4 mb-4">
            <input id="pos-search"
              oninput="window.nsPOSSearch()"
              placeholder="Product name / SKU / Barcode..."
              class="w-full border rounded-xl px-4 py-3">
          </div>

          <div id="pos-products"
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            ${posProductCards(products)}
          </div>
        </div>

        <div class="bg-white border rounded-2xl p-5 h-fit sticky top-24">

          <h3 class="text-xl font-bold mb-4">🧾 Current Bill</h3>

          <div class="mb-4">
            <label class="text-sm font-semibold">Customer</label>
            <select id="pos-customer"
              onchange="selectedCustomer=this.value"
              class="w-full border rounded-xl px-4 py-3 mt-1">
              <option value="">Walk-in Customer</option>
              ${customers
                .map(
                  (c) => `
                  <option value="${c.id}"
                    ${
                      selectedCustomer === c.id
                        ? "selected"
                        : ""
                    }>
                    ${esc(c.name)} ${
                    c.phone ? "• " + esc(c.phone) : ""
                  }
                  </option>
                `
                )
                .join("")}
            </select>
          </div>

          <div class="space-y-2 max-h-72 overflow-y-auto">
            ${
              cart.length
                ? cart
                    .map(
                      (item, i) => `
                    <div class="border rounded-xl p-3">
                      <div class="flex justify-between gap-2">
                        <div class="font-semibold text-sm">
                          ${esc(item.name)}
                        </div>
                        <button onclick="window.nsRemoveCart(${i})"
                          class="text-red-500">×</button>
                      </div>

                      <div class="flex justify-between items-center mt-2">
                        <div class="flex items-center gap-2">
                          <button onclick="window.nsChangeQty(${i}, -1)"
                            class="w-8 h-8 rounded-lg bg-slate-100">−</button>

                          <span class="font-bold">${item.qty}</span>

                          <button onclick="window.nsChangeQty(${i}, 1)"
                            class="w-8 h-8 rounded-lg bg-slate-100">+</button>
                        </div>

                        <div class="font-semibold">
                          ${money(item.price * item.qty)}
                        </div>
                      </div>
                    </div>
                  `
                    )
                    .join("")
                : `<div class="text-center text-slate-400 py-8">
                    Cart খালি
                   </div>`
            }
          </div>

          <div class="border-t mt-4 pt-4 space-y-2">

            <div class="flex justify-between">
              <span>Subtotal</span>
              <b>${money(total)}</b>
            </div>

            <div>
              <label class="text-sm">Discount</label>
              <input id="pos-discount"
                oninput="window.nsUpdatePOSTotal()"
                type="number" min="0" step="0.01" value="0"
                class="w-full border rounded-lg px-3 py-2">
            </div>

            <div>
              <label class="text-sm">Tax</label>
              <input id="pos-tax"
                oninput="window.nsUpdatePOSTotal()"
                type="number" min="0" step="0.01" value="0"
                class="w-full border rounded-lg px-3 py-2">
            </div>

            <div class="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span id="pos-total">${money(total)}</span>
            </div>

            <div>
              <label class="text-sm font-semibold">Payment Method</label>
              <select id="pos-payment-method"
                class="w-full border rounded-xl px-3 py-2">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-semibold">Paid Amount</label>
              <input id="pos-paid"
                type="number" min="0" step="0.01"
                value="${total}"
                oninput="window.nsUpdateDue()"
                class="w-full border rounded-xl px-3 py-3">
            </div>

            <div class="flex justify-between bg-amber-50 rounded-xl p-3">
              <span>Due</span>
              <b id="pos-due">${money(0)}</b>
            </div>

            <button onclick="window.nsCompleteSale()"
              class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg mt-3">
              ✓ Complete Sale
            </button>

            <button onclick="window.nsClearCart()"
              class="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold">
              Clear Cart
            </button>

          </div>
        </div>
      </div>
    `;
  }

  function posProductCards(list) {
    if (!list.length) {
      return `
        <div class="col-span-full bg-white border rounded-2xl p-10 text-center">
          Product পাওয়া যায়নি
        </div>
      `;
    }

    return list
      .map(
        (p) => `
        <button
          onclick="window.nsAddToCart('${p.id}')"
          class="bg-white border rounded-2xl p-3 text-left hover:shadow-md hover:border-emerald-400 transition">

          <div class="h-24 bg-slate-100 rounded-xl flex items-center justify-center text-3xl mb-3">
            ${
              p.image_url
                ? `<img src="${esc(p.image_url)}" class="h-full w-full object-cover rounded-xl">`
                : "📦"
            }
          </div>

          <div class="font-semibold line-clamp-2">${esc(p.name)}</div>

          <div class="text-emerald-600 font-bold mt-1">
            ${money(salePrice(p))}
          </div>

          <div class="text-xs ${
            stockQty(p) > 0 ? "text-slate-500" : "text-red-600"
          }">
            Stock: ${stockQty(p)}
          </div>
        </button>
      `
      )
      .join("");
  }

  window.nsPOSSearch = function () {
    const q = ($("#pos-search")?.value || "").toLowerCase();

    const list = products.filter((p) =>
      [
        p.name,
        p.sku,
        p.barcode,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );

    const box = $("#pos-products");
    if (box) box.innerHTML = posProductCards(list);
  };

  window.nsAddToCart = function (id) {
    const p = products.find((x) => String(x.id) === String(id));

    if (!p) return;

    if (stockQty(p) <= 0) {
      toast("এই Product-এর Stock নেই", "warning");
      return;
    }

    const existing = cart.find(
      (x) => String(x.id) === String(id)
    );

    if (existing) {
      if (existing.qty >= stockQty(p)) {
        toast("Available stock-এর বেশি নেওয়া যাবে না", "warning");
        return;
      }

      existing.qty++;
    } else {
      cart.push({
        id: p.id,
        name: p.name,
        price: salePrice(p),
        purchase_price: purchasePrice(p),
        tax_rate: num(p.tax_rate),
        qty: 1,
        stock: stockQty(p),
      });
    }

    render();
  };

  window.nsChangeQty = function (index, change) {
    const item = cart[index];
    if (!item) return;

    item.qty += change;

    if (item.qty <= 0) {
      cart.splice(index, 1);
    }

    if (item.qty > item.stock) {
      item.qty = item.stock;
      toast("Stock-এর বেশি নেওয়া যাবে না", "warning");
    }

    render();
  };

  window.nsRemoveCart = function (index) {
    cart.splice(index, 1);
    render();
  };

  window.nsClearCart = function () {
    cart = [];
    render();
  };

  window.nsUpdatePOSTotal = function () {
    const subtotal = cart.reduce(
      (s, i) => s + i.price * i.qty,
      0
    );

    const discount = num($("#pos-discount")?.value);
    const tax = num($("#pos-tax")?.value);

    const total = Math.max(
      0,
      subtotal - discount + tax
    );

    const totalEl = $("#pos-total");
    if (totalEl) totalEl.textContent = money(total);

    const paid = num($("#pos-paid")?.value);
    const dueEl = $("#pos-due");

    if (dueEl) {
      dueEl.textContent = money(Math.max(0, total - paid));
    }
  };

  window.nsUpdateDue = function () {
    window.nsUpdatePOSTotal();
  };

  /* =======================================================
     COMPLETE SALE
     ======================================================= */

  window.nsCompleteSale = async function () {
    if (!cart.length) {
      toast("Cart খালি", "warning");
      return;
    }

    const customerId =
      $("#pos-customer")?.value || null;

    const customer =
      customers.find(
        (c) => String(c.id) === String(customerId)
      ) || null;

    const subtotal = cart.reduce(
      (s, i) => s + i.price * i.qty,
      0
    );

    const discount = num($("#pos-discount")?.value);
    const tax = num($("#pos-tax")?.value);

    const total = Math.max(
      0,
      subtotal - discount + tax
    );

    const paid = num($("#pos-paid")?.value);

    if (paid < 0) {
      toast("Paid Amount সঠিক নয়", "error");
      return;
    }

    if (paid > total) {
      toast("Paid Amount Total-এর বেশি হতে পারে না", "warning");
      return;
    }

    const due = Math.max(0, total - paid);

    if (due > 0 && !customer) {
      toast("Due Sale-এর জন্য Customer নির্বাচন করুন", "warning");
      return;
    }

    for (const item of cart) {
      const current = products.find(
        (p) => String(p.id) === String(item.id)
      );

      if (!current || stockQty(current) < item.qty) {
        toast(
          `${item.name} এর পর্যাপ্ত Stock নেই`,
          "error"
        );
        return;
      }
    }

    const invoiceNo =
      "INV-" +
      new Date()
        .toISOString()
        .replace(/\D/g, "")
        .slice(0, 14);

    const paymentMethod =
      $("#pos-payment-method")?.value || "cash";

    const status =
      due <= 0
        ? "paid"
        : paid > 0
        ? "partial"
        : "unpaid";

    /* -------------------------------------------------------
       1. SALES
       ------------------------------------------------------- */

    const salePayload = {
      invoice_no: invoiceNo,
      customer_id: customerId,
      customer_name: customer?.name || "Walk-in Customer",
      subtotal,
      discount,
      tax_amount: tax,
      round_off: 0,
      total_amount: total,
      paid_amount: paid,
      due_amount: due,
      payment_status: status,
      sale_type: "retail",
      status: "completed",
      notes: null,
    };

    const { data: saleData, error: saleError } =
      await db
        .from("sales")
        .insert(salePayload)
        .select()
        .single();

    if (saleError) {
      console.error(saleError);
      toast("Sale Save হয়নি: " + saleError.message, "error");
      return;
    }

    /* -------------------------------------------------------
       2. SALE ITEMS
       ------------------------------------------------------- */

    const itemRows = cart.map((item) => ({
      sale_id: saleData.id,
      product_id: item.id,
      quantity: item.qty,
      price: item.price,
      purchase_price: item.purchase_price,
      discount: 0,
      tax_rate: item.tax_rate,
      tax_amount: 0,
      total_amount: item.price * item.qty,
    }));

    const { error: itemError } = await db
      .from("sale_items")
      .insert(itemRows);

    if (itemError) {
      console.error(itemError);
      toast(
        "Sale তৈরি হয়েছে কিন্তু Sale Items Save হয়নি: " +
          itemError.message,
        "error"
      );
    }

    /* -------------------------------------------------------
       3. PAYMENT
       ------------------------------------------------------- */

    if (paid > 0) {
      const paymentPayload = {
        payment_type: "received",
        amount: paid,
        payment_method: paymentMethod,
        customer_id: customerId,
        reference_no: invoiceNo,
        notes: "POS Sale Payment",
      };

      const { error: paymentError } =
        await db.from("payments").insert(paymentPayload);

      if (paymentError) {
        console.warn(paymentError);
        toast(
          "Sale হয়েছে, কিন্তু Payment record save হয়নি",
          "warning"
        );
      }
    }

    /* -------------------------------------------------------
       4. STOCK UPDATE + MOVEMENT
       ------------------------------------------------------- */

    for (const item of cart) {
      const current = products.find(
        (p) => String(p.id) === String(item.id)
      );

      const newStock =
        stockQty(current) - item.qty;

      const { error: stockError } = await db
        .from("products")
        .update({
          stock: newStock,
        })
        .eq("id", item.id);

      if (stockError) {
        console.warn(stockError);
      }

      try {
        await db.from("stock_movements").insert({
          product_id: item.id,
          movement_type: "sale",
          quantity: -item.qty,
          reference_id: saleData.id,
          reference_type: "sales",
          notes: invoiceNo,
        });
      } catch (_) {}
    }

    /* -------------------------------------------------------
       5. CUSTOMER DUE
       ------------------------------------------------------- */

    if (customerId && due > 0) {
      const oldDue = num(customer?.due_amount);

      const { error: dueError } = await db
        .from("customers")
        .update({
          due_amount: oldDue + due,
        })
        .eq("id", customerId);

      if (dueError) {
        console.warn(dueError);
      }
    }

    /* -------------------------------------------------------
       PRINT
       ------------------------------------------------------- */

    printInvoice({
      invoice_no: invoiceNo,
      customer_name:
        customer?.name || "Walk-in Customer",
      customer_phone: customer?.phone || "",
      subtotal,
      discount,
      tax,
      total,
      paid,
      due,
      payment_method: paymentMethod,
    }, cart);

    cart = [];

    toast("Sale সফলভাবে সম্পন্ন হয়েছে");

    await loadAll();
    page = "pos";
    render();
  };

  /* =======================================================
     INVOICE PRINT
     ======================================================= */

  function printInvoice(info, items) {
    const print = document.getElementById("print-section");

    if (!print) return;

    print.classList.remove("hidden");

    print.innerHTML = `
      <div style="
        width:80mm;
        margin:0 auto;
        padding:8px;
        font-family:Arial,sans-serif;
        color:#000;
        font-size:12px;
      ">

        <div style="text-align:center">
          <h2 style="margin:0;font-size:20px">
            ${esc(businessSettings.business_name || "NAMITA STORE")}
          </h2>

          ${
            businessSettings.address
              ? `<div>${esc(businessSettings.address)}</div>`
              : ""
          }

          ${
            businessSettings.phone
              ? `<div>Phone: ${esc(businessSettings.phone)}</div>`
              : ""
          }

          <hr>
          <b>SALES INVOICE</b>
        </div>

        <div style="margin-top:8px">
          Invoice: ${esc(info.invoice_no)}<br>
          Date: ${new Date().toLocaleString("en-IN")}<br>
          Customer: ${esc(info.customer_name)}<br>
          ${
            info.customer_phone
              ? `Phone: ${esc(info.customer_phone)}<br>`
              : ""
          }
        </div>

        <hr>

        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th style="text-align:left">Item</th>
              <th>Qty</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>

          <tbody>
            ${items
              .map(
                (i) => `
                <tr>
                  <td>${esc(i.name)}</td>
                  <td style="text-align:center">${i.qty}</td>
                  <td style="text-align:right">
                    ${money(i.price * i.qty)}
                  </td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>

        <hr>

        <div style="display:flex;justify-content:space-between">
          <span>Subtotal</span>
          <b>${money(info.subtotal)}</b>
        </div>

        <div style="display:flex;justify-content:space-between">
          <span>Discount</span>
          <b>${money(info.discount)}</b>
        </div>

        <div style="display:flex;justify-content:space-between">
          <span>Tax</span>
          <b>${money(info.tax)}</b>
        </div>

        <div style="
          display:flex;
          justify-content:space-between;
          font-size:16px;
          font-weight:bold;
          margin-top:5px;
        ">
          <span>TOTAL</span>
          <span>${money(info.total)}</span>
        </div>

        <div style="display:flex;justify-content:space-between">
          <span>Paid</span>
          <b>${money(info.paid)}</b>
        </div>

        <div style="
          display:flex;
          justify-content:space-between;
          font-weight:bold;
        ">
          <span>Due</span>
          <span>${money(info.due)}</span>
        </div>

        <div style="margin-top:8px">
          Payment: ${esc(info.payment_method)}
        </div>

        <hr>

        <div style="text-align:center">
          Thank You<br>
          Visit Again
        </div>

      </div>
    `;

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        print.classList.add("hidden");
      }, 500);
    }, 100);
  }

  /* =======================================================
     CUSTOMERS
     ======================================================= */

  function customersPage() {
    return `
      ${sectionHeader(
        "Customers",
        "Customer এবং Due Management",
        "নতুন Customer",
        "window.nsAddCustomer()"
      )}

      <div class="bg-white border rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="p-4 text-left">Name</th>
                <th class="p-4 text-left">Phone</th>
                <th class="p-4 text-right">Due</th>
                <th class="p-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              ${
                customers.length
                  ? customers
                      .map(
                        (c) => `
                  <tr class="border-t">
                    <td class="p-4 font-semibold">
                      ${esc(c.name)}
                    </td>

                    <td class="p-4">
                      ${esc(c.phone || "-")}
                    </td>

                    <td class="p-4 text-right font-bold ${
                      num(c.due_amount) > 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }">
                      ${money(c.due_amount)}
                    </td>

                    <td class="p-4 text-center">
                      ${
                        num(c.due_amount) > 0
                          ? `
                        <button onclick="window.nsCollectCustomerDue('${c.id}')"
                          class="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg">
                          Payment
                        </button>
                      `
                          : "-"
                      }
                    </td>
                  </tr>
                `
                      )
                      .join("")
                  : `
                  <tr>
                    <td colspan="4" class="p-10 text-center text-slate-500">
                      কোনো Customer নেই
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  window.nsAddCustomer = function () {
    modal(
      "নতুন Customer",
      `
      <form onsubmit="window.nsSaveCustomer(event)" class="space-y-4">

        <div>
          <label class="font-semibold text-sm">Name *</label>
          <input name="name" required
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="font-semibold text-sm">Phone</label>
          <input name="phone"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="font-semibold text-sm">Email</label>
          <input name="email" type="email"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="font-semibold text-sm">Address</label>
          <textarea name="address"
            class="w-full border rounded-xl px-4 py-3 mt-1"></textarea>
        </div>

        <button class="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold">
          Save Customer
        </button>

      </form>
      `
    );
  };

  window.nsSaveCustomer = async function (event) {
    event.preventDefault();

    const fd = new FormData(event.target);

    const { error } = await db.from("customers").insert({
      name: fd.get("name"),
      phone: fd.get("phone") || null,
      email: fd.get("email") || null,
      address: fd.get("address") || null,
      due_amount: 0,
    });

    if (error) {
      toast(error.message, "error");
      return;
    }

    nsCloseModal();
    toast("Customer যোগ হয়েছে");
    await loadAll();
  };

  window.nsCollectCustomerDue = function (id) {
    const customer = customers.find(
      (c) => String(c.id) === String(id)
    );

    if (!customer) return;

    modal(
      "Customer Due Payment",
      `
      <div class="mb-5 bg-red-50 rounded-xl p-4">
        <div class="font-bold">${esc(customer.name)}</div>
        <div class="text-red-600 text-xl font-bold mt-1">
          Current Due: ${money(customer.due_amount)}
        </div>
      </div>

      <form onsubmit="window.nsSaveCustomerPayment(event, '${id}')"
        class="space-y-4">

        <div>
          <label class="font-semibold text-sm">Payment Amount</label>
          <input name="amount" type="number" min="0.01"
            max="${num(customer.due_amount)}"
            step="0.01" required
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="font-semibold text-sm">Payment Method</label>
          <select name="method"
            class="w-full border rounded-xl px-4 py-3 mt-1">
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank">Bank</option>
          </select>
        </div>

        <button class="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold">
          Receive Payment
        </button>

      </form>
      `
    );
  };

  window.nsSaveCustomerPayment = async function (event, id) {
    event.preventDefault();

    const customer = customers.find(
      (c) => String(c.id) === String(id)
    );

    if (!customer) return;

    const fd = new FormData(event.target);
    const amount = num(fd.get("amount"));

    if (amount <= 0 || amount > num(customer.due_amount)) {
      toast("Payment Amount সঠিক নয়", "error");
      return;
    }

    const newDue =
      num(customer.due_amount) - amount;

    const { error: updateError } = await db
      .from("customers")
      .update({ due_amount: newDue })
      .eq("id", id);

    if (updateError) {
      toast(updateError.message, "error");
      return;
    }

    const { error: paymentError } = await db
      .from("payments")
      .insert({
        payment_type: "received",
        amount,
        payment_method: fd.get("method"),
        customer_id: id,
        reference_no: "DUE-" + uid(),
        notes: "Customer Due Collection",
      });

    if (paymentError) {
      console.warn(paymentError);
    }

    nsCloseModal();
    toast("Customer Payment সফল হয়েছে");
    await loadAll();
  };

  function customerDuePage() {
    const dueCustomers = customers.filter(
      (c) => num(c.due_amount) > 0
    );

    return `
      ${sectionHeader(
        "Customer Due",
        "যেসব Customer-এর কাছে টাকা পাওনা আছে"
      )}

      <div class="bg-white border rounded-2xl p-5 mb-5">
        <div class="text-sm text-slate-500">Total Customer Due</div>
        <div class="text-3xl font-bold text-red-600 mt-1">
          ${money(getCustomerDue())}
        </div>
      </div>

      ${
        dueCustomers.length
          ? `
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${dueCustomers
            .map(
              (c) => `
            <div class="bg-white border rounded-2xl p-5">
              <div class="font-bold text-lg">${esc(c.name)}</div>
              <div class="text-sm text-slate-500">
                ${esc(c.phone || "")}
              </div>

              <div class="text-2xl font-bold text-red-600 my-4">
                ${money(c.due_amount)}
              </div>

              <button onclick="window.nsCollectCustomerDue('${c.id}')"
                class="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold">
                Payment Receive
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : emptyState("Customer Due নেই")
      }
    `;
  }

  /* =======================================================
     SUPPLIERS
     ======================================================= */

  function suppliersPage() {
    return `
      ${sectionHeader(
        "Suppliers",
        "Supplier এবং Supplier Due Management",
        "নতুন Supplier",
        "window.nsAddSupplier()"
      )}

      <div class="bg-white border rounded-2xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4 text-left">Supplier</th>
              <th class="p-4 text-left">Phone</th>
              <th class="p-4 text-right">Due</th>
            </tr>
          </thead>

          <tbody>
            ${
              suppliers.length
                ? suppliers
                    .map(
                      (s) => `
                  <tr class="border-t">
                    <td class="p-4 font-semibold">
                      ${esc(s.name)}
                    </td>
                    <td class="p-4">${esc(s.phone || "-")}</td>
                    <td class="p-4 text-right font-bold text-red-600">
                      ${money(s.due_amount)}
                    </td>
                  </tr>
                `
                    )
                    .join("")
                : `
                  <tr>
                    <td colspan="3" class="p-10 text-center">
                      কোনো Supplier নেই
                    </td>
                  </tr>
                `
            }
          </tbody>
        </table>
      </div>
    `;
  }

  window.nsAddSupplier = function () {
    modal(
      "নতুন Supplier",
      `
      <form onsubmit="window.nsSaveSupplier(event)" class="space-y-4">

        <div>
          <label class="font-semibold text-sm">Supplier Name *</label>
          <input name="name" required
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="font-semibold text-sm">Phone</label>
          <input name="phone"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="font-semibold text-sm">Email</label>
          <input name="email"
            class="w-full border rounded-xl px-4 py-3 mt-1">
        </div>

        <div>
          <label class="font-semibold text-sm">Address</label>
          <textarea name="address"
            class="w-full border rounded-xl px-4 py-3 mt-1"></textarea>
        </div>

        <button class="bg-emerald-600 text-white px-6 py-3 rounded-xl">
          Save Supplier
        </button>

      </form>
      `
    );
  };

  window.nsSaveSupplier = async function (event) {
    event.preventDefault();

    const fd = new FormData(event.target);

    const { error } = await db.from("suppliers").insert({
      name: fd.get("name"),
      phone: fd.get("phone") || null,
      email: fd.get("email") || null,
      address: fd.get("address") || null,
      due_amount: 0,
    });

    if (error) {
      toast(error.message, "error");
      return;
    }

    nsCloseModal();
    toast("Supplier যোগ হয়েছে");
    await loadAll();
  };

  function supplierDuePage() {
    return `
      ${sectionHeader(
        "Supplier Due",
        "Supplier-কে কত টাকা দিতে হবে"
      )}

      <div class="bg-white border rounded-2xl p-5 mb-5">
        <div class="text-sm text-slate-500">
          Total Supplier Due
        </div>
        <div class="text-3xl font-bold text-red-600">
          ${money(getSupplierDue())}
        </div>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${suppliers
          .filter((s) => num(s.due_amount) > 0)
          .map(
            (s) => `
          <div class="bg-white border rounded-2xl p-5">
            <div class="font-bold">${esc(s.name)}</div>
            <div class="text-red-600 text-2xl font-bold my-3">
              ${money(s.due_amount)}
            </div>
            <button onclick="window.nsSupplierPayment('${s.id}')"
              class="w-full bg-blue-600 text-white py-3 rounded-xl">
              Payment
            </button>
          </div>
        `
          )
          .join("") || emptyState("Supplier Due নেই")}
      </div>
    `;
  }

  window.nsSupplierPayment = function (id) {
    const supplier = suppliers.find(
      (s) => String(s.id) === String(id)
    );

    if (!supplier) return;

    modal(
      "Supplier Payment",
      `
      <form onsubmit="window.nsSaveSupplierPayment(event, '${id}')"
        class="space-y-4">

        <div class="bg-red-50 rounded-xl p-4">
          <b>${esc(supplier.name)}</b>
          <div class="text-red-600 text-xl font-bold">
            Due: ${money(supplier.due_amount)}
          </div>
        </div>

        <input name="amount" type="number"
          min="0.01"
          max="${num(supplier.due_amount)}"
          step="0.01"
          required
          placeholder="Payment Amount"
          class="w-full border rounded-xl px-4 py-3">

        <select name="method"
          class="w-full border rounded-xl px-4 py-3">
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="bank">Bank</option>
        </select>

        <button class="bg-blue-600 text-white px-6 py-3 rounded-xl">
          Pay Supplier
        </button>
      </form>
      `
    );
  };

  window.nsSaveSupplierPayment = async function (event, id) {
    event.preventDefault();

    const supplier = suppliers.find(
      (s) => String(s.id) === String(id)
    );

    if (!supplier) return;

    const fd = new FormData(event.target);
    const amount = num(fd.get("amount"));

    if (
      amount <= 0 ||
      amount > num(supplier.due_amount)
    ) {
      toast("Payment Amount সঠিক নয়", "error");
      return;
    }

    const { error } = await db
      .from("suppliers")
      .update({
        due_amount:
          num(supplier.due_amount) - amount,
      })
      .eq("id", id);

    if (error) {
      toast(error.message, "error");
      return;
    }

    await db.from("payments").insert({
      payment_type: "paid",
      amount,
      payment_method: fd.get("method"),
      supplier_id: id,
      reference_no: "SUP-" + uid(),
      notes: "Supplier Payment",
    });

    nsCloseModal();
    toast("Supplier Payment সফল হয়েছে");
    await loadAll();
  };

  /* =======================================================
     CATEGORIES
     ======================================================= */

  function categoriesPage() {
    return `
      ${sectionHeader(
        "Categories",
        "Product Categories",
        "নতুন Category",
        "window.nsAddCategory()"
      )}

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        ${
          categories.length
            ? categories
                .map(
                  (c) => `
                <div class="bg-white border rounded-2xl p-5">
                  <div class="text-2xl">🗂️</div>
                  <div class="font-bold text-lg mt-2">
                    ${esc(c.name)}
                  </div>
                  <div class="text-sm text-slate-500">
                    ${
                      products.filter(
                        (p) => p.category === c.name
                      ).length
                    } Products
                  </div>
                </div>
              `
                )
                .join("")
            : emptyState("Category তৈরি করুন")
        }
      </div>
    `;
  }

  window.nsAddCategory = function () {
    modal(
      "নতুন Category",
      `
      <form onsubmit="window.nsSaveCategory(event)" class="space-y-4">
        <input name="name" required
          placeholder="Category Name"
          class="w-full border rounded-xl px-4 py-3">

        <button class="bg-emerald-600 text-white px-6 py-3 rounded-xl">
          Save Category
        </button>
      </form>
      `
    );
  };

  window.nsSaveCategory = async function (event) {
    event.preventDefault();

    const name = new FormData(event.target).get("name");

    const { error } = await db
      .from("categories")
      .insert({ name });

    if (error) {
      toast(error.message, "error");
      return;
    }

    nsCloseModal();
    toast("Category যোগ হয়েছে");
    await loadAll();
  };

  /* =======================================================
     BRANDS
     ======================================================= */

  function brandsPage() {
    return `
      ${sectionHeader(
        "Brands",
        "Product Brand Management",
        "নতুন Brand",
        "window.nsAddBrand()"
      )}

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        ${
          brands.length
            ? brands
                .map(
                  (b) => `
                <div class="bg-white border rounded-2xl p-5">
                  <div class="text-2xl">🏷️</div>
                  <div class="font-bold mt-2">
                    ${esc(b.name)}
                  </div>
                </div>
              `
                )
                .join("")
            : emptyState("Brand তৈরি করুন")
        }
      </div>
    `;
  }

  window.nsAddBrand = function () {
    modal(
      "নতুন Brand",
      `
      <form onsubmit="window.nsSaveBrand(event)" class="space-y-4">
        <input name="name" required
          placeholder="Brand Name"
          class="w-full border rounded-xl px-4 py-3">

        <button class="bg-emerald-600 text-white px-6 py-3 rounded-xl">
          Save Brand
        </button>
      </form>
      `
    );
  };

  window.nsSaveBrand = async function (event) {
    event.preventDefault();

    const name = new FormData(event.target).get("name");

    const { error } = await db
      .from("brands")
      .insert({ name });

    if (error) {
      toast(error.message, "error");
      return;
    }

    nsCloseModal();
    toast("Brand যোগ হয়েছে");
    await loadAll();
  };

  /* =======================================================
     STOCK
     ======================================================= */

  function stockPage() {
    return `
      ${sectionHeader(
        "Stock Management",
        "বর্তমান Product Stock"
      )}

      <div class="bg-white border rounded-2xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4 text-left">Product</th>
              <th class="p-4 text-right">Purchase</th>
              <th class="p-4 text-right">Sale</th>
              <th class="p-4 text-right">Stock</th>
              <th class="p-4 text-right">Value</th>
            </tr>
          </thead>

          <tbody>
            ${products
              .map(
                (p) => `
              <tr class="border-t">
                <td class="p-4 font-semibold">${esc(p.name)}</td>
                <td class="p-4 text-right">${money(purchasePrice(p))}</td>
                <td class="p-4 text-right">${money(salePrice(p))}</td>
                <td class="p-4 text-right font-bold">${stockQty(p)}</td>
                <td class="p-4 text-right">${money(
                  stockQty(p) * purchasePrice(p)
                )}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function lowStockPage() {
    const list = getLowStock();

    return `
      ${sectionHeader(
        "Low Stock",
        "Minimum Stock-এর নিচে বা সমান Product"
      )}

      ${
        list.length
          ? `
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${list
            .map(
              (p) => `
            <div class="bg-white border border-red-200 rounded-2xl p-5">
              <div class="text-3xl">⚠️</div>
              <div class="font-bold mt-2">${esc(p.name)}</div>
              <div class="text-red-600 text-2xl font-bold mt-2">
                ${stockQty(p)}
              </div>
              <div class="text-xs text-slate-500">
                Minimum: ${num(p.minimum_stock ?? 5)}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : emptyState("Low Stock নেই")
      }
    `;
  }

  /* =======================================================
     PURCHASE
     ======================================================= */

  function purchasePage() {
    return `
      ${sectionHeader(
        "New Purchase",
        "Supplier থেকে Product Purchase Entry"
      )}

      <div class="bg-white border rounded-2xl p-5">

        <div class="grid md:grid-cols-3 gap-4">
          <select id="purchase-supplier"
            class="border rounded-xl px-4 py-3">
            <option value="">Select Supplier</option>
            ${suppliers
              .map(
                (s) =>
                  `<option value="${s.id}">
                    ${esc(s.name)}
                  </option>`
              )
              .join("")}
          </select>

          <input id="purchase-invoice"
            placeholder="Supplier Invoice No."
            class="border rounded-xl px-4 py-3">

          <input id="purchase-date"
            type="date"
            value="${today()}"
            class="border rounded-xl px-4 py-3">
        </div>

        <div class="mt-6 border rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="p-3 text-left">Product</th>
                <th class="p-3">Qty</th>
                <th class="p-3">Rate</th>
                <th class="p-3">Total</th>
                <th class="p-3"></th>
              </tr>
            </thead>
            <tbody id="purchase-lines">
              ${purchaseLine()}
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex flex-col md:flex-row justify-between gap-3">
          <button onclick="window.nsAddPurchaseLine()"
            class="bg-blue-50 text-blue-600 px-5 py-3 rounded-xl">
            + Add Product
          </button>

          <button onclick="window.nsSavePurchase()"
            class="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">
            Save Purchase
          </button>
        </div>

      </div>
    `;
  }

  function purchaseLine() {
    return `
      <tr class="border-t purchase-line">
        <td class="p-3">
          <select class="purchase-product w-full border rounded-lg px-3 py-2">
            <option value="">Select Product</option>
            ${products
              .map(
                (p) =>
                  `<option value="${p.id}">
                    ${esc(p.name)}
                  </option>`
              )
              .join("")}
          </select>
        </td>

        <td class="p-3">
          <input class="purchase-qty w-24 border rounded-lg px-3 py-2"
            type="number" step="0.01" value="1">
        </td>

        <td class="p-3">
          <input class="purchase-rate w-28 border rounded-lg px-3 py-2"
            type="number" step="0.01" value="0">
        </td>

        <td class="p-3 purchase-total">
          ₹0.00
        </td>

        <td class="p-3">
          <button onclick="this.closest('.purchase-line').remove()"
            class="text-red-600">
            ×
          </button>
        </td>
      </tr>
    `;
  }

  window.nsAddPurchaseLine = function () {
    const tbody = $("#purchase-lines");
    if (!tbody) return;

    tbody.insertAdjacentHTML(
      "beforeend",
      purchaseLine()
    );
  };

  window.nsSavePurchase = async function () {
    const supplierId =
      $("#purchase-supplier")?.value || null;

    const rows = $$(".purchase-line");

    const items = rows
      .map((row) => ({
        product_id: row.querySelector(".purchase-product")?.value,
        quantity: num(
          row.querySelector(".purchase-qty")?.value
        ),
        price: num(
          row.querySelector(".purchase-rate")?.value
        ),
      }))
      .filter(
        (x) =>
          x.product_id &&
          x.quantity > 0
      );

    if (!items.length) {
      toast("কমপক্ষে একটি Product দিন", "warning");
      return;
    }

    const total = items.reduce(
      (s, i) => s + i.quantity * i.price,
      0
    );

    const { data, error } = await db
      .from("purchases")
      .insert({
        supplier_id: supplierId,
        invoice_no:
          $("#purchase-invoice")?.value ||
          "PUR-" + uid(),
        total_amount: total,
        paid_amount: 0,
        due_amount: total,
        status: "received",
      })
      .select()
      .single();

    if (error) {
      toast("Purchase Save হয়নি: " + error.message, "error");
      return;
    }

    const purchaseItems = items.map((i) => ({
      purchase_id: data.id,
      product_id: i.product_id,
      quantity: i.quantity,
      price: i.price,
      total_amount: i.quantity * i.price,
    }));

    await db.from("purchase_items").insert(purchaseItems);

    for (const item of items) {
      const p = products.find(
        (x) => String(x.id) === String(item.product_id)
      );

      if (!p) continue;

      await db
        .from("products")
        .update({
          stock: stockQty(p) + item.quantity,
          purchase_price: item.price,
        })
        .eq("id", item.product_id);

      await db.from("stock_movements").insert({
        product_id: item.product_id,
        movement_type: "purchase",
        quantity: item.quantity,
        reference_id: data.id,
        reference_type: "purchases",
      });
    }

    if (supplierId) {
      const supplier = suppliers.find(
        (s) => String(s.id) === String(supplierId)
      );

      if (supplier) {
        await db
          .from("suppliers")
          .update({
            due_amount:
              num(supplier.due_amount) + total,
          })
          .eq("id", supplierId);
      }
    }

    toast("Purchase সফল হয়েছে");
    await loadAll();
    page = "purchaseHistory";
    render();
  };

  function purchaseHistoryPage() {
    return `
      ${sectionHeader(
        "Purchase History",
        "সব Purchase Invoice"
      )}

      <div class="bg-white border rounded-2xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4 text-left">Invoice</th>
              <th class="p-4 text-left">Date</th>
              <th class="p-4 text-right">Total</th>
              <th class="p-4 text-right">Paid</th>
              <th class="p-4 text-right">Due</th>
            </tr>
          </thead>

          <tbody>
            ${
              purchases.length
                ? purchases
                    .map(
                      (p) => `
                  <tr class="border-t">
                    <td class="p-4 font-semibold">
                      ${esc(p.invoice_no || "-")}
                    </td>
                    <td class="p-4">
                      ${esc(
                        String(p.created_at || "").slice(
                          0,
                          10
                        )
                      )}
                    </td>
                    <td class="p-4 text-right">
                      ${money(p.total_amount)}
                    </td>
                    <td class="p-4 text-right">
                      ${money(p.paid_amount)}
                    </td>
                    <td class="p-4 text-right text-red-600 font-bold">
                      ${money(p.due_amount)}
                    </td>
                  </tr>
                `
                    )
                    .join("")
                : `
                <tr>
                  <td colspan="5" class="p-10 text-center">
                    কোনো Purchase নেই
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>
    `;
  }

  /* =======================================================
     SALES HISTORY
     ======================================================= */

  function salesPage() {
    return `
      ${sectionHeader(
        "Sales History",
        "সব Sales Invoice"
      )}

      <div class="bg-white border rounded-2xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4 text-left">Invoice</th>
              <th class="p-4 text-left">Customer</th>
              <th class="p-4 text-left">Date</th>
              <th class="p-4 text-right">Total</th>
              <th class="p-4 text-right">Paid</th>
              <th class="p-4 text-right">Due</th>
            </tr>
          </thead>

          <tbody>
            ${
              sales.length
                ? sales
                    .map(
                      (s) => `
                  <tr class="border-t">
                    <td class="p-4 font-semibold">
                      ${esc(s.invoice_no || "-")}
                    </td>
                    <td class="p-4">
                      ${esc(
                        s.customer_name ||
                          "Walk-in Customer"
                      )}
                    </td>
                    <td class="p-4">
                      ${esc(
                        String(s.created_at || "").slice(
                          0,
                          10
                        )
                      )}
                    </td>
                    <td class="p-4 text-right font-bold">
                      ${money(s.total_amount)}
                    </td>
                    <td class="p-4 text-right">
                      ${money(s.paid_amount)}
                    </td>
                    <td class="p-4 text-right ${
                      num(s.due_amount) > 0
                        ? "text-red-600 font-bold"
                        : "text-emerald-600"
                    }">
                      ${money(s.due_amount)}
                    </td>
                  </tr>
                `
                    )
                    .join("")
                : `
                <tr>
                  <td colspan="6" class="p-10 text-center">
                    কোনো Sales নেই
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>
    `;
  }

  /* =======================================================
     EXPENSE
     ======================================================= */

  function expensesPage() {
    const total = expenses.reduce(
      (s, e) => s + num(e.amount),
      0
    );

    return `
      ${sectionHeader(
        "Expenses",
        "ব্যবসার খরচের হিসাব",
        "নতুন Expense",
        "window.nsAddExpense()"
      )}

      <div class="bg-white border rounded-2xl p-5 mb-5">
        <div class="text-sm text-slate-500">
          Total Expense
        </div>
        <div class="text-3xl font-bold text-red-600">
          ${money(total)}
        </div>
      </div>

      <div class="bg-white border rounded-2xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4 text-left">Date</th>
              <th class="p-4 text-left">Description</th>
              <th class="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses
              .map(
                (e) => `
              <tr class="border-t">
                <td class="p-4">
                  ${String(e.created_at || "").slice(0, 10)}
                </td>
                <td class="p-4">
                  ${esc(
                    e.description ||
                      e.category ||
                      "Expense"
                  )}
                </td>
                <td class="p-4 text-right font-bold">
                  ${money(e.amount)}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  window.nsAddExpense = function () {
    modal(
      "নতুন Expense",
      `
      <form onsubmit="window.nsSaveExpense(event)" class="space-y-4">

        <input name="description" required
          placeholder="Expense Description"
          class="w-full border rounded-xl px-4 py-3">

        <input name="amount" type="number"
          min="0.01" step="0.01" required
          placeholder="Amount"
          class="w-full border rounded-xl px-4 py-3">

        <input name="category"
          placeholder="Category"
          class="w-full border rounded-xl px-4 py-3">

        <button class="bg-red-600 text-white px-6 py-3 rounded-xl">
          Save Expense
        </button>

      </form>
      `
    );
  };

  window.nsSaveExpense = async function (event) {
    event.preventDefault();

    const fd = new FormData(event.target);

    const { error } = await db.from("expenses").insert({
      description: fd.get("description"),
      amount: num(fd.get("amount")),
      category: fd.get("category") || null,
    });

    if (error) {
      toast(error.message, "error");
      return;
    }

    nsCloseModal();
    toast("Expense saved");
    await loadAll();
  };

  /* =======================================================
     INCOME
     ======================================================= */

  function incomePage() {
    const total = incomes.reduce(
      (s, i) => s + num(i.amount),
      0
    );

    return `
      ${sectionHeader(
        "Income",
        "ব্যবসার অতিরিক্ত Income",
        "নতুন Income",
        "window.nsAddIncome()"
      )}

      <div class="bg-white border rounded-2xl p-5 mb-5">
        <div class="text-sm text-slate-500">
          Total Income
        </div>
        <div class="text-3xl font-bold text-emerald-600">
          ${money(total)}
        </div>
      </div>

      <div class="bg-white border rounded-2xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4 text-left">Date</th>
              <th class="p-4 text-left">Description</th>
              <th class="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${incomes
              .map(
                (i) => `
              <tr class="border-t">
                <td class="p-4">
                  ${String(i.created_at || "").slice(0, 10)}
                </td>
                <td class="p-4">
                  ${esc(
                    i.description ||
                      i.category ||
                      "Income"
                  )}
                </td>
                <td class="p-4 text-right font-bold">
                  ${money(i.amount)}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  window.nsAddIncome = function () {
    modal(
      "নতুন Income",
      `
      <form onsubmit="window.nsSaveIncome(event)" class="space-y-4">

        <input name="description" required
          placeholder="Income Description"
          class="w-full border rounded-xl px-4 py-3">

        <input name="amount" type="number"
          min="0.01" step="0.01" required
          placeholder="Amount"
          class="w-full border rounded-xl px-4 py-3">

        <input name="category"
          placeholder="Category"
          class="w-full border rounded-xl px-4 py-3">

        <button class="bg-emerald-600 text-white px-6 py-3 rounded-xl">
          Save Income
        </button>

      </form>
      `
    );
  };

  window.nsSaveIncome = async function (event) {
    event.preventDefault();

    const fd = new FormData(event.target);

    const { error } = await db.from("income").insert({
      description: fd.get("description"),
      amount: num(fd.get("amount")),
      category: fd.get("category") || null,
    });

    if (error) {
      toast(error.message, "error");
      return;
    }

    nsCloseModal();
    toast("Income saved");
    await loadAll();
  };

  /* =======================================================
     REPORTS
     ======================================================= */

  function salesReportPage() {
    const total = sales.reduce(
      (s, x) => s + num(x.total_amount),
      0
    );

    const paid = sales.reduce(
      (s, x) => s + num(x.paid_amount),
      0
    );

    const due = sales.reduce(
      (s, x) => s + num(x.due_amount),
      0
    );

    return reportBox(
      "Sales Report",
      `
      ${reportMetric("Total Sales", money(total))}
      ${reportMetric("Total Received", money(paid))}
      ${reportMetric("Total Due", money(due))}
      ${reportMetric("Invoices", sales.length)}
      `
    );
  }

  function purchaseReportPage() {
    const total = purchases.reduce(
      (s, x) => s + num(x.total_amount),
      0
    );

    return reportBox(
      "Purchase Report",
      `
      ${reportMetric("Total Purchase", money(total))}
      ${reportMetric("Purchase Invoices", purchases.length)}
      ${reportMetric("Supplier Due", money(getSupplierDue()))}
      `
    );
  }

  function stockReportPage() {
    return reportBox(
      "Stock Report",
      `
      ${reportMetric("Products", products.length)}
      ${reportMetric("Stock Quantity", getStockQty())}
      ${reportMetric("Stock Value", money(getStockValue()))}
      ${reportMetric("Low Stock", getLowStock().length)}
      `
    );
  }

  function dueReportPage() {
    return reportBox(
      "Due Report",
      `
      ${reportMetric("Customer Due", money(getCustomerDue()))}
      ${reportMetric("Supplier Due", money(getSupplierDue()))}
      ${reportMetric(
        "Total Receivable",
        money(getCustomerDue())
      )}
      ${reportMetric(
        "Total Payable",
        money(getSupplierDue())
      )}
      `
    );
  }

  function expenseReportPage() {
    const total = expenses.reduce(
      (s, e) => s + num(e.amount),
      0
    );

    return reportBox(
      "Expense Report",
      reportMetric("Total Expense", money(total))
    );
  }

  function incomeReportPage() {
    const total = incomes.reduce(
      (s, e) => s + num(e.amount),
      0
    );

    return reportBox(
      "Income Report",
      reportMetric("Total Income", money(total))
    );
  }

  function profitReportPage() {
    const salesTotal = sales.reduce(
      (s, x) => s + num(x.total_amount),
      0
    );

    const expenseTotal = expenses.reduce(
      (s, x) => s + num(x.amount),
      0
    );

    const incomeTotal = incomes.reduce(
      (s, x) => s + num(x.amount),
      0
    );

    const profit =
      salesTotal - expenseTotal + incomeTotal;

    return reportBox(
      "Profit Report",
      `
      ${reportMetric("Sales", money(salesTotal))}
      ${reportMetric("Income", money(incomeTotal))}
      ${reportMetric("Expense", money(expenseTotal))}
      ${reportMetric(
        "Estimated Net",
        money(profit)
      )}
      `
    );
  }

  function reportBox(title, content) {
    return `
      ${sectionHeader(title, "Business report")}

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        ${content}
      </div>
    `;
  }

  function reportMetric(label, value) {
    return `
      <div class="bg-white border rounded-2xl p-6">
        <div class="text-sm text-slate-500">${label}</div>
        <div class="text-2xl font-bold mt-2">${value}</div>
      </div>
    `;
  }

  function dayBookPage() {
    const all = [
      ...sales.map((s) => ({
        type: "Sale",
        date: s.created_at,
        amount: num(s.total_amount),
      })),

      ...purchases.map((p) => ({
        type: "Purchase",
        date: p.created_at,
        amount: num(p.total_amount),
      })),

      ...expenses.map((e) => ({
        type: "Expense",
        date: e.created_at,
        amount: num(e.amount),
      })),

      ...incomes.map((i) => ({
        type: "Income",
        date: i.created_at,
        amount: num(i.amount),
      })),
    ].sort(
      (a, b) =>
        new Date(b.date || 0) -
        new Date(a.date || 0)
    );

    return `
      ${sectionHeader(
        "Day Book",
        "সব ধরনের দৈনিক লেনদেন"
      )}

      <div class="bg-white border rounded-2xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4 text-left">Date</th>
              <th class="p-4 text-left">Type</th>
              <th class="p-4 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            ${all
              .slice(0, 300)
              .map(
                (x) => `
              <tr class="border-t">
                <td class="p-4">
                  ${String(x.date || "").slice(0, 10)}
                </td>
                <td class="p-4">${esc(x.type)}</td>
                <td class="p-4 text-right font-bold">
                  ${money(x.amount)}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  /* =======================================================
     GENERIC ACCOUNTING PAGES
     ======================================================= */

  function genericModulePage(title, description, icon) {
    return `
      ${sectionHeader(title, description)}

      <div class="bg-white border rounded-2xl p-8">

        <div class="text-5xl mb-4">${icon}</div>

        <h3 class="text-2xl font-bold mb-2">
          ${title}
        </h3>

        <p class="text-slate-600 mb-6">
          এই মডিউলের Database structure প্রস্তুত আছে।
          পরবর্তী Accounting phase-এ এখান থেকে পূর্ণ Entry,
          Edit, Delete এবং Ledger integration করা হবে।
        </p>

        <div class="grid md:grid-cols-3 gap-4">

          <div class="bg-slate-50 rounded-xl p-5">
            <div class="font-bold">Database Ready</div>
            <div class="text-sm text-slate-500 mt-1">
              Supabase table structure প্রস্তুত
            </div>
          </div>

          <div class="bg-slate-50 rounded-xl p-5">
            <div class="font-bold">Module Ready</div>
            <div class="text-sm text-slate-500 mt-1">
              Navigation এবং interface যুক্ত হয়েছে
            </div>
          </div>

          <div class="bg-slate-50 rounded-xl p-5">
            <div class="font-bold">Integration</div>
            <div class="text-sm text-slate-500 mt-1">
              Accounting transaction integration পরবর্তী ধাপ
            </div>
          </div>

        </div>
      </div>
    `;
  }

  /* =======================================================
     E-COMMERCE PAGES
     ======================================================= */

  function onlineOrdersPage() {
    return `
      ${sectionHeader(
        "Online Orders",
        "Website / E-commerce Orders"
      )}

      ${
        onlineOrders.length
          ? `
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${onlineOrders
            .map(
              (o) => `
            <div class="bg-white border rounded-2xl p-5">
              <div class="flex justify-between">
                <b>${esc(
                  o.order_no || o.id || "Order"
                )}</b>
                <span class="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs">
                  ${esc(o.status || "pending")}
                </span>
              </div>

              <div class="text-2xl font-bold mt-4">
                ${money(o.total_amount)}
              </div>

              <div class="text-sm text-slate-500 mt-2">
                ${String(o.created_at || "").slice(
                  0,
                  10
                )}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : emptyState("এখনও কোনো Online Order নেই")
      }
    `;
  }

  /* =======================================================
     BARCODE
     ======================================================= */

  function barcodePage() {
    return `
      ${sectionHeader(
        "Barcode Generator",
        "Product Barcode তৈরি ও Print"
      )}

      <div class="bg-white border rounded-2xl p-6 max-w-xl">

        <label class="font-semibold">Product</label>

        <select id="barcode-product"
          class="w-full border rounded-xl px-4 py-3 mt-1">
          <option value="">Select Product</option>
          ${products
            .map(
              (p) =>
                `<option value="${p.id}">
                  ${esc(p.name)} - ${esc(p.barcode || p.sku || "")}
                </option>`
            )
            .join("")}
        </select>

        <button onclick="window.nsShowBarcode()"
          class="bg-emerald-600 text-white px-6 py-3 rounded-xl mt-4">
          Generate
        </button>

        <div id="barcode-result" class="mt-6"></div>

      </div>
    `;
  }

  window.nsShowBarcode = function () {
    const id = $("#barcode-product")?.value;
    const p = products.find(
      (x) => String(x.id) === String(id)
    );

    if (!p) {
      toast("Product নির্বাচন করুন", "warning");
      return;
    }

    const code = p.barcode || p.sku || "NO-CODE";

    $("#barcode-result").innerHTML = `
      <div class="border rounded-xl p-6 text-center">
        <div class="text-3xl tracking-[8px] font-mono">
          ||||||||||||||||||||
        </div>

        <div class="font-bold mt-2">
          ${esc(p.name)}
        </div>

        <div>${esc(code)}</div>

        <button onclick="window.print()"
          class="bg-slate-900 text-white px-5 py-2 rounded-lg mt-4">
          Print
        </button>
      </div>
    `;
  };

  /* =======================================================
     SETTINGS
     ======================================================= */

  function settingsPage() {
    return `
      ${sectionHeader(
        "Settings",
        "Business, payment এবং application settings"
      )}

      <div class="grid lg:grid-cols-2 gap-5">

        <div class="bg-white border rounded-2xl p-6">

          <h3 class="text-lg font-bold mb-4">
            🏢 Business Settings
          </h3>

          <form onsubmit="window.nsSaveSettings(event)"
            class="space-y-4">

            <input name="business_name"
              value="${esc(
                businessSettings.business_name || ""
              )}"
              placeholder="Business Name"
              class="w-full border rounded-xl px-4 py-3">

            <input name="phone"
              value="${esc(
                businessSettings.phone || ""
              )}"
              placeholder="Phone"
              class="w-full border rounded-xl px-4 py-3">

            <input name="email"
              value="${esc(
                businessSettings.email || ""
              )}"
              placeholder="Email"
              class="w-full border rounded-xl px-4 py-3">

            <input name="gstin"
              value="${esc(
                businessSettings.gstin || ""
              )}"
              placeholder="GSTIN"
              class="w-full border rounded-xl px-4 py-3">

            <textarea name="address"
              placeholder="Business Address"
              class="w-full border rounded-xl px-4 py-3">${esc(
                businessSettings.address || ""
              )}</textarea>

            <button class="bg-emerald-600 text-white px-6 py-3 rounded-xl">
              Save Settings
            </button>

          </form>

        </div>

        <div class="bg-white border rounded-2xl p-6">

          <h3 class="text-lg font-bold mb-4">
            ⚙️ System Modules
          </h3>

          <div class="space-y-3">

            ${[
              "Accounting",
              "Inventory",
              "POS Billing",
              "Customer Due",
              "Supplier Due",
              "E-Commerce",
              "Reports",
              "Barcode",
              "Notifications",
            ]
              .map(
                (x) => `
              <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span>${x}</span>
                <span class="text-emerald-600 font-bold">
                  ON
                </span>
              </div>
            `
              )
              .join("")}

          </div>

        </div>

      </div>
    `;
  }

  window.nsSaveSettings = async function (event) {
    event.preventDefault();

    const fd = new FormData(event.target);

    const payload = {
      business_name: fd.get("business_name"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      gstin: fd.get("gstin"),
      address: fd.get("address"),
    };

    const { data: existing } = await db
      .from("business_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    let error;

    if (existing?.id) {
      ({ error } = await db
        .from("business_settings")
        .update(payload)
        .eq("id", existing.id));
    } else {
      ({ error } = await db
        .from("business_settings")
        .insert(payload));
    }

    if (error) {
      toast(error.message, "error");
      return;
    }

    businessSettings = {
      ...businessSettings,
      ...payload,
    };

    toast("Settings Saved");
    await loadAll();
  };

  /* =======================================================
     ROUTER
     ======================================================= */

  function pageContent() {
    switch (page) {
      case "dashboard":
        return dashboardPage();

      case "products":
        return productsPage();

      case "pos":
        return posPage();

      case "sales":
        return salesPage();

      case "customers":
        return customersPage();

      case "customerDue":
        return customerDuePage();

      case "suppliers":
        return suppliersPage();

      case "supplierDue":
        return supplierDuePage();

      case "purchase":
        return purchasePage();

      case "purchaseHistory":
        return purchaseHistoryPage();

      case "categories":
        return categoriesPage();

      case "brands":
        return brandsPage();

      case "stock":
        return stockPage();

      case "lowStock":
        return lowStockPage();

      case "expenses":
        return expensesPage();

      case "income":
        return incomePage();

      case "salesReport":
        return salesReportPage();

      case "purchaseReport":
        return purchaseReportPage();

      case "stockReport":
        return stockReportPage();

      case "dueReport":
        return dueReportPage();

      case "expenseReport":
        return expenseReportPage();

      case "incomeReport":
        return incomeReportPage();

      case "profitReport":
      case "profitLoss":
        return profitReportPage();

      case "dayBook":
        return dayBookPage();

      case "onlineOrders":
        return onlineOrdersPage();

      case "barcode":
        return barcodePage();

      case "settings":
        return settingsPage();

      case "salesReturn":
        return genericModulePage(
          "Sales Return",
          "Customer Return এবং Refund Management",
          "↩️"
        );

      case "customerPayment":
        return customerDuePage();

      case "variants":
        return genericModulePage(
          "Product Variants",
          "Size, Color এবং অন্যান্য Variant",
          "🔹"
        );

      case "stockAdjustment":
        return genericModulePage(
          "Stock Adjustment",
          "Stock বৃদ্ধি / কমানোর হিসাব",
          "🛠️"
        );

      case "stockTransfer":
        return genericModulePage(
          "Stock Transfer",
          "এক Warehouse থেকে অন্য Warehouse-এ Stock Transfer",
          "🔄"
        );

      case "stockHistory":
        return genericModulePage(
          "Stock History",
          "Product Stock-এর সম্পূর্ণ Movement History",
          "📜"
        );

      case "purchaseReturn":
        return genericModulePage(
          "Purchase Return",
          "Supplier-এর কাছে Purchase Return",
          "↩️"
        );

      case "purchaseOrders":
        return genericModulePage(
          "Purchase Orders",
          "Supplier Purchase Order Management",
          "📝"
        );

      case "supplierPayment":
        return supplierDuePage();

      case "accounts":
        return genericModulePage(
          "Accounts",
          "Business Account Management",
          "📒"
        );

      case "accountGroups":
        return genericModulePage(
          "Account Groups",
          "Chart of Accounts Group Management",
          "📚"
        );

      case "cashBank":
        return genericModulePage(
          "Cash & Bank",
          "Cash এবং Bank Account Management",
          "💵"
        );

      case "cashTransfer":
        return genericModulePage(
          "Cash / Bank Transfer",
          "Cash এবং Bank-এর মধ্যে Transfer",
          "🔁"
        );

      case "journal":
        return genericModulePage(
          "Journal Entry",
          "Double Entry Accounting Journal",
          "📓"
        );

      case "ledger":
        return genericModulePage(
          "Ledger",
          "Account-wise Ledger",
          "📖"
        );

      case "trialBalance":
        return genericModulePage(
          "Trial Balance",
          "Debit এবং Credit Trial Balance",
          "⚖️"
        );

      case "balanceSheet":
        return genericModulePage(
          "Balance Sheet",
          "Assets, Liabilities এবং Capital",
          "🏦"
        );

      case "ecommerceProducts":
        return genericModulePage(
          "Online Products",
          "E-Commerce Product Management",
          "🛍️"
        );

      case "productImages":
        return genericModulePage(
          "Product Images",
          "Online Product Images",
          "🖼️"
        );

      case "onlinePayments":
        return genericModulePage(
          "Online Payments",
          "Online Order Payment Management",
          "💳"
        );

      case "shipping":
        return genericModulePage(
          "Shipping",
          "Courier এবং Shipping Management",
          "🚚"
        );

      case "orderTracking":
        return genericModulePage(
          "Order Tracking",
          "Online Order Tracking",
          "📍"
        );

      case "onlineReturns":
        return genericModulePage(
          "Online Returns",
          "E-Commerce Return Management",
          "↩️"
        );

      case "wishlist":
        return genericModulePage(
          "Wishlist",
          "Customer Wishlist",
          "❤️"
        );

      case "barcodeTemplates":
        return genericModulePage(
          "Barcode Templates",
          "Barcode Print Template Management",
          "🏷️"
        );

      case "invoiceTemplates":
        return genericModulePage(
          "Invoice Templates",
          "Invoice Design এবং Print Template",
          "🧾"
        );

      case "users":
        return genericModulePage(
          "Users & Permissions",
          "User, Role এবং Permission Management",
          "👤"
        );

      case "activity":
        return genericModulePage(
          "Activity Log",
          "User Activity এবং System Log",
          "📝"
        );

      case "notifications":
        return genericModulePage(
          "Notifications",
          "Due Reminder এবং System Notification",
          "🔔"
        );

      default:
        return dashboardPage();
    }
  }

  /* =======================================================
     RENDER
     ======================================================= */

  function render() {
    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
      <div class="min-h-screen bg-slate-100 flex">

        ${renderSidebar()}

        <div class="flex-1 min-w-0">

          ${renderTopbar()}

          <main class="p-4 md:p-6 max-w-[1600px] mx-auto">
            ${pageContent()}
          </main>

        </div>

      </div>
    `;

    if (page === "pos") {
      setTimeout(() => {
        const total = cart.reduce(
          (s, i) => s + i.price * i.qty,
          0
        );

        const paid = $("#pos-paid");
        if (paid && !paid.value) {
          paid.value = total;
        }

        window.nsUpdatePOSTotal();
      }, 0);
    }
  }

  /* =======================================================
     GLOBAL REFERENCES
     ======================================================= */

  window.nsData = {
    get products() {
      return products;
    },
    get customers() {
      return customers;
    },
    get suppliers() {
      return suppliers;
    },
    get sales() {
      return sales;
    },
    get purchases() {
      return purchases;
    },
  };

  /* =======================================================
     START APPLICATION
     ======================================================= */

  loadAll();

})();
