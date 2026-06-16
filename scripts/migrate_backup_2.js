import fs from 'fs';

const filePath = 'F:/code tafrihi/Flashcards/1-1-2/test/flashboxp+20260617-0019 (2).json';

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    const now = Date.now();

    if (data.folders) {
        data.folders.forEach(f => {
            // Update regular folders
            if (!f.isSystem) {
                f.updated_at = now;
                f.isPhrase = false;
            }
            // Update words in all folders (both system and regular)
            if (f.words) {
                f.words.forEach(w => {
                    w.updated_at = now;
                    w.isPhrase = false;
                });
            }
        });
    }

    // Explicitly reset lastSyncTime in settings to 0 to force first sync on client import
    data.settings = data.settings || {};
    data.settings.lastSyncTime = 0;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log("Backup file (2) migrated successfully!");
} catch (err) {
    console.error("Migration failed:", err);
}
