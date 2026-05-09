const STORAGE_KEY = 'lang_app_v2';

export const getInitialData = () => {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { 
        folders: [
            {name: 'همه کلمات', words: [], isSystem: true, id: 0},
            {name: 'کلمات موفق', words: [], isSystem: true, id: 222},
            {name: 'تمرین مجدد', words: [], isSystem: true, id: 111}
        ],
        settings: {
            targetLang: 'en'
        }
    };

    if (!data.settings) {
        data.settings = { targetLang: 'en' };
    }

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

    if (data.folders.filter(f => f.name === 'کلمات موفق').length > 1) {
        data.folders = data.folders.filter(f => !(f.name === 'کلمات موفق' && f.id !== 222));
    }

    return data;
};

export const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const clearData = () => {
    localStorage.removeItem(STORAGE_KEY);
};
