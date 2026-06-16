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
