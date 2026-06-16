import { escapeHTML } from '../utils.js';

export const FolderModal = () => `
    <div class="ios-modal">
        <div class="modal-title-box">ایجاد مجموعه</div>
        <div class="space-y-6">
            <input id="folder-name-input" type="text" placeholder="نام مجموعه" class="w-full p-5 bg-gray-100 rounded-2xl text-center font-black text-lg outline-none border-2 border-transparent focus:border-blue-500 transition-all">
            <div class="flex gap-3">
                <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black">لغو</button>
                <button onclick="app.createFolder()" class="flex-1 p-5 blue-sharp rounded-2xl font-black shadow-xl active:scale-95 transition-transform">تایید</button>
            </div>
        </div>
    </div>`;

export const ConfirmDeleteFolderModal = () => `
    <div class="ios-modal p-8 text-center">
        <h3 class="text-2xl font-black mb-4 text-gray-900">حذف کل مجموعه؟</h3>
        <p class="text-red-500 font-black mb-8 leading-relaxed">تمام محتویات برای همیشه پاک می‌شوند.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black">لغو</button>
            <button onclick="app.executeDeleteFolder()" class="flex-1 p-5 bg-red-600 text-white rounded-2xl font-black shadow-lg">حذف قطعی</button>
        </div>
    </div>`;

export const WordDetailsModal = (word) => `
    <div class="ios-modal p-0 overflow-hidden relative" style="width: 320px; height: 320px;">
        <div class="absolute top-4 left-4 flex gap-2 z-10" dir="ltr">
            <button onclick="app.closeModal(); app.openEditModal(${word.id})" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-orange-500 flex items-center justify-center active:scale-90 transition-all">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="app.resetWordStatus(${word.id})" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-green-500 flex items-center justify-center active:scale-90 transition-all">
                <i class="fas fa-sync-alt"></i>
            </button>
            <button onclick="app.closeModal(); app.openDeleteWordModal(${word.id})" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-red-500 flex items-center justify-center active:scale-90 transition-all">
                <i class="fas fa-trash-alt"></i>
            </button>
            <button onclick="app.speakAny(event.currentTarget.getAttribute('data-text'))" data-text="${escapeHTML(word.eng)}" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-blue-500 flex items-center justify-center active:scale-90 transition-all">
                <i class="fas fa-volume-up"></i>
            </button>
        </div>
        
        <button onclick="app.closeModal()" class="absolute top-4 right-4 w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-gray-300 flex items-center justify-center active:scale-90 transition-all">
            <i class="fas fa-times"></i>
        </button>

        <div class="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-white">
            <h2 dir="ltr" class="text-4xl font-black text-gray-900 mb-8">${escapeHTML(word.eng)}</h2>
            <p dir="rtl" class="text-2xl font-bold text-gray-500">${escapeHTML(word.per)}</p>
        </div>
    </div>`;

export const EditWordModal = (word) => `
    <div class="ios-modal">
        <div class="modal-title-box">ویرایش کلمه</div>
        <div class="space-y-4">
            <input id="edit-eng" type="text" value="${escapeHTML(word.eng)}" dir="ltr" class="w-full p-4 bg-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-orange-500 transition-all">
            <input id="edit-per" type="text" value="${escapeHTML(word.per)}" class="w-full p-4 bg-gray-100 rounded-2xl font-black text-right outline-none border-2 border-transparent focus:border-orange-500 transition-all">
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
    </div>`;

export const DeleteWordModal = (id) => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fas fa-trash-alt"></i></div>
        <h3 class="text-2xl font-black mb-2 text-gray-900 text-center">حذف کلمه؟</h3>
        <p class="text-gray-400 mb-8 font-bold">این عمل غیرقابل بازگشت است.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black text-center">انصراف</button>
            <button onclick="app.deleteWord(${id})" class="flex-1 p-5 bg-red-500 text-white rounded-2xl font-black shadow-lg">بله، حذف</button>
        </div>
    </div>`;

export const QuizConfigModal = (words) => `
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
                            ${words.map((w, i) => `
                                <label class="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" class="word-quiz-check w-5 h-5 accent-blue-600" value="${i}" checked>
                                        <span class="font-bold text-sm text-gray-700" dir="ltr">${escapeHTML(w.eng)}</span>
                                    </div>
                                    <span class="text-xs text-gray-400 font-bold">${escapeHTML(w.per)}</span>
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
    </div>`;

export const QuizFinishedModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fas fa-check-circle"></i></div>
        <h3 class="text-2xl font-black mb-2 text-gray-900">پایان آزمون</h3>
        <p class="text-gray-400 mb-8 font-bold">آیا مایلید آزمون را مجدداً تکرار کنید؟</p>
        <div class="flex gap-3">
            <button onclick="app.closeScreen('quiz-screen');app.closeModal();" class="flex-1 p-4 bg-gray-100 text-gray-600 rounded-2xl font-black">پایان</button>
            <button onclick="app.restartQuiz();app.closeModal();" class="flex-1 p-5 blue-sharp rounded-2xl font-black shadow-lg">آزمون مجدد</button>
        </div>
    </div>`;

export const GlobalSearchModal = () => `
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
    </div>`;

export const SettingsModal = (user = null) => `
    <div class="ios-modal">
        <div class="modal-title-box !bg-[#303030]">تنظیمات برنامه</div>
        <div class="space-y-4">
            <div class="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <label class="text-xs font-black text-gray-400 uppercase mb-2 block mr-2">زبان در حال یادگیری:</label>
                <div id="target-lang-dropdown"></div>
            </div>

            ${user ? `
            <div class="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div class="flex flex-col text-right">
                    <span class="text-[10px] text-gray-400 font-black">حساب فعال (همگام‌سازی شده):</span>
                    <span class="text-xs font-black text-gray-800 truncate max-w-[180px]" dir="ltr">${escapeHTML(user.email)}</span>
                </div>
                <button onclick="app.handleSignOut()" class="px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl font-black text-xs active:scale-95 transition-all">خروج</button>
            </div>
            ` : `
            <button onclick="app.openAuthModal()" class="w-full p-5 bg-blue-50 text-blue-600 rounded-3xl font-black flex justify-between items-center border border-blue-100 active:scale-95 transition-all">
                <span>ورود / عضویت (همگام‌سازی ابری)</span>
                <i class="fas fa-user-circle text-2xl"></i>
            </button>
            `}

            <div class="grid grid-cols-2 gap-3 mb-2">
                <button onclick="app.exportData()" class="p-4 bg-white text-gray-700 rounded-3xl font-black flex flex-col items-center justify-center gap-2 border border-gray-100 shadow-sm active:scale-95 transition-all">
                    <i class="fas fa-download text-2xl text-blue-500"></i>
                    <span class="text-sm">خروجی کلمات</span>
                </button>
                <label class="p-4 bg-white text-gray-700 rounded-3xl font-black flex flex-col items-center justify-center gap-2 border border-gray-100 shadow-sm cursor-pointer active:scale-95 transition-all">
                    <i class="fas fa-upload text-2xl text-green-500"></i>
                    <span class="text-sm">لود کلمات</span>
                    <input type="file" id="importFile" class="hidden" onchange="app.importData(event)">
                </label>
            </div>
            <button onclick="app.manualUpdateCheck(this)" class="w-full p-6 bg-blue-50 text-blue-600 rounded-3xl font-black flex justify-between items-center border border-blue-100 active:scale-95 transition-all">
                <span>بروزرسانی</span>
                <i class="fas fa-sync-alt text-2xl"></i>
            </button>
            <button onclick="app.factoryReset()" class="w-full p-6 bg-red-50 text-red-600 rounded-3xl font-black flex justify-between items-center border border-red-100 active:scale-95 transition-all">
                <span>بازگشت به تنظیمات کارخانه</span>
                <i class="fas fa-trash-restore text-2xl"></i>
            </button>
            <div class="space-y-2 pt-2">
                <div class="p-3 bg-gray-50 text-gray-400 rounded-2xl text-center font-black text-[10px] tracking-widest uppercase">
                    Software Version 1.2.3
                </div>
                <a href="https://boxp.ir" target="_blank" class="w-full p-5 bg-orange-500 text-white rounded-3xl font-black flex justify-center items-center gap-2 shadow-lg active:scale-[0.98] transition-all no-underline">
                    <span class="text-xs">توسعه یافته توسط پلتفرم جعبه (باکسپی)</span>
                </a>
            </div>
            <div class="pt-2">
                <button onclick="app.closeModal()" class="w-full p-4 bg-gray-100 text-gray-600 rounded-2xl font-black">بستن</button>
            </div>
        </div>
    </div>`;

export const AuthModal = (mode = 'signin') => `
    <div class="ios-modal">
        <div class="modal-title-box">${mode === 'signin' ? 'ورود به حساب' : 'ساخت حساب کاربری'}</div>
        <form id="auth-form" onsubmit="app.handleAuthSubmit(event, '${mode}')" class="space-y-4">
            <input id="auth-email" type="email" placeholder="ایمیل" required class="w-full p-4 bg-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-blue-500 transition-all text-right">
            <input id="auth-password" type="password" placeholder="کلمه عبور (حداقل ۶ کاراکتر)" required minlength="6" class="w-full p-4 bg-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-blue-500 transition-all text-right">
            
            <button type="submit" class="w-full p-5 blue-sharp rounded-2xl font-black shadow-xl active:scale-95 transition-all">
                ${mode === 'signin' ? 'ورود' : 'ثبت‌نام'}
            </button>
        </form>

        <div class="mt-4 flex flex-col gap-3 text-center">
            <button onclick="app.handleGoogleSignIn()" class="w-full p-4 bg-white text-gray-700 rounded-2xl font-black flex items-center justify-center gap-2 border border-gray-100 shadow-sm active:scale-95 transition-all">
                <i class="fab fa-google text-red-500 text-lg"></i>
                <span>ورود با گوگل</span>
            </button>

            <button onclick="app.openAuthModal('${mode === 'signin' ? 'signup' : 'signin'}')" class="text-xs text-blue-500 font-black underline">
                ${mode === 'signin' ? 'حساب کاربری ندارید؟ ثبت‌نام کنید' : 'قبلاً ثبت‌نام کرده‌اید؟ وارد شوید'}
            </button>
            
            <button onclick="app.closeModal()" class="text-xs text-gray-400 font-bold">انصراف</button>
        </div>
    </div>`;

export const UpdatePromptModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i class="fas fa-rocket fa-bounce"></i>
        </div>
        <h3 class="text-2xl font-black mb-2 text-gray-900">نسخه جدید پیدا شد!</h3>
        <p class="text-gray-400 mb-8 font-bold leading-relaxed">تغییرات جدید و بهبودهای ظاهری آماده دریافت هستند. آیا می‌خواهید الان بروزرسانی کنید؟</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black">بعداً</button>
            <button onclick="app.hotReload()" class="flex-1 p-5 blue-sharp rounded-2xl font-black shadow-xl active:scale-95 transition-transform">بروزرسانی آنی</button>
        </div>
    </div>`;

export const HotReloadModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i class="fas fa-sync-alt fa-spin"></i>
        </div>
        <h3 class="text-2xl font-black mb-2 text-gray-900">در حال بروزرسانی...</h3>
        <p class="text-gray-400 mb-8 font-bold">در حال دریافت آخرین نسخه و پاکسازی حافظه موقت...</p>
    </div>`;

export const FactoryResetModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 class="text-2xl font-black mb-2 text-gray-900">حذف کامل اطلاعات؟</h3>
        <p class="text-gray-400 mb-8 font-bold leading-relaxed">آیا از پاکسازی تمام اطلاعات اطمینان دارید؟<br>این عمل غیرقابل بازگشت است.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-gray-600 rounded-2xl font-black">انصراف</button>
            <button onclick="app.executeFactoryReset()" class="flex-1 p-5 bg-red-500 text-white rounded-2xl font-black shadow-lg">بله، پاکسازی</button>
        </div>
    </div>`;

export const ImportOptionsModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-file-import"></i></div>
        <h3 class="text-xl font-black mb-2">لود کلمات</h3>
        <p class="text-gray-500 mb-6 font-bold text-sm leading-relaxed">چگونه می‌خواهید کلمات لود شوند؟</p>
        <div class="flex flex-col gap-3">
            <button onclick="app.processImport('replace')" class="p-4 blue-sharp rounded-2xl font-black">جایگزین کامل (حذف قبلی)</button>
            <button onclick="app.processImport('merge')" class="p-4 bg-green-500 text-white rounded-2xl font-black">افزودن به موارد قبلی (ادغام)</button>
            <button onclick="app.closeModal()" class="p-4 bg-gray-100 text-gray-500 rounded-2xl font-black">انصراف</button>
        </div>
    </div>`;

export const ExploreWordModal = (word) => `
    <div class="ios-modal p-6 max-h-[85vh] flex flex-col">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-black text-gray-900">کاوش کلمه: ${escapeHTML(word)}</h3>
            <button onclick="app.closeModal()" class="text-gray-400"><i class="fas fa-times-circle text-2xl"></i></button>
        </div>
        <div id="explore-results" class="overflow-y-auto flex-1 space-y-4 pr-1">
            <div class="flex justify-center items-center py-10">
                <i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
            </div>
        </div>
    </div>`;

export const ExploreEmptyWordWarningModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-search"></i></div>
        <h3 class="text-xl font-black mb-2">جستجوی پیشرفته</h3>
        <p class="text-gray-500 mb-6 font-bold">ابتدا کلمه را وارد کنید.</p>
        <button onclick="app.closeModal()" class="w-full p-4 blue-sharp rounded-2xl font-black">متوجه شدم</button>
    </div>`;

export const QuizPickerWarningModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 class="text-xl font-black mb-2">انتخاب کلمه</h3>
        <p class="text-gray-500 mb-6 font-bold">لطفاً حداقل یک کلمه برای آزمون انتخاب کنید.</p>
        <button onclick="app.showQuizConfig()" class="w-full p-4 blue-sharp rounded-2xl font-black">متوجه شدم</button>
    </div>`;

export const DuplicateWarningModal = (eng, foundIn) => `
    <div class="ios-modal p-8 text-center">
        <div class="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 class="text-xl font-black mb-2">کلمه تکراری</h3>
        <p class="text-gray-500 mb-6 font-bold text-sm leading-relaxed">کلمه "${escapeHTML(eng)}" قبلاً در مجموعه <span class="text-orange-600">"${escapeHTML(foundIn)}"</span> ذخیره شده است.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-red-500 rounded-2xl font-black">بازگشت</button>
            <button onclick="app.addWord();app.closeModal();" class="flex-1 p-4 blue-sharp rounded-2xl font-black">ذخیره در هر صورت</button>
        </div>
    </div>`;
