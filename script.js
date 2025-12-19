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
    showModal("ระบบจับเวลาหลายค่าย", "ระบุชื่อค่ายบั้งไฟเริ่มต้น:", "input", (name) => {
        if (!name) return;

        const width = 600;
        const height = 700;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
        
        sw.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ระบบจับเวลาบั้งไฟ</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    body { 
                        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); 
                        color: white; font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px;
                    }
                    .header { text-align: center; margin-bottom: 20px; }
                    .add-zone { display: flex; gap: 10px; margin-bottom: 20px; }
                    input[type="text"] { 
                        flex: 1; padding: 10px; border-radius: 10px; border: none; font-family: 'Sarabun';
                    }
                    .btn-add { background: #2ecc71; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; }
                    
                    .sw-table { width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.1); border-radius: 15px; overflow: hidden; }
                    .sw-table th { background: rgba(0,0,0,0.2); padding: 15px; text-align: left; }
                    .sw-table td { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); vertical-align: middle; }
                    
                    .timer-val { font-family: monospace; font-size: 1.8rem; font-weight: bold; min-width: 120px; display: inline-block; }
                    .controls { display: flex; gap: 8px; }
                    .btn-sw { border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; color: white; display: flex; align-items: center; gap: 5px; transition: 0.2s; }
                    .btn-start { background: #2ecc71; }
                    .btn-stop { background: #e74c3c; }
                    .btn-reset { background: #f39c12; }
                    .btn-del { background: rgba(255,255,255,0.2); }
                    .btn-sw:hover { transform: scale(1.05); }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2><i class="fas fa-stopwatch"></i> รายการจับเวลา</h2>
                </div>

                <div class="add-zone">
                    <input type="text" id="newCampName" placeholder="ระบุชื่อค่ายเพิ่มเติม...">
                    <button class="btn-add" onclick="addNewRow()"><i class="fas fa-plus"></i> เพิ่ม</button>
                </div>

                <table class="sw-table">
                    <thead>
                        <tr>
                            <th>ชื่อค่าย</th>
                            <th>เวลา (วินาที)</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="sw-tbody"></tbody>
                </table>

                <script>
                    function addNewRow(initialName) {
                        const nameInput = document.getElementById('newCampName');
                        const name = initialName || nameInput.value;
                        if (!name) return;

                        const tbody = document.getElementById('sw-tbody');
                        const tr = document.createElement('tr');
                        tr.dataset.elapsed = 0;
                        tr.dataset.running = "false";

                        tr.innerHTML = \`
                            <td style="font-weight:bold;">\${name}</td>
                            <td><span class="timer-val">0.000</span></td>
                            <td class="controls">
                                <button class="btn-sw btn-start" onclick="toggleRow(this)"><i class="fas fa-play"></i> เริ่ม</button>
                                <button class="btn-sw btn-reset" onclick="resetRow(this)"><i class="fas fa-redo"></i> รีเซ็ต</button>
                                <button class="btn-sw btn-del" onclick="this.closest('tr').remove()"><i class="fas fa-trash"></i></button>
                            </td>
                        \`;
                        tbody.appendChild(tr);
                        if (!initialName) nameInput.value = "";
                    }

                    function toggleRow(btn) {
                        const tr = btn.closest('tr');
                        const display = tr.querySelector('.timer-val');
                        
                        if (tr.dataset.running === "false") {
                            // เริ่มจับเวลา
                            tr.dataset.running = "true";
                            btn.innerHTML = '<i class="fas fa-pause"></i> หยุด';
                            btn.className = 'btn-sw btn-stop';
                            
                            const startTime = Date.now() - parseFloat(tr.dataset.elapsed);
                            tr.interval = setInterval(() => {
                                const currentElapsed = Date.now() - startTime;
                                tr.dataset.elapsed = currentElapsed;
                                display.innerText = (currentElapsed / 1000).toFixed(3);
                            }, 10);
                        } else {
                            // หยุดเวลา
                            tr.dataset.running = "false";
                            btn.innerHTML = '<i class="fas fa-play"></i> เริ่ม';
                            btn.className = 'btn-sw btn-start';
                            clearInterval(tr.interval);
                        }
                    }

                    function resetRow(btn) {
                        const tr = btn.closest('tr');
                        clearInterval(tr.interval);
                        tr.dataset.running = "false";
                        tr.dataset.elapsed = 0;
                        tr.querySelector('.timer-val').innerText = "0.000";
                        const startBtn = tr.querySelector('.btn-sw');
                        startBtn.innerHTML = '<i class="fas fa-play"></i> เริ่ม';
                        startBtn.className = 'btn-sw btn-start';
                    }

                    // เพิ่มชื่อแรกที่กรอกมาจากหน้าหลัก
                    addNewRow("\${name}");
                </script>
            </body>
            </html>
        `);
    });
}
