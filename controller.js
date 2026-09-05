// จอยสติ๊กโทรศัพท์มือถือสำหรับศูนย์รวม 20 เกม
class UniversalGameController {
    constructor() {
        this.ws = null;
        this.statusText = document.getElementById('status-text');
        this.statusDot = document.querySelector('.status-dot');
        this.activeGameName = document.getElementById('active-game-name');
        this.viewHub = document.getElementById('view-hub');
        this.viewGameplay = document.getElementById('view-gameplay');
        this.hubGameList = document.getElementById('hub-game-list');
        this.gridEl = document.getElementById('controller-grid');
        this.scoreText = document.getElementById('score-text');
        this.winToast = document.getElementById('ctrl-win-toast');
        this.btnBackToHub = document.getElementById('btn-back-to-hub');
        this.btnRestart = document.getElementById('btn-ctrl-restart');

        this.activeGame = 'hub';

        this.initHubUI();
        this.initGameplayUI();
        this.connectWebSocket();
    }

    initHubUI() {
        if (!this.hubGameList) return;
        this.hubGameList.innerHTML = '';

        GAMES_DATA.forEach(game => {
            const item = document.createElement('div');
            item.className = 'ctrl-game-item';
            item.innerHTML = `
                <div class="ctrl-game-emoji">${game.emoji}</div>
                <div class="ctrl-game-title">${game.title}</div>
            `;
            item.addEventListener('click', () => {
                this.vibrate(40);
                this.launchGame(game.id, game.title);
            });
            this.hubGameList.appendChild(item);
        });
    }

    initGameplayUI() {
        this.btnBackToHub.addEventListener('click', () => {
            this.vibrate(30);
            this.sendAction({ type: 'EXIT_GAME' });
            this.showHubView();
        });

        this.btnRestart.addEventListener('click', () => {
            this.vibrate(50);
            this.sendAction({ type: 'RESTART' });
        });
    }

    launchGame(gameId, title) {
        this.sendAction({ type: 'LAUNCH_GAME', gameId });
        this.showGameplayView(title);
    }

    showHubView() {
        this.activeGame = 'hub';
        this.activeGameName.textContent = 'สวนสนุก 20 เกม';
        this.viewHub.classList.add('active');
        this.viewGameplay.classList.remove('active');
    }

    showGameplayView(title) {
        this.activeGame = 'game';
        if (title) this.activeGameName.textContent = title;
        this.viewHub.classList.remove('active');
        this.viewGameplay.classList.add('active');
    }

    connectWebSocket() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${location.host}`;

        this.updateStatus('connecting');
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            this.updateStatus('connected');
            this.sendAction({ type: 'REGISTER', role: 'controller' });
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleServerMessage(data);
            } catch (e) {}
        };

        this.ws.onclose = () => {
            this.updateStatus('disconnected');
            setTimeout(() => this.connectWebSocket(), 2000);
        };
    }

    sendAction(action) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(action));
        }
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'ACTIVE_GAME':
                if (data.gameId === 'hub') {
                    this.showHubView();
                } else {
                    this.showGameplayView(data.title);
                }
                break;
            case 'SYNC_STATE':
                this.renderCards(data);
                break;
            case 'GAME_WON':
                this.showVictoryToast();
                break;
        }
    }

    renderCards(state) {
        const { pairs, matchedPairs, cards } = state;
        if (!cards) return;

        this.scoreText.textContent = `${matchedPairs || 0} / ${pairs || 1} ข้อ`;

        // ปรับ CSS Grid layout ตามจำนวนปุ่ม
        this.gridEl.className = 'controller-grid';
        if (cards.length <= 4) {
            this.gridEl.classList.add('grid-2');
        } else if (cards.length <= 6) {
            this.gridEl.classList.add('grid-3');
        } else {
            this.gridEl.classList.add('grid-4');
        }

        this.gridEl.innerHTML = '';
        cards.forEach((card, index) => {
            const btn = document.createElement('button');
            btn.className = 'ctrl-btn';
            if (card.flipped) btn.classList.add('flipped');
            if (card.matched) btn.classList.add('matched');

            const icon = (card.flipped || card.matched) ? card.emoji : (card.emoji || '🐾');
            const label = card.name || `ปุ่ม ${index + 1}`;

            btn.innerHTML = `
                <span class="ctrl-btn-num">${index + 1}</span>
                <span class="ctrl-btn-icon">${icon}</span>
                <span class="ctrl-btn-label">${label}</span>
            `;

            btn.addEventListener('click', () => {
                this.vibrate(40);
                this.sendAction({ type: 'TAP_CARD', index: index });
            });

            this.gridEl.appendChild(btn);
        });
    }

    showVictoryToast() {
        this.vibrate([100, 50, 100, 50, 200]);
        this.winToast.classList.add('show');
        setTimeout(() => this.winToast.classList.remove('show'), 3500);
    }

    vibrate(pattern) {
        if ('vibrate' in navigator) {
            try { navigator.vibrate(pattern); } catch (e) {}
        }
    }

    updateStatus(status) {
        this.statusDot.className = 'status-dot';
        if (status === 'connected') {
            this.statusDot.classList.add('connected');
            this.statusText.textContent = 'เชื่อมต่อแล้ว 🟢';
        } else if (status === 'connecting') {
            this.statusText.textContent = 'กำลังเชื่อมต่อ... 🟡';
        } else {
            this.statusDot.classList.add('disconnected');
            this.statusText.textContent = 'สัญญาณขาด 🔴';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new UniversalGameController();
});
