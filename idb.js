/* ================== idb.js ================== */
// Minimal IndexedDB helper (promise-based). Stores blobs under 'downloads' store.
const IDB_HELPER = (function(){
  const DB_NAME = 'podclone-db';
  const DB_VERSION = 1;
  let dbp = null;

  function open(){
    if(dbp) return dbp;
    dbp = new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if(!db.objectStoreNames.contains('downloads')) db.createObjectStore('downloads', {keyPath: 'id'});
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = ()=> reject(req.error);
    });
    return dbp;
  }

  async function put(obj){
    const db = await open();
    return new Promise((res,rej)=>{
      const tx = db.transaction('downloads','readwrite');
      const store = tx.objectStore('downloads');
      const r = store.put(obj);
      r.onsuccess = ()=>res(r.result);
      r.onerror = ()=>rej(r.error);
    });
  }

  async function get(id){
    const db = await open();
    return new Promise((res,rej)=>{
      const tx = db.transaction('downloads','readonly');
      const store = tx.objectStore('downloads');
      const r = store.get(id);
      r.onsuccess = ()=>res(r.result);
      r.onerror = ()=>rej(r.error);
    });
  }

  async function all(){
    const db = await open();
    return new Promise((res,rej)=>{
      const tx = db.transaction('downloads','readonly');
      const store = tx.objectStore('downloads');
      const r = store.getAll();
      r.onsuccess = ()=>res(r.result);
      r.onerror = ()=>rej(r.error);
    });
  }

  async function del(id){
    const db = await open();
    return new Promise((res,rej)=>{
      const tx = db.transaction('downloads','readwrite');
      const store = tx.objectStore('downloads');
      const r = store.delete(id);
      r.onsuccess = ()=>res();
      r.onerror = ()=>rej(r.error);
    });
  }

  return {put,get,all,del};
})();