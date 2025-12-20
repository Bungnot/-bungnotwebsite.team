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

// [3] จัดการตารางหน้าหลัก (หน้าตาตามรูปที่ 3)
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
        <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>`;
    tbody.appendChild(tr);
    saveData();
}

function removeRow(btn) { btn.closest('tr').remove(); saveData(); }

// [4] ระบบแสดงประวัติแบบก๊อบปี้ดีไซน์หน้าจอหลักมา 100% (แก้ไขให้เหมือนรูปที่ 3 เป๊ะ)
function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ไม่มีประวัติ", "alert");
    
    let win = window.open("", "History", "width=1200,height=900");
    
    let style = `
        <style>
            :root {
                --primary-bg: #1e3c72;
                --primary-gradient: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            }
            body { 
                font-family: 'Sarabun', sans-serif; 
                background: var(--primary-gradient); 
                background-attachment: fixed;
                padding: 40px 20px; 
                margin: 0;
            }
            .history-title { 
                text-align: center; 
                color: white; 
                margin-bottom: 30px; 
                font-size: 2.5rem; 
                font-weight: 700;
                text-shadow: 0 3px 10px rgba(0,0,0,0.3);
            }
            
            /* การตั้งค่า Card ให้เหมือนหน้าหลักเป๊ะ */
            .table-card { 
                background: white; 
                border-radius: 30px; 
                padding: 35px; 
                margin: 0 auto 40px; 
                max-width: 1100px; 
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
                position: relative;
                border-top: 8px solid #1e3c72;
            }
            
            /* ช่องชื่อค่ายดีไซน์มนสีเทา เหมือนหน้าหลัก */
            .history-header-box {
                font-size: 1.6rem; 
                font-weight: bold; 
                color: #1e3c72; 
                text-align: center; 
                border: 2.5px solid #94a3b8;
                background: #e2e8f0; 
                padding: 12px; 
                border-radius: 16px; 
                width: 60%; 
                display: block; 
                margin: 0 auto 30px;
                box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
            }

            .profit-tag { 
                position: absolute; 
                top: 15px; 
                left: 20px;
                background: #e8f5e9; 
                color: #2e7d32; 
                padding: 6px 18px; 
                border-radius: 50px; 
                font-weight: bold; 
                font-size: 1rem;
                border: 1px solid #2e7d32;
            }

            /* ดีไซน์ตาราง 4 คอลัมน์ (เขียว-ส้ม-แดง-ม่วง) */
            .custom-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
            .custom-table th { 
                padding: 18px 10px; 
                color: white; 
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                font-weight: 600;
            }
            
            .th-green { background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%); border-radius: 15px 0 0 15px; }
            .th-orange { background: linear-gradient(180deg, #f39c12 0%, #e67e22 100%); }
            .th-red { background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%); }
            .th-purple { background: linear-gradient(180deg, #9b59b6 0%, #8e44ad 100%); border-radius: 0 15px 15px 0; }
            
            /* ช่องข้อมูลแบบมนสีเทาเข้ม ขอบชัด */
            .custom-table td { 
                text-align: center; 
                padding: 14px; 
                background: #e2e8f0; 
                border: 2.5px solid #cbd5e1;
                font-weight: 600; 
                border-radius: 14px;
                color: #333;
            }

            /* ปุ่มถังขยะในช่องจัดการ */
            .btn-view-only {
                background: white; 
                color: #e74c3c; 
                border: 2px solid #eee; 
                width: 40px; 
                height: 40px; 
                border-radius: 12px;
                display: flex; 
                align-items: center; 
                justify-content: center; 
                margin: 0 auto;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            
            .timestamp { 
                display: block; 
                text-align: right; 
                color: #64748b; 
                font-size: 0.85rem; 
                margin-top: 15px;
                padding-right: 10px;
            }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    `;

    let content = `<html><head>${style}</head><body><h2 class="history-title">📜 ประวัติการคิดยอด (Pro Version)</h2>`;
    
    // เรียงจากล่าสุดขึ้นก่อน
    [...historyData].reverse().forEach(h => {
        let rows = h.rows.map(r => `
            <tr>
                <td style="width: 30%;">${r[0] || ''}</td>
                <td style="width: 30%;">${r[1] || ''}</td>
                <td style="width: 30%;">${r[2] || ''}</td>
                <td style="width: 10%;"><div class="btn-view-only"><i class="fas fa-trash-alt"></i></div></td>
            </tr>
        `).join('');

        content += `
            <div class="table-card">
                <div class="profit-tag">กำไร: ฿${h.profit.toFixed(2)}</div>
                
                <div class="history-header-box">
                    ${h.title || 'ไม่ระบุชื่อค่าย'}
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
                    <tbody>${rows}</tbody>
                </table>
                <div class="timestamp">🕒 บันทึกเมื่อ: ${h.timestamp}</div>
            </div>`;
    });

    content += "</body></html>";
    win.document.write(content);
}

// [5] ระบบ Modal และ UI อื่นๆ ครบถ้วนตามไฟล์เดิม
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
        const b = document.createElement("button"); b.innerText = "ตกลง (Enter/Esc)"; b.className = "btn-modal btn-confirm"; b.onclick = closeModal;
        actions.append(b);
        currentModalKeyHandler = (e) => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); closeModal(); } };
    }
    window.addEventListener('keydown', currentModalKeyHandler);
    modal.classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); if (currentModalKeyHandler) { window.removeEventListener('keydown', currentModalKeyHandler); currentModalKeyHandler = null; } }
function updateDashboardStats() { const pEl = document.getElementById("total-profit-display"); if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}`; }
function loadData() { const raw = localStorage.getItem("savedTables"); if (!raw) return; const data = JSON.parse(raw); const container = document.getElementById("tables-container"); container.innerHTML = ""; data.forEach(t => addTable(t.title, t.rows)); }
function clearAllHistory() { showModal("คำเตือน", "ล้างข้อมูลทั้งหมดใช่หรือไม่?", "confirm", () => { localStorage.clear(); location.reload(); }); }

function openStopwatchWindow() {
    const width = 1000, height = 850;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
    sw.document.write(`<html><head><title>TIMER</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>:root { --bg: #0f172a; --card: rgba(30, 41, 59, 0.7); --primary: #38bdf8; --success: #10b981; --warning: #f59e0b; --danger: #ef4444; } body { background: var(--bg); color: #f8fafc; font-family: sans-serif; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; } .input-box { background: var(--card); padding: 10px; border-radius: 20px; display: flex; width: 100%; max-width: 700px; gap: 12px; margin-bottom: 40px; } input { flex: 1; background: transparent; border: none; padding: 15px 25px; color: white; font-size: 1.2rem; outline: none; } .btn-add { background: var(--primary); padding: 0 35px; border-radius: 15px; font-weight: 700; cursor: pointer; } .timer-card { background: var(--card); border-radius: 24px; padding: 30px; margin-bottom: 20px; width: 450px; } .time-display { font-size: 4.5rem; text-align: center; color: var(--success); } .controls { display: flex; gap: 12px; justify-content: center; }</style></head><body><div class="input-box"><input type="text" id="campInput" placeholder="ชื่อค่าย..."><button class="btn-add" onclick="addNewTimer()">เพิ่มค่าย</button></div><div id="timer-container"></div><script>function addNewTimer(){const n=document.getElementById('campInput').value.trim();if(!n)return;const c=document.createElement('div');c.className='timer-card';c.innerHTML='<div style="font-size:1.6rem;font-weight:700">'+n+'</div><div class="time-display">0.000</div><div class="controls"><button class="btn-ctrl" style="background:#10b981;color:white" onclick="toggleTimer(this)">เริ่ม</button><button class="btn-ctrl" style="background:rgba(255,255,255,0.05);color:#94a3b8" onclick="resetTimer(this)">รีเซ็ต</button><button class="btn-ctrl" style="background:rgba(239,68,68,0.1);color:#ef4444" onclick="this.closest(\\\'.timer-card\\\').remove()">ลบ</button></div>';c.dataset.running='false';c.dataset.elapsed=0;document.getElementById('timer-container').prepend(c);document.getElementById('campInput').value=''};function toggleTimer(b){const c=b.closest('.timer-card');const d=c.querySelector('.time-display');if(c.dataset.running==='false'){c.dataset.running='true';b.innerText='หยุด';const s=Date.now()-parseFloat(c.dataset.elapsed);c.iv=setInterval(()=>{const e=Date.now()-s;c.dataset.elapsed=e;d.innerText=(e/1000).toFixed(3)},10)}else{c.dataset.running='false';b.innerText='เริ่มต่อ';clearInterval(c.iv)}};function resetTimer(b){const c=b.closest('.timer-card');clearInterval(c.iv);c.dataset.running='false';c.dataset.elapsed=0;c.querySelector('.time-display').innerText='0.000';const s=c.querySelector('.btn-ctrl');s.innerText='เริ่ม'}</script></body></html>`);
}
