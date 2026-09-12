// ระบบเสียงเอฟเฟกต์ (Sound Effects) สังเคราะห์ด้วย Web Audio API โดยไม่ต้องพึ่งไฟล์ภายนอก
class SoundController {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.speechEnabled = true;
    }

    // เริ่มต้น AudioContext เมื่อมีการคลิกหรือสัมผัสครั้งแรก (ตามนโยบายเบราว์เซอร์)
    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    // 1. เสียงคลิกปุ่มทั่วไป
    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    // 2. เสียงพลิกการ์ด (Card Flip - เสียงป๊อปนุ่มนวล)
    playFlip() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // 3. เสียงจับคู่ถูกต้อง (Match Success - เสียงกระดิ่ง/ไซโลโฟนสดใส)
    playMatch() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        // คอร์ดโน้ต C5, E5, G5, C6 เรียงกัน
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const startTime = this.ctx.currentTime + (index * 0.08);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.35);
        });
    }

    // 4. เสียงจับคู่ไม่ตรง (Soft Miss - เสียงดึ๋งนุ่มนวล ไม่ทำให้ตกใจ)
    playMismatch() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(180, this.ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    // เมธอดสำหรับเสียงตอบผิด / เล่นผิด (Alias ชี้ไปยัง playMismatch)
    playWrong() {
        this.playMismatch();
    }

    // เมธอด playError (Alias ชี้ไปยัง playWrong) เพื่อป้องกันข้อผิดพลาดกรณีเกมเรียกใช้ playError() เช่น games/alphabet-cards/index.html
    playError() {
        this.playWrong();
    }

    // 5. เสียงเฉลิมฉลองเมื่อชนะเกม (Victory Fanfare)
    playWin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const fanfareNotes = [
            { f: 523.25, d: 0.15 }, // C5
            { f: 523.25, d: 0.15 }, // C5
            { f: 523.25, d: 0.15 }, // C5
            { f: 659.25, d: 0.3 },  // E5
            { f: 783.99, d: 0.2 },  // G5
            { f: 1046.50, d: 0.6 }  // C6
        ];

        let curTime = this.ctx.currentTime;
        fanfareNotes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, curTime);

            gain.gain.setValueAtTime(0.25, curTime);
            gain.gain.exponentialRampToValueAtTime(0.001, curTime + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(curTime);
            osc.stop(curTime + note.d);

            curTime += note.d * 0.85;
        });
    }

    // เสียงพูดภาษาไทยให้กำลังใจผ่าน Web Speech API (ปรับความเร็วให้เหมาะสมกับเด็กเล็กปฐมวัย)
    speakThai(text) {
        if (this.muted || !this.speechEnabled) return;
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        try {
            window.speechSynthesis.cancel(); // ล้างคิวเสียงก่อนหน้า ป้องกันเสียงพูดซ้อนทับกันเมื่อเด็กแตะปุ่มถี่ๆ
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'th-TH';

            // R1: ปรับลดความเร็วลงมาที่ 0.86 (ช่วง 0.85 - 0.88) เพื่อให้เด็กเล็กปฐมวัย (2-6 ขวบ) ฟังทัน ชัดถ้อยชัดคำ จังหวะเว้นวรรคเป็นมิตร
            utterance.rate = 0.86;

            // รักษาระดับเสียงให้นุ่มนวล สดใส เป็นมิตร (1.25) โทนเสียงสูงน่าฟัง ไม่แหลมหรือต่ำเกินไป
            utterance.pitch = 1.25;

            // ค้นหาเสียงภาษาไทยที่ติดตั้งอยู่ในระบบเพื่อความแม่นยำในการออกเสียงสูงสุด
            if (typeof window.speechSynthesis.getVoices === 'function') {
                const voices = window.speechSynthesis.getVoices();
                if (Array.isArray(voices) && voices.length > 0) {
                    const thaiVoice = voices.find(v => v && (v.lang === 'th-TH' || (typeof v.lang === 'string' && v.lang.startsWith('th'))));
                    if (thaiVoice) {
                        utterance.voice = thaiVoice;
                    }
                }
            }

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.log('Speech synthesis error:', e);
        }
    }
}

// ส่งออกออบเจกต์ระบบเสียง
const soundManager = new SoundController();

if (typeof window !== 'undefined') {
    window.soundManager = soundManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SoundController, soundManager, SoundManager: SoundController };
}
