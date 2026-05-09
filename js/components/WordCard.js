export const WordCard = (word, fullIndex) => {
    let borderColor = 'border-l-[#303030]';
    if (word.failed) {
        borderColor = 'border-l-red-500';
    } else if (word.success) {
        borderColor = 'border-l-green-700';
    }

    return `
        <div class="ios-card mb-3 p-4 flex justify-between items-center bg-white border-l-8 ${borderColor} shadow-sm active:scale-[0.98] transition-all cursor-pointer" dir="ltr" onclick="app.openWordDetailsModal(${fullIndex})">
            <span dir="ltr" class="font-black text-xl text-gray-900">${word.eng}</span>
            <span dir="rtl" class="font-black text-lg text-gray-500">${word.per}</span>
        </div>`;
};
