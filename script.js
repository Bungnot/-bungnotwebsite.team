// --- Source Configuration & Sound Effects ---
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
let isProcessingModal = false; // ตัวแปรป้องกันการกด Enter/E เบิ้ล

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    loadData(); 
    document.addEventListener('keydown', handleGlobalKeyDown);
});

// --- Calculation Core ---
function calculateTableProfit(tableElement) {
    let profit = 0;
    tableElement.querySelectorAll("tbody tr").forEach(tr => {
        const inputs = tr.querySelectorAll("input");
        if (inputs[1]) {
            const rawVal = inputs[1].value;
            // ล้างค่า O/o เป็น 0
            const cleanVal = rawVal.replace(/[Oo]/g, '0');
            const match = cleanVal.match(/\d+/); 
            
            // เงื่อนไข: ต้องเป็นตัวเลข และมีจำนวน 3 ตัวขึ้นไปถึงจะคำนวณ
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

// --- Data Management ---
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
    
    const autoSaveBadge = document.getElementById("auto-save-alert");
    if(autoSaveBadge) { 
        autoSaveBadge.style.opacity = "1"; 
        setTimeout(() => autoSaveBadge.style.opacity = "0", 1500); 
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

// --- Table Actions ---
function addTable(title = "", rows = null, isSilent = false) {
    if(!isSilent) playSound('click');
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    const generateRowHtml = (r = ["", "", ""]) => `
        <tr onfocusin="this.classList.add('active-row')" onfocusout="this.classList.remove('active-row')">
            <td><input type="text" value="${r[0]}" oninput="saveData()" placeholder="..."></td>
            <td><input type="text" value="${r[1]}" oninput="saveData()" placeholder="0" style="text-align:center; font-weight:bold; color:#2e7d32;"></td>
            <td><input type="text" value="${r[2]}" oninput="saveData()" placeholder="..."></td>
            <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;

    let rowsHtml = rows ? rows.map(r => generateRowHtml(r)).join('') : generateRowHtml();

    newTable.innerHTML = `
        <div class="card-header-wrapper" style="display:flex; justify-content:space-between; align-items:center; padding:10px 15px 0;">
            <span class="profit-badge-live" style="color:white; padding:4px 12px; border-radius:20px; font-size:0.85rem; font-weight:bold;">฿0.00</span>
            <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        </div>
        <div class="card-header">
            <input type="text" class="table-title-input" value="${title}" placeholder="ชื่อค่าย..." oninput="saveData()">
        </div>
        <table class="custom-table">
            <thead>
                <tr>
                    <th class="th-green">คนไล่</th>
                    <th class="th-orange">ราคา</th>
                    <th class="th-red">คนยั้ง</th>
                    <th class="th-purple">ลบ</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        <button class="btn-main" onclick="addRow(this.previousElementSibling)" style="margin: 20px auto 0; background: #e8f5e9; color: #2e7d32; border: 1px dashed #2e7d32; width:90%; display:block; border-radius:10px; cursor:pointer; padding:10px;">+ เพิ่มแผลที่เล่น</button>`;
    
    container.appendChild(newTable);
    saveData();
}

function addRow(table) {
    playSound('click');
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input type="text" oninput="saveData()" placeholder="..."></td>
        <td><input type="text" oninput="saveData()" placeholder="0" style="text-align:center; font-weight:bold; color:#2e7d32;"></td>
        <td><input type="text" oninput="saveData()" placeholder="..."></td>
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

        historyData.push({ 
            title, 
            rows: rowsData, 
            profit: finalProfit, 
            timestamp: new Date().toLocaleString("th-TH") 
        });
        
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += finalProfit;
        
        tableContainer.remove();
        saveData();
        updateDashboardStats();
    });
}

function restoreLastDeleted() {
    if (historyData.length === 0) {
        playSound('alert');
        return showSimpleModal("แจ้งเตือน", "ไม่มีข้อมูลให้กู้คืน");
    }
    playSound('success');
    const last = historyData.pop();
    totalDeletedProfit -= last.profit;
    addTable(last.title, last.rows, true);
    localStorage.setItem("historyData", JSON.stringify(historyData));
    updateDashboardStats();
    showSimpleModal("สำเร็จ", `กู้คืนค่าย <b>${last.title}</b> แล้ว`);
}

// --- Keyboard Navigation ---
function handleGlobalKeyDown(e) {
    if (e.target.tagName !== "INPUT") return;
    const currentInput = e.target;
    const currentTd = currentInput.parentElement;
    const currentTr = currentTd.parentElement;
    const inputsInRow = Array.from(currentTr.querySelectorAll("input"));
    const colIndex = inputsInRow.indexOf(currentInput);

    if (e.key === "ArrowDown") {
        const nextTr = currentTr.nextElementSibling;
        if (nextTr) {
            e.preventDefault();
            nextTr.querySelectorAll("input")[colIndex]?.focus();
        }
    } else if (e.key === "ArrowUp") {
        const prevTr = currentTr.previousElementSibling;
        if (prevTr) {
            e.preventDefault();
            prevTr.querySelectorAll("input")[colIndex]?.focus();
        }
    }
}

// --- Windows & UI ---
function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) {
        pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }
}

function showHistory() {
    playSound('click');
    if (historyData.length === 0) return showSimpleModal("แจ้งเตือน", "ไม่มีประวัติ");
    
    let newWindow = window.open("", "History", "width=1100,height=900");
    let content = `
    <html>
    <head>
        <title>ประวัติการคิดยอด PREMIUM</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { font-family: 'Sarabun', sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); background-attachment: fixed; padding: 40px 20px; margin: 0; display: flex; flex-direction: column; align-items: center; }
            .history-title { color: white; margin-bottom: 30px; text-shadow: 0 2px 10px rgba(0,0,0,0.3); font-size: 2.2rem; }
            .table-card { background: white; border-radius: 24px; padding: 35px; margin-bottom: 40px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); width: 100%; max-width: 1000px; border-top: 8px solid #1e3c72; position: relative; }
            .camp-header { font-size: 1.5rem; font-weight: bold; color: #1e3c72; text-align: center; border: 2.5px solid #94a3b8; background: #e2e8f0; padding: 12px; border-radius: 16px; width: 60%; margin: 0 auto 30px; }
            .custom-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
            .custom-table th { padding: 18px 10px; color: white; text-align: center; font-size: 1.1rem; }
            .th-green { background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%); border-radius: 15px 0 0 15px; }
            .th-orange { background: linear-gradient(180deg, #f39c12 0%, #e67e22 100%); }
            .th-red { background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%); border-radius: 0 15px 15px 0; }
            .cell-data { background: #e2e8f0; border: 2.5px solid #cbd5e1; padding: 14px; border-radius: 14px; text-align: center; font-weight: 600; color: #333; }
            .profit-tag { color: #2ecc71; font-weight: bold; font-size: 1.4rem; }
        </style>
    </head>
    <body>
        <h2 class="history-title"><i class="fas fa-history"></i> ประวัติการคิดยอด</h2>`;

    historyData.slice().reverse().forEach(h => {
        let rowsHtml = h.rows.map(r => `
            <tr>
                <td style="width: 40%;"><div class="cell-data">${r[0] || "-"}</div></td>
                <td style="width: 20%;"><div class="cell-data">${r[1] || "-"}</div></td>
                <td style="width: 40%;"><div class="cell-data">${r[2] || "-"}</div></td>
            </tr>`).join('');

        content += `
            <div class="table-card">
                <div class="camp-header">${h.title}</div>
                <table class="custom-table">
                    <thead><tr><th class="th-green">คนไล่</th><th class="th-orange">ราคา</th><th class="th-red">คนยั้ง</th></tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <div style="display:flex; justify-content:space-between; margin-top:20px;">
                    <span style="color:#64748b;">${h.timestamp}</span>
                    <span class="profit-tag">กำไรรวม: ฿${h.profit.toFixed(2)}</span>
                </div>
            </div>`;
    });
    content += `</body></html>`;
    newWindow.document.write(content);
    newWindow.document.close();
}

// --- Modals ---
function showConfirmModal(title, profit, callback) {
    if (isProcessingModal) return; // ถ้ากำลังเปิด Modal อยู่ ไม่ให้ซ้อน
    isProcessingModal = false; 

    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = "ยืนยันการปิดยอด";
    document.getElementById('modal-msg').innerHTML = `ค่าย: <b>${title}</b><br>กำไรสุทธิ: <span style="color:green; font-size:1.5rem;">฿${profit.toFixed(2)}</span>`;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    const handleAction = (val) => {
        if (isProcessingModal) return;
        isProcessingModal = true; // ล็อคทันทีที่กดครั้งแรก
        closeModal();
        callback(val);
        setTimeout(() => { isProcessingModal = false; }, 500); // ปลดล็อคหลังจากผ่านไปครึ่งวิ
    };

    const btnCancel = createModalBtn("ยกเลิก (Esc)", "btn-cancel", () => closeModal());
    
    const btnNoProfit = createModalBtn("ไม่คิดยอด (E)", "btn-danger", () => handleAction(0));
    btnNoProfit.style.background = "#e74c3c"; btnNoProfit.style.color = "white";
    
    const btnConfirm = createModalBtn("ตกลง (Enter)", "btn-confirm", () => handleAction(profit));

    actions.append(btnCancel, btnNoProfit, btnConfirm);

    if (currentModalKeyHandler) window.removeEventListener('keydown', currentModalKeyHandler);
    currentModalKeyHandler = (e) => {
        if (e.key === "Enter") { e.preventDefault(); btnConfirm.click(); }
        else if (e.key.toLowerCase() === "e") { e.preventDefault(); btnNoProfit.click(); }
        else if (e.key === "Escape") { e.preventDefault(); btnCancel.click(); }
    };
    window.addEventListener('keydown', currentModalKeyHandler);
    modal.classList.add('active');
}

function createModalBtn(text, className, onClick) {
    const btn = document.createElement("button");
    btn.innerText = text;
    btn.className = `btn-modal ${className}`;
    btn.onclick = onClick;
    return btn;
}

function showSimpleModal(title, msg) {
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerHTML = msg;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";
    const b = createModalBtn("ตกลง", "btn-confirm", closeModal);
    actions.append(b);
    modal.classList.add('active');
}

function closeModal() { 
    document.getElementById('custom-modal').classList.remove('active'); 
    if (currentModalKeyHandler) window.removeEventListener('keydown', currentModalKeyHandler);
    isProcessingModal = false;
}

function clearAllHistory() { 
    playSound('alert');
    if(confirm("ล้างข้อมูลทั้งหมดรวมถึงกำไรสะสมหรือไม่?")) {
        localStorage.clear(); 
        location.reload(); 
    }
}

// --- Extra Tools ---
function openStopwatchWindow() {
    playSound('click');
    const sw = window.open("", "_blank", "width=800,height=700");
    sw.document.write(`<html><head><title>Timer</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>body{background:#1e3c72;color:white;font-family:sans-serif;padding:30px}input{padding:15px;border-radius:10px;border:none;width:70%;background:#e2e8f0;color:#333;font-weight:bold}.timer-text{font-size:3rem;color:#2ecc71;font-weight:bold}</style></head><body><h2>จับเวลาบั้งไฟ</h2><input type="text" id="cIn" placeholder="ชื่อค่าย..."><button onclick="add()" style="padding:15px;border-radius:10px;background:#2ecc71;border:none;color:white;cursor:pointer;margin-left:10px">เพิ่ม</button><div id="list"></div><script>function add(){const n=document.getElementById('cIn').value;if(!n)return;const d=document.createElement('div');d.style.background='rgba(255,255,255,0.1)';d.style.padding='20px';d.style.margin='10px 0';d.style.borderRadius='15px';d.innerHTML='<b>'+n+'</b> <span class="timer-text" id="t">0.000</span> <button onclick="st(this)" style="padding:10px;background:#2ecc71;border:none;color:white;border-radius:5px">เริ่ม</button> <button onclick="rs(this)" style="padding:10px;background:#f39c12;border:none;color:white;border-radius:5px">รีเซ็ต</button>';document.getElementById('list').appendChild(d);document.getElementById('cIn').value=''};function st(b){const t=b.parentElement.querySelector('#t');if(b.innerText==='เริ่ม'){b.innerText='หยุด';b.style.background='#e74c3c';let s=parseFloat(t.innerText)*1000;let st=Date.now()-s;b.iv=setInterval(()=>{t.innerText=((Date.now()-st)/1000).toFixed(3)},10)}else{b.innerText='เริ่ม';b.style.background='#2ecc71';clearInterval(b.iv)}};function rs(b){const t=b.parentElement.querySelector('#t');const sb=b.parentElement.querySelector('button');clearInterval(sb.iv);sb.innerText='เริ่ม';sb.style.background='#2ecc71';t.innerText='0.000'}<\/script></body></html>`);
}

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return showSimpleModal("แจ้งเตือน", "กรุณากรอกชื่อและข้อความ");
    const fullMsg = `เรียนคุณ ${name}\n${msg}\n\nตรวจสอบยอดได้ที่แอดมินครับ`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(fullMsg)}`, '_blank');
}
