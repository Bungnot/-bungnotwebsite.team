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
    const width = 900, height = 800;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
    
    sw.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ROCKET TIMER PREMIUM</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&family=JetBrains+Mono:wght@600&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                :root {
                    --bg-dark: #0f172a;
                    --card-bg: rgba(30, 41, 59, 0.7);
                    --accent: #2ecc71;
                    --danger: #ef4444;
                    --warning: #f59e0b;
                    --text-main: #f8fafc;
                }
                body { 
                    background: radial-gradient(circle at top left, #1e293b, #0f172a); 
                    color: var(--text-main); 
                    font-family: 'Sarabun', sans-serif; 
                    padding: 40px; 
                    margin: 0;
                    min-height: 100vh;
                }
                .container { max-width: 800px; margin: 0 auto; }
                
                .header { text-align: left; margin-bottom: 30px; border-left: 5px solid var(--accent); padding-left: 20px; }
                .header h2 { font-size: 2rem; margin: 0; letter-spacing: 1px; }
                .header p { opacity: 0.6; margin: 5px 0 0; font-weight: 300; }

                /* Input Zone */
                .input-box { 
                    background: var(--card-bg); 
                    padding: 20px; 
                    border-radius: 24px; 
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    display: flex; 
                    gap: 15px;
                    margin-bottom: 40px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                }
                input { 
                    flex: 1; 
                    padding: 15px 25px; 
                    border-radius: 15px; 
                    border: 2px solid rgba(255,255,255,0.05); 
                    font-size: 1.1rem; 
                    outline: none; 
                    background: rgba(0,0,0,0.2);
                    color: white;
                    transition: 0.3s;
                }
                input:focus { border-color: var(--accent); background: rgba(0,0,0,0.4); }
                
                .btn-add { 
                    background: var(--accent); 
                    color: #064e3b; 
                    border: none; 
                    padding: 0 35px; 
                    border-radius: 15px; 
                    cursor: pointer; 
                    font-weight: 700;
                    transition: 0.3s;
                    font-size: 1rem;
                }
                .btn-add:hover { transform: scale(1.05); filter: brightness(1.1); }

                /* Timer Grid */
                #timer-list { display: grid; gap: 15px; }
                .timer-card { 
                    background: var(--card-bg);
                    padding: 25px; 
                    border-radius: 24px; 
                    display: flex; 
                    align-items: center; 
                    border: 1px solid rgba(255,255,255,0.05);
                    transition: 0.3s;
                }
                .timer-card:hover { border-color: rgba(46, 204, 113, 0.3); background: rgba(30, 41, 59, 0.9); }
                
                .info { flex: 1; }
                .info b { font-size: 1.3rem; display: block; color: var(--accent); }
                
                .time-display { 
                    font-family: 'JetBrains Mono', monospace; 
                    font-size: 3.2rem; 
                    color: #fff; 
                    margin: 0 40px;
                    text-shadow: 0 0 20px rgba(46, 204, 113, 0.2);
                }

                .actions { display: flex; gap: 12px; }
                .btn-round {
                    width: 50px; height: 50px; border-radius: 15px; border: none;
                    cursor: pointer; color: white; display: flex;
                    align-items: center; justify-content: center; font-size: 1.2rem;
                    transition: 0.2s;
                }
                .btn-play { background: #2ecc71; color: #064e3b; }
                .btn-pause { background: #ef4444; }
                .btn-refresh { background: rgba(255,255,255,0.1); }
                .btn-refresh:hover { background: var(--warning); color: #000; }
                .btn-trash { background: rgba(255,255,255,0.05); color: #64748b; }
                .btn-trash:hover { background: #450a0a; color: #ef4444; }

            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>ROCKET STOPWATCH</h2>
                    <p>ระบบควบคุมเวลาบั้งไฟระดับพรีเมี่ยม</p>
                </div>

                <div class="input-box">
                    <input type="text" id="cInput" placeholder="พิมพ์ชื่อค่ายบั้งไฟ..." autocomplete="off">
                    <button class="btn-add" onclick="add()"><i class="fas fa-plus"></i> เพิ่ม</button>
                </div>

                <div id="timer-list"></div>
            </div>

            <script>
                document.getElementById('cInput').addEventListener('keydown', (e) => { if (e.key === "Enter") add(); });

                function add() {
                    const input = document.getElementById('cInput');
                    const name = input.value.trim();
                    if(!name) return;

                    const list = document.getElementById('timer-list');
                    const item = document.createElement('div');
                    item.className = 'timer-card';
                    item.innerHTML = \`
                        <div class="info">
                            <b>\${name}</b>
                            <span style="font-size:0.8rem; opacity:0.5;">READY TO LAUNCH</span>
                        </div>
                        <div class="time-display">0.000</div>
                        <div class="actions">
                            <button class="btn-round btn-play" onclick="toggle(this)">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn-round btn-refresh" onclick="reset(this)">
                                <i class="fas fa-undo"></i>
                            </button>
                            <button class="btn-round btn-trash" onclick="this.closest('.timer-card').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    \`;
                    list.prepend(item);
                    input.value = "";
                }

                function toggle(btn) {
                    const card = btn.closest('.timer-card');
                    const disp = card.querySelector('.time-display');
                    const icon = btn.querySelector('i');
                    
                    if (!btn.dataset.running || btn.dataset.running === "false") {
                        btn.dataset.running = "true";
                        btn.className = "btn-round btn-pause";
                        icon.className = "fas fa-pause";
                        let start = Date.now() - (parseFloat(disp.innerText) * 1000);
                        btn.timerIdx = setInterval(() => {
                            disp.innerText = ((Date.now() - start) / 1000).toFixed(3);
                        }, 10);
                    } else {
                        btn.dataset.running = "false";
                        btn.className = "btn-round btn-play";
                        icon.className = "fas fa-play";
                        clearInterval(btn.timerIdx);
                    }
                }

                function reset(btn) {
                    const card = btn.closest('.timer-card');
                    const pBtn = card.querySelector('.btn-play, .btn-pause');
                    const disp = card.querySelector('.time-display');
                    clearInterval(pBtn.timerIdx);
                    pBtn.dataset.running = "false";
                    pBtn.className = "btn-round btn-play";
                    pBtn.querySelector('i').className = "fas fa-play";
                    disp.innerText = "0.000";
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
