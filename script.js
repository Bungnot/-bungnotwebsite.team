/**
 * ฟังก์ชันหน้าต้อนรับและหิมะ
 */
function enterWebsite() {
    playSound('click'); 
    const welcome = document.getElementById('welcome-screen');
    welcome.style.opacity = "0";
    setTimeout(() => { welcome.remove(); }, 800);
}

function createSnow() {
    const container = document.getElementById('snow-container');
    const snowIcons = ['❄', '❅', '❆', '•'];
    for (let i = 0; i < 50; i++) {
        let flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.innerText = snowIcons[Math.floor(Math.random() * snowIcons.length)];
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.animationDuration = (5 + Math.random() * 10) + 's';
        flake.style.fontSize = (0.8 + Math.random() * 1.5) + 'em';
        flake.style.animationDelay = (Math.random() * 5) + 's';
        container.appendChild(flake);
    }
}

// --- การจัดการเสียง ---
const sounds = {
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/3124/3124-preview.mp3'),
    success: new Audio('https://actions.google.com/sounds/v1/communication/notification_high_intensity.ogg'),
    delete: new Audio('https://actions.google.com/sounds/v1/actions/remove_item.ogg'),
    popup: new Audio('https://assets.mixkit.co/active_storage/sfx/2039/2039-preview.mp3'),
    clear: new Audio('https://assets.mixkit.co/active_storage/sfx/3118/3118-preview.mp3'),
    alert: new Audio('https://assets.mixkit.co/active_storage/sfx/2047/2047-preview.mp3')
};

function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.volume = 0.2;
        sound.play().catch(() => {});
    }
}

// --- ตัวแปรหลัก ---
let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;
let isProcessingModal = false;
let isRestoring = false;

document.addEventListener("DOMContentLoaded", () => {
    createSnow();
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    loadData(); 
    document.addEventListener('keydown', handleGlobalKeyDown);
});

// --- การคำนวณและบันทึก ---
function calculateTableProfit(tableElement) {
    let profit = 0;
    tableElement.querySelectorAll("tbody tr").forEach(tr => {
        const inputs = tr.querySelectorAll("input");
        if (inputs[1]) {
            const cleanVal = inputs[1].value.replace(/[Oo]/g, '0');
            const matches = cleanVal.match(/\d+/g); 
            if (matches) {
                matches.forEach(numStr => {
                    if (numStr.length >= 3) profit += (parseFloat(numStr) * 0.10);
                });
            }
        }
    });
    return profit;
}

function saveData() {
    const data = [];
    document.querySelectorAll(".table-container").forEach(table => {
        const title = table.querySelector(".table-title-input")?.value || "";
        const rows = [];
        table.querySelectorAll("tbody tr").forEach(r => {
            const cells = r.querySelectorAll("input");
            if (cells.length >= 3) rows.push([cells[0].value, cells[1].value, cells[2].value]);
        });
        data.push({ title, rows });
    });
    localStorage.setItem("savedTables", JSON.stringify(data));
    refreshAllBadges();
    updateDashboardStats();
    
    const badge = document.getElementById("auto-save-alert");
    if(badge) { badge.style.opacity = "1"; setTimeout(() => badge.style.opacity = "0", 1000); }
}

function refreshAllBadges() {
    document.querySelectorAll(".table-container").forEach(table => {
        const profit = calculateTableProfit(table);
        const badge = table.querySelector(".profit-badge-live");
        if (badge) {
            badge.innerText = `฿${profit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
            badge.style.background = profit > 0 ? "#27ae60" : "#94a3b8";
        }
    });
}

function loadData() {
    const raw = localStorage.getItem("savedTables");
    if (!raw) return;
    const data = JSON.parse(raw);
    document.getElementById("tables-container").innerHTML = "";
    data.forEach(t => addTable(t.title, t.rows, true));
}

// --- จัดการตาราง ---
function addTable(title = "", rows = null, isSilent = false) {
    if(!isSilent) playSound('click');
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.className = "table-container table-card";

    let rowsHtml = rows ? rows.map(r => `
        <tr>
            <td><input type="text" value="${r[0]}" oninput="saveData()"></td>
            <td><input type="text" value="${r[1]}" oninput="saveData()" style="color:#c0392b; font-weight:bold;"></td>
            <td><input type="text" value="${r[2]}" oninput="saveData()"></td>
            <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('') : `
        <tr>
            <td><input type="text" oninput="saveData()"></td>
            <td><input type="text" oninput="saveData()" style="color:#c0392b; font-weight:bold;"></td>
            <td><input type="text" oninput="saveData()"></td>
            <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash"></i></button></td>
        </tr>`;

    newTable.innerHTML = `
        <div style="display:flex; justify-content:space-between; padding:10px;">
            <span class="profit-badge-live" style="color:white; padding:4px 12px; border-radius:20px; font-weight:bold;">฿0.00</span>
            <button onclick="removeTable(this)" style="background:none; border:none; color:#ccc; cursor:pointer;"><i class="fas fa-times"></i></button>
        </div>
        <input type="text" class="table-title-input" value="${title}" placeholder="ชื่อค่าย..." oninput="saveData()">
        <table class="custom-table" style="width:100%">
            <thead><tr><th class="th-green">คนไล่</th><th class="th-orange">ราคา</th><th class="th-red">คนยั้ง</th><th class="th-purple">ลบ</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        <button class="btn-main" onclick="addRow(this.previousElementSibling)" style="width:100%; margin-top:10px; border-style:dashed;">+ เพิ่มแถว</button>`;
    
    container.appendChild(newTable);
    saveData();
}

function addRow(table) {
    playSound('click');
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()"></td><td><input type="text" oninput="saveData()"></td><td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash"></i></button></td>`;
    table.querySelector("tbody").appendChild(tr);
}

function removeRow(btn) { playSound('delete'); btn.closest('tr').remove(); saveData(); }

function removeTable(button) {
    const tableContainer = button.closest('.table-container');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    const profit = calculateTableProfit(tableContainer);

    showConfirmModal(title, profit, (finalProfit) => {
        playSound('success'); 
        const rows = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rows.push([cells[0].value, cells[1].value, cells[2].value]);
        });
        historyData.push({ title, rows, profit: finalProfit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += finalProfit;
        tableContainer.remove();
        saveData();
    });
}

// --- ฟังก์ชันเสริม ---
function restoreLastDeleted() {
    if (isRestoring || historyData.length === 0) return playSound('alert');
    isRestoring = true;
    playSound('alert');
    const last = historyData.pop();
    totalDeletedProfit -= last.profit;
    addTable(last.title, last.rows, true);
    localStorage.setItem("historyData", JSON.stringify(historyData));
    updateDashboardStats();
    setTimeout(() => { isRestoring = false; }, 500);
}

function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

function handleGlobalKeyDown(e) {
    if (e.target.tagName !== "INPUT") return;
    const currentTr = e.target.closest('tr');
    if(!currentTr) return;
    const colIndex = Array.from(currentTr.querySelectorAll("input")).indexOf(e.target);
    if (e.key === "ArrowDown") {
        e.preventDefault();
        currentTr.nextElementSibling?.querySelectorAll("input")[colIndex]?.focus();
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        currentTr.previousElementSibling?.querySelectorAll("input")[colIndex]?.focus();
    }
}

// --- Modal & History ---
function showConfirmModal(title, profit, callback) {
    if (isProcessingModal) return; 
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = "ยืนยันการปิดยอด";
    document.getElementById('modal-msg').innerHTML = `ค่าย: <b>${title}</b><br>กำไร: <span style="color:green; font-size:1.5rem;">฿${profit.toFixed(2)}</span>`;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";
    const btnOk = document.createElement("button");
    btnOk.innerText = "ตกลง (Enter)"; btnOk.className = "btn-main";
    btnOk.onclick = () => { modal.classList.remove('active'); callback(profit); };
    
    const btnCancel = document.createElement("button");
    btnCancel.innerText = "ยกเลิก"; btnCancel.className = "btn-main";
    btnCancel.onclick = () => modal.classList.remove('active');

    actions.append(btnCancel, btnOk);
    modal.classList.add('active');
}

function showHistory() {
    if (historyData.length === 0) return;
    playSound('popup');
    let win = window.open("", "History", "width=800,height=600");
    let content = `<html><head><title>ประวัติ</title><style>body{font-family:Sarabun; padding:20px; background:#f0f4f8;} .card{background:white; padding:15px; margin-bottom:10px; border-radius:10px; border-left:5px solid #c0392b;}</style></head><body><h2>ประวัติการปิดยอด</h2>`;
    historyData.slice().reverse().forEach(h => {
        content += `<div class="card"><b>${h.title}</b> - ฿${h.profit.toFixed(2)} <br><small>${h.timestamp}</small></div>`;
    });
    win.document.write(content + `</body></html>`);
}

function clearAllHistory() {
    playSound('clear');
    if(confirm("ล้างข้อมูลทั้งหมด?")) {
        localStorage.clear();
        location.reload();
    }
}

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(name && msg) window.open(`https://line.me/R/msg/text/?${encodeURIComponent('คุณ '+name+'\n'+msg)}`, '_blank');
}

// --- Stopwatch Window ---
function openStopwatchWindow() {
    const win = window.open("", "_blank", "width=500,height=600");
    win.document.write(`<html><head><title>Timer</title><style>body{background:#0f172a; color:white; text-align:center; font-family:Sarabun;}</style></head><body><h2>ระบบจับเวลา</h2><div id="display" style="font-size:3rem;">00:00.0</div><button onclick="start()">Start</button><script>let time=0, inv; function start(){ inv=setInterval(()=>{time+=100; document.getElementById('display').innerText=(time/1000).toFixed(1)},100)}</script></body></html>`);
}
