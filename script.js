/**
 * ฟังก์ชันใหม่สำหรับหน้าต้อนรับ (Welcome Screen)
 */

function updateClosedCampDisplay() {
    const el = document.getElementById("bung-camp-summary");
    if (!el) return;

    el.innerHTML = `
        🏕️ ปิดยอดแล้ว <b>${closedCampCount}</b> ค่าย
        <span style="font-size:0.75rem;color:#64748b;">(นับจากการกดปิดยอด)</span>
    `;
}


// 1. ตัวแปรเก็บสถานะ (ไว้นอกฟังก์ชัน)
let showNetLabel = true;

// 2. ฟังก์ชันสลับการแสดงผล (ใช้กับปุ่มใน Action Bar)
function toggleNetDisplay(btn) {
    showNetLabel = !showNetLabel;
    
    if (showNetLabel) {
        btn.classList.add('active');
        btn.innerHTML = '<span class="flare"></span><i class="fas fa-eye"></i> สุทธิ: เปิด';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span class="flare"></span><i class="fas fa-eye-slash"></i> สุทธิ: ปิด';
    }
    
    // สั่งให้อัปเดตทุกตารางทันที
    updateIndividualTableSummaries();
}

// 3. ฟังก์ชันหลัก (รวมเช็คชื่อซ้ำ และ เปิด/ปิดยอด)

// ===== ผลแพ้/ชนะ (ย้ายป้ายสุทธิไปหลังชื่อ) =====

// ใส่สีให้ป้ายสุทธิหลังชื่อ (ชนะ=เขียว / แพ้=แดง)
function setNameNetBadgeState(badgeEl, state) {
  if (!badgeEl) return;
  badgeEl.classList.remove('badge-win', 'badge-lose');
  if (state === 'win') badgeEl.classList.add('badge-win');
  if (state === 'lose') badgeEl.classList.add('badge-lose');
}
// outcome: 'C' = คนไล่ชนะ, 'H' = คนยั้งชนะ
function setOutcomeForTable(btn, outcome) {
    playSound('click');
    const tableWrapper = btn.closest('.table-container');
    if (!tableWrapper) return;

    tableWrapper.querySelectorAll('tbody tr').forEach(tr => {
        tr.dataset.outcome = outcome || "";
    });


    // เปลี่ยนธีมของตารางตามผลลัพธ์ (Premium Accent)
    tableWrapper.classList.toggle('outcome-win', outcome === 'C');
    tableWrapper.classList.toggle('outcome-lose', outcome === 'H');
    tableWrapper.classList.toggle('outcome-none', !outcome);

    if (outcome === 'C') { 
        toastRateLimited('ตั้งค่าเป็น: ชนะ', 'success');
        confettiRateLimited();
    } else if (outcome === 'H') {
        toastRateLimited('ตั้งค่าเป็น: แพ้', 'danger');
    } else {
        toastRateLimited('ล้างผลลัพธ์แล้ว', 'info');
    }

    // อัปเดตป้ายสุทธิทันที + เซฟลง localStorage
    updateIndividualTableSummaries();
    saveData();
}

function getRowTotal(priceText) {
    const clean = (priceText || "").replace(/[Oo]/g, '0');
    const nums = clean.match(/\d+/g);
    let total = 0;
    if (nums) nums.forEach(n => { if (n.length >= 3) total += parseInt(n, 10); });
    return total;
}

function clearNameNetBadges(tr) {
    tr.querySelectorAll('.name-net-badge').forEach(el => el.remove());
    const inputs = tr.querySelectorAll('input');
    if (inputs[0]) inputs[0].style.paddingRight = "";
    if (inputs[2]) inputs[2].style.paddingRight = "";
}

function ensureNameNetBadge(nameTd, inputEl) {
    if (!nameTd) return null;
    nameTd.style.position = "relative";
    if (inputEl) inputEl.style.paddingRight = "70px";

    let badge = nameTd.querySelector('.name-net-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'name-net-badge';
        nameTd.appendChild(badge);
    }
    return badge;
}

function updateIndividualTableSummaries() {
  document.querySelectorAll(".table-container").forEach(tableWrapper => {

    const tableTitleInput = tableWrapper.querySelector(".table-title-input");
    const campName = tableTitleInput ? tableTitleInput.value.trim() || "ไม่ระบุค่าย" : "ไม่ระบุค่าย";

    const nameSummary = {};
    const rows = tableWrapper.querySelectorAll("tbody tr");

    rows.forEach(tr => {
      const inputs = tr.querySelectorAll("input");
      if (inputs.length < 3) return;

      const chaserInput = inputs[0]; 
      const priceInput = inputs[1];  
      const holderInput = inputs[2]; 
      
      const chaser = chaserInput.value.trim();
      const holder = holderInput.value.trim();

      /* --- เช็คชื่อซ้ำ (Alert) --- */
      if (chaser !== "" && holder !== "" && chaser === holder) {
        alert(`⚠️ ชื่อซ้ำกัน: "${chaser}" ไม่สามารถเป็นทั้งคนไล่และคนยั้งได้`);
        holderInput.value = ""; 
        return; 
      }

      // คำนวณยอด
const rowTotal = getRowTotal(priceInput.value);

// ค่า "สุทธิ" = 90% (ปัดลง)
const netAmount = rowTotal > 0 ? Math.floor(rowTotal * 0.9) : 0;

// เคลียร์ป้ายเดิมทุกครั้ง
clearNameNetBadges(tr);

// ถ้ามีการกด "ชนะ/แพ้" ให้ย้ายป้ายไปหลังชื่อ
const outcome = tr.dataset.outcome || "";

const priceTd = priceInput.parentElement;
let netInside = priceTd.querySelector(".net-inside-label");

if (rowTotal > 0) {
  if (outcome === "C" || outcome === "H") {
    // ซ่อน/ลบป้ายสุทธิในช่องราคา
    if (netInside) netInside.remove();

    const chaserTd = chaserInput.parentElement;
    const holderTd = holderInput.parentElement;

    const chaserBadge = ensureNameNetBadge(chaserTd, chaserInput);
    const holderBadge = ensureNameNetBadge(holderTd, holderInput);

    if (outcome === "C") {
      // คนไล่ชนะ: คนไล่ได้สุทธิ, คนยั้งได้เต็ม
      if (chaserBadge) chaserBadge.innerText = netAmount.toLocaleString();
      if (holderBadge) holderBadge.innerText = rowTotal.toLocaleString();

      setNameNetBadgeState(chaserBadge, 'win');
      setNameNetBadgeState(holderBadge, 'lose');
    } else {
      // คนยั้งชนะ: คนยั้งได้สุทธิ, คนไล่ได้เต็ม
      if (chaserBadge) chaserBadge.innerText = rowTotal.toLocaleString();
      if (holderBadge) holderBadge.innerText = netAmount.toLocaleString();

      setNameNetBadgeState(chaserBadge, 'lose');
      setNameNetBadgeState(holderBadge, 'win');
    }

    if (chaserBadge) chaserBadge.style.display = showNetLabel ? "inline-flex" : "none";
    if (holderBadge) holderBadge.style.display = showNetLabel ? "inline-flex" : "none";
  } else {
    // โหมดเดิม: ไม่แสดงป้ายสุทธิในช่องราคา (เอาปุ่ม/ป้ายออก)
    if (netInside) netInside.remove();
  }
} else {
  if (netInside) netInside.remove();
}

// สรุปยอด Sidebar

      if (rowTotal > 0) {
        if (chaser) nameSummary[chaser] = (nameSummary[chaser] || 0) + rowTotal;
        if (holder && holder !== chaser) {
          nameSummary[holder] = (nameSummary[holder] || 0) + rowTotal;
        }
      }
    });

    /* ===== ส่วนแสดง Sidebar (คงเดิม) ===== */
    const summaryArea = tableWrapper.querySelector(".name-list-area");
    if (!summaryArea) return;
    const entries = Object.entries(nameSummary).sort((a, b) => b[1] - a[1]);
    let html = `<div class="summary-header"><div class="live-dot"></div><span>ยอดเล่น Real-Time</span><span class="camp-badge">ค่าย: ${campName}</span></div>`;
    if (entries.length === 0) {
      html += `<p style="color:#94a3b8; font-style:italic; text-align:center; margin-top:15px; font-size:.85rem;">รอข้อมูล...</p>`;
    } else {
      html += entries.map(([name, total], index) => {
        const cleanName = name.replace(/^@+/, '');
        const displayName = cleanName.length > 15 ? cleanName.substring(0, 15) + "…" : cleanName;
        let rankClass = (index === 0) ? "gold" : (index === 1) ? "silver" : (index === 2) ? "bronze" : "";
        return `<div class="player-row"><div class="rank ${rankClass}">#${index + 1}</div><div class="player-name">${displayName}</div><div style="display:flex;gap:6px;align-items:center;"><span class="amount">${total.toLocaleString()}</span><button class="btn-capture-player" onclick="capturePlayerRow('${cleanName}', ${total})"><i class="fas fa-camera"></i></button></div></div>`;
      }).join("");
    }
    summaryArea.innerHTML = html;
  });
}

function syncRealtimeSummary() {
  const liveTables = {};

  tables.forEach((table, index) => {
    const map = {};

    table.rows.forEach(r => {
      const nums = r.price?.match(/\d+/g);
      if (!nums) return;

      let sum = 0;
      nums.forEach(n => {
        if (n.length >= 3) sum += parseInt(n);
      });

      if (sum > 0) {
        if (r.chaser) map[r.chaser] = (map[r.chaser] || 0) + sum;
        if (r.holder && r.holder !== r.chaser)
          map[r.holder] = (map[r.holder] || 0) + sum;
      }
    });

    liveTables["table_" + index] = {
      title: table.title || `บั้งที่ ${index + 1}`,
      summary: map
    };
  });

  firebase.database().ref("liveTables").set(liveTables);
}


function updateNameSummary() {
    const nameSummary = {};

    document.querySelectorAll(".table-container").forEach(table => {
        table.querySelectorAll("tbody tr").forEach(tr => {
            const inputs = tr.querySelectorAll("input");
            if (inputs.length < 3) return;

            const chaserName = inputs[0].value.trim(); // คนไล่
            const priceVal = inputs[1].value.replace(/[Oo]/g, '0'); // ราคา
            const holderName = inputs[2].value.trim(); // คนยั้ง

            // ดึงเฉพาะตัวเลข 3 หลักขึ้นไป
            const matches = priceVal.match(/\d+/g);
            let rowTotal = 0;
            if (matches) {
                matches.forEach(numStr => {
                    if (numStr.length >= 3) rowTotal += parseFloat(numStr);
                });
            }

            if (rowTotal > 0) {
                // รวมยอดฝั่งคนไล่
                if (chaserName) {
                    nameSummary[chaserName] = (nameSummary[chaserName] || 0) + rowTotal;
                }
                // แก้ไข: รวมยอดฝั่งคนยั้ง โดยเช็คว่าชื่อไม่ซ้ำกับคนไล่ เพื่อป้องกันยอดเบิ้ล
                if (holderName && holderName !== chaserName) {
                    nameSummary[holderName] = (nameSummary[holderName] || 0) + rowTotal;
                }
            }
        });
    });

    // แสดงผลลงในหน้าจอ
    const display = document.getElementById("name-summary-display");
    if (!display) return;

    const summaryArray = Object.entries(nameSummary).sort((a, b) => b[1] - a[1]); // เรียงจากยอดมากไปน้อย

    if (summaryArray.length === 0) {
        display.innerHTML = `<p style="color: #64748b;">ไม่มีข้อมูลการเล่น...</p>`;
        return;
    }

    let html = '<table style="width:100%; border-collapse: collapse;">';
    summaryArray.forEach(([name, total]) => {
        html += `
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                <td style="padding: 5px 0; color: #334155;">${name}</td>
                <td style="text-align: right; font-weight: bold; color: var(--theme-accent);">฿${total.toLocaleString()}</td>
            </tr>`;
    });
    html += '</table>';
    display.innerHTML = html;
}


let isSoundEnabled = true;

// ระบบสลับสถานะเสียง
function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    const icon = document.getElementById('sound-icon');
    const btn = document.getElementById('btn-sound-toggle');
    if(isSoundEnabled) {
        icon.className = "fas fa-volume-up";
        btn.innerHTML = `<i class="fas fa-volume-up"></i> เสียง: เปิด`;
    } else {
        icon.className = "fas fa-volume-mute";
        btn.innerHTML = `<i class="fas fa-volume-mute"></i> เสียง: ปิด`;
    }
}

function showToast(message) {
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ลองใช้แทน alert:
// showToast("บันทึกภาพสำเร็จแล้ว!");

// ฟังก์ชันเล่นเสียงกลาง (เช็คปุ่มปิดเสียงที่นี่ที่เดียว)
function playSound(soundName) {
    if (!isSoundEnabled) return;

    // ตรวจสอบทั้งชุดเสียงหลักและชุดเสียงพิเศษที่คุณเพิ่ม
    const sound = sounds[soundName] || extraSounds[soundName];
    
    if (sound) {
        sound.pause(); 
        sound.currentTime = 0;
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log("Browser Blocked Audio:", e));
        }
    }
}

function launchConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.innerHTML = "✨"; // หรือใช้สีสลับกัน
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.fontSize = Math.random() * 20 + 10 + 'px';
        confetti.style.zIndex = '10001';
        confetti.style.pointerEvents = 'none';
        document.body.appendChild(confetti);

        const fallDuration = Math.random() * 3 + 2;
        confetti.animate([
            { transform: 'translateY(0) rotate(0)', opacity: 1 },
            { transform: `translateY(100vh) translateX(${Math.random() * 200 - 100}px) rotate(720deg)`, opacity: 0 }
        ], { duration: fallDuration * 1000, easing: 'linear' });

        setTimeout(() => confetti.remove(), fallDuration * 1000);
    }
}

// ===== Premium Micro-Interactions (Toast + Rate Limit) =====
let __toastLastAt = 0;
let __confettiLastAt = 0;

function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            ${type === "success" ? '<i class="fas fa-check-circle"></i>' :
              type === "warning" ? '<i class="fas fa-exclamation-triangle"></i>' :
              type === "danger" ? '<i class="fas fa-times-circle"></i>' :
              '<i class="fas fa-info-circle"></i>'}
        </div>
        <div class="toast-msg">${message}</div>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("toast-show"));

    setTimeout(() => {
        toast.classList.remove("toast-show");
        toast.classList.add("toast-hide");
        setTimeout(() => toast.remove(), 250);
    }, 1800);
}

function toastRateLimited(message, type="info", minGapMs=1200) {
    const now = Date.now();
    if (now - __toastLastAt < minGapMs) return;
    __toastLastAt = now;
    showToast(message, type);
}

function confettiRateLimited(minGapMs=3500) {
    const now = Date.now();
    if (now - __confettiLastAt < minGapMs) return;
    __confettiLastAt = now;
    launchConfetti();
}


function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        obj.innerText = `฿${current.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// เรียกใช้ใน updateDashboardStats():
function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) {
        const currentVal = parseFloat(pEl.innerText.replace(/[฿,]/g, '')) || 0;
        animateValue(pEl, currentVal, totalDeletedProfit, 500);
    }
}

// ประกาศและบังคับโหลดเสียงใหม่
const extraSounds = {
    woosh: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    chime: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
    fanfare: new Audio('https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3')
};

// ฟังก์ชันบังคับปลดล็อกเสียง (เรียกใช้เมื่อมีการคลิกครั้งแรก)
function unlockAudio() {
    Object.values(extraSounds).forEach(audio => {
        audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
        }).catch(e => console.log("Audio waiting for user click..."));
    });
    // เมื่อปลดล็อกแล้ว ให้ลบ Event ทิ้งเพื่อไม่ให้ทำงานซ้ำ
    document.removeEventListener('click', unlockAudio);
}
document.addEventListener('click', unlockAudio);

// 2. ระบบพลุ (Confetti)
let isConfettiActive = false;
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    // รายการอีโมจิพลุทั้งหมด
    const rocketSymbols = ['🎆', '🎇', '🧨', '✨', '💥', '🏮', '🌟', '🌠', '🎊', '🎉']; 
    const colors = ['#ffdf91', '#d42426', '#0a4d34', '#38bdf8', '#ffffff'];
    isConfettiActive = true;

    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 100,
            symbol: rocketSymbols[i % rocketSymbols.length],
            size: Math.random() * 15 + 10, // ปรับขนาดให้เล็กลงเล็กน้อย
            color: colors[Math.floor(Math.random() * colors.length)],
            // ปรับความเร็วให้ช้าลงมาก (จากเดิม 1.5-3.5 เหลือ 0.8-1.8) เพื่อให้นุ่มนวล
            speed: Math.random() * 1.0 + 0.8, 
            // ปรับค่าความโปร่งใส (Opacity) ให้จางลง (0.2 - 0.4) เพื่อไม่ให้ขวางสายตา
            opacity: Math.random() * 0.2 + 0.2, 
            drift: Math.random() * 1 - 0.5 // แรงส่ายข้าง
        });
    }

    function draw() {
        if (!isConfettiActive) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = p.opacity; // ใช้ค่าความจางที่ตั้งไว้
            ctx.font = `${p.size}px Arial`;
            ctx.fillText(p.symbol, p.x, p.y);
            ctx.restore();

            p.y -= p.speed; // ลอยขึ้นช้าๆ
            p.x += Math.sin(p.y / 50) * p.drift; // ส่ายไปมาเบาๆ

            if (p.y < -50 && isConfettiActive) {
                p.y = canvas.height + 50;
                p.x = Math.random() * canvas.width;
            }
        });
        requestAnimationFrame(draw);
    }
    draw();
    
    // แสดงผลนานขึ้นเล็กน้อย (5 วินาที) เพราะเคลื่อนที่ช้าลง
    setTimeout(() => { isConfettiActive = false; }, 2500);
}

// 3. แก้ไขฟังก์ชันเดิมเพื่อใส่ลูกเล่น
const originalAddTable = addTable;
addTable = function(title = "", rows = null, isSilent = false) {
    if(!isSilent) playSound('woosh'); // แก้จาก extraSounds.woosh.play()
    originalAddTable(title, rows, isSilent);
    
    // ใส่ Animation จางเข้า
    const tables = document.querySelectorAll('.table-container');
    const lastTable = tables[tables.length - 1];
    if(lastTable) {
        lastTable.style.opacity = '0';
        lastTable.style.transform = 'translateY(20px)';
        setTimeout(() => {
            lastTable.style.transition = 'all 0.5s ease';
            lastTable.style.opacity = '1';
            lastTable.style.transform = 'translateY(0)';
        }, 50);
    }
}

// เมื่อปิดยอดสำเร็จ
function handleClosingSuccess() {
    playSound('fanfare'); // แก้จาก extraSounds.fanfare.play()
    launchConfetti();
}

// แก้ไขฟังก์ชัน removeTable ในส่วน Callback
// ให้เพิ่ม handleClosingSuccess(); เข้าไปหลังจากคำนวณกำไรเสร็จ


function enterWebsite() {
    // เล่นเสียงคลิกเพื่อปลดล็อกระบบเสียง
    playSound('click'); 
    
    const welcome = document.getElementById('welcome-screen');
    const welcomeBox = welcome.querySelector('.welcome-box');
    
    // อนิเมชั่นตัวกล่องให้ยุบลงเล็กน้อยก่อนหายไป
    welcomeBox.style.transform = "scale(0.9)";
    welcomeBox.style.transition = "transform 0.4s ease";
    
    // ค่อยๆ จางหน้าจอ Welcome ทั้งหมดหายไป
    welcome.classList.add('fade-out-screen');
    
    // ลบ Element ทิ้งหลังจากเล่นอนิเมชั่นเสร็จ (0.8 วินาทีตาม CSS)
    setTimeout(() => {
        welcome.remove();
    }, 800);
}

document.addEventListener("DOMContentLoaded", () => {
    const container = document.body; 
    const snowflakeSymbols = ["❄", "❅", "❆", "✨"];
    
    for (let i = 0; i < 60; i++) {
        let flake = document.createElement('div');
        flake.className = "snowflake"; // *** เพิ่มบรรทัดนี้เพื่อให้ CSS ควบคุมได้ ***
        flake.innerHTML = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
        
        // สไตล์พื้นฐานของหิมะ
        flake.style.position = "fixed";
        flake.style.color = "white";
        flake.style.opacity = Math.random();
        flake.style.left = Math.random() * 100 + "vw";
        flake.style.top = "-5vh";
        flake.style.fontSize = (Math.random() * 20 + 10) + "px";
        flake.style.zIndex = "1";
        flake.style.pointerEvents = "none";
        flake.style.filter = "drop-shadow(0 0 5px rgba(255,255,255,0.8))";
        
        const fall = () => {
            const duration = Math.random() * 8000 + 5000;
            const drift = (Math.random() * 10) - 5;
            
            flake.animate([
                { transform: `translateY(0vh) translateX(0vw) rotate(0deg)` },
                { transform: `translateY(105vh) translateX(${drift}vw) rotate(360deg)` }
            ], {
                duration: duration,
                iterations: Infinity
            });
        };
        
        container.appendChild(flake);
        fall();
    }
});

const sounds = {
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/3124/3124-preview.mp3'),
    // แก้ไข 2 ลิงก์ที่เสียเป็น Mixkit ตัวใหม่
    success: new Audio('https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3'),
    delete: new Audio('https://assets.mixkit.co/active_storage/sfx/1489/1489-preview.mp3'),

    popup: new Audio('https://assets.mixkit.co/active_storage/sfx/2039/2039-preview.mp3'),
    
    clear: new Audio('https://assets.mixkit.co/active_storage/sfx/3118/3118-preview.mp3'),
    alert: new Audio('https://assets.mixkit.co/active_storage/sfx/2047/2047-preview.mp3')
};

// บังคับเปลี่ยน Source เป็นไฟล์เสียง MP3 ที่ใช้ได้จริงแน่นอน
sounds.success.src = 'https://actions.google.com/sounds/v1/communication/notification_high_intensity.ogg';
sounds.delete.src = 'https://actions.google.com/sounds/v1/actions/remove_item.ogg';

// ถ้าคุณใช้ iPhone/Safari ให้ใช้ลิงก์ MP3 ด้านล่างนี้แทน (เพราะ iPhone ไม่รองรับ .ogg)
// sounds.success.src = 'https://www.soundjay.com/buttons/sounds/button-37.mp3';
// sounds.delete.src = 'https://www.soundjay.com/buttons/sounds/button-10.mp3';

// เพิ่มฟังก์ชันช่วยโหลดใหม่เพื่อความชัวร์
Object.values(sounds).forEach(audio => {
    audio.load(); 
});

function playSound(soundName) {
    if (!isSoundEnabled) return; 

    // เน้นหาจาก extraSounds ก่อน
    const sound = extraSounds[soundName] || (typeof sounds !== 'undefined' ? sounds[soundName] : null);
    
    if (sound) {
        sound.pause(); 
        sound.currentTime = 0; 
        sound.volume = 0.3; // ปรับระดับเสียง 50%
        
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("เสียงถูกบล็อก: ต้องคลิกหน้าจอเพื่อเปิดระบบเสียงครั้งแรก");
            });
        }
    }
}

let historyData = [];
let totalDeletedProfit = 0;
let currentModalKeyHandler = null;
let isProcessingModal = false; // ป้องกันปิดยอดเบิ้ล
let isRestoring = false;      // ป้องกันกู้คืนเบิ้ล
let closedCampCount = 0; // ✅ จำนวนค่ายที่ปิดยอดแล้ว
let selectedHotkeyTable = null; // ตารางที่ถูกเลือกไว้สำหรับคีย์ลัด Q / E

function injectUsageGuideStyles() {
    if (document.getElementById('web-usage-guide-styles')) return;

    const style = document.createElement('style');
    style.id = 'web-usage-guide-styles';
    style.textContent = `
        .web-usage-guide {
            margin: 14px 0 18px;
            padding: 14px;
            border-radius: 18px;
            border: 1px solid rgba(245, 158, 11, 0.28);
            background: linear-gradient(135deg, rgba(255,251,235,0.98), rgba(254,249,195,0.92));
            box-shadow: 0 14px 28px rgba(245,158,11,0.10);
        }

        .web-usage-guide .guide-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .web-usage-guide .guide-title {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #92400e;
            font-weight: 900;
            font-size: 1rem;
        }

        .web-usage-guide .guide-desc {
            color: #78350f;
            font-size: 0.9rem;
            margin-top: 4px;
        }

        .web-usage-guide .guide-toggle {
            border: 1px solid #f59e0b;
            border-radius: 999px;
            padding: 8px 14px;
            font-weight: 800;
            cursor: pointer;
            background: linear-gradient(135deg, #ffffff, #fef3c7);
            color: #92400e;
            box-shadow: 0 8px 18px rgba(245,158,11,0.12);
            transition: all .18s ease;
        }

        .web-usage-guide .guide-toggle:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 22px rgba(245,158,11,0.18);
        }

        .web-usage-guide .guide-body {
            margin-top: 14px;
            display: grid;
            gap: 10px;
        }

        .web-usage-guide.collapsed .guide-body {
            display: none;
        }

        .web-usage-guide .guide-item {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            background: rgba(255,255,255,0.72);
            border: 1px solid rgba(245,158,11,0.14);
            border-radius: 14px;
            padding: 10px 12px;
        }

        .web-usage-guide .guide-step {
            min-width: 26px;
            height: 26px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            font-weight: 900;
            color: #ffffff;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            box-shadow: 0 8px 16px rgba(217,119,6,0.22);
        }

        .web-usage-guide .guide-text {
            color: #3f3f46;
            line-height: 1.5;
            font-size: 0.92rem;
        }

        .web-usage-guide .guide-kbd {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 26px;
            padding: 2px 8px;
            margin: 0 2px;
            border-radius: 8px;
            background: #111827;
            color: #fff;
            font-weight: 900;
            font-size: 0.84rem;
            box-shadow: inset 0 -2px 0 rgba(255,255,255,0.15);
        }
    `;
    document.head.appendChild(style);
}

function toggleUsageGuide(btn) {
    const guide = btn.closest('.web-usage-guide');
    if (!guide) return;

    const isCollapsed = guide.classList.toggle('collapsed');
    btn.innerHTML = isCollapsed ? '📖 แสดงวิธีใช้' : '🙈 ซ่อนวิธีใช้';
    localStorage.setItem('usageGuideCollapsed', isCollapsed ? '1' : '0');
}

function injectUsageGuide() {
    if (document.getElementById('web-usage-guide')) return;

    injectUsageGuideStyles();

    const tablesContainer = document.getElementById('tables-container');
    if (!tablesContainer) return;

    const isCollapsed = localStorage.getItem('usageGuideCollapsed') === '1';
    const guide = document.createElement('div');
    guide.id = 'web-usage-guide';
    guide.className = `web-usage-guide${isCollapsed ? ' collapsed' : ''}`;
    guide.innerHTML = `
        <div class="guide-head">
            <div>
                <div class="guide-title"><i class="fas fa-book-open"></i> วิธีใช้งานเว็บ</div>
                <div class="guide-desc">คู่มือสั้น ๆ สำหรับกรอกชื่อ ติ๊กถูก และใช้คีย์ลัดในแต่ละตาราง</div>
            </div>
            <button type="button" class="guide-toggle" onclick="toggleUsageGuide(this)">${isCollapsed ? '📖 แสดงวิธีใช้' : '🙈 ซ่อนวิธีใช้'}</button>
        </div>
        <div class="guide-body">
            <div class="guide-item">
                <div class="guide-step">1</div>
                <div class="guide-text">ตั้งชื่อค่ายในช่องด้านบนของแต่ละตาราง แล้วกรอก <b>คนไล่</b> / <b>ราคา</b> / <b>คนยั้ง</b> ลงในแต่ละแถว</div>
            </div>
            <div class="guide-item">
                <div class="guide-step">2</div>
                <div class="guide-text">ถ้าต้องการติ๊กเอง ให้กดปุ่มวงกลม <b>✓</b> ที่อยู่หน้าชื่อ ระบบจะเคลือบสีชื่อคนนั้นทันที</div>
            </div>
            <div class="guide-item">
                <div class="guide-step">3</div>
                <div class="guide-text">ถ้าจะใช้คีย์ลัด ต้องกดปุ่ม <b>⌨️ ใช้คีย์ลัด</b> ของตารางค่ายนั้นก่อน ตารางที่เลือกจะมีกรอบเด่นขึ้น</div>
            </div>
            <div class="guide-item">
                <div class="guide-step">4</div>
                <div class="guide-text">เมื่อเลือกตารางแล้ว กด <span class="guide-kbd">Q</span> เพื่อติ๊กฝั่ง <b>คนไล่</b> ลงทีละชื่อ และกด <span class="guide-kbd">E</span> เพื่อติ๊กฝั่ง <b>คนยั้ง</b> ลงทีละชื่อ</div>
            </div>
            <div class="guide-item">
                <div class="guide-step">5</div>
                <div class="guide-text">ถ้าตารางไหนติ๊กครบแล้ว ระบบจะแจ้งเตือนให้เอง และจะข้ามช่องที่ยังไม่มีชื่อให้อัตโนมัติ</div>
            </div>
            <div class="guide-item">
                <div class="guide-step">6</div>
                <div class="guide-text">ข้อมูลจะ <b>บันทึกอัตโนมัติ</b> ทุกครั้งที่พิมพ์หรือกดติ๊ก สามารถรีเฟรชหน้าเว็บได้โดยข้อมูลยังอยู่เหมือนเดิม</div>
            </div>
        </div>
    `;

    tablesContainer.parentNode.insertBefore(guide, tablesContainer);
}

document.addEventListener("DOMContentLoaded", () => {
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
                // ✅ นับจำนวนค่ายจากประวัติที่ปิดไปแล้ว
        closedCampCount = historyData.length;
    }
    injectUsageGuide();
    updateClosedCampDisplay(); // ✅ แสดงผลทันทีตอนเข้าเว็บ
    loadData(); 
    document.addEventListener('keydown', handleGlobalKeyDown);
});

// --- หัวใจการคำนวณ: เช็ค 3 หลักขึ้นไปเท่านั้น ---
function calculateTableProfit(tableElement) {
    let profit = 0;
    tableElement.querySelectorAll("tbody tr").forEach(tr => {
        const inputs = tr.querySelectorAll("input");
        if (inputs[1]) {
            const rawVal = inputs[1].value;
            const cleanVal = rawVal.replace(/[Oo]/g, '0');
            
            // แก้ไข: ใช้ /g เพื่อหาตัวเลขทุกกลุ่มในช่องนั้น
            const matches = cleanVal.match(/\d+/g); 
            
            if (matches) {
                matches.forEach(numStr => {
                    // ถ้าตัวเลขกลุ่มไหนยาว 3 หลักขึ้นไป ให้นำมาคิดกำไร
                    if (numStr.length >= 3) {
                        profit += (parseFloat(numStr) * 0.10);
                    }
                });
            }
        }
    });
    return profit;
}

function refreshAllBadges() {
    document.querySelectorAll(".table-container").forEach(table => {
        const profit = calculateTableProfit(table);
        const badge = table.querySelector(".profit-badge-live");
        if (badge) {
            badge.innerText = `฿${profit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
            badge.style.background = profit > 0 ? "#2ecc71" : "#94a3b8";
        }
    });
}

// --- 1. เพิ่มเสียงตอนพิมพ์ (Auto Save) ---
function saveData() {
    const data = [];
    document.querySelectorAll(".table-container").forEach(table => {
        const titleInput = table.querySelector(".table-title-input");
        const title = titleInput ? titleInput.value : "";
        const rows = [];
        table.querySelectorAll("tbody tr").forEach(r => {
            const cells = r.querySelectorAll("input");
            if (cells.length >= 3) {
                const nameTds = r.querySelectorAll("td");
                const chaserMarked = nameTds[0]?.querySelector('.btn-name-mark')?.classList.contains('active') ? 1 : 0;
                const holderMarked = nameTds[2]?.querySelector('.btn-name-mark')?.classList.contains('active') ? 1 : 0;
                rows.push([cells[0].value, cells[1].value, cells[2].value, (r.dataset.outcome || ""), chaserMarked, holderMarked]);
            }
        });
        data.push({ title, rows });
    });
    localStorage.setItem("savedTables", JSON.stringify(data));
    refreshAllBadges();
    updateDashboardStats();
  
    pushToRealtime(); // 👈 เพิ่มบรรทัดนี้

    updateNameSummary(); // <--- เพิ่มบรรทัดนี้
    updateIndividualTableSummaries(); // <--- เพิ่มบรรทัดนี้ไว้ท้ายสุดของฟังก์ชัน saveData
    updateDuplicateNameBadges();

        // ✅ เพิ่มบรรทัดนี้
  //  updateBungAndCampSummary();
    
    // แสดง Badge แจ้งเตือน และเล่นเสียงเบาๆ ตอนบันทึก
    const badge = document.getElementById("auto-save-alert");
    if(badge) { 
        badge.style.opacity = "1"; 
        setTimeout(() => badge.style.opacity = "0", 1500); 
    }
    toastRateLimited('บันทึกอัตโนมัติเรียบร้อย', 'success', 2000);
}

function buildSummary(rows) {
  const players = {};
  let total = 0;

  rows.forEach(r => {
    const priceText = (r[1] || "").replace(/[Oo]/g, "0");
    const nums = priceText.match(/\d+/g);
    if (!nums) return;

    nums.forEach(n => {
      if (n.length >= 3) {
        const val = parseInt(n, 10);
        total += val;

        if (r[0]) players[r[0]] = (players[r[0]] || 0) + val;
        if (r[2] && r[2] !== r[0]) {
          players[r[2]] = (players[r[2]] || 0) + val;
        }
      }
    });
  });

  return { total, players };
}

function pushToRealtime() {
  const ref = db.ref("realtimeEvents");

  document.querySelectorAll(".table-container").forEach(table => {
    table.querySelectorAll("tbody tr").forEach(tr => {
      const inputs = tr.querySelectorAll("input");
      if (inputs.length < 3) return;

      const chaser = inputs[0].value.trim();
      const price  = inputs[1].value.replace(/[Oo]/g,'0');
      const holder = inputs[2].value.trim();

      const nums = price.match(/\d+/g);
      if (!nums) return;

      nums.forEach(n => {
        if (n.length >= 3) {
          ref.push({
            chaser,
            holder,
            amount: parseInt(n),
            ts: Date.now()
          });
        }
      });
    });
  });
}



function loadData() {
    selectedHotkeyTable = null;
    const raw = localStorage.getItem("savedTables");
    if (!raw) return;
    const data = JSON.parse(raw);
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(t => addTable(t.title, t.rows, true));
}

// 3. ฟังก์ชันการทำงานของตาราง

function injectHotkeyTableStyles() {
    if (document.getElementById('hotkey-table-styles')) return;

    const style = document.createElement('style');
    style.id = 'hotkey-table-styles';
    style.textContent = `
        .table-container.hotkey-table-selected {
            position: relative;
            border: 2px solid #38bdf8 !important;
            box-shadow: 0 0 0 4px rgba(56,189,248,0.16), 0 18px 40px rgba(14,165,233,0.18) !important;
        }

        .table-container.hotkey-table-selected::after {
            content: "⌨️ ตารางนี้ใช้คีย์ลัด Q / E";
            position: absolute;
            top: -12px;
            left: 18px;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 800;
            color: #075985;
            background: linear-gradient(135deg, #e0f2fe, #bae6fd);
            border: 1px solid rgba(14,165,233,0.28);
            box-shadow: 0 8px 18px rgba(14,165,233,0.18);
            z-index: 5;
        }

        .btn-hotkey-table {
            border: 1px solid #38bdf8;
            border-radius: 999px;
            padding: 8px 14px;
            font-weight: 800;
            cursor: pointer;
            background: linear-gradient(135deg, #f8fafc, #e0f2fe);
            color: #0f172a;
            box-shadow: 0 8px 16px rgba(15,23,42,0.08);
            transition: all .18s ease;
        }

        .btn-hotkey-table:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 22px rgba(14,165,233,0.14);
        }

        .btn-hotkey-table.active {
            background: linear-gradient(135deg, #0ea5e9, #2563eb);
            color: #ffffff;
            border-color: #0284c7;
            box-shadow: 0 14px 28px rgba(37,99,235,0.24);
        }

        .btn-name-mark.hotkey-flash,
        .name-input-marked.hotkey-flash {
            animation: hotkeyFlash .45s ease;
        }

        @keyframes hotkeyFlash {
            0% { transform: scale(1); }
            40% { transform: scale(1.08); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

function setSelectedHotkeyTable(btn) {
    const tableWrapper = btn.closest('.table-container');
    if (!tableWrapper) return;

    injectHotkeyTableStyles();

    document.querySelectorAll('.table-container.hotkey-table-selected').forEach(el => {
        if (el !== tableWrapper) el.classList.remove('hotkey-table-selected');
    });
    document.querySelectorAll('.btn-hotkey-table.active').forEach(el => {
        if (el !== btn) {
            el.classList.remove('active');
            el.innerHTML = '⌨️ ใช้คีย์ลัด';
        }
    });

    const isAlreadySelected = selectedHotkeyTable === tableWrapper;
    if (isAlreadySelected) {
        tableWrapper.classList.remove('hotkey-table-selected');
        btn.classList.remove('active');
        btn.innerHTML = '⌨️ ใช้คีย์ลัด';
        selectedHotkeyTable = null;
        toastRateLimited('ปิดการใช้คีย์ลัดของตารางนี้แล้ว', 'info');
        return;
    }

    selectedHotkeyTable = tableWrapper;
    tableWrapper.classList.add('hotkey-table-selected');
    btn.classList.add('active');
    btn.innerHTML = '⌨️ ใช้งานอยู่';
    toastRateLimited('เลือกตารางนี้แล้ว: กด Q = คนไล่, E = คนยั้ง', 'success');
}

function flashMarkedByHotkey(btn, input) {
    if (btn) {
        btn.classList.add('hotkey-flash');
        setTimeout(() => btn.classList.remove('hotkey-flash'), 450);
    }
    if (input) {
        input.classList.add('hotkey-flash');
        setTimeout(() => input.classList.remove('hotkey-flash'), 450);
    }
}

function markNextNameInSelectedTable(side) {
    if (!selectedHotkeyTable || !document.body.contains(selectedHotkeyTable)) {
        selectedHotkeyTable = null;
        toastRateLimited('กรุณาเลือกตารางก่อนใช้คีย์ลัด', 'warning');
        return;
    }

    const colIndex = side === 'chaser' ? 0 : 2;
    const sideLabel = side === 'chaser' ? 'คนไล่' : 'คนยั้ง';
    const rows = Array.from(selectedHotkeyTable.querySelectorAll('tbody tr'));

    const targetRow = rows.find(tr => {
        const tds = tr.querySelectorAll('td');
        const td = tds[colIndex];
        if (!td) return false;
        const input = td.querySelector('input');
        const btn = td.querySelector('.btn-name-mark');
        if (!input || !btn) return false;
        if (!input.value.trim()) return false;
        return !btn.classList.contains('active');
    });

    if (!targetRow) {
        toastRateLimited(`${sideLabel} ของตารางนี้ติ๊กครบแล้ว`, 'info');
        return;
    }

    const td = targetRow.querySelectorAll('td')[colIndex];
    const input = td.querySelector('input');
    const btn = td.querySelector('.btn-name-mark');

    if (!btn.classList.contains('active')) {
        btn.classList.add('active');
        input.classList.add('name-input-marked');
        flashMarkedByHotkey(btn, input);
        playSound('click');
        saveData();
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function injectNameMarkStyles() {
    if (document.getElementById('name-mark-styles')) return;

    const style = document.createElement('style');
    style.id = 'name-mark-styles';
    style.textContent = `
        .name-field-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
        }

        .name-field-wrap input {
            flex: 1;
            min-width: 0;
        }

        .name-repeat-badge {
            min-width: 34px;
            height: 26px;
            padding: 0 8px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.74rem;
            font-weight: 800;
            color: #1d4ed8;
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
            border: 1px solid rgba(59,130,246,0.30);
            box-shadow: 0 6px 14px rgba(59,130,246,0.10);
            white-space: nowrap;
        }

        .duplicate-row-moved td {
            animation: duplicateRowMovedFlash .75s ease;
        }

        @keyframes duplicateRowMovedFlash {
            0% { transform: scale(1); box-shadow: inset 0 0 0 rgba(59,130,246,0); }
            35% { transform: scale(1.01); box-shadow: inset 0 0 0 999px rgba(191,219,254,0.55); }
            100% { transform: scale(1); box-shadow: inset 0 0 0 rgba(59,130,246,0); }
        }

        .btn-name-mark {
            width: 28px;
            height: 28px;
            min-width: 28px;
            border: 1px solid #84cc16;
            border-radius: 999px;
            background: linear-gradient(180deg, #f8fafc, #e2e8f0);
            color: #65a30d;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 6px 14px rgba(0,0,0,0.08);
            transition: all .18s ease;
        }

        .btn-name-mark:hover {
            transform: translateY(-1px) scale(1.04);
            box-shadow: 0 10px 18px rgba(0,0,0,0.12);
        }

        .btn-name-mark.active {
            border-color: #f59e0b;
            background: linear-gradient(135deg, #fde68a, #f59e0b);
            color: #7c2d12;
            box-shadow: 0 10px 20px rgba(245,158,11,0.28);
        }

        .name-input-marked {
            background: linear-gradient(135deg, rgba(254,240,138,0.65), rgba(253,224,71,0.30));
            border-color: #f59e0b !important;
            color: #92400e !important;
            font-weight: 800;
            box-shadow: inset 0 0 0 1px rgba(245,158,11,0.22), 0 6px 16px rgba(245,158,11,0.08);
        }
    `;
    document.head.appendChild(style);
}

function createNameCellHtml(value = "", marked = false, role = "") {
    return `
        <td>
            <div class="name-field-wrap">
                <button type="button" class="btn-name-mark ${marked ? 'active' : ''}" onclick="toggleNameMark(this)" title="กาทับชื่อนี้">
                    <i class="fas fa-check"></i>
                </button>
                <input type="text" value="${value}" data-name-role="${role}" oninput="handleNameInput(this)" class="${marked ? 'name-input-marked' : ''}">
                <span class="name-repeat-badge" style="display:none;"></span>
            </div>
        </td>`;
}

function normalizeDuplicateName(value) {
    return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function getNameInputsFromRow(row) {
    if (!row) return [];
    return Array.from(row.querySelectorAll('input[data-name-role]'));
}

function rowContainsDuplicateName(row, normalizedName, excludeInput = null) {
    if (!row || !normalizedName) return false;
    return getNameInputsFromRow(row).some(input => {
        if (excludeInput && input === excludeInput) return false;
        return normalizeDuplicateName(input.value) === normalizedName;
    });
}

function flashDuplicateMove(tr) {
    if (!tr) return;
    tr.classList.remove('duplicate-row-moved');
    void tr.offsetWidth;
    tr.classList.add('duplicate-row-moved');
    setTimeout(() => tr.classList.remove('duplicate-row-moved'), 900);
}

function moveRowToDuplicateGroup(inputEl) {
    const currentTr = inputEl ? inputEl.closest('tr') : null;
    const tbody = currentTr ? currentTr.parentElement : null;
    const normalizedName = normalizeDuplicateName(inputEl ? inputEl.value : "");
    if (!currentTr || !tbody || !normalizedName) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const currentIndex = rows.indexOf(currentTr);
    if (currentIndex === -1) return;

    let hasPreviousMatch = false;
    let lastMatchedRow = null;

    rows.forEach((row, index) => {
        if (row === currentTr) return;
        if (!rowContainsDuplicateName(row, normalizedName, inputEl)) return;
        if (index < currentIndex) hasPreviousMatch = true;
        if (hasPreviousMatch) lastMatchedRow = row;
    });

    if (!hasPreviousMatch || !lastMatchedRow) return;
    if (lastMatchedRow.nextElementSibling === currentTr) return;

    tbody.insertBefore(currentTr, lastMatchedRow.nextElementSibling);
    flashDuplicateMove(currentTr);
}

function updateDuplicateNameBadges(scope = null) {
    const tables = scope && scope.classList && scope.classList.contains('table-container')
        ? [scope]
        : Array.from(document.querySelectorAll('.table-container'));

    tables.forEach(table => {
        const counts = {};
        const sequence = {};
        const nameInputs = Array.from(table.querySelectorAll('input[data-name-role]'));

        nameInputs.forEach(input => {
            const normalizedName = normalizeDuplicateName(input.value);
            if (!normalizedName) return;
            counts[normalizedName] = (counts[normalizedName] || 0) + 1;
        });

        nameInputs.forEach(input => {
            const wrap = input.closest('.name-field-wrap');
            if (!wrap) return;

            let badge = wrap.querySelector('.name-repeat-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'name-repeat-badge';
                wrap.appendChild(badge);
            }

            const normalizedName = normalizeDuplicateName(input.value);
            if (!normalizedName || (counts[normalizedName] || 0) <= 1) {
                badge.style.display = 'none';
                badge.textContent = '';
                badge.title = '';
                return;
            }

            sequence[normalizedName] = (sequence[normalizedName] || 0) + 1;
            badge.style.display = 'inline-flex';
            badge.textContent = `#${sequence[normalizedName]}`;
            badge.title = `${input.value.trim()} ซ้ำ ${counts[normalizedName]} ครั้ง`;
        });
    });
}

function handleNameInput(inputEl) {
    moveRowToDuplicateGroup(inputEl);
    updateDuplicateNameBadges(inputEl.closest('.table-container'));
    saveData();
}

function toggleNameMark(btn) {
    playSound('click');
    const wrap = btn.closest('.name-field-wrap');
    const input = wrap ? wrap.querySelector('input') : null;
    const isActive = btn.classList.toggle('active');

    if (input) {
        input.classList.toggle('name-input-marked', isActive);
    }

    saveData();
}

// 3. ฟังก์ชันการทำงานของตาราง (ฉบับแก้ไขตำแหน่ง Sidebar)
function addTable(title = "", rows = null, isSilent = false) {
    if(!isSilent) playSound('woosh');
    
    const container = document.getElementById("tables-container");
    const newTableWrapper = document.createElement("div"); 
    newTableWrapper.classList.add("table-container", "table-card");
    
    // ตั้งค่า Layout ให้ขยายเท่ากัน (stretch)
    newTableWrapper.style.display = "flex";
    newTableWrapper.style.gap = "20px";
    newTableWrapper.style.alignItems = "stretch"; 
    newTableWrapper.style.opacity = '0';
    newTableWrapper.style.transform = 'translateY(20px)';

    injectNameMarkStyles();
    injectHotkeyTableStyles();

    const generateRowHtml = (r = ["", "", "", "", 0, 0]) => `
        <tr data-outcome="${r[3] || ''}">
            ${createNameCellHtml(r[0], !!r[4], 'chaser')}
            <td><input type="text" value="${r[1]}" oninput="saveData()" style="color:#2e7d32;"></td>
            ${createNameCellHtml(r[2], !!r[5], 'holder')}
            <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;

    let rowsHtml = rows ? rows.map(r => generateRowHtml(r)).join('') : generateRowHtml();
    
    // โครงสร้าง HTML: แบ่งฝั่งตาราง และ Sidebar (เลื่อนรายการลงมา 45px เพื่อให้ตรงกับแถวแรก)
    newTableWrapper.innerHTML = `
        <div class="table-main-content" style="flex: 1;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; gap:10px; flex-wrap:wrap;">
                <span class="profit-badge-live" style="color:white; padding:4px 12px; border-radius:20px; font-weight:bold;">฿0.00</span>
                <div style="display:flex; gap:8px; align-items:center; margin-left:auto;">
                    <button type="button" class="btn-hotkey-table" onclick="setSelectedHotkeyTable(this)" title="เลือกตารางนี้เพื่อใช้คีย์ลัด Q และ E">⌨️ ใช้คีย์ลัด</button>
                    <button class="btn-close-table" onclick="removeTable(this)" style="position:static;"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <input type="text" class="table-title-input" value="${title}" placeholder="ชื่อค่าย..." oninput="saveData()" style="width: 80%;">
            <table class="custom-table">
                <thead>
                    <tr class="winlose-row">
                        <th colspan="4" class="th-winlose">
                             <div class="winlose-note"><span class="note-pill"><i class="fas fa-info-circle"></i> วิธี : อย่าลืมกา แผลจาวออกด้วย</span></div>
                            <button class="btn-winlose btn-win" onclick="setOutcomeForTable(this, 'C')"><i class="fas fa-trophy"></i> ชนะ</button>
                            <button class="btn-winlose btn-lose" onclick="setOutcomeForTable(this, 'H')"><i class="fas fa-skull"></i> แพ้</button>
                        </th>
                    </tr>
                    <tr><th class="th-green">คนไล่</th><th class="th-orange">ราคา</th><th class="th-red">คนยั้ง</th><th class="th-purple">ลบ</th></tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <button class="btn-main" onclick="addRow(this.previousElementSibling)" style="width:100%; margin-top:10px; border: 1px dashed #2e7d32;">+ เพิ่มแผล</button>
        </div>
        
        <div class="table-summary-sidebar" style="width: 200px; background: #f8fafc; border-radius: 15px; padding: 15px; border: 1px solid #e2e8f0; font-size: 0.85rem; display: flex; flex-direction: column;">
            <div style="font-weight: bold; color: #1e293b; border-bottom: 2px solid #cbd5e1; margin-bottom: 10px; padding-bottom: 5px;">
                <i class="fas fa-users"></i> ยอดเล่น Real-Time
            </div>
            <div class="name-list-area" style="margin-top: 45px;">
                <p style="color: #94a3b8; font-style: italic;">รอข้อมูล...</p>
            </div>
        </div>
    `;
    
    container.appendChild(newTableWrapper);
    setTimeout(() => {
        newTableWrapper.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        newTableWrapper.style.opacity = '1';
        newTableWrapper.style.transform = 'translateY(0)';
    }, 50);
    saveData();
}

function handleClosingSuccess() {
    playSound('fanfare'); // เรียกผ่าน playSound
    launchConfetti();
}

function addRow(table) {
    playSound('click');
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    tr.dataset.outcome = "";
    injectNameMarkStyles();
    tr.innerHTML = `
        ${createNameCellHtml("", false, 'chaser')}
        <td><input type="text" oninput="saveData()" style="color:#2e7d32;"></td>
        ${createNameCellHtml("", false, 'holder')}
        <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>`;
    tbody.appendChild(tr);
    saveData();
}

function removeRow(btn) { 
    playSound('delete'); // <--- มั่นใจว่ามีบรรทัดนี้
    btn.closest('tr').remove(); 
    saveData(); 
}

function copyTableAsImage(tableElement) {
    playSound('popup'); // เล่นเสียงเปิดการทำงาน
    
    // ตั้งค่าชั่วคราวเพื่อให้รูปออกมาสวย (ลบปุ่มต่างๆ ออกจากรูป)
    const actionButtons = tableElement.querySelectorAll('button, .btn-close-table');
    actionButtons.forEach(btn => btn.style.visibility = 'hidden');

    html2canvas(tableElement, {
        backgroundColor: "#ffffff", // พื้นหลังขาวเพื่อให้เห็นชัด
        scale: 2, // เพิ่มความชัดของรูป
        logging: false,
        useCORS: true
    }).then(canvas => {
        // คืนค่าปุ่มต่างๆ ให้กลับมามองเห็นเหมือนเดิม
        actionButtons.forEach(btn => btn.style.visibility = 'visible');

        // แปลงเป็นไฟล์ภาพและดาวน์โหลด (วิธีที่ชัวร์ที่สุดสำหรับส่งใน Line)
        const link = document.createElement('a');
        const title = tableElement.querySelector('.table-title-input').value || "Bung-Fai";
        link.download = `ค่าย-${title}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        playSound('success'); // เสียงเมื่อสำเร็จ
        
        const alertBox = document.getElementById("auto-save-alert");
        alertBox.innerText = "📸 บันทึกรูปภาพลงเครื่องแล้ว!";
        alertBox.style.opacity = "1";
        setTimeout(() => alertBox.style.opacity = "0", 2000);
    });
}

function getPlayerRecords(playerName) {
  const rows = document.querySelectorAll(".table-row");
  const records = [];
  rows.forEach(row => {
    const from = row.querySelector(".player-from")?.textContent.trim();
    const to = row.querySelector(".player-to")?.textContent.trim();
    const price = row.querySelector(".player-price")?.textContent.trim();
    if (from?.includes(playerName)) {
      records.push({ role: "ไล่", other: to, price });
    } else if (to?.includes(playerName)) {
      records.push({ role: "ยั้ง", other: from, price });
    }
  });
  return records;
}

function getPlayerRecordsDetailed(playerName) {
  const records = [];
  document.querySelectorAll(".table-container").forEach(table => {
    const campName = table.querySelector(".table-title-input")?.value.trim() || "ไม่ระบุค่าย";
    table.querySelectorAll("tbody tr").forEach(tr => {
      const inputs = tr.querySelectorAll("input");
      if (inputs.length < 3) return;
      const from = inputs[0].value.trim();
      const price = inputs[1].value.trim();
      const to = inputs[2].value.trim();

      // ถ้าชื่อผู้เล่นอยู่ในฝั่งคนไล่หรือคนยั้ง ให้ดึงแถวนี้มาทั้งหมด
      if (from.includes(playerName) || to.includes(playerName)) {
        records.push({ campName, from, price, to });
      }
    });
  });
  return records;
}



function capturePlayerRow(playerName) {
  playSound('popup');
  const cleanName = playerName.replace(/^@+/, '');
  const campRecords = {};
  let grandTotal = 0;
  let totalRecords = 0; // ✅ นับจำนวนรายการทั้งหมด

  // 🔹 ดึงข้อมูลจากทุกค่าย
  document.querySelectorAll(".table-container").forEach(table => {
    const campName = table.querySelector(".table-title-input")?.value.trim() || "ไม่ระบุค่าย";
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(tr => {
      const inputs = tr.querySelectorAll("input");
      if (inputs.length < 3) return;

      const from = inputs[0].value.trim();
      let price = inputs[1].value.trim();
      const to = inputs[2].value.trim();

      // เพิ่มคำว่า “ชล” ถ้ามีแค่ตัวเลข ≥ 3 หลัก
      if (/^\d{3,}$/.test(price)) price += " ชล";

      // ถ้าผู้เล่นอยู่ในแถวนี้
      if (from.includes(playerName) || to.includes(playerName)) {
        if (!campRecords[campName]) campRecords[campName] = [];
        campRecords[campName].push({ from, price, to });
      }
    });
  });

    // 🧾 กล่องรวมผลทั้งหมด
  const captureDiv = document.createElement('div');
  captureDiv.style.width = '980px';
  captureDiv.style.padding = '42px 52px';
  captureDiv.style.background = '#ffffff';
  captureDiv.style.borderRadius = '26px';
  captureDiv.style.border = '1px solid rgba(15,23,42,0.08)';
  captureDiv.style.fontFamily = "'Kanit','Sarabun',sans-serif";
  captureDiv.style.textAlign = 'center';
  captureDiv.style.boxShadow = '0 28px 60px rgba(0,0,0,0.18)';

  let innerHTML = `
    <div class="cap-wrap">
      
    <style>
      .cap-wrap{width:100%;}
      .cap-banner{
        background: linear-gradient(90deg,#fbbf24,#f59e0b);
        color:#7c2d12;
        font-weight:900;
        font-size:2rem;
        padding:18px 22px;
        border-radius:18px;
        letter-spacing:0.2px;
        box-shadow: 0 18px 45px rgba(0,0,0,0.14);
      }
      .cap-sub{
        margin-top:14px;
        display:flex;
        justify-content:center;
        gap:10px;
        flex-wrap:wrap;
      }
      .cap-badge{
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding:8px 12px;
        border-radius:999px;
        background: rgba(255,255,255,0.95);
        border: 1px solid rgba(245,158,11,0.20);
        box-shadow: 0 12px 28px rgba(0,0,0,0.08);
        color:#334155;
        font-size:1.02rem;
        font-weight:700;
      }
      .cap-badge b{ color:#0f172a; font-weight:900; }
      .cap-alert{
        width:fit-content;
        max-width: 92%;
        margin: 10px auto 0;
        padding: 10px 14px;
        border-radius: 14px;
        background: rgba(34,197,94,0.10);
        border: 1px solid rgba(34,197,94,0.28);
        color:#065f46;
        font-weight:800;
        font-size: 0.98rem;
        line-height: 1.25rem;
        box-shadow: 0 14px 32px rgba(0,0,0,0.08);
      }
      .cap-alert i{ margin-right:8px; }
      .camp-card{
        width:88%;
        margin:18px auto;
        background:#ffffff;
        border:1px solid rgba(15,23,42,0.08);
        border-radius:18px;
        box-shadow:0 16px 38px rgba(0,0,0,0.10);
        overflow:hidden;
        text-align:left;
      }
      .camp-head{
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:12px 16px;
        background: linear-gradient(180deg,#fff7ed,#ffffff);
        border-bottom:1px solid rgba(15,23,42,0.06);
      }
      .camp-title{
        font-size:1.05rem;
        font-weight:900;
        color:#9a3412;
      }
      .camp-total{
        padding:7px 12px;
        border-radius:999px;
        background: rgba(34,197,94,0.10);
        border: 1px solid rgba(34,197,94,0.25);
        color:#065f46;
        font-weight:900;
        font-size:0.98rem;
      }
      .camp-table{
        width:100%;
        border-collapse:separate;
        border-spacing:0;
        table-layout: fixed;
        font-size:1rem;
        color:#0f172a;
      }
      .camp-table thead th{
        background:#fffbeb;
        font-weight:900;
        padding:10px 12px;
        border-bottom:1px solid rgba(15,23,42,0.08);
      }
      .camp-table tbody td{
        padding:10px 12px;
        border-bottom:1px solid rgba(15,23,42,0.06);
      }
      .camp-table tbody tr:nth-child(even) td{
        background: rgba(2,6,23,0.02);
      }
      .td-center{text-align:center;}

      .price-cell{
        width:100%;
        display:flex;
        justify-content:center;
        align-items:center;
        text-align:center;
        font-variant-numeric: tabular-nums;
      }

      /* --- Fix: force header price center --- */

      /* --- Align: 'คนยั้ง' (3rd column) to far right --- */
      .camp-table thead th:nth-child(3),
      .camp-table tbody td:nth-child(3){
        text-align:right !important;
      }
      .camp-table thead th:nth-child(3){ padding-right:16px; }
      .camp-table tbody td:nth-child(3){ padding-right:16px; }

      .camp-table thead th:nth-child(2){ text-align:center !important; }

      /* --- Fix: center price column robustly --- */
      .camp-table th:nth-child(2),
      .camp-table td:nth-child(2){
        text-align:center !important;
        font-variant-numeric: tabular-nums;
      }
      .grand-card{
        width:88%;
        margin:26px auto 0;
        padding:18px 20px;
        border-radius:18px;
        background: linear-gradient(180deg,#fff7ed,#ffffff);
        border:1px solid rgba(245,158,11,0.18);
        text-align:center;
        box-shadow:0 16px 40px rgba(0,0,0,0.10);
      }
      .grand-num{
        font-size:2.7rem;
        font-weight:1000;
        color:#0f172a;
        letter-spacing:0.3px;
      }
      .grand-meta{
        color:#475569;
        margin-top:6px;
        font-size:1rem;
        font-weight:700;
      }
      .cap-foot{
        margin-top:18px;
        font-size:0.9rem;
        color:#94a3b8;
        letter-spacing:1px;
      }
    </style>

      <div class="cap-banner">รายการเล่นลูกค้า</div>
      <div class="cap-sub">
        <span class="cap-badge">👤 คุณ <b>${cleanName}</b> ✏️</span>
      </div>
    
      <div class="cap-alert"><i class="fas fa-circle-exclamation"></i> ห้ามเล่นเกินเครดิตที่มี หากเล่นเกินกรุณาฝากยอดเข้ามาด้วยนะครับ</div>
</div>
  `;

  // 🔹 สร้างทีละค่ายพร้อมเส้นคั่น
  const campEntries = Object.entries(campRecords);
  if (campEntries.length === 0) {
    innerHTML += `
      <div style="margin-top:40px;color:#94a3b8;font-style:italic;">
        ยังไม่มีรายการเล่นในระบบ
      </div>`;
  } else {
    campEntries.forEach(([campName, records], idx) => {
      let campTotal = 0;
      totalRecords += records.length;

      const rowsHTML = records.map(r => {
        const nums = r.price.match(/\d+/g);
        if (nums) {
          nums.forEach(n => {
            if (parseInt(n) >= 100) campTotal += parseFloat(n); // ✅ นับเฉพาะ 3 หลักขึ้นไป
          });
        }
        return `
          <tr>
            <td>${r.from}</td>
            <td><div class="price-cell">${r.price}</div></td>
            <td>${r.to}</td>
          </tr>`;
      }).join('');

      grandTotal += campTotal;

            innerHTML += `
        <div class="camp-card">
          <div class="camp-head">
            <div class="camp-title">🏕️ ค่าย: ${campName}</div>
            <div class="camp-total">รวมค่ายนี้ ${campTotal.toLocaleString()}</div>
          </div>
          <table class="camp-table">
            <colgroup>
              <col style="width:40%;">
              <col style="width:20%;">
              <col style="width:40%;">
            </colgroup>
            <thead>
              <tr>
                <th>คนไล่</th>
                <th><div class="price-cell">ราคา</div></th>
                <th>คนยั้ง</th>
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
          </table>
        </div>
      `;
    });
  }

    // 🔸 รวมทั้งหมด
  innerHTML += `
    <div class="grand-card">
      <div class="grand-num">รวมทั้งหมด ${grandTotal.toLocaleString()}</div>
      <div class="grand-meta">รวมทั้งหมด ${totalRecords} รายการ</div>
      <div class="cap-foot">ADMIN ROCKET SYSTEM - เถ้าแก่น้อย</div>
    </div>
  `;

  captureDiv.innerHTML = innerHTML;
  document.body.appendChild(captureDiv);

  // 📸 แคปและคัดลอกลงคลิปบอร์ด
  html2canvas(captureDiv, { scale: 3, backgroundColor: "#ffffff" }).then(canvas => {
    canvas.toBlob(blob => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item]).then(() => {
        showToast(`📋 คัดลอกรูปของ ${cleanName} แล้ว!`);
        playSound('success');
        captureDiv.remove();
      });
    });
  });
}








function removeTable(button) {
    const tableContainer = button.closest('.table-container');
    const title = tableContainer.querySelector('.table-title-input').value || "ไม่ระบุชื่อ";
    const calculatedProfit = calculateTableProfit(tableContainer);

    showConfirmModal(title, calculatedProfit, (finalProfit) => {
        // --- จังหวะที่ 1: แจ้งเตือนเมื่อเห็นกำไร ---
        if (finalProfit > 0) {
            playSound('fanfare'); // เสียง https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3
            launchConfetti();
            showToast(`ปิดยอดค่าย: ${title} เรียบร้อย! กำไร ฿${finalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
        } else {
            playSound('success');
            showToast(`ปิดยอดค่าย: ${title} (ไม่มีกำไร)`);
        }

        // ประมวลผลข้อมูล
        const rowsData = [];
        tableContainer.querySelectorAll("tbody tr").forEach(tr => {
            const cells = tr.querySelectorAll("input");
            rowsData.push([cells[0]?.value || "", cells[1]?.value || "", cells[2]?.value || ""]);
        });

        // บันทึกประวัติ
        historyData.push({ title, rows: rowsData, profit: finalProfit, timestamp: new Date().toLocaleString("th-TH") });
        localStorage.setItem("historyData", JSON.stringify(historyData));
        totalDeletedProfit += finalProfit;
        
        // --- จังหวะที่ 2: ปิดยอดเสร็จสิ้น (ลบตารางออกจากจอ) ---
        closedCampCount++;                 // ✅ นับค่ายที่ปิดยอด
        updateClosedCampDisplay();         // ✅ อัปเดต Dashboard
        
        if (selectedHotkeyTable === tableContainer) {
            selectedHotkeyTable = null;
        }
        tableContainer.remove();
        playSound('chime');
        
        saveData();
    });
}

// --- 4. เพิ่มเสียงตอนกู้คืนข้อมูล ---
function restoreLastDeleted() {
    if (isRestoring) return;
    if (historyData.length === 0) return;

    isRestoring = true;

    const last = historyData.pop();
    totalDeletedProfit -= last.profit;

    // ✅ ลดจำนวนค่ายที่ปิด
    closedCampCount = Math.max(0, closedCampCount - 1);
    updateClosedCampDisplay();

    addTable(last.title, last.rows, true);
    localStorage.setItem("historyData", JSON.stringify(historyData));
    updateDashboardStats();

    setTimeout(() => { isRestoring = false; }, 500);
}


function handleGlobalKeyDown(e) {
    const isTypingTarget = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable;
    const modalActive = document.getElementById('custom-modal')?.classList.contains('active');

    if (!modalActive && !isTypingTarget && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) {
        const key = e.key.toLowerCase();
        if (key === 'q') {
            e.preventDefault();
            markNextNameInSelectedTable('chaser');
            return;
        }
        if (key === 'e') {
            e.preventDefault();
            markNextNameInSelectedTable('holder');
            return;
        }
    }

    if (e.target.tagName !== "INPUT") return;
    const currentInput = e.target;
    const currentTr = currentInput.closest('tr');
    if(!currentTr) return;
    const inputsInRow = Array.from(currentTr.querySelectorAll("input"));
    const colIndex = inputsInRow.indexOf(currentInput);

    if (e.key === "ArrowDown") {
        const nextTr = currentTr.nextElementSibling;
        if (nextTr) { e.preventDefault(); nextTr.querySelectorAll("input")[colIndex]?.focus(); }
    } else if (e.key === "ArrowUp") {
        const prevTr = currentTr.previousElementSibling;
        if (prevTr) { e.preventDefault(); prevTr.querySelectorAll("input")[colIndex]?.focus(); }
    }
}

function updateDashboardStats() {
    const pEl = document.getElementById("total-profit-display");
    if(pEl) pEl.innerText = `฿${totalDeletedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

function showHistory() {
    if (historyData.length === 0) return showSimpleModal("แจ้งเตือน", "ไม่มีประวัติ");
    playSound('popup');
    let newWindow = window.open("", "History", "width=1100,height=900");
    
    let content = `
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ประวัติการปิดยอด - ADMIN ROCKET</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <style>
            :root{
              --bg1:#071021;
              --bg2:#0c1a33;
              --card:#ffffff;
              --muted:#64748b;
              --text:#0f172a;
              --line:rgba(15,23,42,0.10);
              --shadow: 0 24px 60px rgba(0,0,0,0.22);
              --shadow2: 0 14px 35px rgba(0,0,0,0.14);
              --gold1:#fbbf24;
              --gold2:#f59e0b;
              --green:#22c55e;
              --red:#ef4444;
              --chip:#e2e8f0;
            }

            *{ box-sizing: border-box; }
            body{
              font-family: 'Kanit', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
              margin:0;
              padding:36px 18px 60px;
              color: var(--text);
              background:
                radial-gradient(1200px 600px at 20% 0%, rgba(251,191,36,0.18), transparent 50%),
                radial-gradient(900px 520px at 90% 10%, rgba(59,130,246,0.16), transparent 50%),
                linear-gradient(135deg, var(--bg1), var(--bg2));
            }

            .page{
              max-width: 1120px;
              margin: 0 auto;
            }

            .topbar{
              position: sticky;
              top: 0;
              z-index: 50;
              padding: 14px 0 18px;
              backdrop-filter: blur(12px);
            }

            .topbar-inner{
              display:flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              padding: 14px 16px;
              border-radius: 18px;
              background: rgba(255,255,255,0.10);
              border: 1px solid rgba(255,255,255,0.12);
              box-shadow: var(--shadow2);
            }

            .title{
              display:flex;
              align-items:center;
              gap: 10px;
              color:#fff;
              font-weight: 900;
              font-size: 1.35rem;
              letter-spacing: 0.2px;
            }
            .title i{ color: rgba(251,191,36,0.95); }

            .actions{
              display:flex;
              gap: 10px;
              align-items:center;
            }

            .btn{
              appearance: none;
              border: 1px solid rgba(255,255,255,0.16);
              background: rgba(255,255,255,0.10);
              color:#fff;
              padding: 10px 14px;
              border-radius: 14px;
              cursor: pointer;
              font-weight: 800;
              display:inline-flex;
              align-items:center;
              gap: 8px;
              transition: transform .14s ease, box-shadow .14s ease, background .14s ease, border-color .14s ease;
              user-select:none;
            }
            .btn:hover{
              transform: translateY(-1px);
              box-shadow: 0 16px 35px rgba(0,0,0,0.25);
              background: rgba(255,255,255,0.16);
              border-color: rgba(255,255,255,0.22);
            }
            .btn:active{ transform: translateY(0) scale(0.99); }

            .btn-primary{
              border-color: rgba(251,191,36,0.35);
              background: linear-gradient(90deg, rgba(251,191,36,0.95), rgba(245,158,11,0.92));
              color:#3b1d00;
            }
            .btn-primary:hover{
              background: linear-gradient(90deg, rgba(251,191,36,1), rgba(245,158,11,0.98));
            }

            .history-wrap{ margin-top: 14px; }

            .table-card{
              background: rgba(255,255,255,0.95);
              border: 1px solid rgba(15,23,42,0.10);
              border-radius: 22px;
              padding: 18px 18px 16px;
              margin: 18px 0 22px;
              box-shadow: var(--shadow);
              position: relative;
              overflow: hidden;
            }
            .table-card::before{
              content:"";
              position:absolute;
              left:0; right:0; top:0;
              height: 5px;
              background: linear-gradient(90deg, var(--gold1), var(--gold2));
              opacity: 0.95;
            }

            .history-meta-row{
              display:flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 12px;
            }
            .timestamp-label{
              color: var(--muted);
              font-size: 0.95rem;
              font-weight: 600;
              display:flex;
              align-items:center;
              gap: 8px;
            }
            .meta-chip{
              display:inline-flex;
              align-items:center;
              gap: 8px;
              padding: 8px 12px;
              border-radius: 999px;
              background: rgba(2,6,23,0.04);
              border: 1px solid rgba(2,6,23,0.08);
              color: #0f172a;
              font-weight: 800;
              font-size: 0.95rem;
              white-space: nowrap;
            }
            .meta-chip.positive{
              background: rgba(34,197,94,0.10);
              border-color: rgba(34,197,94,0.22);
              color: #065f46;
            }
            .meta-chip.negative{
              background: rgba(239,68,68,0.10);
              border-color: rgba(239,68,68,0.20);
              color: #7f1d1d;
            }

            .table-title-display{
              margin: 10px 0 14px;
              padding: 12px 14px;
              border-radius: 16px;
              background: linear-gradient(180deg, rgba(255,247,237,1), rgba(255,255,255,1));
              border: 1px solid rgba(245,158,11,0.16);
              color: #7c2d12;
              font-size: 1.20rem;
              font-weight: 900;
              text-align:center;
              letter-spacing: 0.2px;
            }

            .custom-table{
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              overflow: hidden;
              border-radius: 16px;
              border: 1px solid rgba(15,23,42,0.10);
              table-layout: fixed;
              background: #fff;
            }

            .custom-table thead th{
              padding: 12px 12px;
              color: #fff;
              font-weight: 900;
              font-size: 0.98rem;
              letter-spacing: 0.2px;
            }
            .custom-table thead th:nth-child(1){ text-align:left; padding-left:16px; background: linear-gradient(90deg,#0f3a2a,#14532d); }
            .custom-table thead th:nth-child(2){ text-align:center; background: linear-gradient(90deg,#b38728,#d0a44b); }
            .custom-table thead th:nth-child(3){ text-align:right; padding-right:16px; background: linear-gradient(90deg,#9f1239,#be123c); }
            .custom-table thead th:nth-child(4){ text-align:center; background: linear-gradient(90deg,#1f2937,#111827); }

            .custom-table tbody td{
              padding: 14px 12px;
              background: #f8fafc;
              border-top: 1px solid rgba(15,23,42,0.06);
              font-weight: 700;
              color: #0f172a;
              font-size: 0.98rem;
              overflow:hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .custom-table tbody tr:nth-child(even) td{ background: rgba(2,6,23,0.02); }

            .custom-table tbody td:nth-child(1){ text-align:left; padding-left:16px; }
            .custom-table tbody td:nth-child(2){ text-align:center; font-variant-numeric: tabular-nums; }
            .custom-table tbody td:nth-child(3){ text-align:right; padding-right:16px; }
            .custom-table tbody td:nth-child(4){ text-align:center; }

            .price-accent{ color:#b3000c; font-weight: 900; }

            .status-group{
              display:flex;
              align-items:center;
              justify-content:center;
              gap: 10px;
            }
            .status-icon{ color: #94a3b8; font-size: 1.1rem; }

            .btn-copy-item{
              background: rgba(34,197,94,0.10);
              color: #16a34a;
              border: 1px solid rgba(34,197,94,0.25);
              width: 36px;
              height: 36px;
              border-radius: 12px;
              cursor: pointer;
              display:flex;
              align-items:center;
              justify-content:center;
              transition: transform .14s ease, box-shadow .14s ease, background .14s ease, color .14s ease;
            }
            .btn-copy-item:hover{
              transform: translateY(-1px);
              background: #16a34a;
              color: #fff;
              box-shadow: 0 14px 30px rgba(22,163,74,0.25);
            }

            .note{
              margin: 10px 0 0;
              color: rgba(255,255,255,0.72);
              text-align:center;
              font-weight: 600;
              font-size: 0.95rem;
            }

            @media (max-width: 740px){
              body{ padding: 18px 12px 40px; }
              .title{ font-size: 1.1rem; }
              .custom-table thead th, .custom-table tbody td{ font-size: 0.92rem; }
            }

            @media print{
              .no-print{ display:none !important; }
              body{ background:#fff; padding:0; }
              .topbar{ position: static; backdrop-filter: none; }
              .topbar-inner{ background:#fff; border:none; box-shadow:none; }
              .title{ color:#0f172a; }
              .note{ color:#475569; }
              .table-card{ box-shadow:none; }
            }
        </style>
    </head>
    <body>
      <div class="page">
        <div class="topbar no-print">
          <div class="topbar-inner">
            <div class="title"><i class="fa-solid fa-clock-rotate-left"></i> ประวัติการคิดยอดทั้งหมด</div>
            <div class="actions">
              <button class="btn btn-primary" onclick="window.print()"><i class="fa-solid fa-print"></i> พิมพ์ประวัติ</button>
            </div>
          </div>
          <div class="note">ADMIN ROCKET SYSTEM</div>
        </div>

        <div class="history-wrap">
`;

    // ค้นหาส่วนนี้ในฟังก์ชัน showHistory ของคุณ
    historyData.slice().reverse().forEach((h, tIdx) => {
        let rowsHtml = h.rows.map((r, rIdx) => {
            
            // --- ส่วนที่แก้ไขใหม่: ให้ "ชล" อยู่ข้างหน้าตัวเลขล้วน ---
            let displayPrice = r[1] || '0';
            
            // ตรวจสอบว่าในช่องราคามีเฉพาะตัวเลขเท่านั้น
            if (displayPrice.trim() !== "" && /^\d+$/.test(displayPrice.trim())) {
                displayPrice = "ชล " + displayPrice; // เปลี่ยนจากเดิมที่ต่อท้าย มาไว้ข้างหน้าแทน
            }
            // -------------------------------------------------------
    
            return `
                <tr id="row-${tIdx}-${rIdx}">
                    <td>${r[0] || '-'}</td>
                    <td><span class="price-accent">${displayPrice}</span></td>
                    <td>${r[2] || '-'}</td>
                    <td>
                        <div class="status-group">
                            <i class="fas fa-check-circle status-icon"></i>
                            <button class="btn-copy-item no-print" onclick="copySingleRow('${tIdx}-${rIdx}', '${h.title}', '${h.timestamp}')" title="ก๊อปรูปแผลนี้">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        content += `
        <div class="table-card">
            <div class="history-meta-row">
                <div class="timestamp-label"><i class="far fa-clock"></i> ปิดยอดเมื่อ: ${h.timestamp}</div>
                <div class="meta-chip ${h.profit >= 0 ? "positive" : "negative"}">${h.profit >= 0 ? "กำไร" : "ขาดทุน"}: ฿${Math.abs(h.profit).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
            </div>
            <div class="table-title-display">${h.title || 'ไม่ระบุชื่อค่าย'}</div>
            <table class="custom-table">
                <thead>
                    <tr>
                        <th class="th-green">คนไล่</th>
                        <th class="th-orange">ราคา</th>
                        <th class="th-red">คนยั้ง</th>
                        <th class="th-dark">สถานะ</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>`;
    });

    content += `
        <script>
            function copySingleRow(id, title, time) {
                const row = document.getElementById('row-' + id);
                const tempDiv = document.createElement('div');
                
                tempDiv.style.cssText = "position:fixed; top:-9999px; width:800px; padding:30px; background:white; border-radius:20px; font-family:'Sarabun';";
                
                tempDiv.innerHTML = \`
                    <div style="display:flex; justify-content:flex-start; align-items:center; margin-bottom:15px;">
                        <div style="color:#64748b; font-size:16px; font-weight:bold;">🕒 ปิดยอดเมื่อ: \${time}</div>
                    </div>
                    <div style="text-align:center; font-size:26px; font-weight:bold; color:#b3000c; background:#fff5f5; padding:15px; border-radius:15px; margin-bottom:20px; border:2px solid #ffcccc;">
                        \${title}
                    </div>
                    <table style="width:100%; border-collapse:separate; border-spacing:0 10px;">
                        <thead>
                            <tr style="color:white; text-align:center; font-size:18px;">
                                <th style="background:#14452f; padding:15px; border-radius:12px 0 0 12px;">คนไล่</th>
                                <th style="background:#bf953f; padding:15px;">ราคา</th>
                                <th style="background:#b3000c; padding:15px;">คนยั้ง</th>
                                <th style="background:#2d3436; padding:15px; border-radius:0 12px 12px 0;">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="text-align:center; font-weight:700; font-size:22px;">
                                <td style="padding:20px; background:#f8fafc; border:1px solid #edf2f7; border-radius:10px;">\${row.cells[0].innerText}</td>
                                <td style="padding:20px; background:#f8fafc; border:1px solid #edf2f7; color:#b3000c;">\${row.cells[1].innerText}</td>
                                <td style="padding:20px; background:#f8fafc; border:1px solid #edf2f7;">\${row.cells[2].innerText}</td>
                                <td style="padding:20px; background:#f8fafc; border:1px solid #edf2f7; color:#22c55e;">✔</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="text-align:center; margin-top:20px; color:#cbd5e1; font-size:14px; letter-spacing:1px;">ADMIN ROCKET PREMIUM - SYSTEM DATA</div>
                \`;
                
                document.body.appendChild(tempDiv);

                html2canvas(tempDiv, { scale: 3, backgroundColor: "#ffffff" }).then(canvas => {
                    canvas.toBlob(blob => {
                        try {
                            const item = new ClipboardItem({ "image/png": blob });
                            navigator.clipboard.write([item]).then(() => {
                                alert("📋 คัดลอกรายการแล้ว! สามารถกด Ctrl + V เพื่อส่งลงไลน์ได้เลย");
                                document.body.removeChild(tempDiv);
                            });
                        } catch (err) {
                            console.error("Clipboard Error:", err);
                            alert("เบราว์เซอร์ไม่รองรับการก๊อปรูปโดยตรง กรุณาใช้ Google Chrome");
                        }
                    }, "image/png");
                });
            }
        </script>
            </div>
      </div>
    </body></html>`;
    
    newWindow.document.write(content);
    newWindow.document.close();
}

function showConfirmModal(title, profit, callback) {
    if (isProcessingModal) return; 
    playSound('popup');
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = "ยืนยันการปิดยอด";
    document.getElementById('modal-msg').innerHTML = `ค่าย: <b>${title}</b><br>กำไร: <span style="color:green; font-size:1.5rem;">฿${profit.toFixed(2)}</span>`;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";

    const handleAction = (val) => {
        if (isProcessingModal) return;
        isProcessingModal = true;
        closeModal();
        callback(val);
        setTimeout(() => { isProcessingModal = false; }, 500);
    };

    const btnCancel = createModalBtn("ยกเลิก (Esc)", "btn-cancel", () => closeModal());
    const btnNo = createModalBtn("ไม่คิดยอด (จาว)", "btn-confirm", () => handleAction(0));
    btnNo.style.background = "#e74c3c"; btnNo.style.color = "white";
    const btnOk = createModalBtn("ตกลง (Enter)", "btn-confirm", () => handleAction(profit));

    actions.append(btnCancel, btnNo, btnOk);

    currentModalKeyHandler = (e) => {
        if (e.key === "Enter") { e.preventDefault(); btnOk.click(); }
        else if (e.key.toLowerCase() === "e") { e.preventDefault(); btnNo.click(); }
        else if (e.key === "Escape") { closeModal(); }
    };
    window.addEventListener('keydown', currentModalKeyHandler);
    modal.classList.add('active');
}

function createModalBtn(text, className, onClick) {
    const btn = document.createElement("button");
    btn.innerText = text; btn.className = `btn-modal ${className}`; btn.onclick = onClick;
    return btn;
}

function showSimpleModal(title, msg) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerHTML = msg;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = "";
    actions.append(createModalBtn("ตกลง", "btn-confirm", closeModal));
    modal.classList.add('active');
}

function closeModal() { 
    playSound('click'); // เสียงตอนกดปิด Modal
    document.getElementById('custom-modal').classList.remove('active'); 
    window.removeEventListener('keydown', currentModalKeyHandler);
}

// แก้ไขฟังก์ชันล้างข้อมูลให้ใช้ Modal สวยๆ
function clearAllHistory() {
    playSound('clear');

    showConfirmModal("ยืนยันการล้างข้อมูล", 0, () => {
        localStorage.clear();

        // ✅ รีเซ็ตค่าทาง Logic
        closedCampCount = 0;
        updateClosedCampDisplay();

        playSound('success');
        setTimeout(() => location.reload(), 500);
    });
}


function openStopwatchWindow() {
    const win = window.open("", "_blank", "width=550,height=700");
    if (!win) {
        alert("กรุณาอนุญาต Pop-up เพื่อใช้งานตัวจับเวลา");
        return;
    }

    const html = `
    <html>
    <head>
        <title>ระบบจับเวลา PRO - ADMIN ROCKET</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root{
              --bg1:#071021;
              --bg2:#0c1a33;
              --card: rgba(255,255,255,0.08);
              --card2: rgba(255,255,255,0.06);
              --line: rgba(255,255,255,0.12);
              --text:#ffffff;
              --muted: rgba(255,255,255,0.70);
              --shadow: 0 22px 55px rgba(0,0,0,0.35);
              --shadow2: 0 14px 35px rgba(0,0,0,0.25);
              --gold1:#fbbf24;
              --gold2:#f59e0b;
              --green:#22c55e;
              --red:#ef4444;
              --slate:#94a3b8;
              --ink:#0f172a;
            }
            *{ box-sizing:border-box; }
            body{
              margin:0;
              padding: 22px 16px 20px;
              font-family: 'Kanit', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
              color: var(--text);
              background:
                radial-gradient(900px 520px at 18% 0%, rgba(251,191,36,0.18), transparent 55%),
                radial-gradient(880px 520px at 92% 10%, rgba(59,130,246,0.16), transparent 55%),
                linear-gradient(135deg, var(--bg1), var(--bg2));
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: geometricPrecision;
            }

            .shell{
              max-width: 720px;
              margin: 0 auto;
            }

            .topbar{
              position: sticky;
              top: 0;
              z-index: 50;
              padding-bottom: 14px;
              backdrop-filter: blur(12px);
            }

            .topbar-inner{
              display:flex;
              align-items:center;
              justify-content: space-between;
              gap: 10px;
              padding: 14px 14px;
              border-radius: 18px;
              background: rgba(255,255,255,0.08);
              border: 1px solid rgba(255,255,255,0.12);
              box-shadow: var(--shadow2);
            }

            .title{
              display:flex;
              align-items:center;
              gap: 10px;
              font-weight: 900;
              letter-spacing: 0.2px;
              font-size: 1.20rem;
              color: #fff;
            }
            .title i{ color: rgba(251,191,36,0.95); }

            .pill{
              display:inline-flex;
              align-items:center;
              gap: 8px;
              padding: 8px 12px;
              border-radius: 999px;
              background: rgba(255,255,255,0.06);
              border: 1px solid rgba(255,255,255,0.12);
              color: rgba(255,255,255,0.82);
              font-weight: 800;
              font-size: 0.92rem;
              white-space: nowrap;
            }

            .stack{ display:flex; flex-direction:column; gap: 14px; }

            .timer-card{
              background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
              border: 1px solid rgba(255,255,255,0.14);
              border-radius: 22px;
              padding: 16px;
              box-shadow: var(--shadow);
              position: relative;
              overflow: hidden;
            }
            .timer-card::before{
              content:"";
              position:absolute;
              left:0; right:0; top:0;
              height: 4px;
              background: linear-gradient(90deg, var(--gold1), var(--gold2));
              opacity: 0.95;
            }

            .camp-row{
              display:flex;
              align-items:center;
              justify-content: space-between;
              gap: 10px;
              margin-bottom: 12px;
            }

            .camp-name-input{
              flex: 1;
              min-width: 0;
              background: rgba(2,6,23,0.35);
              border: 1px solid rgba(255,255,255,0.14);
              border-radius: 14px;
              padding: 10px 12px;
              color: #e5e7eb;
              font-weight: 800;
              font-size: 1.02rem;
              outline: none;
            }
            .camp-name-input::placeholder{ color: rgba(255,255,255,0.45); font-weight:700; }
            .camp-name-input:focus{
              border-color: rgba(251,191,36,0.40);
              box-shadow: 0 0 0 4px rgba(251,191,36,0.12);
            }

            .camp-actions{
              display:flex;
              align-items:center;
              gap: 10px;
              flex-shrink: 0;
            }

            .status-pill{
              display:inline-flex;
              align-items:center;
              gap: 8px;
              padding: 8px 10px;
              border-radius: 999px;
              border: 1px solid rgba(255,255,255,0.14);
              background: rgba(255,255,255,0.06);
              color: rgba(255,255,255,0.82);
              font-weight: 900;
              font-size: 0.90rem;
            }
            .dot{
              width: 8px;
              height: 8px;
              border-radius: 999px;
              background: rgba(148,163,184,0.9);
              box-shadow: 0 0 0 4px rgba(148,163,184,0.10);
            }
            .status-running .dot{
              background: rgba(34,197,94,1);
              box-shadow: 0 0 0 4px rgba(34,197,94,0.14);
            }
            .status-paused .dot{
              background: rgba(245,158,11,1);
              box-shadow: 0 0 0 4px rgba(245,158,11,0.14);
            }

            .timer-display{
              font-variant-numeric: tabular-nums;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              font-size: 3.2rem;
              font-weight: 900;
              text-align:center;
              padding: 18px 14px;
              border-radius: 18px;
              background: rgba(2,6,23,0.40);
              border: 1px solid rgba(255,255,255,0.12);
              letter-spacing: 1px;
              color: #ffffff;
            }

            .controls{
              margin-top: 12px;
              display:flex;
              gap: 10px;
              align-items:center;
              justify-content:center;
            }

            .btn{
              border: 1px solid rgba(255,255,255,0.14);
              background: rgba(255,255,255,0.08);
              color:#fff;
              border-radius: 14px;
              cursor: pointer;
              font-weight: 900;
              padding: 12px 14px;
              display:inline-flex;
              align-items:center;
              justify-content:center;
              gap: 8px;
              transition: transform .14s ease, box-shadow .14s ease, background .14s ease, border-color .14s ease, filter .14s ease;
              user-select:none;
            }
            .btn:hover{
              transform: translateY(-1px);
              box-shadow: 0 16px 35px rgba(0,0,0,0.28);
              background: rgba(255,255,255,0.12);
              border-color: rgba(255,255,255,0.20);
            }
            .btn:active{ transform: translateY(0) scale(0.99); }

            .btn-main{
              flex: 1;
              border-color: rgba(34,197,94,0.28);
              background: linear-gradient(90deg, rgba(34,197,94,0.95), rgba(16,185,129,0.92));
              color: #052e16;
            }
            .btn-main:hover{ filter: brightness(1.03); }

            .btn-reset{
              width: 128px;
              background: rgba(148,163,184,0.16);
              border-color: rgba(148,163,184,0.22);
            }

            .btn-copy{
              width: 46px;
              padding: 12px 0;
              background: rgba(59,130,246,0.16);
              border-color: rgba(59,130,246,0.22);
            }

            .btn-delete{
              width: 42px;
              height: 42px;
              border-radius: 14px;
              background: rgba(239,68,68,0.14);
              border: 1px solid rgba(239,68,68,0.24);
              color: #fecaca;
              display:flex;
              align-items:center;
              justify-content:center;
              cursor:pointer;
              transition: transform .14s ease, background .14s ease, box-shadow .14s ease;
            }
            .btn-delete:hover{
              transform: translateY(-1px);
              background: rgba(239,68,68,0.22);
              box-shadow: 0 14px 30px rgba(239,68,68,0.16);
            }

            .btn-add{
              margin-top: 14px;
              width: 100%;
              padding: 14px 14px;
              border-radius: 18px;
              border: 1px dashed rgba(255,255,255,0.22);
              background: rgba(255,255,255,0.06);
              color: rgba(255,255,255,0.86);
              font-weight: 900;
              cursor:pointer;
              display:flex;
              align-items:center;
              justify-content:center;
              gap: 10px;
              transition: transform .14s ease, background .14s ease, border-color .14s ease;
              user-select:none;
            }
            .btn-add:hover{
              transform: translateY(-1px);
              background: rgba(255,255,255,0.10);
              border-color: rgba(251,191,36,0.35);
            }

            /* Toast */
            #toast{
              position: fixed;
              left: 50%;
              bottom: 18px;
              transform: translateX(-50%);
              padding: 10px 14px;
              border-radius: 999px;
              background: rgba(0,0,0,0.55);
              color:#fff;
              font-weight: 800;
              font-size: 0.95rem;
              border: 1px solid rgba(255,255,255,0.18);
              box-shadow: 0 18px 45px rgba(0,0,0,0.35);
              opacity: 0;
              pointer-events: none;
              transition: opacity .18s ease, transform .18s ease;
            }
            #toast.show{ opacity:1; transform: translateX(-50%) translateY(-2px); }

            @media (max-width: 560px){
              body{ padding: 18px 12px 18px; }
              .timer-display{ font-size: 2.8rem; }
              .btn-reset{ width: 110px; }
            }
        </style>
    </head>
    <body>
      <div class="shell">
        <div class="topbar">
          <div class="topbar-inner">
            <div class="title"><i class="fas fa-stopwatch"></i> จับเวลารายค่าย</div>
            <div class="pill"><i class="fa-solid fa-bolt"></i> PRO</div>
          </div>
        </div>

        <div id="timers-container" class="stack"></div>

        <button class="btn-add" onclick="createNewTimer()">
          <i class="fas fa-plus-circle"></i> เพิ่มค่ายใหม่
        </button>

        <div id="toast">คัดลอกแล้ว</div>

        <script>
          let timerCount = 0;

          function showToast(msg){
            const t = document.getElementById('toast');
            if(!t) return;
            t.textContent = msg;
            t.classList.add('show');
            clearTimeout(t._to);
            t._to = setTimeout(()=> t.classList.remove('show'), 1200);
          }

          function formatTime(ms) {
            const totalSeconds = Math.floor(ms / 1000);
            const tenths = Math.floor((ms % 1000) / 100);
            return totalSeconds.toString().padStart(2, '0') + "." + tenths;
          }

          function setStatus(pill, state){
            pill.classList.remove('status-running','status-paused');
            const txt = pill.querySelector('.txt');
            if(state === 'running'){
              pill.classList.add('status-running');
              txt.textContent = 'กำลังจับเวลา';
            }else if(state === 'paused'){
              pill.classList.add('status-paused');
              txt.textContent = 'หยุดชั่วคราว';
            }else{
              txt.textContent = 'พร้อม';
            }
          }

          function createNewTimer() {
            timerCount++;
            const container = document.getElementById('timers-container');
            const card = document.createElement('div');
            card.className = 'timer-card';
            card.id = 'timer-card-' + timerCount;

            let startTime = 0;
            let elapsedTime = 0;
            let intervalId = null;

            card.innerHTML = \`
              <div class="camp-row">
                <input type="text" class="camp-name-input" placeholder="ระบุชื่อค่าย...">
                <div class="camp-actions">
                  <div class="status-pill"><span class="dot"></span><span class="txt">พร้อม</span></div>
                  <button class="btn-delete" title="ลบค่าย" onclick="this.closest('.timer-card').deleteCard()">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>

              <div class="timer-display">00.0</div>

              <div class="controls">
                <button class="btn btn-main"><i class="fas fa-play"></i> เริ่ม</button>
                <button class="btn btn-reset"><i class="fas fa-undo"></i> รีเซ็ต</button>
                <button class="btn btn-copy" title="คัดลอกเวลา"><i class="fa-regular fa-copy"></i></button>
              </div>
            \`;

            const display = card.querySelector('.timer-display');
            const btnMain = card.querySelector('.btn-main');
            const btnReset = card.querySelector('.btn-reset');
            const btnCopy = card.querySelector('.btn-copy');
            const pill = card.querySelector('.status-pill');

            const updateDisplay = () => {
              const now = Date.now();
              const currentTotal = elapsedTime + (startTime ? (now - startTime) : 0);
              display.innerText = formatTime(currentTotal);
            };

            const playClick = () => {
              if (window.opener && window.opener.isSoundEnabled) {
                const clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/3124/3124-preview.mp3');
                clickSound.volume = 0.25;
                clickSound.play();
              }
            };

            btnMain.onclick = function(){
              playClick();

              // กำลังรัน -> กดเพื่อพัก
              if(startTime){
                elapsedTime += (Date.now() - startTime);
                startTime = 0;
                clearInterval(intervalId);
                intervalId = null;
                updateDisplay();
                this.innerHTML = '<i class="fas fa-play"></i> ต่อ';
                setStatus(pill, 'paused');
                return;
              }

              // ยังไม่เริ่ม หรือพักอยู่ -> กดเพื่อเริ่ม/ต่อ
              startTime = Date.now();
              intervalId = setInterval(updateDisplay, 100);
              this.innerHTML = '<i class="fas fa-pause"></i> พัก';
              setStatus(pill, 'running');
            };

            btnReset.onclick = function(){
              playClick();
              clearInterval(intervalId);
              intervalId = null;
              startTime = 0;
              elapsedTime = 0;
              display.innerText = "00.0";
              btnMain.innerHTML = '<i class="fas fa-play"></i> เริ่ม';
              setStatus(pill, 'idle');
              showToast('รีเซ็ตแล้ว');
            };

            btnCopy.onclick = async function(){
              playClick();
              try{
                await navigator.clipboard.writeText(display.innerText);
                showToast('คัดลอกเวลาแล้ว');
              }catch(e){
                showToast('คัดลอกไม่สำเร็จ');
              }
            };

            card.deleteCard = function(){
              if(confirm('ลบตัวจับเวลานี้?')){
                clearInterval(intervalId);
                card.remove();
                showToast('ลบค่ายแล้ว');
              }
            };

            container.prepend(card);
          }

          // ค่าเริ่มต้น: สร้าง 1 ค่ายอัตโนมัติ
          createNewTimer();
        </script>
      </div>
    </body>
    </html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
}

// ฟังก์ชันสร้างบั้งไฟจิ๋ววิ่งผ่านหลังจอ (เพิ่มใน DOMContentLoaded)
function createRandomRocket() {
    const rocket = document.createElement('div');
    rocket.style.left = Math.random() * 100 + 'vw';
    rocket.style.animationDuration = (Math.random() * 5 + 5) + 's';
    rocket.style.opacity = '0.2';
    document.body.appendChild(rocket);
    
    setTimeout(() => {
        rocket.remove();
    }, 10000);
}

// สั่งให้ทำงานทุกๆ 15 วินาที
setInterval(createRandomRocket, 15000);

// อัปเกรดฟังก์ชัน addTable ให้มีการสั่นตอนเด้งเข้า
const upgradeAddTable = addTable;
addTable = function(title = "", rows = null, isSilent = false) {
    upgradeAddTable(title, rows, isSilent);
    const allTables = document.querySelectorAll('.table-card');
    const target = allTables[allTables.length - 1];
    if(target) {
        target.animate([
            { transform: 'scale(0.5) translateY(100px)', opacity: 0 },
            { transform: 'scale(1.05) translateY(-10px)', opacity: 1 },
            { transform: 'scale(1) translateY(0)', opacity: 1 }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        });
    }
};

function sendMessageToLine() {
    const name = document.getElementById('lineName').value;
    const msg = document.getElementById('messageToSend').value;
    if(!name || !msg) return;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent('คุณ '+name+'\n'+msg)}`, '_blank');
}







// ตารางเช็คเครดิตรวม **/
// ฟังก์ชันสำหรับส่งยอดรวมของลูกค้าทุกคนขึ้นระบบ Real-time
function syncAdminSummary() {
    const summaryData = {};
    // วนลูปหาทุกตาราง (ใช้ class .table-card ตามที่คุณมี)
    document.querySelectorAll('.table-card').forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const name = row.cells[0].innerText.trim(); // ชื่อลูกค้า
            const price = parseFloat(row.cells[1].innerText.replace(/,/g, '')) || 0; // ยอดเล่น
            
            if (name && name !== "") {
                summaryData[name] = (summaryData[name] || 0) + price;
            }
        });
    });
    // ส่งยอดรวมทั้งหมดไปที่หัวข้อ 'liveSummary' ใน Firebase
    firebase.database().ref("liveSummary").set(summaryData);
}

// ตั้งให้ทำงานทุกครั้งที่มีการอัปเดตตาราง (เพิ่มต่อท้ายฟังก์ชันอัปเดตเดิมของคุณ)
const originalUpdateSummary = updateGlobalSummary; 
updateGlobalSummary = function() {
    originalUpdateSummary(); // ทำงานเดิม
    syncAdminSummary();      // ส่งข้อมูลขึ้นคลาวด์ให้แอดมินคนอื่นเห็น
};
