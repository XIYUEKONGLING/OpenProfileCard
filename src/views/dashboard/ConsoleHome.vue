<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { httpClient } from '../../api/client';
import { useI18n } from '../../i18n';
import type { ProfileDto } from '../../api/types';

const { t } = useI18n();
const profile = ref<ProfileDto | null>(null);
const loading = ref(true);

/**
 * Fetch personal profile data on mount
 */
onMounted(async () => {
  try {
    profile.value = await httpClient<ProfileDto>('/me/profile');
  } catch (e) {
    console.error('Failed to load profile', e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-10">
    <header>
      <h2 class="text-4xl font-black tracking-tight text-white">{{ t('dashboard.title') }}</h2>
      <p class="text-gray-500 mt-2 font-medium">{{ t('dashboard.overview') }}</p>
    </header>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      <div v-for="i in 3" :key="i" class="h-40 bg-white/5 rounded-4xl"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Main Stats Section -->
      <section class="lg:col-span-8 space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="bg-white/3 border border-white/5 p-8 rounded-4xl backdrop-blur-xl">
            <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">{{ t('dashboard.accountStatus') }}</p>
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
              <span class="text-xl font-black uppercase italic">{{ profile?.Status }}</span>
            </div>
          </div>
          <div class="bg-white/3 border border-white/5 p-8 rounded-4xl backdrop-blur-xl">
            <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Network</p>
            <div class="flex gap-10">
              <div>
                <p class="text-2xl font-black">{{ profile?.FollowersCount }}</p>
                <p class="text-[10px] text-gray-500 font-bold uppercase">{{ t('dashboard.followers') }}</p>
              </div>
              <div>
                <p class="text-2xl font-black">{{ profile?.FollowingCount }}</p>
                <p class="text-[10px] text-gray-500 font-bold uppercase">{{ t('dashboard.following') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Identity Preview -->
        <div class="bg-white/2 border border-white/5 p-1 rounded-[2.5rem]">
          <div class="bg-[#0a0a0a] rounded-[2.4rem] p-10 flex items-center justify-between overflow-hidden relative">
            <div class="relative z-10">
              <h3 class="text-2xl font-black mb-2">{{ profile?.DisplayName || profile?.AccountName }}</h3>
              <p class="text-gray-500 max-w-md line-clamp-2 leading-relaxed">{{ profile?.Description || t('profile.noBio') }}</p>
            </div>
            <router-link :to="`/${profile?.AccountName}`" class="relative z-10 px-6 py-3 bg-white text-black font-black rounded-2xl hover:bg-blue-50 transition-colors">
              Visit Public Card
            </router-link>
            <!-- Abstract glow -->
            <div class="absolute right-[-10%] top-[-50%] w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <aside class="lg:col-span-4 space-y-6">
        <div class="bg-linear-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/20">
          <h4 class="text-white font-black text-xl mb-2">{{ t('common.edit') }}</h4>
          <p class="text-blue-100/70 text-sm mb-6 font-medium">Keep your professional identity up to date.</p>
          <button class="w-full py-4 bg-white text-blue-700 font-black rounded-2xl hover:shadow-lg transition-all">
            Edit Profile
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
