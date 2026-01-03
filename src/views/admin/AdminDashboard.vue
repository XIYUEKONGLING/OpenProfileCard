<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { httpClient } from '../../api/client';
import { useUIStore } from '../../stores/ui';
import type { UserAdminDto, PagedResponse } from '../../api/types';

const users = ref<UserAdminDto[]>([]);
const loading = ref(true);
const ui = useUIStore();

/**
 * Fetch records from administrative endpoint
 */
async function loadData() {
  try {
    const response = await httpClient<PagedResponse<UserAdminDto>>('/admin/users');
    users.value = response.Data ?? [];
  } catch (e: any) {
    ui.notify(e.message ?? 'FETCH_FAILED', 'error');
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadData());
</script>

<template>
  <div class="space-y-12">
    <header class="flex justify-between items-center">
      <h2 class="text-5xl font-black tracking-tighter text-white uppercase italic">Users</h2>
      <button class="px-6 py-3 bg-white text-black font-black rounded-2xl hover:bg-blue-500 hover:text-white transition-all">Provision</button>
    </header>

    <div class="bg-white/2 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
          <tr class="border-b border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
            <th class="px-10 py-8">Account Identity</th>
            <th class="px-10 py-8">Status</th>
            <th class="px-10 py-8 text-right">Control</th>
          </tr>
          </thead>
          <tbody class="text-sm font-bold">
          <tr v-for="u in users" :key="u.Id" class="border-b border-white/2 hover:bg-white/1 transition-colors group">
            <td class="px-10 py-8">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                  <!-- Safe TypeScript access -->
                  <span class="text-white/30">{{ u.AccountName?.[0]?.toUpperCase() ?? '?' }}</span>
                </div>
                <div>
                  <p class="text-white">{{ u.AccountName }}</p>
                  <p class="text-[10px] text-gray-500 font-medium tracking-tighter">{{ u.Email }}</p>
                </div>
              </div>
            </td>
            <td class="px-10 py-8">
              <span class="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] uppercase font-black">{{ u.Status }}</span>
            </td>
            <td class="px-10 py-8 text-right">
              <button class="text-blue-500 uppercase text-[10px] font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
