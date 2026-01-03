<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useI18n } from '../i18n';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const { t, setLocale, locale } = useI18n();

/**
 * Handle logout process
 */
const onLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<template>
  <div class="flex min-h-screen bg-[#050505] text-white overflow-hidden font-sans">
    <!-- Sidebar Navigation -->
    <aside class="w-64 border-r border-white/5 bg-white/1 backdrop-blur-3xl flex flex-col">
      <div class="p-8">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20"></div>
          <h1 class="font-black tracking-tighter text-xl uppercase italic">OpenProfile</h1>
        </div>
      </div>

      <nav class="flex-1 px-4 space-y-1">
        <router-link to="/dashboard" class="nav-item" active-class="active">
          <span class="text-lg">📊</span> {{ t('dashboard.overview') }}
        </router-link>

        <div v-if="auth.isAdmin" class="pt-6 pb-2 opacity-30 text-[10px] font-bold px-4 uppercase tracking-[0.3em]">
          Administration
        </div>

        <router-link v-if="auth.isAdmin" to="/dashboard/admin" class="nav-item" active-class="active">
          <span class="text-lg">🛡️</span> {{ t('dashboard.adminPanel') }}
        </router-link>
      </nav>

      <div class="p-6 border-t border-white/5 space-y-6">
        <!-- Simple Lang Switcher -->
        <div class="flex bg-white/5 p-1 rounded-xl">
          <button @click="setLocale('zh')" :class="locale === 'zh' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500'" class="flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all">ZH</button>
          <button @click="setLocale('en')" :class="locale === 'en' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500'" class="flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all">EN</button>
        </div>

        <!-- User Profile -->
        <div class="flex items-center gap-3 px-1">
          <div class="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-inner ring-1 ring-white/20">
            <!-- Safe access with fallback -->
            {{ auth.user?.AccountName?.[0]?.toUpperCase() ?? '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-black truncate leading-tight">{{ auth.user?.AccountName ?? 'Guest' }}</p>
            <button @click="onLogout" class="text-[10px] text-red-400 font-bold opacity-70 hover:opacity-100 transition-opacity">{{ t('common.logout') }}</button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Content Area -->
    <main class="flex-1 overflow-y-auto bg-linear-to-b from-[#080808] to-[#050505]">
      <div class="max-w-6xl mx-auto p-10">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
@reference "../style.css";

.nav-item {
  @apply flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-gray-500 transition-all hover:bg-white/5 hover:text-white;
}

.nav-item.active {
  @apply bg-white/5 text-white shadow-xl ring-1 ring-white/10;
}
</style>
