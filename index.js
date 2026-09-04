(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const KEY = "namita_store_complete";
  const money = n => `₹${Number(n || 0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const uid = p => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const today = () => new Date().toISOString().slice(0,10);
  const esc = v => String(v ?? "").replace(/[&<>"']/g,x =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[x]));
  const n = v => Number(v || 0);
  const save = () => localStorage.setItem(KEY,JSON.stringify(db));

  let db = JSON.parse(localStorage.getItem(KEY) || "null") || {
    store:"NAMITA STORE", phone:"", address:"",
    products:[],customers:[],suppliers:[],sales:[],purchases:[],
    adjustments:[],orders:[],payments:[],supplierPayments:[],returns:[],
    settings:{barcodeSize:"25x38"}
  };

  const arrays = ["products","customers","suppliers","sales","purchases",
    "adjustments","orders","payments","supplierPayments","returns"];
  arrays.forEach(k => db[k] ||= []);
  db.settings ||= {barcodeSize:"25x38"};

  db.products.forEach(p => {
    p.id ||= uid("PRD"); p.stock ||= 0; p.minimum ||= 5;
    p.purchase ||= 0; p.sale ||= 0; p.mrp ||= p.sale;
    p.discount ||= 0; p.category ||= ""; p.barcode ||= `890${Date.now()}`;
    p.images ||= p.image ? [p.image] : [];
  });
  db.customers.forEach(x => {x.due ||= 0;x.opening ||= 0});
  db.suppliers.forEach(x => {x.due ||= 0;x.opening ||= 0});

  let page = "dashboard", cart = [], purchaseRows = [], invoice = null;

  const menu = {
    dashboard:"📊 Dashboard", sales:"🧾 POS / Sales",
    purchase:"📥 Purchase", products:"📦 Products & Stock",
    adjustment:"🔧 Adjustment", customers:"👥 Customers",
    suppliers:"🏭 Suppliers", payments:"💰 Payments",
    ecommerce:"🛒 E-commerce", returns:"🔁 Return / Exchange",
    reports:"📑 Reports", settings:"⚙️ Settings"
  };

  function layout() {
    $("#app").innerHTML = `
    <div class="flex min-h-screen">
      <aside id="sidebar" class="sidebar w-64 shrink-0 text-white p-4">
        <h1 class="text-xl font-bold text-center mb-1">${esc(db.store)}</h1>
        <p class="text-center text-sm border-b border-white/20 pb-4 mb-4">Accounting & Inventory</p>
        <nav class="space-y-1">
          ${Object.entries(menu).map(([k,v]) =>
            `<button data-page="${k}" class="nav-btn w-full text-left px-3 py-3 rounded-lg">${v}</button>`
          ).join("")}
        </nav>
      </aside>
      <main class="content flex-1 min-w-0">
        <header class="bg-white border-b px-4 py-4 flex gap-2 items-center sticky top-0 z-30">
          <button data-action="menu" class="bg-teal-700 text-white px-3 py-2 rounded">☰</button>
          <button data-action="back" class="border px-3 py-2 rounded">← Back</button>
          <h2 id="title" class="font-bold text-lg mr-auto"></h2>
          <span id="clock" class="text-sm text-slate-500"></span>
        </header>
        <section id="content" class="p-4 md:p-7"></section>
      </main>
    </div>
    <div id="modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 items-center justify-center p-4">
      <div class="bg-white rounded-2xl p-5 w-full max-w-4xl max-h-[94vh] overflow-auto">
        <div class="flex justify-between mb-4">
          <h2 id="modalTitle" class="text-xl font-bold"></h2>
          <button data-action="close" class="text-2xl">×</button>
        </div>
        <div id="modalBody"></div>
      </div>
    </div>`;
  }

  function card(x) { return `<div class="card p-5 mb-5">${x}</div>`; }
  function stat(t,v) { return `<div class="card p-5"><small class="text-slate-500">${t}</small><b class="text-2xl block mt-2">${v}</b></div>`; }
  function row(a) { return `<tr class="border-b hover:bg-slate-50">${a.map(x=>`<td class="p-3">${x}</td>`).join("")}</tr>`; }
  function table(h,r) {
    return r.length ? `<div class="overflow-x-auto"><table class="w-full text-sm">
      <thead><tr class="bg-slate-100">${h.map(x=>`<th class="p-3 text-left">${x}</th>`).join("")}</tr></thead>
      <tbody>${r.join("")}</tbody></table></div>` :
      `<p class="text-center text-slate-500 py-8">কোনো তথ্য নেই।</p>`;
  }
  function field(label,name,value="",type="text",extra="") {
    return `<label class="block mb-3">${label}
      <input name="${name}" type="${type}" value="${esc(value)}"
      class="w-full border rounded-lg p-3 mt-1" ${extra}></label>`;
  }
  function product(id) { return db.products.find(x=>x.id===id); }

  function dashboard() {
    const sales=db.sales.reduce((a,x)=>a+n(x.total),0);
    const purchase=db.purchases.reduce((a,x)=>a+n(x.total),0);
    const profit=db.sales.reduce((a,x)=>a+n(x.profit),0);
    return `<div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
      ${stat("মোট বিক্রয়",money(sales))}${stat("মোট ক্রয়",money(purchase))}
      ${stat("মোট লাভ",money(profit))}${stat("Customer Due",money(db.customers.reduce((a,x)=>a+n(x.due),0)))}
      ${stat("মোট পণ্য",db.products.length)}</div>
      ${card(`<div class="flex flex-wrap gap-2">
        <button data-page="sales" class="bg-teal-700 text-white p-3 rounded">🧾 New Sale</button>
        <button data-page="purchase" class="bg-blue-600 text-white p-3 rounded">📥 New Purchase</button>
        <button data-action="product-form" class="bg-violet-600 text-white p-3 rounded">📦 Add Product</button>
      </div>`)}
      ${card(`<h2 class="font-bold mb-3">Low Stock</h2>${table(["Product","SKU","Stock"],
        db.products.filter(x=>n(x.stock)<=n(x.minimum)).map(x=>row([esc(x.name),esc(x.sku),x.stock])))}`)}`;
  }

  function productForm(old={}) {
    modal(old.id?"Edit Product":"Add Product",`<form id="productForm">
      ${field("Product Name","name",old.name)}
      <div class="grid md:grid-cols-2 gap-3">
        ${field("SKU","sku",old.sku||`SKU-${Date.now()}`)}
        ${field("Barcode","barcode",old.barcode||"","text","placeholder='খালি রাখলে অটো তৈরি হবে'")}
        ${field("Category","category",old.category)}
        ${field("Purchase Price","purchase",old.purchase, "number","min='0' step='0.01'")}
        ${field("MRP","mrp",old.mrp,"number","min='0' step='0.01'")}
        ${field("Discount %","discount",old.discount,"number","min='0' max='100' step='0.01'")}
        ${field("Sale Price","sale",old.sale,"number","min='0' step='0.01'")}
        ${field("Stock","stock",old.stock,"number","min='0'")}
        ${field("Minimum Stock","minimum",old.minimum||5,"number","min='0'")}
      </div>
      <label class="block mb-3">Product Images — সর্বোচ্চ ৫টি
        <input name="images" type="file" accept="image/*" multiple class="w-full border rounded-lg p-3 mt-1">
      </label>
      <div class="flex gap-2 flex-wrap">${(old.images||[]).map(x=>`<img src="${x}" class="w-20 h-20 object-cover rounded">`).join("")}</div>
      <input type="hidden" name="id" value="${esc(old.id||"")}">
      <button class="bg-green-600 text-white px-5 py-3 rounded-lg">Save Product</button>
    </form>`);
  }

  function products() {
    return card(`<div class="flex items-center mb-4">
      <h2 class="font-bold text-xl mr-auto">Products & Stock</h2>
      <button data-action="product-form" class="bg-teal-700 text-white px-4 py-2 rounded">＋ Add Product</button>
    </div>${table(["Image","Name","Category","Barcode","MRP","Sale","Stock","Action"],
      db.products.map(p=>row([
        p.images?.[0]?`<img src="${p.images[0]}" class="w-12 h-12 object-cover rounded">`:"—",
        esc(p.name),esc(p.category),esc(p.barcode),money(p.mrp),money(p.sale),p.stock,
        `<button data-action="edit-product" data-id="${p.id}" class="text-blue-600 mr-2">Edit</button>
         <button data-action="barcode-one" data-id="${p.id}" class="text-green-600 mr-2">Barcode</button>
         <button data-action="delete" data-type="products" data-id="${p.id}" class="text-red-600">Delete</button>`
      ])))}`);
  }

  function pos() {
    return `<div class="grid lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2">${card(`<div class="flex gap-2 mb-3">
        <h2 class="font-bold text-xl mr-auto">POS / Sales</h2>
        <button data-action="quick-customer" class="bg-blue-600 text-white px-3 rounded">＋ Customer</button>
      </div><input id="search" placeholder="নাম, SKU বা barcode search করুন"
        class="w-full border-2 border-teal-200 rounded-lg p-3">
        <div id="picker" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"></div>`)}
        ${card(`<h2 class="font-bold mb-3">Cart — product-এ ক্লিক করে Edit করুন</h2><div id="cart"></div>`)}</div>
      ${card(`<h2 class="font-bold text-xl mb-3">Bill</h2>
        <select id="customer" class="w-full border rounded p-3 mb-3">
        <option value="">Walk-in Customer</option>${db.customers.map(x=>`<option value="${x.id}">${esc(x.name)} — ${esc(x.phone)}</option>`).join("")}</select>
        <select id="payment" class="w-full border rounded p-3 mb-3">
          <option>Cash</option><option>UPI</option><option>Online</option><option>Card</option>
          <option>Credit</option><option>Exchange</option>
        </select>
        <input id="billDiscount" type="number" value="0" placeholder="Bill Discount"
          class="w-full border rounded p-3 mb-3">
        <div id="summary"></div>
        <button data-action="complete-sale" class="w-full bg-green-600 text-white p-3 rounded mt-3">Complete Bill</button>
        <button data-action="clear-cart" class="w-full border p-3 rounded mt-2">Clear Cart</button>`)}</div>`;
  }

  function renderPOS() {
    const q=($("#search")?.value||"").toLowerCase();
    $("#picker").innerHTML=db.products.filter(p=>
      `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(q)).map(p=>`
      <button data-action="add-cart" data-id="${p.id}" class="text-left border-2 rounded-xl p-3 bg-gradient-to-br from-white to-teal-50">
        ${p.images?.[0]?`<img src="${p.images[0]}" class="w-full h-20 object-cover rounded mb-2">`:""}
        <b>${esc(p.name)}</b><small class="block text-slate-500">Stock: ${p.stock}</small>
        <small>MRP ${money(p.mrp)} · ${p.discount||0}% off</small>
        <strong class="block text-teal-700">${money(p.sale)}</strong>
      </button>`).join("")||"<p>Product পাওয়া যায়নি।</p>";
    renderCart();
  }

  function renderCart() {
    if(!$("#cart")) return;
    const sub=cart.reduce((a,x)=>a+x.qty*x.price,0), dis=n($("#billDiscount")?.value), total=Math.max(0,sub-dis);
    $("#cart").innerHTML=cart.length?cart.map(x=>`
      <div data-cart="${x.id}" class="flex gap-2 items-center border-2 border-teal-100 rounded-lg p-2 mb-2">
        <span class="mr-auto"><b>${esc(x.name)}</b><small class="block">${money(x.price)} each</small></span>
        <input data-qty="${x.id}" value="${x.qty}" type="number" min="1" max="${x.stock}" class="w-16 border p-2 rounded">
        <input data-price="${x.id}" value="${x.price}" type="number" min="0" class="w-24 border p-2 rounded">
        <b>${money(x.qty*x.price)}</b>
        <button data-action="remove-cart" data-id="${x.id}" class="text-red-600 text-xl">×</button>
      </div>`).join(""):"<p class='text-slate-500'>Cart খালি।</p>";
    $("#summary").innerHTML=`<div class="bg-slate-50 p-4 leading-8">
      Subtotal:<b class="float-right">${money(sub)}</b><br>Discount:<b class="float-right">${money(dis)}</b><hr>
      <strong class="text-xl">Total <span class="float-right">${money(total)}</span></strong></div>`;
  }

  function purchase() {
    return card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">Bulk Purchase Entry</h2>
      <button data-action="product-form" class="bg-violet-600 text-white px-3 py-2 rounded">＋ New Product</button></div>
      <div class="grid md:grid-cols-4 gap-2 mb-4">
        <select id="purchaseSupplier" class="border p-3 rounded"><option value="">Supplier</option>
        ${db.suppliers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>
        <select id="purchaseProduct" class="border p-3 rounded"><option value="">Product</option>
        ${db.products.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>
        <input id="purchaseQty" type="number" min="1" value="1" class="border p-3 rounded" placeholder="Quantity">
        <input id="purchasePrice" type="number" min="0" class="border p-3 rounded" placeholder="Purchase Price">
      </div>
      <button data-action="purchase-add" class="bg-blue-600 text-white px-4 py-2 rounded mb-4">＋ Add Row</button>
      <div id="purchaseRows"></div>
      <button data-action="purchase-save" class="bg-green-600 text-white px-5 py-3 rounded mt-4">Save All Purchase</button>
      <hr class="my-5">${table(["Date","Supplier","Product","Qty","Total","Action"],
        db.purchases.map(x=>row([x.date,esc(x.supplier),esc(x.name),x.qty,money(x.total),
        `<button data-action="delete" data-type="purchases" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function renderPurchase() {
    if(!$("#purchaseRows"))return;
    $("#purchaseRows").innerHTML=purchaseRows.length?table(["Product","Qty","Price","Print Barcode","Barcode Qty","Action"],
      purchaseRows.map(x=>row([esc(x.name),
        `<input data-prq="${x.id}" value="${x.qty}" type="number" min="1" class="w-20 border p-1 rounded">`,
        `<input data-prp="${x.id}" value="${x.price}" type="number" min="0" class="w-24 border p-1 rounded">`,
        `<input data-prprint="${x.id}" type="checkbox" ${x.print?"checked":""}>`,
        `<input data-prb="${x.id}" value="${x.barcodeQty}" type="number" min="0" class="w-20 border p-1 rounded">`,
        `<button data-action="purchase-remove" data-id="${x.id}" class="text-red-600">Delete</button>`]))) :
      "<p class='text-slate-500'>এখনও কোনো row নেই।</p>";
  }

  function personPage(type) {
    const key=type==="Customer"?"customers":"suppliers";
    return card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">${type}</h2>
      <button data-action="person-form" data-type="${type}" class="bg-teal-700 text-white px-4 py-2 rounded">＋ Add ${type}</button></div>
      ${table(["Name","Mobile","Address","Opening","Due","Action"],db[key].map(x=>row([
        esc(x.name),esc(x.phone),esc(x.address),money(x.opening),money(x.due),
        `<button data-action="edit-person" data-type="${type}" data-id="${x.id}" class="text-blue-600 mr-2">Edit</button>
         <button data-action="delete" data-type="${key}" data-id="${x.id}" class="text-red-600">Delete</button>`
      ])))}`);
  }

  function personForm(type,old={}) {
    modal(old.id?`Edit ${type}`:`Add ${type}`,`<form id="personForm">
      ${field("Name","name",old.name)}${field("Mobile","phone",old.phone)}
      ${field("Address","address",old.address)}${field("Opening Balance","opening",old.opening,"number","min='0'")}
      <input type="hidden" name="id" value="${esc(old.id||"")}">
      <input type="hidden" name="type" value="${type}">
      <button class="bg-green-600 text-white p-3 rounded">Save</button></form>`);
  }

  function payments() {
    return card(`<h2 class="font-bold text-xl mb-4">Customer Receive / Supplier Payment</h2>
      <div class="grid md:grid-cols-3 gap-2">
        <select id="payPerson" class="border p-3 rounded"><option value="">Customer Receive</option>
        ${db.customers.map(x=>`<option value="c:${x.id}">${esc(x.name)} — ${money(x.due)}</option>`).join("")}
        <option disabled>──────── Supplier Payment ────────</option>
        ${db.suppliers.map(x=>`<option value="s:${x.id}">${esc(x.name)} — ${money(x.due)}</option>`).join("")}</select>
        <input id="payAmount" type="number" min="1" class="border p-3 rounded" placeholder="Amount">
        <button data-action="payment-save" class="bg-green-600 text-white rounded">Save Payment</button>
      </div><hr class="my-5">${table(["Date","Type","Name","Amount","Action"],
      [...db.payments.map(x=>({...x,kind:"Receive"})),...db.supplierPayments.map(x=>({...x,kind:"Supplier Payment"}))]
      .sort((a,b)=>b.date.localeCompare(a.date)).map(x=>row([x.date,x.kind,esc(x.name),money(x.amount),
        `<button data-action="payment-delete" data-id="${x.id}" data-kind="${x.kind}" class="text-red-600">Delete</button>`])))}`);
  }

  function ecommerce() {
    return card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">E-commerce Orders</h2>
      <button data-action="order-form" class="bg-teal-700 text-white px-4 py-2 rounded">＋ Add Order</button></div>
      ${table(["Date","Customer Details","Phone","Address","Amount","Status","Action"],db.orders.map(o=>row([
        o.date,esc(o.customer),esc(o.phone),esc(o.address||""),money(o.amount),
        `<select data-status="${o.id}" class="border rounded p-1">${["Pending","Accepted","Processing","Delivered","Cancelled"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select>`,
        `<button data-action="edit-order" data-id="${o.id}" class="text-blue-600 ml-2">Edit</button>
         <button data-action="delete" data-type="orders" data-id="${o.id}" class="text-red-600 ml-2">Delete</button>`
      ])))}`);
  }

  function orderForm(old={}) {
    modal(old.id?"Edit Order":"Add Order",`<form id="orderForm">
      ${field("Customer Name","customer",old.customer)}${field("Phone","phone",old.phone)}
      ${field("Address","address",old.address)}${field("Amount","amount",old.amount,"number")}
      <input type="date" name="date" value="${old.date||today()}" class="border p-3 rounded w-full mb-3">
      <select name="status" class="border p-3 rounded w-full mb-3">
      ${["Pending","Accepted","Processing","Delivered","Cancelled"].map(s=>`<option ${s===old.status?"selected":""}>${s}</option>`).join("")}</select>
      <input type="hidden" name="id" value="${esc(old.id||"")}">
      <button class="bg-green-600 text-white p-3 rounded">Save Order</button></form>`);
  }

  function returnsPage() {
    return card(`<h2 class="font-bold text-xl mb-4">Product Return / Exchange</h2>
      <div class="grid md:grid-cols-4 gap-2">
      <select id="returnProduct" class="border p-3 rounded">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select>
      <input id="returnQty" type="number" min="1" value="1" class="border p-3 rounded" placeholder="Quantity">
      <select id="returnType" class="border p-3 rounded"><option>Return</option><option>Exchange</option></select>
      <input id="returnReason" class="border p-3 rounded" placeholder="Reason"></div>
      <button data-action="return-save" class="bg-orange-600 text-white px-5 py-3 rounded mt-3">Save Return / Exchange</button><hr class="my-5">
      ${table(["Date","Product","Qty","Type","Reason","Action"],db.returns.map(x=>row([
        x.date,esc(x.name),x.qty,x.type,esc(x.reason),
        `<button data-action="delete" data-type="returns" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function reports() {
    const from=$("#from")?.value||"",to=$("#to")?.value||"";
    const sales=db.sales.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));
    const total=sales.reduce((a,x)=>a+n(x.total),0),profit=sales.reduce((a,x)=>a+n(x.profit),0);
    const customer={},category={};
    sales.forEach(s=>{customer[s.customer]=(customer[s.customer]||0)+n(s.total);
      (s.items||[]).forEach(i=>{const p=product(i.id),k=p?.category||"Uncategorized";category[k]=(category[k]||0)+i.qty*i.price})});
    return `<div class="flex gap-2 mb-5"><input id="from" type="date" value="${from}" class="border p-2 rounded">
      <input id="to" type="date" value="${to}" class="border p-2 rounded"><button data-action="filter-report" class="bg-teal-700 text-white px-4 rounded">Filter</button></div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">${stat("Sales",money(total))}${stat("Gross Profit",money(profit))}${stat("Invoices",sales.length)}${stat("Products",db.products.length)}</div>
      ${card(`<h3 class="font-bold mb-2">Category-wise</h3>${table(["Category","Sales"],Object.entries(category).map(x=>row([esc(x[0]),money(x[1])])))}
      <h3 class="font-bold mt-5 mb-2">Customer-wise</h3>${table(["Customer","Sales"],Object.entries(customer).map(x=>row([esc(x[0]),money(x[1])])))}
      <button data-action="print" class="border px-4 py-2 rounded mt-4">🖨 Print Report</button>`)}`;
  }

  function settings() {
    return card(`<h2 class="font-bold text-xl mb-4">Settings</h2>
      <h3 class="font-bold text-teal-700 mb-2">Company Details</h3>
      <form id="settingsForm">${field("Company / Store Name","store",db.store)}
      ${field("Phone","phone",db.phone)}${field("Address","address",db.address)}
      <button class="bg-teal-700 text-white p-3 rounded mb-5">Save Company Details</button></form>
      <h3 class="font-bold text-teal-700 mb-2">Barcode Settings</h3>
      <select id="barcodeSize" class="border p-3 rounded w-full mb-3">
        ${["15x25-4line","25x50-1line","25x38","small"].map(x=>`<option ${db.settings.barcodeSize===x?"selected":""}>${x}</option>`).join("")}
      </select>
      <button data-action="barcode-save" class="bg-blue-600 text-white p-3 rounded">Save Barcode Settings</button>
      <button data-action="reset" class="bg-red-600 text-white p-3 rounded ml-2">Reset All Data</button>`);
  }

  function adjustment() {
    return card(`<h2 class="font-bold text-xl mb-4">Product Adjustment</h2>
      <select id="adjProduct" class="border p-3 rounded w-full mb-3">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)} — ${p.stock}</option>`).join("")}</select>
      <div class="grid md:grid-cols-3 gap-2"><select id="adjType" class="border p-3 rounded"><option>Add</option><option>Remove</option></select>
      <input id="adjQty" type="number" min="1" class="border p-3 rounded" placeholder="Quantity">
      <input id="adjReason" class="border p-3 rounded" placeholder="Reason"></div>
      <button data-action="adjust-save" class="bg-blue-600 text-white p-3 rounded mt-3">Save Adjustment</button>`);
  }

  function invoicePreview(s) {
    invoice=s;
    modal("Invoice Preview",`<div id="invoice" class="p-5">
      <h1 class="text-2xl font-bold">${esc(db.store)}</h1><p>${esc(db.phone)} ${esc(db.address)}</p>
      <hr class="my-3"><p>Invoice: ${s.id} | Date: ${s.date}</p><p>Customer: ${esc(s.customer)}</p>
      ${table(["Product","Qty","Price","Total"],s.items.map(x=>row([esc(x.name),x.qty,money(x.price),money(x.qty*x.price)])))}
      <h2 class="text-right text-xl font-bold mt-3">Total: ${money(s.total)}</h2></div>
      <button data-action="print-invoice" class="bg-green-600 text-white px-5 py-3 rounded">🖨 Print Invoice</button>`);
  }

  function barcodePrint(items) {
    if(!items.length)return alert("Barcode নির্বাচন করুন।");
    const size=db.settings.barcodeSize;
    const css={"15x25-4line":"width:142px;height:94px","25x50-1line":"width:283px;height:142px",
      "25x38":"width:215px;height:108px",small:"width:130px;height:75px"}[size]||"width:215px;height:108px";
    modal("Barcode Preview",`<div id="barcodes" class="flex flex-wrap">${items.map(p=>`
      <div class="barcode-label border border-dashed p-2 m-1 text-center" style="${css}">
      <b>${esc(p.name)}</b><svg data-bar="${esc(p.barcode)}"></svg><small>${esc(p.barcode)}<br>${money(p.sale)}</small></div>`).join("")}</div>
      <button data-action="print-barcode" class="bg-green-600 text-white px-5 py-3 rounded mt-3">🖨 Print Barcode</button>`);
    const load=()=>document.querySelectorAll("svg[data-bar]").forEach(x=>{
      if(window.JsBarcode)JsBarcode(x,x.dataset.bar,{format:"CODE128",width:1,height:25,displayValue:false,margin:1});
    });
    if(!window.JsBarcode){const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";s.onload=load;document.head.appendChild(s)}else load();
  }

  function render() {
    $("#title").textContent=menu[page];
    document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
    const pages={dashboard,sales:pos,purchase,products,adjustment,customers:()=>personPage("Customer"),
      suppliers:()=>personPage("Supplier"),payments,ecommerce,returns:returnsPage,reports,settings};
    $("#content").innerHTML=pages[page]();
    if(page==="sales")renderPOS();
    if(page==="purchase")renderPurchase();
  }

  document.addEventListener("click",e=>{
    const pg=e.target.closest("[data-page]");
    if(pg){page=pg.dataset.page;render();$("#sidebar").classList.remove("open");return}
    const b=e.target.closest("[data-action]");if(!b)return;
    const a=b.dataset.action,id=b.dataset.id;

    if(a==="menu")$("#sidebar").classList.toggle("open");
    if(a==="back"){page="dashboard";render()}
    if(a==="close"){$("#modal").classList.add("hidden");$("#modal").classList.remove("flex")}
    if(a==="product-form")productForm();
    if(a==="edit-product")productForm(product(id));
    if(a==="quick-customer")personForm("Customer");
    if(a==="person-form")personForm(b.dataset.type);
    if(a==="edit-person"){const key=b.dataset.type==="Customer"?"customers":"suppliers";personForm(b.dataset.type,db[key].find(x=>x.id===id))}
    if(a==="add-cart"){const p=product(id);if(!p||p.stock<1)return alert("Stock নেই");const x=cart.find(x=>x.id===id);x?x.qty=Math.min(x.qty+1,p.stock):cart.push({id,name:p.name,price:n(p.sale),qty:1,stock:n(p.stock)});renderCart()}
    if(a==="remove-cart"){cart=cart.filter(x=>x.id!==id);renderCart()}
    if(a==="clear-cart"){cart=[];renderCart()}
    if(a==="complete-sale"){
      if(!cart.length)return alert("Cart খালি");
      const c=db.customers.find(x=>x.id===$("#customer").value),pay=$("#payment").value;
      const sub=cart.reduce((a,x)=>a+x.qty*x.price,0),discount=n($("#billDiscount").value),total=Math.max(0,sub-discount);
      let profit=0;
      cart.forEach(x=>{const p=product(x.id);p.stock-=x.qty;profit+=(x.price-n(p.purchase))*x.qty});
      if(c&&pay==="Credit")c.due=n(c.due)+total;
      const s={id:uid("INV"),date:today(),time:new Date().toLocaleTimeString(),
        customer:c?.name||"Walk-in Customer",customerId:c?.id||"",payment:pay,total,
        profit:profit-discount,items:JSON.parse(JSON.stringify(cart))};
      db.sales.push(s);save();cart=[];invoicePreview(s);
    }
    if(a==="purchase-add"){
      const p=product($("#purchaseProduct").value),qty=n($("#purchaseQty").value),price=n($("#purchasePrice").value);
      if(!p||qty<1)return alert("Product ও quantity দিন");
      purchaseRows.push({id:p.id,name:p.name,qty,price,print:true,barcodeQty:qty});renderPurchase();
    }
    if(a==="purchase-remove"){purchaseRows=purchaseRows.filter(x=>x.id!==id);renderPurchase()}
    if(a==="purchase-save"){
      if(!purchaseRows.length)return alert("Purchase list খালি");
      const s=db.suppliers.find(x=>x.id===$("#purchaseSupplier").value),labels=[];
      purchaseRows.forEach(x=>{const p=product(x.id);p.stock+=n(x.qty);
        db.purchases.push({id:uid("PUR"),date:today(),supplier:s?.name||"",supplierId:s?.id||"",
          name:p.name,productId:p.id,qty:n(x.qty),price:n(x.price),total:n(x.qty)*n(x.price)});
        if(x.print)for(let i=0;i<n(x.barcodeQty);i++)labels.push(p)});
      save();purchaseRows=[];render();if(labels.length)barcodePrint(labels);
    }
    if(a==="payment-save"){
      const v=$("#payPerson").value,amount=n($("#payAmount").value);if(!v||amount<1)return alert("সঠিক তথ্য দিন");
      const [type,pid]=v.split(":"),list=type==="c"?db.customers:db.suppliers,x=list.find(x=>x.id===pid);
      x.due=Math.max(0,n(x.due)-amount);
      const r={id:uid("PAY"),date:today(),name:x.name,personId:x.id,amount};
      type==="c"?db.payments.push(r):db.supplierPayments.push(r);save();render();
    }
    if(a==="adjust-save"){const p=product($("#adjProduct").value),q=n($("#adjQty").value),t=$("#adjType").value;if(!p||q<1)return alert("সঠিক তথ্য দিন");if(t==="Remove"&&p.stock<q)return alert("Stock যথেষ্ট নেই");p.stock+=t==="Add"?q:-q;db.adjustments.push({id:uid("ADJ"),date:today(),productId:p.id,name:p.name,qty:q,type:t,reason:$("#adjReason").value});save();render()}
    if(a==="return-save"){const p=product($("#returnProduct").value),q=n($("#returnQty").value);if(!p||q<1)return alert("সঠিক তথ্য দিন");p.stock+=q;db.returns.push({id:uid("RET"),date:today(),productId:p.id,name:p.name,qty:q,type:$("#returnType").value,reason:$("#returnReason").value});save();render()}
    if(a==="order-form")orderForm();
    if(a==="edit-order")orderForm(db.orders.find(x=>x.id===id));
    if(a==="barcode-one")barcodePrint([product(id)]);
    if(a==="barcode-save"){db.settings.barcodeSize=$("#barcodeSize").value;save();alert("Barcode setting সংরক্ষণ হয়েছে")}
    if(a==="filter-report")render();
    if(a==="print")window.print();
    if(a==="print-invoice")window.print();
    if(a==="print-barcode")window.print();
    if(a==="reset"&&confirm("সব তথ্য মুছে ফেলবেন?")){localStorage.removeItem(KEY);location.reload()}

    if(a==="delete"&&confirm("এই তথ্যটি মুছে ফেলবেন?")){
      const type=b.dataset.type,item=db[type].find(x=>x.id===id);
      if(item&&type==="purchases"){const p=product(item.productId);if(p)p.stock=Math.max(0,p.stock-n(item.qty))}
      if(item&&type==="sales"){(item.items||[]).forEach(x=>{const p=product(x.id);if(p)p.stock+=n(x.qty)})}
      db[type]=db[type].filter(x=>x.id!==id);save();render();
    }
    if(a==="payment-delete"&&confirm("Payment মুছবেন?")){
      const list=b.dataset.kind==="Receive"?db.payments:db.supplierPayments;
      const x=list.find(x=>x.id===id);list.splice(list.indexOf(x),1);save();render();
    }
  });

  document.addEventListener("input",e=>{
    if(e.target.id==="search")renderPOS();
    if(e.target.id==="billDiscount")renderCart();
    if(e.target.dataset.qty){const x=cart.find(x=>x.id===e.target.dataset.qty);if(x)x.qty=Math.max(1,Math.min(n(e.target.value),x.stock));renderCart()}
    if(e.target.dataset.price){const x=cart.find(x=>x.id===e.target.dataset.price);if(x)x.price=Math.max(0,n(e.target.value));renderCart()}
    if(e.target.dataset.prq){const x=purchaseRows.find(x=>x.id===e.target.dataset.prq);if(x)x.qty=n(e.target.value)}
    if(e.target.dataset.prp){const x=purchaseRows.find(x=>x.id===e.target.dataset.prp);if(x)x.price=n(e.target.value)}
    if(e.target.dataset.prb){const x=purchaseRows.find(x=>x.id===e.target.dataset.prb);if(x)x.barcodeQty=n(e.target.value)}
  });

  document.addEventListener("change",e=>{
    if(e.target.dataset.prprint){const x=purchaseRows.find(x=>x.id===e.target.dataset.prprint);if(x)x.print=e.target.checked}
    if(e.target.dataset.status){const x=db.orders.find(x=>x.id===e.target.dataset.status);if(x){x.status=e.target.value;save()}}
  });

  document.addEventListener("submit",e=>{
    e.preventDefault();const f=new FormData(e.target),id=f.get("id");

    if(e.target.id==="productForm"){
      const old=product(id),files=[...f.getAll("images")].filter(x=>x.size).slice(0,5);
      const read=files.map(file=>new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file)}));
      Promise.all(read).then(images=>{
        const mrp=n(f.get("mrp")),discount=n(f.get("discount"));
        const saleField=n(f.get("sale")),sale=saleField||mrp*(1-discount/100);
        const item={id:id||uid("PRD"),name:f.get("name"),sku:f.get("sku"),
          barcode:f.get("barcode")||`890${Date.now()}`,category:f.get("category"),
          purchase:n(f.get("purchase")),mrp,discount,sale,stock:n(f.get("stock")),
          minimum:n(f.get("minimum")),images:images.length?images:(old?.images||[])};
        const i=db.products.findIndex(x=>x.id===item.id);i>=0?db.products[i]=item:db.products.push(item);
        save();$("#modal").classList.add("hidden");render();
      });return;
    }

    if(e.target.id==="personForm"){
      const type=f.get("type"),key=type==="Customer"?"customers":"suppliers",old=db[key].find(x=>x.id===id);
      const opening=n(f.get("opening")),item={id:id||uid(type==="Customer"?"CUS":"SUP"),
        name:f.get("name"),phone:f.get("phone"),address:f.get("address"),opening,
        due:old?n(old.due)+(opening-n(old.opening)):opening};
      const i=db[key].findIndex(x=>x.id===item.id);i>=0?db[key][i]=item:db[key].push(item);
    }

    if(e.target.id==="orderForm"){
      const item={id:id||uid("ORD"),date:f.get("date")||today(),time:new Date().toLocaleTimeString(),
        customer:f.get("customer"),phone:f.get("phone"),address:f.get("address"),
        amount:n(f.get("amount")),status:f.get("status")};
      const i=db.orders.findIndex(x=>x.id===item.id);i>=0?db.orders[i]=item:db.orders.push(item);
    }

    if(e.target.id==="settingsForm"){db.store=f.get("store")||"NAMITA STORE";db.phone=f.get("phone");db.address=f.get("address");save();layout()}
    save();$("#modal").classList.add("hidden");render();
  });

  layout();render();
  setInterval(()=>{if($("#clock"))$("#clock").textContent=new Date().toLocaleString("bn-BD")},1000);
})();
