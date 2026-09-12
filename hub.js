// สคริปต์ควบคุม Kids Developmental Arcade Hub
class ArcadeHub {
    constructor() {
        this.gamesGrid = document.getElementById('games-grid');
        this.catButtons = document.querySelectorAll('.cat-btn');
        this.gameModal = document.getElementById('game-modal');
        this.gameIframe = document.getElementById('game-iframe');
        this.frameTitle = document.getElementById('frame-title');
        this.btnExitGame = document.getElementById('btn-exit-game');

        this.btnPhoneConnect = document.getElementById('btn-phone-connect');
        this.qrModal = document.getElementById('qr-modal');
        this.btnCloseQr = document.getElementById('btn-close-qr');
        this.qrImage = document.getElementById('qr-image');
        this.qrLoading = document.getElementById('qr-loading');
        this.qrLink = document.getElementById('qr-link');
        this.phoneBadge = document.getElementById('phone-badge');
        this.phoneStatusText = document.getElementById('phone-status-text');

        this.currentFilter = 'all';
        this.activeGame = null;
        this.ws = null;

        this.initUI();
        this.initWebSocket();
        this.renderGames();
    }

    initUI() {
        // กรองหมวดหมู่
        this.catButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.catButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.cat;
                this.renderGames();
            });
        });

        // ออกจากเกมกลับหน้า Hub
        this.btnExitGame.addEventListener('click', () => {
            this.closeGame();
        });

        // ปุ่มต่อจอยมือถือ
        this.btnPhoneConnect.addEventListener('click', () => {
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

        // สลับโหมดเสียงพากย์คนจริง / เสียงระบบ
        const btnVoiceMode = document.getElementById('btn-voice-mode');
        if (btnVoiceMode && typeof soundManager !== 'undefined') {
            const updateVoiceBtn = () => {
                if (soundManager.voiceMode === 'human') {
                    btnVoiceMode.innerHTML = '<span>🎙️</span> <span id="voice-mode-text">เสียงคนจริง</span>';
                    btnVoiceMode.style.borderColor = '#10b981';
                    btnVoiceMode.style.color = '#047857';
                } else {
                    btnVoiceMode.innerHTML = '<span>🤖</span> <span id="voice-mode-text">เสียงระบบ</span>';
                    btnVoiceMode.style.borderColor = '#64748b';
                    btnVoiceMode.style.color = '#475569';
                }
            };
            updateVoiceBtn();
            btnVoiceMode.addEventListener('click', () => {
                const nextMode = soundManager.voiceMode === 'human' ? 'system' : 'human';
                soundManager.setVoiceMode(nextMode);
                updateVoiceBtn();
                soundManager.playClick();
                if (nextMode === 'human') {
                    soundManager.speakThai('เปลี่ยนเป็นเสียงคนจริงแล้วจ้า');
                } else {
                    soundManager.speakThai('เปลี่ยนเป็นเสียงระบบแล้วครับ');
                }
            });
        }
    }

    initWebSocket() {
        const host = location.host || 'localhost:3001';
        try {
            this.ws = new WebSocket(`ws://${host}`);
            this.ws.onopen = () => {
                this.sendWS({ type: 'REGISTER', role: 'host' });
                this.phoneStatusText.textContent = 'รอจอยมือถือเชื่อมต่อ...';
            };
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'CONTROLLER_COUNT' || data.type === 'CONTROLLER_CONNECTED') {
                        if (data.count > 0) {
                            this.phoneBadge.className = 'phone-badge connected';
                            this.phoneStatusText.textContent = `📱 มือถือต่อแล้ว (${data.count} เครื่อง)`;
                        }
                    } else if (data.type === 'CONTROLLER_DISCONNECTED') {
                        if (data.count === 0) {
                            this.phoneBadge.className = 'phone-badge';
                            this.phoneStatusText.textContent = 'รอจอยมือถือเชื่อมต่อ...';
                        }
                    } else if (data.type === 'LAUNCH_GAME') {
                        // เมื่อเด็กเลือกเกมจากมือถือ
                        const game = GAMES_DATA.find(g => g.id === data.gameId);
                        if (game) this.openGame(game);
                    } else if (data.type === 'EXIT_GAME') {
                        this.closeGame();
                    }
                } catch (e) {}
            };
        } catch (e) {}
    }

    sendWS(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    renderGames() {
        this.gamesGrid.innerHTML = '';

        const filtered = this.currentFilter === 'all' 
            ? GAMES_DATA 
            : GAMES_DATA.filter(g => g.category === this.currentFilter);

        filtered.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <div class="game-emoji-wrap" style="background: ${game.color}20; color: ${game.color};">
                    ${game.emoji}
                </div>
                <div class="game-meta-tags">
                    <span class="tag-cat">${game.categoryName}</span>
                    <span class="tag-age">${game.age}</span>
                </div>
                <h3 class="game-card-title">${game.title}</h3>
                <p class="game-card-desc">${game.desc}</p>
                <button class="btn-play-game">🎮 แตะเพื่อเริ่มเล่น</button>
            `;

            card.addEventListener('click', () => {
                this.openGame(game);
            });

            this.gamesGrid.appendChild(card);
        });
    }

    openGame(game) {
        this.activeGame = game;
        this.frameTitle.textContent = `${game.emoji} ${game.title}`;
        this.gameIframe.src = game.path;
        this.gameModal.classList.add('active');

        // แจ้งบอกเซิร์ฟเวอร์ว่าเกมไหนเปิดอยู่
        this.sendWS({
            type: 'ACTIVE_GAME',
            gameId: game.id,
            title: game.title,
            emoji: game.emoji
        });
    }

    closeGame() {
        this.activeGame = null;
        this.gameIframe.src = 'about:blank';
        this.gameModal.classList.remove('active');

        this.sendWS({
            type: 'ACTIVE_GAME',
            gameId: 'hub'
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
            }
        } catch (e) {
            this.qrLoading.textContent = 'กรุณาเปิดผ่าน http://localhost:3001';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new ArcadeHub();
});
