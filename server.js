const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// เปิดให้ frontend ที่ localhost ใช้ได้
app.use(cors());
app.use(bodyParser.json());

// 👇 Token ของคุณ (อย่าลืมเปลี่ยนเมื่อเผยแพร่)
const CHANNEL_ACCESS_TOKEN = 'fmjqWDCs2Z1zL5z4o3+SNRTsSDMlYRUzgETICw6LZrCR36SanGMBWiy3v6Xl4aP9jk8TTD6p+zZtezzEkNLZgXEvffePBNtfFB2g8vjYzD6ba+vm3xt8l33d9Rn0ennRiUykVEUOqp27mbrTPfxuVQdB04t89/1O/w1cDnyilFU=';

// 👇 แมปชื่อใน HTML กับ LINE User ID จริง
const userMap = {
    "บังน๊อต": "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "แอดมิน A": "Uyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
};

app.post('/send-line', async (req, res) => {
    const { lineName, message } = req.body;
    const userId = userMap[lineName];

    if (!userId) {
        return res.status(400).json({ error: 'ไม่พบชื่อในระบบ' });
    }

    try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                to: userId,
                messages: [{ type: 'text', text: message }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        res.sendStatus(200);
    } catch (err) {
        console.error("❌ LINE API ERROR:", err);
        res.status(500).json({ error: 'ส่งข้อความไม่สำเร็จ' });
    }
});

app.listen(port, () => {
    console.log(`✅ Backend รอรับอยู่ที่ http://localhost:${port}`);
});
