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

    const win = window.open("", "_blank", "width=1300,height=900");

    let html = `
    <html>
    <head>
        <title>ประวัติการคิดยอด</title>
        <style>
            body {
                font-family: Sarabun, sans-serif;
                background: #f4f7f9;
                padding: 30px;
            }
            .history-card {
                margin-bottom: 50px;
            }
            .meta {
                margin-bottom: 10px;
                color: #475569;
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>

    <h2 style="text-align:center">📜 ประวัติการคิดยอด</h2>
    <p style="text-align:center;color:#64748b">
        ใช้ <b>Ctrl + F</b> เพื่อค้นหาชื่อได้ทันที
    </p>
    `;

    historyData.forEach(h => {
        html += `
        <div class="history-card">
            <div class="meta">
                <b>ค่าย:</b> ${h.title} |
                <b>ปิดยอดเมื่อ:</b> ${h.deletedAt}
            </div>

            <div class="table-wrapper">
                ${h.tableHTML}
            </div>
        </div>
        `;
    });

    html += `
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
