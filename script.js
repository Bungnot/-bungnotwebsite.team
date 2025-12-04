let savedTables = [];
let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
});


// ===== [REAL-TIME LOCAL STORAGE SYNC] =====
window.addEventListener('storage', (event) => {
    // ตรวจสอบว่าคีย์ที่เปลี่ยนคือ 'savedTables' (ข้อมูลตาราง) หรือไม่
    if (event.key === 'savedTables') {
        // โหลดข้อมูลใหม่ทันที
        loadData(); 
        
        // (ทางเลือก) หากต้องการแจ้งเตือนผู้ใช้
        const badge = document.getElementById("auto-save-alert");
        if(badge) {
            badge.innerText = "🔄 ข้อมูลอัปเดตจากหน้าต่างอื่นแล้ว";
            badge.style.opacity = "1"; 
            setTimeout(() => {
                badge.style.opacity = "0";
                badge.innerText = "✅ บันทึกข้อมูลอัตโนมัติแล้ว"; // คืนค่าข้อความเดิม
            }, 3000); 
        }
        console.log("Data loaded from other window's storage event.");
    }
});

// ===== [LINE CONFIG] =====
// ** สำคัญ: กรุณาเปลี่ยนเป็น CHANNEL_ACCESS_TOKEN จริงของคุณ **
const CHANNEL_ACCESS_TOKEN = "JI9s4rEtMYgnaeuz4hCwkQxAfCXU6Wpm+J9GZcJ4HV2Y93Vdxt+odXRrhMhKxPRIt9e2UqmYskLOixXKg2qaqMNAIastgvza7RfaTgiAa+Izo7syjq3VVgDPDybLSxxjnYpFGcd9W/y13tWWSdQhaQdB04t89/1O/w1cDnyilFU=";

const LINE_UID_MAP = {
    // ใส่ชื่อที่ใช้ในตาราง: 'Line User ID'
    // *** กรุณาแก้ไข UID ให้ถูกต้องตามชื่อในไลน์ของสมาชิกเหล่านี้ ***
    "BenZ": "U3e03ef4725e04db4a9729db77bb16b6c",
    "Macus William": "Uf7e207bfdd69d8e41806436fa7a86c14", 
    "Bungnot._": "U255dd67c1fef32fb0eae127149c7cadc", 
    // เพิ่มรายชื่ออื่นๆ
};

async function pushText(toUid, text) {
    const endpoint = "https://api.line.me/v2/bot/message/push";
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
    };

    const body = {
        to: toUid,
        messages: [{
            type: "text",
            text: text
        }]
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log(`LINE message sent successfully to UID: ${toUid}`);
            return true;
        } else {
            console.error(`LINE sending failed for UID: ${toUid}. Error:`, data);
            return false;
        }
    } catch (error) {
        console.error("Network or parsing error during LINE push:", error);
        return false;
    }
}

function sendMessageToLine() {
    const nameRaw = document.getElementById('lineName').value.trim();
    const message = document.getElementById('messageToSend').value.trim();
    const toUid = LINE_UID_MAP[nameRaw];

    if (!toUid || !message) {
        showModal("ข้อผิดพลาด", "กรุณากรอกชื่อในไลน์และข้อความ หรือตรวจสอบว่ามี UID ของชื่อนี้หรือไม่", "alert");
        return;
    }

    pushText(toUid, message).then(success => {
        if (success) {
            showModal("ส่งสำเร็จ", `ส่งข้อความถึง ${nameRaw} สำเร็จแล้ว!`, "success");
            document.getElementById('messageToSend').value = ""; // เคลียร์ข้อความ
        } else {
            showModal("ส่งไม่สำเร็จ", `ไม่สามารถส่งข้อความถึง ${nameRaw} ได้ กรุณาตรวจสอบ Token และชื่อผู้ใช้`, "alert");
        }
    });
}

// ===== [MODAL FUNCTIONS] =====
function showModal(title, msg, type = 'alert') {
    if (currentModalKeyHandler) {
        document.removeEventListener("keydown", currentModalKeyHandler);
    }
    
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-msg');
    const actionsEl = document.getElementById('modal-actions');
    const iconEl = document.getElementById('modal-icon');

    titleEl.innerText = title;
    msgEl.innerHTML = msg; // ใช้อันนี้รองรับ HTML/Markdown
    actionsEl.innerHTML = ""; 
    
    // ตั้งค่า Icon ตาม Type
    if (type === 'success') {
        iconEl.className = "fas fa-check-circle modal-icon icon-success";
    } else if (type === 'error') {
        iconEl.className = "fas fa-times-circle modal-icon icon-error";
    } else {
        iconEl.className = "fas fa-exclamation-circle modal-icon icon-warn";
    }

    const btnOk = document.createElement("button");
    btnOk.className = "btn-modal btn-confirm";
    btnOk.innerText = "ตกลง";
    btnOk.onclick = closeModal;
    actionsEl.appendChild(btnOk);
    
    currentModalKeyHandler = (e) => {
        if (e.key === "Escape" || e.key === "Enter") closeModal();
    };
    
    document.addEventListener("keydown", currentModalKeyHandler);
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('custom-modal');
    modal.classList.remove('active');
    if (currentModalKeyHandler) {
        document.removeEventListener("keydown", currentModalKeyHandler);
        currentModalKeyHandler = null;
    }
}


// ===== [CALCULATE AND LINE SEND LOGIC] =====

/**
 * ฟังก์ชันเปิด Modal สำหรับกรอกชื่อค่ายและเวลาตก เพื่อเริ่มกระบวนการคิดยอด
 * @param {HTMLElement} tableContainer - div.table-container ที่บรรจุตาราง
 */
function showCalculateModal(tableContainer) {
    const tableTitleInput = tableContainer.querySelector(".table-title-input");
    const defaultTitle = tableTitleInput ? tableTitleInput.value : "(ไม่มีชื่อค่าย)";
    
    // ลบการจัดการคีย์บอร์ดเดิมออกก่อน
    if (currentModalKeyHandler) {
        document.removeEventListener("keydown", currentModalKeyHandler);
    }
    
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-msg');
    const actionsEl = document.getElementById('modal-actions');
    const iconEl = document.getElementById('modal-icon');

    titleEl.innerText = "💰 คิดยอดและส่ง LINE";
    iconEl.className = "fas fa-calculator modal-icon icon-warn";
    msgEl.innerHTML = ""; 
    actionsEl.innerHTML = ""; 

    // แสดงข้อความนำ
    const promptText = document.createElement("div");
    promptText.innerHTML = `**ค่าย:** ${defaultTitle}<br>กรุณากรอก <b>เวลาตกบั้งไฟ (วินาที)</b> และ <b>ราคาตั้งต่ำ</b>`;
    msgEl.appendChild(promptText);

    // สร้างช่อง Input สำหรับเวลาตก
    const timeInputField = document.createElement("input");
    timeInputField.type = "number";
    timeInputField.id = "modal-time-input";
    timeInputField.placeholder = "เวลาตก (วินาที, เช่น 275)";
    timeInputField.className = "modal-input";
    msgEl.appendChild(timeInputField);
    
    // สร้างช่อง Input สำหรับราคากลาง (ราคาตั้ง 280-300 ให้กรอก 280)
    const basePriceInputField = document.createElement("input");
    basePriceInputField.type = "number";
    basePriceInputField.id = "modal-base-price-input";
    basePriceInputField.placeholder = "ราคาตั้งต่ำ (วินาที, เช่น 280)";
    basePriceInputField.className = "modal-input";
    msgEl.appendChild(basePriceInputField);

    const btnStart = document.createElement("button");
    btnStart.className = "btn-modal btn-confirm";
    btnStart.innerText = "คิดยอดตอนนี้";
    btnStart.style.background = "#06c755";
    btnStart.style.boxShadow = "0 5px 15px rgba(6, 199, 85, 0.4)";
    btnStart.onclick = () => { 
        const fallTime = parseFloat(timeInputField.value);
        const basePrice = parseFloat(basePriceInputField.value);
        
        if (isNaN(fallTime) || isNaN(basePrice) || fallTime <= 0 || basePrice <= 0) {
            showModal("ข้อผิดพลาด", "กรุณากรอกเวลาตกและราคาตั้งต่ำเป็นตัวเลขที่ถูกต้อง", "alert");
            return;
        }
        
        closeModal(); 
        // หน่วงเวลาเล็กน้อยเพื่อให้ Modal ปิดก่อน
        setTimeout(() => sendLineResults(tableContainer, defaultTitle, fallTime, basePrice), 300);
    };

    const btnNo = document.createElement("button");
    btnNo.className = "btn-modal btn-cancel";
    btnNo.innerText = "ยกเลิก";
    btnNo.onclick = closeModal;

    actionsEl.appendChild(btnNo);
    actionsEl.appendChild(btnStart);
    
    // ตั้งค่าให้ Enter ใช้เพื่อกรอกข้อมูลได้สะดวกขึ้น
    setTimeout(() => { 
        timeInputField.focus(); 
        timeInputField.addEventListener('keydown', (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                basePriceInputField.focus();
            }
        }); 
        basePriceInputField.addEventListener('keydown', (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                btnStart.click();
            }
        }); 
    }, 100);

    currentModalKeyHandler = (e) => {
        if (e.key === "Escape") closeModal();
    };
    
    document.addEventListener("keydown", currentModalKeyHandler);
    modal.classList.add('active');
}

/**
 * ฟังก์ชันคำนวณกำไร/ขาดทุน และส่งผลลัพธ์ไปยัง LINE
 * @param {HTMLElement} tableContainer - div.table-container ที่บรรจุตาราง
 * @param {string} title - ชื่อค่าย
 * @param {number} fallTime - เวลาที่บั้งไฟตก (วินาที)
 * @param {number} basePrice - ราคาตั้งต่ำ (วินาที, เช่น 280)
 */
async function sendLineResults(tableContainer, title, fallTime, basePrice) {
    const rows = tableContainer.querySelectorAll("tbody tr");
    const results = {}; // { "ชื่อผู้เล่น": ยอดสุทธิ }
    
    // 1. วนลูปคำนวณกำไร/ขาดทุน
    rows.forEach(tr => {
        const cells = tr.querySelectorAll("input");
        const nameA = cells[0]?.value.trim(); // ชื่อคนไล่
        const priceRaw = cells[1]?.value.trim(); // ราคาเล่น (เช่น 150, 300, 80/00)
        const nameB = cells[2]?.value.trim(); // ชื่อคนยั้ง

        if (!nameA || !priceRaw || !nameB) return; 

        // ตรวจสอบชื่อผู้เล่น
        const cleanedNameA = nameA.replace("@", "").trim();
        const cleanedNameB = nameB.replace("@", "").trim();
        
        if (!cleanedNameA || !cleanedNameB) return;

        // แปลงราคาเล่น
        let price = 0;
        // พยายามหาตัวเลขในรูปแบบ '150', '300', หรือตัวเลขแรก
        const match = priceRaw.match(/\d+/); 
        if (match) {
            price = parseFloat(match[0]);
        } else {
            // หากไม่สามารถแปลงราคาได้
            return;
        }

        // กฎการชนะ/แพ้
        // ถ้า บั้งไฟตกต่ำกว่าราคาตั้งต่ำ (fallTime < basePrice) -> คนยั้ง (Name B) ชนะ (ได้เงิน), คนไล่ (Name A) แพ้ (เสียเงิน)
        const isBWinner = fallTime < basePrice;
        
        const winnerName = isBWinner ? cleanedNameB : cleanedNameA;
        const loserName = isBWinner ? cleanedNameA : cleanedNameB;

        // คำนวณยอด
        // ผู้ชนะ: ได้เงิน (ราคาเล่น - หัก 10%)
        const winAmount = price * 0.90; // ได้เงิน (หัก 10%)
        // ผู้แพ้: เสียเงินเต็มจำนวน
        const lossAmount = price * -1; // เสียเงินเต็มจำนวน (ติดลบ)

        // อัพเดตผลลัพธ์ของแต่ละคน
        results[winnerName] = (results[winnerName] || 0) + winAmount;
        results[loserName] = (results[loserName] || 0) + lossAmount;
    });

    // 2. วนลูปส่งข้อความ LINE
    let successCount = 0;
    let failedNames = [];
    let linePromises = [];

    for (const name in results) {
        const uid = LINE_UID_MAP[name];
        if (uid) {
            const amount = results[name].toFixed(0); // ปัดเศษเป็นจำนวนเต็ม
            const sign = amount >= 0 ? "+" : "";
            // ตัวอย่าง: เพรชประพัน\n+135
            const message = `${title}\n${sign}${amount}`;
            
            // ใช้ Promise.all เพื่อส่งข้อความทั้งหมดแบบขนานกัน
            linePromises.push(pushText(uid, message).then(success => {
                if (success) {
                    successCount++;
                }
            }));
        } else {
            failedNames.push(name);
        }
    }
    
    // รอให้การส่ง LINE ทั้งหมดเสร็จสิ้น
    await Promise.all(linePromises);

    // 3. แสดงผลลัพธ์
    let summary = `<i class="fas fa-check-circle" style="color:#06c755;"></i> ส่งข้อความ LINE สำเร็จ <b>${successCount}</b> คน`;
    if (failedNames.length > 0) {
        summary += `<br><br><i class="fas fa-exclamation-triangle" style="color:#f39c12;"></i> **ไม่พบ LINE ID:** <br>${failedNames.join(", ")}<br>กรุณาเพิ่มใน <code>LINE_UID_MAP</code> ก่อน`;
        showModal("ส่ง LINE บางส่วนสำเร็จ", summary, "alert");
    } else {
        showModal("ส่ง LINE สำเร็จ", summary, "success");
    }
}


// ===== [DATA/TABLE MANAGEMENT] =====
function saveAllTables() {
    const tableContainers = document.querySelectorAll(".table-container");
    const dataToSave = [];

    tableContainers.forEach((container, index) => {
        const titleInput = container.querySelector(".table-title-input");
        const rows = container.querySelectorAll("tbody tr");
        const rowData = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll("input");
            rowData.push({
                col1: cells[0] ? cells[0].value : "",
                col2: cells[1] ? cells[1].value : "",
                col3: cells[2] ? cells[2].value : ""
            });
        });

        dataToSave.push({
            id: index, // ใช้ index เป็น id ชั่วคราว
            title: titleInput ? titleInput.value : `ตารางที่ ${index + 1}`,
            rows: rowData
        });
    });

    localStorage.setItem("savedTables", JSON.stringify(dataToSave));
    const badge = document.getElementById("auto-save-alert");
    if(badge) {
        badge.innerText = "✅ บันทึกข้อมูลอัตโนมัติแล้ว";
        badge.style.opacity = "1";
        setTimeout(() => { badge.style.opacity = "0"; }, 3000);
    }
    savedTables = dataToSave;
    console.log("Data saved.");
}

function loadData() {
    const saved = localStorage.getItem("savedTables");
    const container = document.getElementById("tables-container");
    container.innerHTML = ""; // Clear existing tables

    if (!saved) return;

    try {
        savedTables = JSON.parse(saved);
    } catch (e) {
        console.error("Error parsing saved tables:", e);
        return;
    }

    savedTables.forEach((table, index) => {
        const newTable = document.createElement("div");
        newTable.className = "table-container";
        newTable.dataset.id = index;
        
        let rowsHtml = table.rows.map(row => `
            <tr>
                <td><input type="text" value="${row.col1}" placeholder="" oninput="saveAllTables()"></td>
                <td><input type="text" value="${row.col2}" placeholder="" oninput="saveAllTables()"></td>
                <td><input type="text" value="${row.col3}" placeholder="" oninput="saveAllTables()"></td>
                <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>
            </tr>
        `).join('');

        // *** ส่วนที่แก้ไข: เพิ่มปุ่มคิดยอดตอนนี้ ***
        newTable.innerHTML = `<button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button><div class="card-header"><input type="text" class="table-title-input" value="${table.title}" placeholder="ใส่ชื่อค่ายที่นี่..." oninput="saveAllTables()"></div><table class="custom-table"><thead><tr><th class="th-green">รายชื่อคนไล่</th><th class="th-orange">ราคาเล่น</th><th class="th-red">รายชื่อคนยั้ง</th><th class="th-purple">จัดการ</th></tr></thead><tbody>${rowsHtml}</tbody></table><button class="btn-add-row" onclick="addRow(this.previousElementSibling)">+ เพิ่มแผลที่เล่น</button><button class="btn-calculate-line" onclick="showCalculateModal(this.parentElement)"><i class="fas fa-calculator"></i> คิดยอดตอนนี้</button>`;
        container.appendChild(newTable);
    });
}

function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.className = "table-container";
    
    // *** ส่วนที่แก้ไข: เพิ่มปุ่มคิดยอดตอนนี้ ***
    newTable.innerHTML = `
        <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <div class="card-header">
            <input type="text" class="table-title-input" placeholder="ใส่ชื่อค่ายที่นี่..." oninput="saveAllTables()">
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
            <tbody>
                <tr>
                    <td><input type="text" placeholder="" oninput="saveAllTables()"></td>
                    <td><input type="text" placeholder="" oninput="saveAllTables()"></td>
                    <td><input type="text" placeholder="" oninput="saveAllTables()"></td>
                    <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>
                </tr>
            </tbody>
        </table>
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)">+ เพิ่มแผลที่เล่น</button>
        <button class="btn-calculate-line" onclick="showCalculateModal(this.parentElement)">
            <i class="fas fa-calculator"></i> คิดยอดตอนนี้
        </button>
    `;
    container.appendChild(newTable);
    saveAllTables();
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" placeholder="" oninput="saveAllTables()"></td>
        <td><input type="text" placeholder="" oninput="saveAllTables()"></td>
        <td><input type="text" placeholder="" oninput="saveAllTables()"></td>
        <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>
    `;
    tbody.appendChild(newRow);
    saveAllTables();
}

function removeRow(button) {
    const row = button.closest("tr");
    const tbody = button.closest("tbody");
    
    // ตรวจสอบว่ามีข้อมูลถูกบันทึกหรือไม่ก่อนลบ
    saveAllTables(); 
    
    row.remove();
    
    // ถ้าไม่มีแถวเหลืออยู่ ให้เพิ่มแถวว่างใหม่ 1 แถว
    if (tbody.children.length === 0) {
        addRow(tbody.closest("table"));
    }
    
    saveAllTables(); 
}


function removeTable(button) {
    const tableContainer = button.closest(".table-container");
    const container = document.getElementById("tables-container");
    
    // ถามยืนยันก่อนลบ
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบตารางนี้? ข้อมูลทั้งหมดจะหายไป")) {
        tableContainer.remove();
        saveAllTables(); // บันทึกสถานะหลังจากลบ
    }
}
