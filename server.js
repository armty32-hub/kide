const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');

// โหลด Games Bundle เผื่อในกรณีที่โฟลเดอร์ games ไม่ได้ถูกอัปโหลดขึ้นคลาวด์
let GAMES_BUNDLE = {};
try {
    GAMES_BUNDLE = require('./gamesBundle.js');
    // กู้คืนไฟล์เกมลงดิสก์โดยอัตโนมัติหากไฟล์ยังไม่มี
    for (const [relPath, fileContent] of Object.entries(GAMES_BUNDLE)) {
        const targetPath = path.join(__dirname, relPath);
        if (!fs.existsSync(targetPath)) {
            const dir = path.dirname(targetPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(targetPath, fileContent, 'utf8');
        }
    }
} catch (e) {
    console.log('Running without gamesBundle fallback');
}

// ฟังก์ชันหาพอร์ตว่างอัตโนมัติ (หรือใช้พอร์ตจาก Environment Variable PORT เช่น บน Render / Railway / Heroku)
function getAvailablePort(startingPort = 3001) {
    if (process.env.PORT) {
        return Promise.resolve(parseInt(process.env.PORT, 10));
    }
    return new Promise((resolve, reject) => {
        const testServer = net.createServer();
        testServer.unref();
        testServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(getAvailablePort(startingPort + 1));
            } else {
                reject(err);
            }
        });
        testServer.listen(startingPort, '0.0.0.0', () => {
            testServer.close(() => {
                resolve(startingPort);
            });
        });
    });
}

// ค้นหา IP Address ภายในวงแลน (Wi-Fi / LAN)
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

// MIME Types สำหรับ Static Files
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

async function startServer() {
    const PORT = await getAvailablePort(3001);
    const isProduction = !!process.env.PORT;
    const controllerURL = isProduction 
        ? `/controller.html` 
        : `http://${localIP}:${PORT}/controller.html`;

    // HTTP Server
    const server = http.createServer(async (req, res) => {
        const hostHeader = req.headers.host || `localhost:${PORT}`;
        const parsedUrl = new URL(req.url, `http://${hostHeader}`);
        const pathname = parsedUrl.pathname;

        // 1. API: ดึงข้อมูลการเชื่อมต่อ
        if (pathname === '/api/info') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                ip: localIP,
                port: PORT,
                controllerUrl: isProduction ? `http://${hostHeader}/controller.html` : controllerURL
            }));
            return;
        }

        // 2. API: ดึงภาพ QR Code แบบ DataURL สำหรับสแกนเข้า Controller
        if (pathname === '/api/qrcode') {
            try {
                const targetUrl = isProduction ? `https://${hostHeader}/controller.html` : controllerURL;
                const qrDataUrl = await QRCode.toDataURL(targetUrl, {
                    width: 280,
                    margin: 2,
                    color: {
                        dark: '#2f3542',
                        light: '#ffffff'
                    }
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ qr: qrDataUrl, url: targetUrl }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error generating QR code');
            }
            return;
        }

        // 3. Static Files
        let relPath = (pathname === '/' ? 'index.html' : pathname).replace(/^\/+/, '');
        let filePath = path.join(__dirname, relPath);

        // ตรวจสอบไฟล์บนเครื่อง
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
            return;
        }

        // Fallback: หากไฟล์ไม่มีบนเครื่อง ให้ดึงจาก GAMES_BUNDLE โดยตรง (แก้ปัญหา 404 บนคลาวด์ 100%)
        if (GAMES_BUNDLE[relPath]) {
            const ext = path.extname(relPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'text/html; charset=utf-8';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(GAMES_BUNDLE[relPath]);
            return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 ไม่พบไฟล์');
    });

    // WebSocket Server สำหรับคุยแบบเรียลไทม์ระหว่างจอโน้ตบุ๊กและมือถือ
    const wss = new WebSocketServer({ server });

    const hosts = new Set();
    const controllers = new Set();

    wss.on('connection', (ws) => {
        let clientRole = null;

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);

                switch (data.type) {
                    // ลงทะเบียนว่าไคลเอนต์นี้คือหน้าจอ (host) หรือมือถือ (controller)
                    case 'REGISTER':
                        clientRole = data.role;
                        if (data.role === 'host') {
                            hosts.add(ws);
                            ws.send(JSON.stringify({
                                type: 'CONTROLLER_COUNT',
                                count: controllers.size
                            }));
                        } else if (data.role === 'controller') {
                            controllers.add(ws);
                            broadcastToHosts({
                                type: 'CONTROLLER_CONNECTED',
                                count: controllers.size
                            });
                            broadcastToHosts({
                                type: 'REQUEST_STATE'
                            });
                        }
                        break;

                    // คำสั่งจากมือถือ -> ส่งต่อไปให้หน้าจอโน้ตบุ๊ก
                    case 'LAUNCH_GAME':
                    case 'EXIT_GAME':
                    case 'TAP_CARD':
                    case 'CHANGE_LEVEL':
                    case 'RESTART':
                        broadcastToHosts(data);
                        break;

                    // สถานะจากหน้าจอโน้ตบุ๊ก -> ส่งต่อไปให้มือถือทุกเครื่อง
                    case 'ACTIVE_GAME':
                    case 'SYNC_STATE':
                    case 'GAME_WON':
                        broadcastToControllers(data);
                        break;
                }
            } catch (e) {
                console.error('WS parse error:', e);
            }
        });

        ws.on('close', () => {
            if (clientRole === 'host') {
                hosts.delete(ws);
            } else if (clientRole === 'controller') {
                controllers.delete(ws);
                broadcastToHosts({
                    type: 'CONTROLLER_DISCONNECTED',
                    count: controllers.size
                });
            }
        });
    });

    function broadcastToHosts(data) {
        const msg = JSON.stringify(data);
        for (const host of hosts) {
            if (host.readyState === host.OPEN) {
                host.send(msg);
            }
        }
    }

    function broadcastToControllers(data) {
        const msg = JSON.stringify(data);
        for (const ctrl of controllers) {
            if (ctrl.readyState === ctrl.OPEN) {
                ctrl.send(msg);
            }
        }
    }

    server.listen(PORT, '0.0.0.0', () => {
        console.log('==================================================');
        console.log('🎮 สวนสนุกเสริมพัฒนาการ 30 เกม - เซิร์ฟเวอร์พร้อมทำงานแล้ว!');
        console.log(`💻 หน้าจอหลัก: http://localhost:${PORT}`);
        console.log(`📱 โทรศัพท์มือถือ: ${controllerURL}`);
        console.log('==================================================');
    });
}

startServer().catch(console.error);
