<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useServerStore } from '@/stores/server';
import { useUIStore } from '@/stores/ui';
import { useThemeStore } from '@/stores/theme';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import type { OrganizationDto } from '@/api/types';

import {
  LayoutDashboard,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  Languages,
  Check,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  Cog
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import AssetView from '@/components/ui/AssetView.vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

const { t, locale, setLocale } = useI18n();
const auth = useAuthStore();
const server = useServerStore();
const ui = useUIStore();
const themeStore = useThemeStore();
const router = useRouter();
const route = useRoute();

// --- State ---
const isMobileMenuOpen = ref(false);
const isCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true');
const myOrgs = ref<OrganizationDto[]>([]);

// --- Actions ---
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('sidebar-collapsed', String(isCollapsed.value));
};

const fetchOrgs = async () => {
  try {
    // Layout fetches orgs to populate the sidebar
    const data = await httpClient<OrganizationDto[]>('/orgs');
    myOrgs.value = data || [];
  } catch (e) {
    console.error('Failed to fetch orgs in layout', e);
  }
};

const handleLogout = async () => {
  await auth.logout();
  ui.notify(t('auth.logoutSuccess'), 'success');
  await router.push('/login');
};

onMounted(() => {
  if (auth.isAuthenticated) {
    fetchOrgs();
  }
});

// --- Config ---
const navigation = [
  { name: t('dashboard.overview'), href: '/dashboard', icon: LayoutDashboard },
  { name: t('common.settings'), href: '/dashboard/settings', icon: Settings },
];

const languages = [
  { code: 'zh', label: '简体中文' },
  { code: 'en', label: 'English' }
];

const themeOptions = [
  { mode: 'light', icon: Sun, label: t('common.light') },
  { mode: 'dark', icon: Moon, label: t('common.dark') },
  { mode: 'auto', icon: Monitor, label: t('common.system') }
] as const;
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
    <!-- Background Decoration -->
    <div class="fixed inset-0 bg-linear-to-br from-brand-blue/5 via-transparent to-brand-purple/5 -z-10"></div>

    <!-- ======================== -->
    <!-- DESKTOP SIDEBAR          -->
    <!-- ======================== -->
    <aside
        class="hidden md:flex flex-col glass-card border-y-0 border-l-0 transition-all duration-300 z-20"
        :class="[isCollapsed ? 'w-17.5 items-center py-4' : 'w-72 p-6']"
    >
      <!-- Header / Logo -->
      <div class="flex items-center mb-8" :class="[isCollapsed ? 'justify-center px-0' : 'gap-3 px-2 justify-between']">
        <div class="flex items-center gap-3 overflow-hidden">
          <AssetView :asset="server.meta?.Logo" class-name="size-8 rounded-lg shrink-0" />
          <span v-if="!isCollapsed" class="font-black tracking-tight text-xl truncate transition-opacity duration-200">
             {{ server.meta?.SiteName }}
           </span>
        </div>

        <!-- Toggle Button (Only visible when expanded, or moved to bottom when collapsed? Let's put it next to logo when expanded) -->
        <Button v-if="!isCollapsed" variant="ghost" size="icon" class="size-6 text-muted-foreground ml-auto" @click="toggleSidebar">
          <PanelLeftClose class="size-4" />
        </Button>
      </div>

      <!-- Collapsed Toggle (If collapsed, show at top) -->
      <Button v-if="isCollapsed" variant="ghost" size="icon" class="mb-6 size-8 text-muted-foreground" @click="toggleSidebar">
        <PanelLeftOpen class="size-4" />
      </Button>

      <!-- Navigation -->
      <nav class="flex-1 space-y-1 w-full">
        <!-- Main Nav -->
        <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            v-slot="{ isExactActive }"
        >
          <div :class="[
            'flex items-center rounded-xl font-bold transition-all duration-200 relative group',
            isCollapsed ? 'justify-center size-10 mx-auto' : 'gap-3 px-4 py-3',
            isExactActive ? 'bg-foreground text-background shadow-lg shadow-foreground/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          ]" :title="isCollapsed ? item.name : ''">
            <component :is="item.icon" class="size-5 shrink-0" />
            <span v-if="!isCollapsed">{{ item.name }}</span>

            <!-- Tooltip for collapsed -->
            <div v-if="isCollapsed" class="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-50 border">
              {{ item.name }}
            </div>
          </div>
        </router-link>

        <!-- Organizations Section -->
        <div v-if="myOrgs.length > 0" class="mt-8">
          <div v-if="!isCollapsed" class="px-4 mb-2 text-xs font-black text-muted-foreground/50 uppercase tracking-widest flex items-center justify-between">
            {{ t('dashboard.organizations') }}
          </div>
          <div v-else class="h-px bg-border/50 mx-2 my-4"></div>

          <div class="space-y-1">
            <router-link
                v-for="org in myOrgs"
                :key="org.Id"
                :to="`/orgs/${org.AccountName}`"
                v-slot="{ isExactActive }"
            >
              <div :class="[
                    'flex items-center rounded-xl font-medium transition-all duration-200 relative group',
                    isCollapsed ? 'justify-center size-10 mx-auto' : 'gap-3 px-4 py-2',
                    isExactActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                 ]" :title="org.DisplayName">
                <div class="size-5 rounded overflow-hidden shrink-0 border border-border/50">
                  <AssetView :asset="org.Avatar" :fallback-name="org.DisplayName" class-name="w-full h-full" />
                </div>

                <span v-if="!isCollapsed" class="truncate text-sm">{{ org.DisplayName }}</span>

                <!-- Admin Gear Icon -->
                <router-link
                    v-if="!isCollapsed && (org.MyRole === 'Owner' || org.MyRole === 'Admin')"
                    :to="`/orgs/${org.AccountName}/settings`"
                    class="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded-md transition-all"
                    @click.stop
                >
                  <Cog class="size-3.5 text-muted-foreground" />
                </router-link>

                <!-- Tooltip for collapsed -->
                <div v-if="isCollapsed" class="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-50 border">
                  {{ org.DisplayName }}
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- System Admin Link -->
        <router-link v-if="auth.isAdmin" to="/admin" v-slot="{ isExactActive }">
          <div :class="[
            'flex items-center rounded-xl font-bold transition-all mt-4 border border-dashed border-border/60 relative group',
            isCollapsed ? 'justify-center size-10 mx-auto' : 'gap-3 px-4 py-3',
            isExactActive ? 'bg-brand-blue text-white shadow-lg' : 'text-brand-blue hover:bg-brand-blue/5'
          ]" :title="t('dashboard.adminPanel')">
            <ShieldCheck class="size-5 shrink-0" />
            <span v-if="!isCollapsed">{{ t('dashboard.adminPanel') }}</span>
          </div>
        </router-link>
      </nav>

      <!-- Bottom Controls -->
      <div class="mt-auto space-y-4 pt-6 border-t border-border/40 w-full">

        <!-- Theme & Lang Row -->
        <div class="flex items-center gap-2" :class="[isCollapsed ? 'flex-col' : 'justify-between px-2']">
          <!-- Language -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" :class="[isCollapsed ? 'size-9 p-0' : 'flex-1 justify-start gap-2 h-9 px-2']">
                <Languages class="size-4 text-muted-foreground" />
                <span v-if="!isCollapsed" class="text-xs font-medium text-muted-foreground">{{ languages.find(l => l.code === locale)?.label }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-32" side="right">
              <DropdownMenuItem v-for="lang in languages" :key="lang.code" @click="setLocale(lang.code as any)">
                {{ lang.label }}
                <Check v-if="locale === lang.code" class="ml-auto size-3" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Theme -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="h-9 w-9 text-muted-foreground hover:text-foreground">
                <Sun v-if="themeStore.theme === 'light'" class="size-4" />
                <Moon v-else-if="themeStore.theme === 'dark'" class="size-4" />
                <Monitor v-else class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-32" side="right">
              <DropdownMenuItem v-for="opt in themeOptions" :key="opt.mode" @click="themeStore.setTheme(opt.mode)">
                <component :is="opt.icon" class="mr-2 size-3" />
                {{ opt.label }}
                <Check v-if="themeStore.theme === opt.mode" class="ml-auto size-3" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- User Profile Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="w-full flex items-center gap-3 rounded-xl hover:bg-muted/50 transition-colors outline-none text-left" :class="[isCollapsed ? 'justify-center p-1' : 'px-2 py-2']">
              <div class="size-9 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                <span class="text-xs font-black">{{ auth.user?.AccountName?.charAt(0).toUpperCase() }}</span>
              </div>
              <div v-if="!isCollapsed" class="flex-1 min-w-0">
                <p class="text-sm font-black truncate">{{ auth.user?.AccountName }}</p>
                <p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Member</p>
              </div>
              <ChevronUp v-if="!isCollapsed" class="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent :align="isCollapsed ? 'start' : 'end'" class="w-56" side="top">
            <!-- <DropdownMenuLabel>My Account</DropdownMenuLabel> -->
            <!-- <DropdownMenuSeparator /> -->
            <DropdownMenuItem class="text-destructive focus:text-destructive gap-2 cursor-pointer" @click="handleLogout">
              <LogOut class="size-4" />
              {{ t('common.logout') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>

    <!-- ======================== -->
    <!-- MOBILE HEADER & MENU     -->
    <!-- ======================== -->
    <header class="md:hidden sticky top-0 z-50 flex items-center justify-between p-4 glass-card border-x-0 border-t-0">
      <div class="flex items-center gap-2">
        <AssetView :asset="server.meta?.Logo" class-name="size-6" />
        <span class="font-black text-lg">{{ server.meta?.SiteName }}</span>
      </div>
      <Button variant="ghost" size="icon" @click="isMobileMenuOpen = true">
        <Menu />
      </Button>
    </header>

    <!-- Mobile Fullscreen Menu -->
    <Transition name="slide-fade">
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-50 bg-background flex flex-col md:hidden">
        <!-- Mobile Header -->
        <div class="flex items-center justify-between p-4 border-b border-border/40">
          <div class="flex items-center gap-2">
            <AssetView :asset="server.meta?.Logo" class-name="size-6" />
            <span class="font-black text-lg">{{ server.meta?.SiteName }}</span>
          </div>
          <Button variant="ghost" size="icon" @click="isMobileMenuOpen = false">
            <X />
          </Button>
        </div>

        <!-- Mobile Nav Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <nav class="space-y-1">
            <router-link
                v-for="item in navigation"
                :key="item.name"
                :to="item.href"
                @click="isMobileMenuOpen = false"
                v-slot="{ isExactActive }"
            >
              <div :class="[
                  'flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all text-lg',
                  isExactActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                ]">
                <component :is="item.icon" class="size-6" />
                {{ item.name }}
              </div>
            </router-link>

            <!-- Organizations Mobile -->
            <div v-if="myOrgs.length > 0" class="pt-4">
              <p class="px-4 text-xs font-black text-muted-foreground/50 uppercase tracking-widest mb-2">{{ t('dashboard.organizations') }}</p>
              <router-link
                  v-for="org in myOrgs"
                  :key="org.Id"
                  :to="`/orgs/${org.AccountName}`"
                  @click="isMobileMenuOpen = false"
                  class="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 font-medium"
              >
                <div class="size-6 rounded border border-border overflow-hidden">
                  <AssetView :asset="org.Avatar" :fallback-name="org.DisplayName" class-name="w-full h-full" />
                </div>
                {{ org.DisplayName }}
              </router-link>
            </div>

            <!-- Admin Mobile -->
            <router-link v-if="auth.isAdmin" to="/admin" @click="isMobileMenuOpen = false" v-slot="{ isExactActive }">
              <div :class="[
                  'flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all text-lg mt-4 border border-dashed border-border',
                  isExactActive ? 'bg-brand-blue/10 text-brand-blue' : 'text-brand-blue'
                ]">
                <ShieldCheck class="size-6" />
                {{ t('dashboard.adminPanel') }}
              </div>
            </router-link>
          </nav>

          <div class="h-px bg-border/40"></div>

          <!-- Mobile Settings -->
          <div class="space-y-4 px-2">
            <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ t('common.settings') }}</p>

            <!-- Lang -->
            <div class="flex gap-2">
              <Button
                  v-for="lang in languages"
                  :key="lang.code"
                  variant="outline"
                  class="flex-1"
                  :class="{'border-brand-blue text-brand-blue bg-brand-blue/5': locale === lang.code}"
                  @click="setLocale(lang.code as any)"
              >
                {{ lang.label }}
              </Button>
            </div>

            <!-- Theme -->
            <div class="flex gap-2">
              <Button
                  v-for="opt in themeOptions"
                  :key="opt.mode"
                  variant="outline"
                  class="flex-1 gap-2"
                  :class="{'border-brand-purple text-brand-purple bg-brand-purple/5': themeStore.theme === opt.mode}"
                  @click="themeStore.setTheme(opt.mode)"
              >
                <component :is="opt.icon" class="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Mobile Footer -->
        <div class="p-4 border-t border-border/40 bg-muted/20">
          <div class="flex items-center gap-3 mb-4">
            <div class="size-10 rounded-full bg-muted border border-border flex items-center justify-center">
              <span class="text-sm font-black">{{ auth.user?.AccountName?.charAt(0).toUpperCase() }}</span>
            </div>
            <div>
              <p class="font-black">{{ auth.user?.AccountName }}</p>
              <p class="text-xs text-muted-foreground">Logged in</p>
            </div>
          </div>
          <Button variant="destructive" class="w-full rounded-xl" @click="handleLogout">
            <LogOut class="size-4 mr-2" />
            {{ t('common.logout') }}
          </Button>
        </div>
      </div>
    </Transition>

    <!-- ======================== -->
    <!-- MAIN CONTENT AREA        -->
    <!-- ======================== -->
    <main class="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth relative">
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

/* Slide Fade for Mobile Menu */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
