import { getInitialData, saveData, clearData, loadDataFromIndexedDB } from './storage.js';
import { FolderCard } from './components/FolderCard.js';
import { WordCard } from './components/WordCard.js';
import { SystemFolderCard } from './components/SystemFolderCard.js';
import * as utils from './utils.js';
import { QuizSession } from './quiz.js';
import * as modals from './components/Modals.js';
import { supabase } from './services/supabase.js';
import { syncData, pushToCloud } from './services/sync.js';

class FlashcardApp {
    constructor() {
        this.data = getInitialData();
        this.activeIdx = null;
        this.quizSession = null;
        this.tempQMode = 'eng';
        this.tempQuizScope = 'all';
        this.tempEditFolderIdx = null;
        this.currentFilter = 'all';
        this.registration = null;
        this.user = null;

        this.init();
    }

    async init() {
        try {
            const dbData = await loadDataFromIndexedDB();
            if (dbData) {
                this.data = dbData;
            }
        } catch (e) {
            console.warn('Failed to load from IndexedDB, using localStorage:', e);
        }

        this.renderFolders();
        this.setupEventListeners();
        this.registerServiceWorker();
        this.updateUILabels();
        await this.checkUserSession();
        if (this.user) {
            await this.triggerSync();
        }

        // Automatic synchronization when connection is restored
        window.addEventListener('online', () => {
            if (this.user) {
                this.triggerSync();
            }
        });

        // Hide Persian mic button in Safari as it's not supported
        if (utils.isSafari()) {
            const perMicBtn = document.getElementById('per-mic-btn');
            if (perMicBtn) perMicBtn.style.display = 'none';
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => {
                        this.registration = reg;
                        console.log('Service Worker registered', reg);
                        
                        reg.onupdatefound = () => {
                            const installingWorker = reg.installing;
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    this.showUpdatePrompt();
                                }
                            };
                        };
                    })
                    .catch(err => console.log('Service Worker registration failed', err));
            });
        }
    }

    async manualUpdateCheck(btn) {
        if (!navigator.onLine) {
            alert('لطفاً ابتدا به اینترنت متصل شوید.');
            return;
        }

        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span>در حال جستجو...</span><i class="fas fa-spinner fa-spin text-2xl"></i>`;

        try {
            // Re-fetch registration just in case
            if (!this.registration) {
                this.registration = await navigator.serviceWorker.getRegistration();
            }

            if (this.registration) {
                // If there's already a waiting worker, show prompt immediately
                if (this.registration.waiting) {
                    this.showUpdatePrompt();
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                    return;
                }

                await this.registration.update();
                
                // Wait a bit to see if updatefound triggers
                setTimeout(() => {
                    if (!this.registration.installing && !this.registration.waiting) {
                        btn.innerHTML = `<span>شما از آخرین نسخه استفاده می‌کنید</span><i class="fas fa-check-circle text-2xl text-green-500"></i>`;
                        setTimeout(() => {
                            btn.disabled = false;
                            btn.innerHTML = originalContent;
                        }, 2000);
                    } else {
                        btn.disabled = false;
                        btn.innerHTML = originalContent;
                    }
                }, 1500);
            } else {
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        } catch (e) {
            console.warn('Manual update check failed:', e);
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }

    showUpdatePrompt() {
        this.showModal(modals.UpdatePromptModal());
    }

    updateUILabels() {
        const lang = this.data.settings.targetLang;
        const labels = {
            'en': 'English',
            'de': 'Deutsch',
            'fr': 'Français'
        };
        const perLabels = {
            'en': 'انگلیسی',
            'de': 'آلمانی',
            'fr': 'فرانسوی'
        };
        const engInput = document.getElementById('eng-input');
        if (engInput) engInput.placeholder = `${labels[lang]} (${perLabels[lang]})`;
    }

    setupEventListeners() {
        // Global click listener for custom dropdowns
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
        });
    }

    // --- Navigation ---
    goHome() {
        window.scrollTo(0, 0);
        document.getElementById('word-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('home-screen').classList.remove('hidden');
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.getElementById('nav-home').classList.add('active');
        this.renderFolders();
    }

    closeScreen(id) {
        document.getElementById(id).classList.add('hidden');
        this.renderFolders();
        if (this.activeIdx !== null) this.renderWords();
    }

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
    }

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
    }

    openFolderModal() {
        this.showModal(modals.FolderModal());
    }

    createFolder() {
        const name = document.getElementById('folder-name-input').value;
        if (name) {
            this.data.folders.push({ name, words: [], id: Date.now() });
            this.save();
            this.closeModal();
        }
    }

    confirmDeleteFolder() {
        if (this.data.folders[this.activeIdx].isSystem) return;
        this.showModal(modals.ConfirmDeleteFolderModal());
    }

    executeDeleteFolder() {
        this.data.folders.splice(this.activeIdx, 1);
        this.save();
        this.closeScreen('word-screen');
        this.closeModal();
    }

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
            .map(item => WordCard(item.word, item.originalIndex))
            .join('');
    }

    openWordDetailsModal(idx) {
        const word = this.data.folders[this.activeIdx].words[idx];
        this.showModal(modals.WordDetailsModal(word));
    }

    resetWordStatus(wordId) {
        const source = this.findWordById(wordId);
        if (source) {
            source.word.success = false;
            source.word.failed = false;
            this.save();
            this.renderWords();
            this.closeModal();
        }
    }

    handleSearchInput(input) {
        const clearBtn = document.getElementById('search-clear-btn');
        if (input.value.length > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
        this.renderWords();
    }

    clearSearch() {
        const input = document.getElementById('search-input');
        input.value = '';
        document.getElementById('search-clear-btn').classList.add('hidden');
        this.renderWords();
        input.focus();
    }

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
    }

    updateFilterButtons() {
        const buttons = document.querySelectorAll('.word-filter-btn');
        if (buttons.length === 0) return;
        
        buttons.forEach(b => {
            const f = b.getAttribute('onclick').match(/'([^']+)'/)[1];
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
    }

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
    }

    addWord() {
        const eng = document.getElementById('eng-input').value.trim();
        const per = document.getElementById('per-input').value.trim();
        if (eng && per) {
            this.data.folders[this.activeIdx].words.unshift({ eng, per, failed: false, success: false, id: Date.now() });
            document.getElementById('eng-input').value = '';
            document.getElementById('per-input').value = '';
            document.getElementById('folder-word-count-box').innerText = this.data.folders[this.activeIdx].words.length;
            this.save();
            this.renderWords();
        }
    }

    findWordById(id) {
        for (let fIdx = 0; fIdx < this.data.folders.length; fIdx++) {
            const f = this.data.folders[fIdx];
            if (f.isSystem) continue;
            const wIdx = f.words.findIndex(w => w.id === id);
            if (wIdx !== -1) return { folder: f, folderIdx: fIdx, wordIdx: wIdx, word: f.words[wIdx] };
        }
        return null;
    }

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
    }

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

            // Add to new folder
            this.data.folders[newFolderIdx].words.unshift(word);
            
            this.save();
            this.renderWords();
            this.closeModal();
        }
    }

    openDeleteWordModal(id) {
        this.showModal(modals.DeleteWordModal(id));
    }

    deleteWord(wordId) {
        const source = this.findWordById(wordId);
        if (source) {
            source.folder.words.splice(source.wordIdx, 1);
            this.save();
            this.renderWords();
        }
        this.closeModal();
    }

    // --- Quiz Logic ---
    showQuizConfig() {
        this.tempQMode = 'eng';
        this.tempQuizScope = 'all';

        const words = this.data.folders[this.activeIdx].words;
        this.showModal(modals.QuizConfigModal(words));
    }

    setQuizMode(mode, btn) {
        this.tempQMode = mode;
        document.querySelectorAll('.qmode-btn').forEach(b => {
            b.classList.remove('active', '!bg-blue-600', '!text-white');
            b.classList.add('bg-white', 'text-gray-800');
        });
        btn.classList.add('active', '!bg-blue-600', '!text-white');
        btn.classList.remove('bg-white', 'text-gray-800');
    }

    setQuizScope(scope, btn) {
        this.tempQuizScope = scope;
        document.querySelectorAll('.quiz-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const container = document.getElementById('word-picker-container');
        if (scope === 'selected') container.classList.remove('hidden');
        else container.classList.add('hidden');
    }

    toggleAllCheckboxes(checked) {
        document.querySelectorAll('.word-quiz-check').forEach(cb => cb.checked = checked);
    }

    startSpecificQuiz() {
        const checkedIndices = Array.from(document.querySelectorAll('.word-quiz-check:checked')).map(cb => parseInt(cb.value));
        if (this.tempQuizScope === 'selected' && checkedIndices.length === 0) {
            this.showModal(modals.QuizPickerWarningModal());
            return;
        }

        this.quizSession = new QuizSession(this.data, this.activeIdx, this.tempQMode, this.tempQuizScope, checkedIndices);
        this.closeModal();
        document.getElementById('quiz-screen').classList.remove('hidden');
        this.showQuizCard();
    }

    showQuizCard() {
        const word = this.quizSession.getCurrentWord();
        const mode = this.quizSession.mode;
        
        document.getElementById('quiz-progress').innerText = `${this.quizSession.curIdx + 1} از ${this.quizSession.queue.length}`;
        const progressPercent = ((this.quizSession.curIdx + 1) / this.quizSession.queue.length) * 100;
        document.getElementById('quiz-progress-bar').style.width = `${progressPercent}%`;

        document.getElementById('quiz-main-text').innerText = (mode === 'eng') ? word.eng : word.per;
        document.getElementById('quiz-sub-text').innerText = (mode === 'eng') ? word.per : word.eng;
        document.getElementById('quiz-sub-text').classList.add('hidden');
        
        const tag = document.getElementById('quiz-tag');
        tag.innerText = word.failed ? 'Need Review' : 'Active';
        tag.className = `absolute top-8 right-8 px-5 py-2 rounded-full text-[10px] font-black tracking-widest ${word.failed ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`;
    }

    flipCard() {
        document.getElementById('quiz-sub-text').classList.toggle('hidden');
    }

    quizResult(success) {
        this.quizSession.handleResult(success);
        
        // Update the word state in our main data
        const currentWord = this.quizSession.getCurrentWord();
        const folder = this.data.folders[this.quizSession.folderIdx];
        const wordInData = folder.words.find(w => w.id === currentWord.id);
        if (wordInData) {
            wordInData.failed = !success;
            wordInData.success = success;
        }

        this.save(); // Save immediately to reflect status in system folders
        this.moveQuiz();
    }

    moveQuiz() {
        this.quizSession.next();
        if (!this.quizSession.isFinished()) {
            this.showQuizCard();
        } else {
            this.save(); // Save the quiz results
            this.showModal(modals.QuizFinishedModal());
        }
    }

    restartQuiz() {
        this.quizSession.restart();
        this.showQuizCard();
    }

    speakWordInQuiz(e) {
        e.stopPropagation();
        utils.speakAny(this.quizSession.getCurrentWord().eng, utils.getFullLangCode(this.data.settings.targetLang));
    }

    // --- Utils & UI Helpers ---
    syncSystemFolders() {
        const allFolder = this.data.folders.find(f => f.id === 0);
        const successFolder = this.data.folders.find(f => f.id === 222);
        const failedFolder = this.data.folders.find(f => f.id === 111);

        if (allFolder) allFolder.words = [];
        if (successFolder) successFolder.words = [];
        if (failedFolder) failedFolder.words = [];

        this.data.folders.forEach((f, fIdx) => {
            if (f.isSystem) return;
            f.words.forEach(w => {
                const wordWithMeta = { ...w, sourceFolderIdx: fIdx };
                if (allFolder) allFolder.words.push(wordWithMeta);
                if (successFolder && w.success && !w.failed) {
                    successFolder.words.push(wordWithMeta);
                }
                if (failedFolder && w.failed) {
                    failedFolder.words.push(wordWithMeta);
                }
            });
        });

        if (allFolder) allFolder.words.sort((a, b) => b.id - a.id);
        if (successFolder) successFolder.words.sort((a, b) => b.id - a.id);
        if (failedFolder) failedFolder.words.sort((a, b) => b.id - a.id);
    }

    save() {
        this.syncSystemFolders();
        saveData(this.data);
        this.renderFolders();
        if (this.user) {
            pushToCloud(this.data.folders, this.user).catch(err => console.error('BG Sync failed:', err));
        }
    }

    showModal(content) {
        const container = document.getElementById('modal-container');
        container.innerHTML = content;
        container.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
    }

    createCustomSelect(containerId, options, selectedValue, onChange) {
        const container = document.getElementById(containerId);
        const selectedOption = options.find(o => o.value == selectedValue) || options[0];
        
        container.innerHTML = `
            <div class="custom-select-wrapper">
                <div class="custom-select-trigger">${selectedOption.label}</div>
                <div class="custom-select-options">
                    ${options.map(o => `<div class="custom-option ${o.value == selectedValue ? 'selected' : ''}" data-value="${o.value}">${o.label}</div>`).join('')}
                </div>
            </div>`;
        
        const wrapper = container.querySelector('.custom-select-wrapper');
        const trigger = container.querySelector('.custom-select-trigger');
        
        trigger.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-wrapper').forEach(w => { if (w !== wrapper) w.classList.remove('open'); });
            wrapper.classList.toggle('open');
        };
        
        container.querySelectorAll('.custom-option').forEach(opt => {
            opt.onclick = () => {
                const val = opt.getAttribute('data-value');
                trigger.innerText = opt.innerText;
                container.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                wrapper.classList.remove('open');
                onChange(val);
            };
        });
    }

    async getTranslation() {
        const engInput = document.getElementById('eng-input');
        const perInput = document.getElementById('per-input');
        
        let word, sl, tl;
        if (engInput.value.trim()) {
            word = engInput.value.trim();
            sl = this.data.settings.targetLang;
            tl = 'fa';
        } else if (perInput.value.trim()) {
            word = perInput.value.trim();
            sl = 'fa';
            tl = this.data.settings.targetLang;
        } else {
            return;
        }

        try {
            const trans = await utils.getTranslation(word, sl, tl);
            if (tl === 'fa') {
                perInput.value = trans;
            } else {
                engInput.value = trans;
            }
        } catch (e) {
            alert("خطا در اتصال");
        }
    }

    async pasteFromClipboard(id) {
        await utils.pasteFromClipboard(id);
    }

    startVoiceInput(btn, inputId, lang) {
        const icon = btn.querySelector('i');
        icon.classList.replace('fa-microphone', 'fa-spinner');
        icon.classList.add('fa-spin');
        btn.classList.add('text-red-500');

        let finalLang = lang;
        if (inputId === 'eng-input') {
            finalLang = utils.getFullLangCode(this.data.settings.targetLang);
        }

        utils.startSpeechRecognition(finalLang, (text) => {
            document.getElementById(inputId).value = text;
            icon.classList.replace('fa-spinner', 'fa-microphone');
            icon.classList.remove('fa-spin');
            btn.classList.remove('text-red-500');
            if (inputId === 'eng-input') this.getTranslation();
        }, () => {
            icon.classList.replace('fa-spinner', 'fa-microphone');
            icon.classList.remove('fa-spin');
            btn.classList.remove('text-red-500');
        });
    }

    speakAny(txt) {
        utils.speakAny(txt, utils.getFullLangCode(this.data.settings.targetLang));
    }

    async openExploreModal() {
        const wordInput = document.getElementById('eng-input');
        const word = wordInput.value.trim();
        if (!word) { 
            this.showModal(modals.ExploreEmptyWordWarningModal());
            return; 
        }
        
        this.showModal(modals.ExploreWordModal(word));

        try {
            const sl = this.data.settings.targetLang;
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=fa&dt=t&dt=bd&dt=at&q=${encodeURIComponent(word)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const json = await res.json();

            let html = '';
            const allMeanings = new Map();

            const dictData = json[1] || json[5];
            if (Array.isArray(dictData)) {
                dictData.forEach(group => {
                    if (Array.isArray(group) && group.length >= 2) {
                        const pos = typeof group[0] === 'string' ? group[0] : 'other';
                        const meanings = Array.isArray(group[1]) ? group[1] : (Array.isArray(group[2]) ? group[2] : []);
                        
                        if (meanings.length > 0) {
                            if (!allMeanings.has(pos)) allMeanings.set(pos, new Set());
                            meanings.forEach(m => {
                                if (typeof m === 'string') allMeanings.get(pos).add(m);
                                else if (m && typeof m === 'object' && m.word) allMeanings.get(pos).add(m.word);
                            });
                        }
                    }
                });
            }

            const mainTrans = json[0] && json[0][0] && json[0][0][0];
            
            if (allMeanings.size > 0) {
                allMeanings.forEach((meanings, pos) => {
                    html += `<div>
                        <div class="text-[10px] font-black text-gray-400 mb-2 uppercase mr-2">${utils.translatePOS(pos)} (${pos})</div>
                        <div class="flex flex-wrap gap-2">
                            ${Array.from(meanings).map(m => `<button onclick="app.selectMeaning('${m}')" class="bg-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm border border-gray-100 active:scale-95 transition-all">${m}</button>`).join('')}
                        </div>
                    </div>`;
                });
            } else if (mainTrans) {
                html = `<div class="text-center py-10">
                    <p class="text-gray-500 font-bold mb-4">دیکشنری جزئیات بیشتری نیافت، ترجمه اصلی:</p>
                    <button onclick="app.selectMeaning('${mainTrans}')" class="blue-sharp px-6 py-3 rounded-2xl font-black">${mainTrans}</button>
                </div>`;
            }
            
            document.getElementById('explore-results').innerHTML = html || '<div class="text-center py-10 text-gray-400">نتیجه‌ای یافت نشد.</div>';
        } catch (e) {
            document.getElementById('explore-results').innerHTML = `
                <div class="text-center py-10">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <div class="text-red-500 font-bold">خطا در دریافت اطلاعات</div>
                    <div class="text-gray-400 text-xs mt-2">لطفاً اتصال اینترنت خود را بررسی کنید.</div>
                    <button onclick="app.openExploreModal()" class="mt-4 text-blue-500 font-black text-sm underline">تلاش مجدد</button>
                </div>`;
        }
    }

    selectMeaning(val) {
        const input = document.getElementById('per-input');
        input.value = input.value ? input.value + '، ' + val : val;
        this.closeModal();
    }

    exportData() {
        const now = new Date();
        const dateStr = now.getFullYear().toString() + 
                        (now.getMonth() + 1).toString().padStart(2, '0') + 
                        now.getDate().toString().padStart(2, '0') + '-' + 
                        now.getHours().toString().padStart(2, '0') + 
                        now.getMinutes().toString().padStart(2, '0');
        const filename = `flashboxp+${dateStr}.json`;
        
        const blob = new Blob([JSON.stringify(this.data)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.tempImportData = JSON.parse(e.target.result);
                this.showImportOptions();
            } catch (err) {
                alert("فایل نامعتبر است");
            }
        };
        reader.readAsText(file);
    }

    showImportOptions() {
        this.showModal(modals.ImportOptionsModal());
    }

    processImport(mode) {
        if (!this.tempImportData) return;
        
        const systemFolderIds = [0, 111, 222];

        if (mode === 'replace') {
            const currentSystemFolders = this.data.folders.filter(f => systemFolderIds.includes(f.id));
            currentSystemFolders.forEach(f => f.words = []);

            const newRegularFolders = (this.tempImportData.folders || []).filter(f => !systemFolderIds.includes(f.id));
            
            this.data.folders = [...currentSystemFolders, ...newRegularFolders];
            if (this.tempImportData.settings) {
                this.data.settings = this.tempImportData.settings;
            }
        } else if (mode === 'merge') {
            const newFolders = this.tempImportData.folders || [];
            newFolders.forEach(newFolder => {
                if (systemFolderIds.includes(newFolder.id)) return;
                
                const existingFolder = this.data.folders.find(f => f.name === newFolder.name && !f.isSystem);
                if (existingFolder) {
                    newFolder.words.forEach(newWord => {
                        if (!existingFolder.words.some(w => w.eng.toLowerCase() === newWord.eng.toLowerCase())) {
                            existingFolder.words.push(newWord);
                        }
                    });
                } else {
                    this.data.folders.push(newFolder);
                }
            });
        }

        this.save();
        this.closeModal();
        this.renderFolders();
        delete this.tempImportData;
        alert("عملیات با موفقیت انجام شد");
    }

    openSettingsModal() {
        this.showModal(modals.SettingsModal(this.user));

        const langOptions = [
            { label: 'English (انگلیسی)', value: 'en' },
            { label: 'German (آلمانی)', value: 'de' },
            { label: 'French (فرانسوی)', value: 'fr' }
        ];
        this.createCustomSelect('target-lang-dropdown', langOptions, this.data.settings.targetLang, (val) => {
            this.data.settings.targetLang = val;
            this.save();
            this.updateUILabels();
        });
    }

    async hotReload() {
        this.showModal(modals.HotReloadModal());

        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }

            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        } catch (e) {
            console.error("Update failed:", e);
            window.location.reload(true);
        }
    }

    factoryReset() {
        this.showModal(modals.FactoryResetModal());
    }

    async executeFactoryReset() {
        await clearData();
        location.reload();
    }

    openGlobalSearchModal() {
        this.showModal(modals.GlobalSearchModal());
        setTimeout(() => document.getElementById('global-search-input').focus(), 100);
    }

    handleGlobalSearch(query) {
        const resultsContainer = document.getElementById('global-search-results');
        const term = query.trim().toLowerCase();
        
        if (!term) {
            resultsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                    <i class="fas fa-search text-5xl mb-4 opacity-20"></i>
                    <p class="font-bold">عبارتی را برای جستجو وارد کنید</p>
                </div>`;
            return;
        }

        const matches = [];
        this.data.folders.forEach((folder, folderIdx) => {
            folder.words.forEach((word, wordIdx) => {
                if (word.eng.toLowerCase().includes(term) || word.per.toLowerCase().includes(term)) {
                    matches.push({ word, folderName: folder.name, folderIdx, wordIdx });
                }
            });
        });

        if (matches.length === 0) {
            resultsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                    <i class="fas fa-frown text-5xl mb-4 opacity-20"></i>
                    <p class="font-bold">نتیجه‌ای یافت نشد</p>
                </div>`;
            return;
        }

        resultsContainer.innerHTML = matches.map(m => `
            <div onclick="app.closeModal(); app.openFolder(${m.folderIdx})" class="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-[0.98] transition-all">
                <div class="flex justify-between items-center">
                    <div class="font-black text-xl text-gray-900" dir="ltr">${utils.escapeHTML(m.word.eng)}</div>
                    <div class="font-bold text-lg text-gray-600 text-right">${utils.escapeHTML(m.word.per)}</div>
                </div>
                <div class="flex justify-start">
                    <span class="bg-gray-100 text-gray-500 text-[11px] px-4 py-1.5 rounded-xl font-black border border-gray-200/50">
                        <i class="fas fa-folder-open ml-1 opacity-50"></i>
                        ${utils.escapeHTML(m.folderName)}
                    </span>
                </div>
            </div>`).join('');
    }

    // --- Supabase Authentication Handlers ---
    async checkUserSession() {
        const { data: { session } } = await supabase.auth.getSession();
        this.user = session ? session.user : null;

        supabase.auth.onAuthStateChange(async (event, session) => {
            this.user = session ? session.user : null;
            if (event === 'SIGNED_IN') {
                console.log('User signed in:', this.user);
                await this.triggerSync();
            }
        });
    }

    async triggerSync() {
        console.log('Synchronizing data with Supabase...');
        const syncedData = await syncData(this.data, this.user);
        this.data = syncedData;
        
        // Save locally, sync system folders and render UI
        this.syncSystemFolders();
        saveData(this.data);
        this.renderFolders();
        if (this.activeIdx !== null) this.renderWords();
    }

    openAuthModal(mode) {
        this.showModal(modals.AuthModal(mode));
    }

    async handleAuthSubmit(e, mode) {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>در حال پردازش...</span><i class="fas fa-spinner fa-spin mr-2"></i>`;

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert("ثبت‌نام موفقیت‌آمیز بود! لطفا ایمیل خود را چک کنید و آن را تأیید کنید.");
                this.closeModal();
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                this.user = data.user;
                this.closeModal();
                alert("خوش آمدید!");
            }
        } catch (err) {
            alert("خطا: " + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    }

    async handleGoogleSignIn() {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err) {
            alert("خطا در ورود با گوگل: " + err.message);
        }
    }

    async handleSignOut() {
        if (confirm("آیا مایلید از حساب کاربری خود خارج شوید؟")) {
            await supabase.auth.signOut();
            this.user = null;
            this.closeModal();
            alert("از حساب خود خارج شدید.");
        }
    }
}

window.app = new FlashcardApp();
