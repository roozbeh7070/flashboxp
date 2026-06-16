import { WordCard } from '../components/WordCard.js';
import * as modals from '../components/Modals.js';

export const wordMethods = {
    // --- Word Operations ---
    renderWords() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const list = document.getElementById('word-list');
        const folder = this.data.folders[this.activeIdx];
        
        list.innerHTML = folder.words
            .map((w, i) => ({ word: w, originalIndex: i }))
            .filter(item => {
                const matchesSearch = item.word.eng.toLowerCase().includes(searchTerm) || item.word.per.toLowerCase().includes(searchTerm);
                if (!matchesSearch) return false;
                
                if (this.currentFilter === 'success') return item.word.success && !item.word.failed;
                if (this.currentFilter === 'failed') return item.word.failed;
                return true;
            })
            .map(item => WordCard(item.word, item.originalIndex, this.currentMode === 'phrase' || folder.isPhrase))
            .join('');
    },

    openWordDetailsModal(idx) {
        const word = this.data.folders[this.activeIdx].words[idx];
        this.showModal(modals.WordDetailsModal(word));
    },

    resetWordStatus(wordId) {
        const source = this.findWordById(wordId);
        if (source) {
            source.word.success = false;
            source.word.failed = false;
            source.word.updated_at = Date.now();
            this.save();
            this.renderWords();
            this.closeModal();
        }
    },

    handleSearchInput(input) {
        const clearBtn = document.getElementById('search-clear-btn');
        if (input.value.length > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
        this.renderWords();
    },

    clearSearch() {
        const input = document.getElementById('search-input');
        input.value = '';
        document.getElementById('search-clear-btn').classList.add('hidden');
        this.renderWords();
        input.focus();
    },

    setWordFilter(filter, btn) {
        this.currentFilter = filter;
        document.querySelectorAll('.word-filter-btn').forEach(b => {
            b.classList.remove('active', 'bg-gray-100', 'text-gray-800', 'bg-green-50', 'text-green-600', 'bg-red-50', 'text-red-600');
            b.classList.add('text-gray-400');
        });
        
        if (filter === 'all') {
            btn.classList.add('active', 'bg-gray-100', 'text-gray-800');
        } else if (filter === 'success') {
            btn.classList.add('active', 'bg-green-50', 'text-green-600');
        } else if (filter === 'failed') {
            btn.classList.add('active', 'bg-red-50', 'text-red-600');
        }
        btn.classList.remove('text-gray-400');
        this.renderWords();
    },

    updateFilterButtons() {
        const buttons = document.querySelectorAll('.word-filter-btn');
        if (buttons.length === 0) return;
        
        buttons.forEach(b => {
            const onclickAttr = b.getAttribute('onclick');
            if (!onclickAttr) return;
            const match = onclickAttr.match(/'([^']+)'/);
            if (!match) return;
            const f = match[1];
            b.classList.remove('active', 'bg-gray-100', 'text-gray-800', 'bg-green-50', 'text-green-600', 'bg-red-50', 'text-red-600');
            
            if (f === this.currentFilter) {
                if (f === 'all') b.classList.add('active', 'bg-gray-100', 'text-gray-800');
                else if (f === 'success') b.classList.add('active', 'bg-green-50', 'text-green-600');
                else if (f === 'failed') b.classList.add('active', 'bg-red-50', 'text-red-600');
                b.classList.remove('text-gray-400');
            } else {
                b.classList.add('text-gray-400');
            }
        });
    },

    checkDuplicateBeforeAdd() {
        const eng = document.getElementById('eng-input').value.trim();
        if (!eng) return;
        
        let foundIn = null;
        this.data.folders.forEach(f => {
            if (f.words.some(w => w.eng.toLowerCase() === eng.toLowerCase())) foundIn = f.name;
        });

        if (foundIn) {
            this.showModal(modals.DuplicateWarningModal(eng, foundIn));
        } else {
            this.addWord();
        }
    },

    addWord() {
        const eng = document.getElementById('eng-input').value.trim();
        const per = document.getElementById('per-input').value.trim();
        if (eng && per) {
            const wordObj = { eng, per, failed: false, success: false, id: Date.now(), updated_at: Date.now() };
            if (this.currentMode === 'phrase' || this.data.folders[this.activeIdx].isPhrase) {
                wordObj.isPhrase = true;
            }
            this.data.folders[this.activeIdx].words.unshift(wordObj);
            document.getElementById('eng-input').value = '';
            document.getElementById('per-input').value = '';
            document.getElementById('folder-word-count-box').innerText = this.data.folders[this.activeIdx].words.length;
            this.save();
            this.renderWords();
        }
    },

    findWordById(id) {
        for (let fIdx = 0; fIdx < this.data.folders.length; fIdx++) {
            const f = this.data.folders[fIdx];
            if (f.isSystem) continue;
            const wIdx = f.words.findIndex(w => w.id === id);
            if (wIdx !== -1) return { folder: f, folderIdx: fIdx, wordIdx: wIdx, word: f.words[wIdx] };
        }
        return null;
    },

    openEditModal(id) {
        const source = this.findWordById(id);
        if (!source) return;
        const word = source.word;
        this.tempEditFolderIdx = source.folderIdx;

        this.showModal(modals.EditWordModal(word));

        const folderOptions = this.data.folders.map((f, i) => ({ label: f.name, value: i })).filter(o => !this.data.folders[o.value].isSystem);
        this.createCustomSelect('folder-dest-dropdown', folderOptions, source.folderIdx, (val) => {
            this.tempEditFolderIdx = parseInt(val);
        });
    },

    saveEdit(wordId) {
        const eng = document.getElementById('edit-eng').value.trim();
        const per = document.getElementById('edit-per').value.trim();
        const failed = document.getElementById('edit-failed').checked;
        const newFolderIdx = this.tempEditFolderIdx;

        if (eng && per) {
            const source = this.findWordById(wordId);
            if (!source) return this.closeModal();

            // Remove from old location
            source.folder.words.splice(source.wordIdx, 1);

            // Update word
            const word = source.word;
            word.eng = eng;
            word.per = per;
            word.failed = failed;
            word.success = failed ? false : word.success;
            word.updated_at = Date.now();

            // Add to new folder and update its isPhrase flag
            const destFolder = this.data.folders[newFolderIdx];
            if (destFolder.isPhrase) {
                word.isPhrase = true;
            } else {
                delete word.isPhrase;
            }
            destFolder.words.unshift(word);
            
            this.save();
            this.renderWords();
            this.closeModal();
        }
    },

    openDeleteWordModal(id) {
        this.showModal(modals.DeleteWordModal(id));
    },

    deleteWord(wordId) {
        const source = this.findWordById(wordId);
        if (source) {
            this.data.deletedWordIds = this.data.deletedWordIds || [];
            this.data.deletedWordIds.push(wordId);
            source.folder.words.splice(source.wordIdx, 1);
            this.save();
            this.renderWords();
        }
        this.closeModal();
    }
};
