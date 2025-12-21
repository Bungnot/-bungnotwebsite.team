// --- 1. Configuration & Premium Sound Effects ---
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
    
    // ระบบ Keyboard Navigation (Arrow Up/Down)
    document.addEventListener('keydown', handleKeyboardNav);
});

// --- 3. Data Management ---
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
    
    const badge = document.getElementById("auto-save-alert");
    if(badge) { 
        badge.style.opacity = "1"; 
        setTimeout(() => badge.style.opacity = "0", 2000); 
    }
}

function loadData() {
    const raw = localStorage.getItem("savedTables");
    if (!raw) return;
    const data = JSON.parse(raw);
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(t => addTable(t.title, t.rows, true)); 
}

// --- 4. Table Actions & Premium Logic ---
function addTable(title = "", rows = null, isSilent = false) {
    if(!isSilent) playSound('click');
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    const rowList = rows || [["", "", ""]];
    const rowsHtml = rowList.map(r => createRowHtml(r[0], r[1], r[2])).join('');

    newTable.innerHTML = `
        <span class="live-profit-badge" style="position:absolute; top:-10px; right:60px; padding:5px 15px; border-radius:20px; color:white; font-size:0.8rem; font-weight:bold; transition:0.3s;">กำไร: ฿0.00</span>
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

// --- 5. Premium Features Logic ---

function handlePriceInput(input) {
    updateLiveProfit(input.closest('.table-container'));
    saveData();
}

function updateLiveProfit(tableElement) {
    let profit = 0;
    tableElement.querySelectorAll(".price-input").forEach(input => {
        const val = input.value.replace(/[Oo]/g, '0');
        const matches = val.match(/\d+/g);
        if (matches) {
            matches.forEach(m => profit += (parseFloat(m) * 0.10));
        }
    });

    const badge = tableElement.querySelector(".live-profit-badge");
    if (badge) {
        badge.innerText = `กำไรสะสม: ฿${profit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
        badge.style.background = profit > 0 ? "#2ecc71" : "#94a3b8";
        badge.style.boxShadow = profit > 0 ? "0 4px 10px rgba(46, 204, 113, 0.3)" : "none";
    }
}

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

// --- 6. Core Functions (Add/Remove/History) ---

function addRow(table) {
    playSound('click');
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    tr.innerHTML = createRowHtml();
    tbody.appendChild(tr);
    saveData();
}

function removeRow(btn) { 
    playSound('delete');
    const row = btn.closest('tr');
    row.style.transform = "translateX(20px)";
    row.style.opacity = "0";
    setTimeout(() => {
        const container = row.closest('.table-container');
        row.remove(); 
        if(container) updateLiveProfit(container);
        saveData(); 
    }, 200);
}

function removeTable(button) {
    const tableContainer = button.closest('.table-container');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    
    let calculatedProfit = 0;
    tableContainer.querySelectorAll(".price-input").forEach(input => {
        const val = input.value.replace(/[Oo]/g, '0');
        const match = val.match(/\d+/g); 
        if (match) {
            match.forEach(m => calculatedProfit += (parseFloat(m) * 0.10));
        }
    });

    showConfirmModal(title, calculatedProfit, (finalProfit) => {
        playSound('success');
        const rowsData = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rowsData.push([cells[0]?.value || "", cells[1]?.value || "", cells[2]?.value || ""]);
        });

        historyData.push({ 
            title, 
            rows: rowsData, 
            profit: finalProfit, 
            timestamp: new Date().toLocaleString("th-TH") 
        });
        
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

function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
}

function showConfirmModal(title, profit, callback) {
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = "ยืนยันการปิดยอด";
    document.getElementById('modal-msg').innerHTML = `ค่าย: <b>${title}</b><br>กำไรที่บอทคำนวณ (10%): <span style="color:#2ecc71; font-size:1.5rem;">฿${profit.toFixed(2)}</span>`;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    const btnCancel = createModalBtn("ยกเลิก (Esc)", "btn-cancel", closeModal);
    const btnNoProfit = createModalBtn("ไม่คิดยอด (E)", "btn-cancel", () => { closeModal(); callback(0); });
    const btnConfirm = createModalBtn("ตกลงคิดยอด (Enter)", "btn-confirm", () => { closeModal(); callback(profit); });

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

function createModalBtn(text, cls, onClick) {
    const b = document.createElement("button");
    b.innerText = text; b.className = `btn-modal ${cls}`;
    b.onclick = onClick;
    return b;
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

// --- 7. Additional Windows ---

function showHistory() {
    playSound('click');
    if (historyData.length === 0) return alert("ไม่มีประวัติการบันทึก");
    
    let newWindow = window.open("", "History", "width=1100,height=900");
    let content = `<html><head><title>History</title><link href="https://fonts.googleapis.com/css2?family=Sarabun&display=swap" rel="stylesheet"><style>body{font-family:'Sarabun';padding:20px;background:#f0f2f5}.card{background:white;padding:20px;border-radius:15px;margin-bottom:20px;box-shadow:0 4px 10px rgba(0,0,0,0.1);border-left:5px solid #1e3c72}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f8fafc}</style></head><body><h2>ประวัติการปิดยอด</h2>`;
    
    historyData.slice().reverse().forEach(h => {
        let rowsHtml = h.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('');
        content += `<div class="card"><strong>ค่าย: ${h.title}</strong><br><small>${h.timestamp}</small><table><tr><th>คนไล่</th><th>ราคา</th><th>คนยั้ง</th></tr>${rowsHtml}</table><p style="text-align:right;color:#2ecc71;font-weight:bold">กำไร: ฿${h.profit.toFixed(2)}</p></div>`;
    });
    content += `</body></html>`;
    newWindow.document.write(content);
}

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return alert("กรุณากรอกชื่อและข้อความ");
    const fullMsg = `เรียนคุณ ${name}\n${msg}\n\nตรวจสอบยอดได้ที่แอดมินครับ`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(fullMsg)}`, '_blank');
}

function openStopwatchWindow() {
    const sw = window.open("", "_blank", "width=400,height=500");
    sw.document.write(`<html><body style="text-align:center;font-family:sans-serif;"><h2>Timer</h2><h1 id="t">0.000</h1><button onclick="start()">Start/Stop</button><button onclick="reset()">Reset</button><script>let s=0,iv;function start(){if(iv){clearInterval(iv);iv=null}else{let st=Date.now()-s;iv=setInterval(()=>{s=Date.now()-st;document.getElementById('t').innerText=(s/1000).toFixed(3)},10)}};function reset(){s=0;document.getElementById('t').innerText="0.000";clearInterval(iv);iv=null}<\/script></body></html>`);
}

function restoreLastDeleted() {
    if (historyData.length === 0) return alert("ไม่มีข้อมูลให้กู้คืน");
    const last = historyData.pop();
    totalDeletedProfit -= last.profit;
    addTable(last.title, last.rows, true);
    localStorage.setItem("historyData", JSON.stringify(historyData));
    updateDashboardStats();
}

function clearAllHistory() { 
    if(confirm("ต้องการล้างประวัติและข้อมูลทั้งหมดใช่หรือไม่?")) { 
        localStorage.clear(); 
        location.reload(); 
    } 
}
