const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');

// ฟังก์ชันหาพอร์ตว่างอัตโนมัติ เริ่มต้นที่ 3001 หรือพอร์ตที่ระบุ
function getAvailablePort(startingPort = 3001) {
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
    const controllerURL = `http://${localIP}:${PORT}/controller.html`;

    // HTTP Server
    const server = http.createServer(async (req, res) => {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const pathname = parsedUrl.pathname;

        // 1. API: ดึงข้อมูลการเชื่อมต่อ
        if (pathname === '/api/info') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                ip: localIP,
                port: PORT,
                controllerUrl: controllerURL
            }));
            return;
        }

        // 2. API: ดึงภาพ QR Code แบบ DataURL สำหรับสแกนเข้า Controller
        if (pathname === '/api/qrcode') {
            try {
                const qrDataUrl = await QRCode.toDataURL(controllerURL, {
                    width: 280,
                    margin: 2,
                    color: {
                        dark: '#2f3542',
                        light: '#ffffff'
                    }
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ qr: qrDataUrl, url: controllerURL }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error generating QR code');
            }
            return;
        }

        // 3. Static Files
        let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 ไม่พบไฟล์');
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
        });
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
                            // ส่งจำนวนมือถือที่เชื่อมต่ออยู่ไปให้หน้าจอ
                            ws.send(JSON.stringify({
                                type: 'CONTROLLER_COUNT',
                                count: controllers.size
                            }));
                        } else if (data.role === 'controller') {
                            controllers.add(ws);
                            // แจ้งเตือนหน้าจอว่ามีมือถือเข้ามาใหม่
                            broadcastToHosts({
                                type: 'CONTROLLER_CONNECTED',
                                count: controllers.size
                            });
                            // ขอสถานะเกมล่าสุดจากโฮสต์มาส่งให้มือถือ
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
        console.log('🎮 สวนสัตว์หรรษา - เซิร์ฟเวอร์พร้อมทำงานแล้ว!');
        console.log(`💻 หน้าจอโน้ตบุ๊ก: http://localhost:${PORT}`);
        console.log(`📱 โทรศัพท์มือถือ: ${controllerURL}`);
        console.log('==================================================');
    });
}

startServer().catch(console.error);
