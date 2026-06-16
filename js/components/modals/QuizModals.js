import { escapeHTML } from '../../utils.js';

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

export const QuizPickerWarningModal = () => `
    <div class="ios-modal p-8 text-center">
        <div class="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 class="text-xl font-black mb-2">انتخاب کلمه</h3>
        <p class="text-gray-500 mb-6 font-bold">لطفاً حداقل یک کلمه برای آزمون انتخاب کنید.</p>
        <button onclick="app.showQuizConfig()" class="w-full p-4 blue-sharp rounded-2xl font-black">متوجه شدم</button>
    </div>`;
