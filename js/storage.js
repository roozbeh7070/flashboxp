const STORAGE_KEY = 'lang_app_v2';
const DB_NAME = 'FlashcardAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';
const KEY_NAME = 'current_data';

// Helper to open the IndexedDB database
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

// Async function to load data from IndexedDB
export const loadDataFromIndexedDB = async () => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(KEY_NAME);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB load error:", e);
        return null;
    }
};

// Async function to save data to IndexedDB
export const saveToIndexedDB = async (data) => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(data, KEY_NAME);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB write error:", e);
    }
};


export const ensureSystemFolders = (data) => {
    if (!data) return data;
    if (!data.folders) data.folders = [];

    // Robust Data Migration and De-duplication
    data.folders.forEach(f => { if(f.name === 'موفق‌ها') f.name = 'کلمات موفق'; });
    
    const systemFolders = [
        {name: 'همه کلمات', words: [], isSystem: true, id: 0},
        {name: 'کلمات موفق', words: [], isSystem: true, id: 222},
        {name: 'تمرین مجدد', words: [], isSystem: true, id: 111}
    ];

    systemFolders.forEach(sys => {
        const count = data.folders.filter(f => f.id === sys.id).length;
        if (count === 0) {
            data.folders.unshift(sys);
        } else if (count > 1) {
            let found = false;
            data.folders = data.folders.filter(f => {
                if (f.id === sys.id) {
                    if (!found) { found = true; return true; }
                    return false;
                }
                return true;
            });
        }
    });

    const phraseSystemFolders = [
        {name: 'همه عبارت‌ها', words: [], isSystem: true, id: 300, isPhrase: true},
        {name: 'عبارت‌های موفق', words: [], isSystem: true, id: 322, isPhrase: true},
        {name: 'تمرین مجدد (عبارت)', words: [], isSystem: true, id: 311, isPhrase: true}
    ];

    phraseSystemFolders.forEach(sys => {
        const count = data.folders.filter(f => f.id === sys.id).length;
        if (count === 0) {
            // Unshift so they appear at the top
            data.folders.unshift(sys);
        } else if (count > 1) {
            let found = false;
            data.folders = data.folders.filter(f => {
                if (f.id === sys.id) {
                    if (!found) { found = true; return true; }
                    return false;
                }
                return true;
            });
        }
    });

    if (data.folders.filter(f => f.name === 'کلمات موفق').length > 1) {
        data.folders = data.folders.filter(f => !(f.name === 'کلمات موفق' && f.id !== 222));
    }

    return data;
};

export const getInitialData = () => {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { 
        folders: [
            {name: 'همه کلمات', words: [], isSystem: true, id: 0},
            {name: 'کلمات موفق', words: [], isSystem: true, id: 222},
            {name: 'تمرین مجدد', words: [], isSystem: true, id: 111},
            {name: 'همه عبارت‌ها', words: [], isSystem: true, id: 300, isPhrase: true},
            {name: 'عبارت‌های موفق', words: [], isSystem: true, id: 322, isPhrase: true},
            {name: 'تمرین مجدد (عبارت)', words: [], isSystem: true, id: 311, isPhrase: true}
        ],
        settings: {
            targetLang: 'en'
        }
    };

    if (!data.settings) {
        data.settings = { targetLang: 'en' };
    }

    return ensureSystemFolders(data);
};

export const saveData = (data) => {
    // 1. Sync write to localStorage (fast fallback/backup)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // 2. Async write to IndexedDB
    saveToIndexedDB(data).catch(err => console.error("IndexedDB save failed:", err));
};

export const clearData = async () => {
    localStorage.removeItem(STORAGE_KEY);
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(KEY_NAME);
            request.onsuccess = () => resolve();
            request.onerror = () => resolve(); // Resolve even on error to allow app reset
        });
    } catch (e) {
        console.error("IndexedDB clear failed:", e);
    }
};
