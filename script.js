// main.js

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
    saveData();
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
        <button class="add-row-button" onclick="addRow(this.previousElementSibling)">เพิ่มแผลที่เล่น</button>
    `;
    container.appendChild(newTable);
    saveData();
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
        });
        tableContainer.remove();
        saveData();
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
    saveData();
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

document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        alert("ไม่อนุญาตให้ดูซอร์สโค้ดหน้านี้");
    }
});

// ------------------------------------------
// ✅ ส่วนบันทึกอัตโนมัติด้วย LocalStorage
// ------------------------------------------

const LOCAL_STORAGE_KEY = "admin-calc-data";

// เซฟทุกครั้งที่กรอกข้อมูล
function saveData() {
    const container = document.getElementById("tables-container");
    localStorage.setItem(LOCAL_STORAGE_KEY, container.innerHTML);
}

// โหลดคืนข้อมูล
function restoreData() {
    const container = document.getElementById("tables-container");
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
        container.innerHTML = saved;
        restoreListeners();
    }
}

// ติดตั้ง event ที่หายไปหลังโหลดข้อมูล
function restoreListeners() {
    document.querySelectorAll(".remove-row").forEach(btn => {
        btn.onclick = () => removeRow(btn);
    });

    document.querySelectorAll(".remove-table").forEach(btn => {
        btn.onclick = () => removeTable(btn);
    });

    document.querySelectorAll(".add-row-button").forEach(btn => {
        btn.onclick = () => addRow(btn.previousElementSibling);
    });

    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", saveData);
    });
}

// โหลดตอนเปิดหน้า + ติดตามการเปลี่ยนแปลง DOM เพื่อเซฟอัตโนมัติ
window.addEventListener("DOMContentLoaded", () => {
    restoreData();

    const observer = new MutationObserver(() => {
        document.querySelectorAll("input").forEach(input => {
            if (!input.dataset.listenerAttached) {
                input.addEventListener("input", saveData);
                input.dataset.listenerAttached = "true";
            }
        });
    });

    observer.observe(document.getElementById("tables-container"), {
        childList: true,
        subtree: true
    });
});
