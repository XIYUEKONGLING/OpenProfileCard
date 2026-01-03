<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { httpClient } from '../../api/client';
import AssetView from '../../components/ui/AssetView.vue';
import type { ProfileDto } from '../../api/types';

const route = useRoute();
const profile = ref<ProfileDto | null>(null);
const loading = ref(true);
const error = ref(false);

/**
 * Resolve public identity record
 */
onMounted(async () => {
  try {
    const username = route.params.username as string;
    profile.value = await httpClient<ProfileDto>(`/profiles/${username}`, { requiresAuth: false });
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#020202] flex items-center justify-center p-6 relative overflow-hidden font-sans">
    <div v-if="loading" class="text-white/10 font-black tracking-[1em] animate-pulse uppercase">Syncing</div>

    <div v-else-if="error" class="text-center z-10">
      <h1 class="text-9xl font-black text-white/5 italic">404</h1>
      <router-link to="/" class="text-blue-500 font-black uppercase text-xs">Return to Home</router-link>
    </div>

    <div v-else-if="profile" class="w-full max-w-xl z-10 group">
      <div class="bg-white/3 backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-1000 group-hover:border-white/10">
        <div class="h-48 bg-[#0a0a0a] relative">
          <AssetView :asset="profile.Background" className="w-full h-full opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
          <div class="absolute inset-0 bg-linear-to-t from-[#020202] to-transparent"></div>
        </div>

        <div class="px-12 pb-12 relative">
          <div class="relative -top-16 flex justify-between items-end">
            <div class="w-32 h-32 rounded-4xl border-[6px] border-[#020202] overflow-hidden bg-[#0a0a0a] shadow-2xl">
              <AssetView :asset="profile.Avatar" :fallbackName="profile.AccountName" />
            </div>
            <button class="px-8 py-3 bg-white text-black font-black rounded-2xl active:scale-95 transition-all">Follow</button>
          </div>

          <div class="-mt-10 space-y-6">
            <header>
              <h1 class="text-4xl font-black text-white leading-none tracking-tighter">{{ profile.DisplayName || profile.AccountName }}</h1>
              <p class="text-blue-500 font-black tracking-widest text-xs uppercase italic mt-3">@{{ profile.AccountName }}</p>
            </header>

            <p class="text-gray-400 leading-relaxed font-medium">
              {{ profile.Description || 'Professional digital identity.' }}
            </p>

            <div class="flex gap-10 pt-6 border-t border-white/5">
              <div>
                <p class="text-2xl font-black text-white italic">{{ profile.FollowersCount }}</p>
                <p class="text-[9px] text-gray-600 font-black uppercase tracking-widest">Endorsers</p>
              </div>
              <div>
                <p class="text-2xl font-black text-white italic">{{ profile.FollowingCount }}</p>
                <p class="text-[9px] text-gray-600 font-black uppercase tracking-widest">Following</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
