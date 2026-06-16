import { getInitialData, saveData, loadDataFromIndexedDB, ensureSystemFolders } from './storage.js';
import * as utils from './utils.js';
import * as modals from './components/Modals.js';

import { authMethods } from './services/auth.js';
import { folderMethods } from './services/folders.js';
import { wordMethods } from './services/words.js';
import { quizUiMethods } from './services/quiz_ui.js';
import { actionMethods } from './services/actions.js';

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
        this.currentMode = 'word';

        this.init();
    }

    async init() {
        try {
            const dbData = await loadDataFromIndexedDB();
            if (dbData) {
                this.data = ensureSystemFolders(dbData);
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
            if (!this.registration) {
                this.registration = await navigator.serviceWorker.getRegistration();
            }

            if (this.registration) {
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
        const isPhrase = this.currentMode === 'phrase';
        const lang = this.data.settings.targetLang;
        const labels = {
            'en': isPhrase ? 'Phrase / Sentence' : 'English',
            'de': isPhrase ? 'Satz' : 'Deutsch',
            'fr': isPhrase ? 'Phrase' : 'Français'
        };
        const perLabels = {
            'en': isPhrase ? 'جمله یا عبارت' : 'انگلیسی',
            'de': isPhrase ? 'جمله یا عبارت' : 'آلمانی',
            'fr': isPhrase ? 'جمله یا عبارت' : 'فرانسوی'
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

    toggleAppMode() {
        this.currentMode = this.currentMode === 'word' ? 'phrase' : 'word';
        
        const modeText = document.getElementById('mode-text');
        const modeIcon = document.getElementById('mode-icon');
        
        if (this.currentMode === 'phrase') {
            modeText.innerText = 'عبارت';
            modeIcon.className = 'fas fa-quote-right';
        } else {
            modeText.innerText = 'کلمه';
            modeIcon.className = 'fas fa-font';
        }
        
        this.goHome();
    }

    closeScreen(id) {
        document.getElementById(id).classList.add('hidden');
        this.renderFolders();
        if (this.activeIdx !== null) this.renderWords();
    }
}

// Assign prototype methods from service modules
Object.assign(FlashcardApp.prototype, authMethods);
Object.assign(FlashcardApp.prototype, folderMethods);
Object.assign(FlashcardApp.prototype, wordMethods);
Object.assign(FlashcardApp.prototype, quizUiMethods);
Object.assign(FlashcardApp.prototype, actionMethods);

window.app = new FlashcardApp();
