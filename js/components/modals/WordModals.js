import { escapeHTML } from '../../utils.js';

export const WordDetailsModal = (word) => `
    <div class="ios-modal p-0 overflow-hidden relative" style="width: 320px; min-height: 340px; display: flex; flex-col: column;">
        <div class="absolute top-4 left-4 flex gap-2 z-10" dir="ltr">
            <button onclick="app.closeModal(); app.openEditModal(${word.id})" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-orange-500 flex items-center justify-center active:scale-90 transition-all">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="app.closeModal(); app.openDeleteWordModal(${word.id})" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-red-500 flex items-center justify-center active:scale-90 transition-all">
                <i class="fas fa-trash-alt"></i>
            </button>
            <button onclick="app.speakAny(this.getAttribute('data-text'))" data-text="${escapeHTML(word.eng)}" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-blue-500 flex items-center justify-center active:scale-90 transition-all">
                <i class="fas fa-volume-up"></i>
            </button>
        </div>
        
        <button onclick="app.closeModal()" class="absolute top-4 right-4 w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl text-gray-300 flex items-center justify-center active:scale-90 transition-all">
            <i class="fas fa-times"></i>
        </button>

        <div class="w-full flex-1 flex flex-col items-center justify-center text-center p-8 pt-16 pb-6 bg-white">
            <h2 dir="ltr" class="text-4xl font-black text-gray-900 mb-4">${escapeHTML(word.eng)}</h2>
            <p dir="rtl" class="text-2xl font-bold text-gray-500 ${word.isPhrase ? '' : 'mb-6'}">${escapeHTML(word.per)}</p>
            ${(word.isPhrase || (window.app && window.app.data && window.app.data.settings && window.app.data.settings.targetLang !== 'en')) ? '' : `
            <button onclick="app.openWordExplorer('${escapeHTML(word.eng)}', '${escapeHTML(word.per)}')" class="px-5 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm border border-blue-100">
                <i class="fas fa-info-circle"></i>
                <span>اطلاعات بیشتر</span>
            </button>
            `}
        </div>
    </div>`;

export const EditWordModal = (word) => {
    const isPhrase = word.isPhrase;
    return `
    <div class="ios-modal">
        <div class="modal-title-box">${isPhrase ? 'ویرایش عبارت' : 'ویرایش کلمه'}</div>
        <div class="space-y-4">
            <div class="relative w-full">
                <input id="edit-eng" type="text" oninput="app.checkGrammarDebounced('edit-eng')" value="${escapeHTML(word.eng)}" dir="ltr" class="w-full p-4 pr-12 bg-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-orange-500 transition-all">
                <div class="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button id="edit-eng-grammar-btn" class="hidden w-10 h-10 text-red-500 flex items-center justify-center animate-pulse"><i class="fas fa-exclamation-circle text-lg"></i></button>
                </div>
            </div>
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
};

export const DeleteWordModal = (id) => {
    const source = window.app && window.app.findWordById(id);
    const isPhrase = source && source.word && source.word.isPhrase;
    return `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fas fa-trash-alt"></i></div>
        <h3 class="text-2xl font-black mb-2 text-gray-900 text-center">${isPhrase ? 'حذف عبارت؟' : 'حذف کلمه؟'}</h3>
        <p class="text-gray-400 mb-8 font-bold">این عمل غیرقابل بازگشت است.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black text-center">انصراف</button>
            <button onclick="app.deleteWord(${id})" class="flex-1 p-5 bg-red-500 text-white rounded-2xl font-black shadow-lg">بله، حذف</button>
        </div>
    </div>`;
};

export const DuplicateWarningModal = (eng, foundIn) => {
    const isPhrase = window.app && window.app.currentMode === 'phrase';
    return `
    <div class="ios-modal p-8 text-center">
        <div class="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 class="text-xl font-black mb-2">${isPhrase ? 'عبارت تکراری' : 'کلمه تکراری'}</h3>
        <p class="text-gray-500 mb-6 font-bold text-sm leading-relaxed">${isPhrase ? 'عبارت' : 'کلمه'} "${escapeHTML(eng)}" قبلاً در مجموعه <span class="text-orange-600">"${escapeHTML(foundIn)}"</span> ذخیره شده است.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 bg-gray-100 text-red-500 rounded-2xl font-black">بازگشت</button>
            <button onclick="app.addWord();app.closeModal();" class="flex-1 p-4 blue-sharp rounded-2xl font-black">ذخیره در هر صورت</button>
        </div>
    </div>`;
};

export const ExploreWordModal = (word) => {
    const isPhrase = window.app && window.app.currentMode === 'phrase';
    return `
    <div class="ios-modal p-6 max-h-[85vh] flex flex-col">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-black text-gray-900">${isPhrase ? 'کاوش عبارت:' : 'کاوش کلمه:'} ${escapeHTML(word)}</h3>
            <button onclick="app.closeModal()" class="text-gray-400"><i class="fas fa-times-circle text-2xl"></i></button>
        </div>
        <div id="explore-results" class="overflow-y-auto flex-1 space-y-4 pr-1">
            <div class="flex justify-center items-center py-10">
                <i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
            </div>
        </div>
    </div>`;
};

export const ExploreEmptyWordWarningModal = () => {
    const isPhrase = window.app && window.app.currentMode === 'phrase';
    return `
    <div class="ios-modal p-8 text-center">
        <div class="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-search"></i></div>
        <h3 class="text-xl font-black mb-2">جستجوی پیشرفته</h3>
        <p class="text-gray-500 mb-6 font-bold">ابتدا ${isPhrase ? 'عبارت' : 'کلمه'} را وارد کنید.</p>
        <button onclick="app.closeModal()" class="w-full p-4 blue-sharp rounded-2xl font-black">متوجه شدم</button>
    </div>`;
};

export const WordExplorerModal = (wordText) => `
    <div class="ios-modal p-6 max-h-[85vh] flex flex-col !bg-[#ededed] text-right" style="width: 95%; max-w: 480px;">
        <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
            <div class="flex flex-col text-right">
                <span class="text-[10px] font-black text-gray-400">کارت جامع کلمه</span>
                <h3 class="text-lg font-black text-gray-900" dir="ltr">${escapeHTML(wordText)}</h3>
            </div>
            <button onclick="app.closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors"><i class="fas fa-times-circle text-2xl"></i></button>
        </div>
        <div id="word-explorer-results" class="overflow-y-auto flex-1 space-y-4 pr-1">
            <div class="flex flex-col justify-center items-center py-20">
                <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                <span class="text-gray-500 font-bold text-xs">در حال دریافت اطلاعات آنلاین...</span>
            </div>
        </div>
    </div>`;

export const BulkDeleteWordModal = (count) => `
    <div class="ios-modal p-8 text-center">
        <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fas fa-trash-alt"></i></div>
        <h3 class="text-2xl font-black mb-2 text-gray-900 text-center">حذف گروهی؟</h3>
        <p class="text-gray-400 mb-8 font-bold leading-relaxed">آیا از حذف ${count} آیتم انتخاب شده اطمینان دارید؟<br>این عمل غیرقابل بازگشت است.</p>
        <div class="flex gap-3">
            <button onclick="app.closeModal()" class="flex-1 p-4 text-red-500 font-black text-center">انصراف</button>
            <button onclick="app.executeBulkDelete()" class="flex-1 p-5 bg-red-500 text-white rounded-2xl font-black shadow-lg">بله، حذف همه</button>
        </div>
    </div>`;

export const BulkMoveWordModal = (count) => `
    <div class="ios-modal">
        <div class="modal-title-box">انتقال گروهی ${count} آیتم</div>
        <div class="space-y-4">
            <div class="flex flex-col gap-2">
                <label class="text-xs font-black mr-2 text-gray-400 uppercase">مجموعه مقصد:</label>
                <div id="bulk-folder-dest-dropdown"></div>
            </div>
            <div class="flex gap-3 mt-6">
                <button onclick="app.closeModal()" class="flex-[1] p-4 text-red-500 font-black">لغو</button>
                <button onclick="app.executeBulkMove()" class="flex-[1] p-5 blue-sharp rounded-2xl font-black shadow-xl">انتقال</button>
            </div>
        </div>
    </div>`;

export const IdiomaticTranslationModal = (alternatives) => {
    const listHtml = alternatives.map(t => `
        <button onclick="app.selectIdiomaticTranslation('${escapeHTML(t)}')" class="w-full text-right p-4 bg-gray-50 active:bg-gray-100 hover:bg-gray-100 rounded-2xl border border-gray-200/50 flex justify-between items-center transition-all">
            <span class="font-bold text-gray-800 text-[13px] leading-relaxed">${escapeHTML(t)}</span>
            <i class="fas fa-chevron-left text-gray-300"></i>
        </button>
    `).join('');

    return `
        <div class="ios-modal p-6 max-h-[80vh] flex flex-col text-right" style="width: 95%; max-w: 420px;">
            <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                <div class="flex flex-col text-right">
                    <span class="text-[10px] font-black text-gray-400">انتخاب ترجمه روان</span>
                    <h3 class="text-base font-black text-gray-900">چند ترجمه مناسب یافت شد:</h3>
                </div>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors"><i class="fas fa-times-circle text-2xl"></i></button>
            </div>
            <div class="overflow-y-auto flex-1 space-y-2.5 pr-1">
                ${listHtml}
            </div>
        </div>`;
};
