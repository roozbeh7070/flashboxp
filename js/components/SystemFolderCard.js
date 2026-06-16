import { escapeHTML } from '../utils.js';

export const SystemFolderCard = (folder, index) => {
    let icon = 'fa-layer-group';
    let color = 'text-orange-500';
    if (folder.id === 222) icon = 'fa-check-circle';
    if (folder.id === 111) icon = 'fa-bolt';
    
    return `
        <div class="system-box" onclick="app.openFolder(${index})">
            <i class="fas ${icon} ${color}"></i>
            <div class="name">${escapeHTML(folder.name)}</div>
            <div class="count">${folder.words.length}</div>
        </div>`;
};
