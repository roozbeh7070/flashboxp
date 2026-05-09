import { getInitialData, saveData, clearData } from './storage.js';
import { FolderCard } from './components/FolderCard.js';
import { WordCard } from './components/WordCard.js';
import * as utils from './utils.js';
import { QuizSession } from './quiz.js';

class FlashcardApp {
    constructor() {
        this.data = getInitialData();
        this.activeIdx = null;
        this.quizSession = null;
        this.tempQMode = 'eng';
        this.tempQuizScope = 'all';
        this.tempEditFolderIdx = null;
        this.currentFilter = 'all';

        this.init();
    }

    init() {
        this.renderFolders();
        this.setupEventListeners();
        this.registerServiceWorker();
        this.updateUILabels();
        this.checkForUpdates();

        // Hide Persian mic button in Safari as it's not supported
        if (utils.isSafari()) {
            const perMicBtn = document.getElementById('per-mic-btn');
            if (perMicBtn) perMicBtn.style.display = 'none';
        }
    }

    async checkForUpdates() {
        if (navigator.onLine) {
            try {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) {
                    await reg.update();
                }
            } catch (e) {
                console.warn('Update check failed:', e);
            }
        }
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

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => {
                        console.log('Service Worker registered', reg);
                        
                        // Check for updates periodically
                        reg.onupdatefound = () => {
                            const installingWorker = reg.installing;
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New content is available; show the prompt
                                    this.showUpdatePrompt();
                                }
                            };
                        };
                    })
                    .catch(err => console.log('Service Worker registration failed', err));
            });
        }
    }

    showUpdatePrompt() {
        this.showModal(`
            <div class="ios-modal p-8 text-center">
                <div class="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                    <i class="fas fa-rocket fa-bounce"></i>
                </div>
                <h3 class="text-2xl font-black mb-2 text-gray-900">نسخه جدید در دسترس است!</h3>
                <p class="text-gray-400 mb-8 font-bold leading-relaxed">تغییرات جدید و بهبودهای ظاهری برای شما آماده شده است. آیا می‌خواهید الان بروزرسانی کنید؟</p>
                <div class="flex gap-3">
                    <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black">بعداً</button>
                    <button onclick="app.hotReload()" class="flex-1 p-5 blue-sharp rounded-2xl font-black shadow-xl active:scale-95 transition-transform">بروزرسانی آنی</button>
                </div>
            </div>`);
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
            let icon = 'fa-layer-group';
            let color = 'text-orange-500';
            if (f.id === 222) { icon = 'fa-check-circle'; color = 'text-orange-500'; }
            if (f.id === 111) { icon = 'fa-bolt'; color = 'text-orange-500'; }
            
            return `
                <div class="system-box" onclick="app.openFolder(${idx})">
                    <i class="fas ${icon} ${color}"></i>
                    <div class="name">${f.name}</div>
                    <div class="count">${f.words.length}</div>
                </div>`;
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
        this.showModal(`
            <div class="ios-modal">
                <div class="modal-title-box">ایجاد مجموعه</div>
                <div class="space-y-6">
                    <input id="folder-name-input" type="text" placeholder="نام مجموعه" class="w-full p-5 bg-gray-100 rounded-2xl text-center font-black text-lg outline-none border-2 border-transparent focus:border-blue-500 transition-all">
                    <div class="flex gap-3">
                        <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black">لغو</button>
                        <button onclick="app.createFolder()" class="flex-1 p-5 blue-sharp rounded-2xl font-black shadow-xl active:scale-95 transition-transform">تایید</button>
                    </div>
                </div>
            </div>`);
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
        this.showModal(`
            <div class="ios-modal p-8 text-center">
                <h3 class="text-2xl font-black mb-4 text-gray-900">حذف کل مجموعه؟</h3>
                <p class="text-red-500 font-black mb-8 leading-relaxed">تمام محتویات برای همیشه پاک می‌شوند.</p>
                <div class="flex gap-3">
                    <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black">لغو</button>
                    <button onclick="app.executeDeleteFolder()" class="flex-1 p-5 bg-red-600 text-white rounded-2xl font-black shadow-lg">حذف قطعی</button>
                </div>
            </div>`);
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
        this.showModal(`
            <div class="ios-modal p-0 overflow-hidden relative" style="width: 320px; height: 320px;">
                <div class="absolute top-4 left-4 flex gap-2 z-10" dir="ltr">
                    <button onclick="app.closeModal(); app.openEditModal(${word.id})" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-orange-500 flex items-center justify-center active:scale-90 transition-all">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="app.closeModal(); app.openDeleteWordModal(${word.id})" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-red-500 flex items-center justify-center active:scale-90 transition-all">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button onclick="app.speakAny('${word.eng}')" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-blue-500 flex items-center justify-center active:scale-90 transition-all">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                
                <button onclick="app.closeModal()" class="absolute top-4 right-4 w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-gray-300 flex items-center justify-center active:scale-90 transition-all">
                    <i class="fas fa-times"></i>
                </button>

                <div class="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-white">
                    <h2 dir="ltr" class="text-4xl font-black text-gray-900 mb-8">${word.eng}</h2>
                    <p dir="rtl" class="text-2xl font-bold text-gray-500">${word.per}</p>
                </div>
            </div>`);
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
        const per = document.getElementById('per-input').value.trim();
        if (!eng || !per) return;
        
        let foundIn = null;
        this.data.folders.forEach(f => {
            if (f.words.some(w => w.eng.toLowerCase() === eng.toLowerCase())) foundIn = f.name;
        });

        if (foundIn) {
            this.showModal(`
                <div class="ios-modal p-8 text-center">
                    <div class="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-exclamation-triangle"></i></div>
                    <h3 class="text-xl font-black mb-2">کلمه تکراری</h3>
                    <p class="text-gray-500 mb-6 font-bold text-sm leading-relaxed">کلمه "${eng}" قبلاً در مجموعه <span class="text-orange-600">"${foundIn}"</span> ذخیره شده است.</p>
                    <div class="flex gap-3">
                        <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-red-500 rounded-2xl font-black">بازگشت</button>
                        <button onclick="app.addWord();app.closeModal();" class="flex-1 p-4 blue-sharp rounded-2xl font-black">ذخیره در هر صورت</button>
                    </div>
                </div>`);
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

        this.showModal(`
            <div class="ios-modal">
                <div class="modal-title-box">ویرایش کلمه</div>
                <div class="space-y-4">
                    <input id="edit-eng" type="text" value="${word.eng}" dir="ltr" class="w-full p-4 bg-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-orange-500 transition-all">
                    <input id="edit-per" type="text" value="${word.per}" class="w-full p-4 bg-gray-100 rounded-2xl font-black text-right outline-none border-2 border-transparent focus:border-orange-500 transition-all">
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-black mr-2 text-gray-400 uppercase">انتقال به مجموعه:</label>
                        <div id="folder-dest-dropdown"></div>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <span class="font-bold text-gray-700">نیاز به تمرین مجدد (قرمز)</span>
                        <input id="edit-failed" type="checkbox" ${word.failed ? 'checked' : ''} class="w-6 h-6 accent-red-500">
                    </div>
                    <div class="flex gap-3 mt-4">
                        <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black">لغو</button>
                        <button onclick="app.saveEdit(${word.id})" class="flex-1 p-5 orange-sharp rounded-2xl font-black shadow-xl">بروزرسانی</button>
                    </div>
                </div>
            </div>`);

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
        this.showModal(`
            <div class="ios-modal p-8 text-center">
                <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fas fa-trash-alt"></i></div>
                <h3 class="text-2xl font-black mb-2 text-gray-900 text-center">حذف کلمه؟</h3>
                <p class="text-gray-400 mb-8 font-bold">این عمل غیرقابل بازگشت است.</p>
                <div class="flex gap-3">
                    <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black text-center">انصراف</button>
                    <button onclick="app.deleteWord(${id})" class="flex-1 p-5 bg-red-500 text-white rounded-2xl font-black shadow-lg">بله، حذف</button>
                </div>
            </div>`);
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

        this.showModal(`
            <div class="ios-modal max-h-[90vh] flex flex-col !bg-[#ededed]">
                <div class="modal-title-box !bg-[#303030] !text-white shadow-none">تنظیمات آزمون</div>
                <div class="overflow-y-auto pr-1">
                    <div class="space-y-6 mb-6">
                        <div class="flex flex-col gap-3">
                            <button id="qmode-eng" onclick="app.setQuizMode('eng', this)" class="qmode-btn p-5 border-2 rounded-2xl font-black border-transparent bg-white text-gray-800 flex justify-between items-center transition-all active">
                                <span>زبان مقصد به فارسی</span>
                                <i class="fas fa-chevron-left text-xs opacity-50"></i>
                            </button>
                            <button id="qmode-per" onclick="app.setQuizMode('per', this)" class="qmode-btn p-5 border-2 rounded-2xl font-black border-transparent bg-white text-gray-800 flex justify-between items-center transition-all">
                                <span>فارسی به زبان مقصد</span>
                                <i class="fas fa-chevron-left text-xs opacity-50"></i>
                            </button>
                        </div>
                        <div class="pt-4 space-y-4">
                            <label class="text-lg font-black block text-gray-800 text-right mr-2">محدوده پرسش:</label>
                            
                            <div class="quiz-tabs !bg-gray-200">
                                <button onclick="app.setQuizScope('all', this)" class="quiz-tab-btn active">همه کلمات</button>
                                <button onclick="app.setQuizScope('selected', this)" class="quiz-tab-btn">انتخاب خاص</button>
                            </div>

                            <div id="word-picker-container" class="hidden space-y-2">
                                <div class="flex gap-2 mb-2">
                                    <button onclick="app.toggleAllCheckboxes(true)" class="flex-1 bg-blue-500/10 text-blue-600 p-2 rounded-xl font-bold text-xs">تیک زدن همه</button>
                                    <button onclick="app.toggleAllCheckboxes(false)" class="flex-1 bg-white text-gray-400 p-2 rounded-xl font-bold text-xs shadow-sm">برداشتن همه</button>
                                </div>
                                <div id="word-picker-list" class="text-right space-y-2 max-h-52 overflow-y-auto p-2 bg-white rounded-2xl border border-gray-100">
                                    ${this.data.folders[this.activeIdx].words.map((w, i) => `
                                        <label class="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                                            <div class="flex items-center gap-3">
                                                <input type="checkbox" class="word-quiz-check w-5 h-5 accent-blue-600" value="${i}" checked>
                                                <span class="font-bold text-sm text-gray-700" dir="ltr">${w.eng}</span>
                                            </div>
                                            <span class="text-xs text-gray-400 font-bold">${w.per}</span>
                                        </label>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-3 pt-6 border-t border-gray-200">
                        <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black">انصراف</button>
                        <button onclick="app.startSpecificQuiz()" class="flex-1 p-5 blue-sharp rounded-2xl font-black shadow-xl active:scale-95 transition-transform">شروع آزمون</button>
                    </div>
                </div>
            </div>`);
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
            this.showModal(`
                <div class="ios-modal p-8 text-center">
                    <div class="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-exclamation-triangle"></i></div>
                    <h3 class="text-xl font-black mb-2">انتخاب کلمه</h3>
                    <p class="text-gray-500 mb-6 font-bold">لطفاً حداقل یک کلمه برای آزمون انتخاب کنید.</p>
                    <button onclick="app.showQuizConfig()" class="w-full p-4 blue-sharp rounded-2xl font-black">متوجه شدم</button>
                </div>`);
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
            this.showModal(`
                <div class="ios-modal p-8 text-center">
                    <div class="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fas fa-check-circle"></i></div>
                    <h3 class="text-2xl font-black mb-2 text-gray-900">پایان آزمون</h3>
                    <p class="text-gray-400 mb-8 font-bold">آیا مایلید آزمون را مجدداً تکرار کنید؟</p>
                    <div class="flex gap-3">
                        <button onclick="app.closeScreen('quiz-screen');app.closeModal();" class="flex-1 p-4 bg-gray-100 text-gray-600 rounded-2xl font-black">پایان</button>
                        <button onclick="app.restartQuiz();app.closeModal();" class="flex-1 p-5 blue-sharp rounded-2xl font-black shadow-lg">آزمون مجدد</button>
                    </div>
                </div>`);
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
        const input = document.getElementById('eng-input');
        const word = input.value;
        if (!word) return;
        try {
            const trans = await utils.getTranslation(word, this.data.settings.targetLang);
            document.getElementById('per-input').value = trans;
        } catch (e) {
            alert("خطا در اتصال");
        }
    }

    async pasteFromClipboard(id) {
        await utils.pasteFromClipboard(id);
    }

    startVoiceInput(inputId, lang) {
        const btn = event.currentTarget;
        const icon = btn.querySelector('i');
        icon.classList.replace('fa-microphone', 'fa-spinner');
        icon.classList.add('fa-spin');
        btn.classList.add('text-red-500');

        // If inputId is 'eng-input', use the target language from settings
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
            this.showModal(`
                <div class="ios-modal p-8 text-center">
                    <div class="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-search"></i></div>
                    <h3 class="text-xl font-black mb-2">جستجوی پیشرفته</h3>
                    <p class="text-gray-500 mb-6 font-bold">ابتدا کلمه را وارد کنید.</p>
                    <button onclick="app.closeModal()" class="w-full p-4 blue-sharp rounded-2xl font-black">متوجه شدم</button>
                </div>`);
            return; 
        }
        
        this.showModal(`
            <div class="ios-modal p-6 max-h-[85vh] flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-black text-gray-900">کاوش کلمه: ${word}</h3>
                    <button onclick="app.closeModal()" class="text-gray-400"><i class="fas fa-times-circle text-2xl"></i></button>
                </div>
                <div id="explore-results" class="overflow-y-auto flex-1 space-y-4 pr-1">
                    <div class="flex justify-center items-center py-10">
                        <i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
                    </div>
                </div>
            </div>`);

        try {
            const sl = this.data.settings.targetLang;
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=fa&dt=t&dt=bd&dt=at&q=${encodeURIComponent(word)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const json = await res.json();

            let html = '';
            if (json[1] && json[1][0] && json[1][0][1]) {
                html += `<div class="bg-blue-50 p-4 rounded-2xl">
                    <div class="text-[10px] font-black text-blue-500 mb-2 uppercase">ترجمه‌های پیشنهادی</div>
                    <div class="flex flex-wrap gap-2">
                        ${json[1][0][1].map(t => `<button onclick="app.selectMeaning('${t}')" class="bg-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm border border-blue-100 active:scale-95 transition-all">${t}</button>`).join('')}
                    </div>
                </div>`;
            }

            const dictData = json[5] || json[1];
            if (Array.isArray(dictData) && dictData[0] && Array.isArray(dictData[0]) && typeof dictData[0][0] === 'string') {
                dictData.forEach(group => {
                    if (Array.isArray(group) && group.length >= 2) {
                        const pos = group[0];
                        const meanings = group[1];
                        if (Array.isArray(meanings)) {
                            html += `<div>
                                <div class="text-[10px] font-black text-gray-400 mb-2 uppercase mr-2">${utils.translatePOS(pos)} (${pos})</div>
                                <div class="flex flex-wrap gap-2">
                                    ${meanings.map(m => `<button onclick="app.selectMeaning('${m}')" class="bg-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm border border-gray-100 active:scale-95 transition-all">${m}</button>`).join('')}
                                </div>
                            </div>`;
                        }
                    }
                });
            }

            if (!html) {
                const simpleTranslation = json[0][0][0];
                html = `<div class="text-center py-10">
                    <p class="text-gray-500 font-bold mb-4">دیکشنری جزئیات بیشتری نیافت، ترجمه اصلی:</p>
                    <button onclick="app.selectMeaning('${simpleTranslation}')" class="blue-sharp px-6 py-3 rounded-2xl font-black">${simpleTranslation}</button>
                </div>`;
            }
            
            document.getElementById('explore-results').innerHTML = html;
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
        const blob = new Blob([JSON.stringify(this.data)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Backup_MyLang_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
        a.click();
    }

    importData(event) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.data = JSON.parse(e.target.result);
            this.save();
            alert("داده‌ها لود شدند");
        };
        reader.readAsText(event.target.files[0]);
    }

    openSettingsModal() {
        this.showModal(`
            <div class="ios-modal">
                <div class="modal-title-box !bg-[#303030]">تنظیمات برنامه</div>
                <div class="space-y-4">
                    <div class="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <label class="text-xs font-black text-gray-400 uppercase mb-2 block mr-2">زبان در حال یادگیری:</label>
                        <div id="target-lang-dropdown"></div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-2">
                        <button onclick="app.exportData()" class="p-4 bg-white text-gray-700 rounded-3xl font-black flex flex-col items-center justify-center gap-2 border border-gray-100 shadow-sm active:scale-95 transition-all">
                            <i class="fas fa-download text-2xl text-blue-500"></i>
                            <span class="text-sm">خروجی بک‌آپ</span>
                        </button>
                        <label class="p-4 bg-white text-gray-700 rounded-3xl font-black flex flex-col items-center justify-center gap-2 border border-gray-100 shadow-sm cursor-pointer active:scale-95 transition-all">
                            <i class="fas fa-upload text-2xl text-green-500"></i>
                            <span class="text-sm">لود بک‌آپ</span>
                            <input type="file" id="importFile" class="hidden" onchange="app.importData(event)">
                        </label>
                    </div>
                    <button onclick="app.hotReload()" class="w-full p-6 bg-blue-50 text-blue-600 rounded-3xl font-black flex justify-between items-center border border-blue-100 active:scale-95 transition-all">
                        <span>بهروزرسانی</span>
                        <i class="fas fa-sync-alt text-2xl"></i>
                    </button>
                    <button onclick="app.factoryReset()" class="w-full p-6 bg-red-50 text-red-600 rounded-3xl font-black flex justify-between items-center border border-red-100 active:scale-95 transition-all">
                        <span>بازگشت به تنظیمات کارخانه</span>
                        <i class="fas fa-trash-restore text-2xl"></i>
                    </button>
                    <div class="space-y-2 pt-2">
                        <div class="p-3 bg-gray-50 text-gray-400 rounded-2xl text-center font-black text-[10px] tracking-widest uppercase">
                            Software Version 1.2.2
                        </div>
                        <a href="https://boxp.ir" target="_blank" class="w-full p-5 bg-orange-500 text-white rounded-3xl font-black flex justify-center items-center gap-2 shadow-lg active:scale-[0.98] transition-all no-underline">
                            <span class="text-xs">توسعه یافته توسط پلتفرم جعبه (باکسپی)</span>
                        </a>
                    </div>
                    <div class="pt-2">
                        <button onclick="app.closeModal()" class="w-full p-4 bg-gray-100 text-gray-600 rounded-2xl font-black">بستن</button>
                    </div>
                </div>
            </div>`);

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
        this.showModal(`
            <div class="ios-modal p-8 text-center">
                <div class="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                    <i class="fas fa-sync-alt fa-spin"></i>
                </div>
                <h3 class="text-2xl font-black mb-2 text-gray-900">در حال بروزرسانی...</h3>
                <p class="text-gray-400 mb-8 font-bold">در حال دریافت آخرین نسخه و پاکسازی حافظه موقت...</p>
            </div>`);

        try {
            // 1. Clear all Cache Storage
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // 2. Unregister Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }

            // 3. Force reload from server
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        } catch (e) {
            console.error("Update failed:", e);
            window.location.reload(true);
        }
    }

    factoryReset() {
        this.showModal(`
            <div class="ios-modal p-8 text-center">
                <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fas fa-exclamation-triangle"></i></div>
                <h3 class="text-2xl font-black mb-2 text-gray-900">حذف کامل اطلاعات؟</h3>
                <p class="text-gray-400 mb-8 font-bold leading-relaxed">آیا از پاکسازی تمام اطلاعات اطمینان دارید؟<br>این عمل غیرقابل بازگشت است.</p>
                <div class="flex gap-3">
                    <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-gray-600 rounded-2xl font-black">انصراف</button>
                    <button onclick="app.executeFactoryReset()" class="flex-1 p-5 bg-red-500 text-white rounded-2xl font-black shadow-lg">بله، پاکسازی</button>
                </div>
            </div>`);
    }

    executeFactoryReset() {
        clearData();
        location.reload();
    }

    openGlobalSearchModal() {
        this.showModal(`
            <div class="ios-modal max-h-[85vh] flex flex-col !bg-[#ededed]">
                <div class="modal-title-box !bg-[#303030] !text-white shadow-none">جستجوی کل مجموعه‌ها</div>
                <div class="px-1 mb-4">
                    <div class="relative w-full">
                        <input id="global-search-input" type="text" oninput="app.handleGlobalSearch(this.value)" placeholder="جستجوی کلمه یا معنی..." class="w-full p-4 pr-12 bg-white rounded-2xl border border-gray-200 shadow-sm outline-none text-gray-700 font-bold focus:border-blue-500 transition-all">
                        <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                    </div>
                </div>
                <div id="global-search-results" class="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
                    <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                        <i class="fas fa-search text-5xl mb-4 opacity-20"></i>
                        <p class="font-bold">عبارتی را برای جستجو وارد کنید</p>
                    </div>
                </div>
                <div class="pt-4 border-t border-gray-200">
                    <button onclick="app.closeModal()" class="w-full p-4 bg-white text-gray-500 rounded-2xl font-black shadow-sm active:bg-gray-50 transition-all">بستن</button>
                </div>
            </div>`);
        
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
                    <div class="font-black text-xl text-gray-900" dir="ltr">${m.word.eng}</div>
                    <div class="font-bold text-lg text-gray-600 text-right">${m.word.per}</div>
                </div>
                <div class="flex justify-start">
                    <span class="bg-gray-100 text-gray-500 text-[11px] px-4 py-1.5 rounded-xl font-black border border-gray-200/50">
                        <i class="fas fa-folder-open ml-1 opacity-50"></i>
                        ${m.folderName}
                    </span>
                </div>
            </div>`).join('');
    }
}

// Expose to window for inline onclick handlers
window.app = new FlashcardApp();
