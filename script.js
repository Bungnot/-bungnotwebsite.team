let historyData = [];
let totalDeletedProfit = 0;

// โหลดข้อมูลเมื่อเริ่มต้น
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats();
});

function updateDashboardStats() {
    document.getElementById("total-profit-display").innerText = `฿${totalDeletedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById("active-tables-count").innerText = document.querySelectorAll(".table-container").length;
}

function showToast(text) {
    const badge = document.getElementById("auto-save-alert");
    badge.innerText = text;
    badge.style.opacity = "1";
    setTimeout(() => badge.style.opacity = "0", 3000);
}

function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    newTable.innerHTML = `
        <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <input type="text" class="table-title-input" placeholder="ระบุชื่อค่ายบั้งไฟ..." oninput="saveData()">
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
                    <td><input type="text" placeholder="ชื่อคนไล่" oninput="saveData()"></td>
                    <td><input type="text" placeholder="ราคา" oninput="saveData()"></td>
                    <td><input type="text" placeholder="ชื่อคนยั้ง" oninput="saveData()"></td>
                    <td><button class="btn-remove-row-premium" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
                </tr>
            </tbody>
        </table>
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)">
            <i class="fas fa-plus"></i> เพิ่มแผลเล่น
        </button>
    `;
    container.appendChild(newTable);
    updateDashboardStats();
    saveData();
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td><input type="text" placeholder="ชื่อคนไล่" oninput="saveData()"></td>
        <td><input type="text" placeholder="ราคา" oninput="saveData()"></td>
        <td><input type="text" placeholder="ชื่อคนยั้ง" oninput="saveData()"></td>
        <td><button class="btn-remove-row-premium" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(row);
    row.querySelector("input").focus();
    saveData();
}

function removeRow(btn) {
    const tbody = btn.closest("tbody");
    if (tbody.querySelectorAll("tr").length > 1) {
        btn.closest("tr").remove();
        saveData();
    } else {
        showModal("แจ้งเตือน", "ต้องมีอย่างน้อย 1 แถว", "alert");
    }
}

function removeTable(btn) {
    const card = btn.closest(".table-card");
    const title = card.querySelector(".table-title-input").value || "ไม่ระบุชื่อ";
    
    let profit = 0;
    card.querySelectorAll("tbody tr").forEach(tr => {
        const val = tr.querySelectorAll("input")[1].value.replace(/[Oo]/g, '0');
        const match = val.match(/\d+/);
        if(match) profit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ยืนยันการลบ", `คุณต้องการลบตาราง <b>${title}</b>?<br>กำไรที่จะบันทึก: <span style="color:green">฿${profit.toFixed(2)}</span>`, "confirm", () => {
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
        showToast("บันทึกข้อมูลเรียบร้อยแล้ว");
    });
}

function saveData() {
    const data = [];
    document.querySelectorAll(".table-card").forEach(card => {
        const title = card.querySelector(".table-title-input").value;
        const rows = [];
        card.querySelectorAll("tbody tr").forEach(tr => {
            const ins = tr.querySelectorAll("input");
            rows.push([ins[0].value, ins[1].value, ins[2].value]);
        });
        data.push({ title, rows });
    });
    localStorage.setItem("savedTables", JSON.stringify(data));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem("savedTables") || "[]");
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(item => {
        addTable();
        const lastCard = container.lastElementChild;
        lastCard.querySelector(".table-title-input").value = item.title;
        const tbody = lastCard.querySelector("tbody");
        tbody.innerHTML = "";
        item.rows.forEach(r => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><input type="text" value="${r[0]}" oninput="saveData()"></td>
                <td><input type="text" value="${r[1]}" oninput="saveData()"></td>
                <td><input type="text" value="${r[2]}" oninput="saveData()"></td>
                <td><button class="btn-remove-row-premium" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
            `;
            tbody.appendChild(row);
        });
    });
}

function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    const msgEl = document.getElementById('modal-msg');
    msgEl.innerHTML = message;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    if (type === "input") {
        const inp = document.createElement("input");
        inp.className = "modal-input";
        inp.placeholder = "พิมพ์ชื่อที่นี่...";
        msgEl.appendChild(inp);
        const b = document.createElement("button");
        b.innerText = "ตกลง";
        b.className = "btn-confirm";
        b.onclick = () => { if(inp.value) { closeModal(); if(callback) callback(inp.value); } };
        actions.appendChild(b);
    } else if (type === "confirm") {
        const b1 = document.createElement("button");
        b1.innerText = "ยืนยันการลบ";
        b1.className = "btn-confirm";
        b1.style.background = "#e74c3c";
        b1.onclick = () => { closeModal(); if(callback) callback(); };
        const b2 = document.createElement("button");
        b2.innerText = "ยกเลิก";
        b2.className = "btn-cancel";
        b2.onclick = closeModal;
        actions.appendChild(b1);
        actions.appendChild(b2);
    } else {
        const b = document.createElement("button");
        b.innerText = "รับทราบ";
        b.className = "btn-confirm";
        b.onclick = closeModal;
        actions.appendChild(b);
    }
    modal.classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

function clearAllHistory() {
    showModal("ล้างข้อมูลทั้งหมด", "คำเตือน: ข้อมูลและประวัติทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้!", "confirm", () => {
        localStorage.clear();
        location.reload();
    });
}

// ฟังก์ชันสร้างการ์ดจับเวลาใหม่ (รองรับหลายค่ายพร้อมกัน)
function openStopwatchWindow() {
    // กำหนดขนาดและตำแหน่งหน้าต่าง
    const width = 600;
    const height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    // เปิดหน้าต่างใหม่ทันทีโดยไม่ต้องรอ Modal กรอกชื่อ
    const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
    
    sw.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ระบบจับเวลาบั้งไฟ (หลายค่าย)</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { 
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); 
                    color: white; font-family: 'Sarabun', sans-serif; margin: 0; padding: 25px;
                }
                .header-sw { text-align: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 15px; }
                
                .input-group { 
                    display: flex; gap: 10px; margin-bottom: 25px; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 15px;
                }
                input[type="text"] { 
                    flex: 1; padding: 12px; border-radius: 10px; border: none; font-family: 'Sarabun'; font-size: 1rem; outline: none;
                }
                .btn-add-sw { background: #2ecc71; color: white; border: none; padding: 0 25px; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.3s; }
                .btn-add-sw:hover { background: #27ae60; transform: scale(1.02); }
                
                .sw-table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
                .sw-table th { padding: 15px; text-align: left; color: rgba(255,255,255,0.7); font-size: 0.9rem; text-transform: uppercase; }
                .sw-table td { background: rgba(255,255,255,0.15); padding: 15px; vertical-align: middle; }
                .sw-table td:first-child { border-radius: 15px 0 0 15px; }
                .sw-table td:last-child { border-radius: 0 15px 15px 0; }
                
                .timer-text { font-family: monospace; font-size: 2.2rem; font-weight: bold; color: #fff; min-width: 130px; display: inline-block; }
                .row-actions { display: flex; gap: 10px; }
                .action-btn { border: none; padding: 10px 18px; border-radius: 10px; cursor: pointer; font-weight: bold; color: white; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
                
                .btn-sw-start { background: #2ecc71; }
                .btn-sw-stop { background: #e74c3c; }
                .btn-sw-reset { background: #f39c12; }
                .btn-sw-del { background: rgba(0,0,0,0.3); color: #ff7675; }
                .action-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
            </style>
        </head>
        <body>
            <div class="header-sw">
                <h2><i class="fas fa-rocket"></i> ระบบจัดการเวลาบั้งไฟ</h2>
            </div>

            <div class="input-group">
                <input type="text" id="campInput" placeholder="กรอกชื่อค่ายบั้งไฟที่นี่..." onkeypress="if(event.key==='Enter') addNewRow()">
                <button class="btn-add-sw" onclick="addNewRow()">เพิ่มค่าย</button>
            </div>

            <table class="sw-table">
                <thead>
                    <tr>
                        <th width="35%">ชื่อค่าย</th>
                        <th width="30%">เวลา (วินาที)</th>
                        <th width="35%">จัดการ</th>
                    </tr>
                </thead>
                <tbody id="sw-tbody"></tbody>
            </table>

            <script>
                function addNewRow() {
                    const input = document.getElementById('campInput');
                    const name = input.value.trim();
                    if (!name) return;

                    const tbody = document.getElementById('sw-tbody');
                    const tr = document.createElement('tr');
                    tr.dataset.elapsed = 0;
                    tr.dataset.running = "false";

                    tr.innerHTML = \`
                        <td style="font-size: 1.2rem; font-weight: 600;">\${name}</td>
                        <td><span class="timer-text">0.000</span></td>
                        <td class="row-actions">
                            <button class="action-btn btn-sw-start" onclick="toggleTimer(this)"><i class="fas fa-play"></i> เริ่ม</button>
                            <button class="action-btn btn-sw-reset" onclick="resetTimer(this)"><i class="fas fa-redo"></i></button>
                            <button class="action-btn btn-sw-del" onclick="this.closest('tr').remove()"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    \`;
                    tbody.appendChild(tr);
                    input.value = "";
                    input.focus();
                }

                function toggleTimer(btn) {
                    const tr = btn.closest('tr');
                    const display = tr.querySelector('.timer-text');
                    
                    if (tr.dataset.running === "false") {
                        tr.dataset.running = "true";
                        btn.innerHTML = '<i class="fas fa-pause"></i> หยุด';
                        btn.className = 'action-btn btn-sw-stop';
                        
                        const startTime = Date.now() - parseFloat(tr.dataset.elapsed);
                        tr.timerInterval = setInterval(() => {
                            const now = Date.now() - startTime;
                            tr.dataset.elapsed = now;
                            display.innerText = (now / 1000).toFixed(3);
                        }, 10);
                    } else {
                        tr.dataset.running = "false";
                        btn.innerHTML = '<i class="fas fa-play"></i> เริ่ม';
                        btn.className = 'action-btn btn-sw-start';
                        clearInterval(tr.timerInterval);
                    }
                }

                function resetTimer(btn) {
                    const tr = btn.closest('tr');
                    clearInterval(tr.timerInterval);
                    tr.dataset.running = "false";
                    tr.dataset.elapsed = 0;
                    tr.querySelector('.timer-text').innerText = "0.000";
                    const startBtn = tr.querySelector('.btn-sw-start') || tr.querySelector('.btn-sw-stop');
                    startBtn.innerHTML = '<i class="fas fa-play"></i> เริ่ม';
                    startBtn.className = 'action-btn btn-sw-start';
                }
            </script>
        </body>
        </html>
    `);
}
