const ANIMALS = [
    { id: 'elephant', emoji: '🐘', name: 'พี่ช้าง' },
    { id: 'lion', emoji: '🦁', name: 'พี่สิงโต' },
    { id: 'rabbit', emoji: '🐰', name: 'น้องกระต่าย' },
    { id: 'panda', emoji: '🐼', name: 'หมีแพนด้า' },
    { id: 'monkey', emoji: '🐵', name: 'ลิงจ๋อ' },
    { id: 'cat', emoji: '🐱', name: 'น้องแมว' },
    { id: 'dog', emoji: '🐶', name: 'น้องหมา' },
    { id: 'frog', emoji: '🐸', name: 'กบน้อย' },
    { id: 'penguin', emoji: '🐧', name: 'เพนกวิน' },
    { id: 'bear', emoji: '🐻', name: 'น้องหมี' },
    { id: 'tiger', emoji: '🐯', name: 'พี่เสือ' },
    { id: 'fox', emoji: '🦊', name: 'หมาจิ้งจอก' },
    { id: 'cow', emoji: '🐮', name: 'แม่วัว' },
    { id: 'pig', emoji: '🐷', name: 'หมูน้อย' },
    { id: 'koala', emoji: '🐨', name: 'หมีโคอาล่า' },
    { id: 'giraffe', emoji: '🦒', name: 'พี่ยีราฟ' },
    { id: 'zebra', emoji: '🦓', name: 'ม้าลาย' },
    { id: 'deer', emoji: '🦌', name: 'กวางน้อย' },
    { id: 'mouse', emoji: '🐭', name: 'หนูน้อย' },
    { id: 'owl', emoji: '🦉', name: 'นกฮูก' },
    { id: 'duck', emoji: '🦆', name: 'เป็ดก้าบๆ' },
    { id: 'chick', emoji: '🐥', name: 'ลูกเจี๊ยบ' },
    { id: 'octopus', emoji: '🐙', name: 'ปลาหมึกยักษ์' },
    { id: 'dolphin', emoji: '🐬', name: 'ปลาโลมา' },
    { id: 'crab', emoji: '🦀', name: 'ปูก้ามโต' }
];

class ShadowMatchGame {
    constructor() {
        this.targetEl = document.getElementById('target-silhouette');
        this.choicesContainer = document.getElementById('choices-container');
        this.currentQEl = document.getElementById('current-q');
        this.scoreEl = document.getElementById('score');
        this.victoryModal = document.getElementById('victory-modal');
        this.btnPlayAgain = document.getElementById('btn-play-again');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnPhoneConnect = document.getElementById('btn-phone-connect');
        this.qrModal = document.getElementById('qr-modal');
        this.btnCloseQr = document.getElementById('btn-close-qr');
        this.qrImage = document.getElementById('qr-image');
        this.qrLoading = document.getElementById('qr-loading');
        this.qrLink = document.getElementById('qr-link');

        this.totalQuestions = 5;
        this.currentIndex = 0;
        this.score = 0;
        this.currentAnimal = null;
        this.currentChoices = [];
        this.isLocked = false;
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

        this.btnPhoneConnect.addEventListener('click', () => {
            soundManager.playClick();
            this.showQrModal();
        });

        this.btnCloseQr.addEventListener('click', () => {
            this.qrModal.classList.remove('active');
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
                        this.handleChoice(data.index);
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

    async showQrModal() {
        this.qrModal.classList.add('active');
        try {
            const res = await fetch('/api/qrcode');
            if (res.ok) {
                const data = await res.json();
                this.qrImage.src = data.qr;
                this.qrImage.style.display = 'block';
                this.qrLoading.style.display = 'none';
                this.qrLink.href = data.url;
                this.qrLink.textContent = data.url;
            }
        } catch (e) {}
    }

    startNewGame() {
        this.currentIndex = 0;
        this.score = 0;
        this.scoreEl.textContent = '0';
        this.loadQuestion();
    }

    loadQuestion() {
        this.isLocked = false;
        this.currentIndex++;
        this.currentQEl.textContent = this.currentIndex;

        // สุ่มสัตว์เป้าหมาย
        const shuffled = [...ANIMALS].sort(() => 0.5 - Math.random());
        this.currentAnimal = shuffled[0];

        // สุ่ม 3 ตัวหลอก + 1 ตัวจริง
        const others = shuffled.slice(1, 4);
        this.currentChoices = [this.currentAnimal, ...others].sort(() => 0.5 - Math.random());

        // แสดงเงา
        this.targetEl.className = 'silhouette';
        this.targetEl.textContent = this.currentAnimal.emoji;

        // เรนเดอร์ตัวเลือก 4 ปุ่ม
        this.choicesContainer.innerHTML = '';
        this.currentChoices.forEach((animal, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerHTML = `
                <span class="choice-num">${index + 1}</span>
                <span class="choice-emoji">${animal.emoji}</span>
                <span class="choice-name">${animal.name}</span>
            `;
            btn.addEventListener('click', () => this.handleChoice(index));
            this.choicesContainer.appendChild(btn);
        });

        soundManager.speakThai("เงาดำๆ นี้คือสัตว์ตัวไหนเอ่ย?");
        this.syncToPhone();
    }

    handleChoice(index) {
        if (this.isLocked || index < 0 || index >= this.currentChoices.length) return;
        const selected = this.currentChoices[index];
        const btn = this.choicesContainer.children[index];

        if (selected.id === this.currentAnimal.id) {
            // ถูกต้อง!
            this.isLocked = true;
            btn.classList.add('correct');
            this.targetEl.classList.add('revealed');
            soundManager.playMatch();
            soundManager.speakThai(`ถูกต้องแล้วจ้า! นี่คือ${selected.name}!`);

            this.score += 20;
            this.scoreEl.textContent = this.score;

            setTimeout(() => {
                if (this.currentIndex < this.totalQuestions) {
                    this.loadQuestion();
                } else {
                    this.handleWin();
                }
            }, 1800);
        } else {
            // ไม่ถูกต้อง
            btn.classList.add('wrong');
            soundManager.playMismatch();
            soundManager.speakThai("ยังไม่ใช่นะจ๊ะ ลองใหม่อีกทีนะ!");
            setTimeout(() => {
                btn.classList.remove('wrong');
            }, 800);
        }
    }

    syncToPhone() {
        const cardsState = this.currentChoices.map((a, i) => ({
            index: i,
            emoji: a.emoji,
            name: a.name,
            flipped: false,
            matched: false
        }));

        this.sendWS({
            type: 'SYNC_STATE',
            pairs: 2,
            matchedPairs: this.currentIndex - 1,
            cards: cardsState
        });
    }

    handleWin() {
        soundManager.playWin();
        soundManager.speakThai("เย้! หนูทายเงาถูกหมดเลย เก่งที่สุดเลย!");
        this.victoryModal.classList.add('active');
        this.sendWS({ type: 'GAME_WON' });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new ShadowMatchGame();
});
