<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '@/i18n';
import { useServerStore } from '@/stores/server';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import AssetView from '@/components/ui/AssetView.vue';
import { Loader2, Monitor, Sun, Moon, Check, ChevronDown, Languages } from 'lucide-vue-next';

const { t, setLocale, locale } = useI18n();
const server = useServerStore();
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
  } catch (e: any) {
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
  <div class="bg-mesh"></div>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative">

    <div class="absolute top-8 right-8 flex items-center gap-3">
      <!-- Language -->
      <div class="relative group">
        <button class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 text-xs font-bold transition-all">
          <Languages class="size-3.5" />
          {{ languages.find(l => l.code === locale)?.label }}
          <ChevronDown class="size-3 opacity-50" />
        </button>
        <div class="absolute right-0 mt-2 w-32 glass-card rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
          <button v-for="lang in languages" :key="lang.code"
                  @click="setLocale(lang.code as any)"
                  class="flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg hover:bg-foreground/5 transition-colors"
                  :class="{ 'text-brand-blue font-bold': locale === lang.code }"
          >
            {{ lang.label }}
            <Check v-if="locale === lang.code" class="size-3" />
          </button>
        </div>
      </div>

      <!-- Theme Switch -->
      <div class="flex bg-foreground/5 p-1 rounded-full border border-foreground/5">
        <button v-for="opt in themeOptions" :key="opt.mode"
                @click="server.setTheme(opt.mode)"
                class="p-1.5 rounded-full transition-all"
                :class="server.theme === opt.mode ? 'bg-background shadow-sm text-foreground' : 'text-foreground/40 hover:text-foreground/60'"
        >
          <component :is="opt.icon" class="size-3.5" />
        </button>
      </div>
    </div>

    <!-- Header -->
    <div class="flex flex-col items-center mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div class="size-20 mb-6 rounded-3xl glass-card p-0.5 shadow-2xl">
        <AssetView
            :asset="server.meta?.Logo"
            :fallback-name="server.meta?.SiteName"
            class-name="w-full h-full rounded-[22px]"
        />
      </div>
      <h1 class="text-3xl font-black tracking-tight mb-2">{{ server.meta?.SiteName }}</h1>
      <p class="text-sm font-medium text-foreground/40 max-w-70 leading-relaxed">
        {{ server.meta?.SiteDescription }}
      </p>
    </div>

    <!-- Login Card -->
    <Card class="w-full max-w-100 glass-card border-none p-1 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <CardContent class="p-8">
        <form @submit.prevent="handleLogin" class="space-y-6" :class="{ 'opacity-30 pointer-events-none': isStaticMode }">

          <div class="space-y-2">
            <Label class="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{{ t('common.username') }}</Label>
            <Input v-model="form.login" class="h-12 bg-foreground/5 border-transparent focus:bg-background transition-all rounded-xl px-4" placeholder="Email or username" required />
          </div>

          <div class="space-y-2">
            <div class="flex justify-between">
              <Label class="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{{ t('common.password') }}</Label>
              <button type="button" class="text-[10px] font-black uppercase text-brand-blue">{{ t('auth.forgotPassword') }}</button>
            </div>
            <Input v-model="form.password" type="password" class="h-12 bg-foreground/5 border-transparent focus:bg-background transition-all rounded-xl px-4" placeholder="••••••••" required />
          </div>

          <div class="pt-2 space-y-4">
            <Button type="submit" class="w-full h-12 rounded-xl primary-btn" :disabled="isLoading || isStaticMode">
              <Loader2 v-if="isLoading" class="size-4 animate-spin mr-2" />
              {{ t('auth.signIn') }}
            </Button>

            <Button v-if="!isStaticMode" variant="ghost" class="w-full h-12 rounded-xl border border-foreground/5 hover:bg-foreground/5 font-bold">
              {{ t('auth.register') }}
            </Button>
          </div>
        </form>

        <div v-if="isStaticMode" class="mt-4 p-4 rounded-xl bg-destructive/10 text-destructive text-[11px] font-bold leading-tight flex gap-3">
          <Monitor class="size-4 shrink-0" />
          READ-ONLY MODE: LOGIN IS DISABLED BY SERVER CONFIGURATION.
        </div>
      </CardContent>
    </Card>

    <!-- Copyright -->
    <footer class="mt-12 text-[10px] font-bold opacity-20 tracking-[0.2em] uppercase">
      {{ server.meta?.Copyright }}
    </footer>
  </div>
</template>
