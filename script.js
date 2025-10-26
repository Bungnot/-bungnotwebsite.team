let historyData = [];
let totalDeletedProfit = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadData(); // โหลดข้อมูลเมื่อหน้าเว็บเปิด
});

// ===== [LINE CONFIG] =====
const CHANNEL_ACCESS_TOKEN = "vVfgfuTuxGYIrGci7BVXJ1LufaMVWvkbvByxhEnfmIxd5zAx8Uc/1SsIRAjkeLvSt9e2UqmYskLOixXKg2qaqMNAIastgvza7RfaTgiAa+JC35fvI77zBxA+M7ZbyPbxft0oTc4g5A6dbbwWmid2rgdB04t89/1O/w1cDnyilFU=";

// ===== [Mapping รายชื่อ -> UID จริง] =====
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

// ===== [ฟังก์ชันหา UID จากชื่อ] =====
function getLineIdFromName(nameRaw) {
    if (!nameRaw) return "";
    const name = nameRaw.replace("@", "").trim();
    return LINE_UID_MAP[name] || "";
}

// ===== [ฟังก์ชันส่งข้อความ LINE] =====
async function pushText(to, text) {
  try {
    const res = await fetch("http://102.129.229.219:5000/send_line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, text })
    });
    const data = await res.json();
    console.log("📤 ส่งผล:", data);
    if (!res.ok) throw new Error(data.error || "ไม่สามารถส่งข้อความได้");
    return data;
  } catch (err) {
    console.error("❌ ส่ง LINE ไม่สำเร็จ:", err);
    alert("❌ ส่ง LINE ไม่สำเร็จ: " + err.message);
  }
}


// ===== [ส่งแบบหลายคนตามผลคำนวณ] =====
async function sendBulkLine(winList, loseList, autoSend) {
    if (!autoSend) return;
    if (!CHANNEL_ACCESS_TOKEN) {
        alert("⚠️ ยังไม่ได้ตั้งค่า Channel Access Token");
        return;
    }
    const items = [...winList, ...loseList].filter(x => !!x.lineId);
    if (items.length === 0) {
        alert("ไม่มี LINE ID ที่ตรงกับรายชื่อ");
        return;
    }

    for (const it of items) {
        const text = `${it.name} ${it.type === "win" ? "+" : "-"}${Math.round(it.amount)} ค่าย ${it.title}`;
        try {
            await pushText(it.lineId, text);
            console.log("✅ ส่งแล้ว:", it.name, text);
            await new Promise(r => setTimeout(r, 300));
        } catch (e) {
            console.error("❌ ส่งไม่สำเร็จ:", it.name, e);
        }
    }
    alert("✅ ส่งข้อความครบแล้ว!");
}

// ===== [ฟังก์ชันคำนวณยอดและส่งอัตโนมัติ] =====
function calculateSettle(tableContainer) {
    try {
        const low = parseFloat(tableContainer.querySelector('.settle-low')?.value || '');
        const high = parseFloat(tableContainer.querySelector('.settle-high')?.value || '');
        const result = parseFloat(tableContainer.querySelector('.settle-result')?.value || '');
        const title = tableContainer.querySelector('.table-title-input')?.value?.trim() || 'ค่ายนี้';
        const autoSend = !!tableContainer.querySelector('.settle-autosend')?.checked;

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
        const winList = [];
        const loseList = [];

        if (outcome === 'เสมอ') {
            messages.push(`ผล ${result} อยู่ในช่วง ${low}-${high} → เสมอ (ไม่คิดยอด)`);
        } else {
            const winnerSide = outcome === 'ต่ำ' ? 'right' : 'left';
            rows.forEach(row => {
                const cells = row.querySelectorAll("td input");
                const nameLeft = (cells[0]?.value || '').trim();
                const priceStr = (cells[1]?.value || '').trim();
                const nameRight = (cells[2]?.value || '').trim();

                const match = priceStr.match(/\d{2,}/g);
                const price = match ? parseFloat(match[0]) : NaN;
                if (isNaN(price)) return;

                const winAmt = price * 0.9;
                const loseAmt = price;

                if (winnerSide === 'left') {
                    if (nameLeft) {
                        winList.push({ type: "win", title, name: nameLeft, lineId: getLineIdFromName(nameLeft), amount: winAmt });
                        messages.push(`( ${title} +${winAmt} ) → ${nameLeft}`);
                    }
                    if (nameRight) {
                        loseList.push({ type: "lose", title, name: nameRight, lineId: getLineIdFromName(nameRight), amount: loseAmt });
                        messages.push(`( ${title} -${loseAmt} ) → ${nameRight}`);
                    }
                } else {
                    if (nameRight) {
                        winList.push({ type: "win", title, name: nameRight, lineId: getLineIdFromName(nameRight), amount: winAmt });
                        messages.push(`( ${title} +${winAmt} ) → ${nameRight}`);
                    }
                    if (nameLeft) {
                        loseList.push({ type: "lose", title, name: nameLeft, lineId: getLineIdFromName(nameLeft), amount: loseAmt });
                        messages.push(`( ${title} -${loseAmt} ) → ${nameLeft}`);
                    }
                }
            });
        }

        const output = tableContainer.querySelector('.settle-output');
        if (output) output.value = messages.join("\n");
        try { navigator.clipboard.writeText(messages.join("\n")); } catch (e) {}

        sendBulkLine(winList, loseList, autoSend);
        alert("✅ คิดยอดสำเร็จ และส่งข้อความแล้ว!");
    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการคำนวณยอด");
    }
}

// ===== ส่วนอื่นของเว็บ (เพิ่มแผล, ลบแผล, auto save ฯลฯ) =====
// ... (คงไว้ตามเดิมของคุณ ไม่ต้องแก้)


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
            <label style="margin-left:10px; user-select:none;"><input type="checkbox" class="settle-autosend"> ส่ง LINE อัตโนมัติ</label>
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
            "Authorization": "Bearer vVfgfuTuxGYIrGci7BVXJ1LufaMVWvkbvByxhEnfmIxd5zAx8Uc/1SsIRAjkeLvSt9e2UqmYskLOixXKg2qaqMNAIastgvza7RfaTgiAa+JC35fvI77zBxA+M7ZbyPbxft0oTc4g5A6dbbwWmid2rgdB04t89/1O/w1cDnyilFU="
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
