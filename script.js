let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

document.addEventListener("DOMContentLoaded", () => {
    loadData(); 
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats();
});

function saveData() {
    const data = [];
    document.querySelectorAll(".table-container").forEach(table => {
        const title = table.querySelector(".table-title-input").value;
        const rows = [];
        table.querySelectorAll("tbody tr").forEach(r => {
            const cells = r.querySelectorAll("input");
            if (cells.length >= 3) rows.push([cells[0].value, cells[1].value, cells[2].value]);
        });
        data.push({ title, rows });
    });
    localStorage.setItem("savedTables", JSON.stringify(data));
    const badge = document.getElementById("auto-save-alert");
    badge.style.opacity = "1"; setTimeout(() => badge.style.opacity = "0", 2000);
}

function addTable(title = "", rows = null) {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");
    let rowsHtml = rows ? rows.map(r => `<tr><td><input type="text" value="${r[0]}" oninput="saveData()"></td><td><input type="text" value="${r[1]}" oninput="saveData()"></td><td><input type="text" value="${r[2]}" oninput="saveData()"></td><td><button onclick="this.closest('tr').remove();saveData()">ลบ</button></td></tr>`).join('') 
    : `<tr><td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()"></td><td><button onclick="this.closest('tr').remove();saveData()">ลบ</button></td></tr>`;

    newTable.innerHTML = `
        <button onclick="removeTable(this)" style="position:absolute;top:15px;right:15px;cursor:pointer;">X</button>
        <input type="text" class="table-title-input" value="${title}" placeholder="ชื่อค่าย..." oninput="saveData()">
        <table class="custom-table">
            <thead><tr><th class="th-green">รายชื่อคนไล่</th><th class="th-orange">ราคาเล่น</th><th class="th-red">รายชื่อคนยั้ง</th><th class="th-purple">จัดการ</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        <button onclick="addRow(this.previousElementSibling)" style="margin-top:15px;cursor:pointer;">+ เพิ่มแถว</button>`;
    container.appendChild(newTable);
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

    showModal("ยืนยันการปิดยอด", `ค่าย: <b>${title}</b><br>กำไร: ฿${profit.toFixed(2)}`, "confirm", () => {
        const rowsData = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rowsData.push([cells[0].value, cells[1].value, cells[2].value]);
        });
        historyData.push({ title, rows: rowsData, profit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += profit;
        tableContainer.remove();
        saveData(); updateDashboardStats();
    });
}

// ฟังก์ชันประวัติที่ก๊อบปี้หน้าหลักมาเป๊ะๆ
function showHistory() {
    if (historyData.length === 0) return alert("ไม่มีประวัติ");
    let win = window.open("", "History", "width=1200,height=900");
    let style = `
        <style>
            body { font-family: 'Sarabun'; background: linear-gradient(135deg, #1e3c72, #2a5298); padding: 40px 20px; }
            .table-card { background: white; border-radius: 30px; padding: 35px; margin: 0 auto 40px; max-width: 1100px; border-top: 8px solid #1e3c72; position:relative; }
            .history-header-box { font-size: 1.6rem; font-weight: bold; color: #1e3c72; text-align: center; border: 2.5px solid #94a3b8; background: #e2e8f0; padding: 12px; border-radius: 16px; width: 60%; margin: 0 auto 30px; }
            .custom-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
            .th-green { background: #2ecc71; color:white; border-radius: 15px 0 0 15px; padding:15px; }
            .th-orange { background: #f39c12; color:white; padding:15px; }
            .th-red { background: #e74c3c; color:white; padding:15px; }
            .th-purple { background: #9b59b6; color:white; border-radius: 0 15px 15px 0; padding:15px; }
            .custom-table td { text-align: center; padding: 14px; background: #e2e8f0; border: 2.5px solid #cbd5e1; border-radius: 14px; font-weight:600; }
        </style>`;
    let content = `<html><head>${style}</head><body><h2 style="text-align:center;color:white;">📜 ประวัติการคิดยอด</h2>`;
    [...historyData].reverse().forEach(h => {
        let rows = h.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>🗑️</td></tr>`).join('');
        content += `<div class="table-card">
            <div style="position:absolute;top:15px;left:20px;background:#e8f5e9;padding:5px 15px;border-radius:50px;color:green;font-weight:bold;">฿${h.profit.toFixed(2)}</div>
            <div class="history-header-box">${h.title}</div>
            <table class="custom-table">
                <thead><tr><th class="th-green">คนไล่</th><th class="th-orange">ราคา</th><th class="th-red">คนยั้ง</th><th class="th-purple">จัดการ</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            <div style="text-align:right;font-size:0.8rem;color:#64748b;margin-top:10px;">${h.timestamp}</div>
        </div>`;
    });
    win.document.write(content + "</body></html>");
}

function showModal(title, msg, type, cb) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerHTML = msg;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = `<button onclick="closeModal()">ยกเลิก</button><button id="confirm-btn">ตกลง</button>`;
    document.getElementById('confirm-btn').onclick = () => { cb(); closeModal(); };
    modal.classList.add('active');
}
function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }
function updateDashboardStats() { document.getElementById("total-profit-display").innerText = `฿${totalDeletedProfit.toFixed(2)}`; }
function loadData() { /* ฟังก์ชันโหลดตารางที่บันทึกไว้ */ }
function clearAllHistory() { if(confirm("ล้างทั้งหมด?")) { localStorage.clear(); location.reload(); } }
