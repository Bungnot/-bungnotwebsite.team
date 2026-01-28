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


function updateIndividualTableSummaries() {
  document.querySelectorAll(".table-container").forEach(tableWrapper => {

    /* ===== 1. ชื่อค่าย ===== */
    const tableTitleInput = tableWrapper.querySelector(".table-title-input");
    const campName = tableTitleInput ? tableTitleInput.value.trim() || "ไม่ระบุค่าย" : "ไม่ระบุค่าย";

    /* ===== 2. จัดการข้อมูลแต่ละแถว ===== */
    const nameSummary = {};
    const rows = tableWrapper.querySelectorAll("tbody tr");

    rows.forEach(tr => {
      const inputs = tr.querySelectorAll("input");
      if (inputs.length < 3) return;

      const chaser = inputs[0].value.trim();
      const priceInput = inputs[1]; // ช่องราคา
      const holder = inputs[2].value.trim();

      // ดึงตัวเลขและคำนวณยอดรวม (เฉพาะ 3 หลักขึ้นไป)
      const priceText = priceInput.value.replace(/[Oo]/g, '0');
      const matches = priceText.match(/\d+/g);
      let rowTotal = 0;

      if (matches) {
        matches.forEach(num => {
          if (num.length >= 3) rowTotal += parseInt(num, 10);
        });
      }

      /* --- [หัวใจหลัก] ฝังยอดสุทธิเข้าไปในช่องราคา --- */
      const priceTd = priceInput.parentElement;
      let netBadge = priceTd.querySelector(".net-inside-label");

      if (rowTotal > 0) {
        const netAmount = Math.floor(rowTotal * 0.9); // หักกำไร 10%
        if (!netBadge) {
          netBadge = document.createElement("div");
          netBadge.className = "net-inside-label";
          priceTd.appendChild(netBadge); // ใส่เข้าไปในช่อง td ตรงๆ
        }
        netBadge.innerText = netAmount.toLocaleString();
      } else {
        if (netBadge) netBadge.remove();
      }
      /* ----------------------------------------- */

      if (rowTotal > 0) {
        if (chaser) nameSummary[chaser] = (nameSummary[chaser] || 0) + rowTotal;
        if (holder && holder !== chaser) {
          nameSummary[holder] = (nameSummary[holder] || 0) + rowTotal;
        }
      }
    });

    /* ===== 3. ส่วนแสดงผล Sidebar ด้านข้าง (คงเดิม) ===== */
    const entries = Object.entries(nameSummary).sort((a, b) => b[1] - a[1]);
    const summaryArea = tableWrapper.querySelector(".name-list-area");
    if (!summaryArea) return;

    let html = `
      <div class="summary-header">
        <div class="live-dot"></div>
        <span>ยอดเล่น Real-Time</span>
        <span class="camp-badge">ค่าย: ${campName}</span>
      </div>
    `;

    if (entries.length === 0) {
      html += `<p style="color:#94a3b8; font-style:italic; text-align:center; margin-top:15px; font-size:.85rem;">รอข้อมูล...</p>`;
    } else {
      html += entries.map(([name, total], index) => {
        const cleanName = name.replace(/^@+/, '');
        const displayName = cleanName.length > 15 ? cleanName.substring(0, 15) + "…" : cleanName;
        let rankClass = (index === 0) ? "gold" : (index === 1) ? "silver" : (index === 2) ? "bronze" : "";

        return `
          <div class="player-row">
            <div class="rank ${rankClass}">#${index + 1}</div>
            <div class="player-name">${displayName}</div>
            <div style="display:flex;gap:6px;align-items:center;">
              <span class="amount">${total.toLocaleString()}</span>
              <button class="btn-capture-player" onclick="capturePlayerRow('${cleanName}', ${total})">
                <i class="fas fa-camera"></i>
              </button>
            </div>
          </div>`;
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


document.addEventListener("DOMContentLoaded", () => {
    const savedHistory = localStorage.getItem("historyData");
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        totalDeletedProfit = historyData.reduce((sum, item) => sum + (item.profit || 0), 0);
                // ✅ นับจำนวนค่ายจากประวัติที่ปิดไปแล้ว
        closedCampCount = historyData.length;
    }
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
                rows.push([cells[0].value, cells[1].value, cells[2].value]);
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

        // ✅ เพิ่มบรรทัดนี้
  //  updateBungAndCampSummary();
    
    // แสดง Badge แจ้งเตือน และเล่นเสียงเบาๆ ตอนบันทึก
    const badge = document.getElementById("auto-save-alert");
    if(badge) { 
        badge.style.opacity = "1"; 
        setTimeout(() => badge.style.opacity = "0", 1500); 
    }
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
    const raw = localStorage.getItem("savedTables");
    if (!raw) return;
    const data = JSON.parse(raw);
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    data.forEach(t => addTable(t.title, t.rows, true));
}

// 3. ฟังก์ชันการทำงานของตาราง
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

    const generateRowHtml = (r = ["", "", ""]) => `
        <tr>
            <td><input type="text" value="${r[0]}" oninput="saveData()"></td>
            <td><input type="text" value="${r[1]}" oninput="saveData()" style="color:#2e7d32;"></td>
            <td><input type="text" value="${r[2]}" oninput="saveData()"></td>
            <td><button class="btn-remove-row" onclick="removeRow(this)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;

    let rowsHtml = rows ? rows.map(r => generateRowHtml(r)).join('') : generateRowHtml();
    
    // โครงสร้าง HTML: แบ่งฝั่งตาราง และ Sidebar (เลื่อนรายการลงมา 45px เพื่อให้ตรงกับแถวแรก)
    newTableWrapper.innerHTML = `
        <div class="table-main-content" style="flex: 1;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
                <span class="profit-badge-live" style="color:white; padding:4px 12px; border-radius:20px; font-weight:bold;">฿0.00</span>
                <button class="btn-close-table" onclick="removeTable(this)" style="position:static;"><i class="fas fa-times"></i></button>
            </div>
            <input type="text" class="table-title-input" value="${title}" placeholder="ชื่อค่าย..." oninput="saveData()" style="width: 80%;">
            <table class="custom-table">
                <thead><tr><th class="th-green">คนไล่</th><th class="th-orange">ราคา</th><th class="th-red">คนยั้ง</th><th class="th-purple">ลบ</th></tr></thead>
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
    tr.innerHTML = `
        <td><input type="text" oninput="saveData()"></td>
        <td><input type="text" oninput="saveData()" style="color:#2e7d32;"></td>
        <td><input type="text" oninput="saveData()"></td>
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
  captureDiv.style.width = '950px';
  captureDiv.style.padding = '45px 55px';
  captureDiv.style.background = 'linear-gradient(180deg,#fffef7,#fffbea)';
  captureDiv.style.borderRadius = '20px';
  captureDiv.style.fontFamily = "'Sarabun',sans-serif";
  captureDiv.style.textAlign = 'center';
  captureDiv.style.boxShadow = '0 0 30px rgba(0,0,0,0.08)';

  let innerHTML = `
    <div style="background:linear-gradient(90deg,#fde68a,#fbbf24,#f59e0b);
                color:#b91c1c;font-weight:700;font-size:1.9rem;
                padding:15px 0;border-radius:10px;margin-bottom:25px;">
      ยอดเล่น Real-Time
    </div>
    <div style="font-size:1.1rem;color:#334155;margin-bottom:10px;">
      🧍‍♂️ <b>คุณ ${cleanName}</b>
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
            <td style="border:1px solid #facc15;padding:8px;">${r.from}</td>
            <td style="border:1px solid #facc15;padding:8px;text-align:center;">${r.price}</td>
            <td style="border:1px solid #facc15;padding:8px;">${r.to}</td>
          </tr>`;
      }).join('');

      grandTotal += campTotal;

      innerHTML += `
          <div style="margin:25px auto 10px auto;font-size:1rem;color:#b91c1c;
                      font-weight:600;width:85%;text-align:left;">
            🏕️ ค่าย: ${campName}
          </div>
          <table style="width:85%;margin:0 auto 10px auto;border-collapse:collapse;
                        font-size:1rem;color:#1e293b;">
            <thead style="background:#fef3c7;">
              <tr>
                <th style="border:1px solid #facc15;padding:8px;">คนไล่</th>
                <th style="border:1px solid #facc15;padding:8px;">ราคา</th>
                <th style="border:1px solid #facc15;padding:8px;">คนยั้ง</th>
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
          </table>
          <div style="font-weight:bold;margin:10px auto 25px auto;
                      color:#111827;text-align:center;width:85%;">
            รวมค่ายนี้ ${campTotal.toLocaleString()}
          </div>
          ${
            idx < campEntries.length - 1
              ? `<div style="width:85%;height:2px;margin:25px auto;
                             background:linear-gradient(90deg,#fef08a,#facc15,#fef08a);"></div>`
              : ""
          }
        `;
    });
  }

  // 🔸 รวมทั้งหมด
  innerHTML += `
    <div style="font-size:2.5rem;font-weight:bold;color:#111827;margin-top:25px;">
      รวมทั้งหมด ${grandTotal.toLocaleString()}
    </div>
    <div style="font-size:1rem;color:#475569;margin-top:5px;">
      รวมทั้งหมด ${totalRecords} รายการ
    </div>
    <div style="margin-top:25px;font-size:0.9rem;color:#94a3b8;">
      ADMIN ROCKET SYSTEM
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
        <title>ประวัติการปิดยอด - ADMIN ROCKET</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <style>
            body { font-family: 'Sarabun', sans-serif; background: #0f1b2a; padding: 40px; color: #333; margin: 0; }
            .history-title { color: white; text-align: center; margin-bottom: 30px; font-size: 2rem; }
            .table-card { 
                background: white; border-radius: 20px; padding: 25px; margin-bottom: 50px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.5); position: relative; border-top: 6px solid #d42426;
            }
            .history-meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .timestamp-label { color: #64748b; font-size: 0.9rem; }
            .profit-label { background: #2ecc71; color: white; padding: 4px 15px; border-radius: 50px; font-weight: bold; font-size: 0.9rem; }
            
            .table-title-display { 
                font-size: 1.4rem; font-weight: bold; color: #b3000c; text-align: center; 
                background: #fff5f5; padding: 10px; border-radius: 12px; margin-bottom: 20px; 
                border: 1px solid #ffcccc; 
            }
            .custom-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
            .custom-table th { padding: 12px; color: white; font-weight: 600; }
            .th-green { background: #14452f; border-radius: 10px 0 0 10px; }
            .th-orange { background: #bf953f; }
            .th-red { background: #b3000c; }
            .th-dark { background: #2d3436; border-radius: 0 10px 10px 0; }
            
            .custom-table td { 
                padding: 15px; text-align: center; background: #f8fafc; 
                border: 1px solid #edf2f7; border-radius: 8px; font-weight: 600; 
            }
            
            .btn-copy-item {
                background: #f0fff4; color: #22c55e; border: 1px solid #bbf7d0;
                width: 35px; height: 35px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
            }
            .btn-copy-item:hover { background: #22c55e; color: white; }
            
            .status-group { display: flex; align-items: center; justify-content: center; gap: 8px; }
            .status-icon { color: #94a3b8; font-size: 1.1rem; }
            
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align:right; margin-bottom:20px;">
            <button onclick="window.print()" style="padding:10px 20px; border-radius:10px; cursor:pointer; background:white; font-weight:bold;">พิมพ์ประวัติ</button>
        </div>
        <h2 class="history-title">ประวัติการคิดยอดทั้งหมด</h2>`;

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
                    <td style="color:#b3000c;">${displayPrice}</td>
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
                <div class="profit-label">กำไร: ฿${h.profit.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
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
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { font-family: 'Sarabun', sans-serif; background: #0f172a; color: white; padding: 20px; margin: 0; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e293b; padding-bottom: 10px; }
            .timer-card { 
                background: #1e293b; border-radius: 16px; padding: 20px; margin-bottom: 15px; 
                display: flex; flex-direction: column; border: 1px solid #334155;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }
            .camp-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .camp-name-input { 
                background: #0f172a; border: 1px solid #334155; border-radius: 8px;
                color: #2ecc71; font-size: 1.1rem; font-weight: bold; width: 60%; padding: 8px 12px; outline: none;
            }
            .timer-display { 
                font-family: 'Courier New', monospace; font-size: 3.5rem; color: #f8fafc; 
                text-align: center; margin: 10px 0; font-weight: bold; letter-spacing: 2px;
                text-shadow: 0 0 20px rgba(255,255,255,0.1);
            }
            .controls { display: flex; gap: 10px; justify-content: center; }
            button { 
                border: none; border-radius: 10px; cursor: pointer; font-weight: bold; 
                transition: all 0.2s; padding: 12px 20px; display: flex; align-items: center; gap: 8px;
            }
            .btn-start { background: #2ecc71; color: white; flex: 2; justify-content: center; }
            .btn-pause { background: #f39c12; color: white; flex: 2; justify-content: center; }
            .btn-reset { background: #64748b; color: white; flex: 1; justify-content: center; }
            .btn-delete { background: #e74c3c; color: white; padding: 10px; }
            .btn-add { 
                width: 100%; background: transparent; color: #3b82f6; font-size: 1.1rem; padding: 15px;
                margin-top: 10px; border: 2px dashed #3b82f6; border-radius: 16px;
            }
            button:hover { transform: translateY(-2px); filter: brightness(1.1); }
            button:active { transform: translateY(0); }
        </style>
    </head>
    <body>
        <div class="header">
            <h2><i class="fas fa-stopwatch"></i> จับเวลารายค่าย</h2>
        </div>
        
        <div id="timers-container"></div>
        
        <button class="btn-add" onclick="createNewTimer()">
            <i class="fas fa-plus-circle"></i> เพิ่มค่ายใหม่
        </button>

        <script>
            let timerCount = 0;

            function formatTime(ms) {
                let totalSeconds = Math.floor(ms / 1000);
                let minutes = Math.floor(totalSeconds / 60);
                let seconds = totalSeconds % 60;
                let tenths = Math.floor((ms % 1000) / 100);
                return \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}.\${tenths}\`;
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
                        <button class="btn-delete" onclick="this.parentElement.parentElement.deleteCard()"><i class="fas fa-trash-alt"></i></button>
                    </div>
                    <div class="timer-display">00:00.0</div>
                    <div class="controls">
                        <button class="btn-start"><i class="fas fa-play"></i> เริ่ม</button>
                        <button class="btn-reset"><i class="fas fa-undo"></i> รีเซ็ต</button>
                    </div>
                \`;

                const display = card.querySelector('.timer-display');
                const btnStart = card.querySelector('.btn-start');
                const btnReset = card.querySelector('.btn-reset');

                const updateDisplay = () => {
                    const now = Date.now();
                    const currentTotal = elapsedTime + (startTime ? (now - startTime) : 0);
                    display.innerText = formatTime(currentTotal);
                };

                btnStart.onclick = function() {
                    if (window.opener && window.opener.isSoundEnabled) {
                            const clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/3124/3124-preview.mp3');
                            clickSound.volume = 0.3;
                            clickSound.play();
                        }

                    if (intervalId) {
                        // Pause
                        elapsedTime += Date.now() - startTime;
                        clearInterval(intervalId);
                        intervalId = null;
                        startTime = 0;
                        btnStart.innerHTML = '<i class="fas fa-play"></i> เริ่มต่อ';
                        btnStart.className = 'btn-start';
                    } else {
                        // Start/Resume
                        startTime = Date.now();
                        intervalId = setInterval(updateDisplay, 100); // อัปเดตทุก 0.1 วินาที
                        btnStart.innerHTML = '<i class="fas fa-pause"></i> หยุด';
                        btnStart.className = 'btn-pause';
                    }
                };

                btnReset.onclick = function() {
                    clearInterval(intervalId);
                    intervalId = null;
                    startTime = 0;
                    elapsedTime = 0;
                    display.innerText = "00:00.0";
                    btnStart.innerHTML = '<i class="fas fa-play"></i> เริ่ม';
                    btnStart.className = 'btn-start';
                };

                card.deleteCard = function() {
                    if(confirm('ลบตัวจับเวลานี้?')) {
                        clearInterval(intervalId);
                        card.remove();
                    }
                };

                container.appendChild(card);
            }

            window.onload = createNewTimer;
        </script>
    </body>
    </html>`;

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
