function openStopwatchWindow() {
    const width = 950, height = 850;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const sw = window.open("", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
    
    sw.document.write(`
        <html>
        <head>
            <title>PREMIUM TIMER SYSTEM</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                :root {
                    --bg-dark: #0f172a;
                    --card-bg: rgba(30, 41, 59, 0.7);
                    --accent: #38bdf8;
                    --success: #10b981;
                    --warning: #f59e0b;
                    --danger: #ef4444;
                    --glass: rgba(255, 255, 255, 0.03);
                }
                
                body { 
                    background-color: var(--bg-dark);
                    background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%);
                    color: #f8fafc;
                    font-family: 'Sarabun', sans-serif;
                    margin: 0;
                    padding: 40px 20px;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .container { width: 100%; max-width: 800px; }

                /* Header */
                .header { text-align: center; margin-bottom: 40px; }
                .header h1 { 
                    font-size: 2.5rem; margin: 0; font-weight: 600;
                    background: linear-gradient(to bottom, #fff, var(--accent));
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .header p { color: #94a3b8; margin-top: 10px; font-weight: 300; }

                /* Input Box */
                .input-wrapper {
                    background: var(--card-bg);
                    padding: 8px;
                    border-radius: 20px;
                    display: flex;
                    gap: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(20px);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                    margin-bottom: 40px;
                }
                input {
                    flex: 1; background: transparent; border: none; padding: 15px 25px;
                    color: white; font-size: 1.1rem; outline: none; font-family: 'Sarabun';
                }
                .btn-add {
                    background: var(--accent); color: #0f172a; border: none;
                    padding: 0 30px; border-radius: 15px; font-weight: 600;
                    cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px;
                }
                .btn-add:hover { background: #fff; transform: translateY(-2px); }

                /* Timer Card */
                .timer-list { display: flex; flex-direction: column; gap: 20px; }
                .timer-card {
                    background: var(--card-bg);
                    border-radius: 24px;
                    padding: 25px 35px;
                    border: 1px solid rgba(255,255,255,0.05);
                    display: grid;
                    grid-template-columns: 1.5fr 2fr 1.5fr;
                    align-items: center;
                    transition: 0.4s;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .timer-card:hover { border-color: rgba(56, 189, 248, 0.4); transform: scale(1.02); }

                .camp-info .name { font-size: 1.4rem; font-weight: 600; color: #fff; margin-bottom: 5px; }
                .camp-info .status { font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }

                .time-display {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 3.5rem;
                    text-align: center;
                    color: var(--success);
                    text-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
                }

                .actions { display: flex; gap: 12px; justify-content: flex-end; }
                .btn-ctrl {
                    width: 50px; height: 50px; border-radius: 15px; border: none;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    font-size: 1.2rem; transition: 0.2s;
                }
                .btn-play { background: rgba(16, 185, 129, 0.15); color: var(--success); }
                .btn-play:hover { background: var(--success); color: white; }
                .btn-pause { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
                .btn-pause:hover { background: var(--warning); color: white; }
                .btn-reset { background: var(--glass); color: #94a3b8; }
                .btn-reset:hover { background: #475569; color: white; }
                .btn-del { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
                .btn-del:hover { background: var(--danger); color: white; }

                /* Empty State */
                #empty-msg { text-align: center; color: #475569; margin-top: 50px; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1><i class="fas fa-clock-rotate-left"></i> บันทึกเวลาค่ายบั้งไฟ</h1>
                    <p>ระบบจัดการเวลาแบบ Real-time รายค่าย</p>
                </div>

                <div class="input-wrapper">
                    <input type="text" id="campInput" placeholder="พิมพ์ชื่อค่ายบั้งไฟ เช่น 'พญานาคคู่'...">
                    <button class="btn-add" onclick="addNewRow()">
                        <i class="fas fa-plus"></i> เพิ่มค่าย
                    </button>
                </div>

                <div id="empty-msg">ยังไม่มีข้อมูลค่าย... เริ่มต้นโดยการเพิ่มชื่อค่ายด้านบน</div>
                <div class="timer-list" id="sw-tbody"></div>
            </div>

            <script>
                document.getElementById('campInput').addEventListener('keydown', (e) => { 
                    if (e.key === "Enter") addNewRow(); 
                });

                function addNewRow() {
                    const inp = document.getElementById('campInput');
                    const name = inp.value.trim();
                    if(!name) return;
                    
                    document.getElementById('empty-msg').style.display = 'none';

                    const div = document.createElement('div');
                    div.className = 'timer-card';
                    div.dataset.elapsed = 0; 
                    div.dataset.running = "false";
                    
                    div.innerHTML = \`
                        <div class="camp-info">
                            <div class="name">\${name}</div>
                            <div class="status">Ready to Start</div>
                        </div>
                        <div class="time-display">0.000</div>
                        <div class="actions">
                            <button class="btn-ctrl btn-play" onclick="toggle(this)">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn-ctrl btn-reset" onclick="reset(this)">
                                <i class="fas fa-redo"></i>
                            </button>
                            <button class="btn-ctrl btn-del" onclick="removeCard(this)">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>\`;
                    
                    document.getElementById('sw-tbody').prepend(div);
                    inp.value = "";
                }

                function toggle(btn) {
                    const card = btn.closest('.timer-card');
                    const disp = card.querySelector('.time-display');
                    const status = card.querySelector('.status');
                    
                    if (card.dataset.running === "false") {
                        card.dataset.running = "true"; 
                        btn.innerHTML = '<i class="fas fa-pause"></i>'; 
                        btn.className = "btn-ctrl btn-pause";
                        status.innerText = "Timing...";
                        status.style.color = "#38bdf8";
                        
                        const st = Date.now() - parseFloat(card.dataset.elapsed);
                        card.iv = setInterval(() => {
                            const now = Date.now() - st;
                            card.dataset.elapsed = now;
                            disp.innerText = (now / 1000).toFixed(3);
                        }, 10);
                    } else {
                        card.dataset.running = "false"; 
                        btn.innerHTML = '<i class="fas fa-play"></i>'; 
                        btn.className = "btn-ctrl btn-play";
                        status.innerText = "Paused";
                        status.style.color = "#f59e0b";
                        clearInterval(card.iv);
                    }
                }

                function reset(btn) {
                    const card = btn.closest('.timer-card'); 
                    clearInterval(card.iv);
                    card.dataset.running = "false"; 
                    card.dataset.elapsed = 0;
                    card.querySelector('.time-display').innerText = "0.000";
                    card.querySelector('.status').innerText = "Ready to Start";
                    card.querySelector('.status').style.color = "#64748b";
                    
                    const pBtn = card.querySelector('.btn-ctrl');
                    pBtn.innerHTML = '<i class="fas fa-play"></i>'; 
                    pBtn.className = "btn-ctrl btn-play";
                }

                function removeCard(btn) {
                    btn.closest('.timer-card').remove();
                    if (document.getElementById('sw-tbody').children.length === 0) {
                        document.getElementById('empty-msg').style.display = 'block';
                    }
                }
            <\/script>
        </body>
        </html>
    `);
}
