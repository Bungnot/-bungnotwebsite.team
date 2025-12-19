let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

// [1] โหลดข้อมูลทันทีเมื่อเปิดหน้าเว็บ (ป้องกันข้อมูลหาย)
document.addEventListener("DOMContentLoaded", () => {
    loadData(); // ดึงข้อมูลตารางที่กรอกค้างไว้กลับมาแสดง
    
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats();
});

// [2] ระบบ Auto-Save บันทึกทุกครั้งที่มีการพิมพ์หรือแก้ไข
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
    
    // แสดงสถานะการบันทึก
    const badge = document.getElementById("auto-save-alert");
    if(badge) { 
        badge.innerText = "✅ บันทึกข้อมูลอัตโนมัติแล้ว";
        badge.style.opacity = "1"; 
        setTimeout(() => badge.style.opacity = "0", 2000); 
    }
}

// [3] โหลดข้อมูลตารางกลับมาแสดง (ป้องกันแอดมินเผลอปิดเว็บ)
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
            rowsHtml += `
                <tr>
                    <td><input type="text" value="${r[0]}" oninput="saveData()" placeholder="ชื่อคนไล่"></td>
                    <td><input type="text" value="${r[1]}" oninput="saveData()" placeholder="ราคา"></td>
                    <td><input type="text" value="${r[2]}" oninput="saveData()" placeholder="ชื่อคนยั้ง"></td>
                    <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>
                </tr>`;
        });

        newTable.innerHTML = `
            <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
            <div class="card-header">
                <input type="text" class="table-title-input" value="${tableData.title}" oninput="saveData()" placeholder="ใส่ชื่อค่ายที่นี่...">
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
    });
    updateDashboardStats();
}

// [4] จัดการเพิ่ม/ลบ แถวและตาราง
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
                    <td><input type="text" oninput="saveData()" placeholder=""></td>
                    <td><input type="text" oninput="saveData()" placeholder=""></td>
                    <td><input type="text" oninput="saveData()" placeholder=""></td>
                    <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>
                </tr>
            </tbody>
        </table>
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)">+ เพิ่มแผลที่เล่น</button>`;
    
    container.appendChild(newTable);
    updateDashboardStats();
    saveData();
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" oninput="saveData()" placeholder=""></td>
        <td><input type="text" oninput="saveData()" placeholder=""></td>
        <td><input type="text" oninput="saveData()" placeholder=""></td>
        <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>`;
    tbody.appendChild(newRow);
    saveData();
}

function removeRow(button) {
    button.parentElement.parentElement.remove();
    saveData();
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

    showModal("ยืนยันการลบ", `ต้องการลบตาราง <b>${title}</b>? (กำไร: ฿${profit.toFixed(2)})`, "confirm", () => {
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

// [5] ระบบ Modal รองรับปุ่มลัด Enter/Esc
function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    const msgEl = document.getElementById('modal-msg');
    msgEl.innerHTML = message;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    if (currentModalKeyHandler) window.removeEventListener('keydown', currentModalKeyHandler);

    currentModalKeyHandler = (e) => {
        if (e.key === "Enter") {
            const inp = msgEl.querySelector('input');
            if (type === "input" && inp && inp.value) { closeModal(); if(callback) callback(inp.value); }
            else if (type !== "input") { closeModal(); if(callback) callback(); }
        } else if (e.key === "Escape") {
            closeModal();
        }
    };
    window.addEventListener('keydown', currentModalKeyHandler);

    if (type === "confirm") {
        const b1 = document.createElement("button");
        b1.innerText = "ยืนยัน (Enter)";
        b1.className = "btn-confirm";
        b1.style.background = "#e74c3c";
        b1.onclick = () => { closeModal(); if(callback) callback(); };
        const b2 = document.createElement("button");
        b2.innerText = "ยกเลิก (Esc)";
        b2.className = "btn-cancel";
        b2.onclick = closeModal;
        actions.appendChild(b1);
        actions.appendChild(b2);
    } else {
        const b = document.createElement("button");
        b.innerText = "ตกลง (Enter)";
        b.className = "btn-confirm";
        b.onclick = closeModal;
        actions.appendChild(b);
    }
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
    if (currentModalKeyHandler) {
        window.removeEventListener('keydown', currentModalKeyHandler);
        currentModalKeyHandler = null;
    }
}

// [6] ระบบหน้าต่างจับเวลาแบบจัดการได้เอง (New Window)
function openStopwatchWindow() {
    const width = 800, height = 750;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
    
    sw.document.write(`
        <html>
        <head>
            <title>จัดการเวลาบั้งไฟ</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { background: #1e3c72; color: white; font-family: 'Sarabun', sans-serif; padding: 30px; }
                .input-group { display: flex; gap: 10px; margin-bottom: 30px; }
                input { flex: 1; padding: 15px; border-radius: 12px; border: none; font-size: 1.1rem; outline: none; }
                .sw-table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
                .sw-table td { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; }
                .timer-text { font-family: monospace; font-size: 2.5rem; font-weight: bold; color: #2ecc71; }
                .btn-sw { border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; color: white; font-weight: bold; transition: 0.2s; }
                .btn-start { background: #2ecc71; } .btn-stop { background: #e74c3c; }
            </style>
        </head>
        <body>
            <h2><i class="fas fa-stopwatch"></i> ระบบจัดการเวลาหลายค่าย</h2>
            <div class="input-group">
                <input type="text" id="campInput" placeholder="พิมพ์ชื่อค่ายแล้วกด Enter... (Esc เพื่อปิด)">
                <button onclick="addNewRow()" style="background:#2ecc71; color:white; border:none; padding:0 25px; border-radius:12px; cursor:pointer; font-weight:bold;">เพิ่มค่าย</button>
            </div>
            <table class="sw-table"><tbody id="sw-tbody"></tbody></table>
            <script>
                window.addEventListener('keydown', (e) => {
                    if (e.key === "Enter") addNewRow();
                    else if (e.key === "Escape") window.close();
                });
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
                    const tr = btn.closest('tr');
                    clearInterval(tr.iv);
                    tr.dataset.running = "false"; tr.dataset.elapsed = 0;
                    tr.querySelector('.timer-text').innerText = "0.000";
                    const sBtn = tr.querySelector('.btn-sw');
                    sBtn.innerText = "เริ่ม"; sBtn.className = "btn-sw btn-start";
                }
            </script>
        </body>
        </html>
    `);
}

function updateDashboardStats() {
    const profitEl = document.getElementById("total-profit-display");
    const countEl = document.getElementById("active-tables-count");
    if(profitEl) profitEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    if(countEl) countEl.innerText = document.querySelectorAll(".table-container").length;
}

function clearAllHistory() {
    showModal("ล้างประวัติ", "คุณต้องการลบข้อมูลทั้งหมดถาวรใช่หรือไม่?", "confirm", () => {
        localStorage.clear();
        location.reload();
    });
}

// ระบบสำรองข้อมูลอัตโนมัติทุก 5 วินาที
setInterval(saveData, 5000);
