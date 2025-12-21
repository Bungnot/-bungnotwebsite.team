const sounds = {
    // เสียงคลิกทั่วไป (ดังอยู่แล้ว)
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
    // แก้ไข URL ใหม่สำหรับ Success และ Delete
    success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435.wav'),
    delete: new Audio('https://assets.mixkit.co/active_storage/sfx/251/251.wav'),
    // เสียง Popup และ Alert (ดังอยู่แล้ว)
    popup: new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'),
    alert: new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
};

// เพิ่มฟังก์ชันช่วยโหลดใหม่เพื่อความชัวร์
Object.values(sounds).forEach(audio => {
    audio.load(); 
});

function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound) {
        // บังคับให้โหลดใหม่สั้นๆ หากไฟล์มีปัญหา
        if (sound.readyState === 0) sound.load();
        
        sound.pause(); // หยุดของเดิมก่อนเพื่อเริ่มใหม่ทันที
        sound.currentTime = 0;
        sound.volume = 0.5;
        
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.warn(`ไม่สามารถเล่นเสียง ${soundName} ได้:`, e);
            });
        }
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
            
            // แก้ไข: ใช้ /g เพื่อหาตัวเลขทุกกลุ่มในช่องนั้น
            const matches = cleanVal.match(/\d+/g); 
            
            if (matches) {
                matches.forEach(numStr => {
                    // ถ้าตัวเลขกลุ่มไหนยาว 3 หลักขึ้นไป ให้นำมาคิดกำไร
                    if (numStr.length >= 3) {
                        profit += (parseFloat(numStr) * 0.10);
                    }
                });
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

// --- 1. เพิ่มเสียงตอนพิมพ์ (Auto Save) ---
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
    
    // แสดง Badge แจ้งเตือน และเล่นเสียงเบาๆ ตอนบันทึก
    const badge = document.getElementById("auto-save-alert");
    if(badge) { 
        badge.style.opacity = "1"; 
        setTimeout(() => badge.style.opacity = "0", 1500); 
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

// --- 2. แก้ไขการลบตาราง (เพิ่มเสียง Success เมื่อปิดยอด) ---
function removeTable(button) {
    const tableContainer = button.closest('.table-container');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    const calculatedProfit = calculateTableProfit(tableContainer);

    showConfirmModal(title, calculatedProfit, (finalProfit) => {
        // เล่นเสียง Success เมื่อยืนยันปิดยอดสำเร็จ
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

// --- 4. เพิ่มเสียงตอนกู้คืนข้อมูล ---
function restoreLastDeleted() {
    if (isRestoring) return;
    if (historyData.length === 0) {
        playSound('alert'); // เสียงเตือนถ้าไม่มีข้อมูลให้กู้
        return showSimpleModal("แจ้งเตือน", "ไม่มีข้อมูลให้กู้คืน");
    }

    isRestoring = true;
    playSound('success'); // เสียงเมื่อกู้คืนสำเร็จ
    
    const last = historyData.pop();
    totalDeletedProfit -= last.profit;
    addTable(last.title, last.rows, true);
    
    localStorage.setItem("historyData", JSON.stringify(historyData));
    updateDashboardStats();
    setTimeout(() => { isRestoring = false; }, 500);
}

function handleGlobalKeyDown(e) {
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
    playSound('popup'); // เสียงเปิดหน้าต่างประวัติ
    let newWindow = window.open("", "History", "width=1100,height=900");
    
    // ดึง CSS จากหน้าหลักมาใช้เพื่อให้หน้าตาเหมือนกัน 100%
    let content = `
    <html>
    <head>
        <title>ประวัติการปิดยอด - ADMIN ROCKET</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { font-family: 'Sarabun', sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px; color: #333; margin: 0; }
            .history-title { color: white; text-align: center; margin-bottom: 30px; font-size: 2rem; }
            .table-card { 
                background: white; border-radius: 24px; padding: 25px; margin-bottom: 50px; 
                box-shadow: 0 15px 35px rgba(0,0,0,0.2); border-top: 8px solid #1e3c72; position: relative;
            }
            .history-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .timestamp { color: #64748b; font-size: 0.9rem; }
            .profit-badge { background: #2ecc71; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            
            .table-title-display { font-size: 1.4rem; font-weight: bold; color: #1e3c72; text-align: center; background: #e2e8f0; padding: 10px; border-radius: 12px; margin-bottom: 20px; }
            .custom-table { width: 100%; border-collapse: separate; border-spacing: 0 5px; }
            .custom-table th { padding: 12px; color: white; }
            .th-green { background: #2ecc71; border-radius: 10px 0 0 10px; }
            .th-orange { background: #f39c12; }
            .th-red { background: #e74c3c; }
            .th-purple { background: #9b59b6; border-radius: 0 10px 10px 0; }
            .custom-table td { padding: 10px; text-align: center; background: #f8fafc; border: 1px solid #eee; border-radius: 8px; font-weight: 600; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align:right; margin-bottom:20px;">
            <button onclick="window.print()" style="padding:10px 20px; border-radius:10px; cursor:pointer; background:white; font-weight:bold;"><i class="fas fa-print"></i> พิมพ์ประวัติ</button>
        </div>
        <h2 class="history-title">ประวัติการคิดยอดทั้งหมด</h2>`;

    historyData.slice().reverse().forEach(h => {
        let rowsHtml = h.rows.map(r => `
            <tr>
                <td>${r[0] || '-'}</td>
                <td style="color:#2e7d32;">${r[1] || '0'}</td>
                <td>${r[2] || '-'}</td>
                <td style="color:#94a3b8;"><i class="fas fa-check-circle"></i></td>
            </tr>
        `).join('');

        content += `
        <div class="table-card">
            <div class="history-meta">
                <span class="timestamp"><i class="far fa-clock"></i> ปิดยอดเมื่อ: ${h.timestamp}</span>
                <span class="profit-badge">กำไร: ฿${h.profit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div class="table-title-display">${h.title || 'ไม่ระบุชื่อค่าย'}</div>
            <table class="custom-table">
                <thead>
                    <tr>
                        <th class="th-green">คนไล่</th>
                        <th class="th-orange">ราคา</th>
                        <th class="th-red">คนยั้ง</th>
                        <th class="th-purple">สถานะ</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>`;
    });

    content += `</body></html>`;
    newWindow.document.write(content);
    newWindow.document.close();
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
    const btnNo = createModalBtn("ไม่คิดยอด (จาว)", "btn-confirm", () => handleAction(0));
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
    playSound('click'); // เสียงตอนกดปิด Modal
    document.getElementById('custom-modal').classList.remove('active'); 
    window.removeEventListener('keydown', currentModalKeyHandler);
}

function clearAllHistory() { if(confirm("ล้างทั้งหมด?")) { localStorage.clear(); location.reload(); } }

function openStopwatchWindow() { window.open("", "_blank", "width=400,height=400").document.write("Timer Tool..."); }

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent('คุณ '+name+'\n'+msg)}`, '_blank');
}
