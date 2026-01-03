<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useServerStore } from '@/stores/server';
import { useUIStore } from '@/stores/ui';
import { useI18n } from '@/i18n';

import {
  LayoutDashboard,
  User,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  CreditCard
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import AssetView from '@/components/ui/AssetView.vue';

const { t } = useI18n();
const auth = useAuthStore();
const server = useServerStore();
const ui = useUIStore();
const router = useRouter();
const route = useRoute();

const isMobileMenuOpen = ref(false);

const navigation = [
  { name: t('dashboard.overview'), href: '/dashboard', icon: LayoutDashboard },
  { name: t('dashboard.myCards'), href: '/dashboard/cards', icon: CreditCard },
  { name: t('common.edit'), href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const handleLogout = async () => {
  await auth.logout();
  ui.notify(t('auth.logoutSuccess'), 'success');
  await router.push('/login');
};
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
    <!-- Background Decoration -->
    <div class="fixed inset-0 bg-linear-to-br from-brand-blue/5 via-transparent to-brand-purple/5 -z-10"></div>

    <!-- Sidebar (Desktop) -->
    <aside class="hidden md:flex w-72 flex-col glass-card border-y-0 border-l-0 p-6">
      <div class="flex items-center gap-3 px-2 mb-10">
        <AssetView :asset="server.meta?.Logo" class-name="size-8 rounded-lg" />
        <span class="font-black tracking-tight text-xl">{{ server.meta?.SiteName }}</span>
      </div>

      <nav class="flex-1 space-y-1">
        <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            v-slot="{ isExactActive }"
        >
          <div :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200',
            isExactActive ? 'bg-foreground text-background shadow-lg shadow-foreground/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          ]">
            <component :is="item.icon" class="size-5" />
            {{ item.name }}
          </div>
        </router-link>

        <!-- Admin Link -->
        <router-link v-if="auth.isAdmin" to="/admin" v-slot="{ isExactActive }">
          <div :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all mt-4 border border-dashed border-border/60',
            isExactActive ? 'bg-brand-blue text-white shadow-lg' : 'text-brand-blue hover:bg-brand-blue/5'
          ]">
            <ShieldCheck class="size-5" />
            {{ t('dashboard.adminPanel') }}
          </div>
        </router-link>
      </nav>

      <!-- Bottom User Section -->
      <div class="mt-auto pt-6 border-t border-border/40 space-y-4">
        <div class="flex items-center gap-3 px-2">
          <div class="size-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
            <span class="text-xs font-black">{{ auth.user?.AccountName?.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-black truncate">{{ auth.user?.AccountName }}</p>
            <p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Member</p>
          </div>
        </div>
        <Button variant="ghost" class="w-full justify-start gap-3 rounded-xl text-destructive hover:bg-destructive/10" @click="handleLogout">
          <LogOut class="size-5" />
          {{ t('common.logout') }}
        </Button>
      </div>
    </aside>

    <!-- Header (Mobile) -->
    <header class="md:hidden flex items-center justify-between p-4 glass-card border-x-0 border-t-0">
      <div class="flex items-center gap-2">
        <AssetView :asset="server.meta?.Logo" class-name="size-6" />
        <span class="font-black text-lg">{{ server.meta?.SiteName }}</span>
      </div>
      <Button variant="ghost" size="icon" @click="isMobileMenuOpen = !isMobileMenuOpen">
        <Menu v-if="!isMobileMenuOpen" />
        <X v-else />
      </Button>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto p-4 md:p-10">
      <!-- <div class="max-w-6xl mx-auto min-h-full"> -->
      <div class="w-full max-w-screen-2xl mx-auto min-h-full">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
