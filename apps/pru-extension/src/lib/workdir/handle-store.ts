const DB_NAME = "pru-extension-workdir"
const STORE_NAME = "handles"
const HANDLE_KEY = "workdir"

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error ?? new Error("打开工作目录存储失败"))
    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase()

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = run(store)

    request.onerror = () => reject(request.error ?? new Error("访问工作目录存储失败"))
    request.onsuccess = () => resolve(request.result)
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => reject(transaction.error ?? new Error("访问工作目录存储失败"))
  })
}

async function getStoredHandle() {
  return withStore<FileSystemDirectoryHandle | undefined>("readonly", (store) => store.get(HANDLE_KEY))
}

async function saveStoredHandle(handle: FileSystemDirectoryHandle) {
  await withStore<IDBValidKey>("readwrite", (store) => store.put(handle, HANDLE_KEY))
}

async function clearStoredHandle() {
  await withStore<undefined>("readwrite", (store) => store.delete(HANDLE_KEY))
}

export { clearStoredHandle, getStoredHandle, saveStoredHandle }
