import { escapeHTML } from '../utils.js';

export const WordCard = (word, fullIndex, isPhraseMode = false, isSelected = false) => {
    let borderColor = 'border-l-[#303030]';
    if (word.failed) {
        borderColor = 'border-l-red-500';
    } else if (word.success) {
        borderColor = 'border-l-green-700';
    }

    const bgClass = isSelected ? 'selected-card' : '';

    if (isPhraseMode || word.isPhrase) {
        return `
            <div class="ios-card mb-3 p-4 flex flex-col gap-1 ${bgClass} border-l-8 ${borderColor} shadow-sm active:scale-[0.98] transition-all cursor-pointer text-right" onclick="app.handleWordClick(event, ${fullIndex}, ${word.id})">
                <span dir="ltr" class="font-black text-lg text-gray-900 text-left leading-snug break-words w-full block">${escapeHTML(word.eng)}</span>
                <span dir="rtl" class="font-bold text-sm text-gray-500 mt-1 break-words w-full block">${escapeHTML(word.per)}</span>
            </div>`;
    }

    return `
        <div class="ios-card mb-3 p-4 flex justify-between items-center ${bgClass} border-l-8 ${borderColor} shadow-sm active:scale-[0.98] transition-all cursor-pointer" dir="ltr" onclick="app.handleWordClick(event, ${fullIndex}, ${word.id})">
            <span dir="ltr" class="font-black text-xl text-gray-900 truncate pr-2">${escapeHTML(word.eng)}</span>
            <span dir="rtl" class="font-black text-lg text-gray-500 truncate pl-2">${escapeHTML(word.per)}</span>
        </div>`;
};
