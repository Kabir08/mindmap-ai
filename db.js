const DB_NAME = 'MindMapDB';
const STORE = 'maps';

let db;
const openDB = () => new Promise((res, rej) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = e => {
    const db = e.target.result;
    db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
  };
  req.onsuccess = e => { db = e.target.result; res(db); };
  req.onerror = e => rej(e);
});

export async function saveMap(map) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).add(map);
  return tx.complete;
}

export async function getMapsByDate(dateStr) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const all = await new Promise(res => {
    const req = store.getAll();
    req.onsuccess = () => res(req.result);
  });
  return all.filter(m => new Date(m.timestamp).toDateString() === dateStr);
}