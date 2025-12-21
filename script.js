// --- 1. Configuration & Sounds ---
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

let historyData = JSON.parse(localStorage.getItem("historyData")) || [];
let totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
let currentModalKeyHandler = null;

// --- 2. Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    updateDashboardStats();
    document.addEventListener('keydown', handleKeyboardNav);
});

// --- 3. Premium Calculation Logic (หัวใจสำคัญ: 2 หลักขึ้นไป) ---
function updateLiveProfit(tableElement) {
    let profit = 0;
    tableElement.querySelectorAll(".price-input").forEach(input => {
        const val = input.value.replace(/[Oo]/g, '0'); // รองรับ 4OO เป็น 400
        const matches = val.match(/\d+/g); // ดึงกลุ่มตัวเลข
        if (matches) {
            matches.forEach(m => {
                if (m.length >= 2) { // นับเฉพาะเลข 2 หลักขึ้นไป
                    profit += (parseFloat(m) * 0.10);
                }
            });
        }
    });

    const badge = tableElement.querySelector(".live-profit-badge");
    if (badge) {
        badge.innerText = `กำไรสะสม: ฿${profit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
        badge.style.background = profit > 0 ? "#2ecc71" : "#94a3b8";
        badge.style.boxShadow = profit > 0 ? "0 4px 10px rgba(46, 204, 113, 0.3)" : "none";
    }
}

// --- 4. Core Actions ---
function addTable(title = "", rows = null, isSilent = false) {
    if(!isSilent) playSound('click');
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    const rowList = rows || [["", "", ""]];
    const rowsHtml = rowList.map(r => createRowHtml(r[0], r[1], r[2])).join('');

    newTable.innerHTML = `
        <span class="live-profit-badge" style="position:absolute; top:-10px; right:60px; padding:5px 15px; border-radius:20px; color:white; font-size:0.8rem; font-weight:bold; transition:0.3s; z-index:10;">กำไร: ฿0.00</span>
        <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <div class="card-header">
            <input type="text" class="table-title-input" value="${title}" placeholder="ใส่ชื่อค่ายที่นี่..." oninput="saveData()">
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
            <tbody>${rowsHtml}</tbody>
        </table>
        <div style="display:flex; justify-content:center;">
            <button class="btn-main" onclick="addRow(this.parentElement.previousElementSibling)" style="margin-top:20px; background:#e8f5e9; color:#2e7d32; border:1px dashed #2e7d32;">+ เพิ่มรายการ</button>
        </div>`;
    
    container.appendChild(newTable);
    updateLiveProfit(newTable);
    saveData();
    updateDashboardStats();
}

function createRowHtml(c1="", c2="", c3="") {
    return `
        <tr>
            <td><input type="text" value="${c1}" onfocus="highlightRow(this)" onblur="removeHighlight(this)" oninput="saveData()"></td>
            <td><input type="text" value="${c2}" class="price-input" onfocus="highlightRow(this)" onblur="removeHighlight(this)" oninput="handlePriceInput(this)"></td>
            <td><input type="text" value="${c3}" onfocus="highlightRow(this)" onblur="removeHighlight(this)" oninput="saveData()"></td>
            <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;
}

function handlePriceInput(input) {
    updateLiveProfit(input.closest('.table-container'));
    saveData();
}

function removeTable(button) {
    const tableContainer = button.closest('.table-container');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    
    let calculatedProfit = 0;
    tableContainer.querySelectorAll(".price-input").forEach(input => {
        const val = input.value.replace(/[Oo]/g, '0');
        const match = val.match(/\d+/g); 
        if (match) {
            match.forEach(m => {
                if (m.length >= 2) calculatedProfit += (parseFloat(m) * 0.10);
            });
        }
    });

    showConfirmModal(title, calculatedProfit, (finalProfit) => {
        playSound('success');
        const rowsData = Array.from(tableContainer.querySelectorAll("tbody tr")).map(tr => {
            const cells = tr.querySelectorAll("input");
            return [cells[0]?.value || "", cells[1]?.value || "", cells[2]?.value || ""];
        });

        historyData.push({ title, rows: rowsData, profit: finalProfit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += finalProfit;
        
        tableContainer.style.transform = "scale(0.9)";
        tableContainer.style.opacity = "0";
        setTimeout(() => {
            tableContainer.remove();
            saveData();
            updateDashboardStats();
        }, 300);
    });
}

// --- 5. UI Helpers & Nav ---
function highlightRow(input) {
    input.closest('tr').style.backgroundColor = "rgba(30, 60, 114, 0.08)";
}
function removeHighlight(input) {
    input.closest('tr').style.backgroundColor = "transparent";
}
function handleKeyboardNav(e) {
    const active = document.activeElement;
    if (active.tagName === 'INPUT') {
        const currentTr = active.closest('tr');
        if (!currentTr) return;
        const cells = Array.from(currentTr.querySelectorAll('input'));
        const colIndex = cells.indexOf(active);
        if (e.key === 'ArrowDown') {
            const nextTr = currentTr.nextElementSibling;
            if (nextTr) nextTr.querySelectorAll('input')[colIndex]?.focus();
        } else if (e.key === 'ArrowUp') {
            const prevTr = currentTr.previousElementSibling;
            if (prevTr) prevTr.querySelectorAll('input')[colIndex]?.focus();
        }
    }
}

// --- 6. Data & Dashboard ---
function saveData() {
    const data = Array.from(document.querySelectorAll(".table-container")).map(table => ({
        title: table.querySelector(".table-title-input").value,
        rows: Array.from(table.querySelectorAll("tbody tr")).map(r => 
            Array.from(r.querySelectorAll("input")).map(i => i.value)
        )
    }));
    localStorage.setItem("savedTables", JSON.stringify(data));
    const badge = document.getElementById("auto-save-alert");
    if(badge) { badge.style.opacity = "1"; setTimeout(() => badge.style.opacity = "0", 1500); }
}

function loadData() {
    const data = JSON.parse(localStorage.getItem("savedTables") || "[]");
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(t => addTable(t.title, t.rows, true));
}

function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
}

// --- 7. Modals & Windows ---
function showConfirmModal(title, profit, callback) {
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = "ยืนยันการปิดยอด";
    document.getElementById('modal-msg').innerHTML = `ค่าย: <b>${title}</b><br>กำไร (นับเฉพาะเลข 2 หลัก+): <span style="color:#2ecc71; font-size:1.5rem;">฿${profit.toFixed(2)}</span>`;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";
    actions.append(
        createModalBtn("ยกเลิก (Esc)", "btn-cancel", closeModal),
        createModalBtn("ไม่คิดยอด (E)", "btn-cancel", () => { closeModal(); callback(0); }),
        createModalBtn("ตกลงคิดยอด (Enter)", "btn-confirm", () => { closeModal(); callback(profit); })
    );
    modal.classList.add('active');
}

function createModalBtn(text, cls, onClick) {
    const b = document.createElement("button");
    b.innerText = text; b.className = `btn-modal ${cls}`;
    b.onclick = onClick; return b;
}
function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

// (ฟังก์ชันอื่นๆ เช่น showHistory, sendMessageToLine, openStopwatchWindow ฯลฯ ใช้โค้ดเดิมได้เลยครับ)
function addRow(table) { playSound('click'); const tbody = table.querySelector("tbody"); const tr = document.createElement("tr"); tr.innerHTML = createRowHtml(); tbody.appendChild(tr); saveData(); }
function removeRow(btn) { playSound('delete'); const row = btn.closest('tr'); const container = row.closest('.table-container'); row.remove(); if(container) updateLiveProfit(container); saveData(); }
function restoreLastDeleted() { if (historyData.length === 0) return alert("ไม่มีข้อมูล"); const last = historyData.pop(); totalDeletedProfit -= last.profit; addTable(last.title, last.rows, true); localStorage.setItem("historyData", JSON.stringify(historyData)); updateDashboardStats(); }
function clearAllHistory() { if(confirm("ล้างทั้งหมด?")) { localStorage.clear(); location.reload(); } }
