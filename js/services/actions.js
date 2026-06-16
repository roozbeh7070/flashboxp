import { saveData, clearData } from '../storage.js';
import { syncData } from './sync.js';
import * as modals from '../components/Modals.js';
import * as utils from '../utils.js';

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
    },

    async hotReload() {
        if (!navigator.onLine) {
            alert("برای اعمال بروزرسانی باید به اینترنت متصل باشید.");
            return;
        }

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
    },

    factoryReset() {
        this.showModal(modals.FactoryResetModal());
    },

    async executeFactoryReset() {
        await clearData();
        location.reload();
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

    async openWordExplorer(wordText, localTranslation) {
        this.showModal(modals.WordExplorerModal(wordText));

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

        // 2. Fetch dictionary definitions from Free Dictionary API
        let dictData = null;
        let dictError = false;
        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(wordText.trim().toLowerCase())}`);
            if (res.ok) {
                dictData = await res.json();
            } else {
                dictError = true;
            }
        } catch (err) {
            dictError = true;
            console.error("Failed to fetch dictionary definition:", err);
        }

        // 3. Process Verb Conjugations
        const lowerWord = wordText.trim().toLowerCase();
        let verbConjugations = null;
        if (this.irregularVerbsCache && this.irregularVerbsCache[lowerWord]) {
            const verbInfo = this.irregularVerbsCache[lowerWord][0];
            verbConjugations = {
                past: verbInfo["2"] ? verbInfo["2"].join(' / ') : '',
                pp: verbInfo["3"] ? verbInfo["3"].join(' / ') : '',
                type: 'بی‌قاعده (Irregular)'
            };
        } else {
            // Check if it's a verb in meanings
            const isVerb = dictData && dictData[0]?.meanings.some(m => m.partOfSpeech.toLowerCase() === 'verb');
            if (isVerb) {
                const base = lowerWord;
                let past = '';
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
                verbConjugations = {
                    past: past,
                    pp: past,
                    type: 'باقاعده (Regular)'
                };
            }
        }

        // 4. Build HTML Output
        let html = '';

        // Header Section: Pronunciation & Audio
        let phoneticText = '';
        let audioUrl = '';
        if (dictData && dictData[0]) {
            phoneticText = dictData[0].phonetic || '';
            const audioObj = dictData[0].phonetics.find(p => p.audio && p.audio.length > 0);
            if (audioObj) {
                audioUrl = audioObj.audio;
            }
            if (!phoneticText) {
                const textPhonetic = dictData[0].phonetics.find(p => p.text && p.text.length > 0);
                if (textPhonetic) phoneticText = textPhonetic.text;
            }
        }

        html += `
            <div class="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div class="flex flex-col text-right">
                    <span class="text-[10px] font-black text-gray-400">معنی ثبت شده:</span>
                    <span class="text-lg font-black text-gray-800">${utils.escapeHTML(localTranslation)}</span>
                    ${phoneticText ? `<span class="text-xs text-blue-600 font-bold mt-1" dir="ltr">${utils.escapeHTML(phoneticText)}</span>` : ''}
                </div>
                ${audioUrl ? `
                    <button onclick="new Audio('${audioUrl}').play()" class="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all border border-blue-100">
                        <i class="fas fa-volume-up text-lg"></i>
                    </button>` : `
                    <button onclick="app.speakAny('${utils.escapeHTML(wordText)}')" class="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center active:scale-90 transition-all border border-gray-100">
                        <i class="fas fa-volume-up text-lg"></i>
                    </button>
                `}
            </div>`;

        // Conjugations Card
        if (verbConjugations) {
            html += `
                <div class="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
                    <div class="flex justify-between items-center pb-2 border-b border-gray-50">
                        <span class="text-[10px] font-black text-gray-400">زمان‌های فعل (Verb Conjugations)</span>
                        <span class="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-600">${verbConjugations.type}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-center">
                        <div class="bg-gray-50 p-3 rounded-2xl border border-gray-200/50">
                            <span class="text-[9px] font-black text-gray-400 block mb-1">گذشته ساده (Past Simple)</span>
                            <span class="font-black text-sm text-gray-800" dir="ltr">${utils.escapeHTML(verbConjugations.past)}</span>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-2xl border border-gray-200/50">
                            <span class="text-[9px] font-black text-gray-400 block mb-1">اسم مفعول (Past Participle)</span>
                            <span class="font-black text-sm text-gray-800" dir="ltr">${utils.escapeHTML(verbConjugations.pp)}</span>
                        </div>
                    </div>
                </div>`;
        }

        // Dictionary Meanings & Definitions Card
        if (dictData && dictData[0]?.meanings) {
            dictData[0].meanings.forEach(m => {
                const pos = m.partOfSpeech;
                const faPos = utils.translatePOS(pos);
                const defs = m.definitions.slice(0, 3).map((d, index) => `
                    <div class="text-right flex flex-col gap-0.5 border-b border-gray-50 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                        <div class="text-xs text-gray-800 font-bold text-left leading-relaxed" dir="ltr">
                            <span class="text-blue-500 font-black mr-1">${index + 1}.</span> ${utils.escapeHTML(d.definition)}
                        </div>
                        ${d.example ? `<div class="text-[11px] text-gray-400 italic text-left mt-0.5" dir="ltr">e.g. "${utils.escapeHTML(d.example)}"</div>` : ''}
                    </div>
                `).join('');

                html += `
                    <div class="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2">
                        <div class="text-[10px] font-black text-gray-400 uppercase mr-1">${faPos} (${pos})</div>
                        <div class="flex flex-col">${defs}</div>
                    </div>`;
            });
        }

        // If dictionary fetch failed and we have no verbConjugations
        if (dictError && !verbConjugations) {
            html += `
                <div class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                    <i class="fas fa-wifi text-gray-300 text-3xl mb-3"></i>
                    <p class="text-gray-500 font-bold text-sm">خطا در دریافت اطلاعات آنلاین</p>
                    <p class="text-gray-400 text-xs mt-1">امکان اتصال به سرور دیکشنری وجود ندارد یا کلمه یافت نشد.</p>
                    <button onclick="app.openWordExplorer('${utils.escapeHTML(wordText)}', '${utils.escapeHTML(localTranslation)}')" class="mt-4 text-xs font-black text-blue-500 underline">تلاش مجدد</button>
                </div>`;
        }

        document.getElementById('word-explorer-results').innerHTML = html;
    }
};
