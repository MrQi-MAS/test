// ════════════════════════════════════════
// db-firebase.js
// Firebase Realtime Database Helper
// ════════════════════════════════════════

// Firebase Config
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

// ป้องกัน initialize ซ้ำ
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const rtdb = firebase.database();

// ════════════════════════════════════════
// DB Object
// ════════════════════════════════════════
const DB = {
  cache: {},

  get(key) {
    return this.cache[key] === undefined ? null : this.cache[key];
  },

  async set(key, value) {
    this.cache[key] = value;

    try {
      await rtdb.ref(key).set(value);
      return true;
    } catch (err) {
      console.error("DB SET ERROR:", key, err);
      return false;
    }
  },

  async del(key) {
    delete this.cache[key];

    try {
      await rtdb.ref(key).remove();
      return true;
    } catch (err) {
      console.error("DB DELETE ERROR:", key, err);
      return false;
    }
  },

  async loadAll(keys) {
    for (const key of keys) {
      try {
        const snap = await rtdb.ref(key).once("value");

        if (snap.exists()) {
          this.cache[key] = snap.val();
        } else {
          this.cache[key] = null;
        }
      } catch (err) {
        console.error("DB LOAD ERROR:", key, err);
        this.cache[key] = null;
      }
    }
  },

  async load(key) {
    try {
      const snap = await rtdb.ref(key).once("value");

      const value = snap.exists()
        ? snap.val()
        : null;

      this.cache[key] = value;

      return value;
    } catch (err) {
      console.error("DB LOAD ERROR:", key, err);
      return null;
    }
  },

  watch(key, callback) {
    rtdb.ref(key).on("value", snap => {
      const value = snap.exists()
        ? snap.val()
        : null;

      this.cache[key] = value;

      if (typeof callback === "function") {
        callback(value);
      }
    });
  },

  unwatch(key) {
    rtdb.ref(key).off();
  },

  clearCache() {
    this.cache = {};
  }
};

// ให้เรียกใช้จากไฟล์อื่นได้
window.DB = DB;

console.log("✅ Firebase Connected");
