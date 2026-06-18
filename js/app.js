import { getInitialData, saveData, loadDataFromIndexedDB, ensureSystemFolders } from './storage.js';
import * as utils from './utils.js';
import * as modals from './components/Modals.js';
import { showA2HSPrompt, checkA2HSOnLaunch } from './components/A2HSPrompt.js';

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
        this.selectionMode = false;
        this.selectedWordIds = [];

        this.init();
    }

    async init() {
        this.setLoaderStatus(15, 'در حال راه‌اندازی...');

        window.alert = (message) => {
            if (typeof this.showAlert === 'function') {
                this.showAlert(message);
            } else {
                console.log("Alert: " + message);
            }
        };

        // 1. Loading local data
        this.setLoaderStatus(35, 'در حال بارگذاری اطلاعات محلی...');
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
        
        // Update online/offline icon immediately
        this.updateConnectionStatus();

        // 2. Service Worker registration
        this.setLoaderStatus(55, 'در حال بررسی بروزرسانی برنامه...');
        this.registerServiceWorker();
        this.updateUILabels();

        // 3. Authenticate and Sync
        this.setLoaderStatus(75, 'در حال بررسی حساب کاربری...');
        try {
            await this.checkUserSession();
        } catch (e) {
            console.warn('Auth check failed:', e);
        }

        if (this.user) {
            if (navigator.onLine) {
                this.setLoaderStatus(90, 'در حال همگام‌سازی ابری...');
                try {
                    await this.triggerSync();
                } catch (e) {
                    console.warn('Sync failed:', e);
                }
            } else {
                console.log('Skipping sync: Device is offline');
            }
        }

        this.checkPushPermissionOnLaunch();

        // Automatic synchronization when connection is restored
        window.addEventListener('online', () => {
            this.updateConnectionStatus();
            if (this.user) {
                this.triggerSync();
            }
        });
        window.addEventListener('offline', () => {
            this.updateConnectionStatus();
        });

        // Hide Persian mic button in Safari as it's not supported
        if (utils.isSafari()) {
            const perMicBtn = document.getElementById('per-mic-btn');
            if (perMicBtn) perMicBtn.style.display = 'none';
        }

        // Check Add to Home Screen (A2HS) PWA install on launch
        checkA2HSOnLaunch();
        this.updateModeToggleUI();

        // 4. Complete
        this.setLoaderStatus(100, 'خوش آمدید!');
        setTimeout(() => {
            this.hideLoader();
        }, 300);
    }

    setLoaderStatus(percent, text) {
        const progressBar = document.getElementById('loader-progress-bar');
        const statusText = document.getElementById('loader-status-text');
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (statusText) statusText.innerText = text;
    }

    hideLoader() {
        const loader = document.getElementById('startup-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 400);
        }
    }

    updateConnectionStatus() {
        const statusIcon = document.getElementById('nav-status-icon');
        const statusText = document.getElementById('nav-status-text');
        if (!statusIcon || !statusText) return;

        if (navigator.onLine) {
            statusIcon.className = 'fas fa-wifi';
            statusIcon.style.color = '#22c55e'; // green-500
            statusText.innerText = 'آنلاین';
        } else {
            statusIcon.className = 'fas fa-wifi-slash';
            statusIcon.style.color = '#ef4444'; // red-500
            statusText.innerText = 'آفلاین';
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => {
                        this.registration = reg;
                        console.log('Service Worker registered', reg);
                        
                        // 1. If there's already a waiting worker, show the update prompt
                        if (reg.waiting) {
                            this.showUpdatePrompt();
                        }

                        // 2. If a new service worker is found while the app is running
                        reg.onupdatefound = () => {
                            const installingWorker = reg.installing;
                            if (installingWorker) {
                                installingWorker.onstatechange = () => {
                                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        this.showUpdatePrompt();
                                    }
                                };
                            }
                        };
                    })
                    .catch(err => console.warn('Service Worker registration failed:', err));

                // 3. Reload page when the new Service Worker activates and takes control
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (!refreshing) {
                        refreshing = true;
                        window.location.reload();
                    }
                });
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

    showInstallGuide() {
        showA2HSPrompt(true);
    }

    updateUILabels() {
        const isPhrase = this.currentMode === 'phrase';
        const lang = this.data.settings.targetLang;
        const labels = {
            'en': isPhrase ? 'phrase' : 'English',
            'de': isPhrase ? 'Satz' : 'Deutsch',
            'fr': isPhrase ? 'Phrase' : 'Français'
        };
        const perLabels = {
            'en': isPhrase ? 'عبارت' : 'انگلیسی',
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
        document.getElementById('settings-screen').classList.add('hidden');
        document.getElementById('home-screen').classList.remove('hidden');
        
        const topLogo = document.getElementById('app-logo-header');
        if (topLogo) topLogo.classList.remove('hidden');
        
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.getElementById('nav-home').classList.add('active');
        this.renderFolders();
    }

    setAppMode(mode) {
        if (this.currentMode === mode) return;
        this.currentMode = mode;
        this.updateModeToggleUI();
        this.goHome();
    }

    updateModeToggleUI() {
        const btnWord = document.getElementById('mode-btn-word');
        const btnPhrase = document.getElementById('mode-btn-phrase');
        if (btnWord && btnPhrase) {
            if (this.currentMode === 'phrase') {
                btnWord.classList.remove('active');
                btnPhrase.classList.add('active');
            } else {
                btnPhrase.classList.remove('active');
                btnWord.classList.add('active');
            }
        }
    }

    toggleAppMode() {
        const newMode = this.currentMode === 'word' ? 'phrase' : 'word';
        this.setAppMode(newMode);
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
