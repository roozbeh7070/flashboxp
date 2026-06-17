let deferredPrompt = null;

// Listen for the native PWA install prompt event
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // If prompt is currently showing, make the install button visible
    const actionBtn = document.getElementById('a2hs-action-btn');
    if (actionBtn) {
        actionBtn.classList.remove('hidden');
    }
});

/**
 * Checks if the app is running in standalone mode (already installed).
 */
export const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

/**
 * Checks if the device is iOS (iPhone, iPad, iPod).
 */
export const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Shows the Add to Home Screen (A2HS) installation prompt sheet.
 * @param {boolean} force - If true, ignores dismissal checks and shows status/guide.
 */
export const showA2HSPrompt = (force = false) => {
    const isInstalled = isStandalone();
    
    // If already installed and manually opened, show a message
    if (isInstalled && force) {
        if (typeof window.app?.showAlert === 'function') {
            window.app.showAlert('فلش باکس پی در حال حاضر روی دستگاه شما نصب شده است.', 'success');
        } else {
            alert('فلش باکس پی در حال حاضر روی دستگاه شما نصب شده است.');
        }
        return;
    }
    
    // If already installed, don't show automatically
    if (isInstalled) return;

    // Check dismissal history for automatic popup
    const dismissedKey = 'a2hs_prompt_dismissed_at';
    const now = Date.now();
    if (!force) {
        const dismissedAt = localStorage.getItem(dismissedKey);
        if (dismissedAt && (now - parseInt(dismissedAt, 10)) < 3 * 24 * 60 * 60 * 1000) {
            // Dismissed in the last 3 days, skip auto prompt
            return;
        }
    }

    // Create prompt DOM elements if they don't exist
    let overlay = document.getElementById('a2hs-overlay');
    let sheet = document.getElementById('a2hs-sheet');

    if (!overlay || !sheet) {
        // Remove old elements just in case
        if (overlay) overlay.remove();
        if (sheet) sheet.remove();

        const container = document.createElement('div');
        container.innerHTML = `
            <div id="a2hs-overlay" class="a2hs-overlay"></div>
            <div id="a2hs-sheet" class="a2hs-sheet">
                <div class="a2hs-header">
                    <img src="./doc/icon.png" alt="Logo" class="a2hs-logo" onerror="this.src='./doc/logo.png'">
                    <div class="flex-1">
                        <h4 class="a2hs-title">نصب وب‌اپلیکیشن فلش باکس پی</h4>
                        <p class="a2hs-subtitle">برای دسترسی سریع‌تر، آفلاین و بدون فیلتر، برنامه را به صفحه اصلی اضافه کنید.</p>
                    </div>
                </div>
                
                <div id="a2hs-content"></div>
                
                <div class="flex flex-col gap-2 pt-2">
                    <button id="a2hs-close-btn" class="a2hs-btn-primary">متوجه شدم</button>
                </div>
            </div>
        `;
        document.body.appendChild(container.firstElementChild);
        document.body.appendChild(container.firstElementChild);

        overlay = document.getElementById('a2hs-overlay');
        sheet = document.getElementById('a2hs-sheet');
    }

    const contentDiv = document.getElementById('a2hs-content');
    const closeBtn = document.getElementById('a2hs-close-btn');

    // Build platform-specific UI
    if (isIOS()) {
        // iOS Safari Flow
        contentDiv.innerHTML = `
            <div class="a2hs-steps">
                <div class="a2hs-step">
                    <div class="a2hs-step-icon">۱</div>
                    <div class="a2hs-step-desc">
                        در نوار پایین مرورگر سافاری روی دکمه **اشتراک‌گذاری (Share)** 
                        <i class="fa-solid fa-arrow-up-from-bracket text-blue-500 mx-1 text-sm"></i> ضربه بزنید.
                    </div>
                </div>
                <div class="a2hs-step">
                    <div class="a2hs-step-icon">۲</div>
                    <div class="a2hs-step-desc">
                        منوی باز شده را بالا بکشید و گزینه **افزودن به صفحه اصلی (Add to Home Screen)** 
                        <i class="fa-regular fa-square-plus text-gray-800 mx-1 text-sm"></i> را انتخاب کنید.
                    </div>
                </div>
                <div class="a2hs-step">
                    <div class="a2hs-step-icon">۳</div>
                    <div class="a2hs-step-desc">
                        در بالای صفحه سمت راست روی گزینه **Add (افزودن)** ضربه بزنید تا برنامه نصب شود.
                    </div>
                </div>
            </div>
        `;
        closeBtn.innerText = 'متوجه شدم';
    } else {
        // Android / Windows / Chrome / Samsung Internet Flow
        contentDiv.innerHTML = `
            <p class="text-xs font-bold text-gray-500 leading-relaxed mb-4 text-right">
                با نصب نسخه وب‌اپلیکیشن (PWA)، برنامه در لیست برنامه‌های گوشی یا دسکتاپ شما قرار می‌گیرد و سریع‌تر و مصرف اینترنت کمتری خواهد داشت.
            </p>
            <div class="a2hs-steps">
                <div class="a2hs-step">
                    <div class="a2hs-step-icon">۱</div>
                    <div class="a2hs-step-desc">
                        در بالای صفحه مرورگر خود روی دکمه منو **سه نقطه** 
                        <i class="fa-solid fa-ellipsis-vertical text-gray-800 mx-1"></i> ضربه بزنید.
                    </div>
                </div>
                <div class="a2hs-step">
                    <div class="a2hs-step-icon">۲</div>
                    <div class="a2hs-step-desc">
                        گزینه **نصب برنامه (Install app)** یا **افزودن به صفحه اصلی (Add to Home Screen)** را انتخاب کنید.
                    </div>
                </div>
            </div>
        `;
        closeBtn.innerText = 'متوجه شدم';
    }

    // Set up dismiss action
    const dismissPrompt = () => {
        sheet.classList.remove('show');
        overlay.classList.remove('show');
        if (!force) {
            localStorage.setItem(dismissedKey, Date.now().toString());
        }
    };

    overlay.onclick = dismissPrompt;
    closeBtn.onclick = dismissPrompt;

    // Trigger animation
    setTimeout(() => {
        overlay.classList.add('show');
        sheet.classList.add('show');
    }, 100);
};

/**
 * Automatically evaluates whether to show the install guide on app launch.
 */
export const checkA2HSOnLaunch = () => {
    // Only show auto prompt on mobile/tablet devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Show prompt after 3 seconds
    setTimeout(() => {
        showA2HSPrompt(false);
    }, 3000);
};
