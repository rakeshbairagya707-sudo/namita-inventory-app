// Global State
const state = {
    customers: [],
    suppliers: []
};

// Helper Functions
function savedData() {
    localStorage.setItem('namita_customers', JSON.stringify(state.customers));
    localStorage.setItem('namita_suppliers', JSON.stringify(state.suppliers));
}

function loadData() {
    const savedCustomers = localStorage.getItem('namita_customers');
    const savedSuppliers = localStorage.getItem('namita_suppliers');
    
    if (savedCustomers) state.customers = JSON.parse(savedCustomers);
    if (savedSuppliers) state.suppliers = JSON.parse(savedSuppliers);
    
    renderCustomers();
    renderSuppliers();
}

// Print Window Function
function printBarcode(product) {
    const printWindow = window.open('', '_blank', 'width=300,height=300');
    if (printWindow) {
        printWindow.document.write(`
            <h3>NAMITA STORE</h3>
            <p>${product.name}</p>
            <h2>||||||||||||||||||</h2>
            <p>${product.barcode}</p>
        `);
        printWindow.print();
        printWindow.close();
    }
}

// Customer Operations
function renderCustomers() {
    const customerTable = document.getElementById('customerTable');
    if (customerTable) {
        customerTable.innerHTML = state.customers.map(c => 
            `<tr>
                <td>${c.name}</td>
                <td>${c.phone}</td>
                <td><button onclick="deleteCustomer('${c.id}')">Delete</button></td>
            </tr>`
        ).join('');
    }
}

function openCustomerModal() {
    const name = prompt("Customer Name:");
    const phone = prompt("Phone:");
    if (name) {
        state.customers.push({ id: 'CUST-' + Date.now(), name, phone });
        savedData();
        renderCustomers();
    }
}

function deleteCustomer(id) {
    state.customers = state.customers.filter(c => c.id !== id);
    savedData();
    renderCustomers();
}

// Supplier Operations
function renderSuppliers() {
    const supplierTable = document.getElementById('supplierTable');
    if (supplierTable) {
        supplierTable.innerHTML = state.suppliers.map(s => 
            `<tr>
                <td>${s.name}</td>
                <td>${s.phone}</td>
                <td><button onclick="deleteSupplier('${s.id}')">Delete</button></td>
            </tr>`
        ).join('');
    }
}

function openSupplierModal() {
    const name = prompt("Supplier Name:");
    const phone = prompt("Phone:");
    if (name) {
        state.suppliers.push({ id: 'SUPP-' + Date.now(), name, phone });
        savedData();
        renderSuppliers();
    }
}

function deleteSupplier(id) {
    state.suppliers = state.suppliers.filter(s => s.id !== id);
    savedData();
    renderSuppliers();
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
