/** Wrapper mínimo do IndexedDB baseado em Promises. */
// A prévia (/preview/) usa um banco separado para não afetar a versão oficial no mesmo domínio.
export const DB_NAME = import.meta.env?.VITE_STORAGE_PREFIX ? `humanity-tokens-${import.meta.env.VITE_STORAGE_PREFIX}` : 'humanity-tokens'
export const DB_VERSION = 2

export function openDatabase(name = DB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' }).createIndex('email', 'email', { unique: true })
      }
      if (!db.objectStoreNames.contains('analyses')) {
        db.createObjectStore('analyses', { keyPath: 'id' }).createIndex('userId', 'userId')
      }
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' }).createIndex('userId', 'userId')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function run<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = fn(tx.objectStore(store))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
  })
}
