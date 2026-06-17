import { escapeHTML } from '../utils.js';

export const SettingsPage = (user = null) => {
    return `
    <div class="space-y-4 font-black text-right">
        <!-- ۱. تنظیمات کلی -->
        <div id="section-general" class="settings-section-card open">
            <div class="settings-section-header" onclick="app.toggleSettingsSection('section-general')">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                        <i class="fas fa-sliders-h text-lg"></i>
                    </div>
                    <span class="text-sm font-black text-gray-800">تنظیمات کلی</span>
                </div>
                <i class="fas fa-chevron-down chevron text-xs"></i>
            </div>
            <div class="settings-section-content">
                <div class="p-5 space-y-4">
                    <div class="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <label class="text-xs font-black text-gray-400 uppercase mb-2 block mr-1">زبان در حال یادگیری:</label>
                        <div id="target-lang-dropdown"></div>
                    </div>
                    
                    <button onclick="app.factoryReset()" class="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-black flex justify-between items-center border border-red-100 active:scale-95 transition-all">
                        <span>بازگشت به تنظیمات کارخانه</span>
                        <i class="fas fa-trash-restore text-lg"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- ۲. پشتیبان گیری -->
        <div id="section-backup" class="settings-section-card">
            <div class="settings-section-header" onclick="app.toggleSettingsSection('section-backup')">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                        <i class="fas fa-hdd text-lg"></i>
                    </div>
                    <span class="text-sm font-black text-gray-800">پشتیبان‌گیری</span>
                </div>
                <i class="fas fa-chevron-down chevron text-xs"></i>
            </div>
            <div class="settings-section-content">
                <div class="p-5 space-y-3">
                    <button onclick="app.exportData()" class="w-full p-4 bg-white text-gray-700 rounded-2xl font-black flex justify-between items-center border border-gray-100 shadow-sm active:scale-95 transition-all">
                        <span>خروجی کلمات و عبارت‌ها (JSON)</span>
                        <i class="fas fa-download text-lg text-blue-500"></i>
                    </button>
                    
                    <label class="w-full p-4 bg-white text-gray-700 rounded-2xl font-black flex justify-between items-center border border-gray-100 shadow-sm cursor-pointer active:scale-95 transition-all block">
                        <span>لود کلمات و عبارت‌ها (JSON)</span>
                        <i class="fas fa-upload text-lg text-green-500"></i>
                        <input type="file" id="importFile" class="hidden" onchange="app.importData(event)">
                    </label>
                </div>
            </div>
        </div>

        <!-- ۳. حساب کاربری -->
        <div id="section-account" class="settings-section-card">
            <div class="settings-section-header" onclick="app.toggleSettingsSection('section-account')">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <i class="fas fa-user-shield text-lg"></i>
                    </div>
                    <span class="text-sm font-black text-gray-800">حساب کاربری</span>
                </div>
                <i class="fas fa-chevron-down chevron text-xs"></i>
            </div>
            <div class="settings-section-content">
                <div class="p-5 space-y-4">
                    ${!user ? `
                    <div class="text-center py-2 space-y-3">
                        <p class="text-xs font-bold text-gray-500 leading-relaxed">برای همگام‌سازی ابری اطلاعات و دسترسی از سایر دستگاه‌ها، وارد حساب کاربری خود شوید.</p>
                        <button onclick="app.openAuthModal('signin')" class="w-full p-4 bg-blue-50 text-blue-600 rounded-2xl font-black flex justify-between items-center border border-blue-100 active:scale-95 transition-all">
                            <span>ورود به حساب کاربری</span>
                            <i class="fas fa-sign-in-alt text-lg"></i>
                        </button>
                        <button onclick="app.openAuthModal('signup')" class="w-full p-4 bg-white text-orange-500 rounded-2xl font-black flex justify-between items-center border border-orange-100 active:scale-95 transition-all">
                            <span>ثبت‌نام و ایجاد حساب جدید</span>
                            <i class="fas fa-user-plus text-lg"></i>
                        </button>
                    </div>
                    ` : `
                    <div class="space-y-4">
                        <div class="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col text-right">
                            <span class="text-[10px] text-gray-400 font-black">حساب فعال (همگام‌سازی شده):</span>
                            <span class="text-xs font-black text-blue-800 truncate text-left" dir="ltr">${escapeHTML(user.email)}</span>
                        </div>
                        
                        <!-- ویرایش ایمیل -->
                        <form id="edit-email-form" onsubmit="app.handleUpdateEmail(event)" class="space-y-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div class="settings-input-group">
                                <label class="text-xs font-black text-gray-400 mr-1">تغییر ایمیل:</label>
                                <input id="edit-email-input" type="email" placeholder="ایمیل جدید" value="${escapeHTML(user.email)}" required class="settings-input text-left" dir="ltr">
                            </div>
                            <button type="submit" class="w-full py-3 bg-[#303030] text-white rounded-xl font-black text-xs active:scale-95 transition-all">بروزرسانی ایمیل</button>
                        </form>

                        <!-- تغییر رمز عبور -->
                        <button type="button" onclick="app.openChangePasswordModal()" class="w-full py-4 px-5 bg-white text-gray-700 rounded-2xl font-black flex justify-between items-center border border-gray-100 shadow-sm active:scale-95 transition-all">
                            <span>تغییر رمز عبور</span>
                            <i class="fas fa-key text-lg text-amber-500"></i>
                        </button>

                        <div class="flex gap-3 pt-2">
                            <button onclick="app.handleSignOut()" class="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs active:scale-95 transition-all">خروج از حساب</button>
                            <button onclick="app.confirmDeleteAccount()" class="flex-1 py-4 bg-red-50 text-red-500 border border-red-100 rounded-2xl font-black text-xs active:scale-95 transition-all">حذف حساب</button>
                        </div>
                    </div>
                    `}
                </div>
            </div>
        </div>

        <!-- ۴. درباره ما -->
        <div id="section-about" class="settings-section-card">
            <div class="settings-section-header" onclick="app.toggleSettingsSection('section-about')">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                        <i class="fas fa-info-circle text-lg"></i>
                    </div>
                    <span class="text-sm font-black text-gray-800">درباره ما</span>
                </div>
                <i class="fas fa-chevron-down chevron text-xs"></i>
            </div>
            <div class="settings-section-content">
                <div class="p-5 space-y-4">
                    <div class="p-3 bg-gray-100 text-gray-400 rounded-2xl text-center font-black text-[10px] tracking-widest uppercase">
                        Software Version 1.2.5
                    </div>
                    
                    <a href="https://boxp.ir" target="_blank" class="w-full p-5 bg-orange-500 text-white rounded-2xl font-black flex justify-center items-center gap-2 shadow-md active:scale-[0.98] transition-all no-underline">
                        <span class="text-xs">توسعه یافته توسط پلتفرم جعبه (باکسپی)</span>
                    </a>

                    <button onclick="app.manualUpdateCheck(this)" class="w-full p-4 bg-blue-50 text-blue-600 rounded-2xl font-black flex justify-between items-center border border-blue-100 active:scale-95 transition-all">
                        <span>بروزرسانی برنامه</span>
                        <i class="fas fa-sync-alt text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>`;
};
