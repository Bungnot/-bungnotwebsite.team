/**
 * System: ADMIN ROCKET PREMIUM
 * Author: Bungnot Vscode
 * Version: 2.2 (History & Watermark Fix)
 */

let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

// [1] โหลดข้อมูลทันทีเมื่อเปิดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
    loadData(); 
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats();
});

// [2] ระบบ Auto-Save
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
        badge.innerText = "✅ บันทึกข้อมูลแล้ว (Bungnot Vscode)";
        badge.style.opacity = "1"; 
        setTimeout(() => badge.style.opacity = "0", 2000); 
    }
}

// [3] โหลดข้อมูลตาราง
function loadData() {
    const rawData = localStorage.getItem("savedTables");
    if (!rawData) return;
    const data = JSON.parse(rawData);
    const container = document.getElementById("tables-container");
    container.innerHTML = ""; 
    data.forEach(tableData => {
        const newTable = document.createElement("div");
        newTable.classList.add("table-container", "table-card");
        let rowsHtml = "";
        tableData.rows.forEach(r => {
            rowsHtml += `<tr>
                <td><input type="text" value="${r[0]}" oninput="saveData()"></td>
                <td><input type="text" value="${r[1]}" oninput="saveData()"></td>
                <td><input type="text" value="${r[2]}" oninput="saveData()"></td>
                <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>
            </tr>`;
        });
        newTable.innerHTML = `<button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
            <div class="card-header"><input type="text" class="table-title-input" value="${tableData.title}" oninput="saveData()"></div>
            <table class="custom-table"><thead><tr><th class="th-green">รายชื่อคนไล่</th><th class="th-orange">ราคาเล่น</th><th class="th-red">รายชื่อคนยั้ง</th><th class="th-purple">จัดการ</th></tr></thead><tbody>${rowsHtml}</tbody></table>
            <button class="btn-add-row" onclick="addRow(this.previousElementSibling)">+ เพิ่มแผลที่เล่น</button>`;
        container.appendChild(newTable);
    });
    updateDashboardStats();
}

// [4] ฟังก์ชันจัดการตาราง
function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");
    newTable.innerHTML = `<button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <div class="card-header"><input type="text" class="table-title-input" placeholder="ใส่ชื่อค่าย..." oninput="saveData()"></div>
        <table class="custom-table"><thead><tr><th class="th-green">รายชื่อคนไล่</th><th class="th-orange">ราคาเล่น</th><th class="th-red">รายชื่อคนยั้ง</th><th class="th-purple">จัดการ</th></tr></thead>
        <tbody><tr><td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()"></td><td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td></tr></tbody></table>
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)">+ เพิ่มแผลที่เล่น</button>`;
    container.appendChild(newTable);
    saveData();
    updateDashboardStats();
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `<td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()"></td><td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>`;
    tbody.appendChild(newRow);
    saveData();
}

function removeRow(btn) { btn.closest("tr").remove(); saveData(); }

function removeTable(btn) {
    const card = btn.closest('.table-container');
    const title = card.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    let profit = 0;
    card.querySelectorAll("tbody tr").forEach(tr => {
        const val = tr.querySelectorAll("input")[1].value.replace(/[Oo]/g, '0');
        const match = val.match(/\d{3,}/);
        if (match) profit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ยืนยันการลบ", `ต้องการลบตาราง <b>${title}</b>? (กำไร: ฿${profit.toFixed(2)})`, "confirm", () => {
        const rows = [];
        card.querySelectorAll("tbody tr").forEach(tr => {
            const ins = tr.querySelectorAll("input");
            rows.push([ins[0].value, ins[1].value, ins[2].value]);
        });
        historyData.push({ title, rows, profit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += profit;
        card.remove();
        saveData();
        updateDashboardStats();
    });
}

// [5] ฟังก์ชันแสดงประวัติ (ซ่อมแซมใหม่)
function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ยังไม่มีประวัติการลบข้อมูล", "alert");
    
    const sw = window.open("", "_blank", "width=1000,height=800");
    let rowsContent = "";
    
    historyData.forEach(h => {
        let tableRows = h.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("");
        rowsContent += `
            <div class="history-card">
                <div class="h-title">${h.title} <small>(${h.timestamp})</small></div>
                <table class="h-table">
                    <thead><tr><th>คนไล่</th><th>ราคา</th><th>คนยั้ง</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <div class="h-profit">กำไร: ฿${h.profit.toFixed(2)}</div>
            </div>`;
    });

    sw.document.write(`
        <html>
        <head>
            <title>ประวัติ - Bungnot Vscode</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Sarabun', sans-serif; background: #f0f2f5; padding: 30px; position: relative; }
                body::before { content: "Bungnot Vscode"; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 8rem; color: rgba(0,0,0,0.02); pointer-events: none; z-index: -1; }
                .summary { text-align: center; font-size: 2rem; font-weight: bold; color: #1e3c72; margin-bottom: 30px; }
                .history-card { background: white; border-radius: 15px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-left: 8px solid #1e3c72; }
                .h-title { font-size: 1.3rem; font-weight: bold; margin-bottom: 10px; color: #1e3c72; }
                .h-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                .h-table th, .h-table td { border: 1px solid #eee; padding: 10px; text-align: center; }
                .h-table th { background: #f8fafc; }
                .h-profit { text-align: right; font-weight: bold; color: #2ecc71; font-size: 1.2rem; }
            </style>
        </head>
        <body>
            <div class="summary">💰 กำไรรวมทั้งหมด: ฿${totalDeletedProfit.toFixed(2)}</div>
            ${rowsContent}
        </body>
        </html>`);
}

// [6] ระบบ Modal
function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    const msgEl = document.getElementById('modal-msg');
    msgEl.innerHTML = message;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    currentModalKeyHandler = (e) => {
        if (e.key === "Enter") { closeModal(); if(callback) callback(); }
        else if (e.key === "Escape") closeModal();
    };
    window.addEventListener('keydown', currentModalKeyHandler);

    const b1 = document.createElement("button");
    b1.innerText = type === "confirm" ? "ยืนยัน (Enter)" : "ตกลง (Enter)";
    b1.className = "btn-confirm";
    b1.onclick = () => { closeModal(); if(callback) callback(); };
    actions.appendChild(b1);

    if (type === "confirm") {
        const b2 = document.createElement("button");
        b2.innerText = "ยกเลิก (Esc)";
        b2.className = "btn-cancel";
        b2.onclick = closeModal;
        actions.appendChild(b2);
    }
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
    window.removeEventListener('keydown', currentModalKeyHandler);
}

function updateDashboardStats() {
    document.getElementById("total-profit-display").innerText = `฿${totalDeletedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById("active-tables-count").innerText = document.querySelectorAll(".table-container").length;
}

// [7] หน้าต่างจับเวลา (Bungnot Vscode)
function openStopwatchWindow() {
    const sw = window.open("", "_blank", "width=800,height=750");
    sw.document.write(\`
        <html>
        <head>
            <title>จับเวลา - Bungnot Vscode</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { background: #1e3c72; color: white; font-family: 'Sarabun', sans-serif; padding: 30px; position: relative; }
                body::before { content: "Bungnot Vscode"; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-20deg); font-size: 6rem; color: rgba(255,255,255,0.03); pointer-events: none; }
                .input-group { display: flex; gap: 10px; margin-bottom: 30px; }
                input { flex: 1; padding: 15px; border-radius: 12px; border: none; outline: none; }
                .timer-text { font-family: monospace; font-size: 2.5rem; color: #2ecc71; font-weight: bold; }
                .sw-table td { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; }
            </style>
        </head>
        <body>
            <h2>⏱ ระบบจัดการเวลา (Bungnot Vscode)</h2>
            <div class="input-group"><input type="text" id="cIn" placeholder="ชื่อค่าย..."><button onclick="add()">เพิ่ม</button></div>
            <table style="width:100%" id="list"></table>
            <script>
                function add() {
                    const n = document.getElementById('cIn').value; if(!n) return;
                    const tr = document.createElement('tr');
                    tr.innerHTML = '<td>'+n+'</td><td><span class="t">0.000</span></td><td><button onclick="st(this)">เริ่ม</button><button onclick="rs(this)">ลบ</button></td>';
                    document.getElementById('list').appendChild(tr);
                }
                function st(b) {
                    const tr = b.closest('tr'); const d = tr.querySelector('.t');
                    if(b.innerText==='เริ่ม') {
                        b.innerText='หยุด'; tr.s = Date.now() - (tr.e||0);
                        tr.iv = setInterval(()=> { tr.e = Date.now()-tr.s; d.innerText=(tr.e/1000).toFixed(3); }, 10);
                    } else { b.innerText='เริ่ม'; clearInterval(tr.iv); }
                }
                function rs(b) { b.closest('tr').remove(); }
            </script>
        </body></html>\`);
}

function clearAllHistory() {
    showModal("ล้างประวัติ", "ลบข้อมูลทั้งหมดถาวรใช่หรือไม่?", "confirm", () => {
        localStorage.clear();
        location.reload();
    });
}

setInterval(saveData, 5000);
