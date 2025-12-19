let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

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

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
});

// ===== [SYSTEM LOGIC] =====
function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    newTable.innerHTML = `
        <div class="card-header">
            <input type="text" class="table-title-input" placeholder="🎯 ระบุชื่อค่าย...">
            <div style="display: flex; gap: 8px;">
                <button class="btn-main" onclick="exportToImage(this)" style="padding: 8px 12px;"><i class="fas fa-camera"></i></button>
                <button onclick="removeTable(this)" style="background: #fff0f0; color: #e74c3c; border: none; padding: 10px 15px; border-radius: 12px; cursor: pointer;"><i class="fas fa-times"></i></button>
            </div>
        </div>
        <table class="custom-table">
            <thead>
                <tr>
                    <th style="color: var(--accent-green)">คนไล่</th>
                    <th style="color: var(--accent-orange)">ราคาเล่น</th>
                    <th style="color: var(--accent-red)">คนยั้ง</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text"></td>
                    <td><input type="text"></td>
                    <td><input type="text"></td>
                    <td><button onclick="removeRow(this)" style="color:#ccc; background:none; border:none; cursor:pointer;"><i class="fas fa-trash-alt"></i></button></td>
                </tr>
            </tbody>
        </table>
        <button class="btn-main" onclick="addRow(this.previousElementSibling)" style="width: 100%; justify-content: center; margin-top: 15px; border: 1px dashed #ddd;">+ เพิ่มรายการ</button>
    `;
    container.appendChild(newTable);
    newTable.scrollIntoView({ behavior: 'smooth' });
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `<td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><button onclick="removeRow(this)" style="color:#ccc; background:none; border:none; cursor:pointer;"><i class="fas fa-trash-alt"></i></button></td>`;
    tbody.appendChild(newRow);
    saveData();
}

function removeRow(button) {
    button.closest("tr").remove();
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

    showModal("ยืนยันการลบ", `ต้องการบันทึกกำไร ฿${totalProfit.toFixed(2)} และลบตารางหรือไม่?`, "confirm", () => {
        const title = tableContainer.querySelector('.table-title-input').value;
        const rowsData = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rowsData.push([cells[0]?.value || "", cells[1]?.value || "", cells[2]?.value || ""]);
        });
        historyData.push({ title: title || "ค่ายไม่ระบุชื่อ", rows: rowsData, profit: totalProfit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += totalProfit;
        tableContainer.remove();
        saveData();
    });
}

// ===== [UTILITIES] =====
async function exportToImage(button) {
    const card = button.closest(".table-card");
    const canvas = await html2canvas(card, { backgroundColor: '#1e3c72' });
    const link = document.createElement("a");
    link.download = `สรุปยอด-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return showModal("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบ", "alert");
    
    const normalizedName = name.replace("@", "").trim().toLowerCase();
    let uid = "";
    for (const key in LINE_UID_MAP) {
        if (key.toLowerCase() === normalizedName) { uid = LINE_UID_MAP[key]; break; }
    }

    if(uid) pushText(uid, msg);
    else showModal("ไม่พบผู้ใช้", "โปรดตรวจสอบชื่อในระบบอีกครั้ง", "alert");
}

async function pushText(to, text) {
    try {
        const response = await fetch("http://102.129.229.219:5000/send_line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to, text }),
        });
        if (response.ok) showModal("สำเร็จ", "ส่งข้อความเรียบร้อยแล้ว", "alert");
        else showModal("Error", "ไม่สามารถส่งได้", "alert");
    } catch (err) { showModal("เครือข่าย", "ติดต่อ Server ไม่ได้", "alert"); }
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
    if(badge) { badge.innerText = "✅ บันทึกแล้ว"; badge.style.opacity = "1"; setTimeout(() => badge.style.opacity = "0", 2000); }
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
            tr.innerHTML = `<td><input type="text" value="${r[0]}"></td><td><input type="text" value="${r[1]}"></td><td><input type="text" value="${r[2]}"></td><td><button onclick="removeRow(this)" style="color:#ccc; background:none; border:none; cursor:pointer;"><i class="fas fa-trash-alt"></i></button></td>`;
            tbody.appendChild(tr);
        });
    });
}

function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    const msgEl = document.getElementById('modal-msg');
    const actionsEl = document.getElementById('modal-actions');
    msgEl.innerHTML = message;
    actionsEl.innerHTML = "";

    const createBtn = (text, cls, cb) => {
        const btn = document.createElement("button");
        btn.innerText = text; btn.className = "btn-main"; 
        if(cls) btn.style.background = cls; btn.style.color = "white";
        btn.onclick = () => { closeModal(); if(cb) cb(); };
        return btn;
    };

    if(type === "confirm") {
        actionsEl.appendChild(createBtn("ยกเลิก", "#ccc", null));
        actionsEl.appendChild(createBtn("ยืนยัน", "var(--accent-red)", callback));
    } else {
        actionsEl.appendChild(createBtn("ตกลง", "var(--primary-bg)", null));
    }
    modal.classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

// (ส่วนประวัติและจับเวลาหน้าต่างใหม่ยังคงใช้ตรรกะเดิมของคุณได้เลยครับ)
function clearAllHistory() {
    showModal("ยืนยัน", "ลบประวัติทั้งหมดใช่หรือไม่?", "confirm", () => {
        localStorage.removeItem("historyData");
        historyData = [];
        totalDeletedProfit = 0;
    });
}
