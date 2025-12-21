// --- Configuration & Sound Effects ---
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
    const rowList = rows || [["", "", ""]];
    rowsHtml = rowList.map(r => createRowHtml(r[0], r[1], r[2])).join('');

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
        <div style="display:flex; justify-content:center;">
            <button class="btn-main" onclick="addRow(this.parentElement.previousElementSibling)" style="margin-top:20px; background:#e8f5e9; color:#2e7d32; border:1px dashed #2e7d32;">+ เพิ่มแผลที่เล่น</button>
        </div>`;
    
    container.appendChild(newTable);
    saveData();
    updateDashboardStats();
}

function createRowHtml(c1="", c2="", c3="") {
    return `
        <tr>
            <td><input type="text" value="${c1}" oninput="saveData()"></td>
            <td><input type="text" value="${c2}" oninput="saveData()"></td>
            <td><input type="text" value="${c3}" oninput="saveData()"></td>
            <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;
}

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
        row.remove(); 
        saveData(); 
    }, 200);
}

function removeTable(button) {
    const tableContainer = button.closest('.table-container');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    
    let calculatedProfit = 0;
    tableContainer.querySelectorAll("tbody tr").forEach(tr => {
        const val = tr.querySelectorAll("input")[1].value.replace(/[Oo]/g, '0');
        // ค้นหาตัวเลขที่มีความยาวตั้งแต่ 2 หลักขึ้นไปเพื่อคำนวณ (80, 00, 300, 4OO)
        const match = val.match(/\d+/g); 
        if (match) {
            match.forEach(m => {
                // อิงตามเงื่อนไขเดิม: ถ้าพิมพ์ 280/300 ใส่แค่ 80/00 บอทจะนำมาคิดกำไรให้
                let num = parseFloat(m);
                calculatedProfit += (num * 0.10);
            });
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
            isFree: finalProfit === 0,
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

// --- Windows & UI ---
function showHistory() {
    playSound('click');
    if (historyData.length === 0) return showSimpleModal("แจ้งเตือน", "ไม่มีประวัติการบันทึก");
    
    let newWindow = window.open("", "History", "width=1100,height=900");
    let content = `
    <html>
    <head>
        <title>ประวัติการคิดยอด PREMIUM</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { font-family: 'Sarabun', sans-serif; background: #f0f2f5; padding: 40px 20px; margin: 0; }
            .history-title { color: #1e3c72; text-align:center; margin-bottom: 30px; }
            .table-card { background: white; border-radius: 15px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 8px solid #1e3c72; }
            .free-tag { background: #e74c3c; color: white; padding: 2px 10px; border-radius: 10px; font-size: 0.8rem; margin-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; text-align: left; }
            td { padding: 12px; border: 1px solid #e2e8f0; }
            .profit-text { color: #2ecc71; font-weight: bold; font-size: 1.2rem; }
        </style>
    </head>
    <body>
        <h2 class="history-title"><i class="fas fa-history"></i> ประวัติการคิดยอด</h2>`;

    historyData.slice().reverse().forEach(h => {
        let rowsHtml = h.rows.map(r => `
            <tr>
                <td>${r[0] || "-"}</td>
                <td>${r[1] || "-"}</td>
                <td>${r[2] || "-"}</td>
            </tr>`).join('');

        content += `
            <div class="table-card">
                <div style="font-size: 1.3rem; font-weight: bold; color: #1e3c72;">
                    ค่าย: ${h.title} ${h.isFree ? '<span class="free-tag">ไม่คิดยอด</span>' : ''}
                </div>
                <table>
                    <thead><tr><th>คนไล่</th><th>ราคา</th><th>คนยั้ง</th></tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#64748b;">${h.timestamp}</span>
                    <span class="profit-text">กำไร: ฿${h.profit.toFixed(2)}</span>
                </div>
            </div>`;
    });

    content += `</body></html>`;
    newWindow.document.write(content);
}

function openStopwatchWindow() {
    playSound('click');
    const sw = window.open("", "_blank", "width=800,height=700");
    sw.document.write(\`<html><head><title>Timer</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>body{background:#1e3c72;color:white;font-family:sans-serif;padding:30px}input{padding:15px;border-radius:10px;border:none;width:70%;background:#e2e8f0;color:#333;font-weight:bold}.timer-text{font-size:3rem;color:#2ecc71;font-weight:bold}</style></head><body><h2>จับเวลาบั้งไฟ</h2><input type="text" id="cIn" placeholder="ชื่อค่าย..."><button onclick="add()" style="padding:15px;border-radius:10px;background:#2ecc71;border:none;color:white;cursor:pointer;margin-left:10px">เพิ่ม</button><div id="list"></div><script>function add(){const n=document.getElementById('cIn').value;if(!n)return;const d=document.createElement('div');d.style.background='rgba(255,255,255,0.1)';d.style.padding='20px';d.style.margin='10px 0';d.style.borderRadius='15px';d.innerHTML='<b>'+n+'</b> <span class="timer-text" id="t">0.000</span> <button onclick="st(this)" style="padding:10px;background:#2ecc71;border:none;color:white;border-radius:5px">เริ่ม</button> <button onclick="rs(this)" style="padding:10px;background:#f39c12;border:none;color:white;border-radius:5px">รีเซ็ต</button>';document.getElementById('list').appendChild(d);document.getElementById('cIn').value=''};function st(b){const t=b.parentElement.querySelector('#t');if(b.innerText==='เริ่ม'){b.innerText='หยุด';b.style.background='#e74c3c';let s=parseFloat(t.innerText)*1000;let st=Date.now()-s;b.iv=setInterval(()=>{t.innerText=((Date.now()-st)/1000).toFixed(3)},10)}else{b.innerText='เริ่ม';b.style.background='#2ecc71';clearInterval(b.iv)}};function rs(b){const t=b.parentElement.querySelector('#t');const sb=b.parentElement.querySelector('button');clearInterval(sb.iv);sb.innerText='เริ่ม';sb.style.background='#2ecc71';t.innerText='0.000'}<\/script></body></html>\`);
}

function sendMessageToLine() {
    playSound('click');
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return showSimpleModal("แจ้งเตือน", "กรุณากรอกชื่อและข้อความ");
    const fullMsg = \`เรียนคุณ \${name}\\n\${msg}\\n\\nตรวจสอบยอดได้ที่แอดมินครับ\`;
    window.open(\`https://line.me/R/msg/text/?\${encodeURIComponent(fullMsg)}\`, '_blank');
}

// --- Modals ---
function showConfirmModal(title, profit, callback) {
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = "ยืนยันการปิดยอด";
    document.getElementById('modal-msg').innerHTML = `ค่าย: <b>${title}</b><br>กำไรที่บอทคำนวณ: <span style="color:#2ecc71; font-size:1.5rem;">฿${profit.toFixed(2)}</span>`;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    const btnCancel = createModalBtn("ยกเลิก (Esc)", "btn-cancel", closeModal);
    const btnNoProfit = createModalBtn("ไม่คิดยอด (E)", "", () => { closeModal(); callback(0); });
    btnNoProfit.style.background = "#94a3b8"; btnNoProfit.style.color = "white";
    
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

function showSimpleModal(title, msg) {
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerHTML = msg;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";
    actions.append(createModalBtn("ตกลง", "btn-confirm", closeModal));
    modal.classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿\${totalDeletedProfit.toLocaleString(undefined,{minimumFractionDigits:2})}`;
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
    showSimpleModal("สำเร็จ", \`กู้คืนค่าย <b>\${last.title}</b> แล้ว\`);
}

function clearAllHistory() { 
    playSound('alert');
    if(confirm("ล้างทั้งหมด?")) { localStorage.clear(); location.reload(); } 
}
