// --- 1. สไตล์ CSS ที่ต้องใช้ (รวมเข้ากับหน้าเว็บโดยอัตโนมัติ) ---
const style = document.createElement('style');
style.textContent = `
    /* ตกแต่งส่วนหัวของการ์ดเพื่อให้ Badge แสดงผลได้ถูกต้อง */
    .table-card {
        position: relative; /* สำคัญสำหรับการวาง Badge */
        padding-top: 45px !important; 
    }

    /* Badge กำไรสะสม Real-time มุมขวาบน (ตามรูปภาพ) */
    .profit-badge-live {
        position: absolute;
        top: -15px;
        right: 25px;
        background: #2ecc71; /* สีเขียว */
        color: white;
        padding: 6px 18px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
        z-index: 100;
        display: none; /* ซ่อนไว้ก่อนจนกว่าจะมีการคำนวณ */
    }

    /* เน้นแถวที่กำลังพิมพ์ (Row Highlight) */
    .active-row td {
        background-color: #f0f7ff !important;
    }
    .active-row input {
        background: white !important;
        border-color: #1e3c72 !important;
    }

    /* ปุ่มเพิ่มรายการด้านล่าง */
    .btn-main-add {
        background: #e8f5e9;
        color: #2e7d32;
        border: 2px dashed #2e7d32;
        padding: 10px 30px;
        border-radius: 50px;
        cursor: pointer;
        font-weight: bold;
        margin: 20px auto 0;
        display: block;
        transition: 0.3s;
    }
    .btn-main-add:hover {
        background: #2e7d32;
        color: white;
    }
`;
document.head.appendChild(style);

// --- 2. ตั้งค่าเสียงและข้อมูลพื้นฐาน ---
const sounds = {
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
    success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
    delete: new Audio('https://assets.mixkit.co/active_storage/sfx/251/251-preview.mp3'),
    popup: new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3')
};

function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].volume = 0.5;
        sounds[name].play().catch(() => {});
    }
}

let historyData = JSON.parse(localStorage.getItem("historyData") || "[]");
let totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
let currentModalKeyHandler = null;

// --- 3. การเริ่มต้นระบบ ---
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    updateDashboardStats();
    document.addEventListener('keydown', handleGlobalKeyDown);
});

// --- 4. หัวใจหลัก: ระบบคำนวณกำไรเรียลไทม์ (3 หลักขึ้นไป) ---
function calculateTableProfit(tableElement) {
    let profit = 0;
    tableElement.querySelectorAll("tbody tr").forEach(tr => {
        const priceInput = tr.querySelectorAll("input")[1]; // ช่องกลาง "ราคาเล่น"
        if (priceInput) {
            const val = priceInput.value.replace(/[Oo]/g, '0'); // เปลี่ยน O เป็น 0
            const match = val.match(/\d{3,}/); // หาตัวเลขที่ยาว 3 หลักขึ้นไปเท่านั้น
            if (match) {
                profit += (parseFloat(match[0]) * 0.10); // คิด 10%
            }
        }
    });
    return profit;
}

function refreshAllBadges() {
    document.querySelectorAll(".table-card").forEach(table => {
        const profit = calculateTableProfit(table);
        const badge = table.querySelector(".profit-badge-live");
        if (badge) {
            badge.innerText = `กำไรสะสม: ฿${profit.toFixed(2)}`;
            badge.style.display = profit > 0 ? "block" : "none";
        }
    });
}

// --- 5. การจัดการข้อมูล ---
function saveData() {
    const data = [];
    document.querySelectorAll(".table-card").forEach(table => {
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
    
    refreshAllBadges();
}

function loadData() {
    const raw = localStorage.getItem("savedTables");
    if (!raw) return;
    const data = JSON.parse(raw);
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(t => addTable(t.title, t.rows, true));
}

// --- 6. ฟังก์ชันสร้างตาราง (Table Actions) ---
function addTable(title = "", rows = null, isSilent = false) {
    if(!isSilent) playSound('click');
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-card");

    const rowBuilder = (r = ["", "", ""]) => `
        <tr onfocusin="this.classList.add('active-row')" onfocusout="this.classList.remove('active-row')">
            <td><input type="text" value="${r[0]}" oninput="saveData()" placeholder="..."></td>
            <td><input type="text" value="${r[1]}" oninput="saveData()" style="font-weight:bold; color:#2e7d32;" placeholder="0"></td>
            <td><input type="text" value="${r[2]}" oninput="saveData()" placeholder="..."></td>
            <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;

    let rowsHtml = rows ? rows.map(r => rowBuilder(r)).join('') : rowBuilder();

    newTable.innerHTML = `
        <span class="profit-badge-live">กำไรสะสม: ฿0.00</span>
        <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <input type="text" class="table-title-input" value="${title}" placeholder="สนามบอล+สายพิณ ท่อ3" oninput="saveData()">
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
        <button class="btn-main-add" onclick="addRow(this.previousElementSibling)">+ เพิ่มรายการ</button>`;
    
    container.appendChild(newTable);
    saveData();
}

function addRow(table) {
    playSound('click');
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    tr.setAttribute("onfocusin", "this.classList.add('active-row')");
    tr.setAttribute("onfocusout", "this.classList.remove('active-row')");
    tr.innerHTML = `
        <td><input type="text" oninput="saveData()"></td>
        <td><input type="text" oninput="saveData()" style="font-weight:bold; color:#2e7d32;"></td>
        <td><input type="text" oninput="saveData()"></td>
        <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>`;
    tbody.appendChild(tr);
    saveData();
}

function removeRow(btn) { 
    playSound('delete');
    btn.closest('tr').remove(); 
    saveData(); 
}

function removeTable(button) {
    const tableContainer = button.closest('.table-card');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    const calculatedProfit = calculateTableProfit(tableContainer);

    showConfirmModal(title, calculatedProfit, (finalProfit) => {
        playSound('success');
        const rowsData = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rowsData.push([cells[0]?.value || "", cells[1]?.value || "", cells[2]?.value || ""]);
        });

        historyData.push({ title, rows: rowsData, profit: finalProfit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += finalProfit;
        
        tableContainer.remove();
        saveData();
        updateDashboardStats();
    });
}

// --- 7. การนำทางและ UI อื่นๆ ---
function handleGlobalKeyDown(e) {
    if (e.target.tagName !== "INPUT") return;
    const currentInput = e.target;
    const currentTr = currentInput.closest('tr');
    if (!currentTr) return;
    
    const colIndex = Array.from(currentTr.querySelectorAll("input")).indexOf(currentInput);

    if (e.key === "ArrowDown") {
        const nextTr = currentTr.nextElementSibling;
        if (nextTr) nextTr.querySelectorAll("input")[colIndex]?.focus();
    } else if (e.key === "ArrowUp") {
        const prevTr = currentTr.previousElementSibling;
        if (prevTr) prevTr.querySelectorAll("input")[colIndex]?.focus();
    }
}

function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
}

// ระบบ Modal ยืนยันปิดยอด (พร้อมรองรับปุ่ม E)
function showConfirmModal(title, profit, callback) {
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = "ยืนยันการปิดยอด";
    document.getElementById('modal-msg').innerHTML = `ค่าย: <b>${title}</b><br>กำไรสุทธิ: <span style="color:green; font-size:1.5rem;">฿${profit.toFixed(2)}</span>`;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    const btnCancel = document.createElement("button");
    btnCancel.innerText = "ยกเลิก (Esc)";
    btnCancel.className = "btn-modal btn-cancel";
    btnCancel.onclick = closeModal;

    const btnNoProfit = document.createElement("button");
    btnNoProfit.innerText = "ไม่คิดยอด (E)";
    btnNoProfit.className = "btn-modal";
    btnNoProfit.style.background = "#e74c3c"; btnNoProfit.style.color = "white";
    btnNoProfit.onclick = () => { closeModal(); callback(0); };

    const btnConfirm = document.createElement("button");
    btnConfirm.innerText = "ตกลง (Enter)";
    btnConfirm.className = "btn-modal btn-confirm";
    btnConfirm.onclick = () => { closeModal(); callback(profit); };

    actions.append(btnCancel, btnNoProfit, btnConfirm);

    if (currentModalKeyHandler) window.removeEventListener('keydown', currentModalKeyHandler);
    currentModalKeyHandler = (e) => {
        if (e.key === "Enter") btnConfirm.click();
        else if (e.key.toLowerCase() === "e") btnNoProfit.click();
        else if (e.key === "Escape") btnCancel.click();
    };
    window.addEventListener('keydown', currentModalKeyHandler);
    modal.classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return alert("กรุณากรอกข้อมูลให้ครบ");
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent("เรียนคุณ " + name + "\\n" + msg + "\\n\\nตรวจสอบยอดได้ที่แอดมินครับ")}`, '_blank');
}
