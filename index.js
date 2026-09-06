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
