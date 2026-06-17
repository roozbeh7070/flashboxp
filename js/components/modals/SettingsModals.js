import { escapeHTML } from '../../utils.js';

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

            <div>
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
                    Software Version 1.2.5
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
