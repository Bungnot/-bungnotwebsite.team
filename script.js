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
    const width = 950, height = 850;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
    
    sw.document.write(`
        <html>
        <head>
            <title>PREMIUM TIMER SYSTEM</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                :root {
                    --bg-dark: #0f172a;
                    --card-bg: rgba(30, 41, 59, 0.7);
                    --accent: #38bdf8;
                    --success: #10b981;
                    --warning: #f59e0b;
                    --danger: #ef4444;
                    --glass: rgba(255, 255, 255, 0.03);
                }
                
                body { 
                    background-color: var(--bg-dark);
                    background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%);
                    color: #f8fafc;
                    font-family: 'Sarabun', sans-serif;
                    margin: 0;
                    padding: 40px 20px;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .container { width: 100%; max-width: 800px; }

                /* Header */
                .header { text-align: center; margin-bottom: 40px; }
                .header h1 { 
                    font-size: 2.5rem; margin: 0; font-weight: 600;
                    background: linear-gradient(to bottom, #fff, var(--accent));
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .header p { color: #94a3b8; margin-top: 10px; font-weight: 300; }

                /* Input Box */
                .input-wrapper {
                    background: var(--card-bg);
                    padding: 8px;
                    border-radius: 20px;
                    display: flex;
                    gap: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(20px);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                    margin-bottom: 40px;
                }
                input {
                    flex: 1; background: transparent; border: none; padding: 15px 25px;
                    color: white; font-size: 1.1rem; outline: none; font-family: 'Sarabun';
                }
                .btn-add {
                    background: var(--accent); color: #0f172a; border: none;
                    padding: 0 30px; border-radius: 15px; font-weight: 600;
                    cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px;
                }
                .btn-add:hover { background: #fff; transform: translateY(-2px); }

                /* Timer Card */
                .timer-list { display: flex; flex-direction: column; gap: 20px; }
                .timer-card {
                    background: var(--card-bg);
                    border-radius: 24px;
                    padding: 25px 35px;
                    border: 1px solid rgba(255,255,255,0.05);
                    display: grid;
                    grid-template-columns: 1.5fr 2fr 1.5fr;
                    align-items: center;
                    transition: 0.4s;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .timer-card:hover { border-color: rgba(56, 189, 248, 0.4); transform: scale(1.02); }

                .camp-info .name { font-size: 1.4rem; font-weight: 600; color: #fff; margin-bottom: 5px; }
                .camp-info .status { font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }

                .time-display {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 3.5rem;
                    text-align: center;
                    color: var(--success);
                    text-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
                }

                .actions { display: flex; gap: 12px; justify-content: flex-end; }
                .btn-ctrl {
                    width: 50px; height: 50px; border-radius: 15px; border: none;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    font-size: 1.2rem; transition: 0.2s;
                }
                .btn-play { background: rgba(16, 185, 129, 0.15); color: var(--success); }
                .btn-play:hover { background: var(--success); color: white; }
                .btn-pause { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
                .btn-pause:hover { background: var(--warning); color: white; }
                .btn-reset { background: var(--glass); color: #94a3b8; }
                .btn-reset:hover { background: #475569; color: white; }
                .btn-del { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
                .btn-del:hover { background: var(--danger); color: white; }

                /* Empty State */
                #empty-msg { text-align: center; color: #475569; margin-top: 50px; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1><i class="fas fa-clock-rotate-left"></i> บันทึกเวลาค่ายบั้งไฟ</h1>
                    <p>ระบบจัดการเวลาแบบ Real-time รายค่าย</p>
                </div>

                <div class="input-wrapper">
                    <input type="text" id="campInput" placeholder="พิมพ์ชื่อค่ายบั้งไฟ เช่น 'พญานาคคู่'...">
                    <button class="btn-add" onclick="addNewRow()">
                        <i class="fas fa-plus"></i> เพิ่มค่าย
                    </button>
                </div>

                <div id="empty-msg">ยังไม่มีข้อมูลค่าย... เริ่มต้นโดยการเพิ่มชื่อค่ายด้านบน</div>
                <div class="timer-list" id="sw-tbody"></div>
            </div>

            <script>
                document.getElementById('campInput').addEventListener('keydown', (e) => { 
                    if (e.key === "Enter") addNewRow(); 
                });

                function addNewRow() {
                    const inp = document.getElementById('campInput');
                    const name = inp.value.trim();
                    if(!name) return;
                    
                    document.getElementById('empty-msg').style.display = 'none';

                    const div = document.createElement('div');
                    div.className = 'timer-card';
                    div.dataset.elapsed = 0; 
                    div.dataset.running = "false";
                    
                    div.innerHTML = \`
                        <div class="camp-info">
                            <div class="name">\${name}</div>
                            <div class="status">Ready to Start</div>
                        </div>
                        <div class="time-display">0.000</div>
                        <div class="actions">
                            <button class="btn-ctrl btn-play" onclick="toggle(this)">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn-ctrl btn-reset" onclick="reset(this)">
                                <i class="fas fa-redo"></i>
                            </button>
                            <button class="btn-ctrl btn-del" onclick="removeCard(this)">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>\`;
                    
                    document.getElementById('sw-tbody').prepend(div);
                    inp.value = "";
                }

                function toggle(btn) {
                    const card = btn.closest('.timer-card');
                    const disp = card.querySelector('.time-display');
                    const status = card.querySelector('.status');
                    
                    if (card.dataset.running === "false") {
                        card.dataset.running = "true"; 
                        btn.innerHTML = '<i class="fas fa-pause"></i>'; 
                        btn.className = "btn-ctrl btn-pause";
                        status.innerText = "Timing...";
                        status.style.color = "#38bdf8";
                        
                        const st = Date.now() - parseFloat(card.dataset.elapsed);
                        card.iv = setInterval(() => {
                            const now = Date.now() - st;
                            card.dataset.elapsed = now;
                            disp.innerText = (now / 1000).toFixed(3);
                        }, 10);
                    } else {
                        card.dataset.running = "false"; 
                        btn.innerHTML = '<i class="fas fa-play"></i>'; 
                        btn.className = "btn-ctrl btn-play";
                        status.innerText = "Paused";
                        status.style.color = "#f59e0b";
                        clearInterval(card.iv);
                    }
                }

                function reset(btn) {
                    const card = btn.closest('.timer-card'); 
                    clearInterval(card.iv);
                    card.dataset.running = "false"; 
                    card.dataset.elapsed = 0;
                    card.querySelector('.time-display').innerText = "0.000";
                    card.querySelector('.status').innerText = "Ready to Start";
                    card.querySelector('.status').style.color = "#64748b";
                    
                    const pBtn = card.querySelector('.btn-ctrl');
                    pBtn.innerHTML = '<i class="fas fa-play"></i>'; 
                    pBtn.className = "btn-ctrl btn-play";
                }

                function removeCard(btn) {
                    btn.closest('.timer-card').remove();
                    if (document.getElementById('sw-tbody').children.length === 0) {
                        document.getElementById('empty-msg').style.display = 'block';
                    }
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
