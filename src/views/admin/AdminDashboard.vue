<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { httpClient } from '../../api/client';
import type { UserAdminDto } from '../../api/types';

const users = ref<UserAdminDto[]>([]);
const loading = ref(true);

/**
 * Load user list for administrative purposes
 */
onMounted(async () => {
  try {
    const response = await httpClient<{ Data: UserAdminDto[] }>('/admin/users');
    // Handle both raw array or paged response depending on backend logic
    users.value = Array.isArray(response) ? response : (response as any).Data || [];
  } catch (e) {
    console.error('Admin access failed', e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-10">
    <header>
      <h2 class="text-4xl font-black tracking-tight text-white uppercase italic">Admin Panel</h2>
      <p class="text-gray-500 mt-2 font-medium">Global system management and user oversight.</p>
    </header>

    <div class="bg-white/2 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
          <tr class="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <th class="px-8 py-6">Account</th>
            <th class="px-8 py-6">Type</th>
            <th class="px-8 py-6">Status</th>
            <th class="px-8 py-6">Last Login</th>
            <th class="px-8 py-6 text-right">Actions</th>
          </tr>
          </thead>
          <tbody class="text-sm font-bold">
          <tr v-for="u in users" :key="u.Id" class="border-b border-white/2 hover:bg-white/1 transition-colors">
            <td class="px-8 py-6">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">{{ u.AccountName[0].toUpperCase() }}</div>
                <div>
                  <p class="text-white">{{ u.AccountName }}</p>
                  <p class="text-[10px] text-gray-500 font-medium">{{ u.Email }}</p>
                </div>
              </div>
            </td>
            <td class="px-8 py-6 text-xs">{{ u.Type }}</td>
            <td class="px-8 py-6">
              <span class="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] uppercase font-black">{{ u.Status }}</span>
            </td>
            <td class="px-8 py-6 text-gray-500 font-mono text-xs">{{ u.LastLogin }}</td>
            <td class="px-8 py-6 text-right">
              <button class="text-blue-500 hover:text-blue-400 mr-4">Manage</button>
              <button class="text-red-500 hover:text-red-400">Suspend</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <div v-if="loading" class="p-20 text-center text-gray-600 font-bold uppercase tracking-widest animate-pulse">
        Fetching records...
      </div>
    </div>
  </div>
</template>
