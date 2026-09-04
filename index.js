(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const KEY = "namita_store_complete";
  const money = v => `₹${Number(v || 0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const id = p => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  const date = () => new Date().toISOString().slice(0,10);
  const num = v => Number(v || 0);
  const esc = v => String(v ?? "").replace(/[&<>"']/g,x =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[x]));

  let db = JSON.parse(localStorage.getItem(KEY) || "null") || {
    store:"NAMITA STORE",phone:"",address:"",
    products:[],customers:[],suppliers:[],sales:[],purchases:[],
    adjustments:[],orders:[],payments:[],supplierPayments:[],returns:[],
    barcodeSize:"25x38"
  };

  ["products","customers","suppliers","sales","purchases","adjustments",
   "orders","payments","supplierPayments","returns"].forEach(k => db[k] ||= []);
  db.barcodeSize ||= db.settings?.barcodeSize || "25x38";

  db.products.forEach(p => {
    p.id ||= id("PRD"); p.stock ||= 0; p.minimum ||= 5;
    p.purchase ||= 0; p.mrp ||= p.sale || 0; p.sale ||= p.mrp || 0;
    p.discount ||= 0; p.category ||= ""; p.barcode ||= `890${Date.now()}`;
    p.images ||= p.image ? [p.image] : [];
  });
  db.customers.forEach(x => {x.opening ||= 0;x.due ||= x.opening || 0});
  db.suppliers.forEach(x => {x.opening ||= 0;x.due ||= x.opening || 0});

  let current = "dashboard";
  let cart = [];
  let purchaseRows = [];

  const menu = {
    dashboard:"📊 Dashboard",sales:"🧾 POS / Sales",
    purchase:"📥 Purchase",products:"📦 Products & Stock",
    adjustment:"🔧 Adjustment",customers:"👥 Customers",
    suppliers:"🏭 Suppliers",payments:"💰 Payments",
    ecommerce:"🛒 E-commerce",returns:"🔁 Return / Exchange",
    reports:"📑 Reports",settings:"⚙️ Settings"
  };

  const save = () => localStorage.setItem(KEY,JSON.stringify(db));
  const product = x => db.products.find(p => p.id === x);

  function layout() {
    $("#app").innerHTML = `
      <div class="flex min-h-screen">
        <aside id="sidebar" class="sidebar w-64 shrink-0 p-4 text-white">
          <h1 class="text-xl font-bold text-center">${esc(db.store)}</h1>
          <p class="text-center text-sm border-b border-white/20 pb-4 mb-4">Accounting & Inventory</p>
          <nav class="space-y-1">${Object.entries(menu).map(([k,v]) =>
            `<button data-page="${k}" class="nav-btn w-full text-left p-3 rounded-lg">${v}</button>`).join("")}</nav>
        </aside>
        <main class="flex-1 min-w-0">
          <header class="bg-white border-b p-4 flex gap-2 items-center sticky top-0 z-20">
            <button data-action="menu" class="bg-teal-700 text-white px-3 py-2 rounded">☰</button>
            <button data-action="home" class="border px-3 py-2 rounded">← Back</button>
            <h2 id="title" class="font-bold text-lg mr-auto"></h2><span id="clock"></span>
          </header>
          <div id="content" class="p-4 md:p-7"></div>
        </main>
      </div>
      <div id="modal" class="hidden fixed inset-0 modal-bg z-50 items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-5 w-full max-w-4xl max-h-[94vh] overflow-auto">
          <div class="flex justify-between mb-4"><h2 id="modalTitle" class="text-xl font-bold"></h2>
          <button data-action="close" class="text-2xl">×</button></div><div id="modalBody"></div>
        </div>
      </div>`;
  }

  function card(x){return `<div class="card p-5 mb-5">${x}</div>`}
  function field(label,name,value="",type="text",extra=""){
    return `<label class="block mb-3">${label}<input name="${name}" type="${type}" value="${esc(value)}"
      class="w-full border rounded-lg p-3 mt-1" ${extra}></label>`;
  }
  function row(a){return `<tr class="border-b hover:bg-slate-50">${a.map(x=>`<td class="p-3">${x}</td>`).join("")}</tr>`}
  function table(h,r){return r.length?`<div class="overflow-x-auto"><table class="w-full text-sm">
    <thead><tr class="bg-slate-100">${h.map(x=>`<th class="p-3 text-left">${x}</th>`).join("")}</tr></thead>
    <tbody>${r.join("")}</tbody></table></div>`:`<p class="text-center text-slate-500 py-8">কোনো তথ্য নেই।</p>`}
  function openModal(title,html){$("#modalTitle").textContent=title;$("#modalBody").innerHTML=html;$("#modal").className="fixed inset-0 modal-bg z-50 flex items-center justify-center p-4"}
  function closeModal(){$("#modal").className="hidden"}

  function dashboard(){
    const sales=db.sales.reduce((a,x)=>a+num(x.total),0);
    const purchase=db.purchases.reduce((a,x)=>a+num(x.total),0);
    const profit=db.sales.reduce((a,x)=>a+num(x.profit),0);
    return `<div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
      ${["মোট বিক্রয়|"+money(sales),"মোট ক্রয়|"+money(purchase),
      "মোট লাভ|"+money(profit),"Customer Due|"+money(db.customers.reduce((a,x)=>a+num(x.due),0)),
      "মোট পণ্য|"+db.products.length].map(x=>{let a=x.split("|");return `<div class="card p-5"><small>${a[0]}</small><b class="text-2xl block mt-2">${a[1]}</b></div>`}).join("")}</div>
      ${card(`<div class="flex flex-wrap gap-2">
        <button data-page="sales" class="bg-teal-700 text-white p-3 rounded">🧾 New Sale</button>
        <button data-page="purchase" class="bg-blue-600 text-white p-3 rounded">📥 New Purchase</button>
        <button data-action="product-form" class="bg-violet-600 text-white p-3 rounded">📦 Add Product</button>
      </div>`)}
      ${card(`<h2 class="font-bold mb-3">Low Stock</h2>${table(["Product","SKU","Stock"],
      db.products.filter(p=>num(p.stock)<=num(p.minimum)).map(p=>row([esc(p.name),esc(p.sku),p.stock])))}`)}`;
  }

  function productForm(old={}){
    openModal(old.id?"Edit Product":"Add Product",`<form id="productForm">
      ${field("Product Name","name",old.name)}
      <div class="grid md:grid-cols-2 gap-3">
        ${field("SKU","sku",old.sku||"SKU-"+Date.now())}
        ${field("Barcode","barcode",old.barcode||"","text","placeholder='খালি রাখলে অটো হবে'")}
        ${field("Category","category",old.category)}
        ${field("Purchase Price","purchase",old.purchase,"number","min='0'")}
        ${field("MRP","mrp",old.mrp,"number","min='0'")}
        ${field("Discount %","discount",old.discount,"number","min='0' max='100'")}
        ${field("Sale Price","sale",old.sale,"number","min='0'")}
        ${field("Stock","stock",old.stock,"number","min='0'")}
        ${field("Minimum Stock","minimum",old.minimum||5,"number","min='0'")}
      </div>
      <label class="block mb-3">Product Images — সর্বোচ্চ ৫টি
        <input name="images" type="file" accept="image/*" multiple class="w-full border rounded-lg p-3 mt-1">
      </label>
      <div class="flex flex-wrap gap-2">${(old.images||[]).map(x=>`<img src="${x}" class="w-20 h-20 object-cover rounded">`).join("")}</div>
      <input type="hidden" name="id" value="${esc(old.id||"")}">
      <button class="bg-green-600 text-white px-5 py-3 rounded">Save Product</button>
    </form>`);
  }

  function products(){
    return card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">Products & Stock</h2>
      <button data-action="product-form" class="bg-teal-700 text-white p-3 rounded">＋ Add Product</button></div>
      ${table(["Image","Name","Category","Barcode","MRP","Sale","Stock","Action"],db.products.map(p=>row([
        p.images?.[0]?`<img src="${p.images[0]}" class="w-12 h-12 object-cover rounded">`:"—",
        esc(p.name),esc(p.category),esc(p.barcode),money(p.mrp),money(p.sale),p.stock,
        `<button data-action="edit-product" data-id="${p.id}" class="text-blue-600 mr-2">Edit</button>
         <button data-action="barcode" data-id="${p.id}" class="text-green-600 mr-2">Barcode</button>
         <button data-action="delete" data-type="products" data-id="${p.id}" class="text-red-600">Delete</button>`
      ])))}`);
  }

  function sales(){
    return `<div class="grid lg:grid-cols-3 gap-5"><div class="lg:col-span-2">
      ${card(`<div class="flex gap-2 mb-3"><h2 class="font-bold text-xl mr-auto">POS / Sales</h2>
        <button data-action="quick-customer" class="bg-blue-600 text-white px-3 py-2 rounded">＋ Customer</button></div>
        <input id="search" class="w-full border-2 border-teal-200 rounded-lg p-3" placeholder="নাম, SKU বা barcode search করুন">
        <div id="picker" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"></div>`)}
      ${card(`<h2 class="font-bold mb-3">Cart — এখানে Price ও Quantity পরিবর্তন করুন</h2><div id="cart"></div>`)}</div>
      ${card(`<h2 class="font-bold text-xl mb-3">Bill</h2>
        <select id="saleCustomer" class="w-full border p-3 rounded mb-3"><option value="">Walk-in Customer</option>
        ${db.customers.map(x=>`<option value="${x.id}">${esc(x.name)} — ${esc(x.phone)}</option>`).join("")}</select>
        <select id="salePayment" class="w-full border p-3 rounded mb-3">
        <option>Cash</option><option>UPI</option><option>Online</option><option>Card</option><option>Credit</option><option>Exchange</option></select>
        <input id="saleDiscount" type="number" value="0" class="w-full border p-3 rounded mb-3" placeholder="Bill Discount">
        <div id="summary"></div><button data-action="complete-sale" class="w-full bg-green-600 text-white p-3 rounded mt-3">Complete Bill</button>
        <button data-action="clear-cart" class="w-full border p-3 rounded mt-2">Clear Cart</button>`)}</div>`;
  }

  function renderPOS(){
    const q=($("#search")?.value||"").toLowerCase();
    $("#picker").innerHTML=db.products.filter(p=>`${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(q)).map(p=>`
      <button data-action="add-cart" data-id="${p.id}" class="text-left border-2 rounded-xl p-3 bg-gradient-to-br from-white to-teal-50">
      ${p.images?.[0]?`<img src="${p.images[0]}" class="w-full h-20 object-cover rounded mb-2">`:""}
      <b>${esc(p.name)}</b><small class="block text-slate-500">Stock: ${p.stock}</small>
      <small>MRP ${money(p.mrp)} · ${p.discount||0}% off</small><strong class="block text-teal-700">${money(p.sale)}</strong></button>`).join("")||"<p>Product পাওয়া যায়নি।</p>";
    renderCart();
  }

  function renderCart(){
    if(!$("#cart"))return;
    const sub=cart.reduce((a,x)=>a+x.qty*x.price,0),dis=num($("#saleDiscount")?.value),total=Math.max(0,sub-dis);
    $("#cart").innerHTML=cart.length?cart.map(x=>`<div class="flex gap-2 items-center border-2 border-teal-100 rounded p-2 mb-2">
      <b class="mr-auto">${esc(x.name)}</b><input data-cqty="${x.id}" value="${x.qty}" type="number" min="1" max="${x.stock}" class="w-16 border p-2 rounded">
      <input data-cprice="${x.id}" value="${x.price}" type="number" min="0" class="w-24 border p-2 rounded">
      <b>${money(x.qty*x.price)}</b><button data-action="remove-cart" data-id="${x.id}" class="text-red-600 text-xl">×</button></div>`).join(""):"<p>Cart খালি।</p>";
    $("#summary").innerHTML=`<div class="bg-slate-50 p-4 leading-8">Subtotal:<b class="float-right">${money(sub)}</b><br>Discount:<b class="float-right">${money(dis)}</b><hr><b class="text-xl">Total <span class="float-right">${money(total)}</span></b></div>`;
  }

  function purchase(){
    return card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">Bulk Purchase Entry</h2>
      <button data-action="product-form" class="bg-violet-600 text-white p-3 rounded">＋ New Product</button></div>
      <div class="grid md:grid-cols-4 gap-2 mb-3"><select id="purSupplier" class="border p-3 rounded">
      <option value="">Supplier</option>${db.suppliers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>
      <select id="purProduct" class="border p-3 rounded"><option value="">Product</option>${db.products.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>
      <input id="purQty" type="number" value="1" min="1" class="border p-3 rounded" placeholder="Quantity">
      <input id="purPrice" type="number" min="0" class="border p-3 rounded" placeholder="Purchase Price"></div>
      <button data-action="purchase-add" class="bg-blue-600 text-white p-3 rounded">＋ Add Row</button>
      <div id="purchaseRows" class="mt-4"></div><button data-action="purchase-save" class="bg-green-600 text-white p-3 rounded mt-4">Save All Purchase</button>
      <hr class="my-5">${table(["Date","Supplier","Product","Qty","Total","Action"],db.purchases.map(x=>row([
        x.date,esc(x.supplier),esc(x.name),x.qty,money(x.total),
        `<button data-action="delete" data-type="purchases" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function renderPurchase(){
    if(!$("#purchaseRows"))return;
    $("#purchaseRows").innerHTML=purchaseRows.length?table(["Product","Qty","Price","Barcode Qty","Print","Action"],
      purchaseRows.map(x=>row([esc(x.name),
      `<input data-pqty="${x.id}" value="${x.qty}" type="number" min="1" class="w-20 border p-1 rounded">`,
      `<input data-pprice="${x.id}" value="${x.price}" type="number" min="0" class="w-24 border p-1 rounded">`,
      `<input data-pbarcode="${x.id}" value="${x.barcodeQty}" type="number" min="0" class="w-20 border p-1 rounded">`,
      `<input data-pprint="${x.id}" type="checkbox" ${x.print?"checked":""}>`,
      `<button data-action="purchase-remove" data-id="${x.id}" class="text-red-600">Delete</button>`]))) :
      "<p class='text-slate-500'>কোনো row যোগ করা হয়নি।</p>";
  }

  function persons(type){
    const key=type==="Customer"?"customers":"suppliers";
    return card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">${type}</h2>
      <button data-action="person-form" data-type="${type}" class="bg-teal-700 text-white p-3 rounded">＋ Add ${type}</button></div>
      ${table(["Name","Phone","Address","Opening","Due","Action"],db[key].map(x=>row([
        esc(x.name),esc(x.phone),esc(x.address),money(x.opening),money(x.due),
        `<button data-action="edit-person" data-type="${type}" data-id="${x.id}" class="text-blue-600 mr-2">Edit</button>
         <button data-action="delete" data-type="${key}" data-id="${x.id}" class="text-red-600">Delete</button>`
      ])))}`);
  }

  function personForm(type,old={}){
    openModal(old.id?"Edit "+type:"Add "+type,`<form id="personForm">
      ${field("Name","name",old.name)}${field("Phone","phone",old.phone)}${field("Address","address",old.address)}
      ${field("Opening Balance","opening",old.opening,"number","min='0')}
      <input type="hidden" name="id" value="${esc(old.id||"")}"><input type="hidden" name="type" value="${type}">
      <button class="bg-green-600 text-white p-3 rounded">Save</button></form>`);
  }

  function payments(){
    return card(`<h2 class="font-bold text-xl mb-4">Customer Receive / Supplier Payment</h2>
      <div class="grid md:grid-cols-3 gap-2"><select id="payPerson" class="border p-3 rounded">
      <option value="">Select Person</option>${db.customers.map(x=>`<option value="c:${x.id}">Customer: ${esc(x.name)}</option>`).join("")}
      ${db.suppliers.map(x=>`<option value="s:${x.id}">Supplier: ${esc(x.name)}</option>`).join("")}</select>
      <input id="payAmount" type="number" min="1" class="border p-3 rounded" placeholder="Amount">
      <button data-action="payment-save" class="bg-green-600 text-white rounded">Save Payment</button></div><hr class="my-5">
      ${table(["Date","Type","Name","Amount"],[...db.payments.map(x=>row([x.date,"Receive",esc(x.name),money(x.amount)])),
      ...db.supplierPayments.map(x=>row([x.date,"Supplier Payment",esc(x.name),money(x.amount)]))])}`);
  }

  function ecommerce(){
    return card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">E-commerce Orders</h2>
      <button data-action="order-form" class="bg-teal-700 text-white p-3 rounded">＋ Add Order</button></div>
      ${table(["Date","Customer","Phone","Address","Amount","Status","Action"],db.orders.map(o=>row([
      o.date,esc(o.customer),esc(o.phone),esc(o.address),money(o.amount),
      `<select data-status="${o.id}" class="border p-2 rounded">${["Pending","Accepted","Processing","Delivered","Cancelled"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select>`,
      `<button data-action="edit-order" data-id="${o.id}" class="text-blue-600 ml-2">Edit</button>
       <button data-action="delete" data-type="orders" data-id="${o.id}" class="text-red-600 ml-2">Delete</button>`])))}`);
  }

  function orderForm(old={}){
    openModal(old.id?"Edit Order":"Add Order",`<form id="orderForm">
      ${field("Customer Name","customer",old.customer)}${field("Phone","phone",old.phone)}
      ${field("Address","address",old.address)}${field("Amount","amount",old.amount,"number")}
      <label class="block mb-3">Date<input name="date" type="date" value="${old.date||date()}" class="w-full border p-3 rounded mt-1"></label>
      <select name="status" class="w-full border p-3 rounded mb-3">${["Pending","Accepted","Processing","Delivered","Cancelled"].map(s=>`<option ${s===old.status?"selected":""}>${s}</option>`).join("")}</select>
      <input type="hidden" name="id" value="${esc(old.id||"")}"><button class="bg-green-600 text-white p-3 rounded">Save Order</button></form>`);
  }

  function returnsPage(){
    return card(`<h2 class="font-bold text-xl mb-4">Return / Exchange</h2><div class="grid md:grid-cols-4 gap-2">
      <select id="retProduct" class="border p-3 rounded">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select>
      <input id="retQty" type="number" min="1" value="1" class="border p-3 rounded">
      <select id="retType" class="border p-3 rounded"><option>Return</option><option>Exchange</option></select>
      <input id="retReason" class="border p-3 rounded" placeholder="Reason"></div>
      <button data-action="return-save" class="bg-orange-600 text-white p-3 rounded mt-3">Save</button><hr class="my-5">
      ${table(["Date","Product","Qty","Type","Reason","Action"],db.returns.map(x=>row([
      x.date,esc(x.name),x.qty,x.type,esc(x.reason),
      `<button data-action="delete" data-type="returns" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function adjustment(){
    return card(`<h2 class="font-bold text-xl mb-4">Product Adjustment</h2>
      <select id="adjProduct" class="border p-3 rounded w-full mb-3">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)} — ${p.stock}</option>`).join("")}</select>
      <div class="grid md:grid-cols-3 gap-2"><select id="adjType" class="border p-3 rounded"><option>Add</option><option>Remove</option></select>
      <input id="adjQty" type="number" min="1" class="border p-3 rounded"><input id="adjReason" class="border p-3 rounded" placeholder="Reason"></div>
      <button data-action="adjust-save" class="bg-blue-600 text-white p-3 rounded mt-3">Save Adjustment</button>`);
  }

  function reports(){
    const from=$("#from")?.value||"",to=$("#to")?.value||"";
    const sales=db.sales.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));
    const byCustomer={},byCategory={};
    sales.forEach(s=>{byCustomer[s.customer]=(byCustomer[s.customer]||0)+num(s.total);
      (s.items||[]).forEach(i=>{const p=product(i.id),k=p?.category||"Uncategorized";byCategory[k]=(byCategory[k]||0)+i.qty*i.price})});
    return `<div class="flex gap-2 mb-5"><input id="from" type="date" value="${from}" class="border p-2 rounded">
      <input id="to" type="date" value="${to}" class="border p-2 rounded"><button data-action="report-filter" class="bg-teal-700 text-white p-2 rounded">Filter</button></div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">${stat("Sales",sales.reduce((a,x)=>a+num(x.total),0))}
      ${stat("Profit",sales.reduce((a,x)=>a+num(x.profit),0))}${stat("Invoices",sales.length)}${stat("Products",db.products.length)}</div>
      ${card(`<h3 class="font-bold">Category-wise Report</h3>${table(["Category","Sales"],Object.entries(byCategory).map(x=>row([esc(x[0]),money(x[1])])))}
      <h3 class="font-bold mt-5">Customer-wise Report</h3>${table(["Customer","Sales"],Object.entries(byCustomer).map(x=>row([esc(x[0]),money(x[1])])))}
      <button data-action="print" class="border p-2 rounded mt-4">🖨 Print Report</button>`)}`;
  }

  function stat(t,v){return `<div class="card p-5"><small>${t}</small><b class="text-2xl block mt-2">${money(v)}</b></div>`}

  function settings(){
    return card(`<h2 class="font-bold text-xl mb-4">Settings</h2><h3 class="font-bold text-teal-700">Company Details</h3>
      <form id="settingsForm">${field("Store Name","store",db.store)}${field("Phone","phone",db.phone)}${field("Address","address",db.address)}
      <button class="bg-teal-700 text-white p-3 rounded">Save Company Details</button></form>
      <h3 class="font-bold text-teal-700 mt-6 mb-2">Barcode Settings</h3>
      <select id="barcodeSize" class="border p-3 rounded w-full mb-3">${["15x25-4line","25x50-1line","25x38","small"].map(x=>`<option ${db.barcodeSize===x?"selected":""}>${x}</option>`).join("")}</select>
      <button data-action="barcode-setting" class="bg-blue-600 text-white p-3 rounded">Save Barcode Setting</button>
      <button data-action="reset" class="bg-red-600 text-white p-3 rounded ml-2">Reset All Data</button>`);
  }

  function barcodePreview(items){
    const sizes={"15x25-4line":"width:142px;height:94px","25x50-1line":"width:283px;height:142px","25x38":"width:215px;height:108px",small:"width:130px;height:75px"};
    openModal("Barcode Preview",`<div id="barcodeArea" class="print-area flex flex-wrap">${items.map(p=>`
      <div class="label" style="${sizes[db.barcodeSize]||sizes.small}"><b>${esc(p.name)}</b>
      <svg data-code="${esc(p.barcode)}"></svg><small>${esc(p.barcode)}<br>${money(p.sale)}</small></div>`).join("")}</div>
      <button data-action="print" class="bg-green-600 text-white p-3 rounded mt-3">🖨 Print</button>`);
    setTimeout(()=>document.querySelectorAll("svg[data-code]").forEach(x=>JsBarcode(x,x.dataset.code,{format:"CODE128",width:1,height:22,displayValue:false,margin:1})),100);
  }

  function invoice(s){
    openModal("Invoice Preview",`<div class="print-area p-5"><h1 class="text-2xl font-bold">${esc(db.store)}</h1>
      <p>${esc(db.phone)} ${esc(db.address)}</p><hr><p>Invoice: ${s.id} | Date: ${s.date}</p><p>Customer: ${esc(s.customer)}</p>
      ${table(["Product","Qty","Price","Total"],s.items.map(x=>row([esc(x.name),x.qty,money(x.price),money(x.qty*x.price)])))}
      <h2 class="text-right text-xl font-bold">Total: ${money(s.total)}</h2></div>
      <button data-action="print" class="bg-green-600 text-white p-3 rounded mt-3">🖨 Print Invoice</button>`);
  }

  function render(){
    $("#title").textContent=menu[current];
    document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===current));
    const pages={dashboard,sales,purchase,products,adjustment,customers:()=>persons("Customer"),
      suppliers:()=>persons("Supplier"),payments,ecommerce,returns:returnsPage,reports,settings};
    $("#content").innerHTML=pages[current]();
    if(current==="sales")renderPOS();
    if(current==="purchase")renderPurchase();
  }

  document.addEventListener("click",e=>{
    const pg=e.target.closest("[data-page]");
    if(pg){current=pg.dataset.page;render();$("#sidebar").classList.remove("open");return}
    const b=e.target.closest("[data-action]");if(!b)return;
    const a=b.dataset.action,xid=b.dataset.id;

    if(a==="menu")$("#sidebar").classList.toggle("open");
    if(a==="home"){current="dashboard";render()}
    if(a==="close")closeModal();
    if(a==="product-form")productForm();
    if(a==="edit-product")productForm(product(xid));
    if(a==="quick-customer")personForm("Customer");
    if(a==="person-form")personForm(b.dataset.type);
    if(a==="edit-person"){const k=b.dataset.type==="Customer"?"customers":"suppliers";personForm(b.dataset.type,db[k].find(x=>x.id===xid))}
    if(a==="add-cart"){const p=product(xid);if(!p||p.stock<1)return alert("Stock নেই");const old=cart.find(x=>x.id===xid);old?old.qty=Math.min(old.qty+1,p.stock):cart.push({id:xid,name:p.name,price:num(p.sale),qty:1,stock:num(p.stock)});renderCart()}
    if(a==="remove-cart"){cart=cart.filter(x=>x.id!==xid);renderCart()}
    if(a==="clear-cart"){cart=[];renderCart()}
    if(a==="complete-sale"){
      if(!cart.length)return alert("Cart খালি");
      const c=db.customers.find(x=>x.id===$("#saleCustomer").value),payment=$("#salePayment").value;
      const sub=cart.reduce((a,x)=>a+x.qty*x.price,0),discount=num($("#saleDiscount").value),total=Math.max(0,sub-discount);
      let profit=0;cart.forEach(x=>{const p=product(x.id);p.stock-=x.qty;profit+=(x.price-num(p.purchase))*x.qty});
      if(c&&payment==="Credit")c.due=num(c.due)+total;
      const s={id:id("INV"),date:date(),customer:c?.name||"Walk-in Customer",payment,total,profit:profit-discount,items:JSON.parse(JSON.stringify(cart))};
      db.sales.push(s);save();cart=[];invoice(s);
    }
    if(a==="purchase-add"){
      const p=product($("#purProduct").value),q=num($("#purQty").value),price=num($("#purPrice").value);
      if(!p||q<1)return alert("Product ও quantity দিন");
      purchaseRows.push({id:p.id,name:p.name,qty:q,price,barcodeQty:q,print:true});renderPurchase();
    }
    if(a==="purchase-remove"){purchaseRows=purchaseRows.filter(x=>x.id!==xid);renderPurchase()}
    if(a==="purchase-save"){
      if(!purchaseRows.length)return alert("Purchase list খালি");
      const s=db.suppliers.find(x=>x.id===$("#purSupplier").value),labels=[];
      purchaseRows.forEach(r=>{const p=product(r.id);p.stock+=r.qty;db.purchases.push({id:id("PUR"),date:date(),supplier:s?.name||"",name:p.name,productId:p.id,qty:r.qty,price:r.price,total:r.qty*r.price});
        if(r.print)for(let i=0;i<r.barcodeQty;i++)labels.push(p)});
      save();purchaseRows=[];render();if(labels.length)barcodePreview(labels);
    }
    if(a==="payment-save"){
      const v=$("#payPerson").value,amount=num($("#payAmount").value);if(!v||amount<1)return alert("সঠিক তথ্য দিন");
      const [t,pid]=v.split(":"),list=t==="c"?db.customers:db.suppliers,x=list.find(y=>y.id===pid);x.due=Math.max(0,num(x.due)-amount);
      const r={id:id("PAY"),date:date(),name:x.name,amount};t==="c"?db.payments.push(r):db.supplierPayments.push(r);save();render();
    }
    if(a==="adjust-save"){
      const p=product($("#adjProduct").value),q=num($("#adjQty").value),t=$("#adjType").value;
      if(!p||q<1)return alert("সঠিক তথ্য দিন");if(t==="Remove"&&p.stock<q)return alert("Stock যথেষ্ট নেই");
      p.stock+=t==="Add"?q:-q;db.adjustments.push({id:id("ADJ"),date:date(),name:p.name,qty:q,type:t,reason:$("#adjReason").value});save();render();
    }
    if(a==="return-save"){
      const p=product($("#retProduct").value),q=num($("#retQty").value);if(!p||q<1)return alert("সঠিক তথ্য দিন");
      p.stock+=q;db.returns.push({id:id("RET"),date:date(),name:p.name,qty:q,type:$("#retType").value,reason:$("#retReason").value});save();render();
    }
    if(a==="order-form")orderForm();
    if(a==="edit-order")orderForm(db.orders.find(o=>o.id===xid));
    if(a==="barcode")barcodePreview([product(xid)]);
    if(a==="barcode-setting"){db.barcodeSize=$("#barcodeSize").value;save();alert("Barcode setting saved")}
    if(a==="report-filter")render();
    if(a==="print")window.print();
    if(a==="reset"&&confirm("সব তথ্য মুছে ফেলবেন?")){localStorage.removeItem(KEY);location.reload()}

    if(a==="delete"&&confirm("এই তথ্যটি মুছে ফেলবেন?")){
      const type=b.dataset.type,item=db[type].find(z=>z.id===xid);
      if(type==="purchases"){const p=product(item.productId);if(p)p.stock=Math.max(0,p.stock-num(item.qty))}
      db[type]=db[type].filter(z=>z.id!==xid);save();render();
    }
  });

  document.addEventListener("input",e=>{
    if(e.target.id==="search")renderPOS();
    if(e.target.id==="saleDiscount")renderCart();
    if(e.target.dataset.cqty){const x=cart.find(y=>y.id===e.target.dataset.cqty);if(x)x.qty=Math.max(1,Math.min(num(e.target.value),x.stock));renderCart()}
    if(e.target.dataset.cprice){const x=cart.find(y=>y.id===e.target.dataset.cprice);if(x)x.price=Math.max(0,num(e.target.value));renderCart()}
    if(e.target.dataset.pqty){const x=purchaseRows.find(y=>y.id===e.target.dataset.pqty);if(x)x.qty=num(e.target.value)}
    if(e.target.dataset.pprice){const x=purchaseRows.find(y=>y.id===e.target.dataset.pprice);if(x)x.price=num(e.target.value)}
    if(e.target.dataset.pbarcode){const x=purchaseRows.find(y=>y.id===e.target.dataset.pbarcode);if(x)x.barcodeQty=num(e.target.value)}
  });

  document.addEventListener("change",e=>{
    if(e.target.dataset.pprint){const x=purchaseRows.find(y=>y.id===e.target.dataset.pprint);if(x)x.print=e.target.checked}
    if(e.target.dataset.status){const o=db.orders.find(y=>y.id===e.target.dataset.status);if(o){o.status=e.target.value;save();render()}}
  });

  document.addEventListener("submit",e=>{
    e.preventDefault();const f=new FormData(e.target),fid=f.get("id");

    if(e.target.id==="productForm"){
      const old=product(fid),files=[...f.getAll("images")].filter(x=>x.size).slice(0,5);
      Promise.all(files.map(file=>new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file)}))).then(images=>{
        const mrp=num(f.get("mrp")),discount=num(f.get("discount")),manual=num(f.get("sale"));
        const item={id:fid||id("PRD"),name:f.get("name"),sku:f.get("sku"),barcode:f.get("barcode")||`890${Date.now()}`,
          category:f.get("category"),purchase:num(f.get("purchase")),mrp,discount,
          sale:manual||mrp*(1-discount/100),stock:num(f.get("stock")),minimum:num(f.get("minimum")),
          images:images.length?images:(old?.images||[])};
        const i=db.products.findIndex(x=>x.id===item.id);i>=0?db.products[i]=item:db.products.push(item);
        save();closeModal();render();
      });return;
    }

    if(e.target.id==="personForm"){
      const type=f.get("type"),key=type==="Customer"?"customers":"suppliers",old=db[key].find(x=>x.id===fid),opening=num(f.get("opening"));
      const item={id:fid||id(type==="Customer"?"CUS":"SUP"),name:f.get("name"),phone:f.get("phone"),address:f.get("address"),opening,due:old?num(old.due)+opening-num(old.opening):opening};
      const i=db[key].findIndex(x=>x.id===item.id);i>=0?db[key][i]=item:db[key].push(item);
    }

    if(e.target.id==="orderForm"){
      const item={id:fid||id("ORD"),date:f.get("date")||date(),customer:f.get("customer"),phone:f.get("phone"),address:f.get("address"),amount:num(f.get("amount")),status:f.get("status")};
      const i=db.orders.findIndex(x=>x.id===item.id);i>=0?db.orders[i]=item:db.orders.push(item);
    }

    if(e.target.id==="settingsForm"){db.store=f.get("store")||"NAMITA STORE";db.phone=f.get("phone");db.address=f.get("address");save();layout()}
    save();closeModal();render();
  });

  layout();render();
  setInterval(()=>{if($("#clock"))$("#clock").textContent=new Date().toLocaleString("bn-BD")},1000);
})();
