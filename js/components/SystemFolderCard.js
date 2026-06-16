import { escapeHTML } from '../utils.js';

export const SystemFolderCard = (folder, index) => {
    let icon = 'fa-layer-group';
    let color = 'text-orange-500';
    if (folder.id === 222 || folder.id === 322) {
        icon = 'fa-check-circle';
        color = 'text-green-500';
    }
    if (folder.id === 111 || folder.id === 311) {
        icon = 'fa-bolt';
        color = 'text-red-500';
    }
    
    return `
        <div class="system-box" onclick="app.openFolder(${index})">
            <i class="fas ${icon} ${color}"></i>
            <div class="name">${escapeHTML(folder.name)}</div>
            <div class="count">${folder.words.length}</div>
        </div>`;
};
