import { saveData, clearData } from '../storage.js';
import { syncData } from './sync.js';
import { supabase } from './supabase.js';
import * as modals from '../components/Modals.js';
import * as utils from '../utils.js';
import { SettingsPage } from '../components/SettingsPage.js';

export const actionMethods = {
    // --- Utils & UI Helpers ---
    syncSystemFolders() {
        const allFolder = this.data.folders.find(f => f.id === 0);
        const successFolder = this.data.folders.find(f => f.id === 222);
        const failedFolder = this.data.folders.find(f => f.id === 111);

        const allPhraseFolder = this.data.folders.find(f => f.id === 300);
        const successPhraseFolder = this.data.folders.find(f => f.id === 322);
        const failedPhraseFolder = this.data.folders.find(f => f.id === 311);

        if (allFolder) allFolder.words = [];
        if (successFolder) successFolder.words = [];
        if (failedFolder) failedFolder.words = [];

        if (allPhraseFolder) allPhraseFolder.words = [];
        if (successPhraseFolder) successPhraseFolder.words = [];
        if (failedPhraseFolder) failedPhraseFolder.words = [];

        this.data.folders.forEach((f, fIdx) => {
            if (f.isSystem) return;
            
            const isPhraseFolder = f.isPhrase === true;
            
            f.words.forEach(w => {
                const wordWithMeta = { ...w, sourceFolderIdx: fIdx };
                if (isPhraseFolder) {
                    if (allPhraseFolder) allPhraseFolder.words.push(wordWithMeta);
                    if (successPhraseFolder && w.success && !w.failed) {
                        successPhraseFolder.words.push(wordWithMeta);
                    }
                    if (failedPhraseFolder && w.failed) {
                        failedPhraseFolder.words.push(wordWithMeta);
                    }
                } else {
                    if (allFolder) allFolder.words.push(wordWithMeta);
                    if (successFolder && w.success && !w.failed) {
                        successFolder.words.push(wordWithMeta);
                    }
                    if (failedFolder && w.failed) {
                        failedFolder.words.push(wordWithMeta);
                    }
                }
            });
        });

        if (allFolder) allFolder.words.sort((a, b) => b.id - a.id);
        if (successFolder) successFolder.words.sort((a, b) => b.id - a.id);
        if (failedFolder) failedFolder.words.sort((a, b) => b.id - a.id);

        if (allPhraseFolder) allPhraseFolder.words.sort((a, b) => b.id - a.id);
        if (successPhraseFolder) successPhraseFolder.words.sort((a, b) => b.id - a.id);
        if (failedPhraseFolder) failedPhraseFolder.words.sort((a, b) => b.id - a.id);
    },

    save() {
        this.syncSystemFolders();
        saveData(this.data);
        this.renderFolders();
        if (this.user) {
            syncData(this.data, this.user).then(synced => {
                this.data = synced;
                this.syncSystemFolders();
                this.renderFolders();
                if (this.activeIdx !== null) this.renderWords();
            }).catch(err => console.error('BG Sync failed:', err));
        }
    },

    showModal(content) {
        const container = document.getElementById('modal-container');
        container.innerHTML = content;
        container.classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
    },

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
    },

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
    },

    async pasteFromClipboard(id) {
        await utils.pasteFromClipboard(id);
    },

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
    },

    speakAny(txt) {
        utils.speakAny(txt, utils.getFullLangCode(this.data.settings.targetLang));
    },

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
    },

    selectMeaning(val) {
        const input = document.getElementById('per-input');
        input.value = input.value ? input.value + '، ' + val : val;
        this.closeModal();
    },

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
    },

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
    },

    showImportOptions() {
        this.showModal(modals.ImportOptionsModal());
    },

    processImport(mode) {
        if (!this.tempImportData) return;
        
        const systemFolderIds = [0, 111, 222, 300, 311, 322];

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
    },

    showAlert(message, type = 'info', callback = null) {
        this.alertCallback = callback;
        this.showModal(modals.AlertModal(message, 'پیام سیستم', type));
    },

    closeAlert() {
        this.closeModal();
        if (this.alertCallback) {
            const cb = this.alertCallback;
            this.alertCallback = null;
            cb();
        }
    },

    openChangePasswordModal() {
        this.showModal(modals.ChangePasswordModal());
    },

    openSettingsModal() {
        window.scrollTo(0, 0);
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('word-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('settings-screen').classList.remove('hidden');
        
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const navSettings = document.getElementById('nav-settings');
        if (navSettings) navSettings.classList.add('active');

        this.renderSettingsPageContent();
    },

    renderSettingsPageContent() {
        const settingsContent = document.getElementById('settings-content');
        if (!settingsContent) return;
        
        settingsContent.innerHTML = SettingsPage(this.user);

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
    },

    toggleSettingsSection(sectionId) {
        const card = document.getElementById(sectionId);
        if (!card) return;
        const isOpen = card.classList.contains('open');
        document.querySelectorAll('.settings-section-card').forEach(c => {
            c.classList.remove('open');
        });
        if (!isOpen) {
            card.classList.add('open');
        }
    },

    async handleUpdateEmail(e) {
        e.preventDefault();
        const newEmail = document.getElementById('edit-email-input').value.trim();
        if (!newEmail) return;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>در حال پردازش...</span><i class="fas fa-spinner fa-spin mr-2"></i>`;

        try {
            const { data, error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            
            this.showAlert("یک لینک تایید به ایمیل جدید شما ارسال شد. لطفاً هر دو ایمیل (قدیمی و جدید) را برای تایید نهایی چک کنید.", "success");
            this.renderSettingsPageContent();
        } catch (err) {
            this.showAlert("خطا در تغییر ایمیل: " + err.message, "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    },

    async handleUpdatePassword(e) {
        e.preventDefault();
        const oldPassword = document.getElementById('old-password-input').value;
        const newPassword = document.getElementById('new-password-input').value;
        const confirmNewPassword = document.getElementById('confirm-new-password-input').value;

        if (newPassword !== confirmNewPassword) {
            this.showAlert("رمز عبور جدید و تکرار آن مطابقت ندارند.", "error");
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>در حال پردازش...</span><i class="fas fa-spinner fa-spin mr-2"></i>`;

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: this.user.email,
                password: oldPassword
            });
            if (authError) {
                throw new Error("رمز عبور فعلی اشتباه است.");
            }

            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            this.showAlert("رمز عبور شما با موفقیت تغییر یافت.", "success", () => {
                this.closeModal();
            });
        } catch (err) {
            this.showAlert("خطا: " + err.message, "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    },

    confirmDeleteAccount() {
        this.showModal(modals.ConfirmDeleteAccountModal());
    },

    openDeleteAccountFinalModal() {
        this.showModal(modals.ConfirmDeleteAccountFinalModal());
    },

    async executeDeleteAccount() {
        this.closeModal();
        try {
            const { error } = await supabase.rpc('delete_user');
            if (error) throw error;

            await supabase.auth.signOut();
            this.user = null;

            await clearData();
            this.showAlert("حساب کاربری و کلیه اطلاعات شما با موفقیت حذف شد. برنامه ریستارت می‌شود.", "success", () => {
                location.reload();
            });
        } catch (err) {
            this.showAlert("خطا در حذف حساب کاربری: " + err.message, "error");
        }
    },

    async hotReload() {
        if (!navigator.onLine) {
            alert("برای اعمال بروزرسانی باید به اینترنت متصل باشید.");
            return;
        }

        this.showModal(modals.HotReloadModal());

        try {
            // 1. Try to message the waiting service worker to skip waiting
            const reg = this.registration || await navigator.serviceWorker.getRegistration();
            if (reg && reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                return; // page will reload automatically via controllerchange listener
            }

            // 2. Fallback: Aggressive cleanup if no waiting registration is detected
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
                window.location.reload();
            }, 1000);
        } catch (e) {
            console.error("Update failed:", e);
            window.location.reload();
        }
    },

    factoryReset() {
        this.showModal(modals.FactoryResetModal());
    },

    async executeFactoryReset() {
        console.log("شروع فرآیند پاکسازی. کاربر: " + (this.user ? this.user.email : "مهمان (null)"));
        if (this.user) {
            try {
                // Fetch all folders and words of the user from Supabase to delete them by ID (more reliable and matches individual deletion logic)
                const { data: remoteFolders, error: fetchFoldErr } = await supabase
                    .from('folders')
                    .select('id')
                    .eq('user_id', this.user.id);
                
                const { data: remoteWords, error: fetchWordsErr } = await supabase
                    .from('words')
                    .select('id')
                    .eq('user_id', this.user.id);

                if (fetchFoldErr) {
                    console.error("خطا در دریافت مجموعه‌ها: " + JSON.stringify(fetchFoldErr));
                }
                if (fetchWordsErr) {
                    console.error("خطا در دریافت کلمات: " + JSON.stringify(fetchWordsErr));
                }

                const folderIds = remoteFolders ? remoteFolders.map(f => f.id) : [];
                const wordIds = remoteWords ? remoteWords.map(w => w.id) : [];

                console.log(`تعداد مجموعه‌ها برای حذف: ${folderIds.length}، تعداد کلمات: ${wordIds.length}`);

                // Delete all words
                if (wordIds.length > 0) {
                    const { error: wErr } = await supabase
                        .from('words')
                        .delete()
                        .in('id', wordIds)
                        .eq('user_id', this.user.id);
                    if (wErr) {
                        console.error("خطا در حذف کلمات از سرور: " + JSON.stringify(wErr));
                    } else {
                        console.log("کلمات با موفقیت از سرور حذف شدند.");
                    }
                }

                // Delete all folders
                if (folderIds.length > 0) {
                    const { error: fErr } = await supabase
                        .from('folders')
                        .delete()
                        .in('id', folderIds)
                        .eq('user_id', this.user.id);
                    if (fErr) {
                        console.error("خطا در حذف مجموعه‌ها از سرور: " + JSON.stringify(fErr));
                    } else {
                        console.log("مجموعه‌ها با موفقیت از سرور حذف شدند.");
                    }
                }

                // Sign out from Supabase to ensure the session is cleared
                console.log("در حال خروج از حساب کاربری...");
                await supabase.auth.signOut();
                this.user = null;
                console.log("خروج با موفقیت انجام شد.");
            } catch (err) {
                console.error("Failed to delete cloud data on factory reset:", err);
                this.showAlert("خطای عمومی در حذف داده‌های ابری: " + err.message, "error");
            }
        }
        await clearData();
        this.showAlert("تمامی اطلاعات و تنظیمات برنامه با موفقیت پاکسازی شد. برنامه مجدداً راه‌اندازی می‌شود.", "success", () => {
            location.reload();
        });
    },

    openGlobalSearchModal() {
        this.showModal(modals.GlobalSearchModal());
        setTimeout(() => document.getElementById('global-search-input').focus(), 100);
    },

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
            if (folder.isSystem) return;
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
    },

    async clickVerbForm(clickedWord, event) {
        if (event) event.stopPropagation();
        
        this.closeModal();
        
        if (this.activeIdx === null) {
            if (this.data.folders.length > 0) {
                this.openFolder(0);
            } else {
                this.showAlert("لطفاً ابتدا یک مجموعه بسازید.", "warning");
                return;
            }
        }
        
        const engInput = document.getElementById('eng-input');
        const perInput = document.getElementById('per-input');
        
        if (engInput && perInput) {
            engInput.value = clickedWord;
            perInput.value = "در حال ترجمه...";
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            try {
                const translation = await utils.getTranslation(clickedWord, 'en', 'fa');
                perInput.value = translation;
            } catch (err) {
                perInput.value = '';
                console.error("Failed to translate verb form:", err);
            }
        }
    },

    async openWordExplorer(wordText, localTranslation) {
        this.showModal(modals.WordExplorerModal(wordText));

        let resolvedTranslation = localTranslation;
        if (!resolvedTranslation) {
            try {
                resolvedTranslation = await utils.getTranslation(wordText, 'en', 'fa');
            } catch (err) {
                resolvedTranslation = 'بدون معنی فارسی';
            }
        }

        const cleanSentence = (str) => {
            if (!str) return '';
            let clean = str;
            try {
                const temp = document.createElement('div');
                temp.innerHTML = str;
                clean = temp.textContent || temp.innerText || str;
            } catch (e) {}
            clean = clean.replace(/<[^>]*>/g, '');
            return clean.replace(/\s+/g, ' ').trim();
        };

        // 1. Load irregular verbs list if not cached
        if (!this.irregularVerbsCache) {
            try {
                const res = await fetch('https://raw.githubusercontent.com/WithEnglishWeCan/generated-english-irregular-verbs/master/irregular.verbs.build.json');
                if (res.ok) {
                    this.irregularVerbsCache = await res.json();
                }
            } catch (err) {
                console.error("Failed to load irregular verbs database:", err);
            }
        }

        const lowerWord = wordText.trim().toLowerCase();

        // Data containers
        let dictData = null;
        let isOffline = false;
        let wordNotFound = false;
        
        let synonyms = [];
        let antonyms = [];
        let relatedWords = [];
        let myMemorySentences = [];
        let usAudioUrl = '';
        let ukAudioUrl = '';

        // Concurrently fetch dictionary data, thesaurus, and parallel sentences
        const fetchPromises = [];

        // Fetch dictionary definitions & audio URLs
        fetchPromises.push(
            fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(lowerWord)}`)
                .then(async res => {
                    if (res.ok) {
                        dictData = await res.json();
                        if (dictData && dictData[0]) {
                            // Extract phonetics audio
                            if (dictData[0].phonetics) {
                                dictData[0].phonetics.forEach(p => {
                                    if (p.audio) {
                                        const aud = p.audio.toLowerCase();
                                        if (aud.includes('-us') || aud.includes('us.')) {
                                            usAudioUrl = p.audio;
                                        } else if (aud.includes('-uk') || aud.includes('uk.')) {
                                            ukAudioUrl = p.audio;
                                        } else {
                                            if (!usAudioUrl) usAudioUrl = p.audio;
                                            else if (!ukAudioUrl) ukAudioUrl = p.audio;
                                        }
                                    }
                                });
                            }
                            
                            // Extract synonyms and antonyms from dictionary definitions
                            dictData[0].meanings.forEach(m => {
                                if (m.synonyms) m.synonyms.forEach(s => { if (!synonyms.includes(s.toLowerCase())) synonyms.push(s.toLowerCase()); });
                                if (m.antonyms) m.antonyms.forEach(a => { if (!antonyms.includes(a.toLowerCase())) antonyms.push(a.toLowerCase()); });
                                m.definitions.forEach(d => {
                                    if (d.synonyms) d.synonyms.forEach(s => { if (!synonyms.includes(s.toLowerCase())) synonyms.push(s.toLowerCase()); });
                                    if (d.antonyms) d.antonyms.forEach(a => { if (!antonyms.includes(a.toLowerCase())) antonyms.push(a.toLowerCase()); });
                                });
                            });
                        }
                    } else if (res.status === 404) {
                        wordNotFound = true;
                    } else {
                        isOffline = true;
                    }
                })
                .catch(err => {
                    isOffline = true;
                    console.error("Dictionary API error:", err);
                })
        );

        // Fetch Datamuse Synonyms
        fetchPromises.push(
            fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(lowerWord)}&max=8`)
                .then(async res => {
                    if (res.ok) {
                        const data = await res.json();
                        data.forEach(item => {
                            const val = item.word.toLowerCase();
                            if (!synonyms.includes(val) && val !== lowerWord) synonyms.push(val);
                        });
                    }
                })
                .catch(err => console.error("Datamuse synonyms fetch error:", err))
        );

        // Fetch Datamuse Antonyms
        fetchPromises.push(
            fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(lowerWord)}&max=8`)
                .then(async res => {
                    if (res.ok) {
                        const data = await res.json();
                        data.forEach(item => {
                            const val = item.word.toLowerCase();
                            if (!antonyms.includes(val) && val !== lowerWord) antonyms.push(val);
                        });
                    }
                })
                .catch(err => console.error("Datamuse antonyms fetch error:", err))
        );

        // Fetch Datamuse Related/Topic Words (means-like)
        fetchPromises.push(
            fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(lowerWord)}&max=8`)
                .then(async res => {
                    if (res.ok) {
                        const data = await res.json();
                        data.forEach(item => {
                            const val = item.word.toLowerCase();
                            if (!relatedWords.includes(val) && val !== lowerWord) relatedWords.push(val);
                        });
                    }
                })
                .catch(err => console.error("Datamuse related words fetch error:", err))
        );

        // Fetch MyMemory parallel sentences (Tatoeba equivalent for client-side CORS)
        fetchPromises.push(
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(lowerWord)}&langpair=en|fa`)
                .then(async res => {
                    if (res.ok) {
                        const data = await res.json();
                        if (data.matches) {
                            myMemorySentences = data.matches
                                .filter(m => m.segment && m.segment.toLowerCase() !== lowerWord && m.segment.split(' ').length > 2)
                                .map(m => {
                                    const english = cleanSentence(m.segment);
                                    const persian = cleanSentence(m.translation);
                                    return { english, persian };
                                })
                                .filter(s => s.english.length > 0 && s.persian.length > 0)
                                .slice(0, 4);
                        }
                    }
                })
                .catch(err => console.error("MyMemory parallel sentences fetch error:", err))
        );

        await Promise.all(fetchPromises);

        // 3. Process Verb Conjugations
        let verbConjugations = null;
        let irregularVerb = null;
        let irregularBase = '';
        if (this.irregularVerbsCache) {
            if (this.irregularVerbsCache[lowerWord]) {
                irregularVerb = this.irregularVerbsCache[lowerWord][0];
                irregularBase = lowerWord;
            } else {
                for (const [base, infoArr] of Object.entries(this.irregularVerbsCache)) {
                    const info = infoArr[0];
                    const forms2 = info["2"] || [];
                    const forms3 = info["3"] || [];
                    const forms1 = info["1"] || [base];
                    if (forms2.map(f => f.toLowerCase()).includes(lowerWord) || 
                        forms3.map(f => f.toLowerCase()).includes(lowerWord) ||
                        forms1.map(f => f.toLowerCase()).includes(lowerWord)) {
                        irregularVerb = info;
                        irregularBase = base;
                        break;
                    }
                }
            }
        }

        if (irregularVerb) {
            verbConjugations = {
                base: irregularBase,
                past: irregularVerb["2"] ? irregularVerb["2"].join(' / ') : '',
                pp: irregularVerb["3"] ? irregularVerb["3"].join(' / ') : '',
                type: 'بی‌قاعده (Irregular)'
            };
        } else {
            const isVerb = dictData && dictData[0]?.meanings.some(m => m.partOfSpeech.toLowerCase() === 'verb');
            if (isVerb) {
                let base = lowerWord;
                let past = lowerWord;
                
                if (lowerWord.endsWith('ed')) {
                    if (lowerWord.endsWith('ied')) {
                        base = lowerWord.slice(0, -3) + 'y';
                    } else {
                        base = lowerWord.slice(0, -2);
                    }
                } else {
                    if (base.endsWith('e')) {
                        past = base + 'd';
                    } else if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
                        past = base.slice(0, -1) + 'ied';
                    } else if (/[aeiou][bcdfghjklmnpqrstvwxyz]$/.test(base) && !/^[aeiou]/.test(base)) {
                        if (base.length <= 4 && !base.endsWith('w') && !base.endsWith('x') && !base.endsWith('y')) {
                            past = base + base.slice(-1) + 'ed';
                        } else {
                            past = base + 'ed';
                        }
                    } else {
                        past = base + 'ed';
                    }
                }
                
                verbConjugations = {
                    base: base,
                    past: past,
                    pp: past,
                    type: 'باقاعده (Regular)'
                };
            }
        }

        // 4. Translate definitions and examples in parallel using Google Translate
        if (dictData && dictData[0]?.meanings) {
            const translationPromises = [];
            dictData[0].meanings.forEach(m => {
                m.definitions = m.definitions.slice(0, 3);
                m.definitions.forEach(d => {
                    translationPromises.push(
                        utils.getTranslation(d.definition, 'en', 'fa')
                            .then(tr => { d.translation = tr; })
                            .catch(() => { d.translation = ''; })
                    );
                    if (d.example) {
                        translationPromises.push(
                            utils.getTranslation(d.example, 'en', 'fa')
                                .then(tr => { d.exampleTranslation = tr; })
                                .catch(() => { d.exampleTranslation = ''; })
                        );
                    }
                });
            });
            await Promise.all(translationPromises);
        }

        // 5. Build HTML Output
        let html = '';

        // Header Section
        let phoneticText = '';
        if (dictData && dictData[0]) {
            phoneticText = dictData[0].phonetic || '';
            if (!phoneticText) {
                const textPhonetic = dictData[0].phonetics.find(p => p.text && p.text.length > 0);
                if (textPhonetic) phoneticText = textPhonetic.text;
            }
        }

        html += `
            <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center text-sm">
                <div class="flex flex-col text-right">
                    <span class="text-[13px] font-bold text-gray-400">معنی ثبت شده:</span>
                    <span class="text-[15px] font-black text-gray-800">${utils.escapeHTML(resolvedTranslation)}</span>
                    ${phoneticText ? `<span class="text-[13px] text-blue-600 font-bold mt-1" dir="ltr">${utils.escapeHTML(phoneticText)}</span>` : ''}
                </div>
                <div class="flex gap-1.5">
                    <button onclick="app.speakWordAccent('${utils.escapeHTML(wordText)}', 'us', '${utils.escapeHTML(usAudioUrl)}')" class="w-12 h-11 bg-white text-blue-500 rounded-xl flex flex-col items-center justify-center active:scale-90 transition-all border border-blue-100 shadow-xs" title="تلفظ US">
                        <span class="text-[8px] font-black leading-none mb-0.5">US</span>
                        <i class="fas fa-volume-up text-xs"></i>
                    </button>
                    <button onclick="app.speakWordAccent('${utils.escapeHTML(wordText)}', 'uk', '${utils.escapeHTML(ukAudioUrl)}')" class="w-12 h-11 bg-white text-green-600 rounded-xl flex flex-col items-center justify-center active:scale-90 transition-all border border-green-100 shadow-xs" title="تلفظ UK">
                        <span class="text-[8px] font-black leading-none mb-0.5">UK</span>
                        <i class="fas fa-volume-up text-xs"></i>
                    </button>
                </div>
            </div>`;

        // Verb Conjugations Section (Multi-row with header box)
        if (verbConjugations) {
            html += `
                <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                    <div class="blue-sharp p-2.5 rounded-2xl text-center font-black text-[13px] shadow-sm">
                        فعل ${verbConjugations.type}
                    </div>
                    <div class="flex flex-col gap-2">
                        <div class="bg-gray-50 p-3 rounded-2xl border border-gray-200/50 flex justify-between items-center text-[13px] shadow-xs">
                            <span class="text-gray-400 font-bold">شکل پایه (Infinitive):</span>
                            <span class="font-black text-gray-800 cursor-pointer hover:text-blue-500 transition-colors" dir="ltr" onclick="app.clickVerbForm('${utils.escapeHTML(verbConjugations.base)}', event)">${utils.escapeHTML(verbConjugations.base)}</span>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-2xl border border-gray-200/50 flex justify-between items-center text-[13px] shadow-xs">
                            <span class="text-gray-400 font-bold">گذشته ساده (Past Simple):</span>
                            <span class="font-black text-gray-800 cursor-pointer hover:text-blue-500 transition-colors" dir="ltr" onclick="app.clickVerbForm('${utils.escapeHTML(verbConjugations.past)}', event)">${utils.escapeHTML(verbConjugations.past)}</span>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-2xl border border-gray-200/50 flex justify-between items-center text-[13px] shadow-xs">
                            <span class="text-gray-400 font-bold">اسم مفعول (Past Participle):</span>
                            <span class="font-black text-gray-800 cursor-pointer hover:text-blue-500 transition-colors" dir="ltr" onclick="app.clickVerbForm('${utils.escapeHTML(verbConjugations.pp)}', event)">${utils.escapeHTML(verbConjugations.pp)}</span>
                        </div>
                    </div>
                </div>`;
        }

        // Synonyms Section
        if (synonyms.length > 0) {
            const synonymBadges = synonyms.slice(0, 8).map(s => `
                <span onclick="app.openWordExplorer('${utils.escapeHTML(s)}', '')" class="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[13px] font-bold border border-blue-100 hover:bg-blue-100 active:scale-95 transition-all cursor-pointer whitespace-nowrap">${utils.escapeHTML(s)}</span>
            `).join('');

            html += `
                <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
                    <div class="text-[13px] font-black text-blue-600 uppercase mr-1 mb-1">مترادف‌ها (Synonyms)</div>
                    <div class="flex flex-wrap gap-2">${synonymBadges}</div>
                </div>`;
        }

        // Antonyms Section
        if (antonyms.length > 0) {
            const antonymBadges = antonyms.slice(0, 8).map(a => `
                <span onclick="app.openWordExplorer('${utils.escapeHTML(a)}', '')" class="bg-red-50 text-red-500 px-3 py-1.5 rounded-xl text-[13px] font-bold border border-red-100 hover:bg-red-100 active:scale-95 transition-all cursor-pointer whitespace-nowrap">${utils.escapeHTML(a)}</span>
            `).join('');

            html += `
                <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
                    <div class="text-[13px] font-black text-red-500 uppercase mr-1 mb-1">متضادها (Antonyms)</div>
                    <div class="flex flex-wrap gap-2">${antonymBadges}</div>
                </div>`;
        }

        // Related Words Section
        if (relatedWords.length > 0) {
            const relatedBadges = relatedWords.slice(0, 8).map(rw => `
                <span onclick="app.openWordExplorer('${utils.escapeHTML(rw)}', '')" class="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[13px] font-bold border border-amber-100 hover:bg-amber-100 active:scale-95 transition-all cursor-pointer whitespace-nowrap">${utils.escapeHTML(rw)}</span>
            `).join('');

            html += `
                <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
                    <div class="text-[13px] font-black text-amber-600 uppercase mr-1 mb-1">کلمات مرتبط (Related)</div>
                    <div class="flex flex-wrap gap-2">${relatedBadges}</div>
                </div>`;
        }

        // MyMemory / Tatoeba Bilingual Sentences Section
        if (myMemorySentences.length > 0) {
            const sentenceItems = myMemorySentences.map(s => `
                <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/50 flex flex-col gap-1.5 shadow-xs text-right">
                    <div class="text-[14px] text-gray-800 font-bold text-left leading-relaxed" dir="ltr">
                        ${utils.escapeHTML(s.english)}
                    </div>
                    <div class="text-[13px] text-gray-500 font-bold text-right border-t border-gray-200/40 pt-1 mt-1" dir="rtl">
                        ${utils.escapeHTML(s.persian)}
                    </div>
                </div>
            `).join('');

            html += `
                <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                    <div class="text-[13px] font-black text-emerald-600 uppercase mr-1 mb-1">جملات نمونه دو زبانه (Bilingual Examples)</div>
                    <div class="flex flex-col gap-2">${sentenceItems}</div>
                </div>`;
        }

        // Dictionary definitions with translations
        if (dictData && dictData[0]?.meanings) {
            dictData[0].meanings.forEach(m => {
                const pos = m.partOfSpeech;
                const faPos = utils.translatePOS(pos);
                
                const defs = m.definitions.map((d, index) => `
                    <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/50 flex flex-col gap-1.5 shadow-xs mb-3 last:mb-0 text-right">
                        <div class="text-[14px] text-gray-800 font-bold text-left leading-relaxed" dir="ltr">
                            <span class="text-blue-500 font-black mr-1">${index + 1}.</span> ${utils.escapeHTML(d.definition)}
                        </div>
                        ${d.translation ? `
                        <div class="text-[13px] text-gray-500 font-bold text-right leading-relaxed border-t border-gray-200/40 pt-1 mt-1" dir="rtl">
                            ${utils.escapeHTML(d.translation)}
                        </div>
                        ` : ''}
                        
                        ${d.example ? `
                        <div class="text-[13px] text-gray-400 italic text-left mt-1" dir="ltr">
                            e.g. "${utils.escapeHTML(d.example)}"
                        </div>
                        ` : ''}
                        ${d.example && d.exampleTranslation ? `
                        <div class="text-[13px] text-gray-400 font-bold text-right mt-0.5" dir="rtl">
                            مثال: ${utils.escapeHTML(d.exampleTranslation)}
                        </div>
                        ` : ''}
                    </div>
                `).join('');

                html += `
                    <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
                        <div class="text-[13px] font-black text-amber-600 uppercase mr-1 mb-1">${faPos} (${pos})</div>
                        <div class="flex flex-col">${defs}</div>
                    </div>`;
            });
        }

        // Handle Errors (Separated offline and wordNotFound)
        if (wordNotFound) {
            html += `
                <div class="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                    <div class="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                        <i class="fas fa-question-circle"></i>
                    </div>
                    <p class="text-gray-800 font-black text-[14px]">کلمه در لغت‌نامه پیدا نشد</p>
                    <p class="text-gray-400 text-[13px] mt-2 font-bold leading-relaxed">لغت‌نامه آنلاین تلفظ و معنی مشخصی برای این کلمه پیدا نکرد.</p>
                </div>`;
        } else if (isOffline) {
            html += `
                <div class="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                    <div class="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                        <i class="fas fa-wifi-slash"></i>
                    </div>
                    <p class="text-gray-800 font-black text-[14px]">عدم اتصال به اینترنت</p>
                    <p class="text-gray-400 text-[13px] mt-2 font-bold leading-relaxed">برای مشاهده اطلاعات دیکشنری آنلاین و تلفظ کلمه، لطفا اتصال اینترنت خود را بررسی کنید.</p>
                    <button onclick="app.openWordExplorer('${utils.escapeHTML(wordText)}', '${utils.escapeHTML(resolvedTranslation)}')" class="mt-4 px-4 py-2 bg-blue-50 text-blue-500 border border-blue-100 rounded-xl font-black text-[13px] active:scale-95 transition-all">تلاش مجدد</button>
                </div>`;
        }

        document.getElementById('word-explorer-results').innerHTML = html;
    },

    speakWordAccent(wordText, accent, audioUrl) {
        if (audioUrl && audioUrl !== 'undefined' && audioUrl !== '') {
            const audio = new Audio(audioUrl);
            audio.play().catch(err => {
                console.warn("Audio play failed, falling back to TTS:", err);
                utils.speakAny(wordText, accent === 'us' ? 'en-US' : 'en-GB');
            });
        } else {
            utils.speakAny(wordText, accent === 'us' ? 'en-US' : 'en-GB');
        }
    },

    checkGrammarDebounced(inputId) {
        if (this[`grammarTimeout_${inputId}`]) {
            clearTimeout(this[`grammarTimeout_${inputId}`]);
        }
        this[`grammarTimeout_${inputId}`] = setTimeout(() => {
            this.checkGrammar(inputId);
        }, 800);
    },

    async checkGrammar(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const text = input.value.trim();
        const btn = document.getElementById(`${inputId}-grammar-btn`);
        if (!btn) return;

        if (!text || text.split(' ').length < 1) {
            btn.classList.add('hidden');
            this.closeGrammarSuggestions(inputId);
            return;
        }

        const lang = this.data.settings.targetLang || 'en';
        const langMap = {
            'en': 'en-US',
            'de': 'de-DE',
            'fr': 'fr-FR'
        };
        const langCode = langMap[lang] || 'en-US';

        try {
            const response = await fetch('https://api.languagetool.org/v2/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `text=${encodeURIComponent(text)}&language=${langCode}`
            });
            if (response.ok) {
                const data = await response.json();
                const matches = data.matches || [];
                const errorMatches = matches.filter(m => m.replacements && m.replacements.length > 0);
                
                if (errorMatches.length > 0) {
                    btn.classList.remove('hidden');
                    btn.onclick = () => this.showGrammarSuggestions(inputId, errorMatches);
                } else {
                    btn.classList.add('hidden');
                    this.closeGrammarSuggestions(inputId);
                }
            }
        } catch (err) {
            console.error("LanguageTool API error:", err);
        }
    },

    showGrammarSuggestions(inputId, errorMatches) {
        this.closeGrammarSuggestions(inputId);

        const input = document.getElementById(inputId);
        if (!input) return;
        const parent = input.parentElement;
        
        const popup = document.createElement('div');
        popup.id = `${inputId}-grammar-popup`;
        popup.className = 'absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-[999] text-right';
        popup.style.animation = 'ios-pop 0.2s cubic-bezier(0.1, 0.7, 0.1, 1)';
        
        let suggestionsHtml = errorMatches.map((m, matchIdx) => {
            const errorText = input.value.substring(m.offset, m.offset + m.length);
            const replacements = m.replacements.slice(0, 4).map(r => `
                <button type="button" onclick="app.applyGrammarCorrection('${inputId}', ${m.offset}, ${m.length}, '${utils.escapeHTML(r.value)}')" class="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs active:scale-95 transition-all text-center border border-blue-100 hover:bg-blue-100 whitespace-nowrap">
                    ${utils.escapeHTML(r.value)}
                </button>
            `).join('');

            return `
                <div class="flex flex-col gap-2 pb-3 mb-2 last:pb-0 last:mb-0 border-b border-gray-100 last:border-b-0">
                    <div class="text-[12px] font-bold text-gray-500 leading-relaxed" dir="rtl">
                        اشتباه: <span class="text-red-500 font-black" dir="ltr">"${utils.escapeHTML(errorText)}"</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5" dir="ltr">
                        ${replacements}
                    </div>
                </div>`;
        }).join('');

        popup.innerHTML = `
            <div class="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-100">
                <span class="text-[12px] font-black text-gray-800">منظورتان کدام است؟</span>
                <button type="button" onclick="app.closeGrammarSuggestions('${inputId}')" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times-circle text-lg"></i></button>
            </div>
            <div class="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                ${suggestionsHtml}
            </div>`;

        parent.appendChild(popup);
        
        const outsideClickListener = (e) => {
            if (!popup.contains(e.target) && e.target.id !== `${inputId}-grammar-btn` && !e.target.closest(`#${inputId}-grammar-btn`)) {
                this.closeGrammarSuggestions(inputId);
                document.removeEventListener('click', outsideClickListener);
            }
        };
        setTimeout(() => document.addEventListener('click', outsideClickListener), 100);
    },

    closeGrammarSuggestions(inputId) {
        const popup = document.getElementById(`${inputId}-grammar-popup`);
        if (popup) {
            popup.remove();
        }
    },

    applyGrammarCorrection(inputId, offset, length, replacement) {
        const input = document.getElementById(inputId);
        if (input) {
            const original = input.value;
            const corrected = original.substring(0, offset) + replacement + original.substring(offset + length);
            input.value = corrected;
            this.closeGrammarSuggestions(inputId);
            this.checkGrammar(inputId);
        }
    },

    checkPushPermissionOnLaunch() {
        if (!navigator.onLine) return;
        if (!('serviceWorker' in navigator && 'PushManager' in window)) return;
        
        if (Notification.permission === 'granted') {
            this.syncPushSubscription();
            return;
        }

        if (Notification.permission === 'default') {
            setTimeout(() => {
                // Only show if no other modal is currently visible
                const modalContainer = document.getElementById('modal-container');
                if (modalContainer && modalContainer.classList.contains('hidden')) {
                    this.showModal(modals.PushPermissionModal());
                }
            }, 3000);
        }
    },

    async requestPushPermission() {
        this.closeModal();
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await this.syncPushSubscription();
                this.showAlert('یادآور هوشمند فعال شد! از این پس یادآوری‌های روزانه را دریافت خواهید کرد.', 'success');
            } else {
                console.log('Push permission denied/dismissed:', permission);
            }
        } catch (error) {
            console.error('Error requesting push permission:', error);
            this.showAlert('خطا در فعال‌سازی نوتیفیکیشن: ' + error.message, 'error');
        }
    },

    async syncPushSubscription() {
        try {
            if (!('serviceWorker' in navigator && 'PushManager' in window)) return;
            if (!this.registration) {
                this.registration = await navigator.serviceWorker.getRegistration();
            }
            if (!this.registration) return;

            const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) {
                console.warn('VITE_VAPID_PUBLIC_KEY is not defined in env.');
                return;
            }

            const convertedVapidKey = utils.urlBase64ToUint8Array(publicVapidKey);

            let subscription = await this.registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await this.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            }

            const subJson = subscription.toJSON();
            const targetUserId = this.user ? this.user.id : null;
            
            const { data: existing, error: fetchError } = await supabase
                .from('push_subscriptions')
                .select('id, user_id')
                .eq('subscription->>endpoint', subJson.endpoint)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (!existing) {
                const { error: insertError } = await supabase
                    .from('push_subscriptions')
                    .insert({
                        user_id: targetUserId,
                        subscription: subJson
                    });
                if (insertError) throw insertError;
                console.log('Push subscription saved to Supabase successfully. User ID:', targetUserId);
            } else {
                if (existing.user_id !== targetUserId) {
                    const { error: updateError } = await supabase
                        .from('push_subscriptions')
                        .update({
                            user_id: targetUserId
                        })
                        .eq('id', existing.id);
                    if (updateError) throw updateError;
                    console.log('Push subscription user ID updated in Supabase to:', targetUserId);
                } else {
                    console.log('Push subscription already up to date in Supabase.');
                }
            }

        } catch (error) {
            console.error('Error syncing push subscription:', error);
        }
    },

    loadPredefinedWords(isModal = false) {
        const selectId = isModal ? 'auto-load-select-modal' : 'auto-load-select';
        const selectEl = document.getElementById(selectId);
        if (!selectEl) return;

        const val = selectEl.value;
        const label = selectEl.options[selectEl.selectedIndex].text;

        this.showModal(modals.ConfirmLoadPredefinedModal(val, label));
    },

    async executeLoadPredefinedWords(val) {
        this.closeModal();
        try {
            const res = await fetch(`./data/${val}.json`);
            if (!res.ok) throw new Error(`خطا در دانلود فایل: ${res.statusText}`);
            
            const wordsList = await res.json();
            if (!Array.isArray(wordsList) || wordsList.length === 0) {
                throw new Error("لیست کلمات نامعتبر یا خالی است.");
            }

            const folderId = Date.now();
            const folderName = `Oxford ${val.toUpperCase().replace('-OXFORD', '')}`;
            
            const newFolder = {
                id: folderId,
                name: folderName,
                isSystem: false,
                isPhrase: false,
                updated_at: folderId,
                words: []
            };

            wordsList.forEach((w, index) => {
                newFolder.words.push({
                    id: folderId + index + 1,
                    eng: w.eng,
                    per: w.per,
                    success: false,
                    failed: false,
                    updated_at: folderId
                });
            });

            this.data.folders.push(newFolder);
            this.save();
            this.showAlert(`مجموعه "${folderName}" با موفقیت بارگذاری شد و ${wordsList.length} کلمه به برنامه اضافه گردید.`, 'success');

        } catch (e) {
            console.error(e);
            this.showAlert("خطا در بارگذاری کلمات: " + e.message, "error");
        }
    }
};

