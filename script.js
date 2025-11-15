let historyData = [];
let totalDeletedProfit = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadData(); 
});

// ===== [LINE CONFIG] =====
const CHANNEL_ACCESS_TOKEN = "vVfgfuTuxGYIrGci7BVXJ1LufaMVWvkbvByxhEnfmIxd5zAx8Uc/1SsIRAjkeLvSt9e2UqmYskLOixXKg2qaqMNAIastgvza7RfaTgiAa+JC35fvI77zBxA+M7ZbyPbxft0oTc4g5A6dbbwWmid2rgdB04t89/1O/w1cDnyilFU=";

// ===== [Mapping รายชื่อ -> UID] =====
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
    const name = nameRaw.replace("@", "").trim();
    return LINE_UID_MAP[name] || "";
}

// ===== ส่งข้อความไป Flask =====
async function pushText(to, text) {
  console.log("🔹 ส่งข้อความไป Flask...");
  try {
    const res = await fetch("http://102.129.229.219:5000/send_line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, text }),
    });

    const data = await res.json();
    console.log("📤 ส่งผล:", data);

  } catch (err) {
    console.error("❌ Error:", err);
  }
}

// ===== เพิ่มแผล =====
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

// ===== เพิ่มค่ายใหม่ (ลบส่วนคิดยอดออกแล้ว) =====
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
                    <td><input type="text"></td>
                    <td><input type="text"></td>
                    <td><input type="text"></td>
                    <td><button class="remove-row" onclick="removeRow(this)">X</button></td>
                </tr>
            </tbody>
        </table>

        <button class="add-row-button" onclick="addRow(this.previousElementSibling)">เพิ่มแผลที่เล่น</button>
    `;

    container.appendChild(newTable);
}

// ===== ลบตาราง =====
function removeTable(button) {
    const tableContainer = button.parentElement;
    const inputs = tableContainer.querySelectorAll('input');

    let hasInput = Array.from(inputs).some(i => i.value.trim() !== "");
    if (!hasInput) {
        alert("ต้องกรอกข้อมูลก่อนจึงลบได้");
        return;
    }

    // คำนวณกำไรเดิม (ยังคงไว้ให้เหมือนระบบเก่า)
    const priceInputs = tableContainer.querySelectorAll("td:nth-child(2) input");
    let totalProfit = 0;
    priceInputs.forEach(input => {
        const match = input.value.match(/\d{3,}/);
        if (match) totalProfit += (parseFloat(match[0]) * 0.10);
    });

    const ok = confirm(`ลบตารางนี้? กำไร: ฿${totalProfit.toFixed(2)}`);
    if (!ok) return;

    html2canvas(tableContainer).then(canvas => {
        historyData.push({
            imgData: canvas.toDataURL("image/png"),
            profit: totalProfit
        });
        totalDeletedProfit += totalProfit;
    });

    tableContainer.remove();
    saveData();
}

// ===== ลบแถว =====
function removeRow(button) {
    const row = button.parentElement.parentElement;
    const inputs = row.querySelectorAll('input');
    let hasInput = Array.from(inputs).some(i => i.value.trim() !== "");
    if (!hasInput) {
        alert("ต้องกรอกข้อมูลก่อนลบ");
        return;
    }
    row.remove();
    saveData();
}

// ===== ประวัติการลบ =====
function showHistory() {
    if (historyData.length === 0) return alert("ยังไม่มีประวัติ");

    let newWindow = window.open("", "History", "width=800,height=600");

    newWindow.document.write(`
        <html><body>
        <h2>ประวัติการลบตาราง</h2>
        <div><b>กำไรรวม:</b> ฿${totalDeletedProfit.toFixed(2)}</div>
    `);

    historyData.forEach(h => {
        newWindow.document.write(`
            <div>
                <img src="${h.imgData}" style="max-width:100%">
                <p>กำไร: ฿${h.profit.toFixed(2)}</p>
            </div>
        `);
    });

    newWindow.document.write("</body></html>");
    newWindow.document.close();
}

// ===== บันทึก =====
function saveData() {
    const data = [];
    const tables = document.querySelectorAll(".table-container");

    tables.forEach(table => {
        const title = table.querySelector(".table-title-input").value;
        const rows = [];

        table.querySelectorAll("tbody tr").forEach(r => {
            const cells = r.querySelectorAll("input");
            rows.push([
                cells[0]?.value || "",
                cells[1]?.value || "",
                cells[2]?.value || ""
            ]);
        });

        data.push({ title, rows });
    });

    localStorage.setItem("savedTables", JSON.stringify(data));
}

// ===== โหลดข้อมูล (ไม่มีส่วนคิดยอดแล้ว) =====
function loadData() {
    const data = JSON.parse(localStorage.getItem("savedTables"));
    if (!data) return;

    const container = document.getElementById("tables-container");
    container.innerHTML = "";

    data.forEach(table => {
        const newTable = document.createElement("div");
        newTable.classList.add("table-container");

        let rowsHtml = "";
        table.rows.forEach(r => {
            rowsHtml += `
                <tr>
                    <td><input type="text" value="${r[0]}"></td>
                    <td><input type="text" value="${r[1]}"></td>
                    <td><input type="text" value="${r[2]}"></td>
                    <td><button class="remove-row" onclick="removeRow(this)">X</button></td>
                </tr>
            `;
        });

        newTable.innerHTML = `
            <button class="remove-table" onclick="removeTable(this)">X</button>
            <input type="text" class="table-title-input" value="${table.title}">

            <table>
                <thead>
                    <tr>
                        <th> รายชื่อไลน์คนไล่</th>
                        <th>ราคาคนเล่นกัน</th>
                        <th> รายชื่อไลน์คนยั้ง</th>
                        <th>แผลยกเลิก X ได้เลย</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>

            <button class="add-row-button" onclick="addRow(this.previousElementSibling)">เพิ่มแผลที่เล่น</button>
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

// ===== Auto Save =====
setInterval(() => {
    saveData();
    console.log("ข้อมูลถูกบันทึกอัตโนมัติ");
}, 15000);
