let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

// [1] เริ่มต้นระบบเมื่อโหลดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
    loadData(); // โหลดตารางที่บันทึกค้างไว้
    
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        // คำนวณกำไรรวมจากประวัติเพื่อแสดงใน Dashboard
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats();
});

// [2] ระบบบันทึกข้อมูลอัตโนมัติ (จากตัวที่ 17)
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
    
    // แสดง Badge แจ้งเตือนการบันทึก (UI ตัวที่ 15)
    const badge = document.getElementById("auto-save-alert");
    if(badge) { 
        badge.style.opacity = "1"; 
        setTimeout(() => badge.style.opacity = "0", 2000); 
    }
}

// [3] การจัดการตาราง (เพิ่ม/ลบ)
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

function removeTable(button) {
    const tableContainer = button.closest('.table-container');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    
    // คำนวณกำไร 10% ก่อนลบ
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

        // เก็บเข้าประวัติ
        historyData.push({ title, rows: rowsData, profit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += profit;
        
        tableContainer.remove();
        saveData();
        updateDashboardStats();
    });
}

// [4] ระบบแสดงประวัติ (ปรับ UI ให้เหมือนตัวที่ 15)
function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ยังไม่มีประวัติ", "alert");
    
    let newWindow = window.open("", "History", "width=1000,height=800");
    let content = `
        <html>
        <head>
            <title>ประวัติการคิดยอด</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Sarabun', sans-serif; padding: 20px; background: #f0f2f5; }
                .table-card { background: white; border-radius: 20px; padding: 25px; margin-bottom: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                .header-title { font-size: 1.5rem; font-weight: bold; color: #1e3c72; text-align: center; background: #f0f4f8; padding: 10px; border-radius: 10px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 12px; border: 1px solid #eee; text-align: center; }
                th { background: #1e3c72; color: white; }
                .profit-tag { font-weight: bold; color: green; float: left; }
                .timestamp { font-size: 0.8rem; color: #888; text-align: right; }
            </style>
        </head>
        <body>
            <h2 style="text-align:center">📜 ประวัติการคิดยอด</h2>
            <div style="text-align:center; color:green; font-weight:bold; margin-bottom:20px;">💰 กำไรรวมทั้งหมด: ฿${totalDeletedProfit.toFixed(2)}</div>
    `;

    historyData.forEach((h) => {
        let rowsHtml = h.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('');
        content += `<div class="table-card"><div class="header-title">${h.title}</div><table><thead><tr><th>คนไล่</th><th>ราคา</th><th>คนยั้ง</th></tr></thead><tbody>${rowsHtml}</tbody></table><div style="margin-top:10px;"><span class="profit-tag">กำไร: ฿${h.profit.toFixed(2)}</span><div class="timestamp">ลบเมื่อ: ${h.timestamp}</div></div></div>`;
    });

    content += "</body></html>";
    newWindow.document.write(content);
    newWindow.document.close();
}

// [5] ระบบ Line OA (ยกมาจากตัวที่ 14-15)
const LINE_UID_MAP = {
    "Bungnot._": "U255dd67c1fef32fb0eae127149c7cadc",
    "🥰แอดมิน ตัวกลม🚀": "Ufe84b76808464511da99d60b7c7449b8" 
    // ... ใส่ชื่ออื่นๆ ตามความต้องการ
};

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return showModal("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบ", "alert");
    
    const uid = LINE_UID_MAP[name]; 
    if(uid) {
        pushText(uid, msg);
    } else {
        showModal("ไม่พบผู้ใช้", "ไม่พบรายชื่อในระบบ", "alert");
    }
}

async function pushText(to, text) {
    try {
        await fetch("http://102.129.229.219:5000/send_line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to, text }),
        });
        showModal("สำเร็จ", "ส่งข้อความเรียบร้อยแล้ว", "alert");
    } catch (err) {
        showModal("ผิดพลาด", "ไม่สามารถเชื่อมต่อ Server ได้", "alert");
    }
}

// [6] ระบบ Modal และ UI Helper
function updateDashboardStats() {
    const profitEl = document.getElementById("total-profit-display");
    if(profitEl) profitEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerHTML = message;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    if (type === "confirm") {
        const b1 = document.createElement("button");
        b1.innerText = "ยืนยัน"; b1.className = "btn-modal btn-confirm";
        b1.onclick = () => { closeModal(); if(callback) callback(); };
        const b2 = document.createElement("button");
        b2.innerText = "ยกเลิก"; b2.className = "btn-modal btn-cancel";
        b2.onclick = closeModal;
        actions.appendChild(b2); actions.appendChild(b1);
    } else {
        const b = document.createElement("button");
        b.innerText = "ตกลง"; b.className = "btn-modal btn-cancel";
        b.style.background = "#1e3c72"; b.style.color = "white";
        b.onclick = closeModal;
        actions.appendChild(b);
    }
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
}

function loadData() {
    const rawData = localStorage.getItem("savedTables");
    if (!rawData) return;
    const data = JSON.parse(rawData);
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(t => {
        // สร้างตารางคืนค่าจาก LocalStorage
        addTable();
        const lastTable = container.lastElementChild;
        lastTable.querySelector(".table-title-input").value = t.title;
        const tbody = lastTable.querySelector("tbody");
        tbody.innerHTML = t.rows.map(r => `<tr><td><input type="text" value="${r[0]}" oninput="saveData()"></td><td><input type="text" value="${r[1]}" oninput="saveData()"></td><td><input type="text" value="${r[2]}" oninput="saveData()"></td><td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td></tr>`).join('');
    });
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()"></td><td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>`;
    tbody.appendChild(tr);
    saveData();
}

function removeRow(btn) { btn.closest('tr').remove(); saveData(); }

function clearAllHistory() {
    showModal("ล้างประวัติ", "ลบข้อมูลทั้งหมดถาวรใช่หรือไม่?", "confirm", () => {
        localStorage.clear();
        location.reload();
    });
}

// ระบบสำรองข้อมูลอัตโนมัติ
setInterval(saveData, 10000);
