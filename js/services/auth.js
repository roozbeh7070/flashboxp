import { supabase } from './supabase.js';
import { syncData } from './sync.js';
import { saveData } from '../storage.js';
import * as modals from '../components/Modals.js';

export const authMethods = {
    // --- Supabase Authentication Handlers ---
    async checkUserSession() {
        const { data: { session } } = await supabase.auth.getSession();
        this.user = session ? session.user : null;

        supabase.auth.onAuthStateChange(async (event, session) => {
            this.user = session ? session.user : null;
            if (event === 'SIGNED_IN') {
                console.log('User signed in:', this.user);
                await this.triggerSync();
            }
            if (typeof this.renderSettingsPageContent === 'function') {
                this.renderSettingsPageContent();
            }
        });
    },

    async triggerSync() {
        console.log('Synchronizing data with Supabase...');
        const syncedData = await syncData(this.data, this.user);
        this.data = syncedData;
        
        // Save locally, sync system folders and render UI
        this.syncSystemFolders();
        saveData(this.data);
        this.renderFolders();
        if (this.activeIdx !== null) this.renderWords();
    },

    openAuthModal(mode) {
        this.showModal(modals.AuthModal(mode));
    },

    async handleAuthSubmit(e, mode) {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>در حال پردازش...</span><i class="fas fa-spinner fa-spin mr-2"></i>`;

        let phone = '';
        if (mode === 'signup') {
            const confirmPassword = document.getElementById('auth-confirm-password').value;
            phone = document.getElementById('auth-phone').value.trim();
            if (password !== confirmPassword) {
                this.showAlert("رمز عبور و تکرار آن با هم مطابقت ندارند.", "error");
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
                return;
            }
        }

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({ 
                    email, 
                    password,
                    options: {
                        data: {
                            phone: phone
                        }
                    }
                });
                if (error) throw error;
                
                if (data && data.session) {
                    this.user = data.user;
                    this.showAlert("ثبت‌نام با موفقیت انجام شد! خوش آمدید.", "success", () => {
                        this.closeModal();
                    });
                } else {
                    this.showAlert("ثبت‌نام با موفقیت انجام شد! اکنون می‌توانید با اطلاعات کاربری خود وارد شوید.", "success", () => {
                        this.closeModal();
                    });
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                this.user = data.user;
                this.showAlert("خوش آمدید!", "success", () => {
                    this.closeModal();
                });
            }
        } catch (err) {
            this.showAlert("خطا: " + err.message, "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    },

    async handleGoogleSignIn() {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err) {
            this.showAlert("خطا در ورود با گوگل: " + err.message, "error");
        }
    },

    async handleSignOut() {
        if (confirm("آیا مایلید از حساب کاربری خود خارج شوید؟")) {
            await supabase.auth.signOut();
            this.user = null;
            this.showAlert("از حساب خود خارج شدید.", "info", () => {
                this.closeModal();
            });
        }
    }
};
