/* =========================================================
   NAMITA STORE
   ACCOUNTING + BILLING + INVENTORY + E-COMMERCE
   V4 — keeps previous features and adds requested fixes
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     SUPABASE
     ======================================================= */

  const SUPABASE_URL =
    "https://ekcgmmtusasqziirkohd.supabase.co";

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

  const db = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  /* =======================================================
     HELPERS
     ======================================================= */

  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    [...document.querySelectorAll(selector)];

  const money = (value) =>
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const num = (value) =>
    Number(value || 0);

  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>'"]/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#039;",
          '"': "&quot;",
        }[c])
    );

  const uid = () =>
    "NS-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase();

  const today = () =>
    new Date().toISOString().slice(0, 10);

  const dateTime = () =>
    new Date().toISOString();

  const salePrice = (p) =>
    num(
      p?.sale_price ??
      p?.price ??
      p?.mrp ??
      0
    );

  const purchasePrice = (p) =>
    num(p?.purchase_price ?? 0);

  const stockQty = (p) =>
    num(p?.stock ?? 0);

  function toast(
    message,
    type = "success"
  ) {
    const old =
      document.getElementById(
        "ns-toast"
      );

    if (old) old.remove();

    const color =
      type === "error"
        ? "bg-red-600"
        : type === "warning"
        ? "bg-amber-500"
        : "bg-emerald-600";

    const div =
      document.createElement("div");

    div.id = "ns-toast";

    div.className =
      "fixed right-5 bottom-5 z-[9999] " +
      "px-5 py-3 rounded-xl text-white " +
      "shadow-2xl " +
      color;

    div.textContent = message;

    document.body.appendChild(div);

    setTimeout(
      () => div.remove(),
      3000
    );
  }

  /* =======================================================
     MODAL
     ======================================================= */

  function modal(
    title,
    content,
    size = "max-w-3xl"
  ) {
    const old =
      document.getElementById(
        "ns-modal"
      );

    if (old) old.remove();

    const div =
      document.createElement("div");

    div.id = "ns-modal";

    div.className =
      "fixed inset-0 z-[9998] " +
      "bg-black/50 flex items-center " +
      "justify-center p-4";

    div.innerHTML = `
      <div class="
        bg-white rounded-2xl shadow-2xl
        w-full ${size}
        max-h-[92vh]
        overflow-hidden
      ">

        <div class="
          flex items-center justify-between
          px-5 py-4 border-b
        ">

          <h3 class="text-xl font-bold">
            ${esc(title)}
          </h3>

          <button
            onclick="window.nsCloseModal()"
            class="
              text-2xl text-slate-500
              hover:text-red-600
            "
          >
            ×
          </button>
        </div>

        <div class="
          p-5 overflow-y-auto
          max-h-[calc(92vh-70px)]
        ">
          ${content}
        </div>

      </div>
    `;

    document.body.appendChild(div);
  }

  window.nsCloseModal =
    function () {
      const m =
        document.getElementById(
          "ns-modal"
        );

      if (m) m.remove();
    };

  /* =======================================================
     COMMON UI
     ======================================================= */

  function card(
    title,
    value,
    icon,
    extra = ""
  ) {
    return `
      <div class="
        bg-white rounded-2xl border
        shadow-sm p-5
      ">

        <div class="
          flex items-center
          justify-between
        ">

          <div>

            <div class="
              text-sm text-slate-500
            ">
              ${title}
            </div>

            <div class="
              text-2xl font-bold mt-2
            ">
              ${value}
            </div>

            ${extra}

          </div>

          <div class="text-3xl">
            ${icon}
          </div>

        </div>

      </div>
    `;
  }

  function emptyState(
    message =
      "কোনো তথ্য পাওয়া যায়নি"
  ) {
    return `
      <div class="
        bg-white rounded-2xl
        border p-10 text-center
        text-slate-500
      ">
        <div class="text-4xl mb-3">
          📭
        </div>

        <div>
          ${esc(message)}
        </div>
      </div>
    `;
  }

  function sectionHeader(
    title,
    subtitle,
    buttonText = "",
    buttonAction = ""
  ) {
    return `
      <div class="
        flex flex-col md:flex-row
        md:items-center
        md:justify-between
        gap-3 mb-5
      ">

        <div>

          <h2 class="text-2xl font-bold">
            ${title}
          </h2>

          <p class="
            text-sm text-slate-500 mt-1
          ">
            ${subtitle || ""}
          </p>

        </div>

        ${
          buttonText
            ? `
          <button
            onclick="${buttonAction}"
            class="
              bg-gradient-to-r
              from-indigo-600
              via-violet-600
              to-fuchsia-600
              hover:opacity-90
              text-white px-5 py-3
              rounded-xl font-semibold
              shadow-md
            "
          >
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

  let page =
    "dashboard";

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

  let selectedCustomer =
    "";

  let businessSettings = {
    business_name:
      "NAMITA STORE",
    phone: "",
    address: "",
    email: "",
    gstin: "",
    currency: "₹",
  };

  /* =======================================================
     DATABASE LOAD
     ======================================================= */

  async function safeSelect(
    table,
    queryBuilder
  ) {
    try {

      const query =
        queryBuilder
          ? queryBuilder(
              db.from(table)
            )
          : db
              .from(table)
              .select("*");

      const {
        data,
        error
      } = await query;

      if (error) {
        console.warn(
          table,
          error
        );

        return [];
      }

      return data || [];

    } catch (e) {

      console.warn(
        table,
        e
      );

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
      ] =
        await Promise.all([

          safeSelect(
            "products",
            (q) =>
              q
                .select("*")
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
          ),

          safeSelect(
            "customers",
            (q) =>
              q
                .select("*")
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
          ),

          safeSelect(
            "suppliers",
            (q) =>
              q
                .select("*")
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
          ),

          safeSelect(
            "categories",
            (q) =>
              q
                .select("*")
                .order("name")
          ),

          safeSelect(
            "brands",
            (q) =>
              q
                .select("*")
                .order("name")
          ),

          safeSelect(
            "sales",
            (q) =>
              q
                .select("*")
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(500)
          ),

          safeSelect(
            "purchases",
            (q) =>
              q
                .select("*")
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(500)
          ),

          safeSelect(
            "expenses",
            (q) =>
              q
                .select("*")
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(500)
          ),

          safeSelect(
            "income",
            (q) =>
              q
                .select("*")
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(500)
          ),

          safeSelect(
            "payments",
            (q) =>
              q
                .select("*")
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(500)
          ),

          safeSelect(
            "online_orders",
            (q) =>
              q
                .select("*")
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(500)
          ),

          safeSelect(
            "warehouses",
            (q) =>
              q
                .select("*")
                .order(
                  "created_at"
                )
          ),

        ]);

      try {

        const {
          data
        } = await db
          .from(
            "business_settings"
          )
          .select("*")
          .limit(1)
          .maybeSingle();

        if (data) {

          businessSettings =
            {
              ...businessSettings,
              ...data,
            };
        }

      } catch (_) {}

      render();

    } catch (error) {

      console.error(error);

      toast(
        "ডেটা লোড করতে সমস্যা হয়েছে",
        "error"
      );
    }
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const menuGroups = [

    {
      title: "MAIN",

      items: [
        [
          "dashboard",
          "📊",
          "Dashboard",
        ],
      ],
    },

    {
      title: "SALES",

      items: [

        [
          "pos",
          "🔥",
          "POS Billing",
        ],

        [
          "sales",
          "🧾",
          "Sales History",
        ],

        [
          "salesReturn",
          "↩️",
          "Sales Return",
        ],

        [
          "customerPayment",
          "💰",
          "Payment Collection",
        ],

      ],
    },

    {
      title: "INVENTORY",

      items: [

        [
          "products",
          "📦",
          "Products",
        ],

        [
          "categories",
          "🗂️",
          "Categories",
        ],

        [
          "brands",
          "🏷️",
          "Brands",
        ],

        [
          "variants",
          "🔹",
          "Product Variants",
        ],

        [
          "stock",
          "📊",
          "Stock Management",
        ],

        [
          "stockAdjustment",
          "🛠️",
          "Stock Adjustment",
        ],

        [
          "stockTransfer",
          "🔄",
          "Stock Transfer",
        ],

        [
          "stockHistory",
          "📜",
          "Stock History",
        ],

        [
          "lowStock",
          "⚠️",
          "Low Stock",
        ],

      ],
    },

    {
      title: "PURCHASE",

      items: [

        [
          "purchase",
          "🛒",
          "New Purchase",
        ],

        [
          "purchaseHistory",
          "📋",
          "Purchase History",
        ],

        [
          "purchaseReturn",
          "↩️",
          "Purchase Return",
        ],

        [
          "purchaseOrders",
          "📝",
          "Purchase Orders",
        ],

        [
          "supplierPayment",
          "💳",
          "Supplier Payment",
        ],

      ],
    },

    {
      title: "PARTIES",

      items: [

        [
          "customers",
          "👥",
          "Customers",
        ],

        [
          "customerDue",
          "⚠️",
          "Customer Due",
        ],

        [
          "suppliers",
          "🚚",
          "Suppliers",
        ],

        [
          "supplierDue",
          "⚠️",
          "Supplier Due",
        ],

      ],
    },

    {
      title: "ACCOUNTING",

      items: [

        [
          "accounts",
          "📒",
          "Accounts",
        ],

        [
          "accountGroups",
          "📚",
          "Account Groups",
        ],

        [
          "cashBank",
          "💵",
          "Cash & Bank",
        ],

        [
          "cashTransfer",
          "🔁",
          "Cash/Bank Transfer",
        ],

        [
          "income",
          "➕",
          "Income",
        ],

        [
          "expenses",
          "➖",
          "Expenses",
        ],

        [
          "journal",
          "📓",
          "Journal Entry",
        ],

        [
          "ledger",
          "📖",
          "Ledger",
        ],

        [
          "trialBalance",
          "⚖️",
          "Trial Balance",
        ],

        [
          "profitLoss",
          "📈",
          "Profit & Loss",
        ],

        [
          "balanceSheet",
          "🏦",
          "Balance Sheet",
        ],

      ],
    },

    {
      title: "REPORTS",

      items: [

        [
          "salesReport",
          "📊",
          "Sales Report",
        ],

        [
          "purchaseReport",
          "📊",
          "Purchase Report",
        ],

        [
          "stockReport",
          "📦",
          "Stock Report",
        ],

        [
          "dueReport",
          "⚠️",
          "Due Report",
        ],

        [
          "expenseReport",
          "💸",
          "Expense Report",
        ],

        [
          "incomeReport",
          "💰",
          "Income Report",
        ],

        [
          "profitReport",
          "📈",
          "Profit Report",
        ],

        [
          "dayBook",
          "📅",
          "Day Book",
        ],

      ],
    },

    {
      title: "E-COMMERCE",

      items: [

        [
          "ecommerceProducts",
          "🛍️",
          "Online Products",
        ],

        [
          "productImages",
          "🖼️",
          "Product Images",
        ],

        [
          "onlineOrders",
          "📦",
          "Online Orders",
        ],

        [
          "onlinePayments",
          "💳",
          "Online Payments",
        ],

        [
          "shipping",
          "🚚",
          "Shipping",
        ],

        [
          "orderTracking",
          "📍",
          "Order Tracking",
        ],

        [
          "onlineReturns",
          "↩️",
          "Online Returns",
        ],

        [
          "wishlist",
          "❤️",
          "Wishlist",
        ],

        [
          "onlineStore",
          "🛍️",
          "Online Store",
        ],

      ],
    },

    {
      title: "TOOLS",

      items: [

        [
          "barcode",
          "🔳",
          "Barcode Generator",
        ],

        [
          "barcodeTemplates",
          "🏷️",
          "Barcode Templates",
        ],

        [
          "invoiceTemplates",
          "🧾",
          "Invoice Templates",
        ],

      ],
    },

    {
      title: "SYSTEM",

      items: [

        [
          "users",
          "👤",
          "Users & Permissions",
        ],

        [
          "activity",
          "📝",
          "Activity Log",
        ],

        [
          "notifications",
          "🔔",
          "Notifications",
        ],

        [
          "settings",
          "⚙️",
          "Settings",
        ],

      ],
    },

  ];

  function renderSidebar() {

    return `

      <aside
        id="ns-sidebar"
        class="
          fixed md:static
          inset-y-0 left-0
          z-50 w-72
          bg-gradient-to-b
          from-slate-950
          via-indigo-950
          to-violet-950
          text-white
          transform
          -translate-x-full
          md:translate-x-0
          transition-transform
          overflow-y-auto
        "
      >

        <div
          class="
            p-5
            border-b
            border-slate-800
          "
        >

          <div
            class="
              text-2xl
              font-black
              tracking-wide
            "
          >
            NAMITA STORE
          </div>

          <div
            class="
              text-xs
              text-slate-400
              mt-1
            "
          >
            Accounting • Billing • Inventory
          </div>

        </div>

        <div class="p-3">

          ${menuGroups
            .map(
              (group) => `

                <div class="mb-5">

                  <div
                    class="
                      text-[10px]
                      font-bold
                      tracking-widest
                      text-slate-500
                      px-3 mb-2
                    "
                  >
                    ${group.title}
                  </div>

                  ${group.items
                    .map(
                      (
                        [
                          id,
                          icon,
                          label,
                        ]
                      ) => `

                        <button
                          onclick="
                            window.nsGo('${id}')
                          "
                          class="
                            w-full
                            flex items-center
                            gap-3
                            px-3 py-2.5
                            rounded-xl
                            mb-1

                            ${
                              page === id
                                ? `
                                  bg-gradient-to-r
                                  from-indigo-500
                                  via-violet-500
                                  to-fuchsia-500
                                  text-white
                                  shadow-lg
                                `
                                : `
                                  text-slate-300
                                  hover:bg-slate-800
                                  hover:text-white
                                `
                            }
                          "
                        >

                          <span
                            class="
                              w-6
                              text-center
                            "
                          >
                            ${icon}
                          </span>

                          <span>
                            ${label}
                          </span>

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

  window.nsToggleSidebar =
    function () {

      const s =
        document.getElementById(
          "ns-sidebar"
        );

      if (!s) return;

      s.classList.toggle(
        "-translate-x-full"
      );
    };

  window.nsGo =
    function (p) {

      page = p;

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      render();

      const sidebar =
        document.getElementById(
          "ns-sidebar"
        );

      if (
        window.innerWidth < 768 &&
        sidebar
      ) {

        sidebar.classList.add(
          "-translate-x-full"
        );
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
              class="md:hidden bg-slate-100 px-3 py-2 rounded-lg"
            >
              ☰
            </button>

            <div>
              <div class="font-bold">
                ${esc(
                  businessSettings.business_name ||
                  "NAMITA STORE"
                )}
              </div>

              <div class="text-xs text-slate-500 mt-0.5">
                ${new Date().toLocaleDateString("bn-IN")}
              </div>
            </div>

          </div>

          <button
            onclick="window.nsGo('pos')"
            class="
              bg-gradient-to-r
              from-indigo-600
              via-violet-600
              to-fuchsia-600
              hover:opacity-90
              text-white
              px-4 py-2.5
              rounded-xl
              font-semibold
              shadow
            "
          >
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
      .filter(
        (s) =>
          String(s.created_at || "").slice(0, 10) === today()
      )
      .reduce(
        (sum, s) =>
          sum + num(s.total_amount),
        0
      );
  }

  function getTodayPurchase() {
    return purchases
      .filter(
        (p) =>
          String(p.created_at || "").slice(0, 10) === today()
      )
      .reduce(
        (sum, p) =>
          sum + num(p.total_amount),
        0
      );
  }

  function getCustomerDue() {
    return customers.reduce(
      (sum, c) =>
        sum + num(c.due_amount),
      0
    );
  }

  function getSupplierDue() {
    return suppliers.reduce(
      (sum, s) =>
        sum + num(s.due_amount),
      0
    );
  }

  function getStockQty() {
    return products.reduce(
      (sum, p) =>
        sum + stockQty(p),
      0
    );
  }

  function getStockValue() {
    return products.reduce(
      (sum, p) =>
        sum +
        stockQty(p) *
          purchasePrice(p),
      0
    );
  }

  function getLowStock() {
    return products.filter(
      (p) =>
        stockQty(p) <=
        num(
          p.minimum_stock ??
          5
        )
    );
  }

  function dashboardPage() {
    const low = getLowStock();

    return `
      ${sectionHeader(
        "Dashboard",
        "NAMITA STORE — Accounting + Billing + Inventory + E-Commerce"
      )}

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        ${card(
          "আজকের Sales",
          money(getTodaySales()),
          "💰",
          `<span class="text-xs text-emerald-600">Live</span>`
        )}

        ${card(
          "আজকের Purchase",
          money(getTodayPurchase()),
          "🛒"
        )}

        ${card(
          "Customer Due",
          money(getCustomerDue()),
          "👥"
        )}

        ${card(
          "Supplier Due",
          money(getSupplierDue()),
          "🚚"
        )}

        ${card(
          "মোট Products",
          products.length,
          "📦"
        )}

        ${card(
          "মোট Stock",
          getStockQty(),
          "📊"
        )}

        ${card(
          "Stock Value",
          money(getStockValue()),
          "💎"
        )}

        ${card(
          "Online Orders",
          onlineOrders.length,
          "🛍️"
        )}

      </div>

      <div class="grid lg:grid-cols-3 gap-5 mt-6">

        <div class="
          lg:col-span-2
          bg-gradient-to-br
          from-indigo-600
          via-violet-600
          to-fuchsia-600
          text-white
          rounded-3xl
          p-6
          shadow-xl
        ">

          <div class="text-sm opacity-90">
            Seller Panel
          </div>

          <div class="text-3xl font-black mt-2">
            সবকিছু এক জায়গায়
          </div>

          <div class="mt-3 opacity-90">
            POS • Inventory • Accounting • E-Commerce • Reports • Barcode
          </div>

          <div class="flex flex-wrap gap-2 mt-5">

            <button
              onclick="window.nsGo('pos')"
              class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl"
            >
              🔥 New Sale
            </button>

            <button
              onclick="window.nsGo('purchase')"
              class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl"
            >
              🛒 Purchase
            </button>

            <button
              onclick="window.nsGo('ecommerceProducts')"
              class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl"
            >
              🛍️ Store
            </button>

            <button
              onclick="window.nsGo('products')"
              class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl"
            >
              📦 Products
            </button>

            <button
              onclick="window.nsGo('barcode')"
              class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl"
            >
              🔳 Barcode
            </button>

          </div>

        </div>

        <div class="
          bg-white
          border
          rounded-3xl
          p-5
        ">

          <h3 class="font-bold text-lg">
            ⚠️ Low Stock
          </h3>

          <div class="mt-3 space-y-2">

            ${
              low
                .slice(0, 6)
                .map(
                  (p) => `
                    <div class="
                      flex
                      justify-between
                      p-3
                      bg-red-50
                      rounded-xl
                    ">

                      <span>
                        ${esc(p.name)}
                      </span>

                      <b class="text-red-600">
                        ${stockQty(p)}
                      </b>

                    </div>
                  `
                )
                .join("") ||
              `
                <div class="text-emerald-600 p-3">
                  Stock ঠিক আছে
                </div>
              `
            }

          </div>

        </div>

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

      <div class="
        bg-white
        border
        rounded-2xl
        overflow-hidden
      ">

        <div class="
          p-4
          border-b
          flex
          flex-col
          md:flex-row
          gap-3
        ">

          <input
            id="product-search"
            oninput="window.nsFilterProducts()"
            placeholder="Product / SKU / Barcode খুঁজুন..."
            class="
              border
              rounded-xl
              px-4 py-3
              flex-1
            "
          >

          <select
            id="product-category"
            onchange="window.nsFilterProducts()"
            class="
              border
              rounded-xl
              px-4 py-3
            "
          >

            <option value="">
              সব Category
            </option>

            ${categories
              .map(
                (c) => `
                  <option value="${esc(c.name)}">
                    ${esc(c.name)}
                  </option>
                `
              )
              .join("")}

          </select>

        </div>

        <div class="overflow-x-auto">

          <table class="w-full text-sm">

            <thead class="bg-slate-50">

              <tr>

                <th class="text-left p-4">
                  Product
                </th>

                <th class="text-left p-4">
                  SKU/Barcode
                </th>

                <th class="text-right p-4">
                  Purchase
                </th>

                <th class="text-right p-4">
                  Sale
                </th>

                <th class="text-right p-4">
                  Stock
                </th>

                <th class="text-center p-4">
                  Action
                </th>

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

          <td
            colspan="6"
            class="
              p-10
              text-center
              text-slate-500
            "
          >
            কোনো Product নেই
          </td>

        </tr>
      `;
    }

    return list
      .map(
        (p) => `
          <tr class="
            border-t
            hover:bg-slate-50
          ">

            <td class="p-4">

              <div class="font-semibold">
                ${esc(p.name)}
              </div>

              <div class="text-xs text-slate-500">
                ${esc(p.category || "")}
              </div>

            </td>

            <td class="p-4">

              ${esc(p.sku || "-")}

              <br>

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

            <td class="p-4 text-right font-bold">
              ${stockQty(p)}
            </td>

            <td class="p-4 text-center">

              <button
                onclick="window.nsEditProduct('${p.id}')"
                class="
                  bg-blue-50
                  text-blue-600
                  px-3 py-1.5
                  rounded-lg
                  mr-1
                "
              >
                Edit
              </button>

              <button
                onclick="window.nsDeleteProduct('${p.id}')"
                class="
                  bg-red-50
                  text-red-600
                  px-3 py-1.5
                  rounded-lg
                "
              >
                Delete
              </button>

            </td>

          </tr>
        `
      )
      .join("");
  }

  window.nsFilterProducts =
    function () {

      const q =
        ($("#product-search")?.value || "")
          .toLowerCase()
          .trim();

      const category =
        $("#product-category")?.value || "";

      const list = products.filter((p) => {

        const text =
          `${p.name || ""} ${p.sku || ""} ${
            p.barcode || ""
          }`.toLowerCase();

        const matchSearch =
          !q ||
          text.includes(q);

        const matchCategory =
          !category ||
          String(p.category || "") === category;

        return (
          matchSearch &&
          matchCategory
        );
      });

      const body =
        $("#product-table-body");

      if (body) {
        body.innerHTML =
          productRows(list);
      }
    };

  /* =======================================================
     ADD PRODUCT
     ======================================================= */

  window.nsAddProduct =
    function () {

      modal(
        "নতুন Product",
        `
          <form
            onsubmit="window.nsSaveProduct(event)"
            class="space-y-4"
          >

            <div>

              <label class="font-semibold text-sm">
                Product Name *
              </label>

              <input
                name="name"
                required
                class="
                  w-full
                  border
                  rounded-xl
                  px-4 py-3
                  mt-1
                "
              >

            </div>

            <div class="grid md:grid-cols-2 gap-4">

              <div>

                <label class="font-semibold text-sm">
                  Category
                </label>

                <select
                  name="category"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

                  <option value="">
                    Select Category
                  </option>

                  ${categories
                    .map(
                      (c) => `
                        <option value="${esc(c.name)}">
                          ${esc(c.name)}
                        </option>
                      `
                    )
                    .join("")}

                </select>

              </div>

              <div>

                <label class="font-semibold text-sm">
                  Brand
                </label>

                <select
                  name="brand"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

                  <option value="">
                    Select Brand
                  </option>

                  ${brands
                    .map(
                      (b) => `
                        <option value="${esc(b.name)}">
                          ${esc(b.name)}
                        </option>
                      `
                    )
                    .join("")}

                </select>

              </div>

            </div>

            <div class="grid md:grid-cols-2 gap-4">

              <div>

                <label class="font-semibold text-sm">
                  SKU
                </label>

                <input
                  name="sku"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

              </div>

              <div>

                <label class="font-semibold text-sm">
                  Barcode
                </label>

                <input
                  name="barcode"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

              </div>

            </div>

            <div class="grid md:grid-cols-3 gap-4">

              <div>

                <label class="font-semibold text-sm">
                  Purchase Price
                </label>

                <input
                  name="purchase_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value="0"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

              </div>

              <div>

                <label class="font-semibold text-sm">
                  Sale Price *
                </label>

                <input
                  name="sale_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value="0"
                  required
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

              </div>

              <div>

                <label class="font-semibold text-sm">
                  Opening Stock
                </label>

                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="0.01"
                  value="0"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

              </div>

            </div>

            <div>

              <label class="font-semibold text-sm">
                Minimum Stock
              </label>

              <input
                name="minimum_stock"
                type="number"
                min="0"
                step="0.01"
                value="5"
                class="
                  w-full
                  border
                  rounded-xl
                  px-4 py-3
                  mt-1
                "
              >

            </div>

            <button
              class="
                w-full
                bg-gradient-to-r
                from-indigo-600
                via-violet-600
                to-fuchsia-600
                text-white
                px-6 py-3
                rounded-xl
                font-semibold
              "
            >
              Save Product
            </button>

          </form>
        `
      );
    };

  window.nsSaveProduct =
    async function (event) {

      event.preventDefault();

      const fd =
        new FormData(
          event.target
        );

      const name =
        String(
          fd.get("name") || ""
        ).trim();

      if (!name) {

        toast(
          "Product Name দিন",
          "warning"
        );

        return;
      }

      const sale =
        num(
          fd.get("sale_price")
        );

      const payload = {
        name,

        category:
          fd.get("category") ||
          null,

        brand:
          fd.get("brand") ||
          null,

        sku:
          fd.get("sku") ||
          null,

        barcode:
          fd.get("barcode") ||
          null,

        purchase_price:
          num(
            fd.get(
              "purchase_price"
            )
          ),

        sale_price:
          sale,

        price:
          sale,

        stock:
          num(
            fd.get("stock")
          ),

        minimum_stock:
          num(
            fd.get(
              "minimum_stock"
            )
          ),

        is_active:
          true,

        created_at:
          dateTime(),
      };

      const {
        error
      } =
        await db
          .from("products")
          .insert(payload);

      if (error) {

        console.error(error);

        toast(
          "Product Save হয়নি: " +
          error.message,
          "error"
        );

        return;
      }

      nsCloseModal();

      toast(
        "Product যোগ হয়েছে"
      );

      await loadAll();
    };

  /* =======================================================
     EDIT PRODUCT
     ======================================================= */

  window.nsEditProduct =
    function (id) {

      const p =
        products.find(
          (x) =>
            String(x.id) ===
            String(id)
        );

      if (!p) {

        toast(
          "Product পাওয়া যায়নি",
          "error"
        );

        return;
      }

      modal(
        "Product Edit",
        `
          <form
            onsubmit="
              window.nsUpdateProduct(
                event,
                '${id}'
              )
            "
            class="space-y-4"
          >

            <div>

              <label class="font-semibold text-sm">
                Product Name *
              </label>

              <input
                name="name"
                required
                value="${esc(p.name)}"
                class="
                  w-full
                  border
                  rounded-xl
                  px-4 py-3
                  mt-1
                "
              >

            </div>

            <div class="grid md:grid-cols-2 gap-4">

              <div>

                <label class="font-semibold text-sm">
                  Category
                </label>

                <select
                  name="category"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

                  <option value="">
                    Select Category
                  </option>

                  ${categories
                    .map(
                      (c) => `
                        <option
                          value="${esc(c.name)}"
                          ${
                            String(
                              p.category || ""
                            ) ===
                            String(c.name)
                              ? "selected"
                              : ""
                          }
                        >
                          ${esc(c.name)}
                        </option>
                      `
                    )
                    .join("")}

                </select>

              </div>

              <div>

                <label class="font-semibold text-sm">
                  Brand
                </label>

                <select
                  name="brand"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

                  <option value="">
                    Select Brand
                  </option>

                  ${brands
                    .map(
                      (b) => `
                        <option
                          value="${esc(b.name)}"
                          ${
                            String(
                              p.brand || ""
                            ) ===
                            String(b.name)
                              ? "selected"
                              : ""
                          }
                        >
                          ${esc(b.name)}
                        </option>
                      `
                    )
                    .join("")}

                </select>

              </div>

            </div>

            <div class="grid md:grid-cols-2 gap-4">

              <div>

                <label class="font-semibold text-sm">
                  SKU
                </label>

                <input
                  name="sku"
                  value="${esc(
                    p.sku || ""
                  )}"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

              </div>

              <div>

                <label class="font-semibold text-sm">
                  Barcode
                </label>

                <input
                  name="barcode"
                  value="${esc(
                    p.barcode || ""
                  )}"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

              </div>

            </div>

            <div class="grid md:grid-cols-3 gap-4">

              <div>

                <label class="font-semibold text-sm">
                  Purchase Price
                </label>

                <input
                  name="purchase_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value="${num(
                    p.purchase_price
                  )}"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

              </div>

              <div>

                <label class="font-semibold text-sm">
                  Sale Price *
                </label>

                <input
                  name="sale_price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value="${num(
                    salePrice(p)
                  )}"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

              </div>

              <div>

                <label class="font-semibold text-sm">
                  Stock
                </label>

                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="0.01"
                  value="${stockQty(p)}"
                  class="
                    w-full
                    border
                    rounded-xl
                    px-4 py-3
                    mt-1
                  "
                >

              </div>

            </div>

            <div>

              <label class="font-semibold text-sm">
                Minimum Stock
              </label>

              <input
                name="minimum_stock"
                type="number"
                min="0"
                step="0.01"
                value="${num(
                  p.minimum_stock ?? 5
                )}"
                class="
                  w-full
                  border
                  rounded-xl
                  px-4 py-3
                  mt-1
                "
              >

            </div>

            <button
              class="
                w-full
                bg-blue-600
                hover:bg-blue-700
                text-white
                px-6 py-3
                rounded-xl
                font-semibold
              "
            >
              Update Product
            </button>

          </form>
        `
      );
    };

  window.nsUpdateProduct =
    async function (
      event,
      id
    ) {

      event.preventDefault();

      const fd =
        new FormData(
          event.target
        );

      const sale =
        num(
          fd.get(
            "sale_price"
          )
        );

      const {
        error
      } =
        await db
          .from("products")
          .update({

            name:
              String(
                fd.get(
                  "name"
                ) || ""
              ).trim(),

            category:
              fd.get(
                "category"
              ) || null,

            brand:
              fd.get(
                "brand"
              ) || null,

            sku:
              fd.get("sku") ||
              null,

            barcode:
              fd.get(
                "barcode"
              ) || null,

            purchase_price:
              num(
                fd.get(
                  "purchase_price"
                )
              ),

            sale_price:
              sale,

            price:
              sale,

            stock:
              num(
                fd.get("stock")
              ),

            minimum_stock:
              num(
                fd.get(
                  "minimum_stock"
                )
              ),

          })
          .eq(
            "id",
            id
          );

      if (error) {

        toast(
          error.message,
          "error"
        );

        return;
      }

      nsCloseModal();

      toast(
        "Product Updated"
      );

      await loadAll();
    };

  window.nsDeleteProduct =
    async function (id) {

      const p =
        products.find(
          (x) =>
            String(x.id) ===
            String(id)
        );

      if (!p) return;

      const ok =
        confirm(
          `Product "${p.name}" Delete করবেন?`
        );

      if (!ok) return;

      const {
        error
      } =
        await db
          .from("products")
          .delete()
          .eq(
            "id",
            id
          );

      if (error) {

        toast(
          "Delete হয়নি: " +
          error.message,
          "error"
        );

        return;
      }

      toast(
        "Product Delete হয়েছে"
      );

      await loadAll();
    };
