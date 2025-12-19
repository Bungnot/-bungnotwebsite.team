let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

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

// อัปเดตตัวเลข Dashboard
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

// ฟังก์ชันเพิ่มตาราง
function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    newTable.innerHTML = `
        <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <input type="text" class="table-title-input" placeholder="ระบุชื่อค่ายบั้งไฟ...">
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
                    <td><input type="text" placeholder="ชื่อคนไล่"></td>
                    <td><input type="text" placeholder="ราคา"></td>
                    <td><input type="text" placeholder="ชื่อคนยั้ง"></td>
                    <td><button class="btn-remove-row-premium" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
                </tr>
            </tbody>
        </table>
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)">
            <i><i class="fas fa-plus"></i></i> เพิ่มแผลเล่น
        </button>
    `;
    container.appendChild(newTable);
    updateDashboardStats();
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td><input type="text" placeholder="ชื่อคนไล่"></td>
        <td><input type="text" placeholder="ราคา"></td>
        <td><input type="text" placeholder="ชื่อคนยั้ง"></td>
        <td><button class="btn-remove-row-premium" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(row);
    row.querySelector("input").focus();
}

function removeRow(btn) {
    btn.closest("tr").remove();
    saveData();
}

function removeTable(btn) {
    const card = btn.closest(".table-card");
    const title = card.querySelector(".table-title-input").value;
    
    // คำนวณกำไร (รองรับ 4OO แทน 400)
    let profit = 0;
    card.querySelectorAll("tbody tr").forEach(tr => {
        const val = tr.querySelectorAll("input")[1].value.replace(/[Oo]/g, '0');
        const match = val.match(/\d{3,}/);
        if(match) profit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ลบตาราง", `ยืนยันการลบ? (กำไร: ฿${profit.toFixed(2)})`, "confirm", () => {
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
        showToast("ลบและบันทึกยอดแล้ว");
    });
}

// ระบบบันทึกข้อมูล
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
            row.innerHTML = `<td><input type="text" value="${r[0]}"></td><td><input type="text" value="${r[1]}"></td><td><input type="text" value="${r[2]}"></td><td><button class="btn-remove-row-premium" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>`;
            tbody.appendChild(row);
        });
    });
}

// ระบบ Modal
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
        inp.placeholder = "ระบุชื่อ...";
        msgEl.appendChild(inp);
        const b = document.createElement("button");
        b.innerText = "ตกลง";
        b.onclick = () => { closeModal(); if(callback) callback(inp.value); };
        actions.appendChild(b);
    } else if (type === "confirm") {
        const b1 = document.createElement("button");
        b1.innerText = "ยืนยัน";
        b1.onclick = () => { closeModal(); if(callback) callback(); };
        const b2 = document.createElement("button");
        b2.innerText = "ยกเลิก";
        b2.onclick = closeModal;
        actions.appendChild(b2);
        actions.querySelectorAll("button").forEach(btn => btn.style.padding = "10px 20px");
    } else {
        const b = document.createElement("button");
        b.innerText = "ตกลง";
        b.onclick = closeModal;
        actions.appendChild(b);
    }
    modal.classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

function clearAllHistory() {
    showModal("ล้างประวัติ", "คุณต้องการลบข้อมูลทั้งหมดถาวรใช่หรือไม่?", "confirm", () => {
        localStorage.clear();
        location.reload();
    });
}

function openStopwatchWindow() {
    showModal("จับเวลา", "ระบุชื่อค่ายบั้งไฟ:", "input", (name) => {
        if (!name) return;
        window.open("", "_blank", "width=400,height=400").document.write(`
            <html><body style="background:#2c3e50;color:white;text-align:center;font-family:sans-serif;">
            <h1>${name}</h1><div id="t" style="font-size:4rem;">0.000</div>
            <button onclick="s()" id="b" style="padding:15px 30px;font-size:1.5rem;border-radius:50px;border:none;cursor:pointer;">START</button>
            <script>let st=0,ac=0,iv;function s(){if(!ac){st=Date.now();iv=setInterval(()=>{document.getElementById('t').innerText=((Date.now()-st)/1000).toFixed(3)},10);document.getElementById('b').innerText='STOP';ac=1;}else{clearInterval(iv);}}</script>
            </body></html>
        `);
    });
}
