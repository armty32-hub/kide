// ข้อมูล 30 เกมเสริมพัฒนาการสำหรับเด็กปฐมวัย (อายุไม่เกิน 6 ขวบ)
const GAMES_DATA = [
    // 📖 หมวดที่ 1: ภาษาไทย นิทาน และการอ่าน (Thai & Stories)
    {
        id: "thai-storybook",
        title: "ห้องนิทานภาพมีเสียงเล่า",
        category: "thai",
        categoryName: "📖 ภาษาไทย & นิทาน",
        emoji: "📚",
        color: "#0284c7",
        age: "2-6 ขวบ",
        desc: "นิทานภาพแสนสนุก เช่น กระต่ายกับเต่า พร้อมเสียงพากย์บรรยายและไฮไลต์ตัวหนังสือ",
        path: "games/thai-storybook/index.html"
    },
    {
        id: "thai-phonics",
        title: "สะกดคำสระหรรษา",
        category: "thai",
        categoryName: "📖 ภาษาไทย & นิทาน",
        emoji: "🗣️",
        color: "#059669",
        age: "3-6 ขวบ",
        desc: "ฝึกสะกดคำสระพื้นฐาน ก+า = กา, ต+า = ตา พร้อมเสียงอ่าน กอ-อา-กา ชัดเจน",
        path: "games/thai-phonics/index.html"
    },
    {
        id: "thai-words",
        title: "ตลาดคำศัพท์ภาษาไทย",
        category: "thai",
        categoryName: "📖 ภาษาไทย & นิทาน",
        emoji: "🏷️",
        color: "#ea580c",
        age: "3-6 ขวบ",
        desc: "จับคู่คำศัพท์ภาษาไทยง่ายๆ กับภาพประกอบ เช่น แมว หมา บ้าน ปลา ดอกไม้",
        path: "games/thai-words/index.html"
    },
    {
        id: "thai-vowels",
        title: "สวนสนุกสระภาษาไทย",
        category: "thai",
        categoryName: "📖 ภาษาไทย & นิทาน",
        emoji: "🔤",
        color: "#7c3aed",
        age: "3-6 ขวบ",
        desc: "เรียนรู้เสียงและรูปสระไทย อะ อา อิ อี อุ อู สนุกไปกับเสียงการ์ตูน",
        path: "games/thai-vowels/index.html"
    },
    {
        id: "thai-rhymes",
        title: "บทกลอนและเพลงเด็กอนุบาล",
        category: "thai",
        categoryName: "📖 ภาษาไทย & นิทาน",
        emoji: "🎤",
        color: "#db2777",
        age: "2-6 ขวบ",
        desc: "คาราโอเกะเด็ก ร้องเล่นเพลง ช้าง ช้าง ช้าง และจับปูดำ ตัวหนังสือเด้งตามจังหวะ",
        path: "games/thai-rhymes/index.html"
    },
    {
        id: "sentence-builder",
        title: "เรียงคำเป็นประโยคแสนสนุก",
        category: "thai",
        categoryName: "📖 ภาษาไทย & นิทาน",
        emoji: "🧩",
        color: "#0d9488",
        age: "4-6 ขวบ",
        desc: "ฝึกเรียงบล็อกคำง่ายๆ ให้เป็นประโยคความเดียว เช่น [ แมว ] [ กิน ] [ ปลา ]",
        path: "games/sentence-builder/index.html"
    },

    // ➕ หมวดที่ 2: การบวกเลขและคณิตศาสตร์เด็กเล็ก (Addition & Math)
    {
        id: "fruit-addition",
        title: "บวกเลขผลไม้หรรษา",
        category: "math",
        categoryName: "➕ บวกเลข & คณิต",
        emoji: "🍎",
        color: "#e11d48",
        age: "3-6 ขวบ",
        desc: "บวกเลขผ่านภาพผลไม้จริง เช่น แอปเปิ้ล 2 ผล รวมกับ 1 ผล เป็นกี่ผลเอ่ย?",
        path: "games/fruit-addition/index.html"
    },
    {
        id: "addition-train",
        title: "รถไฟบวกเลขผจญภัย",
        category: "math",
        categoryName: "➕ บวกเลข & คณิต",
        emoji: "🚂",
        color: "#2563eb",
        age: "4-6 ขวบ",
        desc: "เติมตัวเลขผลบวกลงบนโบกี้รถไฟ เมื่อตอบถูกรถไฟจะแล่นฉึกฉัก ปู๊นๆ!",
        path: "games/addition-train/index.html"
    },
    {
        id: "dice-sum",
        title: "ทอยเต๋าวิเศษบวกแต้ม",
        category: "math",
        categoryName: "➕ บวกเลข & คณิต",
        emoji: "🎲",
        color: "#d97706",
        age: "4-6 ขวบ",
        desc: "ทอยลูกเต๋า 2 ลูก นับจุดรวมกัน ฝึกทักษะการมองเห็นจำนวน (Subitizing)",
        path: "games/dice-sum/index.html"
    },
    {
        id: "sweet-shop",
        title: "ร้านค้าขนมหวานคิดเงิน",
        category: "math",
        categoryName: "➕ บวกเลข & คณิต",
        emoji: "🧁",
        color: "#ec4899",
        age: "4-6 ขวบ",
        desc: "ซื้อไอศกรีม 2 บาท กับขนมเค้ก 3 บาท รวมเป็นกี่บาท? ฝึกบวกเลขในชีวิตจริง",
        path: "games/sweet-shop/index.html"
    },
    {
        id: "fruit-counter",
        title: "นับผลไม้หรรษา 1-10",
        category: "math",
        categoryName: "➕ บวกเลข & คณิต",
        emoji: "🍊",
        color: "#f97316",
        age: "3-6 ขวบ",
        desc: "แตะนับจำนวนส้ม แอปเปิ้ล กล้วย พร้อมเสียงนับตัวเลข 1..10",
        path: "games/fruit-counter/index.html"
    },
    {
        id: "size-compare",
        title: "เทียบขนาด ใหญ่-กลาง-เล็ก",
        category: "math",
        categoryName: "➕ บวกเลข & คณิต",
        emoji: "🐘",
        color: "#3b82f6",
        age: "2-5 ขวบ",
        desc: "เรียนรู้มิติสัมพันธ์ แตะเลือกสัตว์หรือผลไม้ตัวที่ใหญ่ที่สุดหรือเล็กที่สุด",
        path: "games/size-compare/index.html"
    },
    {
        id: "number-balloons",
        title: "เติมตัวเลขลูกโป่งเรียงลำดับ",
        category: "math",
        categoryName: "➕ บวกเลข & คณิต",
        emoji: "🎈",
        color: "#f59e0b",
        age: "4-6 ขวบ",
        desc: "ช่วยเรียงลูกโป่งตัวเลข 1, 2, 3... ที่หายไปให้ถูกต้อง",
        path: "games/number-balloons/index.html"
    },
    {
        id: "shape-sorter",
        title: "ต่อบล็อกรูปทรงเรขาคณิต",
        category: "math",
        categoryName: "➕ บวกเลข & คณิต",
        emoji: "🔷",
        color: "#14b8a6",
        age: "2-5 ขวบ",
        desc: "จับคู่วงกลม สามเหลี่ยม สี่เหลี่ยม ดาว และหัวใจลงในบล็อก",
        path: "games/shape-sorter/index.html"
    },

    // 🧠 หมวดที่ 3: ความจำและการสังเกต (Memory & Observation)
    {
        id: "memory-match",
        title: "เปิดป้ายจับคู่สัตว์",
        category: "memory",
        categoryName: "🧠 ความจำ & สังเกต",
        emoji: "🦁",
        color: "#ff6b81",
        age: "2-6 ขวบ",
        desc: "ฝึกสมาธิและความจำระยะสั้น เปิดการ์ดหาสัตว์ที่เหมือนกัน",
        path: "games/memory-match/index.html"
    },
    {
        id: "shadow-match",
        title: "จับคู่เงาปริศนา",
        category: "memory",
        categoryName: "🧠 ความจำ & สังเกต",
        emoji: "👤",
        color: "#a55eea",
        age: "2-5 ขวบ",
        desc: "ดูโครงร่างเงาสีดำ แล้วทายว่าคือเงาของสัตว์ตัวไหน",
        path: "games/shadow-match/index.html"
    },
    {
        id: "odd-one-out",
        title: "หาภาพที่ไม่เข้าพวก",
        category: "memory",
        categoryName: "🧠 ความจำ & สังเกต",
        emoji: "🔍",
        color: "#ff7f50",
        age: "3-6 ขวบ",
        desc: "สังเกตความแตกต่างและหาภาพที่แปลกไปจากกลุ่ม",
        path: "games/odd-one-out/index.html"
    },
    {
        id: "peekaboo-animals",
        title: "ใครแอบอยู่หลังพุ่มไม้?",
        category: "memory",
        categoryName: "🧠 ความจำ & สังเกต",
        emoji: "🌿",
        color: "#2ed573",
        age: "2-4 ขวบ",
        desc: "สังเกตหาง หู หรือลายที่โผล่มา แล้วทายชื่อสัตว์",
        path: "games/peekaboo/index.html"
    },

    // 🎨 หมวดที่ 4: สีสันและการจำแนก (Colors & Classification)
    {
        id: "color-sort",
        title: "เก็บของใส่ตะกร้าตามสี",
        category: "colors",
        categoryName: "🎨 สีสัน & จำแนก",
        emoji: "🧺",
        color: "#eb4d4b",
        age: "2-5 ขวบ",
        desc: "แยกสิ่งของสีแดง สีเหลือง สีน้ำเงิน ใส่ตะกร้าให้ตรงสี",
        path: "games/color-sort/index.html"
    },
    {
        id: "animal-habitats",
        title: "แยกบ้านสัตว์ บก-น้ำ-ฟ้า",
        category: "colors",
        categoryName: "🎨 สีสัน & จำแนก",
        emoji: "🐬",
        color: "#22a6b3",
        age: "3-6 ขวบ",
        desc: "พาสัตว์น้อยกลับบ้าน ปลาอยู่ทะเล นกอยู่บนฟ้า กวางอยู่ในป่า",
        path: "games/animal-habitats/index.html"
    },
    {
        id: "magic-colors",
        title: "ผสมสีเวทมนตร์",
        category: "colors",
        categoryName: "🎨 สีสัน & จำแนก",
        emoji: "🧪",
        color: "#be2edd",
        age: "3-6 ขวบ",
        desc: "ทดลองผสมแม่สี แดง+เหลืองได้ส้ม น้ำเงิน+เหลืองได้เขียว",
        path: "games/magic-colors/index.html"
    },
    {
        id: "feed-animals",
        title: "ให้อาหารสัตว์ตามที่ชอบ",
        category: "colors",
        categoryName: "🎨 สีสัน & จำแนก",
        emoji: "🍌",
        color: "#f0932b",
        age: "2-5 ขวบ",
        desc: "ให้อาหารที่สัตว์ชอบ ลิงกินกล้วย กระต่ายกินแครอท หมากินกระดูก",
        path: "games/feed-animals/index.html"
    },

    // ⚡ หมวดที่ 5: กล้ามเนื้อมือและสายตา (Motor Skills & Reflexes)
    {
        id: "balloon-pop",
        title: "จิ้มลูกโป่งแตกฟองสบู่",
        category: "motor",
        categoryName: "⚡ กล้ามเนื้อมือ & ตา",
        emoji: "🫧",
        color: "#38bdf8",
        age: "2-5 ขวบ",
        desc: "แตะลูกโป่งและฟองสบู่ที่ลอยขึ้นมาให้แตกโป๊ะๆ มีเสียงสดใส",
        path: "games/balloon-pop/index.html"
    },
    {
        id: "catch-butterflies",
        title: "จับผีเสื้อหลากสีในสวน",
        category: "motor",
        categoryName: "⚡ กล้ามเนื้อมือ & ตา",
        emoji: "🦋",
        color: "#f472b6",
        age: "2-5 ขวบ",
        desc: "ฝึกสายตาและการแตะสัมผัส แตะจับผีเสื้อที่บินไปมาในทุ่งดอกไม้",
        path: "games/catch-butterflies/index.html"
    },
    {
        id: "drum-beat",
        title: "เคาะกลองตุ้มๆ ตามจังหวะ",
        category: "motor",
        categoryName: "⚡ กล้ามเนื้อมือ & ตา",
        emoji: "🥁",
        color: "#e67e22",
        age: "3-6 ขวบ",
        desc: "เคาะกลองตามจังหวะลูกบอลตก ฝึกประสาทสัมผัสและการฟัง",
        path: "games/drum-beat/index.html"
    },
    {
        id: "trace-stars",
        title: "ลากเส้นตามรอยดวงดาว",
        category: "motor",
        categoryName: "⚡ กล้ามเนื้อมือ & ตา",
        emoji: "⭐",
        color: "#f1c40f",
        age: "3-6 ขวบ",
        desc: "ลากเส้นต่อจุดดวงดาว เตรียมกล้ามเนื้อมือสำหรับจับดินสอ",
        path: "games/trace-stars/index.html"
    },

    // 🎵 หมวดที่ 6: ดนตรีและศิลปะ (Music & Art)
    {
        id: "animal-piano",
        title: "เปียโนเสียงสัตว์น้อย",
        category: "creativity",
        categoryName: "🎵 ดนตรี & ศิลปะ",
        emoji: "🎹",
        color: "#9b59b6",
        age: "2-6 ขวบ",
        desc: "คีย์บอร์ดสายรุ้ง แตะคีย์เพื่อฟังเสียงสัตว์และตัวโน้ต โด เร มี",
        path: "games/animal-piano/index.html"
    },
    {
        id: "guess-sound",
        title: "ทายเสียงสัตว์ปริศนา",
        category: "creativity",
        categoryName: "🎵 ดนตรี & ศิลปะ",
        emoji: "👂",
        color: "#3498db",
        age: "2-5 ขวบ",
        desc: "ฟังเสียงร้อง โฮ่งๆ เหมียวๆ มอๆ แล้วแตะเลือกสัตว์ให้ตรง",
        path: "games/guess-sound/index.html"
    },
    {
        id: "alphabet-cards",
        title: "บัตรคำศัพท์ ก-ไก่ & ABC",
        category: "creativity",
        categoryName: "🎵 ดนตรี & ศิลปะ",
        emoji: "🔤",
        color: "#16a085",
        age: "3-6 ขวบ",
        desc: "เรียนรู้พยัญชนะไทยและตัวอักษรภาษาอังกฤษ พร้อมรูปภาพประกอบ",
        path: "games/alphabet-cards/index.html"
    },
    {
        id: "coloring-canvas",
        title: "จานสีระบายใจสัตว์น่ารัก",
        category: "creativity",
        categoryName: "🎵 ดนตรี & ศิลปะ",
        emoji: "🎨",
        color: "#e84393",
        age: "2-6 ขวบ",
        desc: "แต้มสีสันสดใสลงในภาพการ์ตูนสัตว์ ปลูกฝังความคิดสร้างสรรค์",
        path: "games/coloring-canvas/index.html"
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAMES_DATA;
}
