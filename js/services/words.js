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
            .map(item => {
                const isSelected = this.selectedWordIds && this.selectedWordIds.includes(item.word.id);
                return WordCard(item.word, item.originalIndex, this.currentMode === 'phrase' || folder.isPhrase, isSelected);
            })
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
    },

    handleWordClick(event, index, id) {
        if (this.selectionMode) {
            this.toggleWordSelection(id);
        } else {
            this.openWordDetailsModal(index);
        }
    },

    toggleSelectionMode(forceValue) {
        if (forceValue !== undefined) {
            this.selectionMode = forceValue;
        } else {
            this.selectionMode = !this.selectionMode;
        }

        const toggleBtn = document.getElementById('toggle-select-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        const actionsContainer = document.getElementById('selection-actions');
        const buttonsContainer = document.getElementById('selection-buttons-container');

        if (toggleBtn) {
            if (this.selectionMode) {
                toggleBtn.innerText = 'لغو';
                toggleBtn.classList.remove('bg-gray-100', 'text-gray-700', 'w-full');
                toggleBtn.classList.add('bg-red-500', 'text-white', 'px-4');
                if (buttonsContainer) buttonsContainer.classList.remove('w-full');
                if (selectAllBtn) selectAllBtn.classList.remove('hidden');
                if (actionsContainer) actionsContainer.classList.remove('hidden');
            } else {
                const initialText = this.currentMode === 'phrase' ? 'انتخاب عبارت' : 'انتخاب کلمه';
                toggleBtn.innerText = initialText;
                toggleBtn.classList.add('bg-gray-100', 'text-gray-700', 'w-full');
                toggleBtn.classList.remove('bg-red-500', 'text-white', 'px-4');
                if (buttonsContainer) buttonsContainer.classList.add('w-full');
                if (selectAllBtn) selectAllBtn.classList.add('hidden');
                if (actionsContainer) actionsContainer.classList.add('hidden');
                this.selectedWordIds = [];
            }
        }
        this.updateSelectedCountUI();
        this.renderWords();
    },

    toggleWordSelection(id) {
        this.selectedWordIds = this.selectedWordIds || [];
        const index = this.selectedWordIds.indexOf(id);
        if (index === -1) {
            this.selectedWordIds.push(id);
        } else {
            this.selectedWordIds.splice(index, 1);
        }
        this.updateSelectedCountUI();
        this.renderWords();
    },

    updateSelectedCountUI() {
        const countSpan = document.getElementById('selected-count');
        if (countSpan) {
            const count = (this.selectedWordIds || []).length;
            countSpan.innerText = count.toString();
        }
    },

    selectAllWords() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const folder = this.data.folders[this.activeIdx];
        
        const visibleWords = folder.words.filter(w => {
            const matchesSearch = w.eng.toLowerCase().includes(searchTerm) || w.per.toLowerCase().includes(searchTerm);
            if (!matchesSearch) return false;
            if (this.currentFilter === 'success') return w.success && !w.failed;
            if (this.currentFilter === 'failed') return w.failed;
            return true;
        });

        this.selectedWordIds = this.selectedWordIds || [];
        const allVisibleSelected = visibleWords.every(w => this.selectedWordIds.includes(w.id));

        if (allVisibleSelected) {
            // Deselect visible ones
            visibleWords.forEach(w => {
                const idx = this.selectedWordIds.indexOf(w.id);
                if (idx !== -1) this.selectedWordIds.splice(idx, 1);
            });
        } else {
            // Select all visible ones
            visibleWords.forEach(w => {
                if (!this.selectedWordIds.includes(w.id)) {
                    this.selectedWordIds.push(w.id);
                }
            });
        }

        this.updateSelectedCountUI();
        this.renderWords();
    },

    bulkDeleteWordsPrompt() {
        const count = (this.selectedWordIds || []).length;
        if (count === 0) {
            alert("لطفاً ابتدا حداقل یک کلمه را انتخاب کنید.");
            return;
        }
        this.showModal(modals.BulkDeleteWordModal(count));
    },

    executeBulkDelete() {
        const wordIds = [...(this.selectedWordIds || [])];
        if (wordIds.length === 0) return this.closeModal();

        this.data.deletedWordIds = this.data.deletedWordIds || [];
        
        this.data.folders.forEach(folder => {
            wordIds.forEach(id => {
                const idx = folder.words.findIndex(w => w.id === id);
                if (idx !== -1) {
                    folder.words.splice(idx, 1);
                    if (!this.data.deletedWordIds.includes(id)) {
                        this.data.deletedWordIds.push(id);
                    }
                }
            });
        });

        this.save();
        this.toggleSelectionMode(false);
        this.closeModal();
    },

    bulkMoveWordsPrompt() {
        const count = (this.selectedWordIds || []).length;
        if (count === 0) {
            alert("لطفاً ابتدا حداقل یک کلمه را انتخاب کنید.");
            return;
        }
        this.showModal(modals.BulkMoveWordModal(count));

        const folderOptions = this.data.folders
            .map((f, i) => ({ label: f.name, value: i }))
            .filter(o => !this.data.folders[o.value].isSystem);

        this.tempBulkMoveFolderIdx = folderOptions.length > 0 ? folderOptions[0].value : null;

        this.createCustomSelect('bulk-folder-dest-dropdown', folderOptions, this.tempBulkMoveFolderIdx, (val) => {
            this.tempBulkMoveFolderIdx = parseInt(val);
        });
    },

    executeBulkMove() {
        const destIdx = this.tempBulkMoveFolderIdx;
        if (destIdx === null || destIdx === undefined) return this.closeModal();

        const destFolder = this.data.folders[destIdx];
        if (!destFolder) return this.closeModal();

        const wordIds = [...(this.selectedWordIds || [])];
        
        wordIds.forEach(id => {
            let foundSource = null;
            for (let fIdx = 0; fIdx < this.data.folders.length; fIdx++) {
                const folder = this.data.folders[fIdx];
                if (folder.isSystem) continue;
                const wIdx = folder.words.findIndex(w => w.id === id);
                if (wIdx !== -1) {
                    foundSource = { folder, wIdx, word: folder.words[wIdx] };
                    break;
                }
            }

            if (foundSource) {
                foundSource.folder.words.splice(foundSource.wIdx, 1);

                const word = foundSource.word;
                word.updated_at = Date.now();
                if (destFolder.isPhrase) {
                    word.isPhrase = true;
                } else {
                    delete word.isPhrase;
                }

                destFolder.words.unshift(word);
            }
        });

        this.save();
        this.toggleSelectionMode(false);
        this.closeModal();
    }
};
