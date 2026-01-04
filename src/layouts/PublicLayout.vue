<script setup lang="ts">
import { computed } from 'vue';
import { useServerStore } from '@/stores/server';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useI18n } from '@/i18n';
import { useRouter } from 'vue-router';

// UI
import { Button } from '@/components/ui/button';
import AssetView from '@/components/ui/AssetView.vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor, Languages, LogIn, LayoutDashboard } from 'lucide-vue-next';

const server = useServerStore();
const auth = useAuthStore();
const themeStore = useThemeStore();
const { t, setLocale, locale } = useI18n();
const router = useRouter();

const isStatic = computed(() => server.info?.Static === true);

const languages = [
  { code: 'zh', label: '简体中文' },
  { code: 'en', label: 'English' }
];
</script>

<template>
  <div class="min-h-screen lex flex-col">
    <!-- Navbar -->
    <header class="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div class="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">

        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <AssetView :asset="server.meta?.Logo" class-name="size-8 rounded-lg" />
          <span class="font-black tracking-tight text-lg hidden sm:block">{{ server.meta?.SiteName }}</span>
        </router-link>

        <!-- Right Actions -->
        <div class="flex items-center gap-2">

          <!-- Theme -->
          <DropdownMenu :modal="false">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon">
                <Sun v-if="themeStore.theme === 'light'" class="size-4" />
                <Moon v-else-if="themeStore.theme === 'dark'" class="size-4" />
                <Monitor v-else class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="themeStore.setTheme('light')"><Sun class="mr-2 size-4"/> {{ t('common.light') }}</DropdownMenuItem>
              <DropdownMenuItem @click="themeStore.setTheme('dark')"><Moon class="mr-2 size-4"/> {{ t('common.dark') }}</DropdownMenuItem>
              <DropdownMenuItem @click="themeStore.setTheme('auto')"><Monitor class="mr-2 size-4"/> {{ t('common.system') }}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Language -->
          <DropdownMenu :modal="false">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon">
                <Languages class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem v-for="lang in languages" :key="lang.code" @click="setLocale(lang.code as any)">
                {{ lang.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Auth Buttons (Hidden in Static Mode) -->
          <template v-if="!isStatic">
            <div class="w-px h-4 bg-border mx-1"></div>

            <template v-if="auth.isAuthenticated">
              <Button variant="default" size="sm" class="font-bold rounded-full" @click="router.push('/dashboard')">
                <LayoutDashboard class="size-4 mr-2" />
                {{ t('dashboard.title') }}
              </Button>
            </template>
            <template v-else>
              <Button variant="default" size="sm" class="font-bold rounded-full" @click="router.push('/login')">
                <LogIn class="size-4 mr-2" />
                {{ t('auth.signIn') }}
              </Button>
            </template>
          </template>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="py-6 border-t border-border/40 text-center text-xs text-muted-foreground">
      <div class="container">
        {{ server.meta?.Copyright }}
      </div>
    </footer>
  </div>
</template>
