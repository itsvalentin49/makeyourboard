const DB_NAME = "makeyourboard-custom-images";
const DB_VERSION = 1;
const STORE_NAME = "images";

export type StoredCustomImage = {
  id: string;
  blob: Blob;
  type: string;
  createdAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomImage(blob: Blob): Promise<string> {
  const db = await openDB();

  const id = `custom-image-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  const item: StoredCustomImage = {
    id,
    blob,
    type: blob.type,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put(item);

    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCustomImageUrl(
  id: string | null | undefined
): Promise<string | null> {
  if (!id) return null;

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onsuccess = () => {
      const item = request.result as StoredCustomImage | undefined;

      if (!item?.blob) {
        resolve(null);
        return;
      }

      resolve(URL.createObjectURL(item.blob));
    };

    request.onerror = () => reject(request.error);
  });
}

export async function deleteCustomImage(
  id: string | null | undefined
): Promise<void> {
  if (!id) return;

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}