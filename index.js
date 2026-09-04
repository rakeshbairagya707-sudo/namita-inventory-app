(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const KEY = "namita_store_complete";
  const money = n => `₹${Number(n || 0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const uid = p => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const now = () => {
    const d = new Date();
    return {date:d.toISOString().slice(0,10),time:d.toLocaleTimeString()};
  };
  const esc = v => String(v ?? "").replace(/[&<>"']/g,x =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]));
  const num = v => Number(v || 0);

  let db = JSON.parse(localStorage.getItem(KEY) || "null") || {
    store:"NAMITA STORE", phone:"", address:"",
    products:[],customers:[],suppliers:[],sales:[],purchases:[],
    adjustments:[],orders:[],payments:[],barcode:{size:"medium"}
  };

  ["products","customers","suppliers","sales","purchases","adjustments",
   "orders","payments"].forEach(k => db[k] ||= []);
  db.barcode ||= {size:"medium"};

  db.products.forEach(p => {
    p.id ||= uid("PRD"); p.purchase ||= 0; p.sale ||= 0; p.stock ||= 0;
    p.minimum ||= 5; p.category ||= ""; p.mrp ||= p.sale || 0;
    p.discount ||= 0; p.barcode ||= p.sku || p.id;
  });
  db.customers.forEach(x => {x.due ||= 0;x.opening ||= 0});
  db.suppliers.forEach(x => {x.due ||= 0;x.opening ||= 0});

  let current = "dashboard", history = ["dashboard"], cart = [], purchaseCart = [];

  const menu = {
    dashboard:"📊 Dashboard",sales:"🧾 Sales / POS",purchase:"📥 Purchase",
    products:"📦 Products & Stock",adjustment:"🔧 Product Adjustment",
    customers:"👥 Customers",suppliers:"🏭 Suppliers",payments:"💰 Due / Payments",
    ecommerce:"🛒 E-commerce",reports:"📑 Reports",settings:"⚙️ Settings"
  };
  const save = () => localStorage.setItem(KEY,JSON.stringify(db));
  const product = id => db.products.find(x => x.id === id);

  function layout() {
    $("#app").innerHTML = `
      <div class="flex min-h-screen">
        <aside id="sidebar" class="sidebar w-64 shrink-0 text-white p-4">
          <div class="text-center border-b border-white/20 pb-4 mb-4">
            <h1 class="text-xl font-bold">${esc(db.store)}</h1>
            <small>Accounting & Inventory</small>
          </div>
          <nav class="space-y-1">
            ${Object.entries(menu).map(([id,n]) =>
              `<button data-page="${id}" class="nav-btn w-full text-left px-3 py-3 rounded-lg">${n}</button>`).join("")}
          </nav>
        </aside>
        <main class="content flex-1 min-w-0">
          <header class="bg-white border-b px-4 md:px-7 py-4 flex items-center gap-3 sticky top-0 z-30">
            <button data-action="menu" class="bg-teal-700 text-white px-3 py-2 rounded-lg">☰</button>
            <button data-action="back" class="border px-3 py-2 rounded-lg">← Back</button>
            <h2 id="pageTitle" class="font-bold text-lg mr-auto"></h2>
            <span id="clock" class="text-sm text-slate-500"></span>
          </header>
          <div id="content" class="p-4 md:p-7"></div>
        </main>
      </div>
      <div id="modal" class="hidden fixed inset-0 modal-backdrop z-50 items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-auto p-5">
          <div class="flex justify-between items-center mb-4">
            <h2 id="modalTitle" class="text-xl font-bold"></h2>
            <button data-action="close-modal" class="text-2xl">×</button>
          </div>
          <div id="modalBody"></div>
        </div>
      </div>`;
  }

  function card(html) {return `<div class="card p-5 mb-5">${html}</div>`}
  function stat(t,v,c="") {return `<div class="card p-5 ${c}"><p class="text-slate-500 text-sm">${t}</p><strong class="text-2xl block mt-2">${v}</strong></div>`}
  function row(a) {return `<tr class="border-b hover:bg-slate-50">${a.map(x=>`<td class="p-3">${x}</td>`).join("")}</tr>`}
  function table(h,rows) {
    return rows.length ? `<div class="overflow-x-auto"><table class="w-full text-sm">
      <thead><tr class="bg-slate-50">${h.map(x=>`<th class="p-3 text-left">${x}</th>`).join("")}</tr></thead>
      <tbody>${rows.join("")}</tbody></table></div>` :
      `<p class="text-center text-slate-500 py-8">কোনো তথ্য পাওয়া যায়নি।</p>`;
  }
  function field(label,name,value="",type="text",extra="") {
    return `<label class="block mb-3">${label}<input name="${name}" type="${type}"
      value="${esc(value)}" class="w-full border rounded-lg p-3 mt-1" ${extra}></label>`;
  }

  function dashboardPage() {
    const sales=db.sales.reduce((a,x)=>a+num(x.total),0);
    const purchases=db.purchases.reduce((a,x)=>a+num(x.total),0);
    const profit=db.sales.reduce((a,x)=>a+num(x.profit),0);
    const due=db.customers.reduce((a,x)=>a+num(x.due),0);
    return `<div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
      ${stat("মোট বিক্রয়",money(sales),"text-teal-700")}${stat("মোট ক্রয়",money(purchases))}
      ${stat("মোট লাভ",money(profit),"text-green-700")}${stat("Customer Due",money(due),"text-red-600")}
      ${stat("মোট পণ্য",db.products.length)}
    </div>
    ${card(`<h2 class="font-bold text-xl mb-4">Quick Actions</h2>
      <div class="flex flex-wrap gap-2">
      <button data-page="sales" class="bg-teal-700 text-white px-4 py-2 rounded-lg">🧾 New Sale</button>
      <button data-page="purchase" class="bg-blue-600 text-white px-4 py-2 rounded-lg">📥 New Purchase</button>
      <button data-action="add-product" class="bg-violet-600 text-white px-4 py-2 rounded-lg">📦 Add Product</button>
      </div>`)}
    ${card(`<h2 class="font-bold text-xl mb-3">Low Stock</h2>${table(["Product","SKU","Stock"],
      db.products.filter(x=>num(x.stock)<=num(x.minimum||5)).map(x=>row([esc(x.name),esc(x.sku),x.stock])))}`)}`;
  }

  function productsPage() {
    return card(`<div class="flex flex-wrap gap-2 items-center mb-4">
      <h2 class="font-bold text-xl mr-auto">Products & Stock</h2>
      <button data-action="add-product" class="bg-teal-700 text-white px-4 py-2 rounded-lg">＋ Add Product</button>
      <button data-page="adjustment" class="bg-blue-600 text-white px-4 py-2 rounded-lg">🔧 Adjustment</button>
    </div>
    ${table(["Image","Name","Category","SKU/Barcode","MRP","Sale","Stock","Action"],
      db.products.map(x=>row([
        x.image?`<img src="${x.image}" class="w-10 h-10 object-cover rounded">`:"—",
        esc(x.name),esc(x.category),`${esc(x.sku)}<br><small>${esc(x.barcode)}</small>`,
        money(x.mrp),money(x.sale),x.stock,
        `<button data-action="edit-product" data-id="${x.id}" class="text-blue-600 mr-3">Edit</button>
         <button data-action="print-product-barcode" data-id="${x.id}" class="text-green-600 mr-3">Barcode</button>
         <button data-action="delete-product" data-id="${x.id}" class="text-red-600">Delete</button>`
      ])))}`);
  }

  function productForm(old={}) {
    modal(old.id?"Edit Product":"Add Product",`<form id="productForm">
      ${field("Product Name","name",old.name)}
      <div class="grid md:grid-cols-2 gap-3">
        ${field("SKU","sku",old.sku||`SKU-${Date.now()}`)}
        ${field("Barcode","barcode",old.barcode||uid("890"),"text","placeholder='খালি রাখলে অটো তৈরি হবে'")}
        ${field("Category","category",old.category||"")}
        ${field("Purchase Price","purchase",old.purchase||0,"number","min='0' step='0.01'")}
        ${field("MRP","mrp",old.mrp||0,"number","min='0' step='0.01'")}
        ${field("Discount %","discount",old.discount||0,"number","min='0' max='100' step='0.01'")}
        ${field("Sale Price","sale",old.sale||0,"number","min='0' step='0.01'")}
        ${field("Stock","stock",old.stock||0,"number","min='0'")}
        ${field("Minimum Stock","minimum",old.minimum||5,"number","min='0'")}
      </div>
      <label class="block mb-4">Product Image<input name="image" type="file" accept="image/*"
        class="w-full border rounded-lg p-3 mt-1"></label>
      ${old.image?`<img src="${old.image}" class="w-20 h-20 object-cover rounded mb-3">`:""}
      <input type="hidden" name="id" value="${esc(old.id||"")}">
      <button class="bg-green-600 text-white px-5 py-3 rounded-lg">Save Product</button>
    </form>`);
  }

  function salesPage() {
    return `<div class="grid lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2">${card(`<div class="flex gap-2 mb-3">
        <h2 class="font-bold text-xl mr-auto">Sales / POS</h2>
        <button data-action="pos-edit-product" class="border px-3 py-2 rounded-lg">✏ Product Edit</button></div>
        <input id="posSearch" class="w-full border rounded-lg p-3" placeholder="নাম, SKU বা barcode search করুন">
        <div id="picker" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"></div>`)}
        ${card(`<h2 class="font-bold mb-3">Cart</h2><div id="cart"></div>`)}</div>
      ${card(`<h2 class="font-bold text-xl mb-3">Sale Summary</h2>
        <select id="saleCustomer" class="w-full border rounded-lg p-3 mb-3">
        <option value="">Walk-in Customer</option>${db.customers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>
        <select id="salePayment" class="w-full border rounded-lg p-3 mb-3">
        <option>Cash</option><option>UPI</option><option>Card</option><option>Credit</option></select>
        <input id="discount" type="number" value="0" class="w-full border rounded-lg p-3 mb-3" placeholder="Bill Discount">
        <div id="summary"></div><button data-action="complete-sale" class="w-full bg-green-600 text-white p-3 rounded-lg">Save Sale</button>
        <button data-action="clear-cart" class="w-full border p-3 rounded-lg mt-2">Clear Cart</button>`)}</div></div>`;
  }

  function renderPOS() {
    const q=($("#posSearch")?.value||"").toLowerCase();
    $("#picker").innerHTML=db.products.filter(x=>`${x.name} ${x.sku} ${x.barcode}`.toLowerCase().includes(q))
      .map(x=>`<button data-action="add-cart" data-id="${x.id}" class="text-left border-2 rounded-xl p-3 hover:border-teal-600 bg-gradient-to-br from-white to-teal-50">
      ${x.image?`<img src="${x.image}" class="w-full h-24 object-cover rounded mb-2">`:""}
      <b>${esc(x.name)}</b><small class="block text-slate-500">${esc(x.sku)} · Stock ${x.stock}</small>
      <span class="text-xs">MRP: ${money(x.mrp)} ${num(x.discount)?`· ${x.discount}% off`:""}</span><strong class="block text-teal-700">${money(x.sale)}</strong></button>`).join("")||"<p>Product পাওয়া যায়নি।</p>";
    renderCart();
  }

  function renderCart() {
    if(!$("#cart"))return;
    const subtotal=cart.reduce((a,x)=>a+x.qty*x.price,0),discount=num($("#discount")?.value),total=Math.max(0,subtotal-discount);
    $("#cart").innerHTML=cart.length?cart.map(x=>`<div class="flex gap-2 items-center border-b py-3">
      <span class="mr-auto"><b>${esc(x.name)}</b><small class="block">Unit price</small>
      <input data-price="${x.id}" type="number" value="${x.price}" min="0" class="w-24 border rounded p-1"></span>
      <input data-qty="${x.id}" type="number" min="1" max="${x.stock}" value="${x.qty}" class="w-20 border p-2 rounded">
      <b>${money(x.qty*x.price)}</b><button data-action="remove-cart" data-id="${x.id}" class="text-red-600 text-xl">×</button></div>`).join("")
      :`<p class="text-slate-500">Cart খালি।</p>`;
    $("#summary").innerHTML=`<div class="bg-slate-50 rounded-lg p-4 leading-8">Subtotal:<b class="float-right">${money(subtotal)}</b><br>
      Discount:<b class="float-right">${money(discount)}</b><hr><strong class="text-xl">Total<span class="float-right">${money(total)}</span></strong></div>`;
  }

  function purchasePage() {
    return card(`<div class="flex flex-wrap gap-2 items-center mb-4"><h2 class="font-bold text-xl mr-auto">Purchase Entry</h2>
      <button data-action="add-product" class="bg-violet-600 text-white px-4 py-2 rounded-lg">＋ New Product</button>
      <button data-action="print-purchase-barcodes" class="bg-green-600 text-white px-4 py-2 rounded-lg">🖨 Print Selected Barcodes</button></div>
      <div class="grid md:grid-cols-3 gap-3 mb-5">
        <select id="purchaseSupplier" class="border rounded-lg p-3"><option value="">Select Supplier</option>
        ${db.suppliers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>
        <select id="purchaseProduct" class="border rounded-lg p-3"><option value="">Select Product</option>
        ${db.products.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>
        <input id="purchaseQty" type="number" min="1" value="1" placeholder="Quantity" class="border rounded-lg p-3">
        <input id="purchasePrice" type="number" min="0" placeholder="Purchase Price" class="border rounded-lg p-3">
        <button data-action="add-purchase-item" class="bg-blue-600 text-white rounded-lg p-3">＋ Add to Purchase</button>
      </div><div id="purchaseItems"></div>
      <button data-action="save-purchase" class="bg-green-600 text-white px-5 py-3 rounded-lg mt-4">Save Purchase</button><hr class="my-5">
      ${table(["Date","Supplier","Product","Qty","Total","Action"],db.purchases.map(x=>row([x.date,esc(x.supplier||"-"),esc(x.name),x.qty,money(x.total),
        `<button data-action="delete-purchase" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function renderPurchaseCart() {
    if(!$("#purchaseItems"))return;
    $("#purchaseItems").innerHTML=purchaseCart.length?table(["Product","Qty","Price","Barcode Qty","Print","Action"],
      purchaseCart.map(x=>row([esc(x.name),`<input data-pqty="${x.id}" value="${x.qty}" type="number" min="1" class="w-20 border p-1 rounded">`,
        `<input data-pprice="${x.id}" value="${x.price}" type="number" min="0" class="w-24 border p-1 rounded">`,
        `<input data-bqty="${x.id}" value="${x.barcodeQty}" type="number" min="0" class="w-20 border p-1 rounded">`,
        `<input data-print="${x.id}" type="checkbox" ${x.print?"checked":""}>`,
        `<button data-action="remove-purchase-item" data-id="${x.id}" class="text-red-600">Delete</button>`])))
      :"<p class='text-slate-500'>কোনো product যোগ করা হয়নি।</p>";
  }

  function adjustmentPage() {
    return card(`<h2 class="font-bold text-xl mb-4">Product Adjustment</h2>
      <select id="adjustProduct" class="w-full border rounded-lg p-3 mb-3">${db.products.map(x=>`<option value="${x.id}">${esc(x.name)} — Stock ${x.stock}</option>`).join("")}</select>
      <div class="grid md:grid-cols-3 gap-3"><select id="adjustType" class="border rounded-lg p-3"><option value="add">Stock Add</option><option value="remove">Stock Remove</option></select>
      <input id="adjustQty" type="number" min="1" placeholder="Quantity" class="border rounded-lg p-3"><input id="adjustReason" placeholder="Reason" class="border rounded-lg p-3"></div>
      <button data-action="save-adjustment" class="bg-blue-600 text-white px-5 py-3 rounded-lg mt-4">Save Adjustment</button><hr class="my-5">
      ${table(["Date","Product","Type","Qty","Reason","Action"],db.adjustments.map(x=>row([x.date,esc(x.name),x.type,x.qty,esc(x.reason),`<button data-action="delete-adjustment" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function personPage(type) {
    const key=type==="Customer"?"customers":"suppliers";
    return card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">${type}s</h2>
      <button data-action="add-${type.toLowerCase()}" class="bg-teal-700 text-white px-4 py-2 rounded-lg">＋ Add ${type}</button></div>
      ${table(["Name","Mobile","Address","Opening","Due","Action"],db[key].map(x=>row([esc(x.name),esc(x.phone),esc(x.address),money(x.opening),money(x.due),
      `<button data-action="edit-${type.toLowerCase()}" data-id="${x.id}" class="text-blue-600 mr-3">Edit</button><button data-action="delete-${type.toLowerCase()}" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function personForm(type,old={}) {
    const id=type==="Customer"?"customerForm":"supplierForm";
    modal(old.id?`Edit ${type}`:`Add ${type}`,`<form id="${id}">${field(`${type} Name`,"name",old.name)}
      ${field("Mobile","phone",old.phone)}${field("Address","address",old.address)}
      ${field("Opening Balance","opening",old.opening||0,"number","min='0'")}
      <input type="hidden" name="id" value="${esc(old.id||"")}"><button class="bg-green-600 text-white px-5 py-3 rounded-lg">Save ${type}</button></form>`);
  }

  function paymentsPage() {
    return card(`<h2 class="font-bold text-xl mb-4">Due / Payments</h2><div class="grid md:grid-cols-3 gap-3">
      <select id="dueCustomer" class="border rounded-lg p-3">${db.customers.map(x=>`<option value="${x.id}">${esc(x.name)} — ${money(x.due)}</option>`).join("")}</select>
      <input id="dueAmount" type="number" min="1" placeholder="Amount" class="border rounded-lg p-3"><button data-action="receive-payment" class="bg-green-600 text-white rounded-lg">Save Payment</button></div><hr class="my-5">
      ${table(["Date","Customer","Amount","Action"],db.payments.map(x=>row([x.date,esc(x.name),money(x.amount),`<button data-action="delete-payment" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function ecommercePage() {
    return card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">E-commerce Orders</h2>
      <button data-action="add-order" class="bg-teal-700 text-white px-4 py-2 rounded-lg">＋ Add Order</button></div>
      ${table(["Date","Customer","Phone","Amount","Status","Action"],db.orders.map(x=>row([x.date,esc(x.customer),esc(x.phone),money(x.amount),esc(x.status),
      `<select data-order-status="${x.id}" class="border rounded p-1">${["Pending","Accepted","Processing","Delivered","Cancelled"].map(s=>`<option ${s===x.status?"selected":""}>${s}</option>`).join("")}</select>
      <button data-action="edit-order" data-id="${x.id}" class="text-blue-600 ml-2">Edit</button><button data-action="delete-order" data-id="${x.id}" class="text-red-600 ml-2">Delete</button>`])))}`);
  }

  function orderForm(old={}) {
    modal(old.id?"Edit Order":"Add Order",`<form id="orderForm">${field("Customer","customer",old.customer)}
      ${field("Phone","phone",old.phone)}${field("Amount","amount",old.amount||0,"number")}
      <select name="status" class="w-full border rounded-lg p-3 mb-3">${["Pending","Accepted","Processing","Delivered","Cancelled"].map(x=>`<option ${x===old.status?"selected":""}>${x}</option>`).join("")}</select>
      <input type="hidden" name="id" value="${esc(old.id||"")}"><button class="bg-green-600 text-white px-5 py-3 rounded-lg">Save Order</button></form>`);
  }

  function reportsPage() {
    const sales=db.sales.reduce((a,x)=>a+num(x.total),0), purchase=db.purchases.reduce((a,x)=>a+num(x.total),0);
    const profit=db.sales.reduce((a,x)=>a+num(x.profit),0);
    const byCategory={},byCustomer={};
    db.sales.forEach(s=>{byCustomer[s.customer]=(byCustomer[s.customer]||0)+num(s.total);
      (s.items||[]).forEach(i=>{const p=product(i.id),k=p?.category||"Uncategorized";byCategory[k]=(byCategory[k]||0)+i.qty*i.price})});
    return `<div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">${stat("Total Sales",money(sales))}${stat("Purchase",money(purchase))}
      ${stat("Gross Profit",money(profit))}${stat("Net Profit",money(profit),"text-green-700")}${stat("Invoices",db.sales.length)}</div>
      ${card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">Reports</h2><button data-action="print" class="border px-4 py-2 rounded-lg">🖨 Print</button></div>
      <h3 class="font-bold mb-2">Category-wise Sales</h3>${table(["Category","Sales"],Object.entries(byCategory).map(([k,v])=>row([esc(k),money(v)])))}
      <h3 class="font-bold mt-6 mb-2">Customer-wise Sales</h3>${table(["Customer","Sales"],Object.entries(byCustomer).map(([k,v])=>row([esc(k),money(v)])))}
      <h3 class="font-bold mt-6 mb-2">Sales Invoice Report</h3>${table(["Invoice","Date","Customer","Payment","Total","Action"],db.sales.map(x=>row([x.id,x.date,esc(x.customer),x.payment,money(x.total),`<button data-action="delete-sale" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`)}`;
  }

  function settingsPage() {
    return card(`<h2 class="font-bold text-xl mb-4">Settings</h2><form id="settingsForm">
      ${field("Store Name","store",db.store)}${field("Phone","phone",db.phone)}${field("Address","address",db.address)}
      <label class="block mb-3">Barcode Template<select name="size" class="w-full border rounded-lg p-3 mt-1">
      <option value="small" ${db.barcode.size==="small"?"selected":""}>Small — 40×25 mm</option>
      <option value="medium" ${db.barcode.size==="medium"?"selected":""}>Medium — 50×30 mm</option>
      <option value="large" ${db.barcode.size==="large"?"selected":""}>Large — 70×40 mm</option>
      <option value="wide" ${db.barcode.size==="wide"?"selected":""}>Wide — 100×50 mm</option></select></label>
      <button class="bg-teal-700 text-white px-5 py-3 rounded-lg">Save Settings</button></form>
      <button data-action="reset" class="bg-red-600 text-white px-5 py-3 rounded-lg mt-3">Reset All Data</button>`);
  }

  function barcodeHTML(items) {
    const cls={small:"w-[150px] h-[94px]",medium:"w-[190px] h-[113px]",large:"w-[265px] h-[151px]",wide:"w-[378px] h-[189px]"}[db.barcode.size]||"w-[190px] h-[113px]";
    return `<div class="print-area">${items.map(x=>`<div class="barcode-label ${cls}"><b>${esc(x.name)}</b><svg data-code="${esc(x.barcode)}"></svg><small>${esc(x.barcode)} · ${money(x.sale)}</small></div>`).join("")}</div>`;
  }
  function printBarcodes(items) {
    if(!items.length)return alert("Barcode-এর জন্য কোনো product নির্বাচন করা হয়নি।");
    $("#modalTitle").textContent="Barcode Preview";$("#modalBody").innerHTML=barcodeHTML(items);
    $("#modal").classList.remove("hidden");$("#modal").classList.add("flex");
    setTimeout(()=>{document.querySelectorAll("svg[data-code]").forEach(s=>JsBarcode(s,s.dataset.code,{format:"CODE128",width:1.5,height:38,displayValue:false,margin:2}));},50);
    setTimeout(()=>window.print(),300);
  }

  function render() {
    $("#pageTitle").textContent=menu[current];
    document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===current));
    const pages={dashboard:dashboardPage,sales:salesPage,purchase:purchasePage,products:productsPage,
      adjustment:adjustmentPage,customers:()=>personPage("Customer"),suppliers:()=>personPage("Supplier"),
      payments:paymentsPage,ecommerce:ecommercePage,reports:reportsPage,settings:settingsPage};
    $("#content").innerHTML=pages[current]();
    if(current==="sales")renderPOS();
    if(current==="purchase")renderPurchaseCart();
  }

  function modal(title,html){$("#modalTitle").textContent=title;$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden");$("#modal").classList.add("flex")}
  function closeModal(){$("#modal").classList.add("hidden");$("#modal").classList.remove("flex")}

  function removeRecord(type,id) {
    const item=db[type].find(x=>x.id===id);if(!item)return;
    if(type==="purchases"){const p=product(item.productId)||db.products.find(x=>x.name===item.name);if(p)p.stock=Math.max(0,p.stock-num(item.qty))}
    if(type==="adjustments"){const p=product(item.productId)||db.products.find(x=>x.name===item.name);if(p)p.stock+=item.type==="Add"?-num(item.qty):num(item.qty)}
    if(type==="payments"){const c=db.customers.find(x=>x.name===item.name);if(c)c.due+=num(item.amount)}
    if(type==="sales"){(item.items||[]).forEach(x=>{const p=product(x.id);if(p)p.stock+=num(x.qty)});const c=db.customers.find(x=>x.name===item.customer);if(c&&item.payment==="Credit")c.due=Math.max(0,c.due-num(item.total))}
    db[type]=db[type].filter(x=>x.id!==id);save();render();
  }

  document.addEventListener("click",e=>{
    const page=e.target.closest("[data-page]");
    if(page){if(current!==page.dataset.page)history.push(current);current=page.dataset.page;render();$("#sidebar").classList.remove("open");return}
    const b=e.target.closest("[data-action]");if(!b)return;
    const a=b.dataset.action,id=b.dataset.id;
    if(a==="menu")$("#sidebar").classList.toggle("open");
    if(a==="back"){current=history.pop()||"dashboard";render()}
    if(a==="close-modal")closeModal();
    if(a==="add-product")productForm();
    if(a==="edit-product")productForm(product(id));
    if(a==="add-customer")personForm("Customer");
    if(a==="edit-customer")personForm("Customer",db.customers.find(x=>x.id===id));
    if(a==="add-supplier")personForm("Supplier");
    if(a==="edit-supplier")personForm("Supplier",db.suppliers.find(x=>x.id===id));
    if(a==="add-order")orderForm();
    if(a==="edit-order")orderForm(db.orders.find(x=>x.id===id));
    if(a==="pos-edit-product"){if(cart[0])productForm(product(cart[0].id));else alert("আগে POS থেকে একটি product নির্বাচন করুন।")}
    if(a==="print-product-barcode"){const p=product(id);printBarcodes(p?[{...p}]:[])}
    if(a==="add-cart"){const p=product(id);if(!p||num(p.stock)<1)return alert("Stock নেই।");const old=cart.find(x=>x.id===id);if(old)old.qty=Math.min(old.qty+1,num(p.stock));else cart.push({id:p.id,name:p.name,price:num(p.sale),qty:1,stock:num(p.stock)});renderCart()}
    if(a==="remove-cart"){cart=cart.filter(x=>x.id!==id);renderCart()}
    if(a==="clear-cart"){cart=[];renderCart()}
    if(a==="add-purchase-item"){const p=product($("#purchaseProduct")?.value),qty=num($("#purchaseQty")?.value),price=num($("#purchasePrice")?.value);if(!p||qty<1)return alert("Product ও quantity দিন।");const old=purchaseCart.find(x=>x.id===p.id);if(old){old.qty+=qty;old.price=price||old.price}else purchaseCart.push({id:p.id,name:p.name,barcode:p.barcode, sale:p.sale,qty,price,barcodeQty:qty,print:true});renderPurchaseCart()}
    if(a==="remove-purchase-item"){purchaseCart=purchaseCart.filter(x=>x.id!==id);renderPurchaseCart()}
    if(a==="save-purchase"){if(!purchaseCart.length)return alert("Purchase list খালি।");const s=db.suppliers.find(x=>x.id===$("#purchaseSupplier")?.value);purchaseCart.forEach(x=>{const p=product(x.id);p.stock+=num(x.qty);db.purchases.push({id:uid("PUR"),...now(),supplier:s?.name||"",supplierId:s?.id||"",productId:p.id,name:p.name,qty:num(x.qty),total:num(x.qty)*num(x.price),price:num(x.price)})});const labels=purchaseCart.filter(x=>x.print).flatMap(x=>Array.from({length:num(x.barcodeQty)},()=>({...product(x.id)})));save();purchaseCart=[];render();alert("Purchase সংরক্ষণ হয়েছে।");if(labels.length)printBarcodes(labels)}
    if(a==="print-purchase-barcodes"){const labels=purchaseCart.filter(x=>x.print).flatMap(x=>Array.from({length:num(x.barcodeQty)},()=>({...product(x.id)})));printBarcodes(labels)}
    if(a==="receive-payment"){const c=db.customers.find(x=>x.id===$("#dueCustomer")?.value),amount=num($("#dueAmount")?.value);if(!c||amount<1)return alert("সঠিক তথ্য দিন।");c.due=Math.max(0,num(c.due)-amount);db.payments.push({id:uid("PAY"),...now(),name:c.name,customerId:c.id,amount});save();render()}
    if(a==="print")window.print();
    if(a==="reset"&&confirm("সব তথ্য মুছে ফেলবেন?")){localStorage.removeItem(KEY);location.reload()}
    const deletes={"delete-product":"products","delete-customer":"customers","delete-supplier":"suppliers","delete-purchase":"purchases","delete-adjustment":"adjustments","delete-payment":"payments","delete-sale":"sales","delete-order":"orders"};
    if(deletes[a]&&confirm("এই তথ্যটি মুছে ফেলবেন?"))removeRecord(deletes[a],id);
  });

  document.addEventListener("input",e=>{
    if(e.target.id==="posSearch")renderPOS();
    if(e.target.id==="discount")renderCart();
    if(e.target.dataset.qty){const x=cart.find(x=>x.id===e.target.dataset.qty);if(x)x.qty=Math.max(1,Math.min(num(e.target.value),x.stock));renderCart()}
    if(e.target.dataset.price){const x=cart.find(x=>x.id===e.target.dataset.price);if(x)x.price=Math.max(0,num(e.target.value));renderCart()}
    if(e.target.dataset.pqty){const x=purchaseCart.find(x=>x.id===e.target.dataset.pqty);if(x)x.qty=Math.max(1,num(e.target.value))}
    if(e.target.dataset.pprice){const x=purchaseCart.find(x=>x.id===e.target.dataset.pprice);if(x)x.price=Math.max(0,num(e.target.value))}
    if(e.target.dataset.bqty){const x=purchaseCart.find(x=>x.id===e.target.dataset.bqty);if(x)x.barcodeQty=Math.max(0,num(e.target.value))}
  });
  document.addEventListener("change",e=>{
    if(e.target.dataset.print){const x=purchaseCart.find(x=>x.id===e.target.dataset.print);if(x)x.print=e.target.checked}
    if(e.target.dataset.orderStatus){const o=db.orders.find(x=>x.id===e.target.dataset.orderStatus);if(o){o.status=e.target.value;save();render()}}
  });

  document.addEventListener("submit",e=>{
    e.preventDefault();const f=new FormData(e.target),id=f.get("id");
    if(e.target.id==="productForm"){
      const old=product(id),file=f.get("image");
      const finish=image=>{const mrp=num(f.get("mrp")),discount=num(f.get("discount"));let sale=num(f.get("sale"));if(!sale&&mrp)sale=mrp*(1-discount/100);
        const item={id:id||uid("PRD"),name:f.get("name"),sku:f.get("sku"),barcode:f.get("barcode")||`890${Date.now()}`,category:f.get("category"),purchase:num(f.get("purchase")),mrp,discount,sale,stock:num(f.get("stock")),minimum:num(f.get("minimum")),image:image||old?.image||""};
        const i=db.products.findIndex(x=>x.id===item.id);i>=0?db.products[i]=item:db.products.push(item);save();closeModal();render()};
      if(file?.size){const r=new FileReader();r.onload=()=>finish(r.result);r.readAsDataURL(file)}else finish("");
      return;
    }
    if(e.target.id==="customerForm"||e.target.id==="supplierForm"){const type=e.target.id==="customerForm"?"customers":"suppliers",old=db[type].find(x=>x.id===id),opening=num(f.get("opening"));const item={id:id||uid(type==="customers"?"CUS":"SUP"),name:f.get("name"),phone:f.get("phone"),address:f.get("address"),opening,due:old?num(old.due)+(opening-num(old.opening||0)):opening};const i=db[type].findIndex(x=>x.id===item.id);i>=0?db[type][i]=item:db[type].push(item)}
    if(e.target.id==="orderForm"){const item={id:id||uid("ORD"),...now(),customer:f.get("customer"),phone:f.get("phone"),amount:num(f.get("amount")),status:f.get("status")};const i=db.orders.findIndex(x=>x.id===item.id);i>=0?db.orders[i]=item:db.orders.push(item)}
    if(e.target.id==="settingsForm"){db.store=f.get("store")||"NAMITA STORE";db.phone=f.get("phone");db.address=f.get("address");db.barcode.size=f.get("size");save();layout()}
    save();closeModal();render();
  });

  layout();render();
  setInterval(()=>{if($("#clock"))$("#clock").textContent=new Date().toLocaleString("bn-BD")},1000);
})();
