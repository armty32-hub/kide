const FRUITS = [
    { emoji: '🍎', name: 'แอปเปิ้ล' },
    { emoji: '🍌', name: 'กล้วย' },
    { emoji: '🍊', name: 'ส้ม' },
    { emoji: '🍓', name: 'สตรอว์เบอร์รี' },
    { emoji: '🍇', name: 'องุ่น' },
    { emoji: '🍉', name: 'แตงโม' }
];

const THAI_NUMS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"];

class FruitCounterGame {
    constructor() {
        this.orchardBox = document.getElementById('orchard-box');
        this.numberPad = document.getElementById('number-pad');
        this.questionLabel = document.getElementById('question-label');
        this.currentQEl = document.getElementById('current-q');
        this.scoreEl = document.getElementById('score');
        this.victoryModal = document.getElementById('victory-modal');
        this.btnPlayAgain = document.getElementById('btn-play-again');
        this.btnRestart = document.getElementById('btn-restart');

        this.totalQuestions = 5;
        this.currentIndex = 0;
        this.score = 0;
        this.targetCount = 0;
        this.currentFruit = null;
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
                        // index 0 -> เลข 1, index 1 -> เลข 2 ...
                        this.handleChoice(data.index + 1);
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
        this.currentIndex = 0;
        this.score = 0;
        this.scoreEl.textContent = '0';
        this.loadQuestion();
    }

    loadQuestion() {
        this.isLocked = false;
        this.currentIndex++;
        this.currentQEl.textContent = this.currentIndex;

        // สุ่มผลไม้ และสุ่มจำนวน 1 ถึง 5
        this.currentFruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        this.targetCount = Math.floor(Math.random() * 5) + 1;

        this.questionLabel.textContent = `มี${this.currentFruit.name}อยู่ในสวนกี่ผลเอ่ย? ช่วยนับหน่อยนะ! ✨`;

        // สร้างผลไม้ในสวน
        this.orchardBox.innerHTML = '';
        for (let i = 0; i < this.targetCount; i++) {
            const fruitEl = document.createElement('div');
            fruitEl.className = 'fruit-item';
            fruitEl.textContent = this.currentFruit.emoji;
            fruitEl.dataset.idx = i + 1;
            fruitEl.addEventListener('click', () => {
                soundManager.playClick();
                fruitEl.classList.add('counted');
                soundManager.speakThai(THAI_NUMS[i + 1]);
                setTimeout(() => fruitEl.classList.remove('counted'), 400);
            });
            this.orchardBox.appendChild(fruitEl);
        }

        // สร้างปุ่มกดตัวเลข 1 ถึง 5
        this.numberPad.innerHTML = '';
        for (let num = 1; num <= 5; num++) {
            const btn = document.createElement('button');
            btn.className = 'num-btn';
            btn.textContent = num;
            btn.addEventListener('click', () => this.handleChoice(num));
            this.numberPad.appendChild(btn);
        }

        soundManager.speakThai(`มี${this.currentFruit.name}กี่ผลเอ่ย?`);
        this.syncToPhone();
    }

    async handleChoice(num) {
        if (this.isLocked) return;
        const buttons = this.numberPad.querySelectorAll('.num-btn');
        const selectedBtn = buttons[num - 1];

        if (num === this.targetCount) {
            // ถูกต้อง!
            this.isLocked = true;
            if (selectedBtn) selectedBtn.classList.add('correct');
            soundManager.playMatch();

            // เด้งผลไม้นับทีละผล
            const fruitEls = this.orchardBox.querySelectorAll('.fruit-item');
            for (let i = 0; i < fruitEls.length; i++) {
                await new Promise(r => setTimeout(r, 400));
                fruitEls[i].classList.add('counted');
                soundManager.speakThai(THAI_NUMS[i + 1]);
            }

            await new Promise(r => setTimeout(r, 600));
            soundManager.speakThai(`ถูกต้องแล้วจ้า! มี${this.currentFruit.name} ${this.targetCount} ผล! เก่งมากๆ เลย!`);

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
            // ยังไม่ถูก
            if (selectedBtn) selectedBtn.classList.add('wrong');
            soundManager.playMismatch();
            soundManager.speakThai("ยังไม่ใช่นะจ๊ะ ลองนับดูใหม่อีกทีนะ!");
            setTimeout(() => {
                if (selectedBtn) selectedBtn.classList.remove('wrong');
            }, 800);
        }
    }

    syncToPhone() {
        const cardsState = [];
        for (let i = 1; i <= 5; i++) {
            cardsState.push({
                index: i - 1,
                emoji: `${i}`,
                name: `เลข ${i}`,
                flipped: false,
                matched: false
            });
        }

        this.sendWS({
            type: 'SYNC_STATE',
            pairs: 3,
            matchedPairs: this.currentIndex - 1,
            cards: cardsState
        });
    }

    handleWin() {
        soundManager.playWin();
        soundManager.speakThai("เย้! หนูนับผลไม้เก่งที่สุดเลย ชนะแล้ว!");
        this.victoryModal.classList.add('active');
        this.sendWS({ type: 'GAME_WON' });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new FruitCounterGame();
});
