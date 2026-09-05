// รายการสัตว์น่ารักพร้อมอีโมจิและชื่อภาษาไทย
const ALL_ANIMALS = [
    { id: 'dog', emoji: '🐶', name: 'น้องหมา' },
    { id: 'cat', emoji: '🐱', name: 'น้องแมว' },
    { id: 'rabbit', emoji: '🐰', name: 'น้องกระต่าย' },
    { id: 'panda', emoji: '🐼', name: 'หมีแพนด้า' },
    { id: 'lion', emoji: '🦁', name: 'พี่สิงโต' },
    { id: 'elephant', emoji: '🐘', name: 'พี่ช้าง' },
    { id: 'monkey', emoji: '🐵', name: 'ลิงจ๋อ' },
    { id: 'frog', emoji: '🐸', name: 'กบน้อย' },
    { id: 'bear', emoji: '🐻', name: 'น้องหมี' },
    { id: 'penguin', emoji: '🐧', name: 'เพนกวิน' },
    { id: 'pig', emoji: '🐷', name: 'น้องหมู' },
    { id: 'cow', emoji: '🐮', name: 'น้องวัว' }
];

const COMPLIMENTS = [
    "เก่งมากเลย!",
    "ยอดเยี่ยมที่สุด!",
    "ว้าว เก่งจัง!",
    "เยี่ยมไปเลย!",
    "ถูกเผงเลย!"
];

class MemoryGame {
    constructor() {
        this.board = document.getElementById('board');
        this.pairsCountEl = document.getElementById('pairs-count');
        this.totalPairsEl = document.getElementById('total-pairs');
        this.starsDisplayEl = document.getElementById('stars-display');
        this.victoryModal = document.getElementById('victory-modal');
        this.btnPlayAgain = document.getElementById('btn-play-again');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnMute = document.getElementById('btn-mute');
        this.levelBtns = document.querySelectorAll('.btn-level');

        // Phone connection elements
        this.btnPhoneConnect = document.getElementById('btn-phone-connect');
        this.phoneBadge = document.getElementById('phone-badge');
        this.phoneStatusText = document.getElementById('phone-status-text');
        this.qrModal = document.getElementById('qr-modal');
        this.btnCloseQr = document.getElementById('btn-close-qr');
        this.qrImage = document.getElementById('qr-image');
        this.qrLoading = document.getElementById('qr-loading');
        this.qrLink = document.getElementById('qr-link');

        this.currentPairs = 3; // ค่าเริ่มต้น: ง่าย (3 คู่ = 6 ใบ)
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.cardElements = [];
        this.isLocked = false;
        this.confettiAnimationId = null;
        this.ws = null;

        this.initEvents();
        this.initWebSocket();
        this.startNewGame(3);
    }

    initEvents() {
        // ปุ่มเลือกระดับความยาก
        this.levelBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                soundManager.playClick();
                const pairs = parseInt(btn.dataset.pairs, 10);
                this.changeLevel(pairs);
            });
        });

        // ปุ่มเล่นใหม่
        this.btnRestart.addEventListener('click', () => {
            soundManager.playClick();
            this.startNewGame(this.currentPairs);
        });

        // ปุ่มเล่นอีกครั้งในหน้าต่างชนะ
        this.btnPlayAgain.addEventListener('click', () => {
            soundManager.playClick();
            this.hideVictoryModal();
            this.startNewGame(this.currentPairs);
        });

        // ปุ่มเปิด/ปิดเสียง
        this.btnMute.addEventListener('click', () => {
            const isMuted = soundManager.toggleMute();
            this.btnMute.innerHTML = isMuted ? '🔇 <span class="btn-text">ปิดเสียง</span>' : '🔊 <span class="btn-text">เปิดเสียง</span>';
        });

        // ปุ่มต่อจอยมือถือ (เปิดหน้าต่าง QR Code)
        this.btnPhoneConnect.addEventListener('click', () => {
            soundManager.playClick();
            this.showQrModal();
        });

        this.btnCloseQr.addEventListener('click', () => {
            this.qrModal.classList.remove('active');
        });

        this.qrModal.addEventListener('click', (e) => {
            if (e.target === this.qrModal) {
                this.qrModal.classList.remove('active');
            }
        });

        // หน้าต่างชนะ - ปิดเมื่อคลิกพื้นหลัง
        this.victoryModal.addEventListener('click', (e) => {
            if (e.target === this.victoryModal) {
                this.hideVictoryModal();
            }
        });

        // ให้เริ่มระบบเสียงเมื่อแตะหน้าจอครั้งแรก
        document.body.addEventListener('click', () => {
            soundManager.init();
        }, { once: true });
        document.body.addEventListener('touchstart', () => {
            soundManager.init();
        }, { once: true });
    }

    // ระบบ WebSocket เชื่อมกับเซิร์ฟเวอร์
    initWebSocket() {
        const isHttp = location.protocol.startsWith('http');
        const host = isHttp ? location.host : 'localhost:3000';
        const wsUrl = `ws://${host}`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.sendWS({ type: 'REGISTER', role: 'host' });
                this.phoneStatusText.textContent = 'รอจอยมือถือเชื่อมต่อ...';
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                } catch (err) {
                    console.error('WS parse error:', err);
                }
            };

            this.ws.onclose = () => {
                this.phoneBadge.className = 'phone-badge';
                this.phoneStatusText.textContent = 'ยังไม่ได้เปิด server';
                setTimeout(() => this.initWebSocket(), 3000);
            };
        } catch (e) {
            console.log('WS connection failed:', e);
        }
    }

    sendWS(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'CONTROLLER_COUNT':
            case 'CONTROLLER_CONNECTED':
                if (data.count > 0) {
                    this.phoneBadge.className = 'phone-badge connected';
                    this.phoneStatusText.textContent = `📱 จอยมือถือต่อแล้ว (${data.count} เครื่อง)`;
                }
                this.syncStateToPhone();
                break;

            case 'CONTROLLER_DISCONNECTED':
                if (data.count === 0) {
                    this.phoneBadge.className = 'phone-badge';
                    this.phoneStatusText.textContent = 'รอจอยมือถือเชื่อมต่อ...';
                } else {
                    this.phoneStatusText.textContent = `📱 จอยมือถือต่อแล้ว (${data.count} เครื่อง)`;
                }
                break;

            case 'REQUEST_STATE':
                this.syncStateToPhone();
                break;

            case 'TAP_CARD':
                this.handleCardClickByIndex(data.index);
                break;

            case 'CHANGE_LEVEL':
                this.changeLevel(data.pairs);
                break;

            case 'RESTART':
                this.startNewGame(this.currentPairs);
                break;
        }
    }

    changeLevel(pairs) {
        this.levelBtns.forEach(b => {
            if (parseInt(b.dataset.pairs, 10) === pairs) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        this.startNewGame(pairs);
    }

    syncStateToPhone() {
        if (!this.cardElements || this.cardElements.length === 0) return;

        const cardsState = this.cardElements.map((card, index) => ({
            index: index,
            emoji: card.dataset.emoji,
            name: card.dataset.name,
            flipped: card.classList.contains('flipped'),
            matched: card.classList.contains('matched')
        }));

        this.sendWS({
            type: 'SYNC_STATE',
            pairs: this.currentPairs,
            matchedPairs: this.matchedPairs,
            cards: cardsState
        });
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
            } else {
                throw new Error('API failed');
            }
        } catch (e) {
            this.qrLoading.textContent = 'โปรดเปิดเล่นผ่าน http://localhost:3000 เพื่อสร้าง QR Code';
        }
    }

    startNewGame(pairs) {
        this.currentPairs = pairs;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.cardElements = [];
        this.isLocked = false;
        this.hideVictoryModal();
        this.stopConfetti();

        // อัปเดตตัวเลขแสดงผล
        this.pairsCountEl.textContent = '0';
        this.totalPairsEl.textContent = pairs;
        this.updateStars(0);

        // ปรับ CSS Grid ตามจำนวนการ์ด
        this.board.className = 'board';
        if (pairs === 3) {
            this.board.classList.add('grid-easy');
        } else if (pairs === 6) {
            this.board.classList.add('grid-medium');
        } else {
            this.board.classList.add('grid-hard');
        }

        // สุ่มเลือกสัตว์ตามจำนวนคู่
        const shuffledAnimals = [...ALL_ANIMALS].sort(() => 0.5 - Math.random());
        const selectedAnimals = shuffledAnimals.slice(0, pairs);

        // ทำเป็นคู่และสับการ์ด
        const cardDeck = [...selectedAnimals, ...selectedAnimals]
            .map((animal, index) => ({
                ...animal,
                uniqueId: `${animal.id}-${index}-${Math.random()}`
            }))
            .sort(() => 0.5 - Math.random());

        // ล้างกระดานและสร้างการ์ดใหม่
        this.board.innerHTML = '';
        cardDeck.forEach((animal, i) => {
            const card = this.createCardElement(animal, i);
            this.cardElements.push(card);
            this.board.appendChild(card);
        });

        this.syncStateToPhone();
    }

    createCardElement(animal, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = animal.id;
        card.dataset.name = animal.name;
        card.dataset.emoji = animal.emoji;
        card.dataset.index = index;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-back">
                    <span class="card-badge-num">${index + 1}</span>
                    <div class="card-back-icon">🐾</div>
                </div>
                <div class="card-face card-front">
                    <span class="card-badge-num">${index + 1}</span>
                    <div class="card-emoji">${animal.emoji}</div>
                    <div class="card-label">${animal.name}</div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => this.handleCardClick(card, animal));
        return card;
    }

    handleCardClickByIndex(index) {
        const card = this.cardElements[index];
        if (card) {
            const animal = {
                id: card.dataset.id,
                name: card.dataset.name,
                emoji: card.dataset.emoji
            };
            this.handleCardClick(card, animal);
        }
    }

    handleCardClick(card, animal) {
        // หากบอร์ดล็อกอยู่ หรือการ์ดนี้เปิดอยู่แล้ว หรือจับคู่ไปแล้ว ไม่ต้องทำอะไร
        if (this.isLocked || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }

        // พลิกการ์ด
        soundManager.playFlip();
        card.classList.add('flipped');
        this.flippedCards.push(card);
        this.syncStateToPhone();

        // ถ้าเปิดครบ 2 ใบ ตรวจสอบผล
        if (this.flippedCards.length === 2) {
            this.checkMatch();
        }
    }

    checkMatch() {
        this.isLocked = true;
        const [card1, card2] = this.flippedCards;
        const isMatch = card1.dataset.id === card2.dataset.id;

        if (isMatch) {
            // จับคู่ตรงกัน!
            setTimeout(() => {
                soundManager.playMatch();
                card1.classList.add('matched');
                card2.classList.add('matched');

                const animalName = card1.dataset.name;
                const compliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
                soundManager.speakThai(`${animalName}! ${compliment}`);

                this.matchedPairs++;
                this.pairsCountEl.textContent = this.matchedPairs;
                this.updateStars(this.matchedPairs);

                this.flippedCards = [];
                this.isLocked = false;
                this.syncStateToPhone();

                // ตรวจสอบว่าชนะหรือยัง
                if (this.matchedPairs === this.currentPairs) {
                    setTimeout(() => this.handleVictory(), 600);
                }
            }, 350);
        } else {
            // ไม่ตรงกัน -> พลิกกลับอย่างนุ่มนวล
            setTimeout(() => {
                soundManager.playMismatch();
            }, 500);

            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
                this.isLocked = false;
                this.syncStateToPhone();
            }, 1000);
        }
    }

    updateStars(matched) {
        const ratio = matched / this.currentPairs;
        let stars = '⭐';
        if (ratio >= 0.5) stars = '⭐⭐';
        if (ratio === 1) stars = '⭐⭐⭐';
        this.starsDisplayEl.textContent = stars;
    }

    handleVictory() {
        soundManager.playWin();
        soundManager.speakThai("เย้! ชนะแล้ว เก่งที่สุดเลย!");
        this.startConfetti();
        this.victoryModal.classList.add('active');

        this.sendWS({
            type: 'GAME_WON'
        });
    }

    hideVictoryModal() {
        this.victoryModal.classList.remove('active');
        this.stopConfetti();
    }

    // แอนิเมชันพลุกระดาษสีรุ้ง (Confetti)
    startConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#9b59b6', '#ff6b81', '#f1c40f'];
        const confettiCount = 100;
        const particles = [];

        for (let i = 0; i < confettiCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 10 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 4 + 3,
                rot: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 8
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vRot;

                if (p.y > canvas.height) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rot * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });

            this.confettiAnimationId = requestAnimationFrame(render);
        };

        this.stopConfetti();
        render();
    }

    stopConfetti() {
        if (this.confettiAnimationId) {
            cancelAnimationFrame(this.confettiAnimationId);
            this.confettiAnimationId = null;
        }
        const canvas = document.getElementById('confetti-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}

// เริ่มต้นเกมเมื่อหน้าเว็บโหลดเสร็จ
window.addEventListener('DOMContentLoaded', () => {
    window.game = new MemoryGame();
});
