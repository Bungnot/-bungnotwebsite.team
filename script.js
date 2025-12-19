let historyData = [];
let totalDeletedProfit = 0;

// โหลดข้อมูลเมื่อเริ่มต้น
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
    }
    updateDashboardStats();
});

function updateDashboardStats() {
    document.getElementById("total-profit-display").innerText = `฿${totalDeletedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById("active-tables-count").innerText = document.querySelectorAll(".table-container").length;
}

function showToast(text) {
    const badge = document.getElementById("auto-save-alert");
    badge.innerText = text;
    badge.style.opacity = "1";
    setTimeout(() => badge.style.opacity = "0", 3000);
}

function addTable() {
    const container = document.getElementById("tables-container");
    const newTable = document.createElement("div");
    newTable.classList.add("table-container", "table-card");

    newTable.innerHTML = `
        <button class="btn-close-table" onclick="removeTable(this)"><i class="fas fa-times"></i></button>
        <input type="text" class="table-title-input" placeholder="ระบุชื่อค่ายบั้งไฟ..." oninput="saveData()">
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
                    <td><input type="text" placeholder="ชื่อคนไล่" oninput="saveData()"></td>
                    <td><input type="text" placeholder="ราคา" oninput="saveData()"></td>
                    <td><input type="text" placeholder="ชื่อคนยั้ง" oninput="saveData()"></td>
                    <td><button class="btn-remove-row-premium" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
                </tr>
            </tbody>
        </table>
        <button class="btn-add-row" onclick="addRow(this.previousElementSibling)">
            <i class="fas fa-plus"></i> เพิ่มแผลเล่น
        </button>
    `;
    container.appendChild(newTable);
    updateDashboardStats();
    saveData();
}

function addRow(table) {
    const tbody = table.querySelector("tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td><input type="text" placeholder="ชื่อคนไล่" oninput="saveData()"></td>
        <td><input type="text" placeholder="ราคา" oninput="saveData()"></td>
        <td><input type="text" placeholder="ชื่อคนยั้ง" oninput="saveData()"></td>
        <td><button class="btn-remove-row-premium" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(row);
    row.querySelector("input").focus();
    saveData();
}

function removeRow(btn) {
    const tbody = btn.closest("tbody");
    if (tbody.querySelectorAll("tr").length > 1) {
        btn.closest("tr").remove();
        saveData();
    } else {
        showModal("แจ้งเตือน", "ต้องมีอย่างน้อย 1 แถว", "alert");
    }
}

function removeTable(btn) {
    const card = btn.closest(".table-card");
    const title = card.querySelector(".table-title-input").value || "ไม่ระบุชื่อ";
    
    let profit = 0;
    card.querySelectorAll("tbody tr").forEach(tr => {
        const val = tr.querySelectorAll("input")[1].value.replace(/[Oo]/g, '0');
        const match = val.match(/\d+/);
        if(match) profit += (parseFloat(match[0]) * 0.10);
    });

    showModal("ยืนยันการลบ", `คุณต้องการลบตาราง <b>${title}</b>?<br>กำไรที่จะบันทึก: <span style="color:green">฿${profit.toFixed(2)}</span>`, "confirm", () => {
        const rows = [];
        card.querySelectorAll("tbody tr").forEach(tr => {
            const ins = tr.querySelectorAll("input");
            rows.push([ins[0].value, ins[1].value, ins[2].value]);
        });
        
        historyData.push({ title, rows, profit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += profit;
        
        card.remove();
        saveData();
        updateDashboardStats();
        showToast("บันทึกข้อมูลเรียบร้อยแล้ว");
    });
}

function saveData() {
    const data = [];
    document.querySelectorAll(".table-card").forEach(card => {
        const title = card.querySelector(".table-title-input").value;
        const rows = [];
        card.querySelectorAll("tbody tr").forEach(tr => {
            const ins = tr.querySelectorAll("input");
            rows.push([ins[0].value, ins[1].value, ins[2].value]);
        });
        data.push({ title, rows });
    });
    localStorage.setItem("savedTables", JSON.stringify(data));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem("savedTables") || "[]");
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(item => {
        addTable();
        const lastCard = container.lastElementChild;
        lastCard.querySelector(".table-title-input").value = item.title;
        const tbody = lastCard.querySelector("tbody");
        tbody.innerHTML = "";
        item.rows.forEach(r => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><input type="text" value="${r[0]}" oninput="saveData()"></td>
                <td><input type="text" value="${r[1]}" oninput="saveData()"></td>
                <td><input type="text" value="${r[2]}" oninput="saveData()"></td>
                <td><button class="btn-remove-row-premium" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
            `;
            tbody.appendChild(row);
        });
    });
}

function showModal(title, message, type = "alert", callback = null) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    const msgEl = document.getElementById('modal-msg');
    msgEl.innerHTML = message;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    if (type === "input") {
        const inp = document.createElement("input");
        inp.className = "modal-input";
        inp.placeholder = "พิมพ์ชื่อที่นี่...";
        msgEl.appendChild(inp);
        const b = document.createElement("button");
        b.innerText = "ตกลง";
        b.className = "btn-confirm";
        b.onclick = () => { if(inp.value) { closeModal(); if(callback) callback(inp.value); } };
        actions.appendChild(b);
    } else if (type === "confirm") {
        const b1 = document.createElement("button");
        b1.innerText = "ยืนยันการลบ";
        b1.className = "btn-confirm";
        b1.style.background = "#e74c3c";
        b1.onclick = () => { closeModal(); if(callback) callback(); };
        const b2 = document.createElement("button");
        b2.innerText = "ยกเลิก";
        b2.className = "btn-cancel";
        b2.onclick = closeModal;
        actions.appendChild(b1);
        actions.appendChild(b2);
    } else {
        const b = document.createElement("button");
        b.innerText = "รับทราบ";
        b.className = "btn-confirm";
        b.onclick = closeModal;
        actions.appendChild(b);
    }
    modal.classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

function clearAllHistory() {
    showModal("ล้างข้อมูลทั้งหมด", "คำเตือน: ข้อมูลและประวัติทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้!", "confirm", () => {
        localStorage.clear();
        location.reload();
    });
}

function openStopwatchWindow() {
    showModal("นาฬิกาจับเวลา", "ระบุชื่อค่ายบั้งไฟ:", "input", (name) => {
        const sw = window.open("", "_blank", "width=450,height=500");
        sw.document.write(`
            <html><head><title>Stopwatch - ${name}</title>
            <style>
                body { background: #1e3c72; color: white; text-align: center; font-family: 'Sarabun', sans-serif; padding-top: 50px; }
                .time { font-size: 5rem; font-weight: bold; margin: 30px 0; font-family: monospace; }
                .btn { padding: 15px 40px; font-size: 1.5rem; border-radius: 50px; border: none; cursor: pointer; font-weight: bold; transition: 0.3s; }
                .start { background: #2ecc71; color: white; }
                .stop { background: #e74c3c; color: white; }
            </style></head>
            <body>
                <h2>${name}</h2>
                <div class="time" id="t">0.000</div>
                <button onclick="s()" id="b" class="btn start">START</button>
                <script>
                    let st=0, ac=0, iv;
                    function s(){
                        const btn = document.getElementById('b');
                        if(!ac){
                            st=Date.now();
                            iv=setInterval(()=>{
                                document.getElementById('t').innerText=((Date.now()-st)/1000).toFixed(3);
                            },10);
                            btn.innerText='STOP'; btn.className='btn stop'; ac=1;
                        }else{
                            clearInterval(iv);
                            btn.innerText='START'; btn.className='btn start'; ac=0;
                        }
                    }
                </script>
            </body></html>
        `);
    });
}
