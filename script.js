let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

// [INITIAL LOAD]
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats(); //
});

// [REAL-TIME SYNC]
window.addEventListener('storage', (event) => {
    if (event.key === 'savedTables') {
        loadData(); 
        showToast("🔄 อัปเดตข้อมูลจากหน้าต่างอื่น");
    }
});

// [UI UPDATER]
function updateDashboardStats() {
    const profitEl = document.getElementById("total-profit-display");
    const countEl = document.getElementById("active-tables-count");
    
    if(profitEl) profitEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    if(countEl) countEl.innerText = document.querySelectorAll(".table-container").length;
}

function showToast(text) {
    const badge = document.getElementById("auto-save-alert");
    if(badge) {
        badge.innerHTML = `<i class="fas fa-check-circle"></i> ${text}`;
        badge.style.opacity = "1";
        setTimeout(() => badge.style.opacity = "0", 3000);
    }
}

// [LINE CONFIG]
const LINE_UID_MAP = {
    "Bungnot._": "U255dd67c1fef32fb0eae127149c7cadc",
    "BuK Do": "U163186c5013c8f1e4820291b7b1d86bd",
    "บริการบอทไลน์ V7": "U0e1f53b2f1cc24a7316473480bd2861a",
    "อิสลาม แห่งอิหร่าน": "U2f156aa5effee7c1ee349b9320a35381",
    "Atcharapun Aom": "U3e3ac0e16feb88534470f897ebfa38ec",
    "BenZ": "U3e03ef4725e04db4a9729db77bb16b6c",
    "เซียนแปะโรงสี💵💰💲🪙": "U58a1222aeb7b82dea040fa50e1791a7f",
    "ต้า💯💯": "U5e2ca7eb5183684b91ba83c801ef713b",
    "M8N": "U6a862e37864d5f522e8af490dd120440",
    "Few": "U818fd2665026afe242a2c27f441642de",
    "ยี่สิบโท หมิง": "Ua914df11d1747d2eea4fbdd06a9c1052",
    "Nuiy Weerapon": "Ubdbaa2989f39daff930a4ca8d253344c",
    "Jaran Kk.": "Uc08e788e6816a25d517ef9a32c1e381e",
    "สารวัตรกึ่ม👮‍♂️🚔": "Uc2013ea8397da6d19cbe0f931a04c949",
    "Aek💰": "Uc3594ebfcb19bdc4e05b62b8525e9eed",
    "ฟลุ๊กฟิก😊😉": "Uc90d6d7a78e56640cdf3f93e4472127b",
    "กล้อง🔭อินเฟอร์เรส": "Ucd41b3d1c42f80e42ed691a7d9309c79",
    "Satthapan": "Ud27019d7ae7d4e6be81e1a2e3f6ee6ea",
    "Thanaphut Sks": "Ue93a927aa8b7aafb4b8dc7b11e58c1f3",
    "🌠ผมชื่อบอยนะคร้าา🌠💯": "Uebd6b15d2ff306abddcfb47fe56a17f0",
    "🥰แอดมิน ตัวกลม🚀": "Ufe84b76808464511da99d60b7c7449b8"
};

function getLineIdFromName(nameRaw) {
    if (!nameRaw) return "";
    const normalizedName = nameRaw.replace("@", "").trim().toLowerCase(); 
    for (const key in LINE_UID_MAP) {
        if (key.toLowerCase() === normalizedName) return LINE_UID_MAP[key];
    }
    return "";
}

async function pushText(to, text) {
    try {
        const response = await fetch("http://102.129.229.219:5000/send_line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to, text }),
        });
        if (response.ok) showModal("สำเร็จ", "ส่งข้อความเรียบร้อยแล้ว", "alert");
        else showModal("Error", `โค้ด: ${response.status}`, "alert");
    } catch (err) { 
        showModal("ข้อผิดพลาด", "เชื่อมต่อ Server ไม่ได้", "alert");
    }
}

// [MODAL SYSTEM]
function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-msg');
    const actionsEl = document.getElementById('modal-actions');
    const iconEl = document.getElementById('modal-icon');

    if (currentModalKeyHandler) document.removeEventListener("keydown", currentModalKeyHandler);
    
    titleEl.innerText = title;
    msgEl.innerHTML = ""; 
    actionsEl.innerHTML = ""; 

    if (type === "input") {
        iconEl.className = "fas fa-edit modal-icon";
        iconEl.style.color = "#3498db";
        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.placeholder = message;
        inputField.className = "modal-input";
        inputField.style.width = "100%";
        msgEl.appendChild(inputField);

        const btnStart = document.createElement("button");
        btnStart.className = "btn-modal btn-confirm";
        btnStart.style.background = "#2ecc71";
        btnStart.innerText = "ตกลง";
        btnStart.onclick = () => { closeModal(); if (callback) callback(inputField.value); };

        actionsEl.appendChild(btnStart);
        setTimeout(() => inputField.focus(), 100);
    } else if (type === "confirm") {
        iconEl.className = "fas fa-question-circle modal-icon";
        iconEl.style.color = "#f39c12";
        msgEl.innerText = message;
        const btnYes = document.createElement("button");
        btnYes.className = "btn-modal btn-confirm";
        btnYes.innerText = "ยืนยัน";
        btnYes.onclick = () => { closeModal(); if (callback) callback(); };
        const btnNo = document.createElement("button");
        btnNo.className = "btn-modal btn-cancel";
        btnNo.innerText = "ยกเลิก";
        btnNo.onclick = closeModal;
        actionsEl.appendChild(btnNo);
        actionsEl.appendChild(btnYes);
    } else {
        iconEl.className = "fas fa-info-circle modal-icon";
        iconEl.style.color = "#3498db";
        msgEl.innerText = message;
        const btnOk = document.createElement("button");
        btnOk.className = "btn-modal btn-cancel";
        btnOk.innerText = "ตกลง";
        btnOk.onclick = closeModal;
        actionsEl.appendChild(btnOk);
    }
    
    modal.classList.add('active');
    currentModalKeyHandler = (e) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", currentModalKeyHandler);
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
}

// [CORE FUNCTIONS]
function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");
    newTable.innerHTML = `
        <button class="btn-close-table" onclick="removeTable(this)" style="position:absolute; top:10px; right:10px; border:none; background:none; cursor:pointer; color:#e74c3c;"><i class="fas fa-times-circle fa-lg"></i></button>
        <div class="card-header" style="margin-bottom:15px;">
            <input type="text" class="table-title-input" placeholder="ระบุชื่อค่าย...">
        </div>
        <table class="custom-table">
            <thead>
                <tr>
                    <th class="th-green">ไล่</th>
                    <th class="th-orange">ราคา</th>
                    <th class="th-red">ยั้ง</th>
                    <th class="th-purple">ลบ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text"></td>
                    <td><input type="text"></td>
                    <td><input type="text"></td>
                    <td><button onclick="removeRow(this)" style="border:none; background:none; color:#e67e22; cursor:pointer;"><i class="fas fa-trash"></i></button></td>
                </tr>
            </tbody>
        </table>
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)" style="width:100%; padding:10px; border:1px dashed #ccc; background:#f9f9f9; cursor:pointer; border-radius:10px;">+ เพิ่มแถว</button>
    `;
    container.appendChild(newTable);
    updateDashboardStats();
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const row = document.createElement("tr");
    row.innerHTML = `<td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><button onclick="removeRow(this)" style="border:none; background:none; color:#e67e22; cursor:pointer;"><i class="fas fa-trash"></i></button></td>`;
    tbody.appendChild(row);
    row.querySelector("input").focus();
}

function removeRow(btn) {
    btn.closest("tr").remove();
    saveData();
}

function removeTable(btn) {
    const card = btn.closest(".table-card");
    const title = card.querySelector(".table-title-input").value;
    
    // คำนวณกำไร
    let profit = 0;
    card.querySelectorAll("tbody tr").forEach(tr => {
        const val = tr.querySelectorAll("input")[1].value.replace(/[Oo]/g, '0');
        const match = val.match(/\d{3,}/);
        if(match) profit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ลบตาราง", `ยืนยันการลบ? (กำไร: ฿${profit.toFixed(2)})`, "confirm", () => {
        const rows = [];
        card.querySelectorAll("tbody tr").forEach(tr => {
            const ins = tr.querySelectorAll("input");
            rows.push([ins[0].value, ins[1].value, ins[2].value]);
        });
        
        historyData.push({ title, rows, profit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += profit;
        
        card.remove();
        saveData();
        updateDashboardStats();
        showToast("ลบและบันทึกกำไรแล้ว");
    });
}

function saveData() {
    const data = [];
    document.querySelectorAll(".table-card").forEach(card => {
        const title = card.querySelector(".table-title-input").value;
        const rows = [];
        card.querySelectorAll("tbody tr").forEach(tr => {
            const ins = tr.querySelectorAll("input");
            rows.push([ins[0].value, ins[1].value, ins[2].value]);
        });
        data.push({ title, rows });
    });
    localStorage.setItem("savedTables", JSON.stringify(data));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem("savedTables") || "[]");
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(item => {
        addTable();
        const lastCard = container.lastElementChild;
        lastCard.querySelector(".table-title-input").value = item.title;
        const tbody = lastCard.querySelector("tbody");
        tbody.innerHTML = "";
        item.rows.forEach(r => {
            const row = document.createElement("tr");
            row.innerHTML = `<td><input type="text" value="${r[0]}"></td><td><input type="text" value="${r[1]}"></td><td><input type="text" value="${r[2]}"></td><td><button onclick="removeRow(this)" style="border:none; background:none; color:#e67e22; cursor:pointer;"><i class="fas fa-trash"></i></button></td>`;
            tbody.appendChild(row);
        });
    });
}

// [OTHERS]
function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    const uid = getLineIdFromName(name);
    uid ? pushText(uid, msg) : showModal("ไม่พบผู้ใช้", "กรุณาเช็คชื่อให้ตรงกับระบบ", "alert");
}

function clearAllHistory() {
    showModal("ล้างประวัติ", "ต้องการลบประวัติถาวรหรือไม่?", "confirm", () => {
        localStorage.removeItem("historyData");
        historyData = [];
        totalDeletedProfit = 0;
        updateDashboardStats();
        showToast("ล้างประวัติแล้ว");
    });
}

function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ไม่มีประวัติ", "alert");
    let win = window.open("", "History", "width=800,height=600");
    let html = `<html><head><title>ประวัติ</title><style>body{font-family:Sarabun;padding:20px} .card{border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:10px;}</style></head><body><h2>ประวัติกำไรรวม: ฿${totalDeletedProfit.toFixed(2)}</h2>`;
    historyData.forEach(h => {
        html += `<div class="card"><b>${h.title}</b> (กำไร: ฿${h.profit.toFixed(2)})<br><small>${h.timestamp}</small></div>`;
    });
    html += `</body></html>`;
    win.document.write(html);
}

function openStopwatchWindow() {
    showModal("เริ่มจับเวลา", "ระบุชื่อค่าย:", "input", (name) => {
        if (!name) return;
        let sw = window.open("", "_blank", "width=400,height=500");
        sw.document.write(`<html><head><title>Timer: ${name}</title><style>body{background:#2c3e50;color:white;text-align:center;font-family:sans-serif;padding-top:50px} #display{font-size:4rem;margin:20px}</style></head><body><h2>${name}</h2><div id="display">0.000</div><button id="btn" style="padding:15px 30px; font-size:1.2rem; border-radius:50px; border:none; cursor:pointer; background:#2ecc71; color:white;">START</button><script>let start=0, active=false, interval; const d=document.getElementById("display"), b=document.getElementById("btn"); b.onclick=()=>{ if(!active){ start=Date.now(); interval=setInterval(()=>{ d.innerText=((Date.now()-start)/1000).toFixed(3) },10); b.innerText="STOP"; b.style.background="#e74c3c"; active=true; } else { clearInterval(interval); b.innerText="RESET"; b.style.background="#3498db"; b.onclick=()=>location.reload(); } };</script></body></html>`);
    });
}

setInterval(saveData, 10000);
