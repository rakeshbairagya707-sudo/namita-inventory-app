(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const KEY = "namita_store_complete";
  const money = n => `₹${Number(n || 0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const uid = p => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  const today = () => new Date().toISOString().slice(0,10);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, x =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[x]));

  let db = JSON.parse(localStorage.getItem(KEY) || "null") || {
    store:"NAMITA STORE", products:[], customers:[], suppliers:[],
    sales:[], purchases:[], adjustments:[], orders:[], payments:[]
  };

  let current = "dashboard";
  let previous = "dashboard";
  let cart = [];

  const menu = {
    dashboard:"📊 Dashboard",
    sales:"🧾 Sales / POS",
    purchase:"📥 Purchase",
    products:"📦 Products & Stock",
    adjustment:"🔧 Product Adjustment",
    customers:"👥 Customers",
    suppliers:"🏭 Suppliers",
    payments:"💰 Due / Payments",
    ecommerce:"🛒 E-commerce",
    reports:"📑 Reports",
    settings:"⚙️ Settings"
  };

  const save = () => localStorage.setItem(KEY, JSON.stringify(db));

  function appLayout() {
    $("#app").innerHTML = `
      <div class="flex min-h-screen">
        <aside id="sidebar" class="sidebar w-64 shrink-0 text-white p-4">
          <div class="text-center border-b border-white/20 pb-4 mb-4">
            <h1 class="text-xl font-bold">${esc(db.store)}</h1>
            <small>Accounting & Inventory</small>
          </div>
          <nav class="space-y-1">
            ${Object.entries(menu).map(([id,name]) =>
              `<button data-page="${id}" class="nav-btn w-full text-left px-3 py-3 rounded-lg">${name}</button>`
            ).join("")}
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
        <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-5">
          <div class="flex justify-between items-center mb-4">
            <h2 id="modalTitle" class="text-xl font-bold"></h2>
            <button data-action="close-modal" class="text-2xl">×</button>
          </div>
          <div id="modalBody"></div>
        </div>
      </div>`;
  }

  function card(html, cls="") {
    return `<div class="card p-5 mb-5 ${cls}">${html}</div>`;
  }

  function stat(label,value) {
    return `<div class="card p-5"><p class="text-slate-500 text-sm">${label}</p>
      <strong class="text-2xl block mt-2">${value}</strong></div>`;
  }

  function table(headers, rows) {
    if (!rows.length) return `<p class="text-center text-slate-500 py-8">কোনো তথ্য পাওয়া যায়নি।</p>`;
    return `<div class="overflow-x-auto"><table class="w-full text-sm">
      <thead><tr class="bg-slate-50">${headers.map(h=>`<th class="p-3 text-left">${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.join("")}</tbody></table></div>`;
  }

  function row(cells) {
    return `<tr class="border-b hover:bg-slate-50">${cells.map(x=>`<td class="p-3">${x}</td>`).join("")}</tr>`;
  }

  function dashboardPage() {
    const sales = db.sales.reduce((a,x)=>a+Number(x.total),0);
    const purchases = db.purchases.reduce((a,x)=>a+Number(x.total),0);
    const profit = db.sales.reduce((a,x)=>a+Number(x.profit),0);
    const due = db.customers.reduce((a,x)=>a+Number(x.due||0),0);
    const stock = db.products.reduce((a,x)=>a+Number(x.stock)*Number(x.purchase),0);

    return `<div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
      ${stat("মোট বিক্রয়",money(sales))}
      ${stat("মোট ক্রয়",money(purchases))}
      ${stat("মোট লাভ",money(profit))}
      ${stat("Customer Due",money(due))}
      ${stat("Stock Value",money(stock))}
    </div>
    ${card(`<h2 class="font-bold text-xl mb-4">Quick Actions</h2>
      <div class="flex flex-wrap gap-2">
        <button data-page="sales" class="bg-teal-700 text-white px-4 py-2 rounded-lg">🧾 New Sale</button>
        <button data-page="purchase" class="bg-teal-700 text-white px-4 py-2 rounded-lg">📥 New Purchase</button>
        <button data-action="add-product" class="bg-teal-700 text-white px-4 py-2 rounded-lg">📦 Add Product</button>
        <button data-page="adjustment" class="bg-teal-700 text-white px-4 py-2 rounded-lg">🔧 Stock Adjustment</button>
      </div>`)}
    ${card(`<h2 class="font-bold text-xl mb-3">Low Stock Alert</h2>${
      table(["Product","SKU","Stock"],db.products.filter(x=>x.stock<=x.minimum)
      .map(x=>row([esc(x.name),esc(x.sku),x.stock])))}`)}`;
  }

  function productsPage() {
    return card(`<div class="flex flex-wrap gap-2 items-center mb-4">
      <h2 class="font-bold text-xl mr-auto">Products & Stock</h2>
      <button data-action="add-product" class="bg-teal-700 text-white px-4 py-2 rounded-lg">＋ Add Product</button>
      <button data-page="adjustment" class="bg-blue-600 text-white px-4 py-2 rounded-lg">🔧 Adjustment</button>
    </div>${table(["Name","SKU","Purchase","Sale","Stock","Status","Action"],
      db.products.map(x=>row([
        esc(x.name),esc(x.sku),money(x.purchase),money(x.sale),x.stock,
        x.stock<=x.minimum?"Low":"OK",
        `<button data-action="edit-product" data-id="${x.id}" class="text-blue-600 mr-2">Edit</button>
         <button data-action="delete-product" data-id="${x.id}" class="text-red-600">Delete</button>`
      ])))}`);
  }

  function customersPage() {
    return card(`<div class="flex items-center mb-4">
      <h2 class="font-bold text-xl mr-auto">Customers</h2>
      <button data-action="add-customer" class="bg-teal-700 text-white px-4 py-2 rounded-lg">＋ Add Customer</button>
    </div>${table(["Name","Mobile","Address","Due","Action"],db.customers.map(x=>row([
      esc(x.name),esc(x.phone),esc(x.address),money(x.due),
      `<button data-action="edit-customer" data-id="${x.id}" class="text-blue-600 mr-2">Edit</button>
       <button data-action="delete-customer" data-id="${x.id}" class="text-red-600">Delete</button>`
    ])))}`);
  }

  function suppliersPage() {
    return card(`<div class="flex items-center mb-4">
      <h2 class="font-bold text-xl mr-auto">Suppliers</h2>
      <button data-action="add-supplier" class="bg-teal-700 text-white px-4 py-2 rounded-lg">＋ Add Supplier</button>
    </div>${table(["Name","Mobile","Address","Due","Action"],db.suppliers.map(x=>row([
      esc(x.name),esc(x.phone),esc(x.address),money(x.due),
      `<button data-action="edit-supplier" data-id="${x.id}" class="text-blue-600 mr-2">Edit</button>
       <button data-action="delete-supplier" data-id="${x.id}" class="text-red-600">Delete</button>`
    ])))}`);
  }

  function salesPage() {
    return `<div class="grid lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2">
        ${card(`<h2 class="font-bold text-xl mb-3">Sales / POS</h2>
          <input id="posSearch" class="w-full border rounded-lg p-3" placeholder="Product name, SKU বা barcode search করুন">
          <div id="picker" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"></div>`)}
        ${card(`<h2 class="font-bold mb-3">Cart</h2><div id="cart"></div>`)}
      </div>
      ${card(`<h2 class="font-bold text-xl mb-3">Sale Summary</h2>
        <select id="saleCustomer" class="w-full border rounded-lg p-3 mb-3">
          <option value="">Walk-in Customer</option>
          ${db.customers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}
        </select>
        <select id="salePayment" class="w-full border rounded-lg p-3 mb-3">
          <option>Cash</option><option>UPI</option><option>Card</option><option>Credit</option>
        </select>
        <input id="discount" type="number" value="0" class="w-full border rounded-lg p-3 mb-3" placeholder="Discount">
        <div id="summary"></div>
        <button data-action="complete-sale" class="w-full bg-green-600 text-white p-3 rounded-lg">Save Sale</button>
        <button data-action="clear-cart" class="w-full border p-3 rounded-lg mt-2">Clear Cart</button>`)}
    </div>`;
  }

  function renderPOS() {
    const q = ($("#posSearch")?.value||"").toLowerCase();
    $("#picker").innerHTML = db.products.filter(x=>
      `${x.name} ${x.sku} ${x.barcode||""}`.toLowerCase().includes(q)
    ).map(x=>`<button data-action="add-cart" data-id="${x.id}" class="text-left border rounded-xl p-3 hover:border-teal-600">
      <b>${esc(x.name)}</b><small class="block text-slate-500">${esc(x.sku)} · Stock ${x.stock}</small>
      <strong>${money(x.sale)}</strong></button>`).join("") ||
      `<p class="text-slate-500">Product পাওয়া যায়নি।</p>`;
    renderCart();
  }

  function renderCart() {
    if (!$("#cart")) return;
    const subtotal=cart.reduce((a,x)=>a+x.qty*x.price,0);
    const discount=Number($("#discount")?.value||0);
    $("#cart").innerHTML=cart.length?cart.map(x=>`
      <div class="flex gap-3 items-center border-b py-2">
        <span class="mr-auto">${esc(x.name)}<small class="block">${money(x.price)}</small></span>
        <input data-qty="${x.id}" type="number" min="1" max="${x.stock}" value="${x.qty}" class="w-20 border p-2 rounded">
        <b>${money(x.qty*x.price)}</b>
        <button data-action="remove-cart" data-id="${x.id}" class="text-red-600 text-xl">×</button>
      </div>`).join(""):`<p class="text-slate-500">Cart খালি।</p>`;
    $("#summary").innerHTML=`<div class="bg-slate-50 rounded-lg p-4 leading-8">
      Subtotal: <b class="float-right">${money(subtotal)}</b><br>
      Discount: <b class="float-right">${money(discount)}</b><hr>
      <strong class="text-xl">Total <span class="float-right">${money(Math.max(0,subtotal-discount))}</span></strong>
    </div>`;
  }

  function purchasePage() {
    return card(`<h2 class="font-bold text-xl mb-4">Purchase Entry</h2>
      <select id="purchaseProduct" class="w-full border rounded-lg p-3 mb-3">
        ${db.products.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}
      </select>
      <div class="grid md:grid-cols-3 gap-3">
        <input id="purchaseQty" type="number" min="1" placeholder="Quantity" class="border rounded-lg p-3">
        <input id="purchasePrice" type="number" min="0" placeholder="Purchase Price" class="border rounded-lg p-3">
        <button data-action="save-purchase" class="bg-green-600 text-white rounded-lg">Save Purchase</button>
      </div>
      <hr class="my-5">${table(["Date","Time","Product","Qty","Total","Action"],
        db.purchases.map(x=>row([x.date,x.time,esc(x.name),x.qty,money(x.total),
          `<button data-action="delete-purchase" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function adjustmentPage() {
    return card(`<h2 class="font-bold text-xl mb-4">Product Adjustment</h2>
      <select id="adjustProduct" class="w-full border rounded-lg p-3 mb-3">
        ${db.products.map(x=>`<option value="${x.id}">${esc(x.name)} — Stock ${x.stock}</option>`).join("")}
      </select>
      <div class="grid md:grid-cols-3 gap-3">
        <select id="adjustType" class="border rounded-lg p-3"><option value="add">Stock Add</option><option value="remove">Stock Remove</option></select>
        <input id="adjustQty" type="number" min="1" placeholder="Quantity" class="border rounded-lg p-3">
        <input id="adjustReason" placeholder="Reason" class="border rounded-lg p-3">
      </div>
      <button data-action="save-adjustment" class="bg-blue-600 text-white px-5 py-3 rounded-lg mt-4">Save Adjustment</button>
      <hr class="my-5">${table(["Date","Time","Product","Type","Qty","Reason","Action"],
        db.adjustments.map(x=>row([x.date,x.time,esc(x.name),x.type,x.qty,esc(x.reason),
          `<button data-action="delete-adjustment" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function paymentsPage() {
    return card(`<h2 class="font-bold text-xl mb-4">Due / Payments</h2>
      <div class="grid md:grid-cols-3 gap-3">
        <select id="dueCustomer" class="border rounded-lg p-3">${db.customers.map(x=>
          `<option value="${x.id}">${esc(x.name)} — ${money(x.due)}</option>`).join("")}</select>
        <input id="dueAmount" type="number" min="1" placeholder="Amount" class="border rounded-lg p-3">
        <button data-action="receive-payment" class="bg-green-600 text-white rounded-lg">Save Payment</button>
      </div>
      <hr class="my-5">${table(["Date","Time","Customer","Amount","Action"],
        db.payments.map(x=>row([x.date,x.time,esc(x.name),money(x.amount),
          `<button data-action="delete-payment" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function ecommercePage() {
    return card(`<div class="flex items-center mb-4">
      <h2 class="font-bold text-xl mr-auto">E-commerce Orders</h2>
      <button data-action="add-order" class="bg-teal-700 text-white px-4 py-2 rounded-lg">＋ Add Order</button>
    </div>${table(["Date","Time","Customer","Phone","Amount","Status","Action"],
      db.orders.map(x=>row([x.date,x.time,esc(x.customer),esc(x.phone),money(x.amount),esc(x.status),
        `<button data-action="edit-order" data-id="${x.id}" class="text-blue-600 mr-2">Edit</button>
         <button data-action="delete-order" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`);
  }

  function reportsPage() {
    return `<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      ${stat("Sales",money(db.sales.reduce((a,x)=>a+x.total,0)))}
      ${stat("Profit",money(db.sales.reduce((a,x)=>a+x.profit,0)))}
      ${stat("Purchases",money(db.purchases.reduce((a,x)=>a+x.total,0)))}
      ${stat("Invoices",db.sales.length)}
    </div>${card(`<div class="flex items-center mb-4">
      <h2 class="font-bold text-xl mr-auto">Sales Report</h2>
      <button data-action="print" class="border px-4 py-2 rounded-lg">🖨 Print</button>
    </div>${table(["Invoice","Date","Time","Customer","Payment","Total","Action"],
      db.sales.map(x=>row([x.id,x.date,x.time,esc(x.customer),x.payment,money(x.total),
        `<button data-action="delete-sale" data-id="${x.id}" class="text-red-600">Delete</button>`])))}`)}`;
  }

  function settingsPage() {
    return card(`<h2 class="font-bold text-xl mb-4">Settings</h2>
      <input id="storeName" value="${esc(db.store)}" class="w-full border rounded-lg p-3 mb-3">
      <button data-action="save-settings" class="bg-teal-700 text-white px-5 py-3 rounded-lg">Save Settings</button>
      <button data-action="reset" class="bg-red-600 text-white px-5 py-3 rounded-lg">Reset All Data</button>`);
  }

  function render() {
    $("#pageTitle").textContent=menu[current];
    document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===current));
    const pages={dashboard:dashboardPage,sales:salesPage,purchase:purchasePage,products:productsPage,
      adjustment:adjustmentPage,customers:customersPage,suppliers:suppliersPage,
      payments:paymentsPage,ecommerce:ecommercePage,reports:reportsPage,settings:settingsPage};
    $("#content").innerHTML=pages[current]();
    if(current==="sales") renderPOS();
  }

  function now() {
    const d=new Date();
    return {date:d.toISOString().slice(0,10),time:d.toLocaleTimeString()};
  }

  function input(label,name,value="",type="text") {
    return `<label class="block mb-3"><span class="block mb-1">${label}</span>
      <input name="${name}" type="${type}" value="${esc(value)}" required class="w-full border rounded-lg p-3"></label>`;
  }

  function modal(title,body) {
    $("#modalTitle").textContent=title;
    $("#modalBody").innerHTML=body;
    $("#modal").classList.remove("hidden");
    $("#modal").classList.add("flex");
  }

  function closeModal() {
    $("#modal").classList.add("hidden");
    $("#modal").classList.remove("flex");
  }

  function productForm(old={}) {
    modal(old.id?"Edit Product":"Add Product",`<form id="productForm">
      ${input("Product Name","name",old.name)}
      ${input("SKU","sku",old.sku||`SKU-${Date.now()}`)}
      ${input("Barcode","barcode",old.barcode)}
      <div class="grid md:grid-cols-2 gap-3">
        ${input("Purchase Price","purchase",old.purchase||0,"number")}
        ${input("Sale Price","sale",old.sale||0,"number")}
        ${input("Stock","stock",old.stock||0,"number")}
        ${input("Minimum Stock","minimum",old.minimum||5,"number")}
      </div>
      <input type="hidden" name="id" value="${esc(old.id||"")}">
      <button class="bg-green-600 text-white px-5 py-3 rounded-lg">Save Product</button>
    </form>`);
  }

  function personForm(type,old={}) {
    modal(old.id?`Edit ${type}`:`Add ${type}`,`<form id="${type.toLowerCase()}Form">
      ${input(`${type} Name`,"name",old.name)}
      ${input("Mobile","phone",old.phone)}
      ${input("Address","address",old.address)}
      <button class="bg-green-600 text-white px-5 py-3 rounded-lg">Save</button>
    </form>`);
  }

  function orderForm(old={}) {
    modal(old.id?"Edit Order":"Add Order",`<form id="orderForm">
      ${input("Customer","customer",old.customer)}
      ${input("Phone","phone",old.phone)}
      ${input("Amount","amount",old.amount||0,"number")}
      <select name="status" class="w-full border rounded-lg p-3 mb-3">
        ${["Pending","Processing","Delivered","Cancelled"].map(x=>
          `<option ${x===old.status?"selected":""}>${x}</option>`).join("")}
      </select>
      <input type="hidden" name="id" value="${esc(old.id||"")}">
      <button class="bg-green-600 text-white px-5 py-3 rounded-lg">Save Order</button>
    </form>`);
  }

  document.addEventListener("click",e=>{
    const nav=e.target.closest("[data-page]");
    if(nav){previous=current;current=nav.dataset.page;render();$("#sidebar").classList.remove("open");return;}

    const a=e.target.closest("[data-action]");
    if(!a)return;
    const act=a.dataset.action,id=a.dataset.id;

    if(act==="menu")$("#sidebar").classList.toggle("open");
    if(act==="back"){current=previous||"dashboard";render();}
    if(act==="close-modal")closeModal();
    if(act==="add-product")productForm();
    if(act==="edit-product")productForm(db.products.find(x=>x.id===id));
    if(act==="add-customer")personForm("Customer");
    if(act==="edit-customer")personForm("Customer",db.customers.find(x=>x.id===id));
    if(act==="add-supplier")personForm("Supplier");
    if(act==="edit-supplier")personForm("Supplier",db.suppliers.find(x=>x.id===id));
    if(act==="add-order")orderForm();
    if(act==="edit-order")orderForm(db.orders.find(x=>x.id===id));

    if(act.startsWith("delete-")&&confirm("এই তথ্যটি মুছে ফেলবেন?")){
      const map={product:"products",customer:"customers",supplier:"suppliers",order:"orders",
        purchase:"purchases",adjustment:"adjustments",payment:"payments",sale:"sales"};
      const type=act.replace("delete-","");
      if(map[type])db[map[type]]=db[map[type]].filter(x=>x.id!==id);
      save();render();
    }

    if(act==="add-cart"){
      const p=db.products.find(x=>x.id===id);
      if(!p||p.stock<1)return alert("Stock নেই।");
      const old=cart.find(x=>x.id===id);
      if(old)old.qty=Math.min(old.qty+1,p.stock);
      else cart.push({id:p.id,name:p.name,price:Number(p.sale),qty:1,stock:Number(p.stock)});
      renderCart();
    }

    if(act==="remove-cart"){cart=cart.filter(x=>x.id!==id);renderCart();}
    if(act==="clear-cart"){cart=[];renderCart();}
    if(act==="complete-sale"){
      if(!cart.length)return alert("Cart খালি।");
      const customer=db.customers.find(x=>x.id===$("#saleCustomer").value);
      const discount=Number($("#discount").value||0);
      const subtotal=cart.reduce((a,x)=>a+x.qty*x.price,0);
      const total=Math.max(0,subtotal-discount);
      let profit=0;
      cart.forEach(x=>{const p=db.products.find(y=>y.id===x.id);p.stock-=x.qty;profit+=(x.price-p.purchase)*x.qty;});
      if(customer&&$("#salePayment").value==="Credit")customer.due=Number(customer.due||0)+total;
      const t=now();
      db.sales.push({id:uid("INV"),...t,customer:customer?.name||"Walk-in",payment:$("#salePayment").value,total,profit:profit-discount,items:cart});
      cart=[];save();current="dashboard";render();alert("Sale সংরক্ষণ হয়েছে।");
    }

    if(act==="save-purchase"){
      const p=db.products.find(x=>x.id===$("#purchaseProduct").value),qty=Number($("#purchaseQty").value),price=Number($("#purchasePrice").value);
      if(!p||qty<1)return alert("সঠিক তথ্য দিন।");
      p.stock+=qty;const t=now();db.purchases.push({id:uid("PUR"),...t,name:p.name,qty,total:qty*price});save();render();alert("Purchase সংরক্ষণ হয়েছে।");
    }

    if(act==="save-adjustment"){
      const p=db.products.find(x=>x.id===$("#adjustProduct").value),qty=Number($("#adjustQty").value);
      if(!p||qty<1)return alert("সঠিক তথ্য দিন।");
      const type=$("#adjustType").value;if(type==="add")p.stock+=qty;else p.stock=Math.max(0,p.stock-qty);
      const t=now();db.adjustments.push({id:uid("ADJ"),...t,name:p.name,qty,type:type==="add"?"Add":"Remove",reason:$("#adjustReason").value});
      save();render();alert("Adjustment সংরক্ষণ হয়েছে।");
    }

    if(act==="receive-payment"){
      const c=db.customers.find(x=>x.id===$("#dueCustomer").value),amount=Number($("#dueAmount").value);
      if(!c||amount<1)return alert("সঠিক তথ্য দিন।");
      c.due=Math.max(0,Number(c.due)-amount);const t=now();db.payments.push({id:uid("PAY"),...t,name:c.name,amount});save();render();alert("Payment সংরক্ষণ হয়েছে।");
    }

    if(act==="save-settings"){db.store=$("#storeName").value||"NAMITA STORE";save();appLayout();render();}
    if(act==="print")window.print();
    if(act==="reset"&&confirm("সব তথ্য মুছে ফেলবেন?")){localStorage.removeItem(KEY);location.reload();}
  });

  document.addEventListener("input",e=>{
    if(e.target.id==="posSearch")renderPOS();
    if(e.target.id==="discount")renderCart();
  });

  document.addEventListener("change",e=>{
    if(e.target.dataset.qty){
      const x=cart.find(y=>y.id===e.target.dataset.qty);
      if(x)x.qty=Math.max(1,Math.min(Number(e.target.value),x.stock));
      renderCart();
    }
  });

  document.addEventListener("submit",e=>{
    e.preventDefault();
    const f=new FormData(e.target),id=f.get("id"),t=now();

    if(e.target.id==="productForm"){
      const x={id:id||uid("PRD"),name:f.get("name"),sku:f.get("sku"),barcode:f.get("barcode"),
        purchase:Number(f.get("purchase")),sale:Number(f.get("sale")),stock:Number(f.get("stock")),minimum:Number(f.get("minimum"))};
      const i=db.products.findIndex(y=>y.id===x.id);i>=0?db.products[i]=x:db.products.push(x);
    }

    if(e.target.id==="customerForm"||e.target.id==="supplierForm"){
      const type=e.target.id==="customerForm"?"customers":"suppliers";
      const x={id:id||uid(type==="customers"?"CUS":"SUP"),name:f.get("name"),phone:f.get("phone"),address:f.get("address"),due:0};
      const i=db[type].findIndex(y=>y.id===x.id);i>=0?db[type][i]={...db[type][i],...x}:db[type].push(x);
    }

    if(e.target.id==="orderForm"){
      const x={id:id||uid("ORD"),...t,customer:f.get("customer"),phone:f.get("phone"),amount:Number(f.get("amount")),status:f.get("status")};
      const i=db.orders.findIndex(y=>y.id===x.id);i>=0?db.orders[i]=x:db.orders.push(x);
    }

    save();closeModal();render();
  });

  appLayout();
  render();
  setInterval(()=>{if($("#clock"))$("#clock").textContent=new Date().toLocaleString("bn-BD");},1000);
})();
