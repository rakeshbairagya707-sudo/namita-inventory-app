// NAMITA STORE — Accounting & Inventory
// Main Application

const app = document.getElementById("app");

const state = {
  page: "dashboard",
  products: [],
  customers: [],
  suppliers: [],
  purchases: [],
  sales: [],
  payments: [],
  barcodeSettings: {
    templates: [
      "25x50 - 2 Line",
      "25x50 - 1 Line",
      "15x25 - 4 Line",
      "30x50 - 2 Line",
      "40x60 - 2 Line"
    ],
    selected: "25x50 - 2 Line"
  }
};

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function navItem(page, icon, title) {
  return `
    <button onclick="navigate('${page}')"
      class="nav-btn ${state.page === page ? "active" : ""} w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left">
      <span class="text-lg">${icon}</span>
      <span>${title}</span>
    </button>
  `;
}

function render() {
  app.innerHTML = `
    <div class="flex min-h-screen">

      <!-- Sidebar -->
      <aside id="sidebar"
        class="sidebar w-64 min-h-screen text-white p-4 shrink-0">

        <div class="px-3 py-4 mb-4">
          <div class="text-2xl font-bold">NAMITA STORE</div>
          <div class="text-sm opacity-80 mt-1">Accounting & Inventory</div>
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

      <!-- Main -->
      <main class="content flex-1 min-w-0">

        <!-- Top Bar -->
        <header class="bg-white border-b px-5 py-4 flex items-center justify-between">
          <div>
            <button onclick="toggleSidebar()" class="lg:hidden mr-3 text-xl">☰</button>
            <span class="font-semibold text-lg">${pageTitle()}</span>
          </div>

          <div class="text-sm text-slate-500">
            NAMITA STORE
          </div>
        </header>

        <section class="p-5">
          ${pageContent()}
        </section>

      </main>
    </div>
  `;
}

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

  return titles[state.page] || "Dashboard";
}

function pageContent() {
  switch (state.page) {
    case "sales":
      return salesPage();

    case "purchase":
      return purchasePage();

    case "products":
      return productsPage();

    case "customers":
      return customersPage();

    case "suppliers":
      return suppliersPage();

    case "payments":
      return paymentsPage();

    case "history":
      return historyPage();

    case "barcode":
      return barcodePage();

    case "settings":
      return settingsPage();

    default:
      return dashboardPage();
  }
}

function dashboardPage() {
  const totalSales = state.sales.reduce((a, b) => a + Number(b.total || 0), 0);
  const totalPurchase = state.purchases.reduce((a, b) => a + Number(b.total || 0), 0);

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

      <div class="card p-5">
        <div class="text-slate-500 text-sm">Total Sales</div>
        <div class="text-2xl font-bold mt-2">${money(totalSales)}</div>
      </div>

      <div class="card p-5">
        <div class="text-slate-500 text-sm">Total Purchase</div>
        <div class="text-2xl font-bold mt-2">${money(totalPurchase)}</div>
      </div>

      <div class="card p-5">
        <div class="text-slate-500 text-sm">Products</div>
        <div class="text-2xl font-bold mt-2">${state.products.length}</div>
      </div>

      <div class="card p-5">
        <div class="text-slate-500 text-sm">Customers</div>
        <div class="text-2xl font-bold mt-2">${state.customers.length}</div>
      </div>

    </div>

    <div class="card p-6 mt-5">
      <h2 class="text-xl font-bold">Welcome to NAMITA STORE</h2>
      <p class="text-slate-500 mt-2">
        আপনার Accounting & Inventory Software প্রস্তুত করার প্রথম ধাপ সম্পন্ন হয়েছে।
      </p>
    </div>
  `;
}

function salesPage() {
  return `
    <div class="card p-6">
      <div class="flex justify-between items-center mb-5">
        <div>
          <h2 class="text-xl font-bold">Sales / বিক্রয়</h2>
          <p class="text-sm text-slate-500 mt-1">নতুন বিক্রয় Entry তৈরি করুন</p>
        </div>

        <button onclick="showToast('Sales Entry পরবর্তী ধাপে যুক্ত হবে')"
          class="bg-teal-700 text-white px-4 py-2 rounded-xl">
          + New Sale
        </button>
      </div>

      <div class="p-5 bg-slate-50 rounded-xl text-slate-500">
        Sales Entry Panel এখানে তৈরি হবে।
      </div>
    </div>
  `;
}

function purchasePage() {
  return `
    <div class="card p-6">
      <div class="flex justify-between items-center mb-5">
        <div>
          <h2 class="text-xl font-bold">Purchase / ক্রয়</h2>
          <p class="text-sm text-slate-500 mt-1">নতুন Purchase Entry তৈরি করুন</p>
        </div>

        <button onclick="showToast('Purchase Entry পরবর্তী ধাপে যুক্ত হবে')"
          class="bg-teal-700 text-white px-4 py-2 rounded-xl">
          + New Purchase
        </button>
      </div>

      <div class="p-5 bg-slate-50 rounded-xl text-slate-500">
        Purchase Entry Panel এখানে তৈরি হবে।
      </div>
    </div>
  `;
}

function productsPage() {
  return `
    <div class="card p-6">
      <div class="flex justify-between items-center mb-5">
        <div>
          <h2 class="text-xl font-bold">Products / Stock</h2>
          <p class="text-sm text-slate-500">Product ও Stock Management</p>
        </div>

        <button onclick="showToast('Product form পরবর্তী ধাপে যুক্ত হবে')"
          class="bg-teal-700 text-white px-4 py-2 rounded-xl">
          + Add Product
        </button>
      </div>

      <div class="overflow-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b text-slate-500">
              <th class="p-3">Product</th>
              <th class="p-3">Stock</th>
              <th class="p-3">Sale Price</th>
              <th class="p-3">Barcode</th>
            </tr>
          </thead>

          <tbody>
            ${
              state.products.length
                ? state.products.map(p => `
                  <tr class="border-b">
                    <td class="p-3">${p.name}</td>
                    <td class="p-3">${p.stock || 0}</td>
                    <td class="p-3">${money(p.salePrice)}</td>
                    <td class="p-3">${p.barcode || "-"}</td>
                  </tr>
                `).join("")
                : `
                  <tr>
                    <td colspan="4" class="p-6 text-center text-slate-400">
                      কোনো Product নেই
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

function customersPage() {
  return `
    <div class="card p-6">
      <h2 class="text-xl font-bold mb-5">Customers</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input class="border rounded-xl p-3" placeholder="Customer Name">
        <input class="border rounded-xl p-3" placeholder="Mobile Number">
        <button onclick="showToast('Customer Save পরবর্তী ধাপে যুক্ত হবে')"
          class="bg-teal-700 text-white rounded-xl">
          Add Customer
        </button>
      </div>

      <div class="mt-6 text-slate-500">
        Customer list এখানে থাকবে।
      </div>
    </div>
  `;
}

function suppliersPage() {
  return `
    <div class="card p-6">
      <h2 class="text-xl font-bold mb-5">Suppliers / Seller</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input class="border rounded-xl p-3" placeholder="Seller / Supplier Name">
        <input class="border rounded-xl p-3" placeholder="Mobile Number">
        <button onclick="showToast('Supplier Save পরবর্তী ধাপে যুক্ত হবে')"
          class="bg-teal-700 text-white rounded-xl">
          Add Supplier
        </button>
      </div>

      <div class="mt-6 text-slate-500">
        Supplier list এখানে থাকবে।
      </div>
    </div>
  `;
}

function paymentsPage() {
  return `
    <div class="card p-6">
      <h2 class="text-xl font-bold">Due / Payment</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        <div class="border rounded-xl p-5">
          <div class="text-sm text-slate-500">Customer Due</div>
          <div class="text-2xl font-bold mt-2">₹0.00</div>
        </div>

        <div class="border rounded-xl p-5">
          <div class="text-sm text-slate-500">Supplier Due</div>
          <div class="text-2xl font-bold mt-2">₹0.00</div>
        </div>

        <div class="border rounded-xl p-5">
          <div class="text-sm text-slate-500">Total Payment</div>
          <div class="text-2xl font-bold mt-2">₹0.00</div>
        </div>
      </div>
    </div>
  `;
}

function historyPage() {
  return `
    <div class="card p-6">
      <h2 class="text-xl font-bold">Transaction History</h2>

      <p class="text-slate-500 mt-2">
        Sales, Purchase এবং Payment-এর সম্পূর্ণ History এখানে আলাদাভাবে দেখা যাবে।
      </p>

      <div class="mt-6 p-5 bg-slate-50 rounded-xl text-slate-400">
        কোনো Transaction নেই।
      </div>
    </div>
  `;
}

function barcodePage() {
  return `
    <div class="card p-6">
      <div class="flex justify-between items-center mb-5">
        <div>
          <h2 class="text-xl font-bold">Barcode</h2>
          <p class="text-sm text-slate-500 mt-1">
            Barcode তৈরি ও Template নির্বাচন
          </p>
        </div>

        <button onclick="navigate('settings')"
          class="border px-4 py-2 rounded-xl">
          Barcode Settings
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select class="border rounded-xl p-3">
          ${state.barcodeSettings.templates.map(t => `
            <option ${t === state.barcodeSettings.selected ? "selected" : ""}>
              ${t}
            </option>
          `).join("")}
        </select>

        <input class="border rounded-xl p-3" placeholder="Product / Barcode">

        <button onclick="showToast('Barcode Generate পরবর্তী ধাপে যুক্ত হবে')"
          class="bg-teal-700 text-white rounded-xl">
          Generate Barcode
        </button>
      </div>
    </div>
  `;
}

function settingsPage() {
  return `
    <div class="card p-6">
      <h2 class="text-xl font-bold">Settings</h2>

      <div class="mt-6">
        <h3 class="font-semibold mb-3">Barcode Templates</h3>

        <div class="space-y-2">
          ${state.barcodeSettings.templates.map(t => `
            <div class="border rounded-xl p-3 flex justify-between">
              <span>${t}</span>
              ${
                t === state.barcodeSettings.selected
                  ? '<span class="text-teal-700 font-semibold">Selected</span>'
                  : ""
              }
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function navigate(page) {
  state.page = page;
  render();
  window.scrollTo(0, 0);
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.toggle("open");
}

function showToast(message) {
  const toast = document.createElement("div");

  toast.className =
    "toast fixed bottom-5 right-5 z-[100] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg";

  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}

// Start Application
render();
