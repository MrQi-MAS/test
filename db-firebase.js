// ════════════════════════════════════════
// db-firebase.js
// เชื่อมต่อกับ Firebase Realtime Database
// ════════════════════════════════════════
//
// วิธีตั้งค่า:
// 1. ไปที่ https://console.firebase.google.com -> สร้างโปรเจกต์ใหม่ (ฟรี)
// 2. เมนูซ้าย -> Build -> Realtime Database -> Create Database
//    (เลือก mode "Test mode" ก่อนเพื่อทดสอบ — ค่อยตั้ง Rules ทีหลัง)
// 3. ไปที่ Project settings (รูปเฟือง) -> General -> เลื่อนลงหา "Your apps"
//    -> กด ไอคอน Web (</>) -> ตั้งชื่อแอป -> จะได้ config object มา
// 4. นำ config ด้านล่างมาแทนที่ firebaseConfig ของคุณ
// 5. ใน Realtime Database -> แท็บ Rules ให้ตั้งดังนี้ (สำหรับทดสอบ):
//    {
//      "rules": {
//        ".read": true,
//        ".write": true
//      }
//    }
//    (โหมดนี้เปิดให้ทุกคนอ่าน/เขียนได้ — เหมาะสำหรับทดสอบเท่านั้น
//     ถ้าจะใช้งานจริงต้องเขียน rules ให้รัดกุมกว่านี้)
//
// ════════════════════════════════════════

const firebaseConfig = {
    // Import the functions you need from the SDKs you need

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
  apiKey: "AIzaSyDYd7Y5YLiqiUjG-aNXZWLFUb_AnKH2x-k",
  authDomain: "nova-526f3.firebaseapp.com",
  databaseURL: "https://nova-526f3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nova-526f3",
  storageBucket: "nova-526f3.firebasestorage.app",
  messagingSenderId: "319708455385",
  appId: "1:319708455385:web:c997376991a69c1be4b9c8",
  measurementId: "G-1X8HW2SW7X"
};

firebase.initializeApp(firebaseConfig);

const rtdb = firebase.database();
};

firebase.initializeApp(firebaseConfig);
const rtdb = firebase.database();

// ════════════════════════════════════════
// DB object — เหมือน localStorage แต่ sync กับ Firebase
// (เก็บ cache ในหน่วยจำ + sync ขึ้น cloud)
// ════════════════════════════════════════
const DB = {
  cache: {},

  get(k) {
    return this.cache[k] === undefined ? null : this.cache[k];
  },

  set(k, v) {
    this.cache[k] = v;
    rtdb.ref(k).set(v).catch(e => console.error('DB set error:', k, e));
  },

  del(k) {
    delete this.cache[k];
    rtdb.ref(k).remove().catch(e => {});
  },

  // โหลดข้อมูลทั้งหมดครั้งแรก
  async loadAll(keys) {
    for (const k of keys) {
      try {
        const snap = await rtdb.ref(k).once('value');
        this.cache[k] = snap.exists() ? snap.val() : null;
      } catch (e) {
        console.error('DB load error:', k, e);
        this.cache[k] = null;
      }
    }
  },

  // ฟัง realtime update ของ key ใดๆ (เช่น 'rooms/r1/messages')
  // callback จะถูกเรียกทุกครั้งที่ข้อมูลเปลี่ยน (รวมครั้งแรกที่ subscribe)
  watch(k, callback) {
    rtdb.ref(k).on('value', snap => {
      const val = snap.exists() ? snap.val() : null;
      this.cache[k] = val;
      callback(val);
    });
  },

  unwatch(k) {
    rtdb.ref(k).off();
  }
};
