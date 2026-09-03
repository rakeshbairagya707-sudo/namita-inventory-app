/* =========================================================

   NAMITA STORE — Accounting & Inventory

   Complete single-file application

   ========================================================= */



(function () {

  "use strict";



  const KEY = {

    products: "ns_products",

    customers: "ns_customers",

    suppliers: "ns_suppliers",

    purchases: "ns_purchases",

    sales: "ns_sales",

    payments: "ns_payments",

    stockHistory: "ns_stock_history",

    ecommerce: "ns_ecommerce",

    settings: "ns_settings",

    barcode: "ns_barcode_settings"

  };



  const $ = id => document.getElementById(id);



  const esc = v => String(v ?? "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");



  const num = v => Number(v) || 0;



  const money = v =>

    "₹" + num(v).toLocaleString("en-IN", {

      minimumFractionDigits: 2,

      maximumFractionDigits: 2

    });



  const today = () => new Date().toISOString().slice(0, 10);



  const uid = prefix =>

    prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);



  function load(key, fallback = []) {

    try {

      const x = localStorage.getItem(key);

      return x ? JSON.parse(x) : fallback;

    } catch {

      return fallback;

    }

  }



  function save(key, value) {

    localStorage.setItem(key, JSON.stringify(value));

  }



  let products = load(KEY.products);

  let customers = load(KEY.customers);

  let suppliers = load(KEY.suppliers);

  let purchases = load(KEY.purchases);

  let sales = load(KEY.sales);

  let payments = load(KEY.payments);

  let stockHistory = load(KEY.stockHistory);

  let ecommerce = load(KEY.ecommerce);

  let settings = load(KEY.settings, {

    store: "NAMITA STORE",

    phone: "",

    address: "",

    currency: "₹"

  });

  let barcodeSettings = load(KEY.barcode, {

    template: "25x50-2",

    showStore: true,

    showProduct: true,

    showBarcode: true,

    showPrice: true,

    showSku: true

  });



  let cart = [];

  let currentPage = "dashboard";

  let editingProductId = null;

  let editingCustomerId = null;

  let editingSupplierId = null;

  let editingPurchaseId = null;



  /* =========================================================

     CSS

     ========================================================= */



  const style = document.createElement("style");

  style.textContent = `

    *{box-sizing:border-box}

    body{

      margin:0;

      background:#f4f7f7;

      color:#172033;

      font-family:Arial,"Noto Sans",sans-serif;

    }

    button,input,select,textarea{font:inherit}

    button{cursor:pointer}

    .ns-app{display:flex;min-height:100vh}

    .ns-sidebar{

      width:245px;

      background:linear-gradient(180deg,#0f766e,#115e59);

      color:#fff;

      position:fixed;

      top:0;

      left:0;

      bottom:0;

      overflow-y:auto;

      padding:18px 12px;

      z-index:50;

    }

    .ns-logo{

      text-align:center;

      padding:8px 4px 20px;

      border-bottom:1px solid rgba(255,255,255,.18);

      margin-bottom:15px;

    }

    .ns-logo h2{margin:0;font-size:21px}

    .ns-logo small{opacity:.75}

    .ns-nav button{

      width:100%;

      border:0;

      color:#fff;

      background:transparent;

      padding:12px 13px;

      margin:3px 0;

      border-radius:10px;

      text-align:left;

    }

    .ns-nav button:hover{background:rgba(255,255,255,.12)}

    .ns-nav button.active{

      background:#fff;

      color:#115e59;

      font-weight:bold;

    }

    .ns-main{

      margin-left:245px;

      width:calc(100% - 245px);

      min-height:100vh;

    }

    .ns-top{

      background:#fff;

      border-bottom:1px solid #e5e7eb;

      padding:14px 22px;

      display:flex;

      align-items:center;

      justify-content:space-between;

      gap:12px;

      position:sticky;

      top:0;

      z-index:20;

    }

    .ns-top h1{font-size:20px;margin:0}

    .ns-content{padding:22px}

    .ns-card{

      background:#fff;

      border:1px solid #e4e9e9;

      border-radius:15px;

      padding:18px;

      margin-bottom:18px;

      box-shadow:0 4px 18px rgba(15,118,110,.05);

    }

    .ns-card h2,.ns-card h3{margin-top:0}

    .ns-grid{

      display:grid;

      grid-template-columns:repeat(4,1fr);

      gap:15px;

    }

    .ns-stat{

      background:#fff;

      border:1px solid #e4e9e9;

      border-radius:15px;

      padding:18px;

    }

    .ns-stat small{color:#64748b}

    .ns-stat strong{

      display:block;

      font-size:25px;

      margin-top:7px;

    }

    .ns-form{

      display:grid;

      grid-template-columns:repeat(4,1fr);

      gap:13px;

    }

    .ns-field{display:flex;flex-direction:column;gap:5px}

    .ns-field label{font-size:13px;font-weight:bold;color:#334155}

    .ns-field input,

    .ns-field select,

    .ns-field textarea{

      width:100%;

      padding:10px 11px;

      border:1px solid #cbd5e1;

      border-radius:8px;

      background:#fff;

    }

    .ns-field textarea{min-height:75px;resize:vertical}

    .ns-full{grid-column:1/-1}

    .ns-actions{

      display:flex;

      flex-wrap:wrap;

      gap:8px;

      margin-top:15px;

    }

    .ns-btn{

      border:0;

      border-radius:8px;

      padding:10px 14px;

      background:#0f766e;

      color:#fff;

      font-weight:bold;

    }

    .ns-btn:hover{opacity:.9}

    .ns-btn.secondary{background:#475569}

    .ns-btn.green{background:#15803d}

    .ns-btn.red{background:#dc2626}

    .ns-btn.orange{background:#ea580c}

    .ns-btn.blue{background:#2563eb}

    .ns-btn.light{

      background:#e2e8f0;

      color:#172033;

    }

    .ns-table-wrap{overflow:auto}

    table{width:100%;border-collapse:collapse;min-width:700px}

    th,td{

      padding:10px;

      border-bottom:1px solid #e5e7eb;

      text-align:left;

      vertical-align:middle;

    }

    th{background:#f8fafc;font-size:13px}

    .ns-badge{

      display:inline-block;

      padding:4px 8px;

      border-radius:20px;

      font-size:12px;

      font-weight:bold;

      background:#e2e8f0;

    }

    .ns-badge.green{background:#dcfce7;color:#166534}

    .ns-badge.red{background:#fee2e2;color:#991b1b}

    .ns-badge.orange{background:#ffedd5;color:#9a3412}

    .ns-toolbar{

      display:flex;

      flex-wrap:wrap;

      gap:9px;

      align-items:center;

      margin-bottom:15px;

    }

    .ns-toolbar input,.ns-toolbar select{

      padding:9px;

      border:1px solid #cbd5e1;

      border-radius:8px;

    }

    .ns-empty{

      padding:30px;

      text-align:center;

      color:#64748b;

    }

    .ns-modal{

      position:fixed;

      inset:0;

      background:rgba(15,23,42,.58);

      display:none;

      align-items:center;

      justify-content:center;

      z-index:100;

      padding:15px;

    }

    .ns-modal.show{display:flex}

    .ns-modal-box{

      background:#fff;

      width:min(900px,100%);

      max-height:92vh;

      overflow:auto;

      border-radius:15px;

      padding:20px;

    }

    .ns-modal-head{

      display:flex;

      justify-content:space-between;

      align-items:center;

      margin-bottom:15px;

    }

    .ns-close{

      border:0;

      background:#fee2e2;

      color:#991b1b;

      width:35px;

      height:35px;

      border-radius:50%;

      font-size:18px;

    }

    .ns-sale-layout{

      display:grid;

      grid-template-columns:1.5fr 1fr;

      gap:18px;

    }

    .ns-product-picker{

      display:grid;

      grid-template-columns:repeat(3,1fr);

      gap:10px;

      margin-top:12px;

    }

    .ns-product-mini{

      border:1px solid #dbe4e4;

      background:#fff;

      border-radius:10px;

      padding:12px;

      text-align:left;

    }

    .ns-product-mini:hover{border-color:#0f766e}

    .ns-cart-row{

      display:grid;

      grid-template-columns:1fr 80px 100px 35px;

      gap:7px;

      align-items:center;

      padding:8px 0;

      border-bottom:1px solid #e5e7eb;

    }

    .ns-total-box{

      background:#f8fafc;

      border-radius:10px;

      padding:14px;

      margin-top:12px;

    }

    .ns-total-line{

      display:flex;

      justify-content:space-between;

      padding:4px 0;

    }

    .ns-total-line.big{

      font-size:20px;

      font-weight:bold;

      border-top:1px solid #cbd5e1;

      margin-top:6px;

      padding-top:10px;

    }

    .ns-shortcuts{

      display:grid;

      grid-template-columns:repeat(4,1fr);

      gap:12px;

    }

    .ns-shortcut{

      border:0;

      background:#fff;

      border:1px solid #e2e8f0;

      border-radius:12px;

      padding:18px;

      text-align:left;

      font-weight:bold;

    }

    .ns-shortcut:hover{border-color:#0f766e}

    .ns-barcode-stage{

      background:#e5e7eb;

      min-height:380px;

      padding:30px;

      display:flex;

      justify-content:center;

      align-items:center;

      overflow:auto;

    }

    .ns-sticker{

      background:#fff;

      border:1px solid #111;

      display:flex;

      flex-direction:column;

      justify-content:center;

      align-items:center;

      text-align:center;

      padding:7px;

      color:#111;

    }

    .ns-sticker.s25x50{width:50mm;min-height:25mm}

    .ns-sticker.s25x50.one{min-height:25mm}

    .ns-sticker.s15x25{width:25mm;min-height:15mm;font-size:8px}

    .ns-sticker svg{max-width:90%;height:auto}

    .ns-mobile-menu{display:none}

    @media(max-width:1050px){

      .ns-grid{grid-template-columns:repeat(2,1fr)}

      .ns-form{grid-template-columns:repeat(2,1fr)}

      .ns-sale-layout{grid-template-columns:1fr}

      .ns-product-picker{grid-template-columns:repeat(2,1fr)}

      .ns-shortcuts{grid-template-columns:repeat(2,1fr)}

    }

    @media(max-width:750px){

      .ns-sidebar{

        transform:translateX(-100%);

        transition:.2s;

      }

      .ns-sidebar.open{transform:translateX(0)}

      .ns-main{

        margin-left:0;

        width:100%;

      }

      .ns-mobile-menu{display:block}

      .ns-grid,.ns-form{grid-template-columns:1fr}

      .ns-shortcuts{grid-template-columns:1fr}

      .ns-content{padding:12px}

      .ns-top{padding:12px}

    }

  `;

  document.head.appendChild(style);



  /* =========================================================

     APP SHELL

     ========================================================= */



  document.getElementById("app").innerHTML = `

    <div class="ns-app">

      <aside class="ns-sidebar" id="nsSidebar">

        <div class="ns-logo">

          <h2>NAMITA STORE</h2>

          <small>Accounting & Inventory</small>

        </div>



        <div class="ns-nav">

          <button data-page="dashboard">▣ Dashboard</button>

          <button data-page="seller">🧾 Seller Panel</button>

          <button data-page="sales">🛒 Sales / POS</button>

          <button data-page="purchase">📥 Purchase</button>

          <button data-page="products">📦 Products & Stock</button>

          <button data-page="customers">👤 Customers</button>

          <button data-page="suppliers">🏭 Suppliers</button>

          <button data-page="payments">💰 Due / Payments</button>

          <button data-page="history">📋 Transaction History</button>

          <button data-page="barcode">🏷️ Barcode Settings</button>

          <button data-page="reports">📊 Reports</button>

          <button data-page="ecommerce">🛍️ E-Commerce</button>

          <button data-page="settings">⚙️ Settings</button>

        </div>

      </aside>



      <main class="ns-main">

        <header class="ns-top">

          <div>

            <button class="ns-btn light ns-mobile-menu" id="mobileMenu">☰</button>

            <span style="margin-left:8px">

              <strong id="pageTitle">Dashboard</strong>

            </span>

          </div>

          <div>

            <span id="topDate"></span>

          </div>

        </header>



        <div class="ns-content" id="pageContent"></div>

      </main>

    </div>



    <div class="ns-modal" id="nsModal">

      <div class="ns-modal-box">

        <div class="ns-modal-head">

          <h2 id="modalTitle" style="margin:0"></h2>

          <button class="ns-close" onclick="closeModal()">×</button>

        </div>

        <div id="modalBody"></div>

      </div>

    </div>

  `;



  $("topDate").textContent = new Date().toLocaleDateString("en-IN");



  /* =========================================================

     NAVIGATION

     ========================================================= */



  document.querySelectorAll(".ns-nav button").forEach(btn => {

    btn.addEventListener("click", () => {

      showPage(btn.dataset.page);

      $("nsSidebar").classList.remove("open");

    });

  });



  $("mobileMenu").onclick = () =>

    $("nsSidebar").classList.toggle("open");



  window.showPage = function(page) {

    currentPage = page;



    document.querySelectorAll(".ns-nav button").forEach(b => {

      b.classList.toggle("active", b.dataset.page === page);

    });



    const names = {

      dashboard: "Dashboard",

      seller: "Seller Panel",

      sales: "Sales / POS",

      purchase: "Purchase",

      products: "Products & Stock",

      customers: "Customers",

      suppliers: "Suppliers",

      payments: "Due / Payments",

      history: "Transaction History",

      barcode: "Barcode Settings",

      reports: "Reports",

      ecommerce: "E-Commerce",

      settings: "Settings"

    };



    $("pageTitle").textContent = names[page] || "Dashboard";



    const fn = pageRenderers[page] || pageRenderers.dashboard;

    $("pageContent").innerHTML = fn();

    pageAfterRender[page]?.();

  };



  /* =========================================================

     DASHBOARD

     ========================================================= */



  function dashboardPage() {

    const stockValue = products.reduce(

      (a,p) => a + num(p.stock) * num(p.purchase),

      0

    );



    const salesTotal = sales.reduce((a,s) => a + num(s.total),0);

    const purchaseTotal = purchases.reduce((a,p) => a + num(p.total),0);



    const customerDue = customers.reduce((a,c) => a + num(c.due),0);

    const supplierDue = suppliers.reduce((a,s) => a + num(s.due),0);



    return `

      <div class="ns-grid">

        <div class="ns-stat">

          <small>Total Products</small>

          <strong>${products.length}</strong>

        </div>

        <div class="ns-stat">

          <small>Stock Value</small>

          <strong>${money(stockValue)}</strong>

        </div>

        <div class="ns-stat">

          <small>Total Sales</small>

          <strong>${money(salesTotal)}</strong>

        </div>

        <div class="ns-stat">

          <small>Total Purchase</small>

          <strong>${money(purchaseTotal)}</strong>

        </div>

        <div class="ns-stat">

          <small>Customer Due</small>

          <strong>${money(customerDue)}</strong>

        </div>

        <div class="ns-stat">

          <small>Supplier Due</small>

          <strong>${money(supplierDue)}</strong>

        </div>

        <div class="ns-stat">

          <small>Customers</small>

          <strong>${customers.length}</strong>

        </div>

        <div class="ns-stat">

          <small>Suppliers</small>

          <strong>${suppliers.length}</strong>

        </div>

      </div>



      <div class="ns-card">

        <h2>Quick Actions</h2>

        <div class="ns-shortcuts">

          <button class="ns-shortcut" onclick="showPage('sales')">🛒 New Sale</button>

          <button class="ns-shortcut" onclick="showPage('purchase')">📥 New Purchase</button>

          <button class="ns-shortcut" onclick="openProductModal()">＋ Add Product</button>

          <button class="ns-shortcut" onclick="openCustomerModal()">＋ Add Customer</button>

          <button class="ns-shortcut" onclick="openSupplierModal()">＋ Add Supplier</button>

          <button class="ns-shortcut" onclick="showPage('payments')">💰 Receive / Pay</button>

          <button class="ns-shortcut" onclick="showPage('barcode')">🏷️ Print Barcode</button>

          <button class="ns-shortcut" onclick="showPage('reports')">📊 View Reports</button>

        </div>

      </div>



      <div class="ns-card">

        <h2>Low Stock</h2>

        ${lowStockTable()}

      </div>

    `;

  }



  function lowStockTable() {

    const rows = products.filter(p => num(p.stock) <= num(p.minStock));



    if (!rows.length)

      return `<div class="ns-empty">No low-stock products.</div>`;



    return `

      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>

              <th>Product</th>

              <th>SKU</th>

              <th>Stock</th>

              <th>Minimum</th>

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            ${rows.map(p => `

              <tr>

                <td>${esc(p.name)}</td>

                <td>${esc(p.sku)}</td>

                <td>${num(p.stock)}</td>

                <td>${num(p.minStock)}</td>

                <td><span class="ns-badge red">Low Stock</span></td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;

  }



  /* =========================================================

     SELLER PANEL

     ========================================================= */



  function sellerPage() {

    const due = customers.reduce((a,c)=>a+num(c.due),0);



    return `

      <div class="ns-card">

        <h2>Seller Panel</h2>

        <p style="color:#64748b">

          Fast billing, customer due, payments and sales management.

        </p>



        <div class="ns-grid">

          <div class="ns-stat">

            <small>Customers</small>

            <strong>${customers.length}</strong>

          </div>

          <div class="ns-stat">

            <small>Customer Due</small>

            <strong>${money(due)}</strong>

          </div>

          <div class="ns-stat">

            <small>Today's Sales</small>

            <strong>${money(sales.filter(x=>x.date===today()).reduce((a,x)=>a+num(x.total),0))}</strong>

          </div>

          <div class="ns-stat">

            <small>Today's Profit</small>

            <strong>${money(todayProfit())}</strong>

          </div>

        </div>

      </div>



      <div class="ns-card">

        <h3>Quick Seller Actions</h3>

        <div class="ns-shortcuts">

          <button class="ns-shortcut" onclick="showPage('sales')">🛒 New Sale / POS</button>

          <button class="ns-shortcut" onclick="showPage('payments')">💰 Customer Payment</button>

          <button class="ns-shortcut" onclick="openCustomerModal()">👤 Add Customer</button>

          <button class="ns-shortcut" onclick="showPage('history')">📋 Transaction History</button>

        </div>

      </div>



      <div class="ns-card">

        <h3>Recent Sales</h3>

        ${salesTable(sales.slice().reverse().slice(0,10))}

      </div>

    `;

  }



  function todayProfit() {

    return sales

      .filter(s => s.date === today())

      .reduce((sum,s) => sum + num(s.profit),0);

  }



  /* =========================================================

     SALES / POS

     ========================================================= */



  function salesPage() {

    const subtotal = cart.reduce((a,x)=>a+x.qty*x.price,0);

    const discount = num($("saleDiscount")?.value);

    const total = Math.max(0,subtotal-discount);



    return `

      <div class="ns-sale-layout">



        <div>

          <div class="ns-card">

            <h2>New Sale / POS</h2>



            <div class="ns-form">

              <div class="ns-field ns-full">

                <label>Search Product / SKU / Barcode</label>

                <input id="posSearch"

                  placeholder="Scan barcode or type product name..."

                  oninput="renderProductPicker()">

              </div>



              <div class="ns-field">

                <label>Customer</label>

                <select id="saleCustomer">

                  <option value="">Walk-in Customer</option>

                  ${customers.map(c=>`

                    <option value="${esc(c.id)}">${esc(c.name)}${num(c.due)>0?" — Due "+money(c.due):""}</option>

                  `).join("")}

                </select>

              </div>



              <div class="ns-field">

                <label>Payment Method</label>

                <select id="salePayment">

                  <option>Cash</option>

                  <option>UPI</option>

                  <option>Card</option>

                  <option>Bank Transfer</option>

                  <option>Credit</option>

                </select>

              </div>



              <div class="ns-field">

                <label>Discount</label>

                <input id="saleDiscount" type="number" min="0" value="0"

                  oninput="refreshSaleTotal()">

              </div>



              <div class="ns-field">

                <label>Notes</label>

                <input id="saleNotes" placeholder="Optional note">

              </div>

            </div>



            <div id="productPicker" class="ns-product-picker">

              ${productPickerHTML()}

            </div>

          </div>



          <div class="ns-card">

            <h3>Cart</h3>

            <div id="cartArea">${cartHTML()}</div>

          </div>

        </div>



        <div>

          <div class="ns-card">

            <h3>Sale Summary</h3>



            <div id="saleSummary">

              ${saleSummaryHTML(subtotal,discount,total)}

            </div>



            <div class="ns-actions">

              <button class="ns-btn green" onclick="completeSale()">Complete Sale</button>

              <button class="ns-btn light" onclick="clearCart()">Clear Cart</button>

            </div>

          </div>

        </div>



      </div>

    `;

  }



  function productPickerHTML() {

    const q = ($("posSearch")?.value || "").toLowerCase().trim();



    const list = products.filter(p =>

      !q ||

      String(p.name).toLowerCase().includes(q) ||

      String(p.sku).toLowerCase().includes(q) ||

      String(p.barcode).toLowerCase().includes(q)

    ).slice(0,30);



    if (!list.length)

      return `<div class="ns-empty">No products found.</div>`;



    return list.map(p=>`

      <button class="ns-product-mini"

        onclick="addToCart('${p.id}')">

        <strong>${esc(p.name)}</strong><br>

        <small>${esc(p.sku || "")}</small><br>

        <small>Stock: ${num(p.stock)}</small><br>

        <strong>${money(p.sale)}</strong>

      </button>

    `).join("");

  }



  function cartHTML() {

    if (!cart.length)

      return `<div class="ns-empty">Cart is empty.</div>`;



    return cart.map(item=>{

      const p = products.find(x=>String(x.id)===String(item.productId));

      if (!p) return "";



      return `

        <div class="ns-cart-row">

          <div>

            <strong>${esc(p.name)}</strong><br>

            <small>${money(item.price)}</small>

          </div>

          <input type="number" min="1" max="${num(p.stock)+num(item.qty)}"

            value="${item.qty}"

            onchange="changeCartQty('${p.id}',this.value)">

          <strong>${money(item.qty*item.price)}</strong>

          <button class="ns-btn red" style="padding:6px"

            onclick="removeFromCart('${p.id}')">×</button>

        </div>

      `;

    }).join("");

  }



  function saleSummaryHTML(subtotal,discount,total) {

    return `

      <div class="ns-total-box">

        <div class="ns-total-line">

          <span>Subtotal</span><strong>${money(subtotal)}</strong>

        </div>

        <div class="ns-total-line">

          <span>Discount</span><strong>${money(discount)}</strong>

        </div>

        <div class="ns-total-line big">

          <span>Total</span><strong>${money(total)}</strong>

        </div>

      </div>

    `;

  }



  window.renderProductPicker = function(){

    const el = $("productPicker");

    if(el) el.innerHTML = productPickerHTML();

  };



  window.addToCart = function(id) {

    const p = products.find(x=>String(x.id)===String(id));

    if(!p) return;



    const found = cart.find(x=>String(x.productId)===String(id));



    if(found){

      if(found.qty >= num(p.stock)){

        toast("Not enough stock.");

        return;

      }

      found.qty++;

    } else {

      if(num(p.stock)<=0){

        toast("Product is out of stock.");

        return;

      }

      cart.push({

        productId:p.id,

        qty:1,

        price:num(p.sale)

      });

    }



    renderSalesParts();

  };



  window.changeCartQty = function(id,value) {

    const item = cart.find(x=>String(x.productId)===String(id));

    const p = products.find(x=>String(x.id)===String(id));



    if(!item || !p) return;



    let q = Math.max(1,Math.floor(num(value)));

    q = Math.min(q,num(p.stock));



    item.qty=q;

    renderSalesParts();

  };



  window.removeFromCart = function(id) {

    cart=cart.filter(x=>String(x.productId)!==String(id));

    renderSalesParts();

  };



  window.clearCart = function(){

    cart=[];

    renderSalesParts();

  };



  window.refreshSaleTotal = function(){

    const sub=cart.reduce((a,x)=>a+x.qty*x.price,0);

    const discount=num($("saleDiscount")?.value);

    const total=Math.max(0,sub-discount);



    if($("saleSummary"))

      $("saleSummary").innerHTML=saleSummaryHTML(sub,discount,total);

  };



  function renderSalesParts(){

    if($("cartArea")) $("cartArea").innerHTML=cartHTML();

    if($("productPicker")) $("productPicker").innerHTML=productPickerHTML();

    refreshSaleTotal();

  }



  window.completeSale = function(){

    if(!cart.length){

      toast("Cart is empty.");

      return;

    }



    const customerId=$("saleCustomer")?.value || "";

    const payment=$("salePayment")?.value || "Cash";

    const discount=num($("saleDiscount")?.value);

    const notes=$("saleNotes")?.value || "";



    const subtotal=cart.reduce((a,x)=>a+x.qty*x.price,0);

    const total=Math.max(0,subtotal-discount);



    let paid=total;



    if(payment==="Credit") paid=0;



    const due=Math.max(0,total-paid);



    const customer=customers.find(c=>String(c.id)===String(customerId));



    const saleItems=cart.map(item=>{

      const p=products.find(x=>String(x.id)===String(item.productId));

      return {

        productId:p.id,

        product:p.name,

        sku:p.sku,

        qty:item.qty,

        price:item.price,

        purchase:num(p.purchase),

        total:item.qty*item.price,

        profit:item.qty*(item.price-num(p.purchase))

      };

    });



    saleItems.forEach(item=>{

      const p=products.find(x=>String(x.id)===String(item.productId));

      if(p){

        p.stock=Math.max(0,num(p.stock)-item.qty);



        stockHistory.push({

          id:uid("ST"),

          date:today(),

          type:"Sale",

          productId:p.id,

          product:p.name,

          qty:-item.qty,

          balance:p.stock,

          reference:"Sale"

        });

      }

    });



    const sale={

      id:uid("SAL"),

      date:today(),

      customerId:customer?.id || "",

      customer:customer?.name || "Walk-in Customer",

      payment,

      items:saleItems,

      subtotal,

      discount,

      total,

      paid,

      due,

      profit:saleItems.reduce((a,x)=>a+x.profit,0)-discount,

      notes

    };



    sales.push(sale);



    if(customer && due>0)

      customer.due=num(customer.due)+due;



    saveAll();



    cart=[];

    toast("Sale completed successfully.");



    showPage("sales");

  };



  function salesTable(list) {

    if(!list.length)

      return `<div class="ns-empty">No sales found.</div>`;



    return `

      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>

              <th>Date</th>

              <th>Invoice</th>

              <th>Customer</th>

              <th>Payment</th>

              <th>Total</th>

              <th>Due</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            ${list.map(s=>`

              <tr>

                <td>${esc(s.date)}</td>

                <td>${esc(s.id)}</td>

                <td>${esc(s.customer)}</td>

                <td>${esc(s.payment)}</td>

                <td>${money(s.total)}</td>

                <td>${money(s.due)}</td>

                <td>

                  <button class="ns-btn light" onclick="viewSale('${s.id}')">View</button>

                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;

  }



  window.viewSale=function(id){

    const s=sales.find(x=>String(x.id)===String(id));

    if(!s)return;



    openModal("Sale Details",`

      <p><strong>Invoice:</strong> ${esc(s.id)}</p>

      <p><strong>Date:</strong> ${esc(s.date)}</p>

      <p><strong>Customer:</strong> ${esc(s.customer)}</p>

      <p><strong>Payment:</strong> ${esc(s.payment)}</p>



      ${salesTable([s])}



      <h3>Items</h3>

      ${s.items.map(i=>`

        <div style="padding:7px;border-bottom:1px solid #eee">

          ${esc(i.product)} × ${i.qty} = ${money(i.total)}

        </div>

      `).join("")}

    `);

  };



  /* =========================================================

     PRODUCTS

     ========================================================= */



  function productsPage() {

    return `

      <div class="ns-card">

        <div class="ns-toolbar">

          <input id="productSearch" placeholder="Search product / SKU / barcode"

            oninput="renderProductsTable()">

          <select id="productCategoryFilter" onchange="renderProductsTable()">

            <option value="">All Categories</option>

            ${[...new Set(products.map(p=>p.category).filter(Boolean))].map(c=>

              `<option>${esc(c)}</option>`

            ).join("")}

          </select>

          <button class="ns-btn green" onclick="openProductModal()">＋ Add Product</button>

          <button class="ns-btn blue" onclick="showPage('barcode')">🏷️ Barcode</button>

        </div>



        <div id="productsTable">

          ${productsTableHTML()}

        </div>

      </div>

    `;

  }



  function productsTableHTML() {

    const q=($("productSearch")?.value||"").toLowerCase().trim();

    const cat=$("productCategoryFilter")?.value||"";



    const list=products.filter(p=>{

      const text=[p.name,p.sku,p.barcode,p.category].join(" ").toLowerCase();

      return (!q||text.includes(q)) && (!cat||p.category===cat);

    });



    if(!list.length)

      return `<div class="ns-empty">No products found.</div>`;



    return `

      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>

              <th>Product</th>

              <th>SKU</th>

              <th>Barcode</th>

              <th>Category</th>

              <th>Purchase</th>

              <th>Sale</th>

              <th>MRP</th>

              <th>Stock</th>

              <th>GST %</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            ${list.map(p=>`

              <tr>

                <td>${esc(p.name)}</td>

                <td>${esc(p.sku)}</td>

                <td>${esc(p.barcode)}</td>

                <td>${esc(p.category)}</td>

                <td>${money(p.purchase)}</td>

                <td>${money(p.sale)}</td>

                <td>${money(p.mrp)}</td>

                <td>

                  <span class="ns-badge ${num(p.stock)<=num(p.minStock)?"red":"green"}">

                    ${num(p.stock)}

                  </span>

                </td>

                <td>${num(p.gst)}</td>

                <td>

                  <button class="ns-btn light" onclick="openProductModal('${p.id}')">Edit</button>

                  <button class="ns-btn orange" onclick="adjustStock('${p.id}')">Stock</button>

                  <button class="ns-btn red" onclick="deleteProduct('${p.id}')">Delete</button>

                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;

  }



  window.renderProductsTable=function(){

    if($("productsTable"))

      $("productsTable").innerHTML=productsTableHTML();

  };



  window.openProductModal=function(id=""){

    editingProductId=id;



    const p=products.find(x=>String(x.id)===String(id)) || {};



    openModal(id?"Edit Product":"Add Product",`

      <div class="ns-form">

        <div class="ns-field">

          <label>Product Name *</label>

          <input id="pfName" value="${esc(p.name)}">

        </div>



        <div class="ns-field">

          <label>SKU</label>

          <input id="pfSku" value="${esc(p.sku)}">

        </div>



        <div class="ns-field">

          <label>Barcode</label>

          <input id="pfBarcode" value="${esc(p.barcode)}">

        </div>



        <div class="ns-field">

          <label>Category</label>

          <input id="pfCategory" value="${esc(p.category)}">

        </div>



        <div class="ns-field">

          <label>Purchase Price *</label>

          <input id="pfPurchase" type="number" value="${num(p.purchase)}">

        </div>



        <div class="ns-field">

          <label>Sale Price *</label>

          <input id="pfSale" type="number" value="${num(p.sale)}">

        </div>



        <div class="ns-field">

          <label>MRP</label>

          <input id="pfMrp" type="number" value="${num(p.mrp)}">

        </div>



        <div class="ns-field">

          <label>Opening Stock</label>

          <input id="pfStock" type="number" value="${num(p.stock)}">

        </div>



        <div class="ns-field">

          <label>Minimum Stock</label>

          <input id="pfMinStock" type="number" value="${num(p.minStock)}">

        </div>



        <div class="ns-field">

          <label>GST %</label>

          <input id="pfGst" type="number" value="${num(p.gst)}">

        </div>



        <div class="ns-field">

          <label>HSN</label>

          <input id="pfHsn" value="${esc(p.hsn)}">

        </div>



        <div class="ns-field">

          <label>Unit</label>

          <select id="pfUnit">

            ${["PCS","BOX","KG","GRAM","LITRE","METER"].map(u=>

              `<option ${p.unit===u?"selected":""}>${u}</option>`

            ).join("")}

          </select>

        </div>



        <div class="ns-field ns-full">

          <label>Description</label>

          <textarea id="pfDescription">${esc(p.description)}</textarea>

        </div>

      </div>



      <div class="ns-actions">

        <button class="ns-btn green" onclick="saveProduct()">Save Product</button>

        <button class="ns-btn light" onclick="closeModal()">Cancel</button>

      </div>

    `);

  };



  window.saveProduct=function(){

    const name=$("pfName")?.value.trim();



    if(!name){

      toast("Product name is required.");

      return;

    }



    const data={

      id:editingProductId || uid("PRD"),

      name,

      sku:$("pfSku")?.value.trim(),

      barcode:$("pfBarcode")?.value.trim(),

      category:$("pfCategory")?.value.trim(),

      purchase:num($("pfPurchase")?.value),

      sale:num($("pfSale")?.value),

      mrp:num($("pfMrp")?.value),

      stock:num($("pfStock")?.value),

      minStock:num($("pfMinStock")?.value),

      gst:num($("pfGst")?.value),

      hsn:$("pfHsn")?.value.trim(),

      unit:$("pfUnit")?.value,

      description:$("pfDescription")?.value.trim(),

      updatedAt:new Date().toISOString()

    };



    if(editingProductId){

      const i=products.findIndex(x=>String(x.id)===String(editingProductId));

      if(i>=0) products[i]=data;

    }else{

      products.push(data);

      stockHistory.push({

        id:uid("ST"),

        date:today(),

        type:"Opening Stock",

        productId:data.id,

        product:data.name,

        qty:data.stock,

        balance:data.stock,

        reference:"Product Created"

      });

    }



    saveAll();

    closeModal();

    toast("Product saved.");

    showPage("products");

  };



  window.deleteProduct=function(id){

    if(!confirm("Delete this product?"))return;



    products=products.filter(p=>String(p.id)!==String(id));

    saveAll();

    showPage("products");

    toast("Product deleted.");

  };



  window.adjustStock=function(id){

    const p=products.find(x=>String(x.id)===String(id));

    if(!p)return;



    openModal("Stock Adjustment",`

      <p><strong>${esc(p.name)}</strong></p>



      <div class="ns-form">

        <div class="ns-field">

          <label>Current Stock</label>

          <input id="adjCurrent" value="${num(p.stock)}" readonly>

        </div>



        <div class="ns-field">

          <label>Adjustment Quantity</label>

          <input id="adjQty" type="number" placeholder="+10 or -5">

        </div>



        <div class="ns-field">

          <label>Reason</label>

          <input id="adjReason" placeholder="Damaged / Found / Correction">

        </div>

      </div>



      <div class="ns-actions">

        <button class="ns-btn green"

          onclick="saveStockAdjustment('${p.id}')">

          Save Adjustment

        </button>

      </div>

    `);

  };



  window.saveStockAdjustment=function(id){

    const p=products.find(x=>String(x.id)===String(id));

    if(!p)return;



    const qty=Number($("adjQty")?.value);

    if(!Number.isFinite(qty)||qty===0){

      toast("Enter a valid quantity.");

      return;

    }



    p.stock=num(p.stock)+qty;



    stockHistory.push({

      id:uid("ST"),

      date:today(),

      type:"Adjustment",

      productId:p.id,

      product:p.name,

      qty,

      balance:p.stock,

      reference:$("adjReason")?.value || "Manual Adjustment"

    });



    saveAll();

    closeModal();

    showPage("products");

    toast("Stock updated.");

  };



  /* =========================================================

     CUSTOMERS

     ========================================================= */



  function customersPage(){

    return `

      <div class="ns-card">

        <div class="ns-toolbar">

          <input id="customerSearch" placeholder="Search customer..."

            oninput="renderCustomersTable()">

          <button class="ns-btn green" onclick="openCustomerModal()">＋ Add Customer</button>

        </div>

        <div id="customersTable">${customersTableHTML()}</div>

      </div>

    `;

  }



  function customersTableHTML(){

    const q=($("customerSearch")?.value||"").toLowerCase();



    const list=customers.filter(c=>

      [c.name,c.phone,c.address].join(" ").toLowerCase().includes(q)

    );



    if(!list.length)

      return `<div class="ns-empty">No customers found.</div>`;



    return `

      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>

              <th>Name</th>

              <th>Phone</th>

              <th>Address</th>

              <th>Due</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            ${list.map(c=>`

              <tr>

                <td>${esc(c.name)}</td>

                <td>${esc(c.phone)}</td>

                <td>${esc(c.address)}</td>

                <td>

                  <span class="ns-badge ${num(c.due)>0?"red":"green"}">

                    ${money(c.due)}

                  </span>

                </td>

                <td>

                  <button class="ns-btn light" onclick="openCustomerModal('${c.id}')">Edit</button>

                  <button class="ns-btn blue" onclick="customerHistory('${c.id}')">History</button>

                  <button class="ns-btn red" onclick="deleteCustomer('${c.id}')">Delete</button>

                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;

  }



  window.renderCustomersTable=function(){

    if($("customersTable"))

      $("customersTable").innerHTML=customersTableHTML();

  };



  window.openCustomerModal=function(id=""){

    editingCustomerId=id;



    const c=customers.find(x=>String(x.id)===String(id))||{};



    openModal(id?"Edit Customer":"Add Customer",`

      <div class="ns-form">

        <div class="ns-field">

          <label>Customer Name *</label>

          <input id="cfName" value="${esc(c.name)}">

        </div>



        <div class="ns-field">

          <label>Phone</label>

          <input id="cfPhone" value="${esc(c.phone)}">

        </div>



        <div class="ns-field">

          <label>Email</label>

          <input id="cfEmail" value="${esc(c.email)}">

        </div>



        <div class="ns-field">

          <label>Opening Due</label>

          <input id="cfDue" type="number" value="${num(c.due)}">

        </div>



        <div class="ns-field ns-full">

          <label>Address</label>

          <textarea id="cfAddress">${esc(c.address)}</textarea>

        </div>



        <div class="ns-field ns-full">

          <label>Notes</label>

          <textarea id="cfNotes">${esc(c.notes)}</textarea>

        </div>

      </div>



      <div class="ns-actions">

        <button class="ns-btn green" onclick="saveCustomer()">Save Customer</button>

      </div>

    `);

  };



  window.saveCustomer=function(){

    const name=$("cfName")?.value.trim();



    if(!name){

      toast("Customer name is required.");

      return;

    }



    const data={

      id:editingCustomerId||uid("CUS"),

      name,

      phone:$("cfPhone")?.value.trim(),

      email:$("cfEmail")?.value.trim(),

      address:$("cfAddress")?.value.trim(),

      due:num($("cfDue")?.value),

      notes:$("cfNotes")?.value.trim()

    };



    if(editingCustomerId){

      const i=customers.findIndex(x=>String(x.id)===String(editingCustomerId));

      if(i>=0)customers[i]=data;

    }else{

      customers.push(data);

    }



    saveAll();

    closeModal();

    showPage("customers");

    toast("Customer saved.");

  };



  window.deleteCustomer=function(id){

    if(!confirm("Delete this customer?"))return;

    customers=customers.filter(x=>String(x.id)!==String(id));

    saveAll();

    showPage("customers");

  };



  window.customerHistory=function(id){

    const c=customers.find(x=>String(x.id)===String(id));

    if(!c)return;



    const rows=sales.filter(s=>String(s.customerId)===String(id));



    openModal("Customer History",`

      <h3>${esc(c.name)}</h3>

      <p>Current Due: <strong>${money(c.due)}</strong></p>

      ${salesTable(rows)}

    `);

  };



  /* =========================================================

     SUPPLIERS

     ========================================================= */



  function suppliersPage(){

    return `

      <div class="ns-card">

        <div class="ns-toolbar">

          <input id="supplierSearch" placeholder="Search supplier..."

            oninput="renderSuppliersTable()">

          <button class="ns-btn green" onclick="openSupplierModal()">＋ Add Supplier</button>

        </div>

        <div id="suppliersTable">${suppliersTableHTML()}</div>

      </div>

    `;

  }



  function suppliersTableHTML(){

    const q=($("supplierSearch")?.value||"").toLowerCase();



    const list=suppliers.filter(s=>

      [s.name,s.phone,s.address].join(" ").toLowerCase().includes(q)

    );



    if(!list.length)

      return `<div class="ns-empty">No suppliers found.</div>`;



    return `

      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>

              <th>Supplier</th>

              <th>Phone</th>

              <th>Address</th>

              <th>Due</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            ${list.map(s=>`

              <tr>

                <td>${esc(s.name)}</td>

                <td>${esc(s.phone)}</td>

                <td>${esc(s.address)}</td>

                <td>

                  <span class="ns-badge ${num(s.due)>0?"red":"green"}">

                    ${money(s.due)}

                  </span>

                </td>

                <td>

                  <button class="ns-btn light" onclick="openSupplierModal('${s.id}')">Edit</button>

                  <button class="ns-btn blue" onclick="supplierHistory('${s.id}')">History</button>

                  <button class="ns-btn red" onclick="deleteSupplier('${s.id}')">Delete</button>

                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;

  }



  window.renderSuppliersTable=function(){

    if($("suppliersTable"))

      $("suppliersTable").innerHTML=suppliersTableHTML();

  };



  window.openSupplierModal=function(id=""){

    editingSupplierId=id;



    const s=suppliers.find(x=>String(x.id)===String(id))||{};



    openModal(id?"Edit Supplier":"Add Supplier",`

      <div class="ns-form">

        <div class="ns-field">

          <label>Supplier Name *</label>

          <input id="sfName" value="${esc(s.name)}">

        </div>



        <div class="ns-field">

          <label>Phone</label>

          <input id="sfPhone" value="${esc(s.phone)}">

        </div>



        <div class="ns-field">

          <label>Email</label>

          <input id="sfEmail" value="${esc(s.email)}">

        </div>



        <div class="ns-field">

          <label>Opening Due</label>

          <input id="sfDue" type="number" value="${num(s.due)}">

        </div>



        <div class="ns-field ns-full">

          <label>Address</label>

          <textarea id="sfAddress">${esc(s.address)}</textarea>

        </div>



        <div class="ns-field ns-full">

          <label>Notes</label>

          <textarea id="sfNotes">${esc(s.notes)}</textarea>

        </div>

      </div>



      <div class="ns-actions">

        <button class="ns-btn green" onclick="saveSupplier()">Save Supplier</button>

      </div>

    `);

  };



  window.saveSupplier=function(){

    const name=$("sfName")?.value.trim();



    if(!name){

      toast("Supplier name is required.");

      return;

    }



    const data={

      id:editingSupplierId||uid("SUP"),

      name,

      phone:$("sfPhone")?.value.trim(),

      email:$("sfEmail")?.value.trim(),

      address:$("sfAddress")?.value.trim(),

      due:num($("sfDue")?.value),

      notes:$("sfNotes")?.value.trim()

    };



    if(editingSupplierId){

      const i=suppliers.findIndex(x=>String(x.id)===String(editingSupplierId));

      if(i>=0)suppliers[i]=data;

    }else{

      suppliers.push(data);

    }



    saveAll();

    closeModal();

    showPage("suppliers");

    toast("Supplier saved.");

  };



  window.deleteSupplier=function(id){

    if(!confirm("Delete this supplier?"))return;



    suppliers=suppliers.filter(x=>String(x.id)!==String(id));

    saveAll();

    showPage("suppliers");

  };



  window.supplierHistory=function(id){

    const s=suppliers.find(x=>String(x.id)===String(id));

    if(!s)return;



    const rows=purchases.filter(p=>String(p.supplierId)===String(id));



    openModal("Supplier History",`

      <h3>${esc(s.name)}</h3>

      <p>Current Due: <strong>${money(s.due)}</strong></p>

      ${purchaseTable(rows)}

    `);

  };



  /* =========================================================

     PURCHASE

     ========================================================= */



  function purchasePage(){

    return `

      <div class="ns-card">

        <h2>Purchase Entry</h2>



        <div class="ns-form">

          <div class="ns-field">

            <label>Supplier</label>

            <select id="purchaseSupplier" onchange="showSupplierDue()">

              <option value="">Select Supplier</option>

              ${suppliers.map(s=>`

                <option value="${esc(s.id)}">${esc(s.name)}</option>

              `).join("")}

            </select>

          </div>



          <div class="ns-field">

            <label>Date</label>

            <input id="purchaseDate" type="date" value="${today()}">

          </div>



          <div class="ns-field">

            <label>Payment Method</label>

            <select id="purchasePayment">

              <option>Cash</option>

              <option>UPI</option>

              <option>Card</option>

              <option>Bank Transfer</option>

              <option>Credit</option>

            </select>

          </div>



          <div class="ns-field">

            <label>Paid Amount</label>

            <input id="purchasePaid" type="number" min="0" value="0">

          </div>



          <div class="ns-field ns-full">

            <div id="supplierDueBox"

              style="padding:10px;background:#f8fafc;border-radius:8px">

              Select supplier to view previous due.

            </div>

          </div>

        </div>

      </div>



      <div class="ns-card">

        <h3>Purchase Items</h3>



        <div class="ns-form">

          <div class="ns-field ns-full">

            <label>Product</label>

            <select id="purchaseProduct">

              <option value="">Select Product</option>

              ${products.map(p=>`

                <option value="${esc(p.id)}">

                  ${esc(p.name)} — ${esc(p.sku||"")} — Stock ${num(p.stock)}

                </option>

              `).join("")}

            </select>

          </div>



          <div class="ns-field">

            <label>Quantity</label>

            <input id="purchaseQty" type="number" min="1" value="1">

          </div>



          <div class="ns-field">

            <label>Purchase Price</label>

            <input id="purchasePrice" type="number" min="0" value="0">

          </div>



          <div class="ns-field">

            <label>Sale Price</label>

            <input id="purchaseSalePrice" type="number" min="0" value="0">

          </div>



          <div class="ns-field">

            <label>Barcode Quantity</label>

            <input id="purchaseBarcodeQty" type="number" min="0" value="0">

          </div>

        </div>



        <div class="ns-actions">

          <button class="ns-btn green" onclick="addPurchaseItem()">＋ Add Item</button>

          <button class="ns-btn light" onclick="clearPurchaseDraft()">Clear</button>

        </div>



        <div id="purchaseDraftArea"></div>

      </div>

    `;

  }



  let purchaseDraft=[];



  window.showSupplierDue=function(){

    const s=suppliers.find(x=>String(x.id)===String($("purchaseSupplier")?.value));



    if($("supplierDueBox")){

      $("supplierDueBox").innerHTML=s

        ? `Supplier: <strong>${esc(s.name)}</strong> &nbsp; | &nbsp; Previous Due: <strong>${money(s.due)}</strong>`

        : "Select supplier to view previous due.";

    }

  };



  window.addPurchaseItem=function(){

    const pid=$("purchaseProduct")?.value;

    const p=products.find(x=>String(x.id)===String(pid));



    if(!p){

      toast("Select a product.");

      return;

    }



    const qty=Math.max(1,num($("purchaseQty")?.value));

    const price=num($("purchasePrice")?.value) || num(p.purchase);

    const sale=num($("purchaseSalePrice")?.value) || num(p.sale);

    const barcodeQty=Math.max(0,num($("purchaseBarcodeQty")?.value));



    purchaseDraft.push({

      productId:p.id,

      product:p.name,

      sku:p.sku,

      qty,

      price,

      sale,

      barcodeQty,

      total:qty*price

    });



    renderPurchaseDraft();

  };



  function renderPurchaseDraft(){

    const el=$("purchaseDraftArea");

    if(!el)return;



    if(!purchaseDraft.length){

      el.innerHTML=`<div class="ns-empty">No purchase items added.</div>`;

      return;

    }



    const total=purchaseDraft.reduce((a,x)=>a+x.total,0);



    el.innerHTML=`

      <div class="ns-table-wrap" style="margin-top:15px">

        <table>

          <thead>

            <tr>

              <th>Product</th>

              <th>Qty</th>

              <th>Purchase Price</th>

              <th>Sale Price</th>

              <th>Barcode Qty</th>

              <th>Total</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            ${purchaseDraft.map((x,i)=>`

              <tr>

                <td>${esc(x.product)}</td>

                <td>${x.qty}</td>

                <td>${money(x.price)}</td>

                <td>${money(x.sale)}</td>

                <td>${x.barcodeQty}</td>

                <td>${money(x.total)}</td>

                <td>

                  <button class="ns-btn red" onclick="removePurchaseItem(${i})">×</button>

                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>



      <div class="ns-total-box">

        <div class="ns-total-line big">

          <span>Purchase Total</span>

          <strong>${money(total)}</strong>

        </div>

      </div>



      <div class="ns-actions">

        <button class="ns-btn green" onclick="savePurchase()">Save Purchase</button>

        <button class="ns-btn blue" onclick="savePurchaseAndBarcode()">Save & Print Barcode</button>

      </div>

    `;

  }



  window.removePurchaseItem=function(i){

    purchaseDraft.splice(i,1);

    renderPurchaseDraft();

  };



  window.clearPurchaseDraft=function(){

    purchaseDraft=[];

    renderPurchaseDraft();

  };



  window.savePurchase=function(printAfter=false){

    const supplierId=$("purchaseSupplier")?.value;

    const supplier=suppliers.find(x=>String(x.id)===String(supplierId));



    if(!supplier){

      toast("Select supplier.");

      return;

    }



    if(!purchaseDraft.length){

      toast("Add at least one purchase item.");

      return;

    }



    const date=$("purchaseDate")?.value || today();

    const payment=$("purchasePayment")?.value || "Cash";

    const paid=num($("purchasePaid")?.value);

    const total=purchaseDraft.reduce((a,x)=>a+x.total,0);

    const due=Math.max(0,total-paid);



    const items=purchaseDraft.map(x=>({...x}));



    items.forEach(item=>{

      let p=products.find(x=>String(x.id)===String(item.productId));



      if(p){

        p.stock=num(p.stock)+item.qty;

        p.purchase=item.price;

        if(item.sale>0)p.sale=item.sale;



        stockHistory.push({

          id:uid("ST"),

          date,

          type:"Purchase",

          productId:p.id,

          product:p.name,

          qty:item.qty,

          balance:p.stock,

          reference:"Purchase"

        });

      }

    });



    const purchase={

      id:uid("PUR"),

      date,

      supplierId:supplier.id,

      supplier:supplier.name,

      payment,

      items,

      total,

      paid,

      due

    };



    purchases.push(purchase);



    supplier.due=Math.max(0,num(supplier.due)+due);



    saveAll();



    const printItems=purchaseDraft.map(x=>({...x}));

    purchaseDraft=[];



    toast("Purchase saved successfully.");



    if(printAfter){

      showPage("barcode");

      setTimeout(()=>{

        if(printItems.length){

          openBarcodePrintFromItems(printItems);

        }

      },100);

    }else{

      showPage("purchase");

    }

  };



  window.savePurchaseAndBarcode=function(){

    savePurchase(true);

  };



  function purchaseTable(list){

    if(!list.length)

      return `<div class="ns-empty">No purchase records found.</div>`;



    return `

      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>

              <th>Date</th>

              <th>Purchase</th>

              <th>Supplier</th>

              <th>Total</th>

              <th>Paid</th>

              <th>Due</th>

            </tr>

          </thead>

          <tbody>

            ${list.map(p=>`

              <tr>

                <td>${esc(p.date)}</td>

                <td>${esc(p.id)}</td>

                <td>${esc(p.supplier)}</td>

                <td>${money(p.total)}</td>

                <td>${money(p.paid)}</td>

                <td>${money(p.due)}</td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;

  }



  /* =========================================================

     PAYMENTS

     ========================================================= */



  function paymentsPage(){

    const customerDue=customers.reduce((a,c)=>a+num(c.due),0);

    const supplierDue=suppliers.reduce((a,c)=>a+num(c.due),0);



    return `

      <div class="ns-grid">

        <div class="ns-stat">

          <small>Total Customer Due</small>

          <strong>${money(customerDue)}</strong>

        </div>

        <div class="ns-stat">

          <small>Total Supplier Due</small>

          <strong>${money(supplierDue)}</strong>

        </div>

        <div class="ns-stat">

          <small>Customer Payments</small>

          <strong>${money(payments.filter(x=>x.type==="customer").reduce((a,x)=>a+num(x.amount),0))}</strong>

        </div>

        <div class="ns-stat">

          <small>Supplier Payments</small>

          <strong>${money(payments.filter(x=>x.type==="supplier").reduce((a,x)=>a+num(x.amount),0))}</strong>

        </div>

      </div>



      <div class="ns-card">

        <h2>Receive / Pay</h2>



        <div class="ns-actions">

          <button class="ns-btn green" onclick="openCustomerPayment()">Receive Customer Payment</button>

          <button class="ns-btn orange" onclick="openSupplierPayment()">Pay Supplier</button>

        </div>

      </div>



      <div class="ns-card">

        <h3>Payment History</h3>

        ${paymentTable()}

      </div>

    `;

  }



  function paymentTable(){

    if(!payments.length)

      return `<div class="ns-empty">No payments recorded.</div>`;



    return `

      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>

              <th>Date</th>

              <th>Type</th>

              <th>Party</th>

              <th>Method</th>

              <th>Amount</th>

              <th>Note</th>

            </tr>

          </thead>

          <tbody>

            ${payments.slice().reverse().map(p=>`

              <tr>

                <td>${esc(p.date)}</td>

                <td>${p.type==="customer"?"Customer Receive":"Supplier Payment"}</td>

                <td>${esc(p.party)}</td>

                <td>${esc(p.method)}</td>

                <td>${money(p.amount)}</td>

                <td>${esc(p.note)}</td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;

  }



  window.openCustomerPayment=function(){

    openModal("Receive Customer Payment",`

      <div class="ns-form">

        <div class="ns-field ns-full">

          <label>Customer</label>

          <select id="payCustomer" onchange="updateCustomerPaymentDue()">

            <option value="">Select Customer</option>

            ${customers.map(c=>`

              <option value="${c.id}">

                ${esc(c.name)} — Due ${money(c.due)}

              </option>

            `).join("")}

          </select>

        </div>



        <div class="ns-field ns-full">

          <div id="customerPayDue"

            style="padding:10px;background:#f8fafc">

            Select customer.

          </div>

        </div>



        <div class="ns-field">

          <label>Amount</label>

          <input id="payAmount" type="number" min="0">

        </div>



        <div class="ns-field">

          <label>Payment Method</label>

          <select id="payMethod">

            <option>Cash</option>

            <option>UPI</option>

            <option>Card</option>

            <option>Bank Transfer</option>

          </select>

        </div>



        <div class="ns-field ns-full">

          <label>Note</label>

          <textarea id="payNote"></textarea>

        </div>

      </div>



      <div class="ns-actions">

        <button class="ns-btn green" onclick="saveCustomerPayment()">Save Payment</button>

      </div>

    `);

  };



  window.updateCustomerPaymentDue=function(){

    const c=customers.find(x=>String(x.id)===String($("payCustomer")?.value));



    if($("customerPayDue"))

      $("customerPayDue").innerHTML=c

        ? `Current Due: <strong>${money(c.due)}</strong>`

        : "Select customer.";

  };



  window.saveCustomerPayment=function(){

    const c=customers.find(x=>String(x.id)===String($("payCustomer")?.value));



    if(!c){

      toast("Select customer.");

      return;

    }



    const amount=num($("payAmount")?.value);



    if(amount<=0){

      toast("Enter payment amount.");

      return;

    }



    c.due=Math.max(0,num(c.due)-amount);



    payments.push({

      id:uid("PAY"),

      date:today(),

      type:"customer",

      party:c.name,

      partyId:c.id,

      amount,

      method:$("payMethod")?.value,

      note:$("payNote")?.value

    });



    saveAll();

    closeModal();

    showPage("payments");

    toast("Customer payment saved.");

  };



  window.openSupplierPayment=function(){

    openModal("Pay Supplier",`

      <div class="ns-form">

        <div class="ns-field ns-full">

          <label>Supplier</label>

          <select id="supPaySupplier" onchange="updateSupplierPaymentDue()">

            <option value="">Select Supplier</option>

            ${suppliers.map(s=>`

              <option value="${s.id}">

                ${esc(s.name)} — Due ${money(s.due)}

              </option>

            `).join("")}

          </select>

        </div>



        <div class="ns-field ns-full">

          <div id="supplierPayDue"

            style="padding:10px;background:#f8fafc">

            Select supplier.

          </div>

        </div>



        <div class="ns-field">

          <label>Amount</label>

          <input id="supPayAmount" type="number" min="0">

        </div>



        <div class="ns-field">

          <label>Payment Method</label>

          <select id="supPayMethod">

            <option>Cash</option>

            <option>UPI</option>

            <option>Card</option>

            <option>Bank Transfer</option>

          </select>

        </div>



        <div class="ns-field ns-full">

          <label>Note</label>

          <textarea id="supPayNote"></textarea>

        </div>

      </div>



      <div class="ns-actions">

        <button class="ns-btn orange" onclick="saveSupplierPayment()">Save Payment</button>

      </div>

    `);

  };



  window.updateSupplierPaymentDue=function(){

    const s=suppliers.find(x=>String(x.id)===String($("supPaySupplier")?.value));



    if($("supplierPayDue"))

      $("supplierPayDue").innerHTML=s

        ? `Current Due: <strong>${money(s.due)}</strong>`

        : "Select supplier.";

  };



  window.saveSupplierPayment=function(){

    const s=suppliers.find(x=>String(x.id)===String($("supPaySupplier")?.value));



    if(!s){

      toast("Select supplier.");

      return;

    }



    const amount=num($("supPayAmount")?.value);



    if(amount<=0){

      toast("Enter payment amount.");

      return;

    }



    s.due=Math.max(0,num(s.due)-amount);



    payments.push({

      id:uid("PAY"),

      date:today(),

      type:"supplier",

      party:s.name,

      partyId:s.id,

      amount,

      method:$("supPayMethod")?.value,

      note:$("supPayNote")?.value

    });



    saveAll();

    closeModal();

    showPage("payments");

    toast("Supplier payment saved.");

  };



  /* =========================================================

     TRANSACTION HISTORY

     ========================================================= */



  function historyPage(){

    return `

      <div class="ns-card">

        <div class="ns-toolbar">

          <select id="historyType" onchange="renderHistory()">

            <option value="">All Transactions</option>

            <option value="sale">Sales</option>

            <option value="purchase">Purchases</option>

            <option value="payment">Payments</option>

            <option value="stock">Stock Adjustments</option>

          </select>



          <input id="historyFrom" type="date" onchange="renderHistory()">

          <input id="historyTo" type="date" onchange="renderHistory()">

        </div>



        <div id="historyArea">${historyHTML()}</div>

      </div>

    `;

  }



  function historyHTML(){

    const type=$("historyType")?.value||"";

    const from=$("historyFrom")?.value||"";

    const to=$("historyTo")?.value||"";



    let rows=[];



    if(!type||type==="sale"){

      sales.forEach(s=>rows.push({

        date:s.date,

        type:"Sale",

        ref:s.id,

        party:s.customer,

        amount:s.total,

        note:s.payment

      }));

    }



    if(!type||type==="purchase"){

      purchases.forEach(p=>rows.push({

        date:p.date,

        type:"Purchase",

        ref:p.id,

        party:p.supplier,

        amount:p.total,

        note:p.payment

      }));

    }



    if(!type||type==="payment"){

      payments.forEach(p=>rows.push({

        date:p.date,

        type:p.type==="customer"?"Customer Payment":"Supplier Payment",

        ref:p.id,

        party:p.party,

        amount:p.amount,

        note:p.method

      }));

    }



    if(!type||type==="stock"){

      stockHistory.forEach(x=>rows.push({

        date:x.date,

        type:x.type,

        ref:x.id,

        party:x.product,

        amount:x.qty,

        note:x.reference

      }));

    }



    rows=rows.filter(x=>

      (!from||x.date>=from)&&(!to||x.date<=to)

    ).sort((a,b)=>String(b.date).localeCompare(String(a.date)));



    if(!rows.length)

      return `<div class="ns-empty">No transactions found.</div>`;



    return `

      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>

              <th>Date</th>

              <th>Type</th>

              <th>Reference</th>

              <th>Party / Product</th>

              <th>Amount / Qty</th>

              <th>Details</th>

            </tr>

          </thead>

          <tbody>

            ${rows.map(r=>`

              <tr>

                <td>${esc(r.date)}</td>

                <td>${esc(r.type)}</td>

                <td>${esc(r.ref)}</td>

                <td>${esc(r.party)}</td>

                <td>${r.type==="Stock"||r.type==="Adjustment"||r.type==="Opening Stock"

                    ? num(r.amount)

                    : money(r.amount)}</td>

                <td>${esc(r.note)}</td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;

  }



  window.renderHistory=function(){

    if($("historyArea"))

      $("historyArea").innerHTML=historyHTML();

  };



  /* =========================================================

     BARCODE SETTINGS

     ========================================================= */



  function barcodePage(){

    return `

      <div class="ns-card">

        <h2>Barcode Settings</h2>



        <div class="ns-form">

          <div class="ns-field">

            <label>Template</label>

            <select id="barcodeTemplate" onchange="saveBarcodeSettingPreview()">

              <option value="25x50-2" ${barcodeSettings.template==="25x50-2"?"selected":""}>

                25×50 – 2 line

              </option>

              <option value="25x50-1" ${barcodeSettings.template==="25x50-1"?"selected":""}>

                25×50 – 1 line

              </option>

              <option value="15x25-4" ${barcodeSettings.template==="15x25-4"?"selected":""}>

                15×25 – 4 line

              </option>

            </select>

          </div>



          <div class="ns-field">

            <label>Product</label>

            <select id="barcodeProduct" onchange="renderBarcodePreview()">

              <option value="">Select Product</option>

              ${products.map(p=>`

                <option value="${p.id}">

                  ${esc(p.name)} — ${esc(p.barcode||p.sku||"")}

                </option>

              `).join("")}

            </select>

          </div>



          <div class="ns-field">

            <label>Quantity</label>

            <input id="barcodeQty" type="number" min="1" value="1"

              onchange="renderBarcodePreview()">

          </div>



          <div class="ns-field">

            <label>Barcode Type</label>

            <select disabled>

              <option>CODE128</option>

            </select>

          </div>

        </div>



        <div class="ns-actions">

          <label>

            <input type="checkbox" id="bcStore"

              ${barcodeSettings.showStore?"checked":""}

              onchange="renderBarcodePreview()">

            Store Name

          </label>



          <label>

            <input type="checkbox" id="bcProduct"

              ${barcodeSettings.showProduct?"checked":""}

              onchange="renderBarcodePreview()">

            Product Name

          </label>



          <label>

            <input type="checkbox" id="bcSku"

              ${barcodeSettings.showSku?"checked":""}

              onchange="renderBarcodePreview()">

            SKU

          </label>



          <label>

            <input type="checkbox" id="bcPrice"

              ${barcodeSettings.showPrice?"checked":""}

              onchange="renderBarcodePreview()">

            Price

          </label>



          <label>

            <input type="checkbox" id="bcBarcode"

              ${barcodeSettings.showBarcode?"checked":""}

              onchange="renderBarcodePreview()">

            Barcode Number

          </label>

        </div>

      </div>



      <div class="ns-card">

        <h3>Barcode Preview</h3>



        <div class="ns-barcode-stage">

          <div id="barcodePreview">

            Select a product.

          </div>

        </div>



        <div class="ns-actions">

          <button class="ns-btn green" onclick="printBarcode()">Print Barcode</button>

          <button class="ns-btn blue" onclick="printBarcodeSheet()">Print Sheet</button>

        </div>

      </div>

    `;

  }



  window.saveBarcodeSettingPreview=function(){

    barcodeSettings.template=$("barcodeTemplate")?.value||"25x50-2";

    save(KEY.barcode,barcodeSettings);

    renderBarcodePreview();

  };



  function getBarcodeProduct(){

    const id=$("barcodeProduct")?.value;



    return products.find(p=>String(p.id)===String(id)) || products[0];

  }



  function barcodeSVG(value){

    value=String(value||"000000000001");



    const patterns=[

      "11010010000","11010001000","11010000100","10110010000",

      "10110001000","10110000100","10011010000","10011001000",

      "10011000100","11001010000","11001001000","11001000100",

      "10110010000","10110001000","10110000100","10010011000",

      "10010001100","10001011000","10001001100","11001010000",

      "11001001000","11001000100","10111010000","10111001000",

      "10111000100","10011101000","10011100100","10001110100",

      "10001101100","11001110000","11000111000","11000011100"

    ];



    let bars="";

    let x=2;



    const chars=[104];



    for(let i=0;i<value.length;i++)

      chars.push(value.charCodeAt(i)%32);



    let checksum=104;



    for(let i=1;i<chars.length;i++)

      checksum+=chars[i]*(i);



    chars.push(checksum%103);

    chars.push(106);



    chars.forEach((c)=>{

      const pat=patterns[c%patterns.length];



      for(let i=0;i<pat.length;i++){

        const w=pat[i]==="1"?2:1;



        if(pat[i]==="1")

          bars+=`<rect x="${x}" y="2" width="${w}" height="46"/>`;



        x+=w;

      }



      x+=1;

    });



    return `

      <svg xmlns="http://www.w3.org/2000/svg"

        viewBox="0 0 ${x+2} 50"

        style="width:100%;height:45px">

        <rect width="100%" height="100%" fill="#fff"/>

        ${bars}

      </svg>

    `;

  }



  function barcodeSticker(p,template){

    const cls=

      template==="15x25-4"

      ?"s15x25"

      :template==="25x50-1"

      ?"s25x50 one"

      :"s25x50";



    return `

      <div class="ns-sticker ${cls}">

        ${barcodeSettings.showStore

          ?`<strong>${esc(settings.store||"NAMITA STORE")}</strong>`:""}



        ${barcodeSettings.showProduct

          ?`<div>${esc(p.name)}</div>`:""}



        ${barcodeSettings.showSku && p.sku

          ?`<small>${esc(p.sku)}</small>`:""}



        ${barcodeSettings.showBarcode

          ?barcodeSVG(p.barcode||p.sku||p.id):""}



        ${barcodeSettings.showBarcode

          ?`<small>${esc(p.barcode||"")}</small>`:""}



        ${barcodeSettings.showPrice

          ?`<strong>₹${num(p.sale).toFixed(2)}</strong>`:""}

      </div>

    `;

  }



  window.renderBarcodePreview=function(){

    const p=getBarcodeProduct();

    const el=$("barcodePreview");



    if(!el)return;



    if(!p){

      el.innerHTML="Select a product.";

      return;

    }



    barcodeSettings.template=$("barcodeTemplate")?.value||barcodeSettings.template;



    barcodeSettings.showStore=$("bcStore")?.checked ?? barcodeSettings.showStore;

    barcodeSettings.showProduct=$("bcProduct")?.checked ?? barcodeSettings.showProduct;

    barcodeSettings.showSku=$("bcSku")?.checked ?? barcodeSettings.showSku;

    barcodeSettings.showPrice=$("bcPrice")?.checked ?? barcodeSettings.showPrice;

    barcodeSettings.showBarcode=$("bcBarcode")?.checked ?? barcodeSettings.showBarcode;



    save(KEY.barcode,barcodeSettings);



    el.innerHTML=barcodeSticker(p,barcodeSettings.template);

  };



  window.printBarcode=function(){

    const p=getBarcodeProduct();

    if(!p){

      toast("Select product.");

      return;

    }



    const qty=Math.max(1,num($("barcodeQty")?.value));



    printHTML(

      Array.from({length:qty},()=>barcodeSticker(p,barcodeSettings.template)).join("")

    );

  };



  window.printBarcodeSheet=function(){

    const p=getBarcodeProduct();

    if(!p){

      toast("Select product.");

      return;

    }



    const qty=Math.max(1,num($("barcodeQty")?.value));



    printHTML(`

      <div style="

        display:grid;

        grid-template-columns:repeat(3,max-content);

        gap:4mm;

        padding:5mm">

        ${Array.from({length:qty},()=>barcodeSticker(p,barcodeSettings.template)).join("")}

      </div>

    `);

  };



  function openBarcodePrintFromItems(items){

    if(!items.length)return;



    const html=items.map(item=>{

      const p=products.find(x=>String(x.id)===String(item.productId));

      if(!p)return "";



      const copy={...p,sale:item.sale||p.sale};

      return Array.from(

        {length:Math.max(1,num(item.barcodeQty)||num(item.qty))}

      ).map(()=>barcodeSticker(copy,barcodeSettings.template)).join("");

    }).join("");



    printHTML(html);

  }



  /* =========================================================

     REPORTS

     ========================================================= */



  function reportsPage(){

    const salesTotal=sales.reduce((a,s)=>a+num(s.total),0);

    const profit=sales.reduce((a,s)=>a+num(s.profit),0);

    const purchaseTotal=purchases.reduce((a,p)=>a+num(p.total),0);



    return `

      <div class="ns-grid">

        <div class="ns-stat">

          <small>Total Sales</small>

          <strong>${money(salesTotal)}</strong>

        </div>



        <div class="ns-stat">

          <small>Gross Profit</small>

          <strong>${money(profit)}</strong>

        </div>



        <div class="ns-stat">

          <small>Total Purchase</small>

          <strong>${money(purchaseTotal)}</strong>

        </div>



        <div class="ns-stat">

          <small>Pocket Margin</small>

          <strong>${money(profit)}</strong>

        </div>

      </div>



      <div class="ns-card">

        <h2>Sales Report</h2>

        ${salesTable(sales.slice().reverse())}



        <div class="ns-actions">

          <button class="ns-btn orange" onclick="printSalesReport()">Print Sales Report</button>

        </div>

      </div>



      <div class="ns-card">

        <h2>Purchase Report</h2>

        ${purchaseTable(purchases.slice().reverse())}

      </div>



      <div class="ns-card">

        <h2>Stock Report</h2>

        ${productsTableHTML()}

      </div>

    `;

  }



  window.printSalesReport=function(){

    printHTML(`

      <h1>${esc(settings.store||"NAMITA STORE")}</h1>

      <h2>Sales Report</h2>

      ${salesTable(sales)}

    `);

  };



  /* =========================================================

     E-COMMERCE

     ========================================================= */



  function ecommercePage(){

    return `

      <div class="ns-card">

        <h2>E-Commerce Orders</h2>



        <div class="ns-form">

          <div class="ns-field">

            <label>Order Number</label>

            <input id="ecOrder" placeholder="Online order ID">

          </div>



          <div class="ns-field">

            <label>Customer</label>

            <input id="ecCustomer">

          </div>



          <div class="ns-field">

            <label>Amount</label>

            <input id="ecAmount" type="number">

          </div>



          <div class="ns-field">

            <label>Payment</label>

            <select id="ecPayment">

              <option>Prepaid</option>

              <option>COD</option>

            </select>

          </div>

        </div>



        <div class="ns-actions">

          <button class="ns-btn green" onclick="saveEcommerceOrder()">Save Order</button>

        </div>

      </div>



      <div class="ns-card">

        <h3>Orders</h3>

        ${ecommerceTable()}

      </div>

    `;

  }



  function ecommerceTable(){

    if(!ecommerce.length)

      return `<div class="ns-empty">No e-commerce orders.</div>`;



    return `

      <div class="ns-table-wrap">

        <table>

          <thead>

            <tr>

              <th>Date</th>

              <th>Order</th>

              <th>Customer</th>

              <th>Amount</th>

              <th>Payment</th>

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            ${ecommerce.slice().reverse().map(o=>`

              <tr>

                <td>${esc(o.date)}</td>

                <td>${esc(o.order)}</td>

                <td>${esc(o.customer)}</td>

                <td>${money(o.amount)}</td>

                <td>${esc(o.payment)}</td>

                <td>

                  <span class="ns-badge ${o.status==="Completed"?"green":"orange"}">

                    ${esc(o.status)}

                  </span>

                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;

  }



  window.saveEcommerceOrder=function(){

    const order=$("ecOrder")?.value.trim();



    if(!order){

      toast("Order number is required.");

      return;

    }



    ecommerce.push({

      id:uid("EC"),

      date:today(),

      order,

      customer:$("ecCustomer")?.value.trim(),

      amount:num($("ecAmount")?.value),

      payment:$("ecPayment")?.value,

      status:"Pending"

    });



    saveAll();

    showPage("ecommerce");

    toast("E-commerce order saved.");

  };



  /* =========================================================

     SETTINGS

     ========================================================= */



  function settingsPage(){

    return `

      <div class="ns-card">

        <h2>Store Settings</h2>



        <div class="ns-form">

          <div class="ns-field">

            <label>Store Name</label>

            <input id="setStore" value="${esc(settings.store)}">

          </div>



          <div class="ns-field">

            <label>Phone</label>

            <input id="setPhone" value="${esc(settings.phone)}">

          </div>



          <div class="ns-field ns-full">

            <label>Address</label>

            <textarea id="setAddress">${esc(settings.address)}</textarea>

          </div>

        </div>



        <div class="ns-actions">

          <button class="ns-btn green" onclick="saveSettings()">Save Settings</button>

          <button class="ns-btn blue" onclick="backupData()">Backup Data</button>

          <button class="ns-btn orange" onclick="restoreData()">Restore Data</button>

          <button class="ns-btn red" onclick="clearAllData()">Clear All Data</button>

        </div>

      </div>



      <div class="ns-card">

        <h3>Database Information</h3>

        <p>Products: ${products.length}</p>

        <p>Customers: ${customers.length}</p>

        <p>Suppliers: ${suppliers.length}</p>

        <p>Sales: ${sales.length}</p>

        <p>Purchases: ${purchases.length}</p>

        <p>Payments: ${payments.length}</p>

      </div>

    `;

  }



  window.saveSettings=function(){

    settings.store=$("setStore")?.value.trim()||"NAMITA STORE";

    settings.phone=$("setPhone")?.value.trim()||"";

    settings.address=$("setAddress")?.value.trim()||"";



    save(KEY.settings,settings);



    toast("Settings saved.");

    showPage("settings");

  };



  window.backupData=function(){

    const data={

      products,

      customers,

      suppliers,

      purchases,

      sales,

      payments,

      stockHistory,

      ecommerce,

      settings,

      barcodeSettings

    };



    const blob=new Blob(

      [JSON.stringify(data,null,2)],

      {type:"application/json"}

    );



    const a=document.createElement("a");

    a.href=URL.createObjectURL(blob);

    a.download="namita-store-backup.json";

    a.click();

    URL.revokeObjectURL(a.href);

  };



  window.restoreData=function(){

    openModal("Restore Backup",`

      <p>Select your NAMITA STORE backup JSON file.</p>



      <input type="file" id="restoreFile" accept=".json">



      <div class="ns-actions">

        <button class="ns-btn green" onclick="restoreBackupFile()">

          Restore

        </button>

      </div>

    `);

  };



  window.restoreBackupFile=function(){

    const file=$("restoreFile")?.files?.[0];



    if(!file){

      toast("Select a backup file.");

      return;

    }



    const reader=new FileReader();



    reader.onload=function(){

      try{

        const d=JSON.parse(reader.result);



        products=d.products||[];

        customers=d.customers||[];

        suppliers=d.suppliers||[];

        purchases=d.purchases||[];

        sales=d.sales||[];

        payments=d.payments||[];

        stockHistory=d.stockHistory||[];

        ecommerce=d.ecommerce||[];

        settings=d.settings||settings;

        barcodeSettings=d.barcodeSettings||barcodeSettings;



        saveAll();



        closeModal();

        showPage("dashboard");

        toast("Backup restored.");

      }catch{

        toast("Invalid backup file.");

      }

    };



    reader.readAsText(file);

  };



  window.clearAllData=function(){

    if(!confirm("This will delete all stored data. Continue?"))

      return;



    Object.values(KEY).forEach(k=>localStorage.removeItem(k));



    products=[];

    customers=[];

    suppliers=[];

    purchases=[];

    sales=[];

    payments=[];

    stockHistory=[];

    ecommerce=[];



    settings={

      store:"NAMITA STORE",

      phone:"",

      address:"",

      currency:"₹"

    };



    barcodeSettings={

      template:"25x50-2",

      showStore:true,

      showProduct:true,

      showBarcode:true,

      showPrice:true,

      showSku:true

    };



    showPage("dashboard");

    toast("All data cleared.");

  };



  /* =========================================================

     MODAL / TOAST / PRINT

     ========================================================= */



  function openModal(title,html){

    $("modalTitle").textContent=title;

    $("modalBody").innerHTML=html;

    $("nsModal").classList.add("show");

  }



  window.closeModal=function(){

    $("nsModal").classList.remove("show");

  };



  function toast(message){

    const old=document.getElementById("nsToast");

    if(old)old.remove();



    const t=document.createElement("div");

    t.id="nsToast";

    t.className="toast";



    t.style.cssText=`

      position:fixed;

      right:18px;

      bottom:18px;

      background:#0f766e;

      color:#fff;

      padding:12px 18px;

      border-radius:10px;

      z-index:9999;

      box-shadow:0 8px 25px rgba(0,0,0,.2);

    `;



    t.textContent=message;

    document.body.appendChild(t);



    setTimeout(()=>t.remove(),2500);

  }



  window.toast=toast;



  function printHTML(content){

    const win=window.open("","_blank");



    if(!win){

      toast("Please allow pop-ups to print.");

      return;

    }



    win.document.write(`

      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <title>${esc(settings.store||"NAMITA STORE")}</title>

        <style>

          *{box-sizing:border-box}

          body{

            font-family:Arial,sans-serif;

            margin:0;

            padding:10mm;

            color:#111;

          }

          table{

            width:100%;

            border-collapse:collapse;

          }

          th,td{

            border:1px solid #999;

            padding:6px;

          }

          th{background:#eee}

          .ns-sticker{

            background:#fff;

            border:1px solid #111;

            display:flex;

            flex-direction:column;

            justify-content:center;

            align-items:center;

            text-align:center;

            padding:7px;

            color:#111;

            break-inside:avoid;

          }

          .s25x50{width:50mm;min-height:25mm}

          .s15x25{width:25mm;min-height:15mm;font-size:8px}

          svg{max-width:90%;height:auto}

        </style>

      </head>

      <body>

        ${content}

        <script>

          window.onload=function(){

            setTimeout(function(){window.print()},300);

          };

        <\/script>

      </body>

      </html>

    `);



    win.document.close();

  }



  /* =========================================================

     SAVE

     ========================================================= */



  function saveAll(){

    save(KEY.products,products);

    save(KEY.customers,customers);

    save(KEY.suppliers,suppliers);

    save(KEY.purchases,purchases);

    save(KEY.sales,sales);

    save(KEY.payments,payments);

    save(KEY.stockHistory,stockHistory);

    save(KEY.ecommerce,ecommerce);

    save(KEY.settings,settings);

    save(KEY.barcode,barcodeSettings);

  }



  /* =========================================================

     PAGE AFTER RENDER

     ========================================================= */



  const pageAfterRender={

    sales(){

      renderProductPicker();

    },



    purchase(){

      renderPurchaseDraft();

    },



    barcode(){

      renderBarcodePreview();

    }

  };



  const pageRenderers={

    dashboard:dashboardPage,

    seller:sellerPage,

    sales:salesPage,

    purchase:purchasePage,

    products:productsPage,

    customers:customersPage,

    suppliers:suppliersPage,

    payments:paymentsPage,

    history:historyPage,

    barcode:barcodePage,

    reports:reportsPage,

    ecommerce:ecommercePage,

    settings:settingsPage

  };



  /* =========================================================

     KEYBOARD BARCODE SCANNING

     ========================================================= */



  document.addEventListener("keydown",function(e){

    if(e.key!=="Enter")return;



    if(document.activeElement?.id==="posSearch"){

      const value=document.activeElement.value.trim();



      const p=products.find(x=>

        String(x.barcode)===value ||

        String(x.sku)===value

      );



      if(p){

        addToCart(p.id);

        document.activeElement.value="";

        renderProductPicker();

        e.preventDefault();

      }

    }

  });



  /* =========================================================

     PURCHASE BARCODE HELPER

     ========================================================= */



  window.openBarcodePrintFromItems=openBarcodePrintFromItems;



  /* =========================================================

     INITIAL DATA

     ========================================================= */



  if(!products.length){

    products=[

      {

        id:uid("PRD"),

        name:"Sample Product",

        sku:"NS-001",

        barcode:"890100000001",

        category:"General",

        purchase:100,

        sale:149,

        mrp:160,

        stock:20,

        minStock:5,

        gst:18,

        hsn:"",

        unit:"PCS",

        description:"",

        createdAt:new Date().toISOString()

      }

    ];



    save(KEY.products,products);

  }



  /* =========================================================

     START

     ========================================================= */



  showPage("dashboard");



})();
