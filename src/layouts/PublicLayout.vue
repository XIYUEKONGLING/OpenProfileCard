<script setup lang="ts">
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

const languages = [
  { code: 'zh', label: '简体中文' },
  { code: 'en', label: 'English' }
];
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
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

          <!-- Theme/Lang (Simplified) -->
          <Button variant="ghost" size="icon" @click="themeStore.setTheme(themeStore.theme === 'dark' ? 'light' : 'dark')">
            <Sun v-if="themeStore.theme === 'light'" class="size-4" />
            <Moon v-else class="size-4" />
          </Button>

          <DropdownMenu>
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

          <div class="w-px h-4 bg-border mx-1"></div>

          <!-- Auth Buttons -->
          <template v-if="auth.isAuthenticated">
            <Button variant="default" size="sm" class="font-bold rounded-full" @click="router.push('/dashboard')">
              <LayoutDashboard class="size-4 mr-2" />
              {{ t('dashboard.title') }}
            </Button>
          </template>
          <template v-else>
            <Button variant="ghost" size="sm" class="font-bold" @click="router.push('/login')">
              {{ t('auth.signIn') }}
            </Button>
            <Button variant="default" size="sm" class="font-bold rounded-full" @click="router.push('/register')">
              {{ t('auth.signUp') }}
            </Button>
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
