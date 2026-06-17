export const AlertModal = (message, title = 'پیام سیستم', type = 'info') => {
    let iconClass = 'fa-info-circle text-blue-500 bg-blue-50';
    if (type === 'error') {
        iconClass = 'fa-exclamation-triangle text-red-500 bg-red-50';
    } else if (type === 'success') {
        iconClass = 'fa-check-circle text-green-500 bg-green-50';
    }
    
    return `
    <div class="ios-modal p-8 text-center">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${iconClass.split(' ').slice(1).join(' ')}">
            <i class="fas ${iconClass.split(' ')[0]}"></i>
        </div>
        <h3 class="text-lg font-black mb-2 text-gray-900">${title}</h3>
        <p class="text-gray-500 mb-6 font-bold text-sm leading-relaxed">${message}</p>
        <button onclick="app.closeAlert()" class="w-full p-4 blue-sharp text-white rounded-2xl font-black shadow-md active:scale-95 transition-all">تایید</button>
    </div>`;
};
