let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats();
});

// --- Data Management ---
function saveData() {
    const data = [];
    document.querySelectorAll(".table-container").forEach(table => {
        const titleInput = table.querySelector(".table-title-input");
        const title = titleInput ? titleInput.value : "";
        const rows = [];
        table.querySelectorAll("tbody tr").forEach(r => {
            const cells = r.querySelectorAll("input");
            if (cells.length >= 3) {
                rows.push([cells[0].value, cells[1].value, cells[2].value]);
            }
        });
        data.push({ title, rows });
    });
    localStorage.setItem("savedTables", JSON.stringify(data));
    
    // Auto-save badge logic
    const badge = document.getElementById("auto-save-alert");
    if(badge) { 
        badge.style.opacity = "1"; 
        setTimeout(() => badge.style.opacity = "0", 2000); 
    }
}

function loadData() {
    const raw = localStorage.getItem("savedTables");
    if (!raw) return;
    const data = JSON.parse(raw);
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(t => addTable(t.title, t.rows));
}

// --- Table Actions ---
function addTable(title = "", rows = null) {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    let rowsHtml = "";
    if (rows) {
        rowsHtml = rows.map(r => `
            <tr>
                <td><input type="text" value="${r[0]}" oninput="saveData()"></td>
                <td><input type="text" value="${r[1]}" oninput="saveData()"></td>
                <td><input type="text" value="${r[2]}" oninput="saveData()"></td>
                <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
            </tr>`).join('');
    } else {
        rowsHtml = `
            <tr>
                <td><input type="text" oninput="saveData()"></td>
                <td><input type="text" oninput="saveData()"></td>
                <td><input type="text" oninput="saveData()"></td>
                <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
            </tr>`;
    }

    newTable.innerHTML = `
    <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
    <div class="card-header">
        <input type="text" class="table-title-input" value="${title}" placeholder="ใส่ชื่อค่ายที่นี่..." oninput="saveData()">
    </div>
    <table class="custom-table">
        <thead>
            <tr>
                <th class="th-green">รายชื่อคนไล่</th>
                <th class="th-orange">ราคาเล่น</th>
                <th class="th-red">รายชื่อคนยั้ง</th>
                <th class="th-purple">จัดการ</th>
            </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
    </table>
    <div style="text-align: center; margin-top: 20px;">
        <button class="btn-add-row-custom" onclick="addRow(this.closest('.table-card').querySelector('table'))">
            <i class="fas fa-plus"></i> เพิ่มแผลที่เล่น
        </button>
    </div>`;

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input type="text" oninput="saveData()"></td>
        <td><input type="text" oninput="saveData()"></td>
        <td><input type="text" oninput="saveData()"></td>
        <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>`;
    tbody.appendChild(tr);
    saveData();
}

function removeRow(btn) { btn.closest('tr').remove(); saveData(); }

function removeTable(button) {
    const tableContainer = button.closest('.table-container');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    
    let profit = 0;
    tableContainer.querySelectorAll("tbody tr").forEach(tr => {
        const val = tr.querySelectorAll("input")[1].value.replace(/[Oo]/g, '0');
        const match = val.match(/\d{3,}/);
        if (match) profit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ยืนยันการปิดยอด", `ค่าย: <b>${title}</b><br>กำไรสุทธิ: <span style="color:green">฿${profit.toFixed(2)}</span>`, "confirm", () => {
        const rowsData = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rowsData.push([cells[0]?.value || "", cells[1]?.value || "", cells[2]?.value || ""]);
        });

        historyData.push({ title, rows: rowsData, profit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += profit;
        
        tableContainer.remove();
        saveData();
        updateDashboardStats();
    });
}

function restoreLastDeleted() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ไม่มีข้อมูลให้กู้คืน", "alert");
    const last = historyData.pop();
    totalDeletedProfit -= last.profit;
    addTable(last.title, last.rows);
    localStorage.setItem("historyData", JSON.stringify(historyData));
    updateDashboardStats();
    showModal("สำเร็จ", `กู้คืนค่าย <b>${last.title}</b> แล้ว`, "alert");
}

// --- Windows & UI ---
function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ไม่มีประวัติ", "alert");
    
    let newWindow = window.open("", "History", "width=1100,height=900");
    
    let content = `
    <html>
    <head>
        <title>ประวัติการคิดยอด PREMIUM</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { font-family: 'Sarabun', sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); background-attachment: fixed; padding: 40px 20px; margin: 0; display: flex; flex-direction: column; align-items: center; }
            .history-title { color: white; margin-bottom: 30px; text-shadow: 0 2px 10px rgba(0,0,0,0.3); font-size: 2.2rem; }
            .table-card { background: white; border-radius: 24px; padding: 35px; margin-bottom: 40px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); width: 100%; max-width: 1000px; border-top: 8px solid #1e3c72; position: relative; }
            .camp-header { font-size: 1.5rem; font-weight: bold; color: #1e3c72; text-align: center; border: 2.5px solid #94a3b8; background: #e2e8f0; padding: 12px; border-radius: 16px; width: 60%; margin: 0 auto 30px; }
            .custom-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
            .custom-table th { padding: 18px 10px; color: white; text-align: center; font-size: 1.1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            .th-green { background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%); border-radius: 15px 0 0 15px; }
            .th-orange { background: linear-gradient(180deg, #f39c12 0%, #e67e22 100%); }
            .th-red { background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%); border-radius: 0 15px 15px 0; }
            .cell-data { background: #e2e8f0; border: 2.5px solid #cbd5e1; padding: 14px; border-radius: 14px; text-align: center; font-weight: 600; color: #333; margin: 0 5px; }
            .footer-info { display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
            .profit-tag { color: #2ecc71; font-weight: bold; font-size: 1.4rem; }
            .time-tag { color: #64748b; font-size: 0.95rem; }
        </style>
    </head>
    <body>
        <h2 class="history-title"><i class="fas fa-history"></i> ประวัติการคิดยอด</h2>`;

    historyData.forEach(h => {
        let rowsHtml = h.rows.map(r => `
            <tr>
                <td style="width: 40%;"><div class="cell-data">${r[0] || "-"}</div></td>
                <td style="width: 20%;"><div class="cell-data">${r[1] || "-"}</div></td>
                <td style="width: 40%;"><div class="cell-data">${r[2] || "-"}</div></td>
            </tr>`).join('');

        content += `
            <div class="table-card">
                <div class="camp-header">${h.title}</div>
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th class="th-green">รายชื่อคนไล่</th>
                            <th class="th-orange">ราคาเล่น</th>
                            <th class="th-red">รายชื่อคนยั้ง</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <div class="footer-info">
                    <span class="time-tag"><i class="far fa-clock"></i> เมื่อวันที่: ${h.timestamp}</span>
                    <span class="profit-tag">กำไรรวม: ฿${h.profit.toFixed(2)}</span>
                </div>
            </div>`;
    });

    content += `</body></html>`;
    newWindow.document.write(content);
    newWindow.document.close();
}

function openStopwatchWindow() {
    const sw = window.open("", "_blank", "width=800,height=700");
    sw.document.write(`<html><head><title>Timer</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>body{background:#1e3c72;color:white;font-family:sans-serif;padding:30px}input{padding:15px;border-radius:10px;border:none;width:70%;background:#e2e8f0;color:#333;font-weight:bold}.timer-text{font-size:3rem;color:#2ecc71;font-weight:bold}</style></head><body><h2>จับเวลาบั้งไฟ</h2><input type="text" id="cIn" placeholder="ชื่อค่าย..."><button onclick="add()" style="padding:15px;border-radius:10px;background:#2ecc71;border:none;color:white;cursor:pointer;margin-left:10px">เพิ่ม</button><div id="list"></div><script>function add(){const n=document.getElementById('cIn').value;if(!n)return;const d=document.createElement('div');d.style.background='rgba(255,255,255,0.1)';d.style.padding='20px';d.style.margin='10px 0';d.style.borderRadius='15px';d.innerHTML='<b>'+n+'</b> <span class="timer-text" id="t">0.000</span> <button onclick="st(this)" style="padding:10px;background:#2ecc71;border:none;color:white;border-radius:5px">เริ่ม</button> <button onclick="rs(this)" style="padding:10px;background:#f39c12;border:none;color:white;border-radius:5px">รีเซ็ต</button>';document.getElementById('list').appendChild(d);document.getElementById('cIn').value=''};function st(b){const t=b.parentElement.querySelector('#t');if(b.innerText==='เริ่ม'){b.innerText='หยุด';b.style.background='#e74c3c';let s=parseFloat(t.innerText)*1000;let st=Date.now()-s;b.iv=setInterval(()=>{t.innerText=((Date.now()-st)/1000).toFixed(3)},10)}else{b.innerText='เริ่ม';b.style.background='#2ecc71';clearInterval(b.iv)}};function rs(b){const t=b.parentElement.querySelector('#t');const sb=b.parentElement.querySelector('button');clearInterval(sb.iv);sb.innerText='เริ่ม';sb.style.background='#2ecc71';t.innerText='0.000'}<\/script></body></html>`);
}

// --- Utils & Modals ---
function showModal(title, msg, type = "alert", cb = null) {
    const modal = document.getElementById('custom-modal');
    const iconBox = document.getElementById('modal-icon');
    iconBox.innerHTML = type === "confirm" ? '<i class="fas fa-exclamation-circle" style="font-size:3rem; color:#f39c12; margin-bottom:15px; display:block;"></i>' : '<i class="fas fa-check-circle" style="font-size:3rem; color:#2ecc71; margin-bottom:15px; display:block;"></i>';
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerHTML = msg;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    if (currentModalKeyHandler) window.removeEventListener('keydown', currentModalKeyHandler);

    if (type === "confirm") {
        const b1 = document.createElement("button"); b1.innerText = "ตกลง (Enter)"; b1.className = "btn-modal btn-confirm";
        b1.onclick = () => { closeModal(); if (cb) cb(); };
        const b2 = document.createElement("button"); b2.innerText = "ยกเลิก (Esc)"; b2.className = "btn-modal btn-cancel";
        b2.onclick = closeModal;
        actions.append(b2, b1);
        currentModalKeyHandler = (e) => { if (e.key === "Enter") b1.click(); else if (e.key === "Escape") closeModal(); };
    } else {
        const b = document.createElement("button"); b.innerText = "ตกลง"; b.className = "btn-modal btn-confirm"; b.onclick = closeModal;
        actions.append(b);
        currentModalKeyHandler = (e) => { if (e.key === "Enter" || e.key === "Escape") closeModal(); };
    }
    window.addEventListener('keydown', currentModalKeyHandler);
    modal.classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
}

function clearAllHistory() { showModal("คำเตือน", "ล้างข้อมูลทั้งหมด?", "confirm", () => { localStorage.clear(); location.reload(); }); }
