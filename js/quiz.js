import { saveData } from './storage.js';
import { speakAny } from './utils.js';

export class QuizSession {
    constructor(data, folderIdx, mode, scope, checkedIndices = []) {
        this.data = data;
        this.folderIdx = folderIdx;
        this.mode = mode; // 'eng' or 'per'
        this.queue = [];
        this.curIdx = 0;

        if (scope === 'all') {
            this.queue = [...data.folders[folderIdx].words];
        } else {
            this.queue = checkedIndices.map(idx => data.folders[folderIdx].words[idx]);
        }

        this.queue = this.queue.sort(() => Math.random() - 0.5);
    }

    getCurrentWord() {
        return this.queue[this.curIdx];
    }

    isFinished() {
        return this.curIdx >= this.queue.length;
    }

    next() {
        this.curIdx++;
    }

    handleResult(success) {
        const word = this.getCurrentWord();
        let original = null;
        
        // Find the word in the global data to update its status
        this.data.folders.forEach(f => {
            let found = f.words.find(w => w.id === word.id);
            if (found) original = found;
        });

        if (!success) {
            original.failed = true;
            original.updated_at = Date.now();
            // Add to "نیاز به تمرین مجدد" (ID 111) if not already there
            const failedFolder = this.data.folders.find(f => f.id === 111);
            if (failedFolder && !failedFolder.words.find(w => w.id === original.id)) {
                failedFolder.words.push({ ...original });
            }
        } else {
            original.failed = false;
            original.updated_at = Date.now();
            // Remove from "نیاز به تمرین مجدد"
            const failedFolder = this.data.folders.find(f => f.id === 111);
            if (failedFolder) {
                failedFolder.words = failedFolder.words.filter(w => w.id !== original.id);
            }
        }

        saveData(this.data);
    }

    restart() {
        this.queue = [...this.queue].sort(() => Math.random() - 0.5);
        this.curIdx = 0;
    }
}
