import { escapeHTML, getUserDisplayName } from '../../utils.js';

export const SettingsModal = (user = null) => `
    <div class="ios-modal">
        <div class="modal-title-box !bg-[#303030]">تنظیمات برنامه</div>
        <div class="space-y-4">
            <div class="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <label class="text-xs font-black text-gray-400 uppercase mb-2 block mr-2">زبان در حال یادگیری:</label>
                <div id="target-lang-dropdown"></div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <button onclick="app.exportData()" class="p-4 bg-white text-gray-700 rounded-3xl font-black flex flex-col items-center justify-center gap-2 border border-gray-100 shadow-sm active:scale-95 transition-all">
                    <i class="fas fa-download text-2xl text-blue-500"></i>
                    <span class="text-xs">خروجی کلمات و عبارت‌ها</span>
                </button>
                <label class="p-4 bg-white text-gray-700 rounded-3xl font-black flex flex-col items-center justify-center gap-2 border border-gray-100 shadow-sm cursor-pointer active:scale-95 transition-all">
                    <i class="fas fa-upload text-2xl text-green-500"></i>
                    <span class="text-xs">لود کلمات و عبارت‌ها</span>
                    <input type="file" id="importFile" class="hidden" onchange="app.importData(event)">
                </label>
            </div>

            <!-- بارگذاری کلمات خودکار -->
            <div class="p-5 bg-purple-50 rounded-3xl border border-purple-100 shadow-sm space-y-3">
                <label class="text-xs font-black text-purple-600 uppercase block mr-1 text-right">بارگذاری کلمات خودکار:</label>
                <p class="text-[10px] text-purple-400 font-bold text-right leading-relaxed">کلمات طبقه‌بندی شده انگلیسی آکسفورد را به مجموعه‌های خود اضافه کنید.</p>
                <div class="flex gap-2">
                    <select id="auto-load-select-modal" class="flex-1 p-3 bg-white border border-purple-100 rounded-2xl font-bold text-xs text-right outline-none" dir="rtl">
                        <option value="b1-oxford">Oxford B1 (۸۰۲ کلمه)</option>
                        <option value="b2-oxford">Oxford B2 (۷۳۰ کلمه)</option>
                    </select>
                    <button onclick="app.loadPredefinedWords(true)" class="px-5 py-3 bg-purple-600 text-white rounded-2xl font-black text-xs active:scale-95 transition-all flex items-center gap-1.5">
                        <span>بارگذاری</span>
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>

            <div>
                ${user ? `
                <div class="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div class="flex flex-col text-right">
                        <span class="text-[10px] text-gray-400 font-black">کاربر فعال:</span>
                        <span class="text-xs font-black text-gray-800 truncate max-w-[180px]">${escapeHTML(getUserDisplayName(user))}</span>
                        <span class="text-[9px] text-gray-400 font-bold text-left" dir="ltr">${escapeHTML(user.email)}</span>
                    </div>
                    <button onclick="app.openSignOutModal()" class="px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl font-black text-xs active:scale-95 transition-all">خروج</button>
                </div>
                ` : `
                <button onclick="app.openAuthModal()" class="w-full p-5 bg-blue-50 text-blue-600 rounded-3xl font-black flex justify-between items-center border border-blue-100 active:scale-95 transition-all">
                    <span>ورود / عضویت (همگام‌سازی ابری)</span>
                    <i class="fas fa-user-circle text-2xl"></i>
                </button>
                `}
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
                    Software Version 1.3.7
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

export const PushPermissionModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i class="fas fa-bell fa-bounce"></i>
        </div>
        <h3 class="text-2xl font-black mb-2 text-gray-900">فعال‌سازی یادآور هوشمند</h3>
        <p class="text-gray-400 mb-8 font-bold leading-relaxed">با فعال‌سازی نوتیفیکیشن، به راحتی مرورهای روزانه و زمان مناسب مرور فلش‌کارت‌ها را روی گوشی خود دریافت کنید.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black">بعداً</button>
            <button onclick="app.requestPushPermission()" class="flex-1 p-5 bg-purple-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-transform">فعال‌سازی</button>
        </div>
    </div>`;

export const ConfirmLoadPredefinedModal = (val, label) => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i class="fas fa-download"></i>
        </div>
        <h3 class="text-xl font-black mb-2 text-gray-900">بارگذاری مجموعه واژگان</h3>
        <p class="text-gray-400 mb-8 font-bold leading-relaxed">آیا مایلید مجموعه کلمات "${label}" را بارگذاری کنید؟ این کلمات به لیست کارت‌های شما اضافه خواهند شد.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black">انصراف</button>
            <button onclick="app.executeLoadPredefinedWords('${val}')" class="flex-1 p-5 bg-purple-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-transform">بله، بارگذاری</button>
        </div>
    </div>`;

export const ConfirmSignOutModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i class="fas fa-sign-out-alt"></i>
        </div>
        <h3 class="text-xl font-black mb-2 text-gray-900">خروج از حساب کاربری</h3>
        <p class="text-gray-400 mb-8 font-bold leading-relaxed">آیا واقعاً می‌خواهید از حساب کاربری خود خارج شوید؟ همگام‌سازی ابری متوقف خواهد شد.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black">انصراف</button>
            <button onclick="app.executeSignOut()" class="flex-1 p-5 bg-orange-500 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-transform">بله، خروج</button>
        </div>
    </div>`;

export const ConfirmDeleteAccountModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i class="fas fa-trash-alt"></i>
        </div>
        <h3 class="text-xl font-black mb-2 text-gray-900">حذف کامل حساب کاربری</h3>
        <p class="text-gray-400 mb-8 font-bold leading-relaxed">آیا از حذف کامل حساب خود اطمینان دارید؟ با این کار تمامی مجموعه‌ها و کلمات شما به صورت دائمی از روی سرور حذف خواهند شد و این عمل غیرقابل بازگشت است.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black">انصراف</button>
            <button onclick="app.openDeleteAccountFinalModal()" class="flex-1 p-5 bg-red-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-transform">ادامه حذف</button>
        </div>
    </div>`;

export const ConfirmDeleteAccountFinalModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-red-200 text-red-700 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i class="fas fa-exclamation-triangle fa-flash"></i>
        </div>
        <h3 class="text-xl font-black mb-2 text-gray-900">تایید نهایی حذف حساب</h3>
        <p class="text-gray-400 mb-8 font-bold leading-relaxed">آیا واقعاً و قطعاً می‌خواهید کل داده‌ها و حساب کاربری خود را حذف کنید؟ این آخرین هشدار است.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black">انصراف</button>
            <button onclick="app.executeDeleteAccount()" class="flex-1 p-5 bg-red-700 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-transform">بله، حذف قطعی</button>
        </div>
    </div>`;

