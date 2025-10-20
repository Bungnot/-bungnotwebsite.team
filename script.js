let historyData = [];
let totalDeletedProfit = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadData(); // โหลดข้อมูลเมื่อหน้าเว็บเปิด
    learnFromURL();
});

// ===== [ADD] LINE Auto-Send Config & Contact Book =====
const CHANNEL_ACCESS_TOKEN = "fmjqWDCs2Z1zL5z4o3+SNRTsSDMlYRUzgETICw6LZrCR36SanGMBWiy3v6Xl4aP9jk8TTD6p+zZtezzEkNLZgXEvffePBNtfFB2g8vjYzD6ba+vm3xt8l33d9Rn0ennRiUykVEUOqp27mbrTPfxuVQdB04t89/1O/w1cDnyilFU="; // TODO: ย้ายไป proxy ฝั่งเซิร์ฟเวอร์เพื่อความปลอดภัย

// บัญชีรายชื่อ: map ชื่อ (หรือ displayName) -> userId (Uxxxxxxxx)
// เก็บลง localStorage เพื่อให้บอท/แอดมินเติมอัตโนมัติได้
const LINE_ID_STORE_KEY = "line_id_book";
function loadLineIdBook(){
    try{ return JSON.parse(localStorage.getItem(LINE_ID_STORE_KEY) || "{}"); }catch(e){ return {}; }
}
function saveLineIdBook(book){
    localStorage.setItem(LINE_ID_STORE_KEY, JSON.stringify(book||{}));
}
let LINE_ID_BOOK = loadLineIdBook();

// ฟังก์ชันให้ "บอท" หรือแอดมินยิงเข้าหน้านี้เพื่อบันทึกชื่อ->userId อัตโนมัติ
// ตัวอย่าง: https://your-dashboard?learn=1&name=ต๋อง&uid=Uxxxx
function learnFromURL(){
    const usp = new URLSearchParams(location.search);
    if(usp.get("learn")==="1"){
        const name = (usp.get("name")||"").trim();
        const uid  = (usp.get("uid")||"").trim();
        if(name && uid){
            LINE_ID_BOOK[name] = uid;
            saveLineIdBook(LINE_ID_BOOK);
            console.log("[LEARN] saved mapping", name, uid);
        }
    }
}
// ให้ backend เรียกจาก console ได้โดยตรง
window.learnLineContact = function(name, uid){
    const n = (name||"").trim(), u=(uid||"").trim();
    if(!n || !u) return false;
    LINE_ID_BOOK[n]=u; saveLineIdBook(LINE_ID_BOOK); 
    console.log("[LEARN] saved mapping", n, u);
    return true;
}

// คืน userId จากช่องชื่อ: รองรับฟอร์แมต "ชื่อ|Uxxxx" หรือหาในสมุด LINE_ID_BOOK
function getLineIdFromName(nameRaw){
    const name = (nameRaw||"").trim();
    if(!name) return "";
    if(name.includes("|")){
        const parts = name.split("|");
        return (parts[1]||"").trim();
    }
    return LINE_ID_BOOK[name] || "";
}

// เทมเพลตข้อความ
const MSG_TPL_WIN = (title, amount) => `🎉 ผลค่าย ${title}\nคุณได้ +${Math.round(amount).toLocaleString()} (หัก 10% แล้ว)\nขอบคุณที่เล่นกับเรา 🙏`;
const MSG_TPL_LOSE = (title, amount) => `📣 ผลค่าย ${title}\nยอดที่ต้องชำระ -${Math.round(amount).toLocaleString()}\nโปรดชำระตามกติกานะครับ 🙏`;

// ส่งข้อความแบบ push รายคน
async function pushText(to, text){
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {"Content-Type":"application/json","Authorization":"Bearer "+CHANNEL_ACCESS_TOKEN},
        body: JSON.stringify({ to, messages: [{type:"text", text}] })
    });
    if(!res.ok){ throw new Error(await res.text()); }
}

// ส่งรวดเดียวทั้งผู้ได้/ผู้เสีย (ถ้าเปิด autosend)
async function sendBulkLine(winList, loseList, autoSend){
    if(!autoSend) return;
    if(!CHANNEL_ACCESS_TOKEN || CHANNEL_ACCESS_TOKEN.includes("ใส่")){
        alert("ยังไม่ได้ตั้งค่า CHANNEL_ACCESS_TOKEN");
        return;
    }
    const items = [...winList, ...loseList].filter(x=>!!x.lineId);
    if(items.length===0){
        alert("ไม่มี LINE ID ตรงกับรายชื่อ (เพิ่มใน LINE_ID_BOOK หรือพิมพ์เป็น 'ชื่อ|Uxxxx')");
        return;
    }
    const uniq = new Set(items.map(x=>x.lineId)).size;
    if(!confirm(`จะส่ง ${items.length} ข้อความ ไปยัง ${uniq} คน ใช่ไหม?`)) return;

    for(const it of items){
        const text = it.type==="win" ? MSG_TPL_WIN(it.title, it.amount) : MSG_TPL_LOSE(it.title, it.amount);
        try{
            await pushText(it.lineId, text);
            await new Promise(r=>setTimeout(r,250));
        }catch(e){
            console.error("ส่งไม่สำเร็จ", it, e);
        }
    }
    alert("✅ ส่ง LINE เสร็จแล้ว");
}

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

// …………………………… (โค้ดเดิมทั้งหมดของคุณคงไว้ตามเดิม; ไม่มีการตัดออก) ……………………………

/* ภายในส่วน addTable() ของคุณ มีปุ่มคิดยอดอยู่เดิม ผมเพิ่ม checkbox “ส่ง LINE อัตโนมัติ” ไว้ข้างปุ่ม */
/// ตัวอย่างในเทมเพลตรูปแบบเดิม (แทรกเพิ่มแค่ label/checkbox ตรงนี้)
/// <button ... onclick="calculateSettle(this.closest('.table-container'))">💰 คิดยอดค่ายนี้</button>
/// <label style="margin-left:10px; user-select:none;"><input type="checkbox" class="settle-autosend"> ส่ง LINE อัตโนมัติ</label>
/// <textarea class="settle-output" ...></textarea>

/// … โค้ดเดิมของคุณต่อไป …
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
///
//
// ===== [ADD] override calculateSettle with autosend support =====
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
                const nameLeft = cells[0]?.value.trim();
                const priceStr = cells[1]?.value.trim();
                const nameRight = cells[2]?.value.trim();

                const price = parseFloat((priceStr.match(/\d{2,}/g) || [])[0]);
                if (isNaN(price)) return;

                const winAmt = price * 0.9;
                const loseAmt = price;

                if (winnerSide === 'left') {
                    if (nameLeft) {
                        messages.push(`( ${title} +${winAmt} ) → ${nameLeft}`);
                        winList.push({type:"win", title, name:nameLeft, lineId:getLineIdFromName(nameLeft), amount:winAmt});
                    }
                    if (nameRight) {
                        messages.push(`( ${title} -${loseAmt} ) → ${nameRight}`);
                        loseList.push({type:"lose", title, name:nameRight, lineId:getLineIdFromName(nameRight), amount:loseAmt});
                    }
                } else {
                    if (nameRight) {
                        messages.push(`( ${title} +${winAmt} ) → ${nameRight}`);
                        winList.push({type:"win", title, name:nameRight, lineId:getLineIdFromName(nameRight), amount:winAmt});
                    }
                    if (nameLeft) {
                        messages.push(`( ${title} -${loseAmt} ) → ${nameLeft}`);
                        loseList.push({type:"lose", title, name:nameLeft, lineId:getLineIdFromName(nameLeft), amount:loseAmt});
                    }
                }
            });
        }

        const output = tableContainer.querySelector('.settle-output');
        output.value = messages.join("\n");
        navigator.clipboard.writeText(output.value);

        // [ADD] autosend
        sendBulkLine(winList, loseList, autoSend);

        alert("✅ คิดยอดสำเร็จ! คัดลอกข้อความให้แล้ว");
    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการคำนวณยอด");
    }
}
