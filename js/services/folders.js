import { SystemFolderCard } from '../components/SystemFolderCard.js';
import { FolderCard } from '../components/FolderCard.js';
import * as modals from '../components/Modals.js';

export const folderMethods = {
    // --- Folder Operations ---
    renderFolders() {
        const systemList = document.getElementById('system-folder-list');
        const list = document.getElementById('folder-list');
        
        const isPhraseMode = this.currentMode === 'phrase';
        
        const systemFolders = this.data.folders.filter(f => f.isSystem && (isPhraseMode ? f.isPhrase === true : !f.isPhrase));
        const regularFolders = this.data.folders.filter(f => !f.isSystem && (isPhraseMode ? f.isPhrase === true : !f.isPhrase));

        // Sort system folders: Success (222/322), Needs Practice (111/311), All (0/300)
        const sortedSystem = [];
        const successId = isPhraseMode ? 322 : 222;
        const failedId = isPhraseMode ? 311 : 111;
        const allId = isPhraseMode ? 300 : 0;
        
        [successId, failedId, allId].forEach(id => {
            const found = systemFolders.find(f => f.id === id);
            if (found) sortedSystem.push(found);
        });

        systemList.innerHTML = sortedSystem.map(f => {
            const idx = this.data.folders.indexOf(f);
            return SystemFolderCard(f, idx);
        }).join('');

        list.innerHTML = regularFolders.map(f => {
            const idx = this.data.folders.indexOf(f);
            return FolderCard(f, idx);
        }).join('');
    },

    openFolder(index) {
        window.scrollTo(0, 0);
        this.activeIdx = index;
        const folder = this.data.folders[index];
        document.getElementById('folder-title-text').innerText = folder.name;
        document.getElementById('folder-word-count-box').innerText = folder.words.length;
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('word-screen').classList.remove('hidden');
        document.getElementById('search-input').value = '';
        document.getElementById('search-clear-btn').classList.add('hidden');
        this.currentFilter = 'all';
        this.updateFilterButtons();

        const delBtn = document.getElementById('del-folder-btn');
        const addWordContainer = document.getElementById('add-word-container');

        if (folder.isSystem) {
            delBtn.classList.add('invisible');
            delBtn.classList.add('pointer-events-none');
            if (addWordContainer) addWordContainer.classList.add('hidden');
        } else {
            delBtn.classList.remove('invisible');
            delBtn.classList.remove('pointer-events-none');
            if (addWordContainer) addWordContainer.classList.remove('hidden');
        }

        const exploreBtn = document.getElementById('explore-word-btn');
        if (exploreBtn) {
            if (this.currentMode === 'phrase') {
                exploreBtn.classList.add('hidden');
            } else {
                exploreBtn.classList.remove('hidden');
            }
        }

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.placeholder = this.currentMode === 'phrase' ? "جستجو در این مجموعه (عبارت یا معنی)..." : "جستجو در این مجموعه (کلمه یا معنی)...";
        }

        this.updateUILabels();
        this.renderWords();
    },

    openFolderModal() {
        this.showModal(modals.FolderModal());
    },

    createFolder() {
        const name = document.getElementById('folder-name-input').value;
        if (name) {
            const newFolder = { name, words: [], id: Date.now(), updated_at: Date.now() };
            if (this.currentMode === 'phrase') {
                newFolder.isPhrase = true;
            }
            this.data.folders.push(newFolder);
            this.save();
            this.closeModal();
        }
    },

    confirmDeleteFolder() {
        if (this.data.folders[this.activeIdx].isSystem) return;
        this.showModal(modals.ConfirmDeleteFolderModal());
    },

    executeDeleteFolder() {
        const folder = this.data.folders[this.activeIdx];
        if (folder && !folder.isSystem) {
            this.data.deletedFolderIds = this.data.deletedFolderIds || [];
            this.data.deletedFolderIds.push(folder.id);
            this.data.deletedWordIds = this.data.deletedWordIds || [];
            folder.words.forEach(w => this.data.deletedWordIds.push(w.id));
        }
        this.data.folders.splice(this.activeIdx, 1);
        this.save();
        this.closeScreen('word-screen');
        this.closeModal();
    }
};
