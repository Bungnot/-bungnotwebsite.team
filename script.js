const sounds = {
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
    success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
    delete: new Audio('https://assets.mixkit.co/active_storage/sfx/251/251-preview.mp3'),
    popup: new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'),
    alert: new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
};

function playSound(soundName) {
    if (sounds[soundName]) {
        const sound = sounds[soundName];
        sound.currentTime = 0;
        sound.volume = 0.5;
        sound.play().catch(e => console.log("Audio interaction required"));
    }
}

let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;
let isProcessingModal = false; // ป้องกันปิดยอดเบิ้ล
let isRestoring = false;      // ป้องกันกู้คืนเบิ้ล

document.addEventListener("DOMContentLoaded", () => {
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    loadData(); 
    document.addEventListener('keydown', handleGlobalKeyDown);
});

// --- หัวใจการคำนวณ: เช็ค 3 หลักขึ้นไปเท่านั้น ---
function calculateTableProfit(tableElement) {
    let profit = 0;
    tableElement.querySelectorAll("tbody tr").forEach(tr => {
        const inputs = tr.querySelectorAll("input");
        if (inputs[1]) {
            const rawVal = inputs[1].value;
            const cleanVal = rawVal.replace(/[Oo]/g, '0');
            const match = cleanVal.match(/\d+/); 
            
            // แก้ไข: ต้องมีตัวเลข และตัวเลขนั้นต้องยาวตั้งแต่ 3 ตัวอักษรขึ้นไป
            if (match && match[0].length >= 3) {
                profit += (parseFloat(match[0]) * 0.10);
            }
        }
    });
    return profit;
}

function refreshAllBadges() {
    document.querySelectorAll(".table-container").forEach(table => {
        const profit = calculateTableProfit(table);
        const badge = table.querySelector(".profit-badge-live");
        if (badge) {
            badge.innerText = `฿${profit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
            badge.style.background = profit > 0 ? "#2ecc71" : "#94a3b8";
        }
    });
}

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
    refreshAllBadges();
    updateDashboardStats();
    
    const badge = document.getElementById("auto-save-alert");
    if(badge) { badge.style.opacity = "1"; setTimeout(() => badge.style.opacity = "0", 1500); }
}

function loadData() {
    const raw = localStorage.getItem("savedTables");
    if (!raw) return;
    const data = JSON.parse(raw);
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(t => addTable(t.title, t.rows, true));
}

function addTable(title = "", rows = null, isSilent = false) {
    if(!isSilent) playSound('click');
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    const generateRowHtml = (r = ["", "", ""]) => `
        <tr>
            <td><input type="text" value="${r[0]}" oninput="saveData()" placeholder="..."></td>
            <td><input type="text" value="${r[1]}" oninput="saveData()" placeholder="0" style="color:#2e7d32;"></td>
            <td><input type="text" value="${r[2]}" oninput="saveData()" placeholder="..."></td>
            <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;

    let rowsHtml = rows ? rows.map(r => generateRowHtml(r)).join('') : generateRowHtml();

    newTable.innerHTML = `
        <div style="display:flex; justify-content:space-between; padding:10px;">
            <span class="profit-badge-live" style="color:white; padding:4px 12px; border-radius:20px; font-weight:bold;">฿0.00</span>
            <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        </div>
        <input type="text" class="table-title-input" value="${title}" placeholder="ชื่อค่าย..." oninput="saveData()">
        <table class="custom-table">
            <thead><tr><th class="th-green">คนไล่</th><th class="th-orange">ราคา</th><th class="th-red">คนยั้ง</th><th class="th-purple">ลบ</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        <button class="btn-main" onclick="addRow(this.previousElementSibling)" style="width:100%; margin-top:10px; border: 1px dashed #2e7d32;">+ เพิ่มแผลที่เล่น</button>`;
    
    container.appendChild(newTable);
    saveData();
}

function addRow(table) {
    playSound('click');
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input type="text" oninput="saveData()"></td>
        <td><input type="text" oninput="saveData()" style="color:#2e7d32;"></td>
        <td><input type="text" oninput="saveData()"></td>
        <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>`;
    tbody.appendChild(tr);
    saveData();
}

function removeRow(btn) { playSound('delete'); btn.closest('tr').remove(); saveData(); }

function removeTable(button) {
    const tableContainer = button.closest('.table-container');
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
    });
}

// --- แก้บัคกู้คืนเบิ้ล ---
function restoreLastDeleted() {
    if (isRestoring) return; // ล็อคป้องกันกดซ้ำ
    if (historyData.length === 0) {
        playSound('alert');
        return showSimpleModal("แจ้งเตือน", "ไม่มีข้อมูลให้กู้คืน");
    }

    isRestoring = true; // เริ่มกระบวนการ
    playSound('success');
    
    const last = historyData.pop();
    totalDeletedProfit -= last.profit;
    addTable(last.title, last.rows, true);
    
    localStorage.setItem("historyData", JSON.stringify(historyData));
    updateDashboardStats();
    
    // ปลดล็อคหลังจาก 500ms
    setTimeout(() => { isRestoring = false; }, 500);
}

function handleGlobalKeyDown(e) {
    if (document.getElementById('custom-modal').classList.contains('active')) return;
    if (e.target.tagName !== "INPUT") return;
    const currentInput = e.target;
    const currentTr = currentInput.closest('tr');
    if(!currentTr) return;
    const inputsInRow = Array.from(currentTr.querySelectorAll("input"));
    const colIndex = inputsInRow.indexOf(currentInput);

    if (e.key === "ArrowDown") {
        const nextTr = currentTr.nextElementSibling;
        if (nextTr) { e.preventDefault(); nextTr.querySelectorAll("input")[colIndex]?.focus(); }
    } else if (e.key === "ArrowUp") {
        const prevTr = currentTr.previousElementSibling;
        if (prevTr) { e.preventDefault(); prevTr.querySelectorAll("input")[colIndex]?.focus(); }
    }
}

function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

function showHistory() {
    if (historyData.length === 0) return showSimpleModal("แจ้งเตือน", "ไม่มีประวัติ");
    let newWindow = window.open("", "History", "width=900,height=800");
    let content = `<html><head><title>ประวัติ</title><style>body{font-family:sans-serif; padding:20px; background:#f0f2f5;} .card{background:white; padding:20px; margin-bottom:20px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);}</style></head><body><h2>ประวัติการปิดยอด</h2>`;
    historyData.slice().reverse().forEach(h => {
        content += `<div class="card"><b>${h.title}</b> (${h.timestamp})<br>กำไร: ฿${h.profit.toFixed(2)}</div>`;
    });
    content += `</body></html>`;
    newWindow.document.write(content);
}

function showConfirmModal(title, profit, callback) {
    if (isProcessingModal) return; 
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = "ยืนยันการปิดยอด";
    document.getElementById('modal-msg').innerHTML = `ค่าย: <b>${title}</b><br>กำไร: <span style="color:green; font-size:1.5rem;">฿${profit.toFixed(2)}</span>`;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    const handleAction = (val) => {
        if (isProcessingModal) return;
        isProcessingModal = true;
        closeModal();
        callback(val);
        setTimeout(() => { isProcessingModal = false; }, 500);
    };

    const btnCancel = createModalBtn("ยกเลิก (Esc)", "btn-cancel", () => closeModal());
    const btnNo = createModalBtn("ไม่คิดยอดเมาส์คลิ๊ก", "btn-confirm", () => handleAction(0));
    btnNo.style.background = "#e74c3c"; btnNo.style.color = "white";
    const btnOk = createModalBtn("ตกลง (Enter)", "btn-confirm", () => handleAction(profit));

    actions.append(btnCancel, btnNo, btnOk);

    currentModalKeyHandler = (e) => {
        if (e.key === "Enter") { e.preventDefault(); btnOk.click(); }
        else if (e.key.toLowerCase() === "e") { e.preventDefault(); btnNo.click(); }
        else if (e.key === "Escape") { closeModal(); }
    };
    window.addEventListener('keydown', currentModalKeyHandler);
    modal.classList.add('active');
    window.focus();
}

function createModalBtn(text, className, onClick) {
    const btn = document.createElement("button");
    btn.innerText = text; btn.className = `btn-modal ${className}`; btn.onclick = onClick;
    return btn;
}

function showSimpleModal(title, msg) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerHTML = msg;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";
    actions.append(createModalBtn("ตกลง", "btn-confirm", closeModal));
    modal.classList.add('active');
}

function closeModal() { 
    document.getElementById('custom-modal').classList.remove('active'); 
    window.removeEventListener('keydown', currentModalKeyHandler);
    isProcessingModal = false;
}

function clearAllHistory() { if(confirm("ล้างทั้งหมด?")) { localStorage.clear(); location.reload(); } }

function openStopwatchWindow() { window.open("", "_blank", "width=400,height=400").document.write("Timer Tool..."); }

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent('คุณ '+name+'\n'+msg)}`, '_blank');
}
