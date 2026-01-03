<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useI18n } from '../../i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();

const form = ref({ Login: '', Password: '' });
const loading = ref(false);

const submit = async () => {
  loading.value = true;
  try {
    await auth.login(form.value);
    router.push('/dashboard');
  } catch (e) {
    alert(t('auth.loginFailed'));
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#050505] p-6">
    <!-- Ambient Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative z-10">
      <header class="text-center mb-10">
        <div class="inline-flex w-16 h-16 bg-blue-600 rounded-2xl mb-6 items-center justify-center shadow-lg shadow-blue-500/20">
          <span class="text-white font-black text-2xl">OP</span>
        </div>
        <h2 class="text-3xl font-black tracking-tight mb-2">{{ t('auth.loginTitle') }}</h2>
        <p class="text-gray-500 text-sm">{{ t('auth.loginSubtitle') }}</p>
      </header>

      <form @submit.prevent="submit" class="space-y-6">
        <div>
          <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">{{ t('common.username') }}</label>
          <input v-model="form.Login" type="text" required class="login-input" placeholder="alice / alice@example.com" />
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">{{ t('common.password') }}</label>
          <input v-model="form.Password" type="password" required class="login-input" placeholder="••••••••" />
        </div>

        <button :disabled="loading" class="w-full py-4 bg-white text-black font-black rounded-2xl transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-50">
          {{ loading ? t('common.loading') : t('auth.signIn') }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
@reference "../../style.css";

.login-input {
  @apply w-full bg-white/3 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm;
}
</style>
