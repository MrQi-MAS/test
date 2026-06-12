// ════════════════════════════════════════
// db-firebase.js  v2.0
// Firebase Realtime Database Helper
// ════════════════════════════════════════

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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const rtdb = firebase.database();

// ════════════════════════════════════════
// DB Object
// ════════════════════════════════════════
const DB = {
  cache: {},

  // ── Basic ──────────────────────────────
  get(key) { return this.cache[key] === undefined ? null : this.cache[key]; },

  async set(key, value) {
    this.cache[key] = value;
    try { await rtdb.ref(key).set(value); return true; }
    catch (e) { console.error('DB.set', key, e); return false; }
  },

  async del(key) {
    delete this.cache[key];
    try { await rtdb.ref(key).remove(); return true; }
    catch (e) { console.error('DB.del', key, e); return false; }
  },

  async load(key) {
    try {
      const snap = await rtdb.ref(key).once('value');
      const val = snap.exists() ? snap.val() : null;
      this.cache[key] = val;
      return val;
    } catch (e) { console.error('DB.load', key, e); return null; }
  },

  async loadAll(keys) {
    await Promise.all(keys.map(k => this.load(k)));
  },

  watch(key, cb) {
    rtdb.ref(key).on('value', snap => {
      const val = snap.exists() ? snap.val() : null;
      this.cache[key] = val;
      if (typeof cb === 'function') cb(val);
    });
  },

  unwatch(key) { rtdb.ref(key).off(); },
  clearCache() { this.cache = {}; },

  // ── Push (append child with auto-id) ──
  async push(key, value) {
    try {
      const ref = await rtdb.ref(key).push(value);
      return ref.key;
    } catch (e) { console.error('DB.push', key, e); return null; }
  },

  // ── Update (merge, no overwrite) ──────
  async update(key, partial) {
    try {
      const cur = (await this.load(key)) || {};
      const merged = { ...cur, ...partial };
      this.cache[key] = merged;
      await rtdb.ref(key).set(merged);
      return true;
    } catch (e) { console.error('DB.update', key, e); return false; }
  },

  // ════════════════════════════════════════
  // USER / PROFILE helpers
  // ════════════════════════════════════════

  /** บันทึก field เฉพาะของ user โดยไม่ overwrite ทั้ง object */
  async saveUserField(userId, fields) {
    // fields = { displayName, bio, avatar, color, status, ... }
    const users = this.get('users') || {};
    users[userId] = { ...(users[userId] || {}), ...fields };
    this.cache['users'] = users;
    try {
      await rtdb.ref(`users/${userId}`).update(fields);
      return true;
    } catch (e) { console.error('DB.saveUserField', e); return false; }
  },

  /** อัปเดต status ผู้ใช้ (online / away / busy / offline) */
  async setStatus(userId, status) {
    return this.saveUserField(userId, { status });
  },

  // ════════════════════════════════════════
  // CALL SIGNAL helpers
  // calls/{callId}  = { caller, callee, type, status, offer, answer, ice_caller[], ice_callee[] }
  // ════════════════════════════════════════

  /** สร้าง call session ใหม่ */
  async createCall(callId, data) {
    this.cache[`calls/${callId}`] = data;
    try { await rtdb.ref(`calls/${callId}`).set(data); return true; }
    catch (e) { console.error('DB.createCall', e); return false; }
  },

  /** อัปเดต field ใน call session */
  async updateCall(callId, partial) {
    try { await rtdb.ref(`calls/${callId}`).update(partial); return true; }
    catch (e) { console.error('DB.updateCall', e); return false; }
  },

  /** ฟัง call session แบบ realtime */
  watchCall(callId, cb) { this.watch(`calls/${callId}`, cb); },
  unwatchCall(callId) { this.unwatch(`calls/${callId}`); },

  /** ลบ call session เมื่อวางสาย */
  async endCall(callId) { return this.del(`calls/${callId}`); },

  // ════════════════════════════════════════
  // PRESENCE (online/offline auto)
  // ════════════════════════════════════════

  /** เรียกหลัง login — ตั้ง presence อัตโนมัติ */
  setupPresence(userId) {
    const presRef = rtdb.ref(`users/${userId}/status`);
    const connRef = rtdb.ref('.info/connected');
    connRef.on('value', snap => {
      if (snap.val()) {
        presRef.onDisconnect().set('offline');
        presRef.set('online');
        // อัป cache ด้วย
        const users = this.get('users') || {};
        if (users[userId]) { users[userId].status = 'online'; this.cache['users'] = users; }
      }
    });
  }
};

window.DB = DB;
console.log('✅ Firebase DB v2 Connected');
