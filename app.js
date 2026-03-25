let signaturePad, capturedPhoto = null, lastJob = null;
const SHOP_PIN = "7447"; 

window.onload = () => {
    if (sessionStorage.getItem('pcplus_login') !== 'true') {
        if (prompt("Enter Staff PIN:") === SHOP_PIN) sessionStorage.setItem('pcplus_login', 'true');
        else window.location.reload();
    }
    signaturePad = new SignaturePad(document.getElementById('signature-pad'));
    updateDashboard();
};

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById('print-area').style.display = 'none';
    document.getElementById(id).style.display = 'block';
}

async function startCamera() {
    const v = document.getElementById('video'); v.style.display = "block";
    v.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
}

function takePhoto() {
    const v = document.getElementById('video'); const c = document.getElementById('photo-canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    capturedPhoto = c.toDataURL('image/jpeg');
    document.getElementById('captured-img').src = capturedPhoto;
    document.getElementById('captured-img').style.display = "block";
    v.style.display = "none";
    v.srcObject.getTracks().forEach(t => t.stop());
}

function calculateGst() {
    const cost = parseFloat(document.getElementById('estCost').value) || 0;
    const isGst = document.getElementById('gstToggle').checked;
    document.getElementById('gstDisplay').innerText = isGst ? `Total (18% GST): ₹${(cost*1.18).toFixed(2)}` : "";
}

function getExpiry(m) {
    if (m == 0) return "No Warranty";
    let d = new Date(); d.setMonth(d.getMonth() + parseInt(m));
    return d.toLocaleDateString('en-IN');
}

function generateReceipt() {
    const cost = parseFloat(document.getElementById('estCost').value) || 0;
    const isGst = document.getElementById('gstToggle').checked;
    const job = {
        id: "PCI-" + Date.now(),
        name: document.getElementById('custName').value,
        mobile: document.getElementById('custMobile').value,
        model: document.getElementById('model').value,
        category: document.getElementById('repairCategory').value,
        delivery: document.getElementById('deliveryDate').value,
        cost: isGst ? (cost * 1.18).toFixed(2) : cost.toFixed(2),
        payment: document.getElementById('payMethod').value,
        warrantyExp: getExpiry(document.getElementById('warrantyMonths').value),
        notes: document.getElementById('internalNotes').value,
        status: 'Pending',
        date: new Date().toLocaleDateString('en-IN'),
        sig: signaturePad.toDataURL(),
        photo: capturedPhoto
    };
    if(!job.name || !job.mobile) return alert("Fill Name & Mobile!");
    let repairs = JSON.parse(localStorage.getItem('repairs')) || [];
    repairs.push(job); lastJob = job;
    localStorage.setItem('repairs', JSON.stringify(repairs));

    document.getElementById('receipt-content').innerHTML = `
        <div style="display:flex; justify-content:space-between;">
            <div><strong>Customer:</strong> ${job.name}</div>
            <div style="text-align:right;"><strong>Job ID:</strong> ${job.id}</div>
        </div>
        <p><strong>Device:</strong> ${job.model} (${job.category})</p>
        <p><strong>Warranty Exp:</strong> ${job.warrantyExp}</p>
        <h2>Total: ₹${job.cost}</h2>
    `;
    document.getElementById('printed-sig').src = job.sig;
    showSection('print-area'); updateDashboard();
}

function updateDashboard() {
    const r = JSON.parse(localStorage.getItem('repairs')) || [];
    const today = new Date();
    
    document.getElementById('pending-count').innerText = r.filter(x => x.status === 'Pending').length;
    const tableBody = document.getElementById('job-list-body');
    tableBody.innerHTML = r.slice(-10).reverse().map(job => {
        let wBadge = "";
        if (job.warrantyExp !== "No Warranty") {
            const expParts = job.warrantyExp.split('/');
            const expD = new Date(expParts[2], expParts[1] - 1, expParts[0]);
            wBadge = today > expD ? `<span style="color:red; font-size:10px;">[EXPIRED]</span>` : `<span style="color:green; font-size:10px;">[IN WARRANTY]</span>`;
        }
        const isDue = job.delivery === today.toISOString().split('T')[0];
        return `
            <tr title="Note: ${job.notes || 'None'}">
                <td><small>${job.date}</small></td>
                <td><strong>${job.name}</strong><br>${wBadge}</td>
                <td>${job.model}<br><small style="${isDue ? 'color:red;font-weight:bold;' : ''}">Due: ${job.delivery || 'N/A'}</small></td>
                <td style="color:${job.status === 'Completed' ? '#27ae60' : '#f39c12'}; font-weight:bold;">${job.status}</td>
                <td><select onchange="updateStatus('${job.id}', this.value)"><option value="Pending" ${job.status === 'Pending' ? 'selected' : ''}>Pending</option><option value="Completed" ${job.status === 'Completed' ? 'selected' : ''}>Completed</option></select></td>
                <td><button onclick="deleteJob('${job.id}')" style="background:none;border:none;cursor:pointer;">🗑️</button></td>
            </tr>`;
    }).join('');
}

function updateStatus(id, s) {
    let r = JSON.parse(localStorage.getItem('repairs')) || [];
    const i = r.findIndex(x => x.id === id);
    if(i !== -1) { r[i].status = s; localStorage.setItem('repairs', JSON.stringify(r)); updateDashboard(); }
}

function deleteJob(id) {
    if(confirm("Delete?")) {
        let r = JSON.parse(localStorage.getItem('repairs')) || [];
        localStorage.setItem('repairs', JSON.stringify(r.filter(x => x.id !== id)));
        updateDashboard();
    }
}

function backupToExcel() {
    const data = JSON.parse(localStorage.getItem('repairs')) || [];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Repairs");
    XLSX.writeFile(wb, "Pcplusinfo_Backup.xlsx");
}

function printSmallLabel() {
    if(!lastJob) return alert("Generate a receipt first!");
    const win = window.open('', '', 'width=300,height=200');
    win.document.write(`<html><body style="font-family:sans-serif; text-align:center; padding:10px; border:1px solid #000;">
        <h3 style="margin:0;">Pcplusinfo</h3>
        <p style="margin:5px 0; font-size:12px;">ID: ${lastJob.id}</p>
        <p style="margin:0; font-weight:bold;">${lastJob.name}</p>
        <p style="margin:5px 0; font-size:11px;">${lastJob.model}</p>
    </body></html>`);
    win.print(); win.close();
      }
      
