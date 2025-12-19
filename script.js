let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

// [1] เริ่มต้นระบบและโหลดข้อมูล
document.addEventListener("DOMContentLoaded", () => {
    loadData(); // โหลดตารางที่บันทึกค้างไว้
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats();
});

// [2] ระบบบันทึกข้อมูลอัตโนมัติ (Logic 17)
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

// [3] จัดการตาราง (หน้าตา UI 15 + Logic 17)
function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    newTable.innerHTML = `
        <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <div class="card-header">
            <input type="text" class="table-title-input" placeholder="ใส่ชื่อค่ายที่นี่..." oninput="saveData()">
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
            <tbody>
                <tr>
                    <td><input type="text" oninput="saveData()"></td>
                    <td><input type="text" oninput="saveData()"></td>
                    <td><input type="text" oninput="saveData()"></td>
                    <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
                </tr>
            </tbody>
        </table>
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)">+ เพิ่มแผลที่เล่น</button>`;
    
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

function removeRow(btn) { 
    btn.closest('tr').remove(); 
    saveData(); 
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input type="text" oninput="saveData()"></td>
        <td><input type="text" oninput="saveData()"></td>
        <td><input type="text" oninput="saveData()"></td>
        <td><button class="btn-remove-row" onclick="removeRow(this)" style="background:#fff0f0; color:#e74c3c; border:none; border-radius:8px; cursor:pointer; width:35px; height:35px;">
            <i class="fas fa-trash-alt"></i>
        </button></td>`;
    tbody.appendChild(tr);
    saveData();
}

// [4] ระบบจับเวลาแบบตัวที่ 17 (เปิดหน้าต่างใหม่/หลายค่าย)
function openStopwatchWindow() {
    const width = 800, height = 750;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
    
    sw.document.write(`
        <html>
        <head>
            <title>ระบบจับเวลา PREMIUM</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { background: #1e3c72; color: white; font-family: 'Sarabun'; padding: 30px; }
                input { width: 70%; padding: 15px; border-radius: 12px; border: none; font-size: 1.1rem; outline: none; }
                .sw-table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
                .sw-table td { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; }
                .timer-text { font-family: monospace; font-size: 2.5rem; color: #2ecc71; font-weight: bold; }
                .btn-sw { border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; color: white; font-weight: bold; }
                .btn-start { background: #2ecc71; } .btn-stop { background: #e74c3c; }
            </style>
        </head>
        <body>
            <h2><i class="fas fa-stopwatch"></i> ระบบจัดการเวลาหลายค่าย</h2>
            <div style="margin-bottom:20px;">
                <input type="text" id="campInput" placeholder="พิมพ์ชื่อค่ายแล้วกด Enter...">
                <button onclick="addNewRow()" style="background:#2ecc71; color:white; border:none; padding:15px 25px; border-radius:12px; cursor:pointer;">เพิ่มค่าย</button>
            </div>
            <table class="sw-table"><tbody id="sw-tbody"></tbody></table>
            <script>
                document.getElementById('campInput').addEventListener('keydown', (e) => { if (e.key === "Enter") addNewRow(); });
                function addNewRow() {
                    const inp = document.getElementById('campInput');
                    const name = inp.value.trim();
                    if(!name) return;
                    const tr = document.createElement('tr');
                    tr.dataset.elapsed = 0; tr.dataset.running = "false";
                    tr.innerHTML = '<td><b>'+name+'</b></td><td><span class="timer-text">0.000</span></td><td><button class="btn-sw btn-start" onclick="toggle(this)">เริ่ม</button><button class="btn-sw" onclick="reset(this)" style="background:#f39c12; margin-left:5px;">รีเซ็ต</button><button class="btn-sw" onclick="this.closest(\\'tr\\').remove()" style="background:rgba(255,0,0,0.3); margin-left:5px;">ลบ</button></td>';
                    document.getElementById('sw-tbody').appendChild(tr);
                    inp.value = "";
                }
                function toggle(btn) {
                    const tr = btn.closest('tr');
                    const disp = tr.querySelector('.timer-text');
                    if (tr.dataset.running === "false") {
                        tr.dataset.running = "true"; btn.innerText = "หยุด"; btn.className = "btn-sw btn-stop";
                        const st = Date.now() - parseFloat(tr.dataset.elapsed);
                        tr.iv = setInterval(() => {
                            const now = Date.now() - st;
                            tr.dataset.elapsed = now;
                            disp.innerText = (now / 1000).toFixed(3);
                        }, 10);
                    } else {
                        tr.dataset.running = "false"; btn.innerText = "เริ่ม"; btn.className = "btn-sw btn-start";
                        clearInterval(tr.iv);
                    }
                }
                function reset(btn) {
                    const tr = btn.closest('tr'); clearInterval(tr.iv);
                    tr.dataset.running = "false"; tr.dataset.elapsed = 0;
                    tr.querySelector('.timer-text').innerText = "0.000";
                    const sBtn = tr.querySelector('.btn-sw'); sBtn.innerText = "เริ่ม"; sBtn.className = "btn-sw btn-start";
                }
            <\/script>
        </body>
        </html>
    `);
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
        b.className = "btn-modal btn-cancel";
        b.style.background = "#1e3c72"; b.style.color = "white";
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

// [6] ฟังก์ชันเสริม (Dashboard, History, LoadData)
function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    const cEl = document.getElementById("active-tables-count");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
    if(cEl) cEl.innerText = document.querySelectorAll(".table-container").length;
}

function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ไม่มีประวัติ", "alert");
    let newWindow = window.open("", "History", "width=900,height=800");
    let content = `<html><head><title>ประวัติ</title><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet"><style>body{font-family:'Sarabun';padding:20px;background:#f5f5f5}.card{background:white;padding:20px;border-radius:15px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}table{width:100%;border-collapse:collapse}th,td{padding:10px;border:1px solid #eee;text-align:center}th{background:#eee}</style></head><body><h2 style="text-align:center">📜 ประวัติการคิดยอด</h2>`;
    historyData.forEach(h => {
        let rows = h.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('');
        content += `<div class="card"><b>ค่าย: ${h.title}</b><br><small>${h.timestamp}</small><table><thead><tr><th>คนไล่</th><th>ราคา</th><th>คนยั้ง</th></tr></thead><tbody>${rows}</tbody></table><p style="text-align:right;color:green;font-weight:bold">กำไร: ฿${h.profit.toFixed(2)}</p></div>`;
    });
    newWindow.document.write(content + "</body></html>");
}

function loadData() {
    const raw = localStorage.getItem("savedTables");
    if (!raw) return;
    const data = JSON.parse(raw);
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(t => {
        addTable();
        const last = container.lastElementChild;
        last.querySelector(".table-title-input").value = t.title;
        last.querySelector("tbody").innerHTML = t.rows.map(r => `<tr><td><input type="text" value="${r[0]}" oninput="saveData()"></td><td><input type="text" value="${r[1]}" oninput="saveData()"></td><td><input type="text" value="${r[2]}" oninput="saveData()"></td><td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td></tr>`).join('');
    });
}

function clearAllHistory() { showModal("คำเตือน", "ล้างข้อมูลทั้งหมดใช่หรือไม่?", "confirm", () => { localStorage.clear(); location.reload(); }); }
