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
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)">+ เพิ่มแผลที่เล่น</button>`;
    
    container.appendChild(newTable);
    saveData();
    updateDashboardStats();
}

// กู้คืนตารางล่าสุดที่เพิ่งลบไป (Undo)
function restoreLastDeleted() {
    if (historyData.length === 0) {
        return showModal("แจ้งเตือน", "ไม่มีข้อมูลให้กู้คืน", "alert");
    }

    const lastItem = historyData.pop(); // ดึงรายการล่าสุดออกมาจากประวัติ
    totalDeletedProfit -= lastItem.profit; // หักลบยอดกำไรคืน
    
    // สร้างตารางใหม่จากข้อมูลที่ดึงกลับมา
    addTable(lastItem.title, lastItem.rows);
    
    localStorage.setItem("historyData", JSON.stringify(historyData));
    updateDashboardStats();
    showModal("สำเร็จ", `กู้คืนค่าย <b>${lastItem.title}</b> เรียบร้อยแล้ว`, "alert");
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

// [4] ระบบจับเวลาแบบตัวที่ 17
function openStopwatchWindow() {
    const width = 1000, height = 850;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
    
    sw.document.write(`
        <html>
        <head>
            <title>PREMIUM BANGFAI TIMER</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                :root {
                    --bg: #0f172a;
                    --card: rgba(30, 41, 59, 0.7);
                    --primary: #38bdf8;
                    --success: #10b981;
                    --warning: #f59e0b;
                    --danger: #ef4444;
                    --border: rgba(255, 255, 255, 0.1);
                }

                body { 
                    background: var(--bg); 
                    background-image: radial-gradient(circle at 50% -20%, #1e293b, #0f172a);
                    color: #f8fafc; 
                    font-family: 'Sarabun', sans-serif; 
                    margin: 0; 
                    padding: 40px 20px; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center;
                    min-height: 100vh;
                }

                .header { text-align: center; margin-bottom: 40px; }
                .header h1 { 
                    font-size: 2.8rem; margin: 0; font-weight: 700;
                    background: linear-gradient(to right, #fff, var(--primary));
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }

                /* ช่องรับชื่อค่าย */
                .input-box {
                    background: var(--card);
                    backdrop-filter: blur(15px);
                    border: 1px solid var(--border);
                    padding: 10px;
                    border-radius: 20px;
                    display: flex;
                    width: 100%;
                    max-width: 700px;
                    gap: 12px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
                    margin-bottom: 40px;
                }
                input {
                    flex: 1; background: transparent; border: none; padding: 15px 25px;
                    color: white; font-size: 1.2rem; outline: none; font-family: 'Sarabun';
                }
                .btn-add {
                    background: var(--primary); color: #0f172a; border: none;
                    padding: 0 35px; border-radius: 15px; font-weight: 700;
                    cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 10px;
                    font-size: 1.1rem;
                }
                .btn-add:hover { background: white; transform: scale(1.05); }

                /* รายการค่าย */
                #timer-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
                    gap: 20px;
                    width: 100%;
                    max-width: 1100px;
                }

                .timer-card {
                    background: var(--card);
                    border-radius: 24px;
                    padding: 30px;
                    border: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    position: relative;
                    transition: 0.3s;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                }
                .timer-card:hover { border-color: var(--primary); }

                .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
                .camp-name { font-size: 1.6rem; font-weight: 700; color: #fff; }
                .badge { font-size: 0.8rem; padding: 4px 12px; border-radius: 50px; background: rgba(56, 189, 248, 0.1); color: var(--primary); }

                .time-display {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 4.5rem;
                    text-align: center;
                    color: var(--success);
                    text-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
                    margin: 10px 0;
                }

                .controls {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .btn-ctrl {
                    flex: 1;
                    height: 55px;
                    border-radius: 15px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    font-weight: 600;
                    transition: 0.2s;
                    gap: 8px;
                    font-family: 'Sarabun';
                }

                .btn-start { background: var(--success); color: white; }
                .btn-stop { background: var(--warning); color: white; }
                .btn-reset { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid var(--border); }
                .btn-del { width: 55px; flex: none; background: rgba(239, 68, 68, 0.1); color: var(--danger); }

                .btn-ctrl:active { transform: scale(0.95); }
                .btn-del:hover { background: var(--danger); color: white; }
                
                #empty-state { text-align: center; color: #475569; margin-top: 50px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>จับเวลาบั้งไฟ <span style="font-weight:300">PREMIUM</span></h1>
            </div>

            <div class="input-box">
                <input type="text" id="campInput" placeholder="ใส่ชื่อค่ายบั้งไฟที่นี่...">
                <button class="btn-add" onclick="addNewTimer()">
                    <i class="fas fa-plus"></i> เพิ่มค่าย
                </button>
            </div>

            <div id="empty-state">ยังไม่มีข้อมูลค่ายที่กำลังจับเวลา</div>
            <div id="timer-container"></div>

            <script>
                function addNewTimer() {
                    const input = document.getElementById('campInput');
                    const name = input.value.trim();
                    if (!name) return;

                    document.getElementById('empty-state').style.display = 'none';
                    const container = document.getElementById('timer-container');
                    
                    const card = document.createElement('div');
                    card.className = 'timer-card';
                    card.innerHTML = \`
                        <div class="card-top">
                            <div>
                                <div class="camp-name">\${name}</div>
                                <div class="badge">ระบบจับเวลาละเอียด</div>
                            </div>
                        </div>
                        <div class="time-display">0.000</div>
                        <div class="controls">
                            <button class="btn-ctrl btn-start" onclick="toggleTimer(this)">
                                <i class="fas fa-play"></i> เริ่ม
                            </button>
                            <button class="btn-ctrl btn-reset" onclick="resetTimer(this)">
                                <i class="fas fa-redo"></i> รีเซ็ต
                            </button>
                            <button class="btn-ctrl btn-del" onclick="deleteCard(this)">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    \`;
                    
                    // เก็บข้อมูลเวลาไว้ในตัวแปรของ element เอง
                    card.dataset.running = "false";
                    card.dataset.elapsed = 0;
                    card.timerInterval = null;

                    container.prepend(card);
                    input.value = "";
                }

                function toggleTimer(btn) {
                    const card = btn.closest('.timer-card');
                    const display = card.querySelector('.time-display');
                    
                    if (card.dataset.running === "false") {
                        // เริ่มจับเวลา
                        card.dataset.running = "true";
                        btn.innerHTML = '<i class="fas fa-pause"></i> หยุด';
                        btn.className = "btn-ctrl btn-stop";
                        
                        const startTime = Date.now() - parseFloat(card.dataset.elapsed);
                        card.timerInterval = setInterval(() => {
                            const currentElapsed = Date.now() - startTime;
                            card.dataset.elapsed = currentElapsed;
                            display.innerText = (currentElapsed / 1000).toFixed(3);
                        }, 10);
                    } else {
                        // หยุดเวลา
                        card.dataset.running = "false";
                        btn.innerHTML = '<i class="fas fa-play"></i> เริ่มต่อ';
                        btn.className = "btn-ctrl btn-start";
                        clearInterval(card.timerInterval);
                    }
                }

                function resetTimer(btn) {
                    const card = btn.closest('.timer-card');
                    clearInterval(card.timerInterval);
                    card.dataset.running = "false";
                    card.dataset.elapsed = 0;
                    card.querySelector('.time-display').innerText = "0.000";
                    const startBtn = card.querySelector('.btn-ctrl.btn-stop') || card.querySelector('.btn-ctrl.btn-start');
                    startBtn.innerHTML = '<i class="fas fa-play"></i> เริ่ม';
                    startBtn.className = "btn-ctrl btn-start";
                }

                function deleteCard(btn) {
                    const card = btn.closest('.timer-card');
                    clearInterval(card.timerInterval);
                    card.remove();
                    if (document.getElementById('timer-container').children.length === 0) {
                        document.getElementById('empty-state').style.display = 'block';
                    }
                }

                document.getElementById('campInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') addNewTimer();
                });
            </script>
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

// [6] ฟังก์ชันเสริม
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
        addTable(t.title, t.rows);
    });
}

function clearAllHistory() { showModal("คำเตือน", "ล้างข้อมูลทั้งหมดใช่หรือไม่?", "confirm", () => { localStorage.clear(); location.reload(); }); }
