// ============================================================
// NAMITA STORE
// Accounting & Inventory Software
// Version 2 - Product / Stock Management
// ============================================================

const app = document.getElementById("app");

const STORAGE_KEY = "namita_store_data_v2";

const defaultData = {
  products: [],
  customers: [],
  suppliers: [],
  purchases: [],
  sales: [],
  payments: [],
  settings: {
    barcodeTemplates: [
      "25x50 - 2 Line",
      "25x50 - 1 Line",
      "15x25 - 4 Line",
      "30x50 - 2 Line",
      "40x60 - 2 Line"
    ],
    selectedBarcodeTemplate: "25x50 - 2 Line"
  }
};

let data = loadData();

let currentPage = "dashboard";
let editingProductId = null;
let productSearch = "";

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return {
        ...defaultData,
        ...JSON.parse(saved)
      };
    }
  } catch (error) {
    console.error(error);
  }

  return JSON.parse(JSON.stringify(defaultData));
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateId(prefix = "ID") {
  return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

function showToast(message, type = "success") {
  const oldToast = document.getElementById("toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");

  toast.id = "toast";

  toast.className =
    "fixed right-5 bottom-5 z-[9999] px-5 py-3 rounded-xl shadow-xl text-white " +
    (type === "error" ? "bg-red-600" : "bg-slate-900");

  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// ============================================================
// NAVIGATION
// ============================================================

function navigate(page) {
  currentPage = page;
  editingProductId = null;
  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");

  if (sidebar) {
    sidebar.classList.toggle("open");
  }
}

// ============================================================
// SIDEBAR
// ============================================================

function navItem(page, icon, title) {
  return `
    <button
      onclick="navigate('${page}')"
      class="nav-btn ${
        currentPage === page ? "active" : ""
      } w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
    >
      <span class="text-lg">${icon}</span>
      <span>${title}</span>
    </button>
  `;
}

// ============================================================
// MAIN RENDER
// ============================================================

function render() {
  app.innerHTML = `
    <div class="flex min-h-screen">

      <aside
        id="sidebar"
        class="sidebar w-64 min-h-screen text-white p-4 shrink-0"
      >

        <div class="px-3 py-4 mb-4">
          <div class="text-2xl font-bold">
            NAMITA STORE
          </div>

          <div class="text-sm opacity-80 mt-1">
            Accounting & Inventory
          </div>
        </div>

        <nav class="space-y-2">

          ${navItem("dashboard", "📊", "Dashboard")}

          ${navItem("sales", "🛒", "Sales / বিক্রয়")}

          ${navItem("purchase", "📦", "Purchase / ক্রয়")}

          ${navItem("products", "🏷️", "Products / Stock")}

          ${navItem("customers", "👤", "Customers")}

          ${navItem("suppliers", "🏢", "Suppliers")}

          ${navItem("payments", "💰", "Due / Payment")}

          ${navItem("history", "📜", "Transaction History")}

          ${navItem("barcode", "▦", "Barcode")}

          ${navItem("settings", "⚙️", "Settings")}

        </nav>

      </aside>

      <main class="content flex-1 min-w-0">

        <header
          class="bg-white border-b px-5 py-4 flex items-center justify-between sticky top-0 z-30"
        >

          <div class="flex items-center">

            <button
              onclick="toggleSidebar()"
              class="lg:hidden mr-3 text-xl"
            >
              ☰
            </button>

            <div>
              <div class="font-semibold text-lg">
                ${pageTitle()}
              </div>

              <div class="text-xs text-slate-400">
                NAMITA STORE
              </div>
            </div>

          </div>

          <div class="text-sm text-slate-500">
            Accounting & Inventory
          </div>

        </header>

        <section class="p-5">
          ${pageContent()}
        </section>

      </main>

    </div>
  `;
}

// ============================================================
// PAGE TITLE
// ============================================================

function pageTitle() {

  const titles = {
    dashboard: "Dashboard",
    sales: "Sales / বিক্রয়",
    purchase: "Purchase / ক্রয়",
    products: "Products / Stock",
    customers: "Customers",
    suppliers: "Suppliers",
    payments: "Due / Payment",
    history: "Transaction History",
    barcode: "Barcode",
    settings: "Settings"
  };

  return titles[currentPage] || "Dashboard";
}

// ============================================================
// PAGE CONTENT
// ============================================================

function pageContent() {

  switch (currentPage) {

    case "products":
      return productsPage();

    case "sales":
      return placeholderPage(
        "Sales / বিক্রয়",
        "Sales Entry আমরা পরের ধাপে তৈরি করব।"
      );

    case "purchase":
      return placeholderPage(
        "Purchase / ক্রয়",
        "Purchase Entry আমরা Product/Stock-এর পরে তৈরি করব।"
      );

    case "customers":
      return placeholderPage(
        "Customers",
        "Customer Management পরের ধাপে তৈরি হবে।"
      );

    case "suppliers":
      return placeholderPage(
        "Suppliers / Seller",
        "Supplier Management পরের ধাপে তৈরি হবে।"
      );

    case "payments":
      return placeholderPage(
        "Due / Payment",
        "Due ও Payment System পরের ধাপে তৈরি হবে।"
      );

    case "history":
      return placeholderPage(
        "Transaction History",
        "Transaction History পরের ধাপে তৈরি হবে।"
      );

    case "barcode":
      return barcodePage();

    case "settings":
      return settingsPage();

    default:
      return dashboardPage();
  }
}

// ============================================================
// DASHBOARD
// ============================================================

function dashboardPage() {

  const totalProducts = data.products.length;

  const totalStock = data.products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  const totalStockValue = data.products.reduce(
    (sum, product) =>
      sum +
      Number(product.stock || 0) *
      Number(product.purchasePrice || 0),
    0
  );

  const lowStock = data.products.filter(
    product => Number(product.stock || 0) <= 5
  ).length;

  return `

    <div class="mb-6">

      <h1 class="text-2xl font-bold">
        Dashboard
      </h1>

      <p class="text-slate-500 mt-1">
        NAMITA STORE-এর বর্তমান হিসাব ও Stock-এর সংক্ষিপ্ত তথ্য।
      </p>

    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      ${dashboardCard(
        "🏷️",
        "Total Products",
        totalProducts,
        "টি Product"
      )}

      ${dashboardCard(
        "📦",
        "Total Stock",
        totalStock,
        "টি ইউনিট"
      )}

      ${dashboardCard(
        "💰",
        "Stock Value",
        money(totalStockValue),
        "Purchase Value"
      )}

      ${dashboardCard(
        "⚠️",
        "Low Stock",
        lowStock,
        "টি Product"
      )}

    </div>

    <div class="card p-6 mt-5">

      <h2 class="text-xl font-bold mb-2">
        দ্রুত কাজ
      </h2>

      <p class="text-slate-500 mb-5">
        প্রথমে Product যোগ করুন। এরপর Purchase ও Sales-এর মাধ্যমে Stock স্বয়ংক্রিয়ভাবে পরিচালনা করা হবে।
      </p>

      <button
        onclick="navigate('products')"
        class="bg-teal-700 hover:bg-teal-800 text-white px-5 py-3 rounded-xl"
      >
        + Product যোগ করুন
      </button>

    </div>

  `;
}

function dashboardCard(icon, title, value, subtitle) {

  return `
    <div class="card p-5">

      <div class="flex items-center justify-between">

        <div>

          <div class="text-sm text-slate-500">
            ${title}
          </div>

          <div class="text-2xl font-bold mt-2">
            ${value}
          </div>

          <div class="text-xs text-slate-400 mt-1">
            ${subtitle}
          </div>

        </div>

        <div class="text-3xl">
          ${icon}
        </div>

      </div>

    </div>
  `;
}

// ============================================================
// PRODUCTS PAGE
// ============================================================

function productsPage() {

  let products = [...data.products];

  if (productSearch.trim()) {

    const query = productSearch.toLowerCase();

    products = products.filter(product =>

      String(product.name || "")
        .toLowerCase()
        .includes(query)

      ||

      String(product.barcode || "")
        .toLowerCase()
        .includes(query)

      ||

      String(product.category || "")
        .toLowerCase()
        .includes(query)

    );
  }

  return `

    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

      <div>

        <h1 class="text-2xl font-bold">
          Products / Stock
        </h1>

        <p class="text-slate-500 mt-1">
          Product, Price, Barcode ও Stock Management
        </p>

      </div>

      <button
        onclick="openProductForm()"
        class="bg-teal-700 hover:bg-teal-800 text-white px-5 py-3 rounded-xl"
      >
        + নতুন Product
      </button>

    </div>

    <div class="card p-4 mb-5">

      <div class="relative">

        <input
          id="productSearch"
          value="${escapeHTML(productSearch)}"
          oninput="handleProductSearch(this.value)"
          class="w-full border border-slate-200 rounded-xl px-4 py-3 pl-11"
          placeholder="Product Name, Barcode বা Category দিয়ে Search করুন..."
        >

        <span class="absolute left-4 top-3.5 text-slate-400">
          🔍
        </span>

      </div>

    </div>

    <div class="card overflow-hidden">

      <div class="overflow-x-auto">

        <table class="w-full text-left">

          <thead class="bg-slate-50 border-b">

            <tr>

              <th class="p-4">Product</th>

              <th class="p-4">Barcode</th>

              <th class="p-4">Purchase</th>

              <th class="p-4">Sale Price</th>

              <th class="p-4">Stock</th>

              <th class="p-4 text-right">Action</th>

            </tr>

          </thead>

          <tbody>

            ${
              products.length
                ? products.map(productRow).join("")
                : `
                  <tr>

                    <td
                      colspan="6"
                      class="p-10 text-center text-slate-400"
                    >

                      <div class="text-4xl mb-3">
                        📦
                      </div>

                      <div class="font-medium">
                        কোনো Product পাওয়া যায়নি
                      </div>

                      <div class="text-sm mt-1">
                        নতুন Product যোগ করতে উপরের বাটনে চাপুন।
                      </div>

                    </td>

                  </tr>
                `
            }

          </tbody>

        </table>

      </div>

    </div>

    ${
      editingProductId
        ? productForm()
        : ""
    }

  `;
}

// ============================================================
// PRODUCT ROW
// ============================================================

function productRow(product) {

  const stock = Number(product.stock || 0);

  let stockClass = "text-green-700 bg-green-50";

  if (stock <= 5) {
    stockClass = "text-red-700 bg-red-50";
  } else if (stock <= 10) {
    stockClass = "text-orange-700 bg-orange-50";
  }

  return `
    <tr class="border-b last:border-b-0 hover:bg-slate-50">

      <td class="p-4">

        <div class="font-semibold">
          ${escapeHTML(product.name)}
        </div>

        ${
          product.category
            ? `
              <div class="text-xs text-slate-400 mt-1">
                ${escapeHTML(product.category)}
              </div>
            `
            : ""
        }

      </td>

      <td class="p-4 text-slate-600">
        ${escapeHTML(product.barcode || "-")}
      </td>

      <td class="p-4">
        ${money(product.purchasePrice)}
      </td>

      <td class="p-4 font-semibold">
        ${money(product.salePrice)}
      </td>

      <td class="p-4">

        <span
          class="inline-flex px-3 py-1 rounded-full text-sm font-semibold ${stockClass}"
        >
          ${stock}
        </span>

      </td>

      <td class="p-4">

        <div class="flex justify-end gap-2">

          <button
            onclick="editProduct('${product.id}')"
            class="px-3 py-2 rounded-lg bg-blue-50 text-blue-700"
          >
            Edit
          </button>

          <button
            onclick="deleteProduct('${product.id}')"
            class="px-3 py-2 rounded-lg bg-red-50 text-red-700"
          >
            Delete
          </button>

        </div>

      </td>

    </tr>
  `;
}

// ============================================================
// PRODUCT FORM
// ============================================================

function openProductForm() {

  editingProductId = "new";

  render();

  setTimeout(() => {

    const form = document.getElementById("productForm");

    if (form) {
      form.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

  }, 100);
}

function editProduct(id) {

  editingProductId = id;

  render();

  setTimeout(() => {

    const form = document.getElementById("productForm");

    if (form) {
      form.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

  }, 100);
}

function closeProductForm() {

  editingProductId = null;

  render();
}

function productForm() {

  const isNew = editingProductId === "new";

  const product = isNew
    ? {
        name: "",
        category: "",
        barcode: "",
        purchasePrice: "",
        salePrice: "",
        stock: 0,
        unit: "pcs",
        minStock: 5
      }
    : data.products.find(
        item => item.id === editingProductId
      );

  if (!product) {
    editingProductId = null;
    return "";
  }

  return `

    <div
      id="productForm"
      class="card p-6 mt-5 border-2 border-teal-100"
    >

      <div class="flex items-center justify-between mb-5">

        <div>

          <h2 class="text-xl font-bold">
            ${isNew ? "নতুন Product যোগ করুন" : "Product Edit করুন"}
          </h2>

          <p class="text-sm text-slate-500 mt-1">
            সব প্রয়োজনীয় তথ্য পূরণ করুন।
          </p>

        </div>

        <button
          onclick="closeProductForm()"
          class="text-slate-400 text-xl"
        >
          ✕
        </button>

      </div>

      <form onsubmit="saveProduct(event)">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <label class="block text-sm font-medium mb-2">
              Product Name *
            </label>

            <input
              id="productName"
              required
              value="${escapeHTML(product.name)}"
              class="w-full border rounded-xl p-3"
              placeholder="যেমন: Surf Excel"
            >

          </div>

          <div>

            <label class="block text-sm font-medium mb-2">
              Category
            </label>

            <input
              id="productCategory"
              value="${escapeHTML(product.category || "")}"
              class="w-full border rounded-xl p-3"
              placeholder="যেমন: Grocery"
            >

          </div>

          <div>

            <label class="block text-sm font-medium mb-2">
              Barcode
            </label>

            <input
              id="productBarcode"
              value="${escapeHTML(product.barcode || "")}"
              class="w-full border rounded-xl p-3"
              placeholder="Barcode Number"
            >

          </div>

          <div>

            <label class="block text-sm font-medium mb-2">
              Unit
            </label>

            <select
              id="productUnit"
              class="w-full border rounded-xl p-3"
            >

              ${unitOption("pcs", product.unit)}

              ${unitOption("kg", product.unit)}

              ${unitOption("gram", product.unit)}

              ${unitOption("liter", product.unit)}

              ${unitOption("meter", product.unit)}

              ${unitOption("box", product.unit)}

              ${unitOption("packet", product.unit)}

            </select>

          </div>

          <div>

            <label class="block text-sm font-medium mb-2">
              Purchase Price *
            </label>

            <input
              id="productPurchasePrice"
              required
              type="number"
              min="0"
              step="0.01"
              value="${product.purchasePrice}"
              class="w-full border rounded-xl p-3"
              placeholder="0.00"
            >

          </div>

          <div>

            <label class="block text-sm font-medium mb-2">
              Sale Price *
            </label>

            <input
              id="productSalePrice"
              required
              type="number"
              min="0"
              step="0.01"
              value="${product.salePrice}"
              class="w-full border rounded-xl p-3"
              placeholder="0.00"
            >

          </div>

          <div>

            <label class="block text-sm font-medium mb-2">
              ${isNew ? "Opening Stock" : "Current Stock"}
            </label>

            <input
              id="productStock"
              type="number"
              min="0"
              step="0.001"
              value="${product.stock || 0}"
              class="w-full border rounded-xl p-3"
            >

          </div>

          <div>

            <label class="block text-sm font-medium mb-2">
              Minimum Stock Alert
            </label>

            <input
              id="productMinStock"
              type="number"
              min="0"
              step="1"
              value="${product.minStock ?? 5}"
              class="w-full border rounded-xl p-3"
            >

          </div>

        </div>

        <div class="flex justify-end gap-3 mt-6">

          <button
            type="button"
            onclick="closeProductForm()"
            class="px-5 py-3 border rounded-xl"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl"
          >
            ${isNew ? "Save Product" : "Update Product"}
          </button>

        </div>

      </form>

    </div>

  `;
}

function unitOption(value, selected) {

  const labels = {
    pcs: "Pieces (pcs)",
    kg: "Kilogram (kg)",
    gram: "Gram",
    liter: "Liter",
    meter: "Meter",
    box: "Box",
    packet: "Packet"
  };

  return `
    <option
      value="${value}"
      ${value === selected ? "selected" : ""}
    >
      ${labels[value]}
    </option>
  `;
}

// ============================================================
// SAVE PRODUCT
// ============================================================

function saveProduct(event) {

  event.preventDefault();

  const name =
    document.getElementById("productName").value.trim();

  const category =
    document.getElementById("productCategory").value.trim();

  const barcode =
    document.getElementById("productBarcode").value.trim();

  const unit =
    document.getElementById("productUnit").value;

  const purchasePrice =
    Number(
      document.getElementById("productPurchasePrice").value
    );

  const salePrice =
    Number(
      document.getElementById("productSalePrice").value
    );

  const stock =
    Number(
      document.getElementById("productStock").value
    );

  const minStock =
    Number(
      document.getElementById("productMinStock").value
    );

  if (!name) {
    showToast("Product Name দিন।", "error");
    return;
  }

  if (purchasePrice < 0 || salePrice < 0) {
    showToast("Price সঠিকভাবে দিন।", "error");
    return;
  }

  if (stock < 0) {
    showToast("Stock সঠিকভাবে দিন।", "error");
    return;
  }

  if (editingProductId === "new") {

    const duplicateBarcode =
      barcode &&
      data.products.some(
        product => product.barcode === barcode
      );

    if (duplicateBarcode) {
      showToast("এই Barcode আগে থেকেই আছে।", "error");
      return;
    }

    data.products.push({

      id: generateId("PROD"),

      name,

      category,

      barcode,

      unit,

      purchasePrice,

      salePrice,

      stock,

      minStock,

      createdAt: new Date().toISOString()

    });

    saveData();

    editingProductId = null;

    showToast("Product সফলভাবে যোগ হয়েছে।");

  } else {

    const product =
      data.products.find(
        item => item.id === editingProductId
      );

    if (!product) {
      showToast("Product পাওয়া যায়নি।", "error");
      return;
    }

    const duplicateBarcode =
      barcode &&
      data.products.some(
        item =>
          item.id !== product.id &&
          item.barcode === barcode
      );

    if (duplicateBarcode) {
      showToast("এই Barcode অন্য Product-এ আছে।", "error");
      return;
    }

    product.name = name;
    product.category = category;
    product.barcode = barcode;
    product.unit = unit;
    product.purchasePrice = purchasePrice;
    product.salePrice = salePrice;
    product.stock = stock;
    product.minStock = minStock;
    product.updatedAt = new Date().toISOString();

    saveData();

    editingProductId = null;

    showToast("Product সফলভাবে Update হয়েছে।");
  }

  render();
}

// ============================================================
// DELETE PRODUCT
// ============================================================

function deleteProduct(id) {

  const product =
    data.products.find(
      item => item.id === id
    );

  if (!product) return;

  const confirmed =
    confirm(
      `"${product.name}" Product-টি Delete করতে চান?`
    );

  if (!confirmed) return;

  data.products =
    data.products.filter(
      item => item.id !== id
    );

  saveData();

  showToast("Product Delete হয়েছে।");

  render();
}

// ============================================================
// PRODUCT SEARCH
// ============================================================

function handleProductSearch(value) {

  productSearch = value;

  const tableBody =
    document.querySelector("tbody");

  if (!tableBody) {
    render();
    return;
  }

  const products =
    getFilteredProducts();

  tableBody.innerHTML =
    products.length
      ? products.map(productRow).join("")
      : `
        <tr>
          <td
            colspan="6"
            class="p-10 text-center text-slate-400"
          >
            কোনো Product পাওয়া যায়নি
          </td>
        </tr>
      `;
}

function getFilteredProducts() {

  if (!productSearch.trim()) {
    return data.products;
  }

  const query =
    productSearch.toLowerCase();

  return data.products.filter(product =>

    String(product.name || "")
      .toLowerCase()
      .includes(query)

    ||

    String(product.barcode || "")
      .toLowerCase()
      .includes(query)

    ||

    String(product.category || "")
      .toLowerCase()
      .includes(query)

  );
}

// ============================================================
// BARCODE PAGE
// ============================================================

function barcodePage() {

  return `

    <div class="mb-6">

      <h1 class="text-2xl font-bold">
        Barcode
      </h1>

      <p class="text-slate-500 mt-1">
        Product Barcode ও Template Management
      </p>

    </div>

    <div class="card p-6">

      <h2 class="text-lg font-bold mb-4">
        Barcode Template
      </h2>

      <select
        onchange="changeBarcodeTemplate(this.value)"
        class="border rounded-xl p-3 w-full md:w-96"
      >

        ${data.settings.barcodeTemplates.map(
          template => `
            <option
              value="${escapeHTML(template)}"
              ${
                template ===
                data.settings.selectedBarcodeTemplate
                  ? "selected"
                  : ""
              }
            >
              ${escapeHTML(template)}
            </option>
          `
        ).join("")}

      </select>

      <div class="mt-5 p-4 bg-slate-50 rounded-xl">

        <div class="font-semibold">
          নির্বাচিত Template:
        </div>

        <div class="text-teal-700 mt-1">
          ${escapeHTML(
            data.settings.selectedBarcodeTemplate
          )}
        </div>

      </div>

    </div>

  `;
}

function changeBarcodeTemplate(value) {

  data.settings.selectedBarcodeTemplate = value;

  saveData();

  showToast("Barcode Template পরিবর্তন হয়েছে।");
}

// ============================================================
// SETTINGS
// ============================================================

function settingsPage() {

  return `

    <div class="mb-6">

      <h1 class="text-2xl font-bold">
        Settings
      </h1>

      <p class="text-slate-500 mt-1">
        Software Settings
      </p>

    </div>

    <div class="card p-6">

      <h2 class="text-lg font-bold">
        Barcode Templates
      </h2>

      <div class="mt-4 space-y-2">

        ${data.settings.barcodeTemplates.map(
          template => `
            <div
              class="border rounded-xl p-4 flex items-center justify-between"
            >

              <span>
                ${escapeHTML(template)}
              </span>

              ${
                template ===
                data.settings.selectedBarcodeTemplate
                  ? `
                    <span
                      class="text-sm text-teal-700 font-semibold"
                    >
                      Selected
                    </span>
                  `
                  : ""
              }

            </div>
          `
        ).join("")}

      </div>

      <div class="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">

        Barcode Settings একটি জায়গাতেই রাখা হয়েছে।
        পরবর্তী ধাপে এখান থেকেই Label Size ও Print Settings তৈরি করা হবে।

      </div>

    </div>

  `;
}

// ============================================================
// PLACEHOLDER PAGES
// ============================================================

function placeholderPage(title, message) {

  return `

    <div class="card p-8">

      <div class="text-4xl mb-4">
        🚧
      </div>

      <h1 class="text-2xl font-bold">
        ${title}
      </h1>

      <p class="text-slate-500 mt-2">
        ${message}
      </p>

    </div>

  `;
}

// ============================================================
// START
// ============================================================

render();
