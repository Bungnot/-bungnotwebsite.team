let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

// ===== [INITIALIZATION] =====
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
});

// ===== [REAL-TIME SYNC] =====
window.addEventListener('storage', (event) => {
    if (event.key === 'savedTables') {
        loadData(); 
        const badge = document.getElementById("auto-save-alert");
        if(badge) {
            badge.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> ข้อมูลอัปเดตจากเครื่องอื่นแล้ว';
            badge.style.opacity = "1"; 
            setTimeout(() => badge.style.opacity = "0", 3000); 
        }
    }
});

// ===== [LINE CONFIG & API] =====
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
        if (response.ok) {
            showModal("สำเร็จ", "ส่งข้อความถึง Line OA เรียบร้อยแล้ว", "alert");
        } else {
            showModal("ข้อผิดพลาด", `ส่งไม่สำเร็จ (โค้ด: ${response.status})`, "alert");
        }
    } catch (err) { 
        showModal("ข้อผิดพลาดเครือข่าย", "ไม่สามารถเชื่อมต่อ Server ได้", "alert");
    }
}

// ===== [DASHBOARD ACTIONS] =====
function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    newTable.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <input type="text" class="table-title-input" placeholder="🎯 ระบุชื่อค่าย..." style="border: none; border-bottom: 1px solid var(--accent-gold); width: auto; font-size: 1.4rem; text-align: left; padding: 5px; color: var(--accent-gold);">
            <div style="display: flex; gap: 10px;">
                <button class="btn-outline" onclick="exportTableToImage(this)" title="บันทึกรูปภาพ"><i class="fas fa-camera"></i></button>
                <button class="btn-close-table" onclick="removeTable(this)" style="background: var(--danger); color: white; border: none; width: 35px; height: 35px; border-radius: 10px; cursor: pointer;"><i class="fas fa-times"></i></button>
            </div>
        </div>
        <table class="custom-table">
            <thead>
                <tr>
                    <th><i class="fas fa-user"></i> คนไล่</th>
                    <th><i class="fas fa-tag"></i> ราคาเล่น</th>
                    <th><i class="fas fa-shield-alt"></i> คนยั้ง</th>
                    <th><i class="fas fa-cog"></i></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text" placeholder="..."></td>
                    <td><input type="text" placeholder="00/00"></td>
                    <td><input type="text" placeholder="..."></td>
                    <td><button class="btn-remove-row" onclick="removeRow(this)" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fas fa-trash-alt"></i></button></td>
                </tr>
            </tbody>
        </table>
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)" style="width: 100%; background: rgba(251, 191, 36, 0.05); color: var(--accent-gold); border: 1px dashed var(--accent-gold); padding: 12px; border-radius: 12px; margin-top: 15px; cursor: pointer; font-weight: bold;">
            <i class="fas fa-plus"></i> เพิ่มรายการ
        </button>
    `;
    container.appendChild(newTable);
    newTable.scrollIntoView({ behavior: 'smooth' });
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td><button class="btn-remove-row" onclick="removeRow(this)" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(newRow);
}

function removeRow(button) {
    const row = button.closest("tr");
    row.remove();
    saveData();
}

function removeTable(button) {
    const tableContainer = button.closest(".table-container");
    const priceInputs = tableContainer.querySelectorAll("td:nth-child(2) input");
    let totalProfit = 0;

    priceInputs.forEach(input => {
        const match = input.value.match(/\d{3,}/);
        if (match) totalProfit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ยืนยันการลบ", `ต้องการลบตารางและบันทึกกำไร ฿${totalProfit.toFixed(2)} หรือไม่?`, "confirm", () => {
        const title = tableContainer.querySelector('.table-title-input').value;
        const rowsData = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rowsData.push([cells[0]?.value || "", cells[1]?.value || "", cells[2]?.value || ""]);
        });

        historyData.push({
            title: title || "ค่ายไม่มีชื่อ", 
            rows: rowsData, 
            profit: totalProfit, 
            timestamp: new Date().toLocaleString("th-TH")
        });
        
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += totalProfit;
        tableContainer.remove();
        saveData();
    });
}

// ===== [UTILITIES] =====
async function exportTableToImage(button) {
    const tableCard = button.closest('.table-card');
    const controls = tableCard.querySelectorAll('button, .btn-add-row');
    
    // Hide buttons for cleaner photo
    controls.forEach(c => c.style.visibility = 'hidden');
    
    try {
        const canvas = await html2canvas(tableCard, {
            backgroundColor: '#1e293b',
            scale: 2,
            borderRadius: 24
        });
        const link = document.createElement('a');
        link.download = `สรุปยอด-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    } catch (e) {
        showModal("Error", "ไม่สามารถบันทึกภาพได้", "alert");
    } finally {
        controls.forEach(c => c.style.visibility = 'visible');
    }
}

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
        addTable(); // Create structure
        const lastTable = container.lastElementChild;
        lastTable.querySelector(".table-title-input").value = table.title;
        const tbody = lastTable.querySelector("tbody");
        tbody.innerHTML = ""; // Clear initial row
        table.rows.forEach(r => {
            const newRow = document.createElement("tr");
            newRow.innerHTML = `<td><input type="text" value="${r[0]}"></td><td><input type="text" value="${r[1]}"></td><td><input type="text" value="${r[2]}"></td><td><button onclick="removeRow(this)" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fas fa-trash-alt"></i></button></td>`;
            tbody.appendChild(newRow);
        });
    });
}

// ===== [STOPWATCH & HISTORY] =====
function openStopwatchWindow() {
    showModal("เริ่มจับเวลา", "กรุณากรอกชื่อค่ายบั้งไฟ:", "input", (name) => {
        if (name) createStopwatchWindow(name);
    });
}

function createStopwatchWindow(name) {
    let sw = window.open("", "_blank", "width=400,height=600");
    // (ใช้โค้ดสร้าง HTML Stopwatch เดิมของคุณได้เลยครับ)
}

function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ไม่มีประวัติการบันทึก", "alert");
    // (ใช้โค้ดสร้างหน้าต่าง History เดิมของคุณได้เลยครับ)
}

function clearAllHistory() {
    showModal("ล้างประวัติ", "คุณต้องการลบประวัติทั้งหมดถาวรหรือไม่?", "confirm", () => {
        localStorage.removeItem('historyData');
        historyData = [];
        totalDeletedProfit = 0;
        showModal("สำเร็จ", "ลบประวัติเรียบร้อย", "alert");
    });
}

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return showModal("ข้อมูลไม่ครบ", "กรุณากรอกชื่อและข้อความ", "alert");
    const uid = getLineIdFromName(name);
    uid ? pushText(uid, msg) : showModal("ไม่พบผู้ใช้", "กรุณาตรวจสอบชื่ออีกครั้ง", "alert");
}

// ===== [CUSTOM MODAL ENGINE] =====
function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-msg');
    const actionsEl = document.getElementById('modal-actions');

    titleEl.innerText = title;
    msgEl.innerHTML = message;
    actionsEl.innerHTML = "";

    if (type === "input") {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "modal-input";
        input.placeholder = "ชื่อค่าย...";
        msgEl.appendChild(input);
        
        const btn = document.createElement("button");
        btn.innerText = "ตกลง";
        btn.className = "btn-gold";
        btn.onclick = () => { closeModal(); callback(input.value); };
        actionsEl.appendChild(btn);
    } else if (type === "confirm") {
        const btnYes = document.createElement("button");
        btnYes.innerText = "ยืนยัน";
        btnYes.className = "btn-gold";
        btnYes.onclick = () => { closeModal(); callback(); };
        
        const btnNo = document.createElement("button");
        btnNo.innerText = "ยกเลิก";
        btnNo.className = "btn-outline";
        btnNo.onclick = closeModal;
        
        actionsEl.appendChild(btnNo);
        actionsEl.appendChild(btnYes);
    } else {
        const btnOk = document.createElement("button");
        btnOk.innerText = "ตกลง";
        btnOk.className = "btn-gold";
        btnOk.onclick = closeModal;
        actionsEl.appendChild(btnOk);
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
}

setInterval(saveData, 15000);
