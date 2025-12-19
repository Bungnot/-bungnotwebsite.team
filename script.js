let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

// [ cite: 1 ] โหลดข้อมูลเริ่มต้น
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
});

// [ cite: 1 ] ซิงค์ข้อมูลข้ามหน้าต่าง
window.addEventListener('storage', (event) => {
    if (event.key === 'savedTables') {
        loadData(); 
        const badge = document.getElementById("auto-save-alert");
        if(badge) {
            badge.innerText = "🔄 อัปเดตข้อมูลแล้ว";
            badge.style.opacity = "1"; 
            setTimeout(() => badge.style.opacity = "0", 3000); 
        }
    }
});

// [ cite: 1 ] ข้อมูล LINE
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
        else showModal("Error", "ส่งไม่สำเร็จ", "alert");
    } catch (err) { showModal("Network Error", "ไม่สามารถเชื่อมต่อ Server ได้", "alert"); }
}

// [ cite: 1 ] ฟังก์ชันหลักของตาราง
function addRow(table) {
    const tbody = table.querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `<td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><button onclick="removeRow(this)" style="color:#e74c3c; border:none; background:none; cursor:pointer;"><i class="fas fa-times"></i></button></td>`;
    tbody.appendChild(newRow);
}

function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");
    newTable.innerHTML = `
        <button onclick="removeTable(this)" style="position:absolute; top:15px; right:15px; border:none; background:#fcebea; color:#e74c3c; width:30px; height:30px; border-radius:50%; cursor:pointer;"><i class="fas fa-times"></i></button>
        <div style="text-align:center; margin-bottom:15px;"><input type="text" class="table-title-input" placeholder="ใส่ชื่อค่าย..."></div>
        <table class="custom-table">
            <thead><tr><th class="th-green">คนไล่</th><th class="th-orange">ราคา</th><th class="th-red">คนยั้ง</th><th class="th-purple">ลบ</th></tr></thead>
            <tbody><tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><button onclick="removeRow(this)" style="color:#e74c3c; border:none; background:none; cursor:pointer;"><i class="fas fa-times"></i></button></td></tr></tbody>
        </table>
        <button onclick="addRow(this.previousElementSibling)" style="width:100%; border:1px dashed #102a43; background:#f0f4f8; padding:10px; border-radius:10px; cursor:pointer; font-weight:bold;">+ เพิ่มแผลที่เล่น</button>
    `;
    container.appendChild(newTable);
    newTable.scrollIntoView({ behavior: 'smooth' });
}

function removeTable(button) {
    const tableContainer = button.parentElement;
    const priceInputs = tableContainer.querySelectorAll("td:nth-child(2) input");
    let totalProfit = 0;
    priceInputs.forEach(input => {
        const match = input.value.match(/\d{3,}/);
        if (match) totalProfit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ยืนยันการลบ", `ลบตารางนี้?\nกำไรที่ได้รับ: ฿${totalProfit.toFixed(2)}`, "confirm", () => {
        const title = tableContainer.querySelector('.table-title-input').value;
        const rowsData = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rowsData.push([cells[0]?.value || "", cells[1]?.value || "", cells[2]?.value || ""]);
        });
        historyData.push({ title: title, rows: rowsData, profit: totalProfit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += totalProfit;
        tableContainer.remove();
        saveData();
    });
}

function removeRow(button) { button.parentElement.parentElement.remove(); saveData(); }

function saveData() {
    const data = [];
    document.querySelectorAll(".table-container").forEach(table => {
        const title = table.querySelector(".table-title-input").value;
        const rows = [];
        table.querySelectorAll("tbody tr").forEach(r => {
            const cells = r.querySelectorAll("input");
            rows.push([cells[0]?.value||"", cells[1]?.value||"", cells[2]?.value||""]);
        });
        data.push({ title, rows });
    });
    localStorage.setItem("savedTables", JSON.stringify(data));
    const badge = document.getElementById("auto-save-alert");
    if(badge) { badge.style.opacity = "1"; setTimeout(() => badge.style.opacity = "0", 2000); }
}

function loadData() {
    const data = JSON.parse(localStorage.getItem("savedTables"));
    if (!data) return;
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(table => {
        addTable();
        const lastTable = container.lastElementChild;
        lastTable.querySelector(".table-title-input").value = table.title;
        const tbody = lastTable.querySelector("tbody");
        tbody.innerHTML = "";
        table.rows.forEach(r => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td><input type="text" value="${r[0]}"></td><td><input type="text" value="${r[1]}"></td><td><input type="text" value="${r[2]}"></td><td><button onclick="removeRow(this)" style="color:#e74c3c; border:none; background:none; cursor:pointer;"><i class="fas fa-times"></i></button></td>`;
            tbody.appendChild(tr);
        });
    });
}

// [ cite: 1 ] ระบบ Modal (Logic เดิม)
function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    const msgEl = document.getElementById('modal-msg');
    const actionsEl = document.getElementById('modal-actions');
    msgEl.innerHTML = message;
    actionsEl.innerHTML = "";

    if (type === "input") {
        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.className = "modal-input";
        inputField.style.width = "100%";
        inputField.style.padding = "10px";
        inputField.style.borderRadius = "8px";
        inputField.style.border = "1px solid #ddd";
        msgEl.appendChild(inputField);

        const btnOk = document.createElement("button");
        btnOk.innerText = "เริ่ม";
        btnOk.className = "btn-main";
        btnOk.style.background = "#27ae60";
        btnOk.style.color = "white";
        btnOk.onclick = () => { closeModal(); if(callback) callback(inputField.value); };
        actionsEl.appendChild(btnOk);
    } else if (type === "confirm") {
        const btnNo = document.createElement("button");
        btnNo.innerText = "ยกเลิก";
        btnNo.className = "btn-main";
        btnNo.onclick = closeModal;
        
        const btnYes = document.createElement("button");
        btnYes.innerText = "ยืนยัน";
        btnYes.className = "btn-main";
        btnYes.style.background = "#e74c3c";
        btnYes.style.color = "white";
        btnYes.onclick = () => { closeModal(); if(callback) callback(); };
        
        actionsEl.appendChild(btnNo);
        actionsEl.appendChild(btnYes);
    } else {
        const btnOk = document.createElement("button");
        btnOk.innerText = "ตกลง";
        btnOk.className = "btn-main";
        btnOk.style.background = "#3498db";
        btnOk.style.color = "white";
        btnOk.onclick = closeModal;
        actionsEl.appendChild(btnOk);
    }
    modal.classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return showModal("ผิดพลาด", "กรุณากรอกข้อมูลให้ครบ", "alert");
    const uid = getLineIdFromName(name);
    uid ? pushText(uid, msg) : showModal("ไม่พบผู้ใช้", "กรุณาตรวจสอบชื่ออีกครั้ง", "alert");
}

function clearAllHistory() {
    showModal("ยืนยัน", "ลบประวัติการคำนวณทั้งหมด?", "confirm", () => {
        localStorage.removeItem('historyData');
        historyData = [];
        totalDeletedProfit = 0;
        showModal("สำเร็จ", "ล้างประวัติแล้ว", "alert");
    });
}

function openStopwatchWindow() {
    showModal("เริ่มจับเวลา", "กรุณากรอกชื่อค่าย:", "input", (name) => {
        if (name) createStopwatchWindow(name);
    });
}

// [ cite: 1 ] ฟังก์ชัน Stopwatch Window (Logic เดิม)
function createStopwatchWindow(name) {
    let newWindow = window.open("", "Stopwatch", "width=400,height=600");
    // (เนื้อหา HTML ภายในส่วนนี้ใช้ของเดิมได้เลยครับ ผมไม่ได้เปลี่ยนแปลงตรรกะ)
    let content = `<html><head><title>${name}</title><style>body{background:#102a43; color:white; font-family:Sarabun; text-align:center; padding:20px;}</style></head><body><h2>ค่าย: ${name}</h2><div id="display" style="font-size:4rem; margin:30px 0;">00.000</div><button id="start">เริ่ม</button><script>let start=0, elapsed=0, timer; document.getElementById('start').onclick=()=>{if(!timer){start=Date.now()-elapsed; timer=setInterval(()=>{elapsed=Date.now()-start; document.getElementById('display').innerText=(elapsed/1000).toFixed(3)},10)}};</script></body></html>`;
    newWindow.document.write(content);
}

function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ยังไม่มีประวัติ", "alert");
    let win = window.open("", "History", "width=800,height=600");
    let content = `<html><head><title>History</title><style>body{font-family:Sarabun; padding:20px;} .card{border:1px solid #ddd; margin-bottom:20px; padding:15px; border-radius:10px;}</style></head><body><h2>ประวัติการลบตาราง</h2>`;
    historyData.forEach(h => {
        content += `<div class="card"><strong>ค่าย: ${h.title}</strong><br>กำไร: ฿${h.profit.toFixed(2)}<br><small>เวลา: ${h.timestamp}</small></div>`;
    });
    content += `</body></html>`;
    win.document.write(content);
}

setInterval(saveData, 15000);
