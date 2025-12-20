/* ===============================
   GLOBAL DATA
================================ */
let historyData = [];
let totalDeletedProfit = 0;

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
    loadData();

    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
    }

    updateDashboardStats();
});

/* ===============================
   SAVE CURRENT TABLES
================================ */
function saveData() {
    const data = [];
    document.querySelectorAll(".table-container").forEach(table => {
        const title = table.querySelector(".table-title-input")?.value || "";
        const rows = [];

        table.querySelectorAll("tbody tr").forEach(tr => {
            const inputs = tr.querySelectorAll("input");
            rows.push([
                inputs[0]?.value || "",
                inputs[1]?.value || "",
                inputs[2]?.value || ""
            ]);
        });

        data.push({ title, rows });
    });

    localStorage.setItem("savedTables", JSON.stringify(data));
}

/* ===============================
   ADD TABLE
================================ */
function addTable(title = "", rows = null) {
    const container = document.getElementById("tables-container");
    const div = document.createElement("div");
    div.className = "table-container table-card";

    let body = rows
        ? rows.map(r => `
            <tr>
                <td><input value="${r[0]}" oninput="saveData()"></td>
                <td><input value="${r[1]}" oninput="saveData()"></td>
                <td><input value="${r[2]}" oninput="saveData()"></td>
                <td><button onclick="removeRow(this)">🗑</button></td>
            </tr>`).join("")
        : `
            <tr>
                <td><input oninput="saveData()"></td>
                <td><input oninput="saveData()"></td>
                <td><input oninput="saveData()"></td>
                <td><button onclick="removeRow(this)">🗑</button></td>
            </tr>`;

    div.innerHTML = `
        <button class="btn-close-table" onclick="removeTable(this)">✖</button>
        <input class="table-title-input" value="${title}" placeholder="ชื่อค่าย" oninput="saveData()">

        <table class="custom-table">
            <thead>
                <tr>
                    <th>รายชื่อคนไล่</th>
                    <th>ราคาเล่น</th>
                    <th>รายชื่อคนยั้ง</th>
                    <th>จัดการ</th>
                </tr>
            </thead>
            <tbody>${body}</tbody>
        </table>

        <button onclick="addRow(this.previousElementSibling)">+ เพิ่มแผล</button>
    `;

    container.appendChild(div);
    saveData();
}

/* ===============================
   REMOVE TABLE (SAVE TO HISTORY)
================================ */
function removeTable(btn) {
    const table = btn.closest(".table-container");
    const title = table.querySelector(".table-title-input").value || "ไม่ระบุชื่อ";

    let profit = 0;
    table.querySelectorAll("tbody tr").forEach(tr => {
        const val = tr.querySelectorAll("input")[1].value.replace(/[Oo]/g, "0");
        const match = val.match(/\d+/);
        if (match) profit += parseFloat(match[0]) * 0.10;
    });

    if (!confirm(`ปิดยอดค่าย "${title}" ?`)) return;

    const historyItem = {
        title,
        deletedAt: new Date().toLocaleString("th-TH"),
        profit,
        rows: []
    };

    table.querySelectorAll("tbody tr").forEach(tr => {
        const inputs = tr.querySelectorAll("input");
        historyItem.rows.push([
            inputs[0].value,
            inputs[1].value,
            inputs[2].value
        ]);
    });

    historyData.push(historyItem);
    localStorage.setItem("historyData", JSON.stringify(historyData));

    totalDeletedProfit += profit;
    table.remove();
    saveData();
    updateDashboardStats();
}

/* ===============================
   ROW
================================ */
function addRow(table) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input oninput="saveData()"></td>
        <td><input oninput="saveData()"></td>
        <td><input oninput="saveData()"></td>
        <td><button onclick="removeRow(this)">🗑</button></td>
    `;
    table.querySelector("tbody").appendChild(tr);
    saveData();
}

function removeRow(btn) {
    btn.closest("tr").remove();
    saveData();
}

/* ===============================
   SHOW HISTORY (ONE BIG TABLE)
================================ */
function showHistory() {
    if (historyData.length === 0) {
        showModal("แจ้งเตือน", "ไม่มีประวัติ", "alert");
        return;
    }

    const win = window.open("", "_blank", "width=1200,height=800");

    let html = `
    <html>
    <head>
        <title>ประวัติการคิดยอด</title>
        <style>
            body {
                font-family: Sarabun, sans-serif;
                background: #f4f7f9;
                padding: 20px;
            }
            h2 {
                text-align: center;
                margin-bottom: 20px;
            }
            .hint {
                text-align: center;
                color: #64748b;
                margin-bottom: 20px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            th, td {
                border: 1px solid #e5e7eb;
                padding: 12px;
                text-align: center;
                font-size: 0.95rem;
            }
            th {
                background: #e5e7eb;
                font-weight: bold;
            }
            tr:nth-child(even) {
                background: #f8fafc;
            }
        </style>
    </head>
    <body>

    <h2>📜 ประวัติการคิดยอด (รวมทั้งหมด)</h2>
    <div class="hint">💡 ใช้ <b>Ctrl + F</b> เพื่อค้นหาชื่อ / ราคา / ค่าย ได้ทันที</div>

    <table>
        <thead>
            <tr>
                <th>ค่าย</th>
                <th>ปิดยอดเมื่อ</th>
                <th>รายชื่อคนไล่</th>
                <th>ราคาเล่น</th>
                <th>รายชื่อคนยั้ง</th>
            </tr>
        </thead>
        <tbody>
    `;

    historyData.forEach(h => {
        h.rows.forEach(r => {
            html += `
            <tr>
                <td>${h.title}</td>
                <td>${h.deletedAt || "-"}</td>
                <td>${r[0]}</td>
                <td>${r[1]}</td>
                <td>${r[2]}</td>
            </tr>
            `;
        });
    });

    html += `
        </tbody>
    </table>

    </body>
    </html>
    `;

    win.document.write(html);
}


/* ===============================
   LOAD & DASHBOARD
================================ */
function loadData() {
    const raw = localStorage.getItem("savedTables");
    if (!raw) return;

    JSON.parse(raw).forEach(t => addTable(t.title, t.rows));
}

function updateDashboardStats() {
    const el = document.getElementById("total-profit-display");
    if (el) el.innerText = `฿${totalDeletedProfit.toFixed(2)}`;
}
