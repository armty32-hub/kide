const PIANO_NOTES = [
    { note: 'โด', freq: 261.63, emoji: '🐶', name: 'น้องหมา', bg: '#ff4757' },
    { note: 'เร', freq: 293.66, emoji: '🐱', name: 'น้องแมว', bg: '#ff7f50' },
    { note: 'มี', freq: 329.63, emoji: '🐰', name: 'น้องกระต่าย', bg: '#ffa502' },
    { note: 'ฟา', freq: 349.23, emoji: '🐼', name: 'หมีแพนด้า', bg: '#2ed573' },
    { note: 'ซอล', freq: 392.00, emoji: '🦁', name: 'พี่สิงโต', bg: '#1e90ff' },
    { note: 'ลา', freq: 440.00, emoji: '🐘', name: 'พี่ช้าง', bg: '#3742fa' },
    { note: 'ที', freq: 493.88, emoji: '🐵', name: 'ลิงจ๋อ', bg: '#9b59b6' },
    { note: 'โด๊', freq: 523.25, emoji: '🐸', name: 'กบน้อย', bg: '#ff6b81' }
];

class AnimalPianoGame {
    constructor() {
        this.keysContainer = document.getElementById('piano-keys');
        this.pianoHint = document.getElementById('piano-hint');
        this.btnTwinkle = document.getElementById('btn-song-twinkle');
        this.btnLamb = document.getElementById('btn-song-lamb');
        this.keyElements = [];
        this.ws = null;

        this.initUI();
        this.initWebSocket();
    }

    initUI() {
        this.keysContainer.innerHTML = '';
        PIANO_NOTES.forEach((item, index) => {
            const key = document.createElement('button');
            key.className = 'piano-key';
            key.style.backgroundColor = item.bg;
            key.innerHTML = `
                <span class="key-emoji">${item.emoji}</span>
                <span class="key-note">${item.note}</span>
            `;

            key.addEventListener('click', () => {
                this.playKey(index);
            });

            this.keysContainer.appendChild(key);
            this.keyElements.push(key);
        });

        this.btnTwinkle.addEventListener('click', () => {
            // โด โด ซอล ซอล ลา ลา ซอล
            this.playSong([0, 0, 4, 4, 5, 5, 4]);
        });

        this.btnLamb.addEventListener('click', () => {
            // มี เร โด เร มี มี มี
            this.playSong([2, 1, 0, 1, 2, 2, 2]);
        });

        document.body.addEventListener('click', () => soundManager.init(), { once: true });
    }

    playKey(index) {
        if (index < 0 || index >= PIANO_NOTES.length) return;
        const item = PIANO_NOTES[index];
        const key = this.keyElements[index];

        soundManager.init();
        if (soundManager.ctx) {
            const ctx = soundManager.ctx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(item.freq, ctx.currentTime);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        }

        key.classList.add('active');
        setTimeout(() => key.classList.remove('active'), 250);
        this.pianoHint.textContent = `🎵 ${item.name} ร้องเสียงตัวโน้ต "${item.note}"!`;
    }

    async playSong(notes) {
        for (const idx of notes) {
            this.playKey(idx);
            await new Promise(r => setTimeout(r, 450));
        }
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
                        this.playKey(data.index);
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

    syncToPhone() {
        const cardsState = PIANO_NOTES.map((n, i) => ({
            index: i,
            emoji: n.emoji,
            name: n.note,
            flipped: false,
            matched: false
        }));

        this.sendWS({
            type: 'SYNC_STATE',
            pairs: 4,
            matchedPairs: 0,
            cards: cardsState
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new AnimalPianoGame();
});
