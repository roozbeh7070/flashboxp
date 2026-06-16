import { SystemFolderCard } from '../components/SystemFolderCard.js';
import { FolderCard } from '../components/FolderCard.js';
import * as modals from '../components/Modals.js';

export const folderMethods = {
    // --- Folder Operations ---
    renderFolders() {
        const systemList = document.getElementById('system-folder-list');
        const list = document.getElementById('folder-list');
        
        const systemFolders = this.data.folders.filter(f => f.isSystem);
        const regularFolders = this.data.folders.filter(f => !f.isSystem);

        // Sort system folders: Success (222), Needs Practice (111), All (0)
        const sortedSystem = [];
        [222, 111, 0].forEach(id => {
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

        this.updateUILabels();
        this.renderWords();
    },

    openFolderModal() {
        this.showModal(modals.FolderModal());
    },

    createFolder() {
        const name = document.getElementById('folder-name-input').value;
        if (name) {
            this.data.folders.push({ name, words: [], id: Date.now() });
            this.save();
            this.closeModal();
        }
    },

    confirmDeleteFolder() {
        if (this.data.folders[this.activeIdx].isSystem) return;
        this.showModal(modals.ConfirmDeleteFolderModal());
    },

    executeDeleteFolder() {
        this.data.folders.splice(this.activeIdx, 1);
        this.save();
        this.closeScreen('word-screen');
        this.closeModal();
    }
};
