const BALLOON_TYPES = [
    { type: 'red', emoji: '🎈', name: 'แดง' },
    { type: 'yellow', emoji: '🟡', name: 'เหลือง' },
    { type: 'blue', emoji: '🔵', name: 'น้ำเงิน' },
    { type: 'green', emoji: '🟢', name: 'เขียว' },
    { type: 'bubble', emoji: '🫧', name: 'ฟองสบู่' }
];

class BalloonPopGame {
    constructor() {
        this.stage = document.getElementById('stage');
        this.popCountEl = document.getElementById('pop-count');
        this.popStarsEl = document.getElementById('pop-stars');
        this.victoryModal = document.getElementById('victory-modal');
        this.btnPlayAgain = document.getElementById('btn-play-again');
        this.btnRestart = document.getElementById('btn-restart');

        this.targetPops = 10;
        this.popped = 0;
        this.balloons = [];
        this.spawnInterval = null;
        this.animFrame = null;
        this.isGameOver = false;
        this.ws = null;

        this.initEvents();
        this.initWebSocket();
        this.startNewGame();
    }

    initEvents() {
        this.btnRestart.addEventListener('click', () => {
            soundManager.playClick();
            this.startNewGame();
        });

        this.btnPlayAgain.addEventListener('click', () => {
            soundManager.playClick();
            this.victoryModal.classList.remove('active');
            this.startNewGame();
        });

        document.body.addEventListener('click', () => soundManager.init(), { once: true });
    }

    initWebSocket() {
        const host = location.host || 'localhost:3001';
        try {
            this.ws = new WebSocket(`ws://${host}`);
            this.ws.onopen = () => {
                this.sendWS({ type: 'REGISTER', role: 'host' });
                this.syncToPhone();
            };
            this.ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === 'TAP_CARD') {
                        // จิ้มลูกโป่งใบที่อยู่ต่ำสุดหรือตรงกับประเภท
                        this.popAnyBalloon();
                    } else if (data.type === 'RESTART') {
                        this.startNewGame();
                    } else if (data.type === 'REQUEST_STATE') {
                        this.syncToPhone();
                    }
                } catch (err) {}
            };
        } catch (e) {}
    }

    sendWS(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    startNewGame() {
        this.isGameOver = false;
        this.popped = 0;
        this.popCountEl.textContent = '0';
        this.popStarsEl.textContent = '⭐';

        // เคลียร์ลูกโป่งเดิม
        this.balloons.forEach(b => b.el.remove());
        this.balloons = [];

        if (this.spawnInterval) clearInterval(this.spawnInterval);
        if (this.animFrame) cancelAnimationFrame(this.animFrame);

        // ปล่อยลูกโป่งทุกๆ 1.2 วินาที
        this.spawnInterval = setInterval(() => this.spawnBalloon(), 1200);
        this.loop();

        soundManager.speakThai("จิ้มลูกโป่งให้แตกเลยนะ!");
        this.syncToPhone();
    }

    spawnBalloon() {
        if (this.isGameOver || this.balloons.length >= 6) return;

        const bType = BALLOON_TYPES[Math.floor(Math.random() * BALLOON_TYPES.length)];
        const el = document.createElement('div');
        el.className = 'balloon-item';
        el.textContent = bType.emoji;

        const stageWidth = this.stage.clientWidth - 80;
        const x = Math.max(20, Math.random() * stageWidth);
        const y = this.stage.clientHeight + 20;
        const speed = Math.random() * 1.5 + 1.2;

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        const bObj = { el, x, y, speed, type: bType };
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            this.popBalloon(bObj);
        });

        this.stage.appendChild(el);
        this.balloons.push(bObj);
    }

    loop() {
        if (this.isGameOver) return;

        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const b = this.balloons[i];
            b.y -= b.speed;
            b.el.style.top = `${b.y}px`;

            // ส่ายไปมาเบาๆ
            b.x += Math.sin(b.y / 20) * 0.8;
            b.el.style.left = `${b.x}px`;

            // ถ้าลอยพ้นจอ
            if (b.y < -90) {
                b.el.remove();
                this.balloons.splice(i, 1);
            }
        }

        this.animFrame = requestAnimationFrame(() => this.loop());
    }

    popAnyBalloon() {
        if (this.balloons.length > 0) {
            // แตกตัวที่อยู่สูงสุดหรือต่ำสุด
            const b = this.balloons[0];
            this.popBalloon(b);
        } else {
            this.spawnBalloon();
        }
    }

    popBalloon(b) {
        if (this.isGameOver) return;

        // เสียงป๊อป
        soundManager.playFlip();

        // เอฟเฟกต์แตก
        const burst = document.createElement('div');
        burst.className = 'pop-burst';
        burst.textContent = '💥';
        burst.style.left = `${b.x}px`;
        burst.style.top = `${b.y}px`;
        this.stage.appendChild(burst);
        setTimeout(() => burst.remove(), 400);

        b.el.remove();
        this.balloons = this.balloons.filter(item => item !== b);

        this.popped++;
        this.popCountEl.textContent = this.popped;

        if (this.popped >= 4) this.popStarsEl.textContent = '⭐⭐';
        if (this.popped >= 8) this.popStarsEl.textContent = '⭐⭐⭐';

        if (this.popped % 3 === 0) {
            soundManager.speakThai("โป๊ะ! เก่งมาก!");
        }

        this.syncToPhone();

        if (this.popped >= this.targetPops) {
            this.handleWin();
        }
    }

    syncToPhone() {
        // ให้มือถือมีปุ่มจิ้มลูกโป่ง 4 ปุ่มหลากสี
        const cardsState = [
            { index: 0, emoji: '🎈', name: 'จิ้มสีแดง', flipped: false, matched: false },
            { index: 1, emoji: '🟡', name: 'จิ้มสีเหลือง', flipped: false, matched: false },
            { index: 2, emoji: '🔵', name: 'จิ้มสีฟ้า', flipped: false, matched: false },
            { index: 3, emoji: '🫧', name: 'จิ้มฟองสบู่', flipped: false, matched: false }
        ];

        this.sendWS({
            type: 'SYNC_STATE',
            pairs: 2,
            matchedPairs: Math.floor(this.popped / 3),
            cards: cardsState
        });
    }

    handleWin() {
        this.isGameOver = true;
        clearInterval(this.spawnInterval);
        soundManager.playWin();
        soundManager.speakThai("เย้! แตกครบ 10 ลูกแล้ว เก่งที่สุดเลย!");
        this.victoryModal.classList.add('active');
        this.sendWS({ type: 'GAME_WON' });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new BalloonPopGame();
});
