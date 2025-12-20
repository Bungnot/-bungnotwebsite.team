let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

// [1] เริ่มต้นระบบและโหลดข้อมูล
document.addEventListener("DOMContentLoaded", () => {
    loadData(); 
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats();
});

// [2] ระบบบันทึกข้อมูลอัตโนมัติ
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
    
    const badge = document.getElementById("auto-save-alert");
    if(badge) { 
        badge.style.opacity = "1"; 
        setTimeout(() => badge.style.opacity = "0", 2000); 
    }
}

// [3] จัดการตารางหน้าหลัก
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
        <button class="btn-main" onclick="addRow(this.previousElementSibling)" style="margin: 20px auto 0; background: #e8f5e9; color: #2e7d32; border: 1px dashed #2e7d32; width: auto; padding: 10px 20px; border-radius: 50px; cursor: pointer; font-weight: bold;">+ เพิ่มแผลที่เล่น</button>`;
    
    container.appendChild(newTable);
    saveData();
    updateDashboardStats();
}

function removeTable(button) {
    const tableContainer = button.closest('.table-container');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    
    let profit = 0;
    tableContainer.querySelectorAll("tbody tr").forEach(tr => {
        const val = tr.querySelectorAll("input")[1].value.replace(/[Oo]/g, '0');
        const match = val.match(/\\d{3,}/);
        if (match) profit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ยืนยันการปิดยอด", `ค่าย: <b>\${title}</b><br>กำไรสุทธิ: <span style="color:green">฿\${profit.toFixed(2)}</span>`, "confirm", () => {
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
    showModal("สำเร็จ", `กู้คืนค่าย <b>\${last.title}</b> เรียบร้อยแล้ว`, "alert");
}

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

// [4] ระบบประวัติการคิดยอด (แก้ไขให้เหมือนหน้าหลักเป๊ะ 100%)
function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ไม่มีประวัติ", "alert");
    
    let win = window.open("", "History", "width=1200,height=900");
    
    let style = \`
        <style>
            :root { --primary-bg: #1e3c72; --primary-gradient: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); }
            body { font-family: 'Sarabun', sans-serif; background: var(--primary-gradient); background-attachment: fixed; padding: 40px 20px; margin: 0; }
            .history-title { text-align: center; color: white; margin-bottom: 30px; font-size: 2.5rem; font-weight: 700; text-shadow: 0 3px 10px rgba(0,0,0,0.3); }
            .table-card { background: white; border-radius: 30px; padding: 35px; margin: 0 auto 40px; max-width: 1100px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2); position: relative; border-top: 8px solid #1e3c72; }
            .history-header-box { font-size: 1.6rem; font-weight: bold; color: #1e3c72; text-align: center; border: 2.5px solid #94a3b8; background: #e2e8f0; padding: 12px; border-radius: 16px; width: 60%; display: block; margin: 0 auto 30px; box-shadow: inset 0 2px 5px rgba(0,0,0,0.1); }
            .profit-tag { position: absolute; top: 15px; left: 20px; background: #e8f5e9; color: #2e7d32; padding: 6px 18px; border-radius: 50px; font-weight: bold; font-size: 1rem; border: 1px solid #2e7d32; }
            .custom-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
            .custom-table th { padding: 18px 10px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2); font-weight: 600; }
            .th-green { background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%); border-radius: 15px 0 0 15px; }
            .th-orange { background: linear-gradient(180deg, #f39c12 0%, #e67e22 100%); }
            .th-red { background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%); }
            .th-purple { background: linear-gradient(180deg, #9b59b6 0%, #8e44ad 100%); border-radius: 0 15px 15px 0; }
            .custom-table td { text-align: center; padding: 14px; background: #e2e8f0; border: 2.5px solid #cbd5e1; font-weight: 600; border-radius: 14px; color: #333; }
            .btn-view-only { background: white; color: #e74c3c; border: 2.5px solid #cbd5e1; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
            .timestamp { display: block; text-align: right; color: #64748b; font-size: 0.85rem; margin-top: 15px; padding-right: 10px; }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    \`;

    let content = \`<html><head>\${style}</head><body><h2 class="history-title">📜 ประวัติการคิดยอด (Pro Version)</h2>\`;
    
    [...historyData].reverse().forEach(h => {
        let rows = h.rows.map(r => \`
            <tr>
                <td style="width: 30%;">\${r[0] || ''}</td>
                <td style="width: 30%;">\${r[1] || ''}</td>
                <td style="width: 30%;">\${r[2] || ''}</td>
                <td style="width: 10%;"><div class="btn-view-only"><i class="fas fa-trash-alt"></i></div></td>
            </tr>
        \`).join('');

        content += \`
            <div class="table-card">
                <div class="profit-tag">กำไร: ฿\${h.profit.toFixed(2)}</div>
                <div class="history-header-box">\${h.title || 'ไม่ระบุชื่อค่าย'}</div>
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th class="th-green">รายชื่อคนไล่</th>
                            <th class="th-orange">ราคาเล่น</th>
                            <th class="th-red">รายชื่อคนยั้ง</th>
                            <th class="th-purple">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>\${rows}</tbody>
                </table>
                <div class="timestamp">🕒 บันทึกเมื่อ: \${h.timestamp}</div>
            </div>\`;
    });

    content += "</body></html>";
    win.document.write(content);
}

// [5] ระบบ Modal รองรับ Enter / Esc
function showModal(title, msg, type = "alert", cb = null) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerHTML = msg;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    if (currentModalKeyHandler) {
        window.removeEventListener('keydown', currentModalKeyHandler);
    }

    if (type === "confirm") {
        const b1 = document.createElement("button");
        b1.innerText = "ตกลง (Enter)"; 
        b1.className = "btn-modal btn-confirm";
        b1.onclick = () => { closeModal(); if (cb) cb(); };

        const b2 = document.createElement("button");
        b2.innerText = "ยกเลิก (Esc)";
        b2.className = "btn-modal btn-cancel";
        b2.onclick = closeModal;

        actions.append(b2, b1);

        currentModalKeyHandler = (e) => {
            if (e.key === "Enter") { e.preventDefault(); b1.click(); }
            else if (e.key === "Escape") { e.preventDefault(); closeModal(); }
        };
    } else {
        const b = document.createElement("button");
        b.innerText = "ตกลง (Enter/Esc)";
        b.className = "btn-modal btn-confirm";
        b.onclick = closeModal;
        actions.append(b);

        currentModalKeyHandler = (e) => {
            if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); closeModal(); }
        };
    }

    window.addEventListener('keydown', currentModalKeyHandler);
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
    if (currentModalKeyHandler) {
        window.removeEventListener('keydown', currentModalKeyHandler);
        currentModalKeyHandler = null;
    }
}

// [6] ฟังก์ชันเสริม
function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = \`฿\${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}\`;
}

function loadData() {
    const raw = localStorage.getItem("savedTables");
    if (!raw) return;
    const data = JSON.parse(raw);
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(t => addTable(t.title, t.rows));
}

function clearAllHistory() { showModal("คำเตือน", "ล้างข้อมูลทั้งหมดใช่หรือไม่?", "confirm", () => { localStorage.clear(); location.reload(); }); }

function openStopwatchWindow() {
    const sw = window.open("", "_blank", "width=800,height=700");
    sw.document.write(\`<html><head><title>Timer</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>body{background:#1e3c72;color:white;font-family:sans-serif;padding:30px}input{padding:15px;border-radius:10px;border:none;width:70%;background:#e2e8f0;color:#333;font-weight:bold}.timer-text{font-size:3rem;color:#2ecc71;font-weight:bold}</style></head><body><h2>จับเวลาบั้งไฟ</h2><input type="text" id="cIn" placeholder="ชื่อค่าย..."><button onclick="add()" style="padding:15px;border-radius:10px;background:#2ecc71;border:none;color:white;cursor:pointer;margin-left:10px">เพิ่ม</button><div id="list"></div><script>function add(){const n=document.getElementById('cIn').value;if(!n)return;const d=document.createElement('div');d.style.background='rgba(255,255,255,0.1)';d.style.padding='20px';d.style.margin='10px 0';d.style.borderRadius='15px';d.innerHTML='<b>'+n+'</b> <span class="timer-text" id="t">0.000</span> <button onclick="st(this)" style="padding:10px;background:#2ecc71;border:none;color:white;border-radius:5px">เริ่ม</button> <button onclick="rs(this)" style="padding:10px;background:#f39c12;border:none;color:white;border-radius:5px">รีเซ็ต</button>';document.getElementById('list').appendChild(d);document.getElementById('cIn').value=''};function st(b){const t=b.parentElement.querySelector('#t');if(b.innerText==='เริ่ม'){b.innerText='หยุด';b.style.background='#e74c3c';let s=parseFloat(t.innerText)*1000;let st=Date.now()-s;b.iv=setInterval(()=>{t.innerText=((Date.now()-st)/1000).toFixed(3)},10)}else{b.innerText='เริ่ม';b.style.background='#2ecc71';clearInterval(b.iv)}};function rs(b){const t=b.parentElement.querySelector('#t');const sb=b.parentElement.querySelector('button');clearInterval(sb.iv);sb.innerText='เริ่ม';sb.style.background='#2ecc71';t.innerText='0.000'}<\/script></body></html>\`);
}
