// --- 1. การตั้งค่าสไตล์ (Inject CSS) ---
const style = document.createElement('style');
style.textContent = `
    .table-card { position: relative; padding-top: 45px !important; }
    .profit-badge-live {
        position: absolute; top: -15px; right: 25px;
        background: #2ecc71; color: white; padding: 6px 18px;
        border-radius: 50px; font-size: 14px; font-weight: bold;
        box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4); z-index: 100;
        display: none;
    }
    .active-row td { background-color: #f0f7ff !important; }
    .active-row input { background: white !important; border-color: #1e3c72 !important; }
    .btn-main-add {
        background: #e8f5e9; color: #2e7d32; border: 2px dashed #2e7d32;
        padding: 10px 30px; border-radius: 50px; cursor: pointer;
        font-weight: bold; margin: 20px auto 0; display: block; transition: 0.3s;
    }
    .btn-main-add:hover { background: #2e7d32; color: white; }
`;
document.head.appendChild(style);

// --- 2. ตัวแปรและระบบเสียง ---
const sounds = {
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
    success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
    delete: new Audio('https://assets.mixkit.co/active_storage/sfx/251/251-preview.mp3'),
    popup: new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'),
    alert: new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
};

let historyData = JSON.parse(localStorage.getItem("historyData") || "[]");
let totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
let currentModalKeyHandler = null;
let isProcessingModal = false; // ป้องกันการคำนวณซ้ำ

// --- 3. เริ่มต้นระบบ ---
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    updateDashboardStats();
    document.addEventListener('keydown', handleGlobalKeyDown);
});

// --- 4. การคำนวณกำไร Real-time (10% จากเลข 3 หลักขึ้นไป) ---
function calculateTableProfit(tableElement) {
    let profit = 0;
    tableElement.querySelectorAll("tbody tr").forEach(tr => {
        const priceInput = tr.querySelectorAll("input")[1]; 
        if (priceInput) {
            const val = priceInput.value.replace(/[Oo]/g, '0');
            const match = val.match(/\d{3,}/);
            if (match) { profit += (parseFloat(match[0]) * 0.10); }
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

// --- 5. จัดการ Modal (แก้ไขบัคปุ่ม E และการกด Enter ซ้ำ) ---
function showConfirmModal(title, profit, callback) {
    if (isProcessingModal) return; 
    
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = "ยืนยันการปิดยอด";
    document.getElementById('modal-msg').innerHTML = `ค่าย: <b>${title}</b><br>กำไรสุทธิ: <span style="color:green; font-size:1.5rem;">฿${profit.toFixed(2)}</span>`;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    const btnCancel = createModalBtn("ยกเลิก (Esc)", "btn-cancel", closeModal);
    const btnNoProfit = createModalBtn("ไม่คิดยอด (E)", "btn-danger", () => handleModalAction(0, callback));
    const btnConfirm = createModalBtn("ตกลง (Enter)", "btn-confirm", () => handleModalAction(profit, callback));

    btnNoProfit.style.background = "#ef4444"; btnNoProfit.style.color = "white";
    actions.append(btnCancel, btnNoProfit, btnConfirm);

    if (currentModalKeyHandler) window.removeEventListener('keydown', currentModalKeyHandler);
    currentModalKeyHandler = (e) => {
        const key = e.key.toLowerCase();
        if (key === "enter") { e.preventDefault(); btnConfirm.click(); }
        else if (key === "e") { e.preventDefault(); btnNoProfit.click(); }
        else if (key === "escape") { e.preventDefault(); btnCancel.click(); }
    };
    window.addEventListener('keydown', currentModalKeyHandler);
    modal.classList.add('active');
}

function handleModalAction(profit, callback) {
    if (isProcessingModal) return;
    isProcessingModal = true; 
    closeModal();
    callback(profit);
    setTimeout(() => { isProcessingModal = false; }, 500); 
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
    if (currentModalKeyHandler) {
        window.removeEventListener('keydown', currentModalKeyHandler);
        currentModalKeyHandler = null;
    }
}

function createModalBtn(text, className, onClick) {
    const btn = document.createElement("button");
    btn.innerText = text;
    btn.className = `btn-modal ${className}`;
    btn.onclick = onClick;
    return btn;
}

// --- 6. ฟังก์ชันจัดการตารางและข้อมูล ---
function addTable(title = "", rows = null, isSilent = false) {
    if(!isSilent) playSound('click');
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-card");

    const rowBuilder = (r = ["", "", ""]) => `
        <tr onfocusin="this.classList.add('active-row')" onfocusout="this.classList.remove('active-row')">
            <td><input type="text" value="${r[0]}" oninput="saveData()"></td>
            <td><input type="text" value="${r[1]}" oninput="saveData()" style="font-weight:bold; color:#2e7d32;"></td>
            <td><input type="text" value="${r[2]}" oninput="saveData()"></td>
            <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;

    newTable.innerHTML = `
        <span class="profit-badge-live">กำไรสะสม: ฿0.00</span>
        <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <input type="text" class="table-title-input" value="${title}" placeholder="ใส่ชื่อค่าย..." oninput="saveData()">
        <table class="custom-table">
            <thead>
                <tr><th class="th-green">รายชื่อคนไล่</th><th class="th-orange">ราคาเล่น</th><th class="th-red">รายชื่อคนยั้ง</th><th class="th-purple">จัดการ</th></tr>
            </thead>
            <tbody>${rows ? rows.map(r => rowBuilder(r)).join('') : rowBuilder()}</tbody>
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
    tr.innerHTML = `<td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()" style="font-weight:bold; color:#2e7d32;"></td><td><input type="text" oninput="saveData()"></td><td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>`;
    tbody.appendChild(tr);
    saveData();
}

function removeRow(btn) { playSound('delete'); btn.closest('tr').remove(); saveData(); }

function removeTable(button) {
    const tableContainer = button.closest('.table-card');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    const profit = calculateTableProfit(tableContainer);

    showConfirmModal(title, profit, (finalProfit) => {
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

// --- 7. ฟังก์ชันเสริม (Save, Load, History, Line) ---
function saveData() {
    const data = [];
    document.querySelectorAll(".table-card").forEach(table => {
        const title = table.querySelector(".table-title-input").value;
        const rows = [];
        table.querySelectorAll("tbody tr").forEach(tr => {
            const cells = r.querySelectorAll("input");
            if (cells.length >= 3) rows.push([cells[0].value, cells[1].value, cells[2].value]);
        });
        data.push({ title, rows });
    });
    localStorage.setItem("savedTables", JSON.stringify(data));
    refreshAllBadges();
}

function loadData() {
    const raw = localStorage.getItem("savedTables");
    if (raw) JSON.parse(raw).forEach(t => addTable(t.title, t.rows, true));
}

function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
}

function handleGlobalKeyDown(e) {
    if (e.target.tagName !== "INPUT" || document.getElementById('custom-modal').classList.contains('active')) return;
    const currentInput = e.target;
    const currentTr = currentInput.closest('tr');
    const colIndex = Array.from(currentTr.querySelectorAll("input")).indexOf(currentInput);
    if (e.key === "ArrowDown") { e.preventDefault(); currentTr.nextElementSibling?.querySelectorAll("input")[colIndex]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); currentTr.previousElementSibling?.querySelectorAll("input")[colIndex]?.focus(); }
}

function restoreLastDeleted() {
    if (historyData.length === 0) return playSound('alert');
    playSound('success');
    const last = historyData.pop();
    totalDeletedProfit -= last.profit;
    addTable(last.title, last.rows, true);
    localStorage.setItem("historyData", JSON.stringify(historyData));
    updateDashboardStats();
}

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return alert("กรุณากรอกข้อมูล");
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent("เรียนคุณ " + name + "\\n" + msg + "\\n\\nตรวจสอบยอดได้ที่แอดมินครับ")}`, '_blank');
}

function playSound(name) { if (sounds[name]) { sounds[name].currentTime = 0; sounds[name].play().catch(() => {}); } }

function clearAllHistory() { if(confirm("ล้างข้อมูลทั้งหมด?")) { localStorage.clear(); location.reload(); } }

function showHistory() {
    if (historyData.length === 0) return alert("ไม่มีประวัติ");
    let win = window.open("", "History", "width=800,height=600");
    let html = "<html><head><title>ประวัติ</title></head><body><h2>ประวัติกำไร</h2><ul>";
    historyData.forEach(h => html += `<li>${h.title} - กำไร: ฿${h.profit.toFixed(2)} (${h.timestamp})</li>`);
    html += "</ul></body></html>";
    win.document.write(html);
}

function openStopwatchWindow() {
    window.open("", "_blank", "width=400,height=300").document.write("<html><body><h2>Timer</h2><p>ฟังก์ชันจับเวลา...</p></body></html>");
}
