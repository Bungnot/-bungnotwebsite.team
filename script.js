// ================= ฟังก์ชันคำนวณยอด =================
function parseAmount(str) {
  if (!str) return 0;
  const m = String(str).match(/\d{2,}/g);
  if (!m) return 0;
  return parseInt(m[m.length - 1], 10) || 0;
}

function buildSettlementMessages(tableContainer) {
  const low   = parseInt(tableContainer.querySelector('.settle-low')?.value || '', 10);
  const high  = parseInt(tableContainer.querySelector('.settle-high')?.value || '', 10);
  const result= parseInt(tableContainer.querySelector('.settle-result')?.value || '', 10);
  const title = tableContainer.querySelector('.table-title-input')?.value?.trim() || 'ราคาช่าง';

  if (Number.isNaN(low) || Number.isNaN(high) || Number.isNaN(result)) {
    alert('กรุณากรอก ต่ำ–สูง–ผล ให้ครบ');
    return;
  }

  let outcome;
  if (result < low) outcome = 'ต่ำ';
  else if (result > high) outcome = 'สูง';
  else outcome = 'เสมอ';

  const rows = Array.from(tableContainer.querySelectorAll('tbody tr'));
  const messages = [];

  if (outcome === 'เสมอ') {
    messages.push(`ผล ${result} อยู่ในช่วง ${low}-${high} : เสมอ (ไม่คิดยอด)`);
  } else {
    const winnerSide = outcome === 'ต่ำ' ? 'right' : 'left';
    rows.forEach(row => {
      const [left, price, right] = row.querySelectorAll('input');
      const amt = parseAmount(price.value);
      if (!amt) return;
      const win = amt * 0.9, lose = amt;
      if (winnerSide === 'left') {
        if (left.value) messages.push(`( ${title} +${win} ) ส่งให้ ${left.value}`);
        if (right.value) messages.push(`( ${title} -${lose} ) ส่งให้ ${right.value}`);
      } else {
        if (right.value) messages.push(`( ${title} +${win} ) ส่งให้ ${right.value}`);
        if (left.value) messages.push(`( ${title} -${lose} ) ส่งให้ ${left.value}`);
      }
    });
  }

  tableContainer.querySelector('.settle-output').value = messages.join('\n');
  navigator.clipboard.writeText(messages.join('\n'));
  alert('คำนวณสำเร็จ! คัดลอกข้อความให้แล้ว');
}

// ================= ส่วนตารางเครดิต =================
function addRow(table) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" placeholder="@ไลน์คนไล่"></td>
    <td><input type="text" placeholder="ใส่ราคา เช่น 300"></td>
    <td><input type="text" placeholder="@ไลน์คนยั้ง"></td>
    <td><button class="remove-row" onclick="removeRow(this)">X</button></td>
  `;
  table.querySelector("tbody").appendChild(row);
}

function removeRow(btn) {
  btn.closest("tr").remove();
}

function removeTable(btn) {
  btn.closest(".table-container").remove();
  saveData();
}

function addTable() {
  const container = document.getElementById("tables-container");
  const newTable = document.createElement("div");
  newTable.classList.add("table-container");
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

    <div class="settle-box">
      <label>ราคาช่าง:</label>
      <input class="settle-low" type="number" placeholder="ต่ำ (เช่น 285)">
      <span style="justify-self:center">–</span>
      <input class="settle-high" type="number" placeholder="สูง (เช่น 295)">
      <label style="justify-self:end">ผลบั้งไฟ:</label>
      <input class="settle-result" type="number" placeholder="ผล (เช่น 300)">
    </div>
    <div class="settle-actions">
      <button class="settle-btn" onclick="buildSettlementMessages(this.closest('.table-container'))">
        💰 คิดยอดค่ายนี้
      </button>
    </div>
    <textarea class="settle-output" placeholder="ผลลัพธ์จะมาแปะตรงนี้ (คัดลอกอัตโนมัติ)"></textarea>

    <button class="add-row-button"
      onclick="addRow(this.closest('.table-container').querySelector('table'))">
      เพิ่มแผลที่เล่น
    </button>
  `;
  container.appendChild(newTable);
}

// ================= บันทึกข้อมูลไว้ใน localStorage =================
function saveData() {
  const data = [];
  const tables = document.querySelectorAll(".table-container");
  tables.forEach(t => {
    const title = t.querySelector(".table-title-input")?.value || "";
    const rows = [];
    t.querySelectorAll("tbody tr").forEach(r => {
      const c = r.querySelectorAll("input");
      rows.push([c[0]?.value||"", c[1]?.value||"", c[2]?.value||""]);
    });
    data.push({
      title, rows,
      low: t.querySelector('.settle-low')?.value || "",
      high: t.querySelector('.settle-high')?.value || "",
      res: t.querySelector('.settle-result')?.value || ""
    });
  });
  localStorage.setItem("savedTables", JSON.stringify(data));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem("savedTables"));
  if (!data) return;
  const container = document.getElementById("tables-container");
  container.innerHTML = "";
  data.forEach(d => {
    const div = document.createElement("div");
    div.classList.add("table-container");
    let rows = "";
    d.rows.forEach(r=>{
      rows += `<tr>
        <td><input type="text" value="${r[0]||""}"></td>
        <td><input type="text" value="${r[1]||""}"></td>
        <td><input type="text" value="${r[2]||""}"></td>
        <td><button class="remove-row" onclick="removeRow(this)">X</button></td>
      </tr>`;
    });
    div.innerHTML = `
      <button class="remove-table" onclick="removeTable(this)">X</button>
      <input type="text" class="table-title-input" placeholder="ใส่ชื่อค่าย" value="${d.title||""}">
      <table>
        <thead>
          <tr><th>รายชื่อไลน์คนไล่</th><th>ราคาคนเล่นกัน</th><th>รายชื่อไลน์คนยั้ง</th><th>X</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="settle-box">
        <label>ราคาช่าง:</label>
        <input class="settle-low" type="number" placeholder="ต่ำ" value="${d.low||""}">
        <span style="justify-self:center">–</span>
        <input class="settle-high" type="number" placeholder="สูง" value="${d.high||""}">
        <label style="justify-self:end">ผลบั้งไฟ:</label>
        <input class="settle-result" type="number" placeholder="ผล" value="${d.res||""}">
      </div>
      <div class="settle-actions">
        <button class="settle-btn" onclick="buildSettlementMessages(this.closest('.table-container'))">
          💰 คิดยอดค่ายนี้
        </button>
      </div>
      <textarea class="settle-output" placeholder="ผลลัพธ์จะมาแปะตรงนี้ (คัดลอกอัตโนมัติ)"></textarea>
      <button class="add-row-button"
        onclick="addRow(this.closest('.table-container').querySelector('table'))">
        เพิ่มแผลที่เล่น
      </button>
    `;
    container.appendChild(div);
  });
}

window.onload = loadData;
window.onbeforeunload = saveData;
