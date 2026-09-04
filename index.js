(()=>{"use strict";

const $=s=>document.querySelector(s);
const KEY="namita_store_complete";
const money=v=>`₹${Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
const num=v=>Number(v||0);
const uid=p=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const today=()=>new Date().toISOString().slice(0,10);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));

let db=JSON.parse(localStorage.getItem(KEY)||"null")||{
  store:"NAMITA STORE",phone:"",address:"",
  products:[],customers:[],suppliers:[],sales:[],purchases:[],
  orders:[],payments:[],supplierPayments:[],returns:[],adjustments:[],
  barcodeSize:"25x38"
};

["products","customers","suppliers","sales","purchases","orders","payments",
"supplierPayments","returns","adjustments"].forEach(k=>db[k]||=[]);
db.barcodeSize||=db.settings?.barcodeSize||"25x38";

db.products.forEach(p=>{
  p.id||=uid("PRD");p.stock=num(p.stock);p.minimum=num(p.minimum)||5;
  p.purchase=num(p.purchase);p.mrp=num(p.mrp)||num(p.sale);p.sale=num(p.sale)||num(p.mrp);
  p.discount=num(p.discount);p.barcode||=`890${Date.now()}`;
  p.images||=(p.image?[p.image]:[]);
});
db.customers.forEach(x=>{x.opening=num(x.opening);x.due=num(x.due)});
db.suppliers.forEach(x=>{x.opening=num(x.opening);x.due=num(x.due)});

let page="dashboard",cart=[],purchaseRows=[];

const menu={
 dashboard:"📊 Dashboard",sales:"🧾 POS / Sales",purchase:"📥 Purchase",
 products:"📦 Products & Stock",customers:"👥 Customers",suppliers:"🏭 Suppliers",
 payments:"💰 Payments",ecommerce:"🛒 E-commerce",returns:"🔁 Return / Exchange",
 adjustments:"🔧 Adjustment",reports:"📑 Reports",settings:"⚙️ Settings"
};

function product(id){return db.products.find(p=>p.id===id)}
function card(x){return `<div class="card p-5 mb-5">${x}</div>`}
function field(label,name,value="",type="text"){
 return `<label class="block mb-3">${label}<input name="${name}" type="${type}" value="${esc(value)}" class="w-full border rounded-lg p-3 mt-1"></label>`
}
function row(a){return `<tr class="border-b hover:bg-slate-50">${a.map(x=>`<td class="p-3">${x}</td>`).join("")}</tr>`}
function table(head,rows){
 return rows.length?`<div class="overflow-x-auto"><table class="w-full text-sm">
 <thead><tr class="bg-slate-100">${head.map(x=>`<th class="p-3 text-left">${x}</th>`).join("")}</tr></thead>
 <tbody>${rows.join("")}</tbody></table></div>`:
 `<p class="text-center text-slate-500 py-8">কোনো তথ্য নেই।</p>`
}
function showModal(title,html){
 $("#modalTitle").textContent=title;$("#modalBody").innerHTML=html;
 $("#modal").className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4";
}
function closeModal(){$("#modal").className="hidden"}

function layout(){
 $("#app").innerHTML=`<div class="flex min-h-screen">
 <aside id="sidebar" class="sidebar w-64 shrink-0 p-4 text-white">
  <h1 class="text-xl font-bold text-center">${esc(db.store)}</h1>
  <p class="text-center text-sm border-b border-white/20 pb-4 mb-4">Accounting & Inventory</p>
  <nav class="space-y-1">${Object.entries(menu).map(([k,v])=>
   `<button data-page="${k}" class="nav-btn w-full text-left p-3 rounded-lg">${v}</button>`).join("")}</nav>
 </aside>
 <main class="flex-1 min-w-0">
  <header class="bg-white border-b p-4 flex gap-2 items-center sticky top-0 z-20">
   <button data-action="menu" class="bg-teal-700 text-white px-3 py-2 rounded">☰</button>
   <button data-action="home" class="border px-3 py-2 rounded">← Back</button>
   <h2 id="title" class="font-bold text-lg mr-auto"></h2><span id="clock"></span>
  </header>
  <section id="content" class="p-4 md:p-7"></section>
 </main></div>
 <div id="modal" class="hidden fixed inset-0 z-50">
  <div class="bg-white rounded-2xl p-5 w-full max-w-4xl max-h-[94vh] overflow-auto">
   <div class="flex justify-between mb-4"><h2 id="modalTitle" class="text-xl font-bold"></h2>
   <button data-action="close" class="text-2xl">×</button></div><div id="modalBody"></div>
  </div>
 </div>`;
}

function dashboard(){
 const sales=db.sales.reduce((a,x)=>a+num(x.total),0);
 const purchases=db.purchases.reduce((a,x)=>a+num(x.total),0);
 const profit=db.sales.reduce((a,x)=>a+num(x.profit),0);
 const due=db.customers.reduce((a,x)=>a+num(x.due),0);
 return `<div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
 ${[["মোট বিক্রয়",sales],["মোট ক্রয়",purchases],["মোট লাভ",profit],["Customer Due",due],["মোট পণ্য",db.products.length]]
 .map(x=>`<div class="card p-5"><small>${x[0]}</small><b class="text-2xl block mt-2">${typeof x[1]=="number"&&x[0]!="মোট পণ্য"?money(x[1]):x[1]}</b></div>`).join("")}</div>
 ${card(`<div class="flex flex-wrap gap-2">
 <button data-page="sales" class="bg-teal-700 text-white p-3 rounded">🧾 New Sale</button>
 <button data-page="purchase" class="bg-blue-600 text-white p-3 rounded">📥 New Purchase</button>
 <button data-action="product-form" class="bg-violet-600 text-white p-3 rounded">📦 Add Product</button>
 </div>`)}
 ${card(`<h2 class="font-bold mb-3">Low Stock</h2>${table(["Product","SKU","Stock"],
 db.products.filter(p=>p.stock<=p.minimum).map(p=>row([esc(p.name),esc(p.sku),p.stock])))}`)}
`;
}

function productForm(old={}){
 showModal(old.id?"Edit Product":"Add Product",`<form id="productForm">
 ${field("Product Name","name",old.name)}<div class="grid md:grid-cols-2 gap-3">
 ${field("SKU","sku",old.sku||"SKU-"+Date.now())}
 ${field("Barcode","barcode",old.barcode||"")}
 ${field("Category","category",old.category)}
 ${field("Purchase Price","purchase",old.purchase,"number")}
 ${field("MRP","mrp",old.mrp,"number")}
 ${field("Discount %","discount",old.discount,"number")}
 ${field("Sale Price","sale",old.sale,"number")}
 ${field("Stock","stock",old.stock,"number")}
 ${field("Minimum Stock","minimum",old.minimum||5,"number")}</div>
 <label class="block mb-3">Product Images — সর্বোচ্চ ৫টি
 <input name="images" type="file" accept="image/*" multiple class="w-full border rounded-lg p-3 mt-1"></label>
 <div class="flex flex-wrap gap-2">${(old.images||[]).map(x=>`<img src="${x}" class="w-20 h-20 object-cover rounded">`).join("")}</div>
 <input type="hidden" name="id" value="${esc(old.id||"")}">
 <button class="bg-green-600 text-white px-5 py-3 rounded">Save Product</button></form>`);
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
 <button data-action="customer-form" class="bg-blue-600 text-white p-2 rounded">＋ Customer</button></div>
 <input id="search" class="w-full border-2 border-teal-200 rounded-lg p-3" placeholder="নাম, SKU বা barcode search করুন">
 <div id="picker" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"></div>`)}
 ${card(`<h2 class="font-bold mb-3">Cart</h2><div id="cart"></div>`)}</div>
 ${card(`<h2 class="font-bold text-xl mb-3">Bill</h2>
 <select id="saleCustomer" class="w-full border p-3 rounded mb-3"><option value="">Walk-in Customer</option>
 ${db.customers.map(x=>`<option value="${x.id}">${esc(x.name)} — ${esc(x.phone)}</option>`).join("")}</select>
 <select id="salePayment" class="w-full border p-3 rounded mb-3"><option>Cash</option><option>UPI</option><option>Online</option><option>Card</option><option>Credit</option><option>Exchange</option></select>
 <input id="saleDiscount" type="number" value="0" class="w-full border p-3 rounded mb-3" placeholder="Bill Discount">
 <div id="summary"></div><button data-action="complete-sale" class="w-full bg-green-600 text-white p-3 rounded mt-3">Complete Bill</button>
 <button data-action="clear-cart" class="w-full border p-3 rounded mt-2">Clear Cart</button>`)}</div>`;
}

function renderPOS(){
 const q=($("#search")?.value||"").toLowerCase();
 $("#picker").innerHTML=db.products.filter(p=>`${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(q)).map(p=>`
 <button data-action="add-cart" data-id="${p.id}" class="text-left border-2 rounded-xl p-3 bg-teal-50">
 ${p.images?.[0]?`<img src="${p.images[0]}" class="w-full h-20 object-cover rounded mb-2">`:""}
 <b>${esc(p.name)}</b><small class="block">Stock: ${p.stock}</small><small>MRP ${money(p.mrp)}</small>
 <strong class="block text-teal-700">${money(p.sale)}</strong></button>`).join("")||"<p>Product পাওয়া যায়নি।</p>";
 renderCart();
}
function renderCart(){
 if(!$("#cart"))return;
 const sub=cart.reduce((a,x)=>a+x.qty*x.price,0),dis=num($("#saleDiscount")?.value),total=Math.max(0,sub-dis);
 $("#cart").innerHTML=cart.length?cart.map(x=>`<div class="flex gap-2 items-center border-2 border-teal-100 rounded p-2 mb-2">
 <b class="mr-auto">${esc(x.name)}</b><input data-cqty="${x.id}" value="${x.qty}" type="number" min="1" max="${x.stock}" class="w-16 border p-2 rounded">
 <input data-cprice="${x.id}" value="${x.price}" type="number" min="0" class="w-24 border p-2 rounded">
 <b>${money(x.qty*x.price)}</b><button data-action="remove-cart" data-id="${x.id}" class="text-red-600 text-xl">×</button></div>`).join(""):"<p>Cart খালি।</p>";
 $("#summary").innerHTML=`<div class="bg-slate-50 p-4">Subtotal: <b class="float-right">${money(sub)}</b><br>Discount: <b class="float-right">${money(dis)}</b><hr><b>Total <span class="float-right">${money(total)}</span></b></div>`;
}

function purchase(){
 return card(`<h2 class="font-bold text-xl mb-4">Bulk Purchase Entry</h2>
 <div class="grid md:grid-cols-4 gap-2"><select id="purSupplier" class="border p-3 rounded"><option value="">Supplier</option>
 ${db.suppliers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>
 <select id="purProduct" class="border p-3 rounded"><option value="">Product</option>
 ${db.products.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>
 <input id="purQty" type="number" value="1" min="1" class="border p-3 rounded"><input id="purPrice" type="number" min="0" class="border p-3 rounded"></div>
 <button data-action="purchase-add" class="bg-blue-600 text-white p-3 rounded mt-3">＋ Add Row</button>
 <div id="purchaseRows" class="mt-4"></div><button data-action="purchase-save" class="bg-green-600 text-white p-3 rounded mt-4">Save All Purchase</button>
 <hr class="my-5">${table(["Date","Supplier","Product","Qty","Total","Action"],db.purchases.map(x=>row([
 x.date,esc(x.supplier),esc(x.name),x.qty,money(x.total),
 `<button data-action="delete" data-type="purchases" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
}
function renderPurchase(){
 if(!$("#purchaseRows"))return;
 $("#purchaseRows").innerHTML=purchaseRows.length?table(["Product","Qty","Price","Barcode Qty","Print","Action"],
 purchaseRows.map(x=>row([esc(x.name),`<input data-pq="${x.id}" value="${x.qty}" type="number" class="w-16 border p-1">`,
 `<input data-pp="${x.id}" value="${x.price}" type="number" class="w-24 border p-1">`,
 `<input data-pb="${x.id}" value="${x.bqty}" type="number" class="w-16 border p-1">`,
 `<input data-pr="${x.id}" type="checkbox" checked>`,`<button data-action="purchase-remove" data-id="${x.id}" class="text-red-600">Delete</button>`])))
 :"<p>কোনো row নেই।</p>";
}

function people(type){
 const key=type==="Customer"?"customers":"suppliers";
 return card(`<div class="flex items-center mb-4"><h2 class="font-bold text-xl mr-auto">${type}s</h2>
 <button data-action="person-form" data-type="${type}" class="bg-teal-700 text-white p-3 rounded">＋ Add ${type}</button></div>
 ${table(["Name","Phone","Address","Opening","Due","Action"],db[key].map(x=>row([
 esc(x.name),esc(x.phone),esc(x.address),money(x.opening),money(x.due),
 `<button data-action="edit-person" data-type="${type}" data-id="${x.id}" class="text-blue-600 mr-2">Edit</button>
 <button data-action="delete" data-type="${key}" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
}
function personForm(type,old={}){
 showModal(old.id?"Edit "+type:"Add "+type,`<form id="personForm">${field("Name","name",old.name)}
 ${field("Phone","phone",old.phone)}${field("Address","address",old.address)}${field("Opening Balance","opening",old.opening,"number")}
 <input type="hidden" name="id" value="${esc(old.id||"")}"><input type="hidden" name="type" value="${type}">
 <button class="bg-green-600 text-white p-3 rounded">Save</button></form>`);
}

function payments(){
 return card(`<h2 class="font-bold text-xl mb-4">Customer Receive / Supplier Payment</h2>
 <div class="grid md:grid-cols-3 gap-2"><select id="payPerson" class="border p-3 rounded"><option value="">Select Person</option>
 ${db.customers.map(x=>`<option value="c:${x.id}">Customer: ${esc(x.name)}</option>`).join("")}
 ${db.suppliers.map(x=>`<option value="s:${x.id}">Supplier: ${esc(x.name)}</option>`).join("")}</select>
 <input id="payAmount" type="number" min="1" class="border p-3 rounded" placeholder="Amount">
 <button data-action="payment-save" class="bg-green-600 text-white rounded">Save Payment</button></div><hr class="my-5">
 ${table(["Date","Type","Name","Amount","Action"],[...db.payments.map(x=>row([x.date,"Receive",esc(x.name),money(x.amount),`<button data-action="pay-delete" data-id="${x.id}" data-kind="c" class="text-red-600">Delete</button>`])),
 ...db.supplierPayments.map(x=>row([x.date,"Supplier Payment",esc(x.name),money(x.amount),`<button data-action="pay-delete" data-id="${x.id}" data-kind="s" class="text-red-600">Delete</button>`]))])}`);
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
 showModal(old.id?"Edit Order":"Add Order",`<form id="orderForm">${field("Customer Name","customer",old.customer)}
 ${field("Phone","phone",old.phone)}${field("Address","address",old.address)}${field("Amount","amount",old.amount,"number")}
 <label class="block mb-3">Date<input name="date" type="date" value="${old.date||today()}" class="w-full border p-3 rounded mt-1"></label>
 <select name="status" class="w-full border p-3 rounded mb-3">${["Pending","Accepted","Processing","Delivered","Cancelled"].map(s=>`<option ${s===old.status?"selected":""}>${s}</option>`).join("")}</select>
 <input type="hidden" name="id" value="${esc(old.id||"")}"><button class="bg-green-600 text-white p-3 rounded">Save Order</button></form>`);
}

function returnsPage(){
 return card(`<h2 class="font-bold text-xl mb-4">Return / Exchange</h2>
 <div class="grid md:grid-cols-4 gap-2"><select id="retProduct" class="border p-3 rounded">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select>
 <input id="retQty" type="number" value="1" min="1" class="border p-3 rounded"><select id="retType" class="border p-3 rounded"><option>Return</option><option>Exchange</option></select>
 <input id="retReason" class="border p-3 rounded" placeholder="Reason"></div>
 <button data-action="return-save" class="bg-orange-600 text-white p-3 rounded mt-3">Save</button><hr class="my-5">
 ${table(["Date","Product","Qty","Type","Reason","Action"],db.returns.map(x=>row([
 x.date,esc(x.name),x.qty,x.type,esc(x.reason),`<button data-action="delete" data-type="returns" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
}

function adjustments(){
 return card(`<h2 class="font-bold text-xl mb-4">Product Adjustment</h2><select id="adjProduct" class="border p-3 rounded w-full mb-3">
 ${db.products.map(p=>`<option value="${p.id}">${esc(p.name)} — ${p.stock}</option>`).join("")}</select>
 <div class="grid md:grid-cols-3 gap-2"><select id="adjType" class="border p-3 rounded"><option>Add</option><option>Remove</option></select>
 <input id="adjQty" type="number" min="1" class="border p-3 rounded"><input id="adjReason" class="border p-3 rounded" placeholder="Reason"></div>
 <button data-action="adjust-save" class="bg-blue-600 text-white p-3 rounded mt-3">Save Adjustment</button>`);
}

function settings(){
 return card(`<h2 class="font-bold text-xl mb-4">Settings</h2><h3 class="font-bold text-teal-700">Company Details</h3>
 <form id="settingsForm">${field("Store Name","store",db.store)}${field("Phone","phone",db.phone)}${field("Address","address",db.address)}
 <button class="bg-teal-700 text-white p-3 rounded">Save Company Details</button></form>
 <h3 class="font-bold text-teal-700 mt-6 mb-2">Barcode Settings</h3>
 <select id="barcodeSize" class="border p-3 rounded w-full mb-3">${["15x25-4line","25x50-1line","25x38","small"].map(x=>`<option ${x===db.barcodeSize?"selected":""}>${x}</option>`).join("")}</select>
 <button data-action="barcode-setting" class="bg-blue-600 text-white p-3 rounded">Save Barcode Setting</button>
 <button data-action="reset" class="bg-red-600 text-white p-3 rounded ml-2">Reset All Data</button>`);
}

function reports(){
 const from=$("#from")?.value||"",to=$("#to")?.value||"";
 const ss=db.sales.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));
 return `<div class="flex gap-2 mb-5"><input id="from" type="date" value="${from}" class="border p-2 rounded">
 <input id="to" type="date" value="${to}" class="border p-2 rounded"><button data-action="report-filter" class="bg-teal-700 text-white p-2 rounded">Filter</button></div>
 ${card(`<h2 class="font-bold text-xl mb-3">Sales Report</h2>${table(["Date","Invoice","Customer","Payment","Total"],ss.map(x=>row([x.date,x.id,esc(x.customer),x.payment,money(x.total)])))}
 <button data-action="print" class="border p-2 rounded mt-3">🖨 Print</button>`)}`;
}

function barcodePreview(items){
 if(!items.length)return alert("Product পাওয়া যায়নি।");
 showModal("Barcode Preview",`<div class="print-area">${items.map(p=>`<div class="barcode">
 <b>${esc(p.name)}</b><svg data-code="${esc(p.barcode)}"></svg><small>${esc(p.barcode)}<br>${money(p.sale)}</small></div>`).join("")}</div>
 <button data-action="print" class="bg-green-600 text-white p-3 rounded mt-3">🖨 Print Barcode</button>`);
 setTimeout(()=>document.querySelectorAll("svg[data-code]").forEach(x=>JsBarcode(x,x.dataset.code,{format:"CODE128",width:1,height:22,displayValue:false,margin:1})),100);
}

function invoice(s){
 showModal("Invoice Preview",`<div class="print-area p-5"><h1 class="text-2xl font-bold">${esc(db.store)}</h1>
 <p>${esc(db.phone)} ${esc(db.address)}</p><hr><p>Invoice: ${s.id} | Date: ${s.date}</p><p>Customer: ${esc(s.customer)}</p>
 ${table(["Product","Qty","Price","Total"],s.items.map(x=>row([esc(x.name),x.qty,money(x.price),money(x.qty*x.price)])))}
 <h2 class="text-right text-xl font-bold">Total: ${money(s.total)}</h2></div>
 <button data-action="print" class="bg-green-600 text-white p-3 rounded mt-3">🖨 Print Invoice</button>`);
}

function render(){
 $("#title").textContent=menu[page];
 document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 const pages={dashboard,sales,purchase,products,customers:()=>people("Customer"),suppliers:()=>people("Supplier"),
 payments,ecommerce,returns:returnsPage,adjustments,reports,settings};
 $("#content").innerHTML=pages[page]();
 if(page==="sales")renderPOS();
 if(page==="purchase")renderPurchase();
}

document.addEventListener("click",e=>{
 const p=e.target.closest("[data-page]");
 if(p){page=p.dataset.page;render();$("#sidebar").classList.remove("open");return}
 const b=e.target.closest("[data-action]");if(!b)return;
 const a=b.dataset.action,xid=b.dataset.id;

 if(a==="menu")$("#sidebar").classList.toggle("open");
 if(a==="home"){page="dashboard";render()}
 if(a==="close")closeModal();
 if(a==="product-form")productForm();
 if(a==="edit-product")productForm(product(xid));
 if(a==="customer-form")personForm("Customer");
 if(a==="person-form")personForm(b.dataset.type);
 if(a==="edit-person"){const k=b.dataset.type==="Customer"?"customers":"suppliers";personForm(b.dataset.type,db[k].find(x=>x.id===xid))}
 if(a==="add-cart"){const p=product(xid);if(!p||p.stock<1)return alert("Stock নেই");const old=cart.find(x=>x.id===xid);old?old.qty=Math.min(old.qty+1,p.stock):cart.push({id:xid,name:p.name,price:p.sale,qty:1,stock:p.stock});renderCart()}
 if(a==="remove-cart"){cart=cart.filter(x=>x.id!==xid);renderCart()}
 if(a==="clear-cart"){cart=[];renderCart()}
 if(a==="complete-sale"){
  if(!cart.length)return alert("Cart খালি।");
  const c=db.customers.find(x=>x.id===$("#saleCustomer").value),pay=$("#salePayment").value;
  const sub=cart.reduce((a,x)=>a+x.qty*x.price,0),dis=num($("#saleDiscount").value),total=Math.max(0,sub-dis);
  let profit=0;cart.forEach(x=>{const p=product(x.id);p.stock-=x.qty;profit+=(x.price-p.purchase)*x.qty});
  if(c&&pay==="Credit")c.due+=total;
  const s={id:uid("INV"),date:today(),customer:c?.name||"Walk-in Customer",payment:pay,total,profit:profit-dis,items:JSON.parse(JSON.stringify(cart))};
  db.sales.push(s);save();cart=[];invoice(s);
 }
 if(a==="purchase-add"){const p=product($("#purProduct").value),q=num($("#purQty").value),price=num($("#purPrice").value);if(!p||q<1)return alert("তথ্য দিন");purchaseRows.push({id:p.id,name:p.name,qty:q,price,bqty:q});renderPurchase()}
 if(a==="purchase-remove"){purchaseRows=purchaseRows.filter(x=>x.id!==xid);renderPurchase()}
 if(a==="purchase-save"){
  if(!purchaseRows.length)return alert("Purchase list খালি।");
  const s=db.suppliers.find(x=>x.id===$("#purSupplier").value);
  purchaseRows.forEach(r=>{const p=product(r.id);p.stock+=r.qty;db.purchases.push({id:uid("PUR"),date:today(),supplier:s?.name||"",name:p.name,productId:p.id,qty:r.qty,total:r.qty*r.price})});
  save();purchaseRows=[];render();alert("Purchase সংরক্ষণ হয়েছে।");
 }
 if(a==="payment-save"){
  const v=$("#payPerson").value,amount=num($("#payAmount").value);if(!v||amount<1)return alert("তথ্য দিন");
  const [t,pid]=v.split(":"),list=t==="c"?db.customers:db.suppliers,x=list.find(y=>y.id===pid);x.due=Math.max(0,x.due-amount);
  (t==="c"?db.payments:db.supplierPayments).push({id:uid("PAY"),date:today(),name:x.name,amount});save();render();
 }
 if(a==="return-save"){const p=product($("#retProduct").value),q=num($("#retQty").value);if(!p||q<1)return alert("তথ্য দিন");p.stock+=q;db.returns.push({id:uid("RET"),date:today(),name:p.name,qty:q,type:$("#retType").value,reason:$("#retReason").value});save();render()}
 if(a==="adjust-save"){const p=product($("#adjProduct").value),q=num($("#adjQty").value),t=$("#adjType").value;if(!p||q<1)return alert("তথ্য দিন");p.stock+=t==="Add"?q:-q;db.adjustments.push({id:uid("ADJ"),date:today(),name:p.name,qty:q,type:t,reason:$("#adjReason").value});save();render()}
 if(a==="order-form")orderForm();
 if(a==="edit-order")orderForm(db.orders.find(x=>x.id===xid));
 if(a==="barcode")barcodePreview([product(xid)]);
 if(a==="barcode-setting"){db.barcodeSize=$("#barcodeSize").value;save();alert("Barcode setting saved")}
 if(a==="report-filter")render();
 if(a==="print")window.print();
 if(a==="reset"&&confirm("সব তথ্য মুছে ফেলবেন?")){localStorage.removeItem(KEY);location.reload()}
 if(a==="pay-delete"){const list=b.dataset.kind==="c"?db.payments:db.supplierPayments;const z=list.findIndex(x=>x.id===xid);if(z>=0)list.splice(z,1);save();render()}
 if(a==="delete"&&confirm("এই তথ্যটি মুছে ফেলবেন?")){db[b.dataset.type]=db[b.dataset.type].filter(x=>x.id!==xid);save();render()}
});

document.addEventListener("input",e=>{
 if(e.target.id==="search")renderPOS();
 if(e.target.id==="saleDiscount")renderCart();
 if(e.target.dataset.cqty){const x=cart.find(y=>y.id===e.target.dataset.cqty);if(x)x.qty=Math.max(1,Math.min(num(e.target.value),x.stock));renderCart()}
 if(e.target.dataset.cprice){const x=cart.find(y=>y.id===e.target.dataset.cprice);if(x)x.price=num(e.target.value);renderCart()}
 if(e.target.dataset.pq){const x=purchaseRows.find(y=>y.id===e.target.dataset.pq);if(x)x.qty=num(e.target.value)}
 if(e.target.dataset.pp){const x=purchaseRows.find(y=>y.id===e.target.dataset.pp);if(x)x.price=num(e.target.value)}
 if(e.target.dataset.pb){const x=purchaseRows.find(y=>y.id===e.target.dataset.pb);if(x)x.bqty=num(e.target.value)}
});

document.addEventListener("change",e=>{
 if(e.target.dataset.status){const o=db.orders.find(x=>x.id===e.target.dataset.status);if(o){o.status=e.target.value;save()}}
});

document.addEventListener("submit",e=>{
 e.preventDefault();const f=new FormData(e.target),fid=f.get("id");

 if(e.target.id==="productForm"){
  const old=product(fid),files=[...f.getAll("images")].filter(x=>x.size).slice(0,5);
  Promise.all(files.map(file=>new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file)}))).then(images=>{
   const mrp=num(f.get("mrp")),dis=num(f.get("discount")),manual=num(f.get("sale"));
   const item={id:fid||uid("PRD"),name:f.get("name"),sku:f.get("sku"),barcode:f.get("barcode")||`890${Date.now()}`,
    category:f.get("category"),purchase:num(f.get("purchase")),mrp,discount:dis,
    sale:manual||mrp*(1-dis/100),stock:num(f.get("stock")),minimum:num(f.get("minimum"))||5,
    images:images.length?images:(old?.images||[])};
   const i=db.products.findIndex(x=>x.id===item.id);i>=0?db.products[i]=item:db.products.push(item);
   save();closeModal();render();
  });return;
 }

 if(e.target.id==="personForm"){
  const type=f.get("type"),key=type==="Customer"?"customers":"suppliers",old=db[key].find(x=>x.id===fid);
  const opening=num(f.get("opening")),item={id:fid||uid(type==="Customer"?"CUS":"SUP"),name:f.get("name"),phone:f.get("phone"),address:f.get("address"),opening,due:old?old.due+opening-old.opening:opening};
  const i=db[key].findIndex(x=>x.id===item.id);i>=0?db[key][i]=item:db[key].push(item);
 }
 if(e.target.id==="orderForm"){
  const item={id:fid||uid("ORD"),date:f.get("date")||today(),customer:f.get("customer"),phone:f.get("phone"),address:f.get("address"),amount:num(f.get("amount")),status:f.get("status")};
  const i=db.orders.findIndex(x=>x.id===item.id);i>=0?db.orders[i]=item:db.orders.push(item);
 }
 if(e.target.id==="settingsForm"){db.store=f.get("store")||"NAMITA STORE";db.phone=f.get("phone");db.address=f.get("address");save();layout()}
 save();closeModal();render();
});

layout();render();
setInterval(()=>{if($("#clock"))$("#clock").textContent=new Date().toLocaleString("bn-BD")},1000);
})();
