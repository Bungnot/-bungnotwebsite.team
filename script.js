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


// ในไฟล์ script (12).js, เพิ่มโค้ดส่วนนี้

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

// ===== [LINE CONFIG - ต้องแก้ไขค่า] =====
// ** สำคัญ: กรุณาเปลี่ยนเป็น CHANNEL_ACCESS_TOKEN จริงของคุณ **
const CHANNEL_ACCESS_TOKEN = "JI9s4rEtMYgnaeuz4hCwkQxAfCXU6Wpm+J9GZcJ4HV2Y93Vdxt+odXRrhMhKxPRIt9e2UqmYskLOixXKg2qaqMNAIastgvza7RfaTgiAa+Izo7syjq3VVgDPDybLSxxjnYpFGcd9W/y13tWWSdQhaQdB04t89/1O/w1cDnyilFU=";

const LINE_UID_MAP = {
    // *** กรุณาแก้ไข UID ให้ถูกต้องตามชื่อในไลน์ของสมาชิกเหล่านี้ ***
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
    "🥰แอดมิน ตัวกลม🚀": "Ufe84b76808464511da99d60b7c7449b8",
    // เพิ่มชื่อผู้เล่นในตารางของคุณที่นี่
    "Macus William": "U_ID_FOR_Macus_William", 
    "กู๋จิ สิบธันวา": "U_ID_FOR_กู๋จิ_สิบธันวา",
};

// ใช้สำหรับฟังก์ชันเดิม (ไม่จำเป็นต้องเปลี่ยน)
function getLineIdFromName(nameRaw) {
    if (!nameRaw) return "";
    const name = nameRaw.replace("@", "").trim();
    return LINE_UID_MAP[name] || "";
}

// ใช้สำหรับฟังก์ชันเดิม (แก้ไขให้รองรับ Token ใหม่)
async function pushText(to, text) {
    const endpoint = "https://api.line.me/v2/bot/message/push";
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
    };

    const body = {
        to: to,
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
            return true;
        } else {
            console.error("LINE sending failed. Error:", data);
            return false;
        }
    } catch (err) { 
        console.error("Network or parsing error during LINE push:", err); 
        return false;
    }
}

// ===== CUSTOM MODAL LOGIC (Keyboard Support) - UPDATED TO SUPPORT INPUT FIELD =====
// ฟังก์ชันเดิมของคุณ ถูกแก้ไขให้รองรับ 'success' type
function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-msg');
    const actionsEl = document.getElementById('modal-actions');
    const iconEl = document.getElementById('modal-icon');

    // ลบการจัดการคีย์บอร์ดเดิมออกก่อน
    if (currentModalKeyHandler) {
        document.removeEventListener("keydown", currentModalKeyHandler);
    }
    
    titleEl.innerText = title;
    msgEl.innerHTML = message; 
    actionsEl.innerHTML = ""; 

    if (type === "input") {
        iconEl.className = "fas fa-user modal-icon icon-warn";
        
        // สร้างช่อง Input สำหรับชื่อค่าย (ถูกแทนที่ด้วย showCalculateModal สำหรับการคิดยอด)
        // แต่ยังเก็บไว้เผื่อใช้ในฟังก์ชัน openStopwatchWindow() เดิม
        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.id = "modal-input-field";
        inputField.placeholder = "ชื่อค่าย";
        inputField.className = "modal-input";
        msgEl.appendChild(inputField);

        const btnStart = document.createElement("button");
        btnStart.className = "btn-modal btn-confirm";
        btnStart.innerText = "เริ่มจับเวลา";
        btnStart.style.background = "#2ecc71";
        btnStart.style.boxShadow = "0 5px 15px rgba(46, 204, 113, 0.4)";
        btnStart.onclick = () => { closeModal(); if (callback) callback(inputField.value); };

        const btnNo = document.createElement("button");
        btnNo.className = "btn-modal btn-cancel";
        btnNo.innerText = "ยกเลิก";
        btnNo.onclick = closeModal;

        actionsEl.appendChild(btnNo);
        actionsEl.appendChild(btnStart);
        
        setTimeout(() => { 
            inputField.focus(); 
            // Enter key submits the input
            inputField.addEventListener('keydown', (e) => {
                if (e.key === "Enter") btnStart.click();
            }); 
        }, 100);

        currentModalKeyHandler = (e) => {
            if (e.key === "Escape") closeModal();
        };

    } else if (type === "confirm") {
        iconEl.className = "fas fa-question-circle modal-icon icon-warn";
        // msgEl.innerText = message; // ใช้ innerHTML แทน

        const btnYes = document.createElement("button");
        btnYes.className = "btn-modal btn-confirm";
        btnYes.innerText = "ยืนยันลบ";
        btnYes.onclick = () => { closeModal(); if (callback) callback(); };

        const btnNo = document.createElement("button");
        btnNo.className = "btn-modal btn-cancel";
        btnNo.innerText = "ยกเลิก";
        btnNo.onclick = closeModal;

        actionsEl.appendChild(btnNo);
        actionsEl.appendChild(btnYes);
        setTimeout(() => btnYes.focus(), 100);

        currentModalKeyHandler = (e) => {
            if (e.key === "Escape") closeModal();
            else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                closeModal(); 
                if (callback) callback();
            }
        };

    } else if (type === "success") { // เพิ่มการแสดงผลสำเร็จ
        iconEl.className = "fas fa-check-circle modal-icon icon-success";
        // msgEl.innerText = message; // ใช้ innerHTML แทน

        const btnOk = document.createElement("button");
        btnOk.className = "btn-modal btn-confirm";
        btnOk.innerText = "ตกลง";
        btnOk.style.background = "#06c755";
        btnOk.style.color = "white";
        btnOk.onclick = closeModal;
        actionsEl.appendChild(btnOk);
        setTimeout(() => btnOk.focus(), 100);

        currentModalKeyHandler = (e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") closeModal();
        };

    } else { // type === "alert"
        iconEl.className = "fas fa-info-circle modal-icon icon-warn";
        // msgEl.innerText = message; // ใช้ innerHTML แทน

        const btnOk = document.createElement("button");
        btnOk.className = "btn-modal btn-cancel";
        btnOk.innerText = "ตกลง";
        btnOk.style.background = "#3498db";
        btnOk.style.color = "white";
        btnOk.onclick = closeModal;
        actionsEl.appendChild(btnOk);
        setTimeout(() => btnOk.focus(), 100);

        currentModalKeyHandler = (e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") closeModal();
        };
    }
    
    document.addEventListener("keydown", currentModalKeyHandler);
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
    if (currentModalKeyHandler) {
        document.removeEventListener("keydown", currentModalKeyHandler);
        currentModalKeyHandler = null;
    }
}

// ===== [ฟังก์ชันคิดยอดใหม่] =====
function showCalculateModal(tableContainer) {
    // โค้ดสำหรับแสดง Modal กรอก ราคาต่ำ/สูง และเวลาตก
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
    
    // สร้างช่อง Input สำหรับราคากลาง (ราคาตั้ง 280-290 ให้กรอก 280)
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

async function sendLineResults(tableContainer, title, fallTime, basePrice) {
    // โค้ดสำหรับคำนวณยอดและส่ง LINE
    const rows = tableContainer.querySelectorAll("tbody tr");
    const results = {}; // { "ชื่อผู้เล่น": ยอดสุทธิ }
    
    // 1. วนลูปคำนวณกำไร/ขาดทุน
    rows.forEach(tr => {
        const cells = tr.querySelectorAll("input");
        const nameA = cells[0]?.value.trim(); // ชื่อคนไล่
        const priceRaw = cells[1]?.value.trim(); // ราคาเล่น (เช่น 150, 300, 80/00)
        const nameB = cells[2]?.value.trim(); // ชื่อคนยั้ง

        if (!nameA || !priceRaw || !nameB) return; 

        const cleanedNameA = nameA.replace("@", "").trim();
        const cleanedNameB = nameB.replace("@", "").trim();
        
        if (!cleanedNameA || !cleanedNameB) return;

        // แปลงราคาเล่น (สมมติว่าถ้าเป็น XX/00 ราคาเต็มคือ YYY)
        let price = 0;
        const priceMatch = priceRaw.match(/\d+/); 
        if (priceMatch) {
            price = parseFloat(priceMatch[0]);
        }
        
        // กฎ: ถ้า บั้งไฟตกต่ำกว่าราคาตั้งต่ำ (fallTime < basePrice) -> คนยั้ง (Name B) ชนะ
        const isBWinner = fallTime < basePrice;
        
        const winnerName = isBWinner ? cleanedNameB : cleanedNameA;
        const loserName = isBWinner ? cleanedNameA : cleanedNameB;

        // คำนวณยอด (หัก 10% จากราคาเล่น)
        const winAmount = price * 0.90; 
        const lossAmount = price * -1; 

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
            // รูปแบบข้อความ: เพรชประพัน\n+135
            const message = `${title}\n${sign}${amount}`;
            
            linePromises.push(pushText(uid, message).then(success => {
                if (success) {
                    successCount++;
                }
            }));
        } else {
            failedNames.push(name);
        }
    }
    
    await Promise.all(linePromises);

    // 3. แสดงผลลัพธ์
    let summary = `ส่งข้อความ LINE สำเร็จ ${successCount} คน`;
    if (failedNames.length > 0) {
        summary += `\n**ไม่พบ LINE ID:** ${failedNames.join(", ")}\nกรุณาเพิ่มใน LINE_UID_MAP ก่อน`;
        showModal("ส่ง LINE บางส่วนสำเร็จ", summary, "alert");
    } else {
        showModal("ส่ง LINE สำเร็จ", summary, "success");
    }
}

// ===== Function หลัก - เดิม =====
function addRow(table) {
    const tbody = table.querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" placeholder="" oninput="saveData()"></td>
        <td><input type="text" placeholder="" oninput="saveData()"></td>
        <td><input type="text" placeholder="" oninput="saveData()"></td>
        <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td>
    `;
    tbody.appendChild(newRow);
    saveData();
}

// ถูกแก้ไขให้มีปุ่มคิดยอด
function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    newTable.innerHTML = `
        <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <div class="card-header">
            <input type="text" class="table-title-input" placeholder="ใส่ชื่อค่ายที่นี่..." oninput="saveData()">
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
                    <td><input type="text" placeholder="" oninput="saveData()"></td>
                    <td><input type="text" placeholder="" oninput="saveData()"></td>
                    <td><input type="text" placeholder="" oninput="saveData()"></td>
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
    newTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
    saveData();
}

function removeTable(button) {
    const tableContainer = button.parentElement;
    const inputs = tableContainer.querySelectorAll('input');
    // ใช้โค้ดเดิมที่ป้องกันการลบหากยังไม่มีข้อมูล
    if (!Array.from(inputs).some(i => i.value.trim() !== "")) {
        showModal("แจ้งเตือน", "ต้องกรอกข้อมูลก่อนจึงลบได้", "alert");
        return;
    }

    const priceInputs = tableContainer.querySelectorAll("td:nth-child(2) input");
    let totalProfit = 0;
    priceInputs.forEach(input => {
        // ใช้ regex เดิมที่อาจผิดพลาดสำหรับราคาเล่น แต่คงไว้ตามโค้ดเดิม
        const match = input.value.match(/\d{3,}/);
        if (match) totalProfit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ยืนยันการลบ", `ต้องการลบตารางนี้ใช่ไหม?\n(กำไร: ฿${totalProfit.toFixed(2)})`, "confirm", () => {
        const title = tableContainer.querySelector('.table-title-input').value;
        const rowsData = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rowsData.push([cells[0]?.value || "", cells[1]?.value || "", cells[2]?.value || ""]);
        });

        historyData.push({
            title: title, rows: rowsData, profit: totalProfit, timestamp: new Date().toLocaleString("th-TH")
        });
        
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += totalProfit;
        
        tableContainer.style.transition = "opacity 0.5s";
        tableContainer.style.opacity = '0';
        setTimeout(() => { tableContainer.remove(); saveData(); }, 500);
    });
}

function removeRow(button) {
    const row = button.parentElement.parentElement;
    if (!Array.from(row.querySelectorAll('input')).some(i => i.value.trim() !== "")) {
        showModal("แจ้งเตือน", "ต้องกรอกข้อมูลก่อนลบ", "alert");
        return;
    }
    row.remove();
    saveData();
}

// ===== ฟังก์ชันล้างประวัติจากหน้าหลัก - เดิม =====
function clearAllHistory() {
    if(historyData.length === 0) {
        showModal("แจ้งเตือน", "ไม่มีประวัติให้ลบ", "alert");
        return;
    }
    
    showModal("ยืนยันการลบ", "คุณต้องการลบประวัติการคำนวณทั้งหมดใช่หรือไม่?\n(ข้อมูลจะหายไปถาวร)", "confirm", () => {
        localStorage.removeItem('historyData');
        historyData = [];
        totalDeletedProfit = 0;
        showModal("สำเร็จ", "ล้างประวัติเรียบร้อยแล้ว", "success"); // แก้ไขเป็น success
    });
}

// ===== แสดงประวัติ (Text Mode) - เดิม =====
function showHistory() {
    if (historyData.length === 0) return showModal("แจ้งเตือน", "ยังไม่มีประวัติ", "alert");
    
    let newWindow = window.open("", "History", "width=1000,height=800");
    
    let content = `
        <html>
        <head>
            <title>ประวัติการลบ (Text Mode)</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Sarabun', sans-serif; padding: 20px; background: #f0f2f5; }
                .table-card { 
                    background: white; border-radius: 20px; padding: 25px; margin-bottom: 30px; 
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1); max-width: 900px; margin-left: auto; margin-right: auto;
                }
                .header-title { font-size: 1.5rem; font-weight: bold; color: #1e3c72; text-align: center; background: #f0f4f8; padding: 10px; border-radius: 10px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: separate; border-spacing: 0; }
                th { padding: 12px; color: white; font-weight: 600; text-align: center; }
                td { padding: 10px; border-bottom: 1px solid #eee; }
                .th-green { background: linear-gradient(45deg, #11998e, #38ef7d); border-radius: 10px 0 0 0; }
                .th-orange { background: linear-gradient(45deg, #f2994a, #f2c94c); }
                .th-red { background: linear-gradient(45deg, #eb3349, #f45c43); border-radius: 0 10px 0 0; }
                input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 8px; text-align: center; background: white; font-family: 'Sarabun'; font-size: 1rem; color: #333; }
                .timestamp { font-size: 0.8rem; color: #888; text-align: right; margin-top: 10px; }
                .profit-tag { font-weight: bold; color: green; float: left; }
                h2 { text-align: center; color: #1e3c72; }
                .summary { text-align: center; font-size: 1.2rem; font-weight: bold; color: green; margin-bottom: 30px; }
            </style>
        </head>
        <body>
            <h2>📜 ประวัติการลบตาราง (ค้นหาได้)</h2>
            <div class="summary">💰 กำไรรวมทั้งหมด: ฿${totalDeletedProfit.toFixed(2)}</div>
    `;

    historyData.forEach((h) => {
        let rowsHtml = "";
        h.rows.forEach(r => {
            rowsHtml += `<tr><td><input type="text" value="${r[0]}" readonly></td><td><input type="text" value="${r[1]}" readonly></td><td><input type="text" value="${r[2]}" readonly></td></tr>`;
        });
        content += `<div class="table-card"><div class="header-title">${h.title || "(ไม่มีชื่อค่าย)"}</div><table><thead><tr><th class="th-green">รายชื่อคนไล่</th><th class="th-orange">ราคาเล่น</th><th class="th-red">รายชื่อคนยั้ง</th></tr></thead><tbody>${rowsHtml}</tbody></table><div class="timestamp"><span class="profit-tag">กำไร: ฿${h.profit.toFixed(2)}</span>ลบเมื่อ: ${h.timestamp}</div></div>`;
    });

    content += "</body></html>";
    newWindow.document.write(content);
    newWindow.document.close();
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

// ถูกแก้ไขให้มีปุ่มคิดยอด
function loadData() {
    const data = JSON.parse(localStorage.getItem("savedTables"));
    if (!data) return;
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(table => {
        const newTable = document.createElement("div");
        newTable.classList.add("table-container", "table-card");
        let rowsHtml = "";
        table.rows.forEach(r => {
            rowsHtml += `<tr><td><input type="text" value="${r[0]}" placeholder="ชื่อคนไล่" oninput="saveData()"></td><td><input type="text" value="${r[1]}" placeholder="ราคา" oninput="saveData()"></td><td><input type="text" value="${r[2]}" placeholder="ชื่อคนยั้ง" oninput="saveData()"></td><td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-times"></i></button></td></tr>`;
        });
        newTable.innerHTML = `<button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button><div class="card-header"><input type="text" class="table-title-input" value="${table.title}" placeholder="ใส่ชื่อค่ายที่นี่..." oninput="saveData()"></div><table class="custom-table"><thead><tr><th class="th-green">รายชื่อคนไล่</th><th class="th-orange">ราคาเล่น</th><th class="th-red">รายชื่อคนยั้ง</th><th class="th-purple">จัดการ</th></tr></thead><tbody>${rowsHtml}</tbody></table><button class="btn-add-row" onclick="addRow(this.previousElementSibling)">+ เพิ่มแผลที่เล่น</button><button class="btn-calculate-line" onclick="showCalculateModal(this.parentElement)"><i class="fas fa-calculator"></i> คิดยอดตอนนี้</button>`;
        container.appendChild(newTable);
    });
}

document.addEventListener("keydown", e => { if (e.ctrlKey && e.key.toLowerCase() === "u") { e.preventDefault(); showModal("เตือน", "ไม่อนุญาตให้ดูซอร์สโค้ด", "alert"); }});
setInterval(() => { saveData(); console.log("Auto saved"); }, 15000);

function sendMessageToLine() {
    const name = document.getElementById('lineName').value.trim();
    const msg = document.getElementById('messageToSend').value.trim();
    if(!name || !msg) return showModal("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบ", "alert");
    
    const uid = LINE_UID_MAP[name]; // ดึง UID จาก MAP
    
    if (uid) {
        pushText(uid, msg).then(success => {
            if (success) {
                showModal("ส่งสำเร็จ", `ส่งข้อความถึง ${name} สำเร็จแล้ว!`, "success");
            } else {
                showModal("ส่งไม่สำเร็จ", `ไม่สามารถส่งข้อความถึง ${name} ได้ กรุณาตรวจสอบ Token และ UID`, "alert");
            }
        });
    } else {
        showModal("ไม่พบผู้ใช้", `ไม่พบรายชื่อ "${name}" ในระบบ LINE_UID_MAP`, "alert");
    }
}


// ===== [ANALOG STOPWATCH LOGIC] - เดิม =====

function openStopwatchWindow() {
    // ใช้ showModal เพื่อให้ผู้ใช้กรอกชื่อ
    showModal("เริ่มจับเวลา", "กรุณากรอกชื่อสำหรับรอบการจับเวลานี้:", "input", (name) => {
        if (name && name.trim() !== "") {
            createStopwatchWindow(name.trim());
        } else {
            // หากผู้ใช้ไม่ได้กรอกชื่อ ให้แจ้งเตือนและเรียก Modal ป้อนค่าขึ้นมาใหม่
            showModal("ข้อผิดพลาด", "กรุณากรอกชื่อก่อนเริ่มจับเวลา", "alert");
        }
    });
}

function createStopwatchWindow(name) {
    let newWindow = window.open("", "Stopwatch", "width=400,height=650");
    
    // สร้างโค้ด JavaScript ที่สมบูรณ์แบบสำหรับ New Window
    const newWindowScript = `
        let startTime = 0;
        let elapsed = 0;
        let timerInterval = null;

        const updateClock = () => {
            elapsed = Date.now() - startTime;
            
            // --- การคำนวณและการแสดงผลวินาทีเท่านั้น ---
            const totalSeconds = elapsed / 1000;
            const currentSecondOnClock = totalSeconds % 60; // เข็มยังคงวนที่ 60s
            const secondDegrees = currentSecondOnClock * 6; 

            document.getElementById('sec-hand').style.transform = \`rotate(\${secondDegrees}deg)\`;
            
            // แสดงผลเฉพาะ SECONDS และ MILLISECONDS: SS.ms
            const ms = String(elapsed % 1000).padStart(3, '0');
            const secs = String(Math.floor(elapsed / 1000)).padStart(2, '0');
            
            // แสดงผลเป็น SS.ms (ตัดนาทีออก)
            document.getElementById('digital-display').innerText = \`\${secs}.\${ms}\`;
        };

        const startTimer = () => {
            if (timerInterval) return;
            startTime = Date.now() - elapsed; 
            
            timerInterval = setInterval(updateClock, 10);
            document.getElementById('start-btn').disabled = true;
            document.getElementById('pause-btn').disabled = false;
            document.getElementById('reset-btn').disabled = false;
        };

        const pauseTimer = () => {
            clearInterval(timerInterval);
            timerInterval = null;
            document.getElementById('start-btn').disabled = false;
            document.getElementById('pause-btn').disabled = true;
        };

        const resetTimer = () => {
            pauseTimer();
            elapsed = 0;
            document.getElementById('sec-hand').style.transform = \`rotate(0deg)\`;
            // แก้ไขการแสดงผลเริ่มต้นเป็น 00.000
            document.getElementById('digital-display').innerText = \`00.000\`; 
            document.getElementById('start-btn').disabled = false;
            document.getElementById('reset-btn').disabled = true;
        };

        // กำหนด Event Listeners
        document.getElementById('start-btn').onclick = startTimer;
        document.getElementById('pause-btn').onclick = pauseTimer;
        document.getElementById('reset-btn').onclick = resetTimer;

        // จัดการเมื่อปิดหน้าต่าง
        window.onbeforeunload = function() {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };

        // Keyboard shortcuts (Space to Start/Pause, R to Reset)
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') { 
                e.preventDefault(); 
                if (timerInterval) { 
                    pauseTimer(); 
                } else { 
                    startTimer(); 
                } 
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                resetTimer();
            }
        });
    `;

    // สร้างเนื้อหา HTML สำหรับหน้าต่างนาฬิกาจับเวลา
    let content = `
        <html>
        <head>
            <title>นาฬิกาจับเวลา: ${name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { 
                    font-family: 'Sarabun', sans-serif; 
                    display: flex; flex-direction: column; align-items: center; 
                    justify-content: flex-start; padding: 20px; margin: 0;
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    color: white;
                }
                .name-display { font-size: 1.1rem; margin-bottom: 20px; font-weight: 600; color: #f2c94c; }
                .digital-display { 
                    font-family: monospace; font-size: 2.5rem; margin-bottom: 30px; 
                    background: rgba(0,0,0,0.3); padding: 10px 20px; border-radius: 10px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }
                
                /* Analog Clock Styling */
                .clock {
                    width: 250px; height: 250px; border: 15px solid #fff; border-radius: 50%;
                    position: relative; margin-bottom: 40px; background: #333;
                    box-shadow: 0 0 0 4px #000, inset 0 0 0 3px #e74c3c;
                }
                .center-dot {
                    width: 15px; height: 15px; background: #e74c3c; border-radius: 50%;
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    z-index: 10;
                }
                .hand {
                    position: absolute; left: 50%; bottom: 50%;
                    transform-origin: bottom; 
                    transition: transform 0.1s linear;
                }
                #sec-hand {
                    width: 4px; height: 110px; background: #e74c3c;
                    border-radius: 2px; transform: rotate(0deg); 
                    margin-left: -2px; 
                }
                
                /* Clock Marks */
                .mark { position: absolute; width: 100%; height: 100%; }
                .mark:before {
                    content: ''; position: absolute; top: 0; left: 50%;
                    transform: translateX(-50%); width: 2px; height: 10px;
                    background: rgba(255, 255, 255, 0.7);
                }
                ${Array.from({length: 12}, (_, i) => `.mark:nth-child(${i * 5 + 1}):before { height: 15px; background: white; width: 3px; }`).join('')}

                .actions { display: flex; gap: 15px; }
                .btn-sw { 
                    padding: 10px 20px; border: none; border-radius: 30px; font-weight: 600;
                    cursor: pointer; transition: 0.2s; font-size: 1rem;
                }
                #start-btn { background: #2ecc71; color: white; }
                #start-btn:hover:not(:disabled) { background: #27ae60; transform: translateY(-2px); }
                #pause-btn { background: #f39c12; color: white; }
                #pause-btn:hover:not(:disabled) { background: #e67e22; transform: translateY(-2px); }
                #reset-btn { background: #e74c3c; color: white; }
                #reset-btn:hover:not(:disabled) { background: #c0392b; transform: translateY(-2px); }
                .btn-sw:disabled { opacity: 0.5; cursor: not-allowed; }
            </style>
        </head>
        <body>
            <div class="name-display"><i class="fas fa-user"></i> ค่าย: **${name}**</div>
            <div id="digital-display" class="digital-display">00.000</div> 
            
            <div class="clock">
                <div id="sec-hand" class="hand"></div>
                <div class="center-dot"></div>
                ${Array.from({length: 60}, (_, i) => `<div class="mark" style="transform: rotate(${i * 6}deg);"></div>`).join('')}
            </div>

            <div class="actions">
                <button id="start-btn" class="btn-sw"><i class="fas fa-play"></i> เริ่ม</button>
                <button id="pause-btn" class="btn-sw" disabled><i class="fas fa-pause"></i> หยุด</button>
                <button id="reset-btn" class="btn-sw" disabled><i class="fas fa-sync-alt"></i> รีเซ็ต</button>
            </div>

            <script>
                ${newWindowScript}
            </script>
        </body>
        </html>
    `;

    newWindow.document.write(content);
    newWindow.document.close();
    newWindow.focus();
}
