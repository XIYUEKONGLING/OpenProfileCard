<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useServerStore } from '@/stores/server';
import { useUIStore } from '@/stores/ui';
import { useThemeStore } from '@/stores/theme';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { type OrganizationDto, AccountType } from '@/api/types';

import {
  LayoutDashboard,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  Sun,
  Moon,
  Monitor,
  Languages,
  Check,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Cog
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import AssetView from '@/components/ui/AssetView.vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
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

// --- Computed ---
const accountTypeLabel = computed(() => {
  const type = auth.user?.Type;
  switch (type) {
    case AccountType.Personal: return 'Personal';
    case AccountType.Organization: return 'Organization';
    case AccountType.System: return 'System';
    case AccountType.Application: return 'Bot';
    default: return 'Member';
  }
});

const displayName = computed(() => auth.profile?.DisplayName || auth.user?.AccountName || 'User');
const avatar = computed(() => auth.profile?.Avatar);

// --- Actions ---
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('sidebar-collapsed', String(isCollapsed.value));
};

const fetchOrgs = async () => {
  try {
    const data = await httpClient<OrganizationDto[]>('/orgs');
    myOrgs.value = data || [];
  } catch (e) {
    console.error('Failed to fetch orgs in layout', e);
  }
};

const handleLogout = async () => {
  try {
    await auth.logout();
    ui.notify(t('auth.logoutSuccess'), 'success');
    window.location.href = '/login';
  } catch (error) {
    window.location.href = '/login';
  }
};

onMounted(() => {
  if (auth.isAuthenticated) {
    fetchOrgs();
    // Ensure profile is loaded for the sidebar
    if (!auth.profile) auth.fetchMe();
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
  <div class="h-screen bg-background flex flex-col md:flex-row overflow-hidden">
    <!-- Background Decoration -->
    <div class="fixed inset-0 bg-linear-to-br from-brand-blue/5 via-transparent to-brand-purple/5 -z-10"></div>

    <!-- ======================== -->
    <!-- DESKTOP SIDEBAR          -->
    <!-- ======================== -->
    <aside
        class="hidden md:flex flex-col glass-card border-y-0 border-l-0 transition-all duration-300 z-20 h-full"
        :class="[isCollapsed ? 'w-17.5 items-center py-4' : 'w-72 p-6']"
    >
      <!-- Header / Logo -->
      <div class="flex items-center mb-8 shrink-0" :class="[isCollapsed ? 'justify-center px-0' : 'gap-3 px-2 justify-between']">
        <div class="flex items-center gap-3 overflow-hidden">
          <AssetView :asset="server.meta?.Logo" class-name="size-8 rounded-lg shrink-0" />
          <span v-if="!isCollapsed" class="font-black tracking-tight text-xl truncate transition-opacity duration-200">
             {{ server.meta?.SiteName }}
           </span>
        </div>

        <Button v-if="!isCollapsed" variant="ghost" size="icon" class="size-6 text-muted-foreground ml-auto" @click="toggleSidebar">
          <PanelLeftClose class="size-4" />
        </Button>
      </div>

      <Button v-if="isCollapsed" variant="ghost" size="icon" class="mb-6 size-8 text-muted-foreground shrink-0" @click="toggleSidebar">
        <PanelLeftOpen class="size-4" />
      </Button>

      <!-- Navigation -->
      <nav class="flex-1 w-full overflow-y-auto no-scrollbar space-y-1">
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
            <div v-if="isCollapsed" class="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-50 border">
              {{ item.name }}
            </div>
          </div>
        </router-link>

        <!-- Organizations -->
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
              </div>
            </router-link>
          </div>
        </div>

        <!-- Admin -->
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
      <div class="mt-auto space-y-4 pt-6 border-t border-border/40 w-full shrink-0">
        <!-- Theme/Lang controls omitted for brevity (same as previous) -->
        <div class="flex items-center gap-2" :class="[isCollapsed ? 'flex-col' : 'justify-between px-2']">
          <!-- (Keep Theme/Lang code same as provided previously) -->
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
                <!-- Use Avatar from Profile store -->
                <AssetView :asset="avatar" :fallback-name="auth.user?.AccountName" class-name="w-full h-full" />
              </div>
              <div v-if="!isCollapsed" class="flex-1 min-w-0">
                <p class="text-sm font-black truncate">{{ displayName }}</p>
                <p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{{ accountTypeLabel }}</p>
              </div>
              <ChevronUp v-if="!isCollapsed" class="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent :align="isCollapsed ? 'start' : 'end'" class="w-56" side="top">
            <DropdownMenuItem class="cursor-pointer" @click="router.push('/dashboard/profile/edit')">
              <Cog class="size-4 mr-2" />
              {{ t('profile.editProfile') }}
            </DropdownMenuItem>
            <DropdownMenuItem class="text-destructive focus:text-destructive gap-2 cursor-pointer" @click="handleLogout">
              <LogOut class="size-4" />
              {{ t('common.logout') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>

    <!-- Mobile Header & Content omitted (Keep as previous, but update Avatar logic similarly) -->
    <header class="md:hidden sticky top-0 z-50 flex items-center justify-between p-4 glass-card border-x-0 border-t-0">
      <div class="flex items-center gap-2">
        <AssetView :asset="server.meta?.Logo" class-name="size-6" />
        <span class="font-black text-lg">{{ server.meta?.SiteName }}</span>
      </div>
      <Button variant="ghost" size="icon" @click="isMobileMenuOpen = true">
        <Menu />
      </Button>
    </header>

    <!-- MAIN CONTENT -->
    <main class="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth relative">
      <div class="w-full max-w-screen-2xl mx-auto min-h-full">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
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

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
