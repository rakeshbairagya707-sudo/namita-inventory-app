"use strict";

/* =========================================================
   NAMITA STORE
   ACCOUNTING + INVENTORY + POS
   COMPLETE FRONTEND - PHASE 1
   ========================================================= */

const SUPABASE_URL = "https://ekcgmmtusasqziirkohd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_A2fNVKm3AGDq25-UroB-4Q_V3mcLrUO";

const { createClient } = window.supabase || supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =========================================================
   HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const money = (value) => {
  const n = Number(value || 0);
  return "₹" + n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const esc = (value) =>
  String(value ?? "").replace(/[&<>'"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  }[c]));

const today = () => new Date().toISOString().slice(0, 10);

const dateTime = () =>
  new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });

const generateInvoiceNo = () => {
  const d = new Date();

  const pad = (n) => String(n).padStart(2, "0");

  return (
    "INV-" +
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "-" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
};

const toast = (message, type = "success") => {
  let box = document.getElementById("ns-toast");

  if (!box) {
    box = document.createElement("div");
    box.id = "ns-toast";
    box.className =
      "fixed right-5 top-5 z-[9999] max-w-sm rounded-xl px-5 py-3 shadow-xl text-white font-semibold";
    document.body.appendChild(box);
  }

  box.textContent = message;

  box.className =
    "fixed right-5 top-5 z-[9999] max-w-sm rounded-xl px-5 py-3 shadow-xl text-white font-semibold " +
    (type === "error" ? "bg-red-600" : "bg-emerald-600");

  clearTimeout(window.__nsToastTimer);

  window.__nsToastTimer = setTimeout(() => {
    box.remove();
  }, 3000);
};

const confirmAction = (message) => window.confirm(message);

/* =========================================================
   STATE
   ========================================================= */

let page = "dashboard";

let products = [];
let customers = [];
let suppliers = [];
let sales = [];

let cart = [];
let selectedCustomer = "";

let businessSettings = {
  business_name: "NAMITA STORE",
  phone: "",
  address: "",
  gstin: "",
  invoice_prefix: "INV"
};

let currentSale = null;

/* =========================================================
   PRODUCT PRICE HELPER
   ========================================================= */

function getProductPrice(product) {
  if (product.sale_price !== undefined && product.sale_price !== null) {
    return num(product.sale_price);
  }

  return num(product.price);
}

function getProductStock(product) {
  return num(product.stock);
}

/* =========================================================
   LOAD ALL DATA
   ========================================================= */

async function loadAll() {
  try {
    const [
      productsResponse,
      customersResponse,
      suppliersResponse,
      salesResponse,
      settingsResponse
    ] = await Promise.all([
      db
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),

      db
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false }),

      db
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false }),

      db
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),

      db
        .from("business_settings")
        .select("*")
        .limit(1)
    ]);

    if (productsResponse.error) {
      console.error(productsResponse.error);
      toast("Products load করতে সমস্যা হয়েছে", "error");
    } else {
      products = productsResponse.data || [];
    }

    if (customersResponse.error) {
      console.error(customersResponse.error);
      customers = [];
    } else {
      customers = customersResponse.data || [];
    }

    if (suppliersResponse.error) {
      console.error(suppliersResponse.error);
      suppliers = [];
    } else {
      suppliers = suppliersResponse.data || [];
    }

    if (salesResponse.error) {
      console.error(salesResponse.error);
      sales = [];
    } else {
      sales = salesResponse.data || [];
    }

    if (
      settingsResponse.data &&
      settingsResponse.data.length
    ) {
      businessSettings = {
        ...businessSettings,
        ...settingsResponse.data[0]
      };
    }

    render();
  } catch (error) {
    console.error(error);
    toast("Database connection error", "error");
  }
}

/* =========================================================
   MAIN RENDER
   ========================================================= */

function render() {
  const app = $("#app");

  if (!app) return;

  app.innerHTML = `
    <div class="min-h-screen bg-slate-100">

      <!-- HEADER -->
      <header class="bg-slate-900 text-white shadow-lg">
        <div class="max-w-[1600px] mx-auto px-4 py-4">

          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>
              <div class="text-2xl font-black tracking-wide">
                ${esc(businessSettings.business_name || "NAMITA STORE")}
              </div>

              <div class="text-xs text-slate-300 mt-1">
                Accounting • Billing • Inventory Management
              </div>
            </div>

            <div class="text-sm text-slate-300">
              ${dateTime()}
            </div>

          </div>

        </div>
      </header>

      <!-- NAVIGATION -->
      <nav class="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div class="max-w-[1600px] mx-auto px-3">

          <div class="flex gap-1 overflow-x-auto py-2">

            ${navButton("dashboard", "📊 Dashboard")}
            ${navButton("products", "📦 Products")}
            ${navButton("pos", "🧾 POS Billing")}
            ${navButton("sales", "💰 Sales")}
            ${navButton("customers", "👥 Customers")}
            ${navButton("suppliers", "🚚 Suppliers")}
            ${navButton("reports", "📈 Reports")}
            ${navButton("settings", "⚙️ Settings")}

          </div>

        </div>
      </nav>

      <!-- CONTENT -->
      <main class="max-w-[1600px] mx-auto p-4 md:p-6">

        ${renderPage()}

      </main>

    </div>
  `;
}

function navButton(key, label) {
  return `
    <button
      onclick="go('${key}')"
      class="px-4 py-2 rounded-lg whitespace-nowrap text-sm font-bold
      ${
        page === key
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }"
    >
      ${label}
    </button>
  `;
}

function renderPage() {
  switch (page) {
    case "products":
      return renderProducts();

    case "pos":
      return renderPOS();

    case "sales":
      return renderSales();

    case "customers":
      return renderCustomers();

    case "suppliers":
      return renderSuppliers();

    case "reports":
      return renderReports();

    case "settings":
      return renderSettings();

    default:
      return renderDashboard();
  }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function go(targetPage) {
  page = targetPage;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {
  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, p) => sum + getProductStock(p),
    0
  );

  const customerDue = customers.reduce(
    (sum, c) => sum + num(c.due_amount),
    0
  );

  const supplierDue = suppliers.reduce(
    (sum, s) => sum + num(s.due_amount),
    0
  );

  const totalSales = sales.reduce(
    (sum, s) => sum + num(s.total_amount),
    0
  );

  const todaySales = sales
    .filter((s) => {
      const d = s.created_at
        ? new Date(s.created_at).toISOString().slice(0, 10)
        : "";

      return d === today();
    })
    .reduce((sum, s) => sum + num(s.total_amount), 0);

  const lowStockProducts = products.filter((p) => {
    const minimum =
      p.minimum_stock !== undefined
        ? num(p.minimum_stock)
        : 5;

    return getProductStock(p) <= minimum;
  });

  return `
    <div class="space-y-6">

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 class="text-3xl font-black">Dashboard</h1>
          <p class="text-slate-500 mt-1">
            ব্যবসার বর্তমান হিসাব এক নজরে দেখুন
          </p>
        </div>

        <button
          onclick="go('pos')"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold shadow"
        >
          + নতুন বিল করুন
        </button>
      </div>

      <!-- STAT CARDS -->

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        ${statCard(
          "📦",
          "মোট Products",
          totalProducts,
          "bg-blue-50"
        )}

        ${statCard(
          "📊",
          "মোট Stock",
          totalStock,
          "bg-indigo-50"
        )}

        ${statCard(
          "💰",
          "আজকের Sales",
          money(todaySales),
          "bg-emerald-50"
        )}

        ${statCard(
          "⚠️",
          "Customer Due",
          money(customerDue),
          "bg-red-50"
        )}

      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- BUSINESS SUMMARY -->

        <section class="bg-white rounded-2xl shadow-sm border p-5">

          <h2 class="text-xl font-black mb-4">
            ব্যবসার সারাংশ
          </h2>

          <div class="space-y-3">

            ${summaryRow(
              "মোট Sales",
              money(totalSales)
            )}

            ${summaryRow(
              "Customer Due",
              money(customerDue)
            )}

            ${summaryRow(
              "Supplier Due",
              money(supplierDue)
            )}

            ${summaryRow(
              "মোট Stock Quantity",
              totalStock
            )}

          </div>

        </section>

        <!-- LOW STOCK -->

        <section class="bg-white rounded-2xl shadow-sm border p-5">

          <div class="flex items-center justify-between mb-4">

            <h2 class="text-xl font-black">
              Low Stock Products
            </h2>

            <span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
              ${lowStockProducts.length}
            </span>

          </div>

          ${
            lowStockProducts.length
              ? `
                <div class="space-y-2">

                  ${lowStockProducts
                    .slice(0, 8)
                    .map(
                      (p) => `
                      <div class="flex justify-between items-center border rounded-xl p-3">

                        <div>
                          <div class="font-bold">
                            ${esc(p.name)}
                          </div>

                          <div class="text-xs text-slate-500">
                            SKU: ${esc(p.sku || "-")}
                          </div>
                        </div>

                        <div class="font-black text-red-600">
                          ${getProductStock(p)}
                        </div>

                      </div>
                    `
                    )
                    .join("")}

                </div>
              `
              : `
                <div class="text-center py-10 text-emerald-600 font-bold">
                  ✅ সব Product-এর Stock ঠিক আছে
                </div>
              `
          }

        </section>

      </div>

    </div>
  `;
}

function statCard(icon, title, value, bg) {
  return `
    <div class="${bg} rounded-2xl border p-5">

      <div class="text-3xl mb-3">${icon}</div>

      <div class="text-sm text-slate-500 font-semibold">
        ${title}
      </div>

      <div class="text-2xl font-black mt-1">
        ${value}
      </div>

    </div>
  `;
}

function summaryRow(label, value) {
  return `
    <div class="flex justify-between border-b pb-3">
      <span class="text-slate-600">
        ${label}
      </span>

      <span class="font-black">
        ${value}
      </span>
    </div>
  `;
}

/* =========================================================
   PRODUCTS
   ========================================================= */

function renderProducts() {
  return `
    <div class="space-y-6">

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        <div>
          <h1 class="text-3xl font-black">
            Product Management
          </h1>

          <p class="text-slate-500">
            Product, price এবং stock পরিচালনা করুন
          </p>
        </div>

        <button
          onclick="openProductForm()"
          class="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold"
        >
          + নতুন Product
        </button>

      </div>

      <div class="bg-white rounded-2xl border shadow-sm overflow-hidden">

        <div class="p-4 border-b">
          <input
            id="product-search"
            oninput="filterProducts()"
            placeholder="🔍 Product / SKU / Barcode খুঁজুন..."
            class="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
          >
        </div>

        <div id="product-table-container">
          ${productTable(products)}
        </div>

      </div>

    </div>
  `;
}

function productTable(list) {
  if (!list.length) {
    return `
      <div class="text-center py-16 text-slate-500">
        কোনো Product পাওয়া যায়নি।
      </div>
    `;
  }

  return `
    <div class="overflow-x-auto">

      <table class="w-full text-sm">

        <thead class="bg-slate-100">

          <tr>
            <th class="text-left p-3">Product</th>
            <th class="text-left p-3">SKU</th>
            <th class="text-right p-3">Purchase</th>
            <th class="text-right p-3">Sale</th>
            <th class="text-right p-3">Stock</th>
            <th class="text-center p-3">Action</th>
          </tr>

        </thead>

        <tbody>

          ${list
            .map(
              (p) => `
              <tr class="border-t hover:bg-slate-50">

                <td class="p-3 font-bold">
                  ${esc(p.name)}
                </td>

                <td class="p-3">
                  ${esc(p.sku || "-")}
                </td>

                <td class="p-3 text-right">
                  ${money(p.purchase_price || 0)}
                </td>

                <td class="p-3 text-right font-bold">
                  ${money(getProductPrice(p))}
                </td>

                <td class="p-3 text-right">

                  <span class="${
                    getProductStock(p) <= 5
                      ? "text-red-600"
                      : "text-emerald-600"
                  } font-black">

                    ${getProductStock(p)}

                  </span>

                </td>

                <td class="p-3">

                  <div class="flex justify-center gap-2">

                    <button
                      onclick="editProduct('${p.id}')"
                      class="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold"
                    >
                      Edit
                    </button>

                    <button
                      onclick="deleteProduct('${p.id}')"
                      class="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-bold"
                    >
                      Delete
                    </button>

                  </div>

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

/* =========================================================
   PRODUCT SEARCH
   ========================================================= */

function filterProducts() {
  const input = $("#product-search");

  if (!input) return;

  const q = input.value.trim().toLowerCase();

  const filtered = products.filter((p) => {
    return (
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.sku || "").toLowerCase().includes(q) ||
      String(p.barcode || "").toLowerCase().includes(q) ||
      String(p.category || "").toLowerCase().includes(q)
    );
  });

  const container = $("#product-table-container");

  if (container) {
    container.innerHTML = productTable(filtered);
  }
}

/* =========================================================
   PRODUCT FORM
   ========================================================= */

function openProductForm(productId = "") {
  const product = productId
    ? products.find((p) => String(p.id) === String(productId))
    : null;

  const overlay = document.createElement("div");

  overlay.id = "ns-modal";

  overlay.className =
    "fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4";

  overlay.innerHTML = `
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">

      <div class="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">

        <h2 class="text-xl font-black">
          ${product ? "Product Edit" : "নতুন Product"}
        </h2>

        <button
          onclick="closeModal()"
          class="text-2xl"
        >
          ×
        </button>

      </div>

      <form
        onsubmit="saveProduct(event, '${product ? product.id : ""}')"
        class="p-5 space-y-4"
      >

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          ${inputField(
            "Product Name",
            "p-name",
            product?.name || "",
            true
          )}

          ${inputField(
            "SKU",
            "p-sku",
            product?.sku || ""
          )}

          ${inputField(
            "Barcode",
            "p-barcode",
            product?.barcode || ""
          )}

          ${inputField(
            "Category",
            "p-category",
            product?.category || ""
          )}

          ${inputField(
            "Brand",
            "p-brand",
            product?.brand || ""
          )}

          ${inputField(
            "Unit",
            "p-unit",
            product?.unit || "pcs"
          )}

          ${inputField(
            "Purchase Price",
            "p-purchase",
            product?.purchase_price || 0,
            false,
            "number",
            "0.01"
          )}

          ${inputField(
            "Sale Price",
            "p-sale",
            getProductPrice(product || {}),
            true,
            "number",
            "0.01"
          )}

          ${inputField(
            "MRP",
            "p-mrp",
            product?.mrp || 0,
            false,
            "number",
            "0.01"
          )}

          ${inputField(
            "Wholesale Price",
            "p-wholesale",
            product?.wholesale_price || 0,
            false,
            "number",
            "0.01"
          )}

          ${inputField(
            "Minimum Stock",
            "p-minimum",
            product?.minimum_stock || 5,
            false,
            "number",
            "1"
          )}

          ${inputField(
            "Stock",
            "p-stock",
            product?.stock || 0,
            false,
            "number",
            "1"
          )}

          ${inputField(
            "Tax %",
            "p-tax",
            product?.tax_rate || 0,
            false,
            "number",
            "0.01"
          )}

        </div>

        <div>
          <label class="block text-sm font-bold mb-1">
            Description
          </label>

          <textarea
            id="p-description"
            rows="3"
            class="w-full border rounded-xl px-3 py-2"
          >${esc(product?.description || "")}</textarea>
        </div>

        <div class="flex justify-end gap-3 pt-3">

          <button
            type="button"
            onclick="closeModal()"
            class="px-5 py-3 rounded-xl bg-slate-100 font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold"
          >
            ${product ? "Update Product" : "Save Product"}
          </button>

        </div>

      </form>

    </div>
  `;

  document.body.appendChild(overlay);
}

function inputField(
  label,
  id,
  value = "",
  required = false,
  type = "text",
  step = ""
) {
  return `
    <div>

      <label class="block text-sm font-bold mb-1">
        ${label}
      </label>

      <input
        id="${id}"
        type="${type}"
        value="${esc(value)}"
        ${required ? "required" : ""}
        ${step ? `step="${step}"` : ""}
        class="w-full border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
      >

    </div>
  `;
}

function closeModal() {
  const modal = $("#ns-modal");

  if (modal) modal.remove();
}

/* =========================================================
   SAVE PRODUCT
   ========================================================= */

async function saveProduct(event, productId) {
  event.preventDefault();

  const name = $("#p-name")?.value.trim();

  if (!name) {
    toast("Product Name দিন", "error");
    return;
  }

  const salePrice = num($("#p-sale")?.value);

  const payload = {
    name,
    sku: $("#p-sku")?.value.trim() || null,
    barcode: $("#p-barcode")?.value.trim() || null,
    category: $("#p-category")?.value.trim() || null,
    brand: $("#p-brand")?.value.trim() || null,
    unit: $("#p-unit")?.value.trim() || "pcs",
    purchase_price: num($("#p-purchase")?.value),
    sale_price: salePrice,
    price: salePrice,
    mrp: num($("#p-mrp")?.value),
    wholesale_price: num($("#p-wholesale")?.value),
    minimum_stock: num($("#p-minimum")?.value),
    stock: num($("#p-stock")?.value),
    tax_rate: num($("#p-tax")?.value),
    description: $("#p-description")?.value.trim() || null
  };

  try {
    let response;

    if (productId) {
      response = await db
        .from("products")
        .update(payload)
        .eq("id", productId);
    } else {
      response = await db
        .from("products")
        .insert(payload);
    }

    if (response.error) {
      console.error(response.error);
      toast(response.error.message || "Product save হয়নি", "error");
      return;
    }

    closeModal();

    toast(
      productId
        ? "Product successfully updated"
        : "Product successfully added"
    );

    await loadAll();
  } catch (error) {
    console.error(error);
    toast("Product save করতে সমস্যা হয়েছে", "error");
  }
}

/* =========================================================
   EDIT PRODUCT
   ========================================================= */

function editProduct(id) {
  openProductForm(id);
}

/* =========================================================
   DELETE PRODUCT
   ========================================================= */

async function deleteProduct(id) {
  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  if (!product) return;

  if (
    !confirmAction(
      `"${product.name}" Product delete করতে চান?`
    )
  ) {
    return;
  }

  try {
    const response = await db
      .from("products")
      .delete()
      .eq("id", id);

    if (response.error) {
      console.error(response.error);
      toast(
        response.error.message || "Delete failed",
        "error"
      );
      return;
    }

    toast("Product deleted");

    await loadAll();
  } catch (error) {
    console.error(error);
    toast("Delete করতে সমস্যা হয়েছে", "error");
  }
}

/* =========================================================
   POS
   ========================================================= */

function renderPOS() {
  const subtotal = calculateSubtotal();
  const discount = getPOSDiscount();
  const tax = calculateTaxAfterDiscount();
  const roundOff = getRoundOff(subtotal - discount + tax);
  const grandTotal =
    subtotal -
    discount +
    tax +
    roundOff;

  return `
    <div class="space-y-5">

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        <div>
          <h1 class="text-3xl font-black">
            POS Billing
          </h1>

          <p class="text-slate-500">
            নতুন Sales Invoice তৈরি করুন
          </p>
        </div>

        <div class="font-bold text-slate-600">
          Invoice: ${generateInvoiceNo()}
        </div>

      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">

        <!-- PRODUCTS -->

        <section class="xl:col-span-2 bg-white rounded-2xl border shadow-sm">

          <div class="p-4 border-b">

            <input
              id="pos-product-search"
              oninput="filterPOSProducts()"
              placeholder="🔍 Product / Barcode / SKU খুঁজুন..."
              class="w-full border rounded-xl px-4 py-3"
            >

          </div>

          <div
            id="pos-product-list"
            class="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[650px] overflow-y-auto"
          >

            ${posProducts(products)}

          </div>

        </section>

        <!-- CART -->

        <section class="bg-white rounded-2xl border shadow-sm overflow-hidden">

          <div class="bg-slate-900 text-white p-4">

            <div class="flex justify-between items-center">

              <h2 class="text-xl font-black">
                Current Bill
              </h2>

              <button
                onclick="clearCart()"
                class="text-xs bg-red-500 px-3 py-1.5 rounded-lg font-bold"
              >
                Clear
              </button>

            </div>

          </div>

          <div class="p-4 space-y-4">

            <div>

              <label class="text-sm font-bold">
                Customer
              </label>

              <select
                id="pos-customer"
                onchange="selectedCustomer=this.value"
                class="w-full border rounded-xl px-3 py-3 mt-1"
              >

                <option value="">
                  Walk-in Customer
                </option>

                ${customers
                  .map(
                    (c) => `
                    <option
                      value="${c.id}"
                      ${
                        selectedCustomer === String(c.id)
                          ? "selected"
                          : ""
                      }
                    >
                      ${esc(c.name)} ${
                      c.phone
                        ? " - " + esc(c.phone)
                        : ""
                    }
                    </option>
                  `
                  )
                  .join("")}

              </select>

            </div>

            <div
              id="cart-items"
              class="space-y-2 max-h-[320px] overflow-y-auto"
            >
              ${renderCartItems()}
            </div>

            <div class="border-t pt-4 space-y-3">

              <div class="flex justify-between">
                <span>Subtotal</span>
                <strong>${money(subtotal)}</strong>
              </div>

              <div>

                <label class="text-sm font-bold">
                  Discount
                </label>

                <input
                  id="pos-discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value="${discount}"
                  oninput="refreshPOSSummary()"
                  class="w-full border rounded-xl px-3 py-2 mt-1"
                >

              </div>

              <div>

                <label class="text-sm font-bold">
                  Tax %
                </label>

                <input
                  id="pos-tax-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value="0"
                  oninput="refreshPOSSummary()"
                  class="w-full border rounded-xl px-3 py-2 mt-1"
                >

              </div>

              <div class="flex justify-between">
                <span>Tax</span>
                <strong id="pos-tax-display">
                  ${money(tax)}
                </strong>
              </div>

              <div class="flex justify-between">
                <span>Round Off</span>
                <strong id="pos-round-display">
                  ${money(roundOff)}
                </strong>
              </div>

              <div class="flex justify-between text-xl">
                <span class="font-black">
                  Grand Total
                </span>

                <strong
                  id="pos-total-display"
                  class="text-emerald-600"
                >
                  ${money(grandTotal)}
                </strong>
              </div>

            </div>

            <div>

              <label class="text-sm font-bold">
                Payment Method
              </label>

              <select
                id="pos-payment-method"
                class="w-full border rounded-xl px-3 py-3 mt-1"
              >

                <option value="cash">
                  Cash
                </option>

                <option value="upi">
                  UPI
                </option>

                <option value="card">
                  Card
                </option>

                <option value="bank">
                  Bank
                </option>

              </select>

            </div>

            <div>

              <label class="text-sm font-bold">
                Paid Amount
              </label>

              <input
                id="pos-paid"
                type="number"
                min="0"
                step="0.01"
                value="${grandTotal}"
                oninput="refreshPOSSummary()"
                class="w-full border rounded-xl px-3 py-3 mt-1 text-lg font-bold"
              >

            </div>

            <div class="flex justify-between">

              <span>Due</span>

              <strong
                id="pos-due-display"
                class="text-red-600"
              >
                ${money(Math.max(0, grandTotal - grandTotal))}
              </strong>

            </div>

            <button
              onclick="completeSale()"
              class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-lg"
            >
              ✓ COMPLETE SALE
            </button>

          </div>

        </section>

      </div>

    </div>
  `;
}

/* =========================================================
   POS PRODUCTS
   ========================================================= */

function posProducts(list) {
  if (!list.length) {
    return `
      <div class="col-span-full text-center py-12 text-slate-500">
        কোনো Product নেই।
      </div>
    `;
  }

  return list
    .map((p) => {
      const stock = getProductStock(p);
      const price = getProductPrice(p);

      return `
        <button
          onclick="addToCart('${p.id}')"
          ${
            stock <= 0
              ? "disabled"
              : ""
          }
          class="text-left border rounded-2xl p-3 hover:shadow-md transition
          ${
            stock <= 0
              ? "opacity-50 cursor-not-allowed bg-slate-100"
              : "bg-white hover:border-slate-400"
          }"
        >

          <div class="font-black line-clamp-2 min-h-[44px]">
            ${esc(p.name)}
          </div>

          <div class="text-emerald-600 font-black mt-2">
            ${money(price)}
          </div>

          <div class="text-xs mt-1 ${
            stock <= 5
              ? "text-red-600"
              : "text-slate-500"
          }">
            Stock: ${stock}
          </div>

        </button>
      `;
    })
    .join("");
}

function filterPOSProducts() {
  const q =
    $("#pos-product-search")?.value
      .trim()
      .toLowerCase() || "";

  const filtered = products.filter((p) => {
    return (
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.sku || "").toLowerCase().includes(q) ||
      String(p.barcode || "").toLowerCase().includes(q) ||
      String(p.category || "").toLowerCase().includes(q)
    );
  });

  const container = $("#pos-product-list");

  if (container) {
    container.innerHTML = posProducts(filtered);
  }
}

/* =========================================================
   CART
   ========================================================= */

function addToCart(productId) {
  const product = products.find(
    (p) => String(p.id) === String(productId)
  );

  if (!product) {
    toast("Product পাওয়া যায়নি", "error");
    return;
  }

  const stock = getProductStock(product);

  if (stock <= 0) {
    toast("এই Product-এর Stock শেষ", "error");
    return;
  }

  const existing = cart.find(
    (item) =>
      String(item.product_id) ===
      String(productId)
  );

  if (existing) {
    if (existing.quantity >= stock) {
      toast("Available stock-এর বেশি নেওয়া যাবে না", "error");
      return;
    }

    existing.quantity += 1;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      quantity: 1,
      price: getProductPrice(product),
      purchase_price: num(product.purchase_price),
      tax_rate: num(product.tax_rate),
      stock
    });
  }

  refreshPOSCart();
}

function changeCartQty(productId, delta) {
  const item = cart.find(
    (x) =>
      String(x.product_id) ===
      String(productId)
  );

  if (!item) return;

  const product = products.find(
    (p) =>
      String(p.id) ===
      String(productId)
  );

  if (!product) return;

  const newQty = item.quantity + delta;

  if (newQty <= 0) {
    cart = cart.filter(
      (x) =>
        String(x.product_id) !==
        String(productId)
    );
  } else if (newQty > getProductStock(product)) {
    toast("Available stock-এর বেশি নেওয়া যাবে না", "error");
    return;
  } else {
    item.quantity = newQty;
  }

  refreshPOSCart();
}

function removeCartItem(productId) {
  cart = cart.filter(
    (item) =>
      String(item.product_id) !==
      String(productId)
  );

  refreshPOSCart();
}

function clearCart() {
  if (!cart.length) return;

  if (!confirmAction("Current bill clear করতে চান?")) {
    return;
  }

  cart = [];

  refreshPOSCart();
}

function calculateSubtotal() {
  return cart.reduce(
    (sum, item) =>
      sum +
      num(item.price) *
        num(item.quantity),
    0
  );
}

function getPOSDiscount() {
  return Math.max(
    0,
    num($("#pos-discount")?.value)
  );
}

function calculateTaxAfterDiscount() {
  const subtotal = calculateSubtotal();
  const discount = getPOSDiscount();

  const taxable =
    Math.max(0, subtotal - discount);

  const rate = num(
    $("#pos-tax-rate")?.value
  );

  return taxable * rate / 100;
}

function getRoundOff(value) {
  if (!value) return 0;

  return Number(
    (Math.round(value) - value).toFixed(2)
  );
}

function calculateGrandTotal() {
  const subtotal = calculateSubtotal();
  const discount = getPOSDiscount();
  const tax = calculateTaxAfterDiscount();

  const afterTax =
    subtotal -
    discount +
    tax;

  const roundOff = getRoundOff(afterTax);

  return Number(
    (afterTax + roundOff).toFixed(2)
  );
}

function renderCartItems() {
  if (!cart.length) {
    return `
      <div class="text-center py-10 text-slate-400">
        Cart খালি
      </div>
    `;
  }

  return cart
    .map(
      (item) => `
      <div class="border rounded-xl p-3">

        <div class="flex justify-between gap-2">

          <div class="min-w-0">

            <div class="font-bold truncate">
              ${esc(item.name)}
            </div>

            <div class="text-xs text-slate-500">
              ${money(item.price)} × ${item.quantity}
            </div>

          </div>

          <div class="font-black">
            ${money(
              item.price *
                item.quantity
            )}
          </div>

        </div>

        <div class="flex items-center justify-between mt-2">

          <div class="flex items-center gap-2">

            <button
              onclick="changeCartQty('${item.product_id}', -1)"
              class="w-8 h-8 rounded-lg bg-slate-100 font-black"
            >
              −
            </button>

            <span class="font-black">
              ${item.quantity}
            </span>

            <button
              onclick="changeCartQty('${item.product_id}', 1)"
              class="w-8 h-8 rounded-lg bg-slate-100 font-black"
            >
              +
            </button>

          </div>

          <button
            onclick="removeCartItem('${item.product_id}')"
            class="text-red-600 text-sm font-bold"
          >
            Remove
          </button>

        </div>

      </div>
    `
    )
    .join("");
}

function refreshPOSCart() {
  const cartContainer = $("#cart-items");

  if (cartContainer) {
    cartContainer.innerHTML =
      renderCartItems();
  }

  refreshPOSSummary();
}

function refreshPOSSummary() {
  const subtotal = calculateSubtotal();
  const discount = getPOSDiscount();
  const tax = calculateTaxAfterDiscount();

  const afterTax =
    subtotal -
    discount +
    tax;

  const roundOff =
    getRoundOff(afterTax);

  const total =
    afterTax +
    roundOff;

  const paid =
    Math.max(
      0,
      num($("#pos-paid")?.value)
    );

  const due =
    Math.max(
      0,
      total - paid
    );

  const taxDisplay =
    $("#pos-tax-display");

  const roundDisplay =
    $("#pos-round-display");

  const totalDisplay =
    $("#pos-total-display");

  const dueDisplay =
    $("#pos-due-display");

  if (taxDisplay)
    taxDisplay.textContent =
      money(tax);

  if (roundDisplay)
    roundDisplay.textContent =
      money(roundOff);

  if (totalDisplay)
    totalDisplay.textContent =
      money(total);

  if (dueDisplay)
    dueDisplay.textContent =
      money(due);
}

/* =========================================================
   COMPLETE SALE
   ========================================================= */

async function completeSale() {
  if (!cart.length) {
    toast("Cart খালি", "error");
    return;
  }

  const customerId =
    $("#pos-customer")?.value || null;

  const customer =
    customers.find(
      (c) =>
        String(c.id) ===
        String(customerId)
    ) || null;

  const subtotal =
    calculateSubtotal();

  const discount =
    getPOSDiscount();

  const taxAmount =
    calculateTaxAfterDiscount();

  const beforeRound =
    subtotal -
    discount +
    taxAmount;

  const roundOff =
    getRoundOff(beforeRound);

  const total =
    Number(
      (
        beforeRound +
        roundOff
      ).toFixed(2)
    );

  let paid =
    num($("#pos-paid")?.value);

  if (paid < 0) {
    toast("Paid amount ভুল", "error");
    return;
  }

  if (paid > total) {
    paid = total;
  }

  const due =
    Number(
      Math.max(
        0,
        total - paid
      ).toFixed(2)
    );

  if (
    due > 0 &&
    !customerId
  ) {
    toast(
      "Due Sale-এর জন্য Customer নির্বাচন করুন",
      "error"
    );
    return;
  }

  const invoiceNo =
    generateInvoiceNo();

  const paymentMethod =
    $("#pos-payment-method")?.value ||
    "cash";

  const paymentStatus =
    due <= 0
      ? "paid"
      : paid > 0
      ? "partial"
      : "unpaid";

  const salePayload = {
    invoice_no: invoiceNo,
    customer_id: customerId,
    customer_name:
      customer?.name ||
      "Walk-in Customer",
    subtotal,
    discount,
    tax_amount: taxAmount,
    round_off: roundOff,
    total_amount: total,
    paid_amount: paid,
    due_amount: due,
    payment_status: paymentStatus,
    sale_type: "pos",
    status: "completed",
    notes: null
  };

  try {
    /* -----------------------------------------
       1. CREATE SALE
       ----------------------------------------- */

    const saleResponse = await db
      .from("sales")
      .insert(salePayload)
      .select()
      .single();

    if (saleResponse.error) {
      console.error(saleResponse.error);

      toast(
        saleResponse.error.message ||
          "Sale save হয়নি",
        "error"
      );

      return;
    }

    const sale =
      saleResponse.data;

    /* -----------------------------------------
       2. SALE ITEMS
       ----------------------------------------- */

    const saleItems = cart.map(
      (item) => {
        const lineSubtotal =
          num(item.price) *
          num(item.quantity);

        const lineTax =
          lineSubtotal *
          num(item.tax_rate) /
          100;

        return {
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          purchase_price:
            item.purchase_price,
          discount: 0,
          tax_rate:
            item.tax_rate || 0,
          tax_amount: lineTax,
          total_amount:
            lineSubtotal + lineTax
        };
      }
    );

    const itemsResponse =
      await db
        .from("sale_items")
        .insert(saleItems);

    if (itemsResponse.error) {
      console.error(
        itemsResponse.error
      );

      toast(
        "Sale হয়েছে কিন্তু Sale Items save হয়নি",
        "error"
      );
    }

    /* -----------------------------------------
       3. PAYMENT RECORD
       ----------------------------------------- */

    if (paid > 0) {
      const paymentPayload = {
        sale_id: sale.id,
        customer_id: customerId,
        amount: paid,
        payment_method:
          paymentMethod,
        reference_no:
          invoiceNo,
        notes:
          "POS Sale Payment"
      };

      const paymentResponse =
        await db
          .from("payments")
          .insert(paymentPayload);

      if (paymentResponse.error) {
        console.error(
          paymentResponse.error
        );

        toast(
          "Sale হয়েছে কিন্তু Payment record save হয়নি",
          "error"
        );
      }
    }

    /* -----------------------------------------
       4. UPDATE STOCK
       ----------------------------------------- */

    for (const item of cart) {
      const product =
        products.find(
          (p) =>
            String(p.id) ===
            String(item.product_id)
        );

      if (!product) continue;

      const oldStock =
        getProductStock(product);

      const newStock =
        Math.max(
          0,
          oldStock -
            num(item.quantity)
        );

      const stockUpdate =
        await db
          .from("products")
          .update({
            stock: newStock
          })
          .eq("id", item.product_id);

      if (stockUpdate.error) {
        console.error(
          stockUpdate.error
        );

        continue;
      }

      /* STOCK MOVEMENT */

      const movementPayload = {
        product_id:
          item.product_id,
        movement_type: "sale",
        quantity:
          -num(item.quantity),
        reference_type: "sale",
        reference_id:
          sale.id,
        notes:
          "POS Sale " +
          invoiceNo
      };

      const movementResponse =
        await db
          .from("stock_movements")
          .insert(
            movementPayload
          );

      if (movementResponse.error) {
        console.error(
          movementResponse.error
        );
      }
    }

    /* -----------------------------------------
       5. CUSTOMER DUE
       ----------------------------------------- */

    if (customerId && due > 0) {
      const oldDue =
        num(customer?.due_amount);

      const newDue =
        Number(
          (
            oldDue +
            due
          ).toFixed(2)
        );

      const customerUpdate =
        await db
          .from("customers")
          .update({
            due_amount: newDue
          })
          .eq(
            "id",
            customerId
          );

      if (customerUpdate.error) {
        console.error(
          customerUpdate.error
        );
      }
    }

    /* -----------------------------------------
       6. PRINT INVOICE
       ----------------------------------------- */

    currentSale = {
      ...sale,
      customer_name:
        customer?.name ||
        "Walk-in Customer",
      paid,
      due,
      payment_method:
        paymentMethod
    };

    printInvoice(
      currentSale,
      cart
    );

    /* -----------------------------------------
       7. RESET
       ----------------------------------------- */

    cart = [];
    selectedCustomer = "";

    toast(
      "Sale successfully completed"
    );

    await loadAll();

    page = "pos";
    render();

  } catch (error) {
    console.error(error);

    toast(
      "Sale complete করতে সমস্যা হয়েছে",
      "error"
    );
  }
}

/* =========================================================
   SALES HISTORY
   ========================================================= */

function renderSales() {
  return `
    <div class="space-y-6">

      <div>
        <h1 class="text-3xl font-black">
          Sales History
        </h1>

        <p class="text-slate-500">
          সাম্প্রতিক Sales এবং Invoice দেখুন
        </p>
      </div>

      <div class="bg-white rounded-2xl border shadow-sm overflow-hidden">

        ${
          sales.length
            ? `
              <div class="overflow-x-auto">

                <table class="w-full text-sm">

                  <thead class="bg-slate-100">

                    <tr>
                      <th class="text-left p-3">
                        Invoice
                      </th>

                      <th class="text-left p-3">
                        Customer
                      </th>

                      <th class="text-left p-3">
                        Date
                      </th>

                      <th class="text-right p-3">
                        Total
                      </th>

                      <th class="text-right p-3">
                        Paid
                      </th>

                      <th class="text-right p-3">
                        Due
                      </th>

                      <th class="text-center p-3">
                        Status
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    ${sales
                      .map(
                        (s) => `
                        <tr class="border-t">

                          <td class="p-3 font-bold">
                            ${esc(
                              s.invoice_no ||
                                "-"
                            )}
                          </td>

                          <td class="p-3">
                            ${esc(
                              s.customer_name ||
                                "Walk-in Customer"
                            )}
                          </td>

                          <td class="p-3">
                            ${
                              s.created_at
                                ? new Date(
                                    s.created_at
                                  ).toLocaleString(
                                    "en-IN"
                                  )
                                : "-"
                            }
                          </td>

                          <td class="p-3 text-right font-bold">
                            ${money(
                              s.total_amount
                            )}
                          </td>

                          <td class="p-3 text-right text-emerald-600 font-bold">
                            ${money(
                              s.paid_amount
                            )}
                          </td>

                          <td class="p-3 text-right text-red-600 font-bold">
                            ${money(
                              s.due_amount
                            )}
                          </td>

                          <td class="p-3 text-center">

                            <span class="px-2 py-1 rounded-full text-xs font-bold
                              ${
                                s.payment_status ===
                                "paid"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : s.payment_status ===
                                    "partial"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }"
                            >
                              ${esc(
                                s.payment_status ||
                                  "-"
                              )}
                            </span>

                          </td>

                        </tr>
                      `
                      )
                      .join("")}

                  </tbody>

                </table>

              </div>
            `
            : `
              <div class="text-center py-16 text-slate-500">
                কোনো Sales নেই।
              </div>
            `
        }

      </div>

    </div>
  `;
}

/* =========================================================
   CUSTOMERS
   ========================================================= */

function renderCustomers() {
  const totalDue =
    customers.reduce(
      (sum, c) =>
        sum +
        num(c.due_amount),
      0
    );

  return `
    <div class="space-y-6">

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        <div>
          <h1 class="text-3xl font-black">
            Customers
          </h1>

          <p class="text-slate-500">
            Customer এবং Due Management
          </p>
        </div>

        <div class="bg-red-50 text-red-700 px-4 py-3 rounded-xl font-black">
          Total Due: ${money(totalDue)}
        </div>

      </div>

      <div class="bg-white rounded-2xl border p-5">

        <h2 class="text-xl font-black mb-4">
          নতুন Customer
        </h2>

        <form
          onsubmit="addCustomer(event)"
          class="grid grid-cols-1 md:grid-cols-4 gap-3"
        >

          <input
            id="c-name"
            required
            placeholder="Customer Name"
            class="border rounded-xl px-4 py-3"
          >

          <input
            id="c-phone"
            placeholder="Phone"
            class="border rounded-xl px-4 py-3"
          >

          <input
            id="c-address"
            placeholder="Address"
            class="border rounded-xl px-4 py-3"
          >

          <button
            class="bg-slate-900 text-white rounded-xl px-4 py-3 font-bold"
          >
            + Add Customer
          </button>

        </form>

      </div>

      <div class="bg-white rounded-2xl border shadow-sm overflow-hidden">

        <div class="overflow-x-auto">

          <table class="w-full text-sm">

            <thead class="bg-slate-100">

              <tr>
                <th class="text-left p-3">Name</th>
                <th class="text-left p-3">Phone</th>
                <th class="text-left p-3">Address</th>
                <th class="text-right p-3">Due</th>
                <th class="text-center p-3">Action</th>
              </tr>

            </thead>

            <tbody>

              ${
                customers.length
                  ? customers
                      .map(
                        (c) => `
                        <tr class="border-t">

                          <td class="p-3 font-bold">
                            ${esc(c.name)}
                          </td>

                          <td class="p-3">
                            ${esc(
                              c.phone || "-"
                            )}
                          </td>

                          <td class="p-3">
                            ${esc(
                              c.address || "-"
                            )}
                          </td>

                          <td class="p-3 text-right font-black ${
                            num(
                              c.due_amount
                            ) > 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          }">
                            ${money(
                              c.due_amount
                            )}
                          </td>

                          <td class="p-3 text-center">

                            <button
                              onclick="collectCustomerDue('${c.id}')"
                              ${
                                num(
                                  c.due_amount
                                ) <= 0
                                  ? "disabled"
                                  : ""
                              }
                              class="px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-bold ${
                                num(
                                  c.due_amount
                                ) <= 0
                                  ? "opacity-40 cursor-not-allowed"
                                  : ""
                              }"
                            >
                              Collect Due
                            </button>

                          </td>

                        </tr>
                      `
                      )
                      .join("")
                  : `
                    <tr>
                      <td
                        colspan="5"
                        class="text-center py-12 text-slate-500"
                      >
                        কোনো Customer নেই।
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   ADD CUSTOMER
   ========================================================= */

async function addCustomer(event) {
  event.preventDefault();

  const name =
    $("#c-name")?.value.trim();

  const phone =
    $("#c-phone")?.value.trim();

  const address =
    $("#c-address")?.value.trim();

  if (!name) {
    toast(
      "Customer Name দিন",
      "error"
    );
    return;
  }

  try {
    const response =
      await db
        .from("customers")
        .insert({
          name,
          phone,
          address,
          due_amount: 0
        });

    if (response.error) {
      console.error(
        response.error
      );

      toast(
        response.error.message ||
          "Customer add হয়নি",
        "error"
      );

      return;
    }

    toast(
      "Customer successfully added"
    );

    await loadAll();
  } catch (error) {
    console.error(error);
    toast(
      "Customer add করতে সমস্যা হয়েছে",
      "error"
    );
  }
}

/* =========================================================
   CUSTOMER DUE COLLECTION
   ========================================================= */

async function collectCustomerDue(customerId) {
  const customer =
    customers.find(
      (c) =>
        String(c.id) ===
        String(customerId)
    );

  if (!customer) return;

  const currentDue =
    num(customer.due_amount);

  if (currentDue <= 0) {
    toast(
      "এই Customer-এর কোনো Due নেই",
      "error"
    );
    return;
  }

  const value =
    window.prompt(
      `বর্তমান Due: ${money(
        currentDue
      )}\nকত টাকা গ্রহণ করেছেন?`,
      currentDue
    );

  if (value === null) return;

  const amount =
    num(value);

  if (
    amount <= 0 ||
    amount > currentDue
  ) {
    toast(
      "সঠিক Amount দিন",
      "error"
    );
    return;
  }

  const newDue =
    Number(
      (
        currentDue -
        amount
      ).toFixed(2)
    );

  try {
    const updateResponse =
      await db
        .from("customers")
        .update({
          due_amount: newDue
        })
        .eq(
          "id",
          customerId
        );

    if (updateResponse.error) {
      console.error(
        updateResponse.error
      );

      toast(
        "Due update হয়নি",
        "error"
      );

      return;
    }

    /* CUSTOMER PAYMENT RECORD */

    const paymentResponse =
      await db
        .from("payments")
        .insert({
          customer_id:
            customerId,
          amount,
          payment_method:
            "cash",
          reference_no:
            "DUE-" +
            Date.now(),
          notes:
            "Customer Due Collection"
        });

    if (paymentResponse.error) {
      console.error(
        paymentResponse.error
      );
    }

    toast(
      `₹${amount.toFixed(
        2
      )} Due collected`
    );

    await loadAll();
  } catch (error) {
    console.error(error);
    toast(
      "Due collection করতে সমস্যা হয়েছে",
      "error"
    );
  }
}

/* =========================================================
   SUPPLIERS
   ========================================================= */

function renderSuppliers() {
  const totalDue =
    suppliers.reduce(
      (sum, s) =>
        sum +
        num(s.due_amount),
      0
    );

  return `
    <div class="space-y-6">

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        <div>
          <h1 class="text-3xl font-black">
            Suppliers
          </h1>

          <p class="text-slate-500">
            Supplier এবং Purchase Due Management
          </p>
        </div>

        <div class="bg-orange-50 text-orange-700 px-4 py-3 rounded-xl font-black">
          Supplier Due: ${money(totalDue)}
        </div>

      </div>

      <div class="bg-white rounded-2xl border p-5">

        <h2 class="text-xl font-black mb-4">
          নতুন Supplier
        </h2>

        <form
          onsubmit="addSupplier(event)"
          class="grid grid-cols-1 md:grid-cols-4 gap-3"
        >

          <input
            id="s-name"
            required
            placeholder="Supplier Name"
            class="border rounded-xl px-4 py-3"
          >

          <input
            id="s-phone"
            placeholder="Phone"
            class="border rounded-xl px-4 py-3"
          >

          <input
            id="s-address"
            placeholder="Address"
            class="border rounded-xl px-4 py-3"
          >

          <button
            class="bg-slate-900 text-white rounded-xl px-4 py-3 font-bold"
          >
            + Add Supplier
          </button>

        </form>

      </div>

      <div class="bg-white rounded-2xl border overflow-hidden">

        <div class="overflow-x-auto">

          <table class="w-full text-sm">

            <thead class="bg-slate-100">

              <tr>
                <th class="text-left p-3">
                  Name
                </th>

                <th class="text-left p-3">
                  Phone
                </th>

                <th class="text-left p-3">
                  Address
                </th>

                <th class="text-right p-3">
                  Due
                </th>
              </tr>

            </thead>

            <tbody>

              ${
                suppliers.length
                  ? suppliers
                      .map(
                        (s) => `
                        <tr class="border-t">

                          <td class="p-3 font-bold">
                            ${esc(s.name)}
                          </td>

                          <td class="p-3">
                            ${esc(
                              s.phone || "-"
                            )}
                          </td>

                          <td class="p-3">
                            ${esc(
                              s.address || "-"
                            )}
                          </td>

                          <td class="p-3 text-right text-red-600 font-black">
                            ${money(
                              s.due_amount
                            )}
                          </td>

                        </tr>
                      `
                      )
                      .join("")
                  : `
                    <tr>
                      <td
                        colspan="4"
                        class="text-center py-12 text-slate-500"
                      >
                        কোনো Supplier নেই।
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </div>

    </div>
  `;
}

async function addSupplier(event) {
  event.preventDefault();

  const name =
    $("#s-name")?.value.trim();

  const phone =
    $("#s-phone")?.value.trim();

  const address =
    $("#s-address")?.value.trim();

  if (!name) {
    toast(
      "Supplier Name দিন",
      "error"
    );
    return;
  }

  try {
    const response =
      await db
        .from("suppliers")
        .insert({
          name,
          phone,
          address,
          due_amount: 0
        });

    if (response.error) {
      console.error(
        response.error
      );

      toast(
        response.error.message ||
          "Supplier add হয়নি",
        "error"
      );

      return;
    }

    toast(
      "Supplier successfully added"
    );

    await loadAll();
  } catch (error) {
    console.error(error);

    toast(
      "Supplier add করতে সমস্যা হয়েছে",
      "error"
    );
  }
}

/* =========================================================
   REPORTS
   ========================================================= */

function renderReports() {
  const totalSales =
    sales.reduce(
      (sum, s) =>
        sum +
        num(s.total_amount),
      0
    );

  const totalPaid =
    sales.reduce(
      (sum, s) =>
        sum +
        num(s.paid_amount),
      0
    );

  const totalDue =
    sales.reduce(
      (sum, s) =>
        sum +
        num(s.due_amount),
      0
    );

  return `
    <div class="space-y-6">

      <div>
        <h1 class="text-3xl font-black">
          Reports
        </h1>

        <p class="text-slate-500">
          Sales এবং Due-এর সংক্ষিপ্ত রিপোর্ট
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

        ${statCard(
          "💰",
          "Total Sales",
          money(totalSales),
          "bg-emerald-50"
        )}

        ${statCard(
          "💵",
          "Total Paid",
          money(totalPaid),
          "bg-blue-50"
        )}

        ${statCard(
          "⚠️",
          "Total Sales Due",
          money(totalDue),
          "bg-red-50"
        )}

      </div>

      <div class="bg-white border rounded-2xl p-6">

        <h2 class="text-xl font-black mb-4">
          Stock Summary
        </h2>

        <div class="overflow-x-auto">

          <table class="w-full text-sm">

            <thead class="bg-slate-100">

              <tr>
                <th class="text-left p-3">
                  Product
                </th>

                <th class="text-right p-3">
                  Purchase Price
                </th>

                <th class="text-right p-3">
                  Sale Price
                </th>

                <th class="text-right p-3">
                  Stock
                </th>

                <th class="text-right p-3">
                  Stock Value
                </th>
              </tr>

            </thead>

            <tbody>

              ${products
                .map(
                  (p) => `
                  <tr class="border-t">

                    <td class="p-3 font-bold">
                      ${esc(p.name)}
                    </td>

                    <td class="p-3 text-right">
                      ${money(
                        p.purchase_price
                      )}
                    </td>

                    <td class="p-3 text-right">
                      ${money(
                        getProductPrice(p)
                      )}
                    </td>

                    <td class="p-3 text-right font-bold">
                      ${getProductStock(
                        p
                      )}
                    </td>

                    <td class="p-3 text-right font-black">
                      ${money(
                        num(
                          p.purchase_price
                        ) *
                          getProductStock(
                            p
                          )
                      )}
                    </td>

                  </tr>
                `
                )
                .join("")}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettings() {
  return `
    <div class="max-w-3xl space-y-6">

      <div>
        <h1 class="text-3xl font-black">
          Business Settings
        </h1>

        <p class="text-slate-500">
          Invoice-এ ব্যবহৃত Business তথ্য
        </p>
      </div>

      <div class="bg-white rounded-2xl border p-5">

        <form
          onsubmit="saveSettings(event)"
          class="space-y-4"
        >

          ${inputField(
            "Business Name",
            "set-name",
            businessSettings.business_name ||
              "NAMITA STORE",
            true
          )}

          ${inputField(
            "Phone",
            "set-phone",
            businessSettings.phone ||
              ""
          )}

          ${inputField(
            "GSTIN",
            "set-gstin",
            businessSettings.gstin ||
              ""
          )}

          ${inputField(
            "Invoice Prefix",
            "set-prefix",
            businessSettings.invoice_prefix ||
              "INV"
          )}

          <div>

            <label class="block text-sm font-bold mb-1">
              Address
            </label>

            <textarea
              id="set-address"
              rows="3"
              class="w-full border rounded-xl px-3 py-2"
            >${esc(
              businessSettings.address ||
                ""
            )}</textarea>

          </div>

          <button
            class="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold"
          >
            Save Settings
          </button>

        </form>

      </div>

    </div>
  `;
}

async function saveSettings(event) {
  event.preventDefault();

  const payload = {
    business_name:
      $("#set-name")?.value.trim() ||
      "NAMITA STORE",

    phone:
      $("#set-phone")?.value.trim() ||
      null,

    address:
      $("#set-address")?.value.trim() ||
      null,

    gstin:
      $("#set-gstin")?.value.trim() ||
      null,

    invoice_prefix:
      $("#set-prefix")?.value.trim() ||
      "INV"
  };

  try {
    const existing =
      await db
        .from("business_settings")
        .select("id")
        .limit(1);

    if (existing.error) {
      console.error(
        existing.error
      );

      toast(
        "Settings table read করতে সমস্যা হয়েছে",
        "error"
      );

      return;
    }

    let response;

    if (
      existing.data &&
      existing.data.length
    ) {
      response =
        await db
          .from("business_settings")
          .update(payload)
          .eq(
            "id",
            existing.data[0].id
          );
    } else {
      response =
        await db
          .from("business_settings")
          .insert(payload);
    }

    if (response.error) {
      console.error(
        response.error
      );

      toast(
        response.error.message ||
          "Settings save হয়নি",
        "error"
      );

      return;
    }

    businessSettings = {
      ...businessSettings,
      ...payload
    };

    toast(
      "Business settings saved"
    );

    render();
  } catch (error) {
    console.error(error);

    toast(
      "Settings save করতে সমস্যা হয়েছে",
      "error"
    );
  }
}

/* =========================================================
   INVOICE PRINT
   ========================================================= */

function printInvoice(sale, items) {
  const printSection =
    $("#print-section");

  if (!printSection) {
    window.print();
    return;
  }

  const itemRows = items
    .map(
      (item) => `
      <tr>

        <td style="text-align:left;padding:3px 0;">
          ${esc(item.name)}
        </td>

        <td style="text-align:center;padding:3px 0;">
          ${item.quantity}
        </td>

        <td style="text-align:right;padding:3px 0;">
          ${money(item.price)}
        </td>

        <td style="text-align:right;padding:3px 0;">
          ${money(
            item.price *
              item.quantity
          )}
        </td>

      </tr>
    `
    )
    .join("");

  printSection.innerHTML = `
    <div
      style="
        width:80mm;
        max-width:80mm;
        padding:8px;
        margin:0 auto;
        font-family:Arial,sans-serif;
        font-size:12px;
        color:#000;
      "
    >

      <div style="text-align:center;">

        <div style="font-size:20px;font-weight:900;">
          ${esc(
            businessSettings.business_name ||
              "NAMITA STORE"
          )}
        </div>

        ${
          businessSettings.address
            ? `
              <div>
                ${esc(
                  businessSettings.address
                )}
              </div>
            `
            : ""
        }

        ${
          businessSettings.phone
            ? `
              <div>
                Phone:
                ${esc(
                  businessSettings.phone
                )}
              </div>
            `
            : ""
        }

        ${
          businessSettings.gstin
            ? `
              <div>
                GSTIN:
                ${esc(
                  businessSettings.gstin
                )}
              </div>
            `
            : ""
        }

      </div>

      <hr>

      <div>
        Invoice:
        <strong>
          ${esc(
            sale.invoice_no ||
              "-"
          )}
        </strong>
      </div>

      <div>
        Date:
        ${sale.created_at
          ? new Date(
              sale.created_at
            ).toLocaleString(
              "en-IN"
            )
          : dateTime()}
      </div>

      <div>
        Customer:
        ${esc(
          sale.customer_name ||
            "Walk-in Customer"
        )}
      </div>

      <hr>

      <table style="width:100%;border-collapse:collapse;">

        <thead>

          <tr>

            <th style="text-align:left;">
              Item
            </th>

            <th>
              Qty
            </th>

            <th style="text-align:right;">
              Rate
            </th>

            <th style="text-align:right;">
              Total
            </th>

          </tr>

        </thead>

        <tbody>
          ${itemRows}
        </tbody>

      </table>

      <hr>

      <div style="display:flex;justify-content:space-between;">
        <span>Subtotal</span>
        <strong>
          ${money(
            sale.subtotal
          )}
        </strong>
      </div>

      <div style="display:flex;justify-content:space-between;">
        <span>Discount</span>
        <strong>
          ${money(
            sale.discount
          )}
        </strong>
      </div>

      <div style="display:flex;justify-content:space-between;">
        <span>Tax</span>
        <strong>
          ${money(
            sale.tax_amount
          )}
        </strong>
      </div>

      <div style="display:flex;justify-content:space-between;">
        <span>Round Off</span>
        <strong>
          ${money(
            sale.round_off
          )}
        </strong>
      </div>

      <div
        style="
          display:flex;
          justify-content:space-between;
          font-size:16px;
          margin-top:5px;
        "
      >
        <strong>Grand Total</strong>

        <strong>
          ${money(
            sale.total_amount
          )}
        </strong>
      </div>

      <div style="display:flex;justify-content:space-between;">
        <span>Paid</span>
        <strong>
          ${money(
            sale.paid_amount ??
              sale.paid
          )}
        </strong>
      </div>

      <div style="display:flex;justify-content:space-between;">
        <span>Due</span>

        <strong>
          ${money(
            sale.due_amount ??
              sale.due
          )}
        </strong>
      </div>

      <div style="margin-top:5px;">
        Payment:
        <strong>
          ${esc(
            sale.payment_method ||
              "-"
          )}
        </strong>
      </div>

      <hr>

      <div style="text-align:center;margin-top:10px;">
        Thank You!
      </div>

      <div style="text-align:center;">
        Visit Again
      </div>

    </div>
  `;

  printSection.classList.remove(
    "hidden"
  );

  window.print();

  setTimeout(() => {
    printSection.classList.add(
      "hidden"
    );
    printSection.innerHTML = "";
  }, 1000);
}

/* =========================================================
   KEYBOARD SHORTCUT
   ========================================================= */

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.ctrlKey &&
      event.key.toLowerCase() === "b"
    ) {
      event.preventDefault();
      go("pos");
    }
  }
);

/* =========================================================
   START APPLICATION
   ========================================================= */

loadAll();
