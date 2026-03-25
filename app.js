const PIN = "7447";
let db = { repairs: [], inventory: [], expenses: [], profile: {} };

// Initialize Data from LocalStorage
window.onload = () => {
    const savedData = localStorage.getItem('pcplus_db');
    if (savedData) db = JSON.parse(savedData);
    updateStats();
};

function checkLogin() {
    if (document.getElementById('pinInput').value === PIN) {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        showSection('dashboard');
    } else {
        alert("Invalid PIN");
    }
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

function saveRepair() {
    const repair = {
        id: "PCI-" + Date.now(),
        name: document.getElementById('r_custName').value,
        mobile: document.getElementById('r_custMobile').value,
        model: document.getElementById('r_model').value,
        brand: document.getElementById('r_brand').value,
        cost: document.getElementById('r_estCost').value,
        status: 'Pending',
        date: new Date().toLocaleDateString()
    };

    db.repairs.push(repair);
    syncDB();
    generateReceiptView(repair);
}

function generateReceiptView(job) {
    const html = `
        <div class="grid-2">
            <div>
                <h3>Job ID: ${job.id}</h3>
                <p><strong>Customer:</strong> ${job.name} (${job.mobile})</p>
                <p><strong>Device:</strong> ${job.brand} ${job.model}</p>
            </div>
            <div style="text-align:right;">
                <p><strong>Date:</strong> ${job.date}</p>
                <p><strong>Status:</strong> ${job.status}</p>
            </div>
        </div>
        <h2 style="color:var(--primary);">Estimated Cost: ₹${job.cost}</h2>
    `;
    document.getElementById('receipt-body').innerHTML = html;
    showSection('print-area');
}

function syncDB() {
    localStorage.setItem('pcplus_db', JSON.stringify(db));
    updateStats();
}

function updateStats() {
    document.getElementById('dash-pending').innerText = db.repairs.filter(r => r.status === 'Pending').length;
    document.getElementById('dash-done').innerText = db.repairs.filter(r => r.status === 'Completed').length;
    const rev = db.repairs.filter(r => r.status === 'Completed').reduce((sum, r) => sum + Number(r.cost), 0);
    document.getElementById('dash-sales').innerText = "₹ " + rev;
    document.getElementById('live-rev').innerText = "₹ " + rev;
}

function backupToExcel() {
    const ws = XLSX.utils.json_to_sheet(db.repairs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Repairs");
    XLSX.writeFile(wb, "Pcplusinfo_Backup.xlsx");
}

function shareWhatsApp() {
    const msg = `Hello, your repair job at Pcplusinfo Solutions is confirmed. ID: ${db.repairs[db.repairs.length-1].id}`;
    window.open(`https://wa.me/91${db.repairs[db.repairs.length-1].mobile}?text=${encodeURIComponent(msg)}`);
}

function logout() {
    location.reload();
}
