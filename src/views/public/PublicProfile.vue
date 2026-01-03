<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { httpClient } from '../../api/client';
import type { ProfileDto } from '../../api/types';

const route = useRoute();
const profile = ref<ProfileDto | null>(null);
const loading = ref(true);
const error = ref(false);

/**
 * Public resolver using username
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
  <div class="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
    <!-- Ambient Environment -->
    <div class="fixed inset-0 pointer-events-none">
      <div class="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px]"></div>
      <div class="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px]"></div>
    </div>

    <div v-if="loading" class="text-white font-black tracking-[0.5em] animate-pulse uppercase italic opacity-20">Loading Identity</div>

    <div v-else-if="error" class="text-center space-y-4 relative z-10">
      <h1 class="text-6xl font-black text-white/10 italic uppercase">404</h1>
      <p class="text-gray-500 font-bold uppercase tracking-widest">Identity Not Found</p>
      <router-link to="/" class="inline-block text-blue-500 text-xs font-black uppercase border-b-2 border-blue-500 pb-1">Return Home</router-link>
    </div>

    <div v-else-if="profile" class="w-full max-w-2xl relative z-10 group">
      <!-- The Identity Card -->
      <div class="bg-white/3 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-700 group-hover:-translate-y-2.5 group-hover:shadow-blue-500/10">
        <!-- Banner Image -->
        <div class="h-48 bg-linear-to-r from-blue-900 to-indigo-900 relative">
          <img v-if="profile.Background?.Value" :src="profile.Background.Value" class="w-full h-full object-cover opacity-40 transition-opacity duration-700 group-hover:opacity-60" />
          <div class="absolute inset-0 bg-linear-to-t from-[#050505]/80 to-transparent"></div>
        </div>

        <div class="px-12 pb-12 relative">
          <!-- Avatar Floating -->
          <div class="relative -top-16 flex justify-between items-end">
            <div class="w-32 h-32 rounded-4xl border-[6px] border-[#050505] overflow-hidden bg-[#111] shadow-2xl transition-transform duration-500 group-hover:scale-105">
              <img :src="profile.Avatar?.Value || `https://api.dicebear.com/7.x/shapes/svg?seed=${profile.AccountName}`" class="w-full h-full object-cover" />
            </div>
            <div class="flex gap-3 mb-4">
              <button class="px-8 py-3 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95">Follow</button>
            </div>
          </div>

          <!-- Info -->
          <div class="-mt-10 space-y-6">
            <header>
              <h1 class="text-4xl font-black text-white leading-none tracking-tight">{{ profile.DisplayName || profile.AccountName }}</h1>
              <p class="text-blue-500 font-black tracking-widest text-sm mt-2">@{{ profile.AccountName }}</p>
            </header>

            <div v-if="profile.Pronouns" class="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase text-gray-400">
              {{ profile.Pronouns }}
            </div>

            <p class="text-gray-400 leading-relaxed text-lg font-medium">
              {{ profile.Description || 'Digital identity owner at OpenProfile.' }}
            </p>

            <!-- Stats -->
            <div class="flex gap-8 pt-6 border-t border-white/5">
              <div class="text-center">
                <p class="text-xl font-black text-white">{{ profile.FollowersCount }}</p>
                <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Followers</p>
              </div>
              <div class="text-center">
                <p class="text-xl font-black text-white">{{ profile.FollowingCount }}</p>
                <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Following</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
