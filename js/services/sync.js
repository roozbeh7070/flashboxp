import { supabase } from './supabase.js';

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
            success: rw.success
        }));
        return {
            id: rf.id,
            name: rf.name,
            words: folderWords
        };
    });
};

export const pushToCloud = async (localFolders, user) => {
    const regularFolders = localFolders.filter(f => !f.isSystem);

    const { data: remoteFolders } = await supabase.from('folders').select('id').eq('user_id', user.id);
    const { data: remoteWords } = await supabase.from('words').select('id').eq('user_id', user.id);

    const remoteFolderIds = (remoteFolders || []).map(f => f.id);
    const remoteWordIds = (remoteWords || []).map(w => w.id);

    const localFolderIds = regularFolders.map(f => f.id);
    const localWordIds = [];
    regularFolders.forEach(f => f.words.forEach(w => localWordIds.push(w.id)));

    const foldersToDelete = remoteFolderIds.filter(id => !localFolderIds.includes(id));
    const wordsToDelete = remoteWordIds.filter(id => !localWordIds.includes(id));

    if (foldersToDelete.length > 0) {
        await supabase.from('folders').delete().in('id', foldersToDelete);
    }
    if (wordsToDelete.length > 0) {
        await supabase.from('words').delete().in('id', wordsToDelete);
    }

    if (regularFolders.length > 0) {
        const foldersToUpsert = regularFolders.map(f => ({
            id: f.id,
            name: f.name,
            user_id: user.id
        }));
        await supabase.from('folders').upsert(foldersToUpsert);

        const wordsToUpsert = [];
        regularFolders.forEach(f => {
            f.words.forEach(w => {
                wordsToUpsert.push({
                    id: w.id,
                    folder_id: f.id,
                    user_id: user.id,
                    eng: w.eng,
                    per: w.per,
                    failed: w.failed,
                    success: w.success
                });
            });
        });
        if (wordsToUpsert.length > 0) {
            await supabase.from('words').upsert(wordsToUpsert);
        }
    }
};

export const syncData = async (localData, user) => {
    if (!user) return localData;

    const hasLocalCustomData = localData.folders.some(f => !f.isSystem && f.words.length > 0);

    try {
        if (!hasLocalCustomData) {
            const cloudFolders = await pullFromCloud(user);
            if (cloudFolders.length > 0) {
                const systemFolders = localData.folders.filter(f => f.isSystem);
                localData.folders = [...systemFolders, ...cloudFolders];
            }
        } else {
            await pushToCloud(localData.folders, user);
        }
    } catch (err) {
        console.error('Sync error:', err);
    }
    return localData;
};
