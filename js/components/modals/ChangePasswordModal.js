export const ChangePasswordModal = () => `
    <div class="ios-modal">
        <div class="modal-title-box !bg-[#303030]">تغییر رمز عبور</div>
        <form id="edit-password-form" onsubmit="app.handleUpdatePassword(event)" class="space-y-4 text-right">
            <div class="settings-input-group">
                <label class="text-xs font-black text-gray-400 mr-1">رمز عبور فعلی:</label>
                <input id="old-password-input" type="password" required class="settings-input text-right">
            </div>
            <div class="settings-input-group">
                <label class="text-xs font-black text-gray-400 mr-1">رمز عبور جدید (حداقل ۶ کاراکتر):</label>
                <input id="new-password-input" type="password" required minlength="6" class="settings-input text-right">
            </div>
            <div class="settings-input-group">
                <label class="text-xs font-black text-gray-400 mr-1">تکرار رمز عبور جدید:</label>
                <input id="confirm-new-password-input" type="password" required minlength="6" class="settings-input text-right">
            </div>
            <div class="flex gap-3 pt-2">
                <button type="button" onclick="app.closeModal()" class="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs active:scale-95 transition-all">انصراف</button>
                <button type="submit" class="flex-1 py-4 blue-sharp text-white rounded-2xl font-black text-xs shadow-md active:scale-95 transition-all">بروزرسانی</button>
            </div>
        </form>
    </div>`;
