/**
 * ฟังก์ชันใหม่สำหรับหน้าต้อนรับ (Welcome Screen)
 */
function enterWebsite() {
    // เล่นเสียงคลิกเพื่อปลดล็อกระบบเสียง
    playSound('click'); 
    
    const welcome = document.getElementById('welcome-screen');
    const welcomeBox = welcome.querySelector('.welcome-box');
    
    // อนิเมชั่นตัวกล่องให้ยุบลงเล็กน้อยก่อนหายไป
    welcomeBox.style.transform = "scale(0.9)";
    welcomeBox.style.transition = "transform 0.4s ease";
    
    // ค่อยๆ จางหน้าจอ Welcome ทั้งหมดหายไป
    welcome.classList.add('fade-out-screen');
    
    // ลบ Element ทิ้งหลังจากเล่นอนิเมชั่นเสร็จ (0.8 วินาทีตาม CSS)
    setTimeout(() => {
        welcome.remove();
    }, 800);
}

// แก้ไขส่วนสร้างหิมะใน script.js
document.addEventListener("DOMContentLoaded", () => {
    const container = document.body; 
    const snowflakeSymbols = ["❄", "❅", "❆", "✨"];
    
    for (let i = 0; i < 60; i++) {
        let flake = document.createElement('div');
        flake.innerHTML = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
        flake.style.position = "fixed";
        flake.style.color = "white";
        flake.style.opacity = Math.random();
        flake.style.left = Math.random() * 100 + "vw";
        flake.style.top = "-5vh";
        flake.style.fontSize = (Math.random() * 20 + 10) + "px";
        flake.style.zIndex = "1";
        flake.style.pointerEvents = "none";
        flake.style.filter = "drop-shadow(0 0 5px rgba(255,255,255,0.8))";
        
        const fall = () => {
            const duration = Math.random() * 8000 + 5000;
            const drift = (Math.random() * 10) - 5; // ส่ายซ้ายขวาเล็กน้อย
            
            flake.animate([
                { transform: `translateY(0vh) translateX(0vw) rotate(0deg)` },
                { transform: `translateY(105vh) translateX(${drift}vw) rotate(360deg)` }
            ], {
                duration: duration,
                iterations: Infinity
            });
        };
        
        container.appendChild(flake);
        fall();
    }
});

const sounds = {
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/3124/3124-preview.mp3'),
    // แก้ไข 2 ลิงก์ที่เสียเป็น Mixkit ตัวใหม่
    success: new Audio('https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3'),
    delete: new Audio('https://assets.mixkit.co/active_storage/sfx/1489/1489-preview.mp3'),

    popup: new Audio('https://assets.mixkit.co/active_storage/sfx/2039/2039-preview.mp3'),
    
    clear: new Audio('https://assets.mixkit.co/active_storage/sfx/3118/3118-preview.mp3'),
    alert: new Audio('https://assets.mixkit.co/active_storage/sfx/2047/2047-preview.mp3')
};

// บังคับเปลี่ยน Source เป็นไฟล์เสียง MP3 ที่ใช้ได้จริงแน่นอน
sounds.success.src = 'https://actions.google.com/sounds/v1/communication/notification_high_intensity.ogg';
sounds.delete.src = 'https://actions.google.com/sounds/v1/actions/remove_item.ogg';

// ถ้าคุณใช้ iPhone/Safari ให้ใช้ลิงก์ MP3 ด้านล่างนี้แทน (เพราะ iPhone ไม่รองรับ .ogg)
// sounds.success.src = 'https://www.soundjay.com/buttons/sounds/button-37.mp3';
// sounds.delete.src = 'https://www.soundjay.com/buttons/sounds/button-10.mp3';

// เพิ่มฟังก์ชันช่วยโหลดใหม่เพื่อความชัวร์
Object.values(sounds).forEach(audio => {
    audio.load(); 
});

function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound) {
        sound.pause(); 
        sound.currentTime = 0;
        sound.volume = 0.2;
        
        // บังคับให้โหลดใหม่เพื่อให้เล่นได้ทันที
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("กรุณาคลิกหน้าจอ 1 ครั้งก่อนเพื่อเปิดระบบเสียง:", error);
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
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
            <span class="profit-badge-live" style="color:white; padding:4px 12px; border-radius:20px; font-weight:bold;">฿0.00</span>
            <div style="display:flex; gap:10px;">
                <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
            </div>
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

function removeRow(btn) { 
    playSound('delete'); // <--- มั่นใจว่ามีบรรทัดนี้
    btn.closest('tr').remove(); 
    saveData(); 
}

function copyTableAsImage(tableElement) {
    playSound('popup'); // เล่นเสียงเปิดการทำงาน
    
    // ตั้งค่าชั่วคราวเพื่อให้รูปออกมาสวย (ลบปุ่มต่างๆ ออกจากรูป)
    const actionButtons = tableElement.querySelectorAll('button, .btn-close-table');
    actionButtons.forEach(btn => btn.style.visibility = 'hidden');

    html2canvas(tableElement, {
        backgroundColor: "#ffffff", // พื้นหลังขาวเพื่อให้เห็นชัด
        scale: 2, // เพิ่มความชัดของรูป
        logging: false,
        useCORS: true
    }).then(canvas => {
        // คืนค่าปุ่มต่างๆ ให้กลับมามองเห็นเหมือนเดิม
        actionButtons.forEach(btn => btn.style.visibility = 'visible');

        // แปลงเป็นไฟล์ภาพและดาวน์โหลด (วิธีที่ชัวร์ที่สุดสำหรับส่งใน Line)
        const link = document.createElement('a');
        const title = tableElement.querySelector('.table-title-input').value || "Bung-Fai";
        link.download = `ค่าย-${title}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        playSound('success'); // เสียงเมื่อสำเร็จ
        
        const alertBox = document.getElementById("auto-save-alert");
        alertBox.innerText = "📸 บันทึกรูปภาพลงเครื่องแล้ว!";
        alertBox.style.opacity = "1";
        setTimeout(() => alertBox.style.opacity = "0", 2000);
    });
}

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
    
    // --- แก้ไขบรรทัดด้านล่างนี้ ---
    playSound('alert'); // เปลี่ยนจาก playSound('success') เป็น 'alert'
    // --------------------------
    
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
    playSound('popup');
    let newWindow = window.open("", "History", "width=1100,height=900");
    
    let content = `
    <html>
    <head>
        <title>ประวัติการปิดยอด - ADMIN ROCKET</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <style>
            body { font-family: 'Sarabun', sans-serif; background: #0f1b2a; padding: 40px; color: #333; margin: 0; }
            .history-title { color: white; text-align: center; margin-bottom: 30px; font-size: 2rem; }
            .table-card { 
                background: white; border-radius: 20px; padding: 25px; margin-bottom: 50px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.5); position: relative; border-top: 6px solid #d42426;
            }
            .history-meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .timestamp-label { color: #64748b; font-size: 0.9rem; }
            .profit-label { background: #2ecc71; color: white; padding: 4px 15px; border-radius: 50px; font-weight: bold; font-size: 0.9rem; }
            
            .table-title-display { 
                font-size: 1.4rem; font-weight: bold; color: #b3000c; text-align: center; 
                background: #fff5f5; padding: 10px; border-radius: 12px; margin-bottom: 20px; 
                border: 1px solid #ffcccc; 
            }
            .custom-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
            .custom-table th { padding: 12px; color: white; font-weight: 600; }
            .th-green { background: #14452f; border-radius: 10px 0 0 10px; }
            .th-orange { background: #bf953f; }
            .th-red { background: #b3000c; }
            .th-dark { background: #2d3436; border-radius: 0 10px 10px 0; }
            
            .custom-table td { 
                padding: 15px; text-align: center; background: #f8fafc; 
                border: 1px solid #edf2f7; border-radius: 8px; font-weight: 600; 
            }
            
            .btn-copy-item {
                background: #f0fff4; color: #22c55e; border: 1px solid #bbf7d0;
                width: 35px; height: 35px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
            }
            .btn-copy-item:hover { background: #22c55e; color: white; }
            
            .status-group { display: flex; align-items: center; justify-content: center; gap: 8px; }
            .status-icon { color: #94a3b8; font-size: 1.1rem; }
            
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align:right; margin-bottom:20px;">
            <button onclick="window.print()" style="padding:10px 20px; border-radius:10px; cursor:pointer; background:white; font-weight:bold;">พิมพ์ประวัติ</button>
        </div>
        <h2 class="history-title">ประวัติการคิดยอดทั้งหมด</h2>`;

    historyData.slice().reverse().forEach((h, tIdx) => {
        let rowsHtml = h.rows.map((r, rIdx) => `
            <tr id="row-${tIdx}-${rIdx}">
                <td>${r[0] || '-'}</td>
                <td style="color:#b3000c;">${r[1] || '0'}</td>
                <td>${r[2] || '-'}</td>
                <td>
                    <div class="status-group">
                        <i class="fas fa-check-circle status-icon"></i>
                        <button class="btn-copy-item no-print" onclick="copySingleRow('${tIdx}-${rIdx}', '${h.title}', '${h.timestamp}')" title="ก๊อปรูปแผลนี้">
                            <i class="fas fa-camera"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        content += `
        <div class="table-card">
            <div class="history-meta-row">
                <div class="timestamp-label"><i class="far fa-clock"></i> ปิดยอดเมื่อ: ${h.timestamp}</div>
                <div class="profit-label">กำไร: ฿${h.profit.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
            </div>
            <div class="table-title-display">${h.title || 'ไม่ระบุชื่อค่าย'}</div>
            <table class="custom-table">
                <thead>
                    <tr>
                        <th class="th-green">คนไล่</th>
                        <th class="th-orange">ราคา</th>
                        <th class="th-red">คนยั้ง</th>
                        <th class="th-dark">สถานะ</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>`;
    });

    content += `
        <script>
            function copySingleRow(id, title, time) {
                const row = document.getElementById('row-' + id);
                const tempDiv = document.createElement('div');
                
                tempDiv.style.cssText = "position:fixed; top:-9999px; width:800px; padding:30px; background:white; border-radius:20px; font-family:'Sarabun';";
                
                tempDiv.innerHTML = \`
                    <div style="display:flex; justify-content:flex-start; align-items:center; margin-bottom:15px;">
                        <div style="color:#64748b; font-size:16px; font-weight:bold;">🕒 ปิดยอดเมื่อ: \${time}</div>
                    </div>
                    <div style="text-align:center; font-size:26px; font-weight:bold; color:#b3000c; background:#fff5f5; padding:15px; border-radius:15px; margin-bottom:20px; border:2px solid #ffcccc;">
                        \${title}
                    </div>
                    <table style="width:100%; border-collapse:separate; border-spacing:0 10px;">
                        <thead>
                            <tr style="color:white; text-align:center; font-size:18px;">
                                <th style="background:#14452f; padding:15px; border-radius:12px 0 0 12px;">คนไล่</th>
                                <th style="background:#bf953f; padding:15px;">ราคา</th>
                                <th style="background:#b3000c; padding:15px;">คนยั้ง</th>
                                <th style="background:#2d3436; padding:15px; border-radius:0 12px 12px 0;">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="text-align:center; font-weight:700; font-size:22px;">
                                <td style="padding:20px; background:#f8fafc; border:1px solid #edf2f7; border-radius:10px;">\${row.cells[0].innerText}</td>
                                <td style="padding:20px; background:#f8fafc; border:1px solid #edf2f7; color:#b3000c;">\${row.cells[1].innerText}</td>
                                <td style="padding:20px; background:#f8fafc; border:1px solid #edf2f7;">\${row.cells[2].innerText}</td>
                                <td style="padding:20px; background:#f8fafc; border:1px solid #edf2f7; color:#22c55e;">✔</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="text-align:center; margin-top:20px; color:#cbd5e1; font-size:14px; letter-spacing:1px;">ADMIN ROCKET PREMIUM - SYSTEM DATA</div>
                \`;
                
                document.body.appendChild(tempDiv);

                html2canvas(tempDiv, { scale: 3, backgroundColor: "#ffffff" }).then(canvas => {
                    canvas.toBlob(blob => {
                        try {
                            const item = new ClipboardItem({ "image/png": blob });
                            navigator.clipboard.write([item]).then(() => {
                                alert("📋 คัดลอกรายการแล้ว! สามารถกด Ctrl + V เพื่อส่งลงไลน์ได้เลย");
                                document.body.removeChild(tempDiv);
                            });
                        } catch (err) {
                            console.error("Clipboard Error:", err);
                            alert("เบราว์เซอร์ไม่รองรับการก๊อปรูปโดยตรง กรุณาใช้ Google Chrome");
                        }
                    }, "image/png");
                });
            }
        </script>
    </body></html>`;
    
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

// แก้ไขฟังก์ชันล้างข้อมูลให้ใช้ Modal สวยๆ
function clearAllHistory() {
    // 1. เล่นเสียงเตือนก่อน (Alert)
    playSound('clear');

    // 2. เรียกใช้ Custom Modal ที่สร้างไว้แล้ว
    showConfirmModal("ยืนยันการล้างข้อมูล", 0, (confirmed) => {
        // ในที่นี้เราไม่ได้ใช้ค่า profit แต่ใช้เช็คว่ามีการตอบตกลงไหม
        // ถ้าผู้ใช้กด 'ตกลง' หรือ 'ไม่คิดยอด' (ที่ส่งค่ามา) ให้ทำการล้างข้อมูล
        
        localStorage.clear();
        
        // เล่นเสียงแจ้งเตือนความสำเร็จก่อนรีโหลด
        playSound('success');
        
        setTimeout(() => {
            location.reload();
        }, 500);
    });

    // ปรับแต่งข้อความใน Modal ให้เหมาะกับการล้างข้อมูล
    document.getElementById('modal-msg').innerHTML = 
        `<span style="color:#e74c3c; font-weight:bold;">คำเตือน!</span><br>ข้อมูลตารางและประวัติทั้งหมดจะถูกลบถาวร`;
}

function openStopwatchWindow() {
    const win = window.open("", "_blank", "width=550,height=700");
    if (!win) {
        alert("กรุณาอนุญาต Pop-up เพื่อใช้งานตัวจับเวลา");
        return;
    }

    const html = `
    <html>
    <head>
        <title>ระบบจับเวลา PRO - ADMIN ROCKET</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { font-family: 'Sarabun', sans-serif; background: #0f172a; color: white; padding: 20px; margin: 0; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e293b; padding-bottom: 10px; }
            .timer-card { 
                background: #1e293b; border-radius: 16px; padding: 20px; margin-bottom: 15px; 
                display: flex; flex-direction: column; border: 1px solid #334155;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }
            .camp-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .camp-name-input { 
                background: #0f172a; border: 1px solid #334155; border-radius: 8px;
                color: #2ecc71; font-size: 1.1rem; font-weight: bold; width: 60%; padding: 8px 12px; outline: none;
            }
            .timer-display { 
                font-family: 'Courier New', monospace; font-size: 3.5rem; color: #f8fafc; 
                text-align: center; margin: 10px 0; font-weight: bold; letter-spacing: 2px;
                text-shadow: 0 0 20px rgba(255,255,255,0.1);
            }
            .controls { display: flex; gap: 10px; justify-content: center; }
            button { 
                border: none; border-radius: 10px; cursor: pointer; font-weight: bold; 
                transition: all 0.2s; padding: 12px 20px; display: flex; align-items: center; gap: 8px;
            }
            .btn-start { background: #2ecc71; color: white; flex: 2; justify-content: center; }
            .btn-pause { background: #f39c12; color: white; flex: 2; justify-content: center; }
            .btn-reset { background: #64748b; color: white; flex: 1; justify-content: center; }
            .btn-delete { background: #e74c3c; color: white; padding: 10px; }
            .btn-add { 
                width: 100%; background: transparent; color: #3b82f6; font-size: 1.1rem; padding: 15px;
                margin-top: 10px; border: 2px dashed #3b82f6; border-radius: 16px;
            }
            button:hover { transform: translateY(-2px); filter: brightness(1.1); }
            button:active { transform: translateY(0); }
        </style>
    </head>
    <body>
        <div class="header">
            <h2><i class="fas fa-stopwatch"></i> จับเวลารายค่าย</h2>
        </div>
        
        <div id="timers-container"></div>
        
        <button class="btn-add" onclick="createNewTimer()">
            <i class="fas fa-plus-circle"></i> เพิ่มค่ายใหม่
        </button>

        <script>
            let timerCount = 0;

            function formatTime(ms) {
                let totalSeconds = Math.floor(ms / 1000);
                let minutes = Math.floor(totalSeconds / 60);
                let seconds = totalSeconds % 60;
                let tenths = Math.floor((ms % 1000) / 100);
                return \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}.\${tenths}\`;
            }

            function createNewTimer() {
                timerCount++;
                const container = document.getElementById('timers-container');
                const card = document.createElement('div');
                card.className = 'timer-card';
                card.id = 'timer-card-' + timerCount;
                
                let startTime = 0;
                let elapsedTime = 0;
                let intervalId = null;

                card.innerHTML = \`
                    <div class="camp-row">
                        <input type="text" class="camp-name-input" placeholder="ระบุชื่อค่าย...">
                        <button class="btn-delete" onclick="this.parentElement.parentElement.deleteCard()"><i class="fas fa-trash-alt"></i></button>
                    </div>
                    <div class="timer-display">00:00.0</div>
                    <div class="controls">
                        <button class="btn-start"><i class="fas fa-play"></i> เริ่ม</button>
                        <button class="btn-reset"><i class="fas fa-undo"></i> รีเซ็ต</button>
                    </div>
                \`;

                const display = card.querySelector('.timer-display');
                const btnStart = card.querySelector('.btn-start');
                const btnReset = card.querySelector('.btn-reset');

                const updateDisplay = () => {
                    const now = Date.now();
                    const currentTotal = elapsedTime + (startTime ? (now - startTime) : 0);
                    display.innerText = formatTime(currentTotal);
                };

                btnStart.onclick = function() {
                    const clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/3124/3124-preview.mp3');
                    clickSound.volume = 0.3;
                    clickSound.play();

                    if (intervalId) {
                        // Pause
                        elapsedTime += Date.now() - startTime;
                        clearInterval(intervalId);
                        intervalId = null;
                        startTime = 0;
                        btnStart.innerHTML = '<i class="fas fa-play"></i> เริ่มต่อ';
                        btnStart.className = 'btn-start';
                    } else {
                        // Start/Resume
                        startTime = Date.now();
                        intervalId = setInterval(updateDisplay, 100); // อัปเดตทุก 0.1 วินาที
                        btnStart.innerHTML = '<i class="fas fa-pause"></i> หยุด';
                        btnStart.className = 'btn-pause';
                    }
                };

                btnReset.onclick = function() {
                    clearInterval(intervalId);
                    intervalId = null;
                    startTime = 0;
                    elapsedTime = 0;
                    display.innerText = "00:00.0";
                    btnStart.innerHTML = '<i class="fas fa-play"></i> เริ่ม';
                    btnStart.className = 'btn-start';
                };

                card.deleteCard = function() {
                    if(confirm('ลบตัวจับเวลานี้?')) {
                        clearInterval(intervalId);
                        card.remove();
                    }
                };

                container.appendChild(card);
            }

            window.onload = createNewTimer;
        </script>
    </body>
    </html>`;

    win.document.write(html);
    win.document.close();
}

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent('คุณ '+name+'\n'+msg)}`, '_blank');
}
