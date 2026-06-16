export const AuthModal = (mode = 'signin') => `
    <div class="ios-modal">
        <div class="modal-title-box">${mode === 'signin' ? 'ورود به حساب' : 'ساخت حساب کاربری'}</div>
        <form id="auth-form" onsubmit="app.handleAuthSubmit(event, '${mode}')" class="space-y-4">
            <input id="auth-email" type="email" placeholder="ایمیل" required class="w-full p-4 bg-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-blue-500 transition-all text-right">
            <input id="auth-password" type="password" placeholder="کلمه عبور (حداقل ۶ کاراکتر)" required minlength="6" class="w-full p-4 bg-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-blue-500 transition-all text-right">
            
            ${mode === 'signup' ? `
            <input id="auth-confirm-password" type="password" placeholder="تکرار کلمه عبور" required minlength="6" class="w-full p-4 bg-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-blue-500 transition-all text-right">
            <input id="auth-phone" type="tel" placeholder="شماره همراه (مثال: 09123456789)" required class="w-full p-4 bg-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-blue-500 transition-all text-right">
            ` : ''}

            <button type="submit" class="w-full p-5 blue-sharp rounded-2xl font-black shadow-xl active:scale-95 transition-all">
                ${mode === 'signin' ? 'ورود' : 'ثبت‌نام و عضویت'}
            </button>
        </form>

        <div class="mt-4 flex flex-col gap-3 text-center">
            ${mode === 'signin' ? `
            <button onclick="app.openAuthModal('signup')" class="w-full p-4 bg-white text-blue-600 rounded-2xl font-black flex items-center justify-center gap-2 border border-blue-100 shadow-sm active:scale-95 transition-all">
                <i class="fas fa-user-plus text-lg"></i>
                <span>ایجاد حساب کاربری جدید (ثبت‌نام)</span>
            </button>
            ` : `
            <button onclick="app.openAuthModal('signin')" class="w-full p-4 bg-white text-gray-600 rounded-2xl font-black flex items-center justify-center gap-2 border border-gray-100 shadow-sm active:scale-95 transition-all">
                <i class="fas fa-sign-in-alt text-lg"></i>
                <span>قبلاً ثبت‌نام کرده‌اید؟ وارد شوید</span>
            </button>
            `}
            
            <button onclick="app.closeModal()" class="text-xs text-gray-400 font-bold mt-2">انصراف</button>
        </div>
    </div>`;
