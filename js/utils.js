export const speakAny = (txt) => {
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
};

export const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const startSpeechRecognition = (lang, onResult, onError) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("مرورگر شما از قابلیت تشخیص گفتار پشتیبانی نمی‌کند.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        onResult(text);
        recognition.stop();
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (onError) onError(event.error);
        recognition.stop();
    };

    recognition.start();
    return recognition;
};

export const getTranslation = async (word) => {
    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=${encodeURI(word)}`);
        const json = await res.json();
        return json[0][0][0];
    } catch (e) {
        console.error("Translation error:", e);
        throw e;
    }
};

export const pasteFromClipboard = async (id) => {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(id).value = text;
    } catch (e) {
        alert("عدم دسترسی به کلیپ‌بورد");
    }
};

export const translatePOS = (pos) => {
    const map = { 
        'noun': 'اسم', 'verb': 'فعل', 'adjective': 'صفت', 
        'adverb': 'قید', 'preposition': 'حرف اضافه', 
        'conjunction': 'حرف ربط', 'pronoun': 'ضمیر', 
        'interjection': 'صوت' 
    };
    return map[pos.toLowerCase()] || pos;
};
