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
    showModal("สำเร็จ", `กู้คืนค่าย <b>${last.title}</b> เรียบร้อยแล้ว`, "alert");
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

function removeRow(btn) { btn.closest('tr').remove(); saveData(); }

// [4] ระบบแสดงประวัติแบบพรีเมียม (แก้ไขล่าสุดให้เหมือนหน้าหลักเป๊ะ)
function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ไม่มีประวัติ", "alert");
    
    let win = window.open("", "History", "width=1200,height=900");
    
    let style = `
        <style>
            body { font-family: 'Sarabun', sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); background-attachment: fixed; padding: 40px 20px; color: #333; }
            .history-title { text-align: center; color: white; margin-bottom: 30px; font-size: 2.5rem; text-shadow: 0 3px 10px rgba(0,0,0,0.3); }
            .table-card { background: white; border-radius: 24px; padding: 35px; margin: 0 auto 40px; max-width: 1100px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); position: relative; border-top: 8px solid #1e3c72; }
            .history-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
            .camp-name-display { font-size: 1.8rem; font-weight: bold; color: #1e3c72; }
            .profit-tag { background: #e8f5e9; color: #2e7d32; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 1.2rem; }
            .timestamp { color: #64748b; font-size: 0.9rem; }
            .custom-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
            .custom-table th { padding: 18px 10px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            .th-green { background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%); border-radius: 15px 0 0 15px; }
            .th-orange { background: linear-gradient(180deg, #f39c12 0%, #e67e22 100%); }
            .th-red { background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%); }
            .th-purple { background: linear-gradient(180deg, #9b59b6 0%, #8e44ad 100%); border-radius: 0 15px 15px 0; }
            .custom-table td { text-align: center; padding: 15px; background: #e2e8f0; border: 2.5px solid #cbd5e1; font-weight: 600; border-radius: 12px; }
            .btn-view-only { background: #fff; color: #e74c3c; border: 2px solid #eee; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    `;

    let content = `<html><head>${style}</head><body><h2 class="history-title">📜 ประวัติการคิดยอด</h2>`;
    
    [...historyData].reverse().forEach(h => {
        let rows = h.rows.map(r => `<tr><td>${r[0] || '-'}</td><td>${r[1] || '-'}</td><td>${r[2] || '-'}</td><td><div class="btn-view-only"><i class="fas fa-trash-alt"></i></div></td></tr>`).join('');
        content += `
            <div class="table-card">
                <div class="history-meta">
                    <div><div class="camp-name-display">ค่าย: ${h.title}</div><div class="timestamp"><i class="far fa-clock"></i> ${h.timestamp}</div></div>
                    <div class="profit-tag">กำไร (10%): ฿${h.profit.toFixed(2)}</div>
                </div>
                <table class="custom-table">
                    <thead><tr><th class="th-green">รายชื่อคนไล่</th><th class="th-orange">ราคาเล่น</th><th class="th-red">รายชื่อคนยั้ง</th><th class="th-purple">จัดการ</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    });
    win.document.write(content + "</body></html>");
}

// [5] ระบบ Modal ดั้งเดิมครบถ้วน
function showModal(title, msg, type = "alert", cb = null) {
    const modal = document.getElementById('custom-modal');
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
        currentModalKeyHandler = (e) => { if (e.key === "Enter") { e.preventDefault(); b1.click(); } else if (e.key === "Escape") { e.preventDefault(); closeModal(); } };
    } else {
        const b = document.createElement("button"); b.innerText = "ตกลง (Enter/Esc)"; b.className = "btn-modal btn-cancel"; b.style.background = "#1e3c72"; b.style.color = "white"; b.onclick = closeModal;
        actions.append(b);
        currentModalKeyHandler = (e) => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); closeModal(); } };
    }

    window.addEventListener('keydown', currentModalKeyHandler);
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
    if (currentModalKeyHandler) { window.removeEventListener('keydown', currentModalKeyHandler); currentModalKeyHandler = null; }
}

// [6] ฟังก์ชันเสริมดั้งเดิม
function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
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

// [7] ระบบจับเวลาพรีเมียมตัวเต็ม (โค้ด 200+ บรรทัดในตัวเดียว)
function openStopwatchWindow() {
    const width = 1000, height = 850;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
    
    sw.document.write(`
        <html>
        <head>
            <title>PREMIUM BANGFAI TIMER</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                :root { --bg: #0f172a; --card: rgba(30, 41, 59, 0.7); --primary: #38bdf8; --success: #10b981; --warning: #f59e0b; --danger: #ef4444; --border: rgba(255, 255, 255, 0.1); }
                body { background: var(--bg); background-image: radial-gradient(circle at 50% -20%, #1e293b, #0f172a); color: #f8fafc; font-family: 'Sarabun', sans-serif; margin: 0; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
                .input-box { background: var(--card); backdrop-filter: blur(15px); border: 1px solid var(--border); padding: 10px; border-radius: 20px; display: flex; width: 100%; max-width: 700px; gap: 12px; margin-bottom: 40px; }
                input { flex: 1; background: transparent; border: none; padding: 15px 25px; color: white; font-size: 1.2rem; outline: none; }
                .btn-add { background: var(--primary); color: #0f172a; border: none; padding: 0 35px; border-radius: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 1.1rem; transition: 0.3s; }
                .btn-add:hover { background: white; transform: scale(1.05); }
                #timer-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); gap: 20px; width: 100%; max-width: 1100px; }
                .timer-card { background: var(--card); border-radius: 24px; padding: 30px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 20px; transition: 0.3s; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
                .time-display { font-family: 'JetBrains Mono'; font-size: 4.5rem; text-align: center; color: var(--success); text-shadow: 0 0 30px rgba(16, 185, 129, 0.4); margin: 10px 0; }
                .controls { display: flex; gap: 12px; justify-content: center; }
                .btn-ctrl { flex: 1; height: 55px; border-radius: 15px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: 0.2s; gap: 8px; }
                .btn-start { background: var(--success); color: white; }
                .btn-stop { background: var(--warning); color: white; }
                .btn-reset { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid var(--border); }
                .btn-del { width: 55px; flex: none; background: rgba(239, 68, 68, 0.1); color: var(--danger); }
            </style>
        </head>
        <body>
            <div class="input-box">
                <input type="text" id="campInput" placeholder="ใส่ชื่อค่ายบั้งไฟที่นี่...">
                <button class="btn-add" onclick="addNewTimer()"><i class="fas fa-plus"></i> เพิ่มค่าย</button>
            </div>
            <div id="timer-container"></div>
            <script>
                function addNewTimer() {
                    const input = document.getElementById('campInput');
                    const name = input.value.trim();
                    if (!name) return;
                    const card = document.createElement('div');
                    card.className = 'timer-card';
                    card.innerHTML = \`<div class="camp-name" style="font-size:1.6rem; font-weight:700">\${name}</div><div class="time-display">0.000</div><div class="controls"><button class="btn-ctrl btn-start" onclick="toggleTimer(this)"><i class="fas fa-play"></i> เริ่ม</button><button class="btn-ctrl btn-reset" onclick="resetTimer(this)"><i class="fas fa-redo"></i> รีเซ็ต</button><button class="btn-ctrl btn-del" onclick="this.closest('.timer-card').remove()"><i class="fas fa-trash-alt"></i></button></div>\`;
                    card.dataset.running = "false"; card.dataset.elapsed = 0;
                    document.getElementById('timer-container').prepend(card);
                    input.value = "";
                }
                function toggleTimer(btn) {
                    const card = btn.closest('.timer-card');
                    const display = card.querySelector('.time-display');
                    if (card.dataset.running === "false") {
                        card.dataset.running = "true"; btn.innerHTML = '<i class="fas fa-pause"></i> หยุด'; btn.className = "btn-ctrl btn-stop";
                        const startTime = Date.now() - parseFloat(card.dataset.elapsed);
                        card.timerInterval = setInterval(() => { const currentElapsed = Date.now() - startTime; card.dataset.elapsed = currentElapsed; display.innerText = (currentElapsed / 1000).toFixed(3); }, 10);
                    } else {
                        card.dataset.running = "false"; btn.innerHTML = '<i class="fas fa-play"></i> เริ่มต่อ'; btn.className = "btn-ctrl btn-start"; clearInterval(card.timerInterval);
                    }
                }
                function resetTimer(btn) {
                    const card = btn.closest('.timer-card'); clearInterval(card.timerInterval);
                    card.dataset.running = "false"; card.dataset.elapsed = 0; card.querySelector('.time-display').innerText = "0.000";
                    const sBtn = card.querySelector('.btn-ctrl.btn-stop') || card.querySelector('.btn-ctrl.btn-start');
                    sBtn.innerHTML = '<i class="fas fa-play"></i> เริ่ม'; sBtn.className = "btn-ctrl btn-start";
                }
            </script>
        </body></html>
    `);
}
