// script.js

let historyData = [];

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
    saveTables();
}

function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container");
    newTable.innerHTML = `
        <button class="remove-table" onclick="removeTable(this)">X</button>
        <input type="text" class="table-title-input" placeholder="ใส่ชื่อค่าย" oninput="saveTables()">
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
                    <td><input type="text" placeholder="ใส่ชื่อ" oninput="saveTables()"></td>
                    <td><input type="text" placeholder=" " oninput="saveTables()"></td>
                    <td><input type="text" placeholder="ใส่ชื่อ" oninput="saveTables()"></td>
                    <td><button class="remove-row" onclick="removeRow(this)">X</button></td>
                </tr>
            </tbody>
        </table>
        <button class="add-row-button" onclick="addRow(this.previousElementSibling)">เพิ่มแผลที่เล่น</button>
    `;
    container.appendChild(newTable);
    saveTables();
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
            alert("ตารางถูกลบแล้ว! คุณสามารถดูประวัติได้");
            tableContainer.remove();
            saveTables();
        });
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
    saveTables();
}

function showHistory() {
    if (historyData.length === 0) {
        alert("ยังไม่มีประวัติการลบตาราง");
        return;
    }
    let newWindow = window.open("", "History", "width=800,height=600");
    newWindow.document.write("<h2>ประวัติการลบตาราง</h2>");
    historyData.forEach(data => {
        newWindow.document.write(`<img src='${data.imgData}' style='max-width:100%; margin-bottom:10px;'>`);
        newWindow.document.write(`<p>กำไรที่คำนวณได้: ฿${data.profit.toFixed(2)}</p>`);
    });
}

function saveTables() {
    const container = document.getElementById("tables-container");
    const tables = container.querySelectorAll(".table-container");
    const dataToSave = [];

    tables.forEach(table => {
        const title = table.querySelector(".table-title-input").value;
        const rows = [];
        const trList = table.querySelectorAll("tbody tr");

        trList.forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rows.push({
                a: cells[0]?.value || "",
                b: cells[1]?.value || "",
                c: cells[2]?.value || ""
            });
        });

        dataToSave.push({ title, rows });
    });

    localStorage.setItem("tables", JSON.stringify(dataToSave));
}

function loadTables() {
    const saved = localStorage.getItem("tables");
    if (!saved) return;

    const data = JSON.parse(saved);

    data.forEach(item => {
        addTable();
        const latestTable = document.querySelectorAll(".table-container");
        const table = latestTable[latestTable.length - 1];
        table.querySelector(".table-title-input").value = item.title;

        const tbody = table.querySelector("tbody");
        tbody.innerHTML = "";

        item.rows.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><input type="text" value="${row.a}" oninput="saveTables()"></td>
                <td><input type="text" value="${row.b}" oninput="saveTables()"></td>
                <td><input type="text" value="${row.c}" oninput="saveTables()"></td>
                <td><button class="remove-row" onclick="removeRow(this)">X</button></td>
            `;
            tbody.appendChild(tr);
        });
    });
}

document.addEventListener("DOMContentLoaded", loadTables);

document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        alert("ไม่อนุญาตให้ดูซอร์สโค้ดหน้านี้");
    }
});
