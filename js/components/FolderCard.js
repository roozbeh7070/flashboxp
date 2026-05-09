export const FolderCard = (folder, index) => {
    let iconStyle = 'color: #f97316;'; // orange-500
    if (folder.isSystem) {
        if (folder.id === 0) iconStyle = 'color: #f97316;'; // orange-500
        else if (folder.id === 222) iconStyle = 'color: #22c55e;'; // green-500
        else if (folder.id === 111) iconStyle = 'color: #ef4444;'; // red-500
    }

    return `
        <div class="ios-card mb-3 p-3 flex justify-between items-center active:bg-gray-50 transition-colors cursor-pointer" onclick="app.openFolder(${index})">
            <div class="flex items-center">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center ml-4" style="${iconStyle}">
                    <i class="fas ${folder.isSystem ? (folder.id === 0 ? 'fa-layer-group' : (folder.id === 222 ? 'fa-check-circle' : 'fa-bolt')) : 'fa-folder'} text-2xl"></i>
                </div>
                <div>
                    <div class="font-black text-xl text-gray-900">${folder.name}</div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="bg-gray-200 text-gray-500 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs">${folder.words.length}</div>
                <i class="fas fa-chevron-left text-gray-300 text-lg"></i>
            </div>
        </div>`;
};
