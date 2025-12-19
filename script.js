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
    showModal("จับเวลาบั้งไฟ", "ระบุชื่อค่ายบั้งไฟ:", "input", (name) => {
        if (!name) return;

        // กำหนดขนาดหน้าต่างใหม่
        const width = 400;
        const height = 450;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        // เปิดหน้าต่างใหม่
        const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
        
        sw.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>จับเวลา - ${name}</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    body { 
                        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); 
                        color: white; 
                        text-align: center; 
                        font-family: 'Sarabun', sans-serif; 
                        margin: 0; 
                        display: flex; 
                        flex-direction: column; 
                        justify-content: center; 
                        height: 100vh;
                    }
                    .container { padding: 20px; }
                    h2 { font-size: 1.8rem; margin-bottom: 10px; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
                    .time-display { 
                        font-size: 5rem; 
                        font-weight: bold; 
                        font-family: monospace; 
                        margin: 20px 0; 
                        background: rgba(255,255,255,0.1); 
                        padding: 20px; 
                        border-radius: 20px; 
                        box-shadow: inset 0 0 20px rgba(0,0,0,0.2);
                    }
                    .controls { display: flex; justify-content: center; gap: 15px; }
                    .btn { 
                        padding: 15px 35px; 
                        font-size: 1.2rem; 
                        border-radius: 50px; 
                        border: none; 
                        cursor: pointer; 
                        font-weight: bold; 
                        transition: 0.3s; 
                        display: flex; 
                        align-items: center; 
                        gap: 10px; 
                    }
                    .btn-start { background: #2ecc71; color: white; box-shadow: 0 4px 15px rgba(46,204,113,0.4); }
                    .btn-stop { background: #e74c3c; color: white; box-shadow: 0 4px 15px rgba(231,76,60,0.4); }
                    .btn-reset { background: #f39c12; color: white; box-shadow: 0 4px 15px rgba(243,156,18,0.4); }
                    .btn:hover { transform: translateY(-3px); filter: brightness(1.1); }
                    .btn:active { transform: translateY(0); }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2><i class="fas fa-rocket"></i> ${name}</h2>
                    <div class="time-display" id="display">0.000</div>
                    <div class="controls">
                        <button id="mainBtn" onclick="toggle()" class="btn btn-start">
                            <i class="fas fa-play"></i> START
                        </button>
                        <button onclick="reset()" class="btn btn-reset">
                            <i class="fas fa-redo"></i> RESET
                        </button>
                    </div>
                </div>

                <script>
                    let startTime = 0;
                    let elapsed = 0;
                    let timerInterval;
                    let running = false;

                    function toggle() {
                        const btn = document.getElementById('mainBtn');
                        const display = document.getElementById('display');

                        if (!running) {
                            // Start
                            running = true;
                            startTime = Date.now() - elapsed;
                            timerInterval = setInterval(() => {
                                elapsed = Date.now() - startTime;
                                display.innerText = (elapsed / 1000).toFixed(3);
                            }, 10);
                            btn.innerHTML = '<i class="fas fa-pause"></i> STOP';
                            btn.className = 'btn btn-stop';
                        } else {
                            // Stop
                            running = false;
                            clearInterval(timerInterval);
                            btn.innerHTML = '<i class="fas fa-play"></i> START';
                            btn.className = 'btn btn-start';
                        }
                    }

                    function reset() {
                        running = false;
                        clearInterval(timerInterval);
                        elapsed = 0;
                        document.getElementById('display').innerText = '0.000';
                        const btn = document.getElementById('mainBtn');
                        btn.innerHTML = '<i class="fas fa-play"></i> START';
                        btn.className = 'btn btn-start';
                    }
                </script>
            </body>
            </html>
        `);
    });
}
