// --- Source Configuration & Sound Effects ---
const sounds = {
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
    success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
    delete: new Audio('https://assets.mixkit.co/active_storage/sfx/251/251-preview.mp3'),
    popup: new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'),
    alert: new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
};

// ฟังก์ชันสำหรับเล่นเสียง
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

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats();
});

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

// --- Table Actions ---
function addTable(title = "", rows = null, isSilent = false) {
    if(!isSilent) playSound('click');
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    let rowsHtml = "";
    if (rows) {
        rowsHtml = rows.map(r => `
            <tr>
                <td><input type="text" value="${r[0]}" oninput="saveData()"></td>
                <td><input type="text" value="${r[1]}" oninput="saveData()"></td>
                <td><input type="text" value="${r[2]}" oninput="saveData()"></td>
                <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
            </tr>`).join('');
    } else {
        rowsHtml = `
            <tr>
                <td><input type="text" oninput="saveData()"></td>
                <td><input type="text" oninput="saveData()"></td>
                <td><input type="text" oninput="saveData()"></td>
                <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
            </tr>`;
    }

    newTable.innerHTML = `
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
        <button class="btn-main" onclick="addRow(this.previousElementSibling)" style="margin: 20px auto 0; background: #e8f5e9; color: #2e7d32; border: 1px dashed #2e7d32;">+ เพิ่มแผลที่เล่น</button>`;
    
    container.appendChild(newTable);
    saveData();
    updateDashboardStats();
}

function addRow(table) {
    playSound('click');
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input type="text" oninput="saveData()"></td>
        <td><input type="text" oninput="saveData()"></td>
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
    const tableContainer = button.closest('.table-container');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    
    let calculatedProfit = 0;
    tableContainer.querySelectorAll("tbody tr").forEach(tr => {
        const val = tr.querySelectorAll("input")[1].value.replace(/[Oo]/g, '0');
        const match = val.match(/\d{3,}/);
        if (match) calculatedProfit += (parseFloat(match[0]) * 0.10);
    });

    // เรียก Modal ยืนยันที่มีปุ่ม E
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

// --- Windows & UI ---
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
            .custom-table th { padding: 18px 10px; color: white; text-align: center; font-size: 1.1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            .th-green { background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%); border-radius: 15px 0 0 15px; }
            .th-orange { background: linear-gradient(180deg, #f39c12 0%, #e67e22 100%); }
            .th-red { background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%); border-radius: 0 15px 15px 0; }
            .cell-data { background: #e2e8f0; border: 2.5px solid #cbd5e1; padding: 14px; border-radius: 14px; text-align: center; font-weight: 600; color: #333; margin: 0 5px; }
            .footer-info { display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
            .profit-tag { color: #2ecc71; font-weight: bold; font-size: 1.4rem; }
            .time-tag { color: #64748b; font-size: 0.95rem; }
        </style>
    </head>
    <body>
        <h2 class="history-title"><i class="fas fa-history"></i> ประวัติการคิดยอด</h2>`;

    historyData.forEach(h => {
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
                    <thead>
                        <tr>
                            <th class="th-green">รายชื่อคนไล่</th>
                            <th class="th-orange">ราคาเล่น</th>
                            <th class="th-red">รายชื่อคนยั้ง</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <div class="footer-info">
                    <span class="time-tag"><i class="far fa-clock"></i> เมื่อวันที่: ${h.timestamp}</span>
                    <span class="profit-tag">กำไรรวม: ฿${h.profit.toFixed(2)}</span>
                </div>
            </div>`;
    });

    content += `</body></html>`;
    newWindow.document.write(content);
    newWindow.document.close();
}

function openStopwatchWindow() {
    playSound('click');
    const sw = window.open("", "_blank", "width=800,height=700");
    sw.document.write(`<html><head><title>Timer</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>body{background:#1e3c72;color:white;font-family:sans-serif;padding:30px}input{padding:15px;border-radius:10px;border:none;width:70%;background:#e2e8f0;color:#333;font-weight:bold}.timer-text{font-size:3rem;color:#2ecc71;font-weight:bold}</style></head><body><h2>จับเวลาบั้งไฟ</h2><input type="text" id="cIn" placeholder="ชื่อค่าย..."><button onclick="add()" style="padding:15px;border-radius:10px;background:#2ecc71;border:none;color:white;cursor:pointer;margin-left:10px">เพิ่ม</button><div id="list"></div><script>function add(){const n=document.getElementById('cIn').value;if(!n)return;const d=document.createElement('div');d.style.background='rgba(255,255,255,0.1)';d.style.padding='20px';d.style.margin='10px 0';d.style.borderRadius='15px';d.innerHTML='<b>'+n+'</b> <span class="timer-text" id="t">0.000</span> <button onclick="st(this)" style="padding:10px;background:#2ecc71;border:none;color:white;border-radius:5px">เริ่ม</button> <button onclick="rs(this)" style="padding:10px;background:#f39c12;border:none;color:white;border-radius:5px">รีเซ็ต</button>';document.getElementById('list').appendChild(d);document.getElementById('cIn').value=''};function st(b){const t=b.parentElement.querySelector('#t');if(b.innerText==='เริ่ม'){b.innerText='หยุด';b.style.background='#e74c3c';let s=parseFloat(t.innerText)*1000;let st=Date.now()-s;b.iv=setInterval(()=>{t.innerText=((Date.now()-st)/1000).toFixed(3)},10)}else{b.innerText='เริ่ม';b.style.background='#2ecc71';clearInterval(b.iv)}};function rs(b){const t=b.parentElement.querySelector('#t');const sb=b.parentElement.querySelector('button');clearInterval(sb.iv);sb.innerText='เริ่ม';sb.style.background='#2ecc71';t.innerText='0.000'}<\/script></body></html>`);
}

function sendMessageToLine() {
    playSound('click');
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return showSimpleModal("แจ้งเตือน", "กรุณากรอกชื่อและข้อความ");
    
    const fullMsg = `เรียนคุณ ${name}\n${msg}\n\nตรวจสอบยอดได้ที่แอดมินครับ`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(fullMsg)}`, '_blank');
}

// --- Modals ---

// Modal สำหรับยืนยันปิดยอด (รองรับปุ่ม E)
function showConfirmModal(title, profit, callback) {
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    const iconBox = document.getElementById('modal-icon');
    iconBox.innerHTML = '<i class="fas fa-exclamation-circle" style="font-size:3rem; color:#f39c12; margin-bottom:15px; display:block;"></i>';
    
    document.getElementById('modal-title').innerText = "ยืนยันการปิดยอด";
    document.getElementById('modal-msg').innerHTML = `ค่าย: <b>${title}</b><br>กำไรสุทธิ: <span style="color:green">฿${profit.toFixed(2)}</span>`;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    const btnCancel = document.createElement("button");
    btnCancel.innerText = "ยกเลิก (Esc)";
    btnCancel.className = "btn-modal btn-cancel";
    btnCancel.onclick = closeModal;

    const btnNoProfit = document.createElement("button");
    btnNoProfit.innerText = "ไม่คิดยอด (E)";
    btnNoProfit.className = "btn-modal";
    btnNoProfit.style.background = "#e74c3c";
    btnNoProfit.style.color = "white";
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

function showSimpleModal(title, msg) {
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    const iconBox = document.getElementById('modal-icon');
    iconBox.innerHTML = '<i class="fas fa-check-circle" style="font-size:3rem; color:#2ecc71; margin-bottom:15px; display:block;"></i>';
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerHTML = msg;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";
    const b = document.createElement("button"); 
    b.innerText = "ตกลง"; b.className = "btn-modal btn-confirm"; 
    b.onclick = closeModal;
    actions.append(b);
    modal.classList.add('active');
    
    if (currentModalKeyHandler) window.removeEventListener('keydown', currentModalKeyHandler);
    currentModalKeyHandler = (e) => { if (e.key === "Enter" || e.key === "Escape") closeModal(); };
    window.addEventListener('keydown', currentModalKeyHandler);
}

function closeModal() { 
    document.getElementById('custom-modal').classList.remove('active'); 
}

function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
}

function clearAllHistory() { 
    playSound('alert');
    if(confirm("ล้างข้อมูลทั้งหมดรวมถึงกำไรสะสมหรือไม่?")) {
        localStorage.clear(); 
        location.reload(); 
    }
}
