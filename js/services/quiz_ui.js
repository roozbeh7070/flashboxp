import { QuizSession } from '../quiz.js';
import * as modals from '../components/Modals.js';
import * as utils from '../utils.js';

export const quizUiMethods = {
    // --- Quiz Logic ---
    showQuizConfig() {
        this.tempQMode = 'eng';
        this.tempQuizScope = 'all';

        const words = this.data.folders[this.activeIdx].words;
        this.showModal(modals.QuizConfigModal(words));
    },

    setQuizMode(mode, btn) {
        this.tempQMode = mode;
        document.querySelectorAll('.qmode-btn').forEach(b => {
            b.classList.remove('active', '!bg-blue-600', '!text-white');
            b.classList.add('bg-white', 'text-gray-800');
        });
        btn.classList.add('active', '!bg-blue-600', '!text-white');
        btn.classList.remove('bg-white', 'text-gray-800');
    },

    setQuizScope(scope, btn) {
        this.tempQuizScope = scope;
        document.querySelectorAll('.quiz-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const container = document.getElementById('word-picker-container');
        if (scope === 'selected') container.classList.remove('hidden');
        else container.classList.add('hidden');
    },

    toggleAllCheckboxes(checked) {
        document.querySelectorAll('.word-quiz-check').forEach(cb => cb.checked = checked);
    },

    startSpecificQuiz() {
        const checkedIndices = Array.from(document.querySelectorAll('.word-quiz-check:checked')).map(cb => parseInt(cb.value));
        if (this.tempQuizScope === 'selected' && checkedIndices.length === 0) {
            this.showModal(modals.QuizPickerWarningModal());
            return;
        }

        this.quizSession = new QuizSession(this.data, this.activeIdx, this.tempQMode, this.tempQuizScope, checkedIndices);
        this.closeModal();
        document.getElementById('quiz-screen').classList.remove('hidden');
        this.showQuizCard();
    },

    showQuizCard() {
        const word = this.quizSession.getCurrentWord();
        const mode = this.quizSession.mode;
        
        document.getElementById('quiz-progress').innerText = `${this.quizSession.curIdx + 1} از ${this.quizSession.queue.length}`;
        const progressPercent = ((this.quizSession.curIdx + 1) / this.quizSession.queue.length) * 100;
        document.getElementById('quiz-progress-bar').style.width = `${progressPercent}%`;

        document.getElementById('quiz-main-text').innerText = (mode === 'eng') ? word.eng : word.per;
        document.getElementById('quiz-sub-text').innerText = (mode === 'eng') ? word.per : word.eng;
        document.getElementById('quiz-sub-text').classList.add('hidden');
        
        const tag = document.getElementById('quiz-tag');
        tag.innerText = word.failed ? 'Need Review' : 'Active';
        tag.className = `absolute top-8 right-8 px-5 py-2 rounded-full text-[10px] font-black tracking-widest ${word.failed ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`;
    },

    flipCard() {
        document.getElementById('quiz-sub-text').classList.toggle('hidden');
    },

    quizResult(success) {
        this.quizSession.handleResult(success);
        
        // Update the word state in our main data
        const currentWord = this.quizSession.getCurrentWord();
        const folder = this.data.folders[this.quizSession.folderIdx];
        const wordInData = folder.words.find(w => w.id === currentWord.id);
        if (wordInData) {
            wordInData.failed = !success;
            wordInData.success = success;
        }

        this.save(); // Save immediately to reflect status in system folders
        this.moveQuiz();
    },

    moveQuiz() {
        this.quizSession.next();
        if (!this.quizSession.isFinished()) {
            this.showQuizCard();
        } else {
            this.save(); // Save the quiz results
            this.showModal(modals.QuizFinishedModal());
        }
    },

    restartQuiz() {
        this.quizSession.restart();
        this.showQuizCard();
    },

    speakWordInQuiz(e) {
        e.stopPropagation();
        utils.speakAny(this.quizSession.getCurrentWord().eng, utils.getFullLangCode(this.data.settings.targetLang));
    }
};
