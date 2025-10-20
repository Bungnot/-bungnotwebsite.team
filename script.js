let historyData = [];
let totalDeletedProfit = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadData(); // โหลดข้อมูลเมื่อหน้าเว็บเปิด
});

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" placeholder=" "></td>
        <td><input type="text" placeholder=" "></td>
        <td><input type="text" placeholder=" "></td>
        <td><button class="remove-row" onclick="removeRow(this)">X</button></td>
    `;
    tbody.appendChild(newRow);
}

newTable.innerHTML = `
    <button class="remove-table" onclick="removeTable(this)">X</button>
    <input type="text" class="table-title-input" placeholder="ใส่ชื่อค่าย (เช่น ธนภัทร)">
    <table>
        <thead>
            <tr>
                <th> รายชื่อไลน์คนไล่</th>
                <th>ราคาคนเล่นกัน</th>
                <th> รายชื่อไลน์คนยั้ง</th>
                <th>แผลยกเลิก X ได้เลย</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><input type="text" placeholder="@ไลน์คนไล่"></td>
                <td><input type="text" placeholder="ใส่ราคา เช่น 300"></td>
                <td><input type="text" placeholder="@ไลน์คนยั้ง"></td>
                <td><button class="remove-row" onclick="removeRow(this)">X</button></td>
            </tr>
        </tbody>
    </table>

    <!-- กล่องกำหนดช่วงราคาช่าง + ผล -->
    <div class="settle-box">
        <label>ราคาช่าง:</label>
        <input class="settle-low" type="number" placeholder="ต่ำ (เช่น 285)">
        <span style="justify-self:center">–</span>
        <input class="settle-high" type="number" placeholder="สูง (เช่น 295)">
        <label style="justify-self:end">ผลบั้งไฟ:</label>
        <input class="settle-result" type="number" placeholder="ผล (เช่น 300)">
    </div>
    <div class="settle-actions">
        <button class="settle-btn" onclick="settleTable(this)">กดปุ่มเพื่อคิดยอด สำหรับค่ายนี้</button>
    </div>
    <textarea class="settle-output" placeholder="ผลลัพธ์จะมาแปะตรงนี้ (คัดลอกอัตโนมัติ)"></textarea>

    <!-- ปุ่มเพิ่มแผล (ผูกกับตารางของตัวเอง) -->
    <button class="add-row-button"
        onclick="addRow(this.closest('.table-container').querySelector('table'))">
        เพิ่มแผลที่เล่น
    </button>
`;


function removeTable(button) {
    const tableContainer = button.parentElement;
    const inputs = tableContainer.querySelectorAll('input');

    let hasInput = Array.from(inputs).some(input => input.value.trim() !== "");
    if (!hasInput) {
        alert("ต้องกรอกข้อมูลในช่องก่อนถึงจะสามารถ X ได้");
        return;
    }

    const priceInputs = tableContainer.querySelectorAll("td:nth-child(2) input");
    let totalProfit = 0;
    priceInputs.forEach(input => {
        const priceStr = input.value.match(/\d{3,}/g);
        if (priceStr) {
            const price = parseFloat(priceStr[0]);
            const profit = price * 0.10;
            totalProfit += profit;
        }
    });

    const confirmDelete = confirm(`คุณต้องการลบตารางนี้จริงหรือ? กำไรที่คำนวณได้คือ: ฿${totalProfit.toFixed(2)}`);
    if (confirmDelete) {
        html2canvas(tableContainer).then(canvas => {
            const imgData = canvas.toDataURL("image/png");
            historyData.push({ imgData, profit: totalProfit });
            totalDeletedProfit += totalProfit;
            alert("ตารางถูกลบแล้ว! คุณสามารถดูประวัติได้");
        });
        tableContainer.remove();
        saveData(); // บันทึกหลังลบ
    }
}

function removeRow(button) {
    const row = button.parentElement.parentElement;
    const inputs = row.querySelectorAll('input');

    let hasInput = Array.from(inputs).some(input => input.value.trim() !== "");
    if (!hasInput) {
        alert("ต้องกรอกข้อมูลในช่องก่อนถึงจะสามารถ X ได้");
        return;
    }

    row.remove();
    saveData(); // บันทึกหลังลบแถว
}

function showHistory() {
    if (historyData.length === 0) {
        alert("ยังไม่มีประวัติการลบตาราง");
        return;
    }

    let newWindow = window.open("", "History", "width=800,height=600");
    newWindow.document.write(`
        <html>
        <head>
            <title>ประวัติการลบตาราง</title>
            <style>
                body {
                    font-family: 'Sarabun', sans-serif;
                    padding: 20px;
                    background-color: #f9f9f9;
                }
                h2 {
                    color: #e91e63;
                    margin-bottom: 10px;
                }
                .total-profit {
                    font-size: 20px;
                    font-weight: bold;
                    color: #4CAF50;
                    margin-bottom: 20px;
                }
                img {
                    max-width: 100%;
                    margin-bottom: 10px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                }
                .entry {
                    margin-bottom: 30px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    background: #fff;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <h2>ประวัติการลบตาราง</h2>
            <div class="total-profit">กำไรรวมทั้งหมด: ฿${totalDeletedProfit.toFixed(2)}</div>
    `);

    historyData.forEach(data => {
        newWindow.document.write(`
            <div class="entry">
                <img src='${data.imgData}'>
                <p>กำไรที่คำนวณได้: ฿${data.profit.toFixed(2)}</p>
            </div>
        `);
    });

    newWindow.document.write(`</body></html>`);
    newWindow.document.close();
}



function saveData() {
    const data = [];
    const tables = document.querySelectorAll(".table-container");

    tables.forEach(tableContainer => {
        const title = tableContainer.querySelector(".table-title-input")?.value || "";
        const rows = [];
        tableContainer.querySelectorAll("tbody tr").forEach(row => {
            const cells = row.querySelectorAll("input");
            rows.push([
                cells[0]?.value || "",
                cells[1]?.value || "",
                cells[2]?.value || ""
            ]);
        });

        // เก็บค่าช่วงและผล
        const low  = tableContainer.querySelector('.settle-low')?.value || "";
        const high = tableContainer.querySelector('.settle-high')?.value || "";
        const res  = tableContainer.querySelector('.settle-result')?.value || "";

        data.push({ title, rows, low, high, res });
    });

    localStorage.setItem("savedTables", JSON.stringify(data));
}



function loadData() {
    const data = JSON.parse(localStorage.getItem("savedTables"));
    if (!data) return;

    const container = document.getElementById("tables-container");
    container.innerHTML = "";

    data.forEach(table => {
        const newTable = document.createElement("div");
        newTable.classList.add("table-container");

        let rowsHtml = "";
        (table.rows || []).forEach(row => {
            rowsHtml += `
                <tr>
                    <td><input type="text" value="${row[0] || ""}"></td>
                    <td><input type="text" value="${row[1] || ""}"></td>
                    <td><input type="text" value="${row[2] || ""}"></td>
                    <td><button class="remove-row" onclick="removeRow(this)">X</button></td>
                </tr>
            `;
        });

        newTable.innerHTML = `
            <button class="remove-table" onclick="removeTable(this)">X</button>
            <input type="text" class="table-title-input" placeholder="ใส่ชื่อค่าย (เช่น ธนภัทร)" value="${table.title || ""}">
            <table>
                <thead>
                    <tr>
                        <th> รายชื่อไลน์คนไล่</th>
                        <th>ราคาคนเล่นกัน</th>
                        <th> รายชื่อไลน์คนยั้ง</th>
                        <th>แผลยกเลิก X ได้เลย</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="settle-box">
                <label>ราคาช่าง:</label>
                <input class="settle-low" type="number" placeholder="ต่ำ"  value="${table.low  || ""}">
                <span style="justify-self:center">–</span>
                <input class="settle-high" type="number" placeholder="สูง" value="${table.high || ""}">
                <label style="justify-self:end">ผลบั้งไฟ:</label>
                <input class="settle-result" type="number" placeholder="ผล" value="${table.res || ""}">
            </div>
            <div class="settle-actions">
                <button class="settle-btn" onclick="settleTable(this)">กดปุ่มเพื่อคิดยอด สำหรับค่ายนี้</button>
            </div>
            <textarea class="settle-output" placeholder="ผลลัพธ์จะมาแปะตรงนี้ (คัดลอกอัตโนมัติ)"></textarea>

            <button class="add-row-button"
                onclick="addRow(this.closest('.table-container').querySelector('table'))">
                เพิ่มแผลที่เล่น
            </button>
        `;
        container.appendChild(newTable);
    });
}


document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        alert("ไม่อนุญาตให้ดูซอร์สโค้ดหน้านี้");
    }
});

// ========== ฟังก์ชันช่วยคิดยอด ==========
function parseAmount(str) {
    if (!str) return 0;
    const m = String(str).match(/\d{2,}/g); // ดึงตัวเลขท้ายสุด เช่น "ชล 300" => 300
    if (!m) return 0;
    return parseInt(m[m.length - 1], 10) || 0;
}

function thaiInt(n){ return Math.round(n).toString(); }

function buildSettlementMessages(tableContainer) {
    const low   = parseInt(tableContainer.querySelector('.settle-low')?.value || '', 10);
    const high  = parseInt(tableContainer.querySelector('.settle-high')?.value || '', 10);
    const result= parseInt(tableContainer.querySelector('.settle-result')?.value || '', 10);
    const title = tableContainer.querySelector('.table-title-input')?.value?.trim() || 'ราคาช่าง';

    if (Number.isNaN(low) || Number.isNaN(high) || Number.isNaN(result)) {
        throw new Error('กรุณากรอก "ต่ำ–สูง–ผลบั้งไฟ" ให้ครบเป็นตัวเลข');
    }
    if (low > high) throw new Error('ค่าต่ำ มากกว่าค่าสูง กรุณาตรวจสอบ');

    let outcome;
    if (result < low) outcome = 'ต่ำ';
    else if (result > high) outcome = 'สูง';
    else outcome = 'เสมอ';

    const rows = Array.from(tableContainer.querySelectorAll('tbody tr'));
    const messages = [];

    if (outcome === 'เสมอ') {
        messages.push({ name: '(ระบบ)', text: `ผล ${result} อยู่ในช่วง ${low}-${high} : เสมอ (ไม่ต้องคิดยอด)` });
        return { messages, outcome };
    }

    // 'ไล่' = คอลัมน์ซ้าย, 'ยั้ง' = คอลัมน์ขวา
    const winnerSide = (outcome === 'ต่ำ') ? 'right' : 'left';

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const nameLeft  = cells[0]?.querySelector('input')?.value?.trim();
        const priceStr  = cells[1]?.querySelector('input')?.value?.trim();
        const nameRight = cells[2]?.querySelector('input')?.value?.trim();

        const amt = parseAmount(priceStr);
        if (!amt) return;

        const winAmt  = amt * 0.9; // หัก 10% ให้ผู้ชนะ
        const loseAmt = amt;       // ผู้แพ้เสียเต็ม

        if (winnerSide === 'left') {
            if (nameLeft)  messages.push({ name: nameLeft,  text: `( ${title} +${thaiInt(winAmt)} )` });
            if (nameRight) messages.push({ name: nameRight, text: `( ${title} -${thaiInt(loseAmt)} )` });
        } else {
            if (nameRight) messages.push({ name: nameRight, text: `( ${title} +${thaiInt(winAmt)} )` });
            if (nameLeft)  messages.push({ name: nameLeft,  text: `( ${title} -${thaiInt(loseAmt)} )` });
        }
    });

    return { messages, outcome };
}

function settleTable(btn) {
    const tableContainer = btn.closest('.table-container');
    try {
        const { messages, outcome } = buildSettlementMessages(tableContainer);
        const out = tableContainer.querySelector('.settle-output');
        out.value =
            `ผลค่ายนี้: ${outcome}\n` +
            messages.map(m => `${m.name}  ${m.text}`).join('\n');

        navigator.clipboard.writeText(out.value).catch(()=>{});
        alert('คำนวณสำเร็จ! คัดลอกข้อความแล้ว วางในห้องแชทได้เลย');

        // ถ้าจะส่งผ่าน LINE OA อัตโนมัติ ให้ทำ mapping displayName -> userId แล้วเรียกฟังก์ชันด้านล่างนี้
        // messages.forEach(m => sendMessageToLineByName(m.name, m.text));
    } catch (e) {
        alert(e.message);
    }
}

// (ออปชัน) ตัวอย่างโครงส่งข้อความด้วย Line Messaging API (ต้องมี userId)
function sendMessageToLineByName(displayName, text) {
    const MAP = { /* "@ชื่อในไลน์": "Uxxxxxxxxxxxx" */ };
    const userId = MAP[displayName];
    if (!userId) return;

    fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer [ใส่ Channel Access Token]"
        },
        body: JSON.stringify({ to: userId, messages: [{ type: "text", text }] })
    }).catch(()=>{});
}



function showAutoSaveAlert() {
    const alertBox = document.getElementById("auto-save-alert");
    alertBox.style.opacity = "1";
    setTimeout(() => {
        alertBox.style.opacity = "0";
    }, 2000); // แสดง 2 วินาที
}


setInterval(() => {
    saveData();
    console.log("ข้อมูลถูกบันทึกอัตโนมัติ");
    showAutoSaveAlert(); // เรียกแสดงกล่องแจ้งเตือน
}, 15000);



function sendMessageToLine() {
    const name = document.getElementById("lineName").value;
    const msg = document.getElementById("messageToSend").value;

    const fullMsg = `ชื่อผู้ส่ง: ${name}\nข้อความ: ${msg}`;

    fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer [ใส่ Channel Access Token ของคุณที่นี่]"
        },
        body: JSON.stringify({
            to: "[User ID ของผู้รับข้อความ (หรือ Group ID)]",
            messages: [
                {
                    type: "text",
                    text: fullMsg
                }
            ]
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("ส่งสำเร็จ", data);
        alert("ส่งข้อความสำเร็จแล้ว!");
    })
    .catch(err => {
        console.error("ส่งไม่สำเร็จ", err);
        alert("เกิดข้อผิดพลาดในการส่งข้อความ");
    });
}



