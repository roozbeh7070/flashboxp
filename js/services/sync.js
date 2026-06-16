import { supabase } from './supabase.js';
import { saveData } from '../storage.js';

export const pullFromCloud = async (user) => {
    const { data: remoteFolders, error: fErr } = await supabase.from('folders').select('*').eq('user_id', user.id);
    const { data: remoteWords, error: wErr } = await supabase.from('words').select('*').eq('user_id', user.id);
    if (fErr || wErr) throw fErr || wErr;

    return remoteFolders.map(rf => {
        const folderWords = remoteWords.filter(rw => rw.folder_id === rf.id).map(rw => ({
            id: rw.id,
            eng: rw.eng,
            per: rw.per,
            failed: rw.failed,
            success: rw.success,
            isPhrase: rw.is_phrase === true,
            updated_at: Number(rw.updated_at || 0)
        }));
        return {
            id: rf.id,
            name: rf.name,
            isPhrase: rf.is_phrase === true,
            updated_at: Number(rf.updated_at || 0),
            words: folderWords
        };
    });
};

export const pushToCloud = async (localFolders, user) => {
    const STORAGE_KEY = 'lang_app_v2';
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
        const localData = JSON.parse(rawData);
        await syncData(localData, user);
    }
};

export const syncData = async (localData, user) => {
    if (!user) return localData;

    try {
        // 1. Initialize metadata
        localData.deletedFolderIds = localData.deletedFolderIds || [];
        localData.deletedWordIds = localData.deletedWordIds || [];
        localData.settings = localData.settings || {};
        localData.settings.lastSyncTime = localData.settings.lastSyncTime || 0;

        const lastSync = Number(localData.settings.lastSyncTime || 0);
        const isFirstSync = lastSync === 0;

        // 2. Delete items that were deleted locally from the cloud
        if (localData.deletedFolderIds.length > 0) {
            const { error: delFoldErr } = await supabase
                .from('folders')
                .delete()
                .in('id', localData.deletedFolderIds)
                .eq('user_id', user.id);
            if (!delFoldErr) {
                localData.deletedFolderIds = [];
            } else {
                console.error("Error deleting folders from cloud:", delFoldErr);
            }
        }

        if (localData.deletedWordIds.length > 0) {
            const { error: delWordErr } = await supabase
                .from('words')
                .delete()
                .in('id', localData.deletedWordIds)
                .eq('user_id', user.id);
            if (!delWordErr) {
                localData.deletedWordIds = [];
            } else {
                console.error("Error deleting words from cloud:", delWordErr);
            }
        }

        // 3. Pull latest folders and words from cloud
        const { data: remoteFolders, error: fErr } = await supabase.from('folders').select('*').eq('user_id', user.id);
        const { data: remoteWords, error: wErr } = await supabase.from('words').select('*').eq('user_id', user.id);
        if (fErr || wErr) throw fErr || wErr;

        const remoteFoldersMap = new Map((remoteFolders || []).map(rf => [rf.id.toString(), rf]));
        const remoteWordsMap = new Map((remoteWords || []).map(rw => [rw.id.toString(), rw]));

        const foldersToUpsert = [];
        const wordsToUpsert = [];

        // 4. Reconcile Folders
        const systemFolders = localData.folders.filter(f => f.isSystem);
        const localRegularFolders = localData.folders.filter(f => !f.isSystem);
        const resolvedRegularFolders = [];

        for (const localFolder of localRegularFolders) {
            const rf = remoteFoldersMap.get(localFolder.id.toString());
            if (rf) {
                const remoteUpdated = Number(rf.updated_at || 0);
                const localUpdated = Number(localFolder.updated_at || 0);

                if (remoteUpdated > localUpdated) {
                    localFolder.name = rf.name;
                    localFolder.isPhrase = rf.is_phrase === true;
                    localFolder.updated_at = remoteUpdated;
                } else if (localUpdated > remoteUpdated) {
                    foldersToUpsert.push({
                        id: localFolder.id,
                        name: localFolder.name,
                        user_id: user.id,
                        is_phrase: localFolder.isPhrase === true,
                        updated_at: localUpdated
                    });
                }
                resolvedRegularFolders.push(localFolder);
            } else {
                const localUpdated = Number(localFolder.updated_at || 0);
                if (localUpdated > lastSync || isFirstSync) {
                    foldersToUpsert.push({
                        id: localFolder.id,
                        name: localFolder.name,
                        user_id: user.id,
                        is_phrase: localFolder.isPhrase === true,
                        updated_at: localUpdated
                    });
                    resolvedRegularFolders.push(localFolder);
                } else {
                    console.log(`Folder "${localFolder.name}" was deleted on remote, deleting locally.`);
                }
            }
        }

        // Add remote folders that don't exist locally
        for (const rf of (remoteFolders || [])) {
            const existsLocally = localRegularFolders.some(lf => lf.id.toString() === rf.id.toString());
            if (!existsLocally) {
                resolvedRegularFolders.push({
                    id: Number(rf.id),
                    name: rf.name,
                    isPhrase: rf.is_phrase === true,
                    updated_at: Number(rf.updated_at || 0),
                    words: []
                });
            }
        }

        const resolvedFoldersMap = new Map(resolvedRegularFolders.map(rf => [rf.id.toString(), rf]));

        // 5. Reconcile Words
        const localWords = [];
        for (const folder of localRegularFolders) {
            for (const word of folder.words) {
                localWords.push({
                    ...word,
                    folder_id: folder.id
                });
            }
        }
        const localWordsMap = new Map(localWords.map(lw => [lw.id.toString(), lw]));
        const resolvedWordsList = [];

        for (const localWord of localWords) {
            const rw = remoteWordsMap.get(localWord.id.toString());
            if (rw) {
                const remoteUpdated = Number(rw.updated_at || 0);
                const localUpdated = Number(localWord.updated_at || 0);

                if (remoteUpdated > localUpdated) {
                    localWord.eng = rw.eng;
                    localWord.per = rw.per;
                    localWord.success = rw.success;
                    localWord.failed = rw.failed;
                    localWord.isPhrase = rw.is_phrase === true;
                    localWord.updated_at = remoteUpdated;
                    localWord.folder_id = Number(rw.folder_id);
                } else if (localUpdated > remoteUpdated) {
                    wordsToUpsert.push({
                        id: localWord.id,
                        folder_id: localWord.folder_id,
                        user_id: user.id,
                        eng: localWord.eng,
                        per: localWord.per,
                        success: localWord.success,
                        failed: localWord.failed,
                        is_phrase: localWord.isPhrase === true,
                        updated_at: localUpdated
                    });
                }
                resolvedWordsList.push(localWord);
            } else {
                const localUpdated = Number(localWord.updated_at || 0);
                if (localUpdated > lastSync || isFirstSync) {
                    wordsToUpsert.push({
                        id: localWord.id,
                        folder_id: localWord.folder_id,
                        user_id: user.id,
                        eng: localWord.eng,
                        per: localWord.per,
                        success: localWord.success,
                        failed: localWord.failed,
                        is_phrase: localWord.isPhrase === true,
                        updated_at: localUpdated
                    });
                    resolvedWordsList.push(localWord);
                } else {
                    console.log(`Word "${localWord.eng}" was deleted on remote, deleting locally.`);
                }
            }
        }

        // Add remote words that don't exist locally
        for (const rw of (remoteWords || [])) {
            const existsLocally = localWordsMap.has(rw.id.toString());
            if (!existsLocally) {
                resolvedWordsList.push({
                    id: Number(rw.id),
                    folder_id: Number(rw.folder_id),
                    eng: rw.eng,
                    per: rw.per,
                    success: rw.success,
                    failed: rw.failed,
                    isPhrase: rw.is_phrase === true,
                    updated_at: Number(rw.updated_at || 0)
                });
            }
        }

        // 6. Redistribute words to their resolved folders
        for (const folder of resolvedRegularFolders) {
            folder.words = [];
        }

        for (const word of resolvedWordsList) {
            const folder = resolvedFoldersMap.get(word.folder_id.toString());
            if (folder) {
                const { folder_id, ...wordData } = word;
                folder.words.push(wordData);
            } else {
                console.warn(`Word "${word.eng}" belongs to folder ID "${word.folder_id}" which does not exist.`);
            }
        }

        // 7. Execute cloud upserts
        if (foldersToUpsert.length > 0) {
            const { error: upFoldErr } = await supabase.from('folders').upsert(foldersToUpsert);
            if (upFoldErr) {
                console.error("Error upserting folders to cloud:", upFoldErr);
                alert("خطا در آپلود مجموعه‌ها: " + JSON.stringify(upFoldErr));
            }
        }

        if (wordsToUpsert.length > 0) {
            const { error: upWordErr } = await supabase.from('words').upsert(wordsToUpsert);
            if (upWordErr) {
                console.error("Error upserting words to cloud:", upWordErr);
                alert("خطا در آپلود کلمات: " + JSON.stringify(upWordErr));
            }
        }

        // 8. Update synchronization timestamp
        localData.settings.lastSyncTime = Date.now();
        localData.folders = [...systemFolders, ...resolvedRegularFolders];

        saveData(localData);

    } catch (err) {
        console.error('Sync error:', err);
        alert('خطای عمومی همگام‌سازی: ' + err.message);
    }

    return localData;
};
