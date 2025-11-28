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
});

// ===== [LINE CONFIG] =====
const CHANNEL_ACCESS_TOKEN = "vVfgfuTuxGYIrGci7BVXJ1LufaMVWvkbvByxhEnfmIxd5zAx8Uc/1SsIRAjkeLvSt9e2UqmYskLOixXKg2qaqMNAIastgvza7RfaTgiAa+JC35fvI77zBxA+M7ZbyPbxft0oTc4g5A6dbbwWmid2rgdB04t89/1O/w1cDnyilFU=";
const LINE_UID_MAP = {
    "Bungnot._": "U255dd67c1fef32fb0eae127149c7cadc",
    "BuK Do": "U163186c5013c8f1e4820291b7b1d86bd",
    "บริการบอทไลน์ V7": "U0e1f53b2f1cc24a7316473480bd2861a",
    "อิสลาม แห่งอิหร่าน": "U2f156aa5effee7c1ee349b9320a35381",
    "Atcharapun Aom": "U3e3ac0e16feb88534470f897ebfa38ec",
    "BenZ": "U3e03ef4725e04db4a9729db77bb16b6c",
    "เซียนแปะโรงสี💵💰💲🪙": "U58a1222aeb7b82dea040fa50e1791a7f",
    "ต้า💯💯": "U5e2ca7eb5183684b91ba83c801ef713b",
    "M8N": "U6a862e37864d5f522e8af490dd120440",
    "Few": "U818fd2665026afe242a2c27f441642de",
    "ยี่สิบโท หมิง": "Ua914df11d1747d2eea4fbdd06a9c1052",
    "Nuiy Weerapon": "Ubdbaa2989f39daff930a4ca8d253344c",
    "Jaran Kk.": "Uc08e788e6816a25d517ef9a32c1e381e",
    "สารวัตรกึ่ม👮‍♂️🚔": "Uc2013ea8397da6d19cbe0f931a04c949",
    "Aek💰": "Uc3594ebfcb19bdc4e05b62b8525e9eed",
    "ฟลุ๊กฟิก😊😉": "Uc90d6d7a78e56640cdf3f93e4472127b",
    "กล้อง🔭อินเฟอร์เรส": "Ucd41b3d1c42f80e42ed691a7d9309c79",
    "Satthapan": "Ud27019d7ae7d4e6be81e1a2e3f6ee6ea",
    "Thanaphut Sks": "Ue93a927aa8b7aafb4b8dc7b11e58c1f3",
    "🌠ผมชื่อบอยนะคร้าา🌠💯": "Uebd6b15d2ff306abddcfb47fe56a17f0",
    "🥰แอดมิน ตัวกลม🚀": "Ufe84b76808464511da99d60b7c7449b8"
};

function getLineIdFromName(nameRaw) {
    if (!nameRaw) return "";
    const name = nameRaw.replace("@", "").trim();
    return LINE_UID_MAP[name] || "";
}

async function pushText(to, text) {
    try {
        await fetch("http://102.129.229.219:5000/send_line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to, text }),
        });
    } catch (err) { console.error("Error:", err); }
}

// ===== CUSTOM MODAL LOGIC (Keyboard Support) =====
function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-msg');
    const actionsEl = document.getElementById('modal-actions');
    const iconEl = document.getElementById('modal-icon');

    titleEl.innerText = title;
    msgEl.innerText = message;
    actionsEl.innerHTML = ""; 

    if (currentModalKeyHandler) {
        document.removeEventListener("keydown", currentModalKeyHandler);
    }
    currentModalKeyHandler = (e) => {
        if (e.key === "Escape") closeModal();
        else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (type === "confirm" && callback) { closeModal(); callback(); } 
            else closeModal();
        }
    };
    document.addEventListener("keydown", currentModalKeyHandler);

    if (type === "confirm") {
        iconEl.className = "fas fa-question-circle modal-icon icon-warn";
        const btnYes = document.createElement("button");
        btnYes.className = "btn-modal btn-confirm";
        btnYes.innerText = "ยืนยันลบ";
        btnYes.onclick = () => { closeModal(); if (callback) callback(); };

        const btnNo = document.createElement("button");
        btnNo.className = "btn-modal btn-cancel";
        btnNo.innerText = "ยกเลิก";
        btnNo.onclick = closeModal;

        actionsEl.appendChild(btnNo);
        actionsEl.appendChild(btnYes);
        setTimeout(() => btnYes.focus(), 100);
    } else {
        iconEl.className = "fas fa-info-circle modal-icon icon-warn";
        const btnOk = document.createElement("button");
        btnOk.className = "btn-modal btn-cancel";
        btnOk.innerText = "ตกลง";
        btnOk.style.background = "#3498db";
        btnOk.style.color = "white";
        btnOk.onclick = closeModal;
        actionsEl.appendChild(btnOk);
        setTimeout(() => btnOk.focus(), 100);
    }
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
    if (currentModalKeyHandler) {
        document.removeEventListener("keydown", currentModalKeyHandler);
        currentModalKeyHandler = null;
    }
}

// ===== Function หลัก =====
function addRow(table) {
    const tbody = table.querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" placeholder="ชื่อคนไล่"></td>
        <td><input type="text" placeholder="ราคา"></td>
        <td><input type="text" placeholder="ชื่อคนยั้ง"></td>
        <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>
    `;
    tbody.appendChild(newRow);
}

function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    newTable.innerHTML = `
        <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <div class="card-header">
            <input type="text" class="table-title-input" placeholder="ใส่ชื่อค่ายที่นี่...">
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
                    <td><input type="text" placeholder="ชื่อคนไล่"></td>
                    <td><input type="text" placeholder="ราคา"></td>
                    <td><input type="text" placeholder="ชื่อคนยั้ง"></td>
                    <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>
                </tr>
            </tbody>
        </table>
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)">+ เพิ่มแผลที่เล่น</button>
    `;
    container.appendChild(newTable);
    newTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeTable(button) {
    const tableContainer = button.parentElement;
    const inputs = tableContainer.querySelectorAll('input');
    if (!Array.from(inputs).some(i => i.value.trim() !== "")) {
        showModal("แจ้งเตือน", "ต้องกรอกข้อมูลก่อนจึงลบได้", "alert");
        return;
    }

    const priceInputs = tableContainer.querySelectorAll("td:nth-child(2) input");
    let totalProfit = 0;
    priceInputs.forEach(input => {
        const match = input.value.match(/\d{3,}/);
        if (match) totalProfit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ยืนยันการลบ", `ต้องการลบตารางนี้ใช่ไหม?\n(กำไร: ฿${totalProfit.toFixed(2)})`, "confirm", () => {
        const title = tableContainer.querySelector('.table-title-input').value;
        const rowsData = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rowsData.push([cells[0]?.value || "", cells[1]?.value || "", cells[2]?.value || ""]);
        });

        historyData.push({
            title: title, rows: rowsData, profit: totalProfit, timestamp: new Date().toLocaleString("th-TH")
        });
        
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += totalProfit;
        
        tableContainer.style.transition = "opacity 0.5s";
        tableContainer.style.opacity = '0';
        setTimeout(() => { tableContainer.remove(); saveData(); }, 500);
    });
}

function removeRow(button) {
    const row = button.parentElement.parentElement;
    if (!Array.from(row.querySelectorAll('input')).some(i => i.value.trim() !== "")) {
        showModal("แจ้งเตือน", "ต้องกรอกข้อมูลก่อนลบ", "alert");
        return;
    }
    row.remove();
    saveData();
}

// ===== แสดงประวัติ (ปุ่มล้างประวัติเล็กๆ) =====
function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ยังไม่มีประวัติ", "alert");
    
    let newWindow = window.open("", "History", "width=1000,height=800");
    
    let content = `
        <html>
        <head>
            <title>ประวัติการลบ (Text Mode)</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { font-family: 'Sarabun', sans-serif; padding: 20px; background: #f0f2f5; }
                .table-card { 
                    background: white; border-radius: 20px; padding: 25px; margin-bottom: 30px; 
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1); max-width: 900px; margin-left: auto; margin-right: auto;
                }
                .header-title { font-size: 1.5rem; font-weight: bold; color: #1e3c72; text-align: center; background: #f0f4f8; padding: 10px; border-radius: 10px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: separate; border-spacing: 0; }
                th { padding: 12px; color: white; font-weight: 600; text-align: center; }
                td { padding: 10px; border-bottom: 1px solid #eee; }
                .th-green { background: linear-gradient(45deg, #11998e, #38ef7d); border-radius: 10px 0 0 0; }
                .th-orange { background: linear-gradient(45deg, #f2994a, #f2c94c); }
                .th-red { background: linear-gradient(45deg, #eb3349, #f45c43); border-radius: 0 10px 0 0; }
                input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 8px; text-align: center; background: white; font-family: 'Sarabun'; font-size: 1rem; color: #333; }
                .timestamp { font-size: 0.8rem; color: #888; text-align: right; margin-top: 10px; }
                .profit-tag { font-weight: bold; color: green; float: left; }
                h2 { text-align: center; color: #1e3c72; }
                
                /* Container สรุปยอด */
                .summary { 
                    text-align: center; 
                    font-size: 1.2rem; 
                    font-weight: bold; 
                    color: green; 
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 15px;
                }
                
                /* ปุ่มล้างประวัติเล็กๆ */
                .btn-clear-all {
                    background: #ff6b6b; color: white; border: none; padding: 5px 12px;
                    border-radius: 20px; cursor: pointer; font-size: 0.8rem; font-family: 'Sarabun';
                    transition: 0.2s; display: inline-flex; align-items: center; gap: 5px;
                }
                .btn-clear-all:hover { background: #fa5252; transform: scale(1.05); }
            </style>
        </head>
        <body>
            <h2>📜 ประวัติการลบตาราง (ค้นหาได้)</h2>
            <div class="summary">
                <span>💰 กำไรรวมทั้งหมด: ฿${totalDeletedProfit.toFixed(2)}</span>
                <button onclick="clearAllHistory()" class="btn-clear-all"><i class="fas fa-trash"></i> ล้างประวัติ</button>
            </div>
    `;

    historyData.forEach((h) => {
        let rowsHtml = "";
        h.rows.forEach(r => {
            rowsHtml += `<tr><td><input type="text" value="${r[0]}" readonly></td><td><input type="text" value="${r[1]}" readonly></td><td><input type="text" value="${r[2]}" readonly></td></tr>`;
        });
        content += `<div class="table-card"><div class="header-title">${h.title || "(ไม่มีชื่อค่าย)"}</div><table><thead><tr><th class="th-green">รายชื่อคนไล่</th><th class="th-orange">ราคาเล่น</th><th class="th-red">รายชื่อคนยั้ง</th></tr></thead><tbody>${rowsHtml}</tbody></table><div class="timestamp"><span class="profit-tag">กำไร: ฿${h.profit.toFixed(2)}</span>ลบเมื่อ: ${h.timestamp}</div></div>`;
    });

    content += `
        <script>
            function clearAllHistory() {
                if(confirm('ยืนยันลบประวัติทั้งหมด?')) {
                    localStorage.removeItem('historyData');
                    if(window.opener) {
                        window.opener.historyData = [];
                        window.opener.totalDeletedProfit = 0;
                        window.opener.alert('ล้างประวัติแล้ว');
                    }
                    window.close();
                }
            }
        </script>
    </body></html>`;
    
    newWindow.document.write(content);
    newWindow.document.close();
}

function saveData() {
    const data = [];
    document.querySelectorAll(".table-container").forEach(table => {
        const title = table.querySelector(".table-title-input").value;
        const rows = [];
        table.querySelectorAll("tbody tr").forEach(r => {
            const cells = r.querySelectorAll("input");
            rows.push([cells[0]?.value||"", cells[1]?.value||"", cells[2]?.value||""]);
        });
        data.push({ title, rows });
    });
    localStorage.setItem("savedTables", JSON.stringify(data));
    const badge = document.getElementById("auto-save-alert");
    if(badge) { badge.style.opacity = "1"; setTimeout(() => badge.style.opacity = "0", 2000); }
}

function loadData() {
    const data = JSON.parse(localStorage.getItem("savedTables"));
    if (!data) return;
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(table => {
        const newTable = document.createElement("div");
        newTable.classList.add("table-container", "table-card");
        let rowsHtml = "";
        table.rows.forEach(r => {
            rowsHtml += `<tr><td><input type="text" value="${r[0]}" placeholder="ชื่อคนไล่"></td><td><input type="text" value="${r[1]}" placeholder="ราคา"></td><td><input type="text" value="${r[2]}" placeholder="ชื่อคนยั้ง"></td><td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td></tr>`;
        });
        newTable.innerHTML = `<button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button><div class="card-header"><input type="text" class="table-title-input" value="${table.title}" placeholder="ใส่ชื่อค่ายที่นี่..."></div><table class="custom-table"><thead><tr><th class="th-green">รายชื่อคนไล่</th><th class="th-orange">ราคาเล่น</th><th class="th-red">รายชื่อคนยั้ง</th><th class="th-purple">จัดการ</th></tr></thead><tbody>${rowsHtml}</tbody></table><button class="btn-add-row" onclick="addRow(this.previousElementSibling)">+ เพิ่มแผลที่เล่น</button>`;
        container.appendChild(newTable);
    });
}

document.addEventListener("keydown", e => { if (e.ctrlKey && e.key.toLowerCase() === "u") { e.preventDefault(); showModal("เตือน", "ไม่อนุญาตให้ดูซอร์สโค้ด", "alert"); }});
setInterval(() => { saveData(); console.log("Auto saved"); }, 15000);

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return showModal("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบ", "alert");
    const uid = getLineIdFromName(name);
    uid ? pushText(uid, msg) : showModal("ไม่พบผู้ใช้", "ไม่พบรายชื่อในระบบ", "alert");
}
