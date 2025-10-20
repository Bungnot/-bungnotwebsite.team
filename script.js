let historyData = [];
let totalDeletedProfit = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadData(); // โหลดข้อมูลเมื่อหน้าเว็บเปิด
});

// =================== เพิ่มฟังก์ชันคิดยอด ===================
function calculateSettle(tableContainer) {
    try {
        const low = parseFloat(tableContainer.querySelector('.settle-low')?.value || '');
        const high = parseFloat(tableContainer.querySelector('.settle-high')?.value || '');
        const result = parseFloat(tableContainer.querySelector('.settle-result')?.value || '');
        const title = tableContainer.querySelector('.table-title-input')?.value?.trim() || 'ค่ายนี้';

        if (isNaN(low) || isNaN(high) || isNaN(result)) {
            alert("⚠️ กรุณากรอก ราคาช่างต่ำ–สูง และผลบั้งไฟ ให้ครบก่อน");
            return;
        }

        let outcome = '';
        if (result < low) outcome = 'ต่ำ';
        else if (result > high) outcome = 'สูง';
        else outcome = 'เสมอ';

        const rows = tableContainer.querySelectorAll("tbody tr");
        const messages = [];

        if (outcome === 'เสมอ') {
            messages.push(`ผล ${result} อยู่ในช่วง ${low}-${high} → เสมอ (ไม่คิดยอด)`);
        } else {
            const winnerSide = outcome === 'ต่ำ' ? 'right' : 'left';
            rows.forEach(row => {
                const cells = row.querySelectorAll("td input");
                const nameLeft = cells[0]?.value.trim();
                const priceStr = cells[1]?.value.trim();
                const nameRight = cells[2]?.value.trim();

                const price = parseFloat((priceStr.match(/\d{2,}/g) || [])[0]);
                if (isNaN(price)) return;

                const winAmt = price * 0.9;
                const loseAmt = price;

                if (winnerSide === 'left') {
                    if (nameLeft) messages.push(`( ${title} +${winAmt} ) → ${nameLeft}`);
                    if (nameRight) messages.push(`( ${title} -${loseAmt} ) → ${nameRight}`);
                } else {
                    if (nameRight) messages.push(`( ${title} +${winAmt} ) → ${nameRight}`);
                    if (nameLeft) messages.push(`( ${title} -${loseAmt} ) → ${nameLeft}`);
                }
            });
        }

        const output = tableContainer.querySelector('.settle-output');
        output.value = messages.join("\n");
        navigator.clipboard.writeText(output.value);
        alert("✅ คิดยอดสำเร็จ! คัดลอกข้อความให้แล้ว");
    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการคำนวณยอด");
    }
}
// =========================================================


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

function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container");
    newTable.innerHTML = `
        <button class="remove-table" onclick="removeTable(this)">X</button>
        <input type="text" class="table-title-input" placeholder="ใส่ชื่อค่าย">
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
                    <td><input type="text" placeholder="ใส่ชื่อ"></td>
                    <td><input type="text" placeholder=" "></td>
                    <td><input type="text" placeholder="ใส่ชื่อ"></td>
                    <td><button class="remove-row" onclick="removeRow(this)">X</button></td>
                </tr>
            </tbody>
        </table>

        <!-- ✅ เพิ่มส่วนคิดยอดบั้งไฟ -->
        <div style="margin-top:10px; border-top:1px dashed #aaa; padding-top:8px;">
            <label>ราคาช่าง:</label>
            <input type="number" class="settle-low" placeholder="ต่ำ">
            -
            <input type="number" class="settle-high" placeholder="สูง">
            <label style="margin-left:10px;">ผลบั้งไฟ:</label>
            <input type="number" class="settle-result" placeholder="ผล">
            <button style="margin-left:10px; background:#0ea5e9;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;"
                onclick="calculateSettle(this.closest('.table-container'))">💰 คิดยอดค่ายนี้</button>
            <textarea class="settle-output" placeholder="ผลลัพธ์จะมาแสดงตรงนี้..." style="width:100%;margin-top:8px;height:80px;"></textarea>
        </div>

        <button class="add-row-button" onclick="addRow(this.previousElementSibling.previousElementSibling)">เพิ่มแผลที่เล่น</button>
    `;
    container.appendChild(newTable);
}

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
                body {font-family: 'Sarabun', sans-serif; padding: 20px; background-color: #f9f9f9;}
                h2 {color: #e91e63;}
                .total-profit {font-size: 20px; font-weight: bold; color: #4CAF50; margin-bottom: 20px;}
                img {max-width: 100%; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 8px;}
                .entry {margin-bottom: 30px; padding: 10px; border: 1px solid #ddd; background: #fff; border-radius: 10px;}
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
        const title = tableContainer.querySelector(".table-title-input").value;
        const rows = [];
        tableContainer.querySelectorAll("tbody tr").forEach(row => {
            const cells = row.querySelectorAll("input");
            rows.push([
                cells[0]?.value || "",
                cells[1]?.value || "",
                cells[2]?.value || ""
            ]);
        });
        const low = tableContainer.querySelector('.settle-low')?.value || "";
        const high = tableContainer.querySelector('.settle-high')?.value || "";
        const res = tableContainer.querySelector('.settle-result')?.value || "";
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
        table.rows.forEach(row => {
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
            <input type="text" class="table-title-input" placeholder="ใส่ชื่อค่าย" value="${table.title || ""}">
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

            <div style="margin-top:10px; border-top:1px dashed #aaa; padding-top:8px;">
                <label>ราคาช่าง:</label>
                <input type="number" class="settle-low" placeholder="ต่ำ" value="${table.low || ""}">
                -
                <input type="number" class="settle-high" placeholder="สูง" value="${table.high || ""}">
                <label style="margin-left:10px;">ผลบั้งไฟ:</label>
                <input type="number" class="settle-result" placeholder="ผล" value="${table.res || ""}">
                <button style="margin-left:10px; background:#0ea5e9;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;"
                    onclick="calculateSettle(this.closest('.table-container'))">💰 คิดยอดค่ายนี้</button>
                <textarea class="settle-output" placeholder="ผลลัพธ์จะมาแสดงตรงนี้..." style="width:100%;margin-top:8px;height:80px;"></textarea>
            </div>

            <button class="add-row-button" onclick="addRow(this.previousElementSibling.previousElementSibling)">เพิ่มแผลที่เล่น</button>
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

function showAutoSaveAlert() {
    const alertBox = document.getElementById("auto-save-alert");
    alertBox.style.opacity = "1";
    setTimeout(() => {
        alertBox.style.opacity = "0";
    }, 2000);
}

setInterval(() => {
    saveData();
    console.log("ข้อมูลถูกบันทึกอัตโนมัติ");
    showAutoSaveAlert();
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
            messages: [{ type: "text", text: fullMsg }]
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
