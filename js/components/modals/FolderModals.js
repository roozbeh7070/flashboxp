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

export const EditFolderModal = (currentName) => `
    <div class="ios-modal">
        <div class="modal-title-box">ویرایش نام مجموعه</div>
        <div class="space-y-6">
            <input id="edit-folder-name-input" type="text" value="${currentName}" placeholder="نام جدید مجموعه" class="w-full p-5 bg-gray-100 rounded-2xl text-center font-black text-lg outline-none border-2 border-transparent focus:border-blue-500 transition-all">
            <div class="flex gap-3">
                <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black">لغو</button>
                <button onclick="app.renameFolder()" class="flex-1 p-5 blue-sharp rounded-2xl font-black shadow-xl active:scale-95 transition-transform">بروزرسانی</button>
            </div>
        </div>
    </div>`;
