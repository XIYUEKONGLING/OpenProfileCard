<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '@/i18n';
import { useServerStore } from '@/stores/server';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import AssetView from '@/components/ui/AssetView.vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Icons
import {
  Loader2, Sun, Moon, Monitor,
  Languages, ChevronDown, Check, AlertCircle
} from 'lucide-vue-next';

const { t, setLocale, locale } = useI18n();
const server = useServerStore();
const themeStore = useThemeStore();
const auth = useAuthStore();
const ui = useUIStore();

const form = ref({ login: '', password: '' });
const isLoading = ref(false);

const isStaticMode = computed(() => server.info?.Static === true && server.info?.Dynamic === false);

async function handleLogin() {
  if (isStaticMode.value) return;
  isLoading.value = true;
  try {
    await auth.login({
      Login: form.value.login,
      Password: form.value.password
    });
    ui.notify(t('common.success'), 'success');
  } catch (e) {
    ui.notify(t('auth.loginFailed'), 'error');
  } finally {
    isLoading.value = false;
  }
}

const themeOptions = [
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
  { mode: 'auto', icon: Monitor, label: 'System' }
] as const;

const languages = [
  { code: 'zh', label: '简体中文' },
  { code: 'en', label: 'English' }
];
</script>

<template>
  <div class="fixed inset-0 bg-background transition-colors duration-500 -z-10">
    <div class="absolute inset-0 bg-linear-to-tr from-brand-blue/5 via-transparent to-brand-purple/5"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
  </div>

  <div class="min-h-screen flex flex-col items-center justify-center p-6 relative">

    <!-- Controls Section -->
    <div class="absolute top-8 right-8 flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="gap-2 rounded-full px-4 border border-border/40">
            <Languages class="size-3.5 opacity-60" />
            <span class="text-xs font-bold">{{ languages.find(l => l.code === locale)?.label }}</span>
            <ChevronDown class="size-3 opacity-40" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-40">
          <DropdownMenuItem
              v-for="lang in languages" :key="lang.code"
              @click="setLocale(lang.code as any)"
              class="justify-between"
          >
            {{ lang.label }}
            <Check v-if="locale === lang.code" class="size-3 text-brand-blue" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="rounded-full border border-border/40 size-9">
            <Sun v-if="themeStore.theme === 'light'" class="size-4" />
            <Moon v-else-if="themeStore.theme === 'dark'" class="size-4" />
            <Monitor v-else class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-36">
          <DropdownMenuItem
              v-for="opt in themeOptions" :key="opt.mode"
              @click="themeStore.setTheme(opt.mode)"
              class="gap-2"
          >
            <component :is="opt.icon" class="size-3.5 opacity-60" />
            {{ opt.label }}
            <Check v-if="themeStore.theme === opt.mode" class="size-3 ml-auto text-brand-blue" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Branding Section -->
    <div class="flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div class="size-24 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-border/50 shadow-2xl p-1 mb-6 overflow-hidden">
        <AssetView
            :asset="server.meta?.Logo"
            :fallback-name="server.meta?.SiteName"
            class-name="w-full h-full rounded-[2.2rem]"
        />
      </div>
      <h1 class="text-3xl font-black tracking-tight text-foreground">{{ server.meta?.SiteName }}</h1>
      <p class="text-muted-foreground mt-2 font-medium max-w-[320px]">
        {{ server.meta?.SiteDescription }}
      </p>
    </div>

    <!-- Login Card -->
    <Card class="w-full max-w-105 glass-card border-none shadow-2xl rounded-4xl overflow-hidden">
      <CardContent class="p-10">

        <div v-if="isStaticMode" class="mb-8 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex gap-4 text-destructive">
          <AlertCircle class="size-5 shrink-0" />
          <div class="text-xs font-bold leading-relaxed uppercase">
            System Notice: Static Mode Active. Login is restricted.
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6" :class="{ 'opacity-20 pointer-events-none': isStaticMode }">
          <div class="space-y-2.5">
            <Label class="text-[10px] uppercase font-black tracking-widest opacity-40 ml-1">{{ t('common.username') }}</Label>
            <Input
                v-model="form.login"
                class="h-12 rounded-xl bg-muted/50 border-none focus:bg-background transition-all px-4"
                placeholder="Username"
                required
            />
          </div>

          <div class="space-y-2.5">
            <div class="flex justify-between items-center px-1">
              <Label class="text-[10px] uppercase font-black tracking-widest opacity-40">{{ t('common.password') }}</Label>
              <button type="button" class="text-[10px] font-black uppercase text-brand-blue hover:underline">{{ t('auth.forgotPassword') }}</button>
            </div>
            <Input
                v-model="form.password"
                type="password"
                class="h-12 rounded-xl bg-muted/50 border-none focus:bg-background transition-all px-4"
                placeholder="••••••••"
                required
            />
          </div>

          <div class="pt-4 space-y-4">
            <Button
                type="submit"
                class="w-full h-12 rounded-xl bg-foreground text-background font-black hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-foreground/10"
                :disabled="isLoading || isStaticMode"
            >
              <Loader2 v-if="isLoading" class="size-4 animate-spin mr-2" />
              {{ t('auth.signIn') }}
            </Button>

            <Button
                v-if="!isStaticMode"
                variant="outline"
                type="button"
                class="w-full h-12 rounded-xl border-border/60 font-bold hover:bg-muted/50 transition-all"
            >
              {{ t('auth.register') }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <footer class="mt-12 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em]">
      {{ server.meta?.Copyright }}
    </footer>
  </div>
</template>

<style scoped>
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border: 1px solid var(--glass-border);
}
</style>
