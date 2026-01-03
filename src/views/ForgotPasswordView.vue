<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
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
  Languages, ChevronDown, Check, AlertCircle,
  Mail, Lock, ShieldCheck, ArrowLeft
} from 'lucide-vue-next';

const router = useRouter();
const { t, setLocale, locale } = useI18n();
const server = useServerStore();
const themeStore = useThemeStore();
const auth = useAuthStore();
const ui = useUIStore();

// Form State
const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  code: ''
});

const isLoading = ref(false);
const isSendingCode = ref(false);
const countdown = ref(0);
let timer: number | null = null;

// Feature flags
const isEmailEnabled = computed(() => server.features?.Email === true);

/**
 * Handle Sending Reset Verification Code
 */
async function handleSendCode() {
  if (!form.value.email || isSendingCode.value) return;

  isSendingCode.value = true;
  try {
    await auth.sendCode({
      Email: form.value.email,
      Type: 'ResetPassword'
    });
    ui.notify(t('auth.codeSent'), 'success');

    countdown.value = 60;
    timer = window.setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0 && timer) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (e: any) {
    const errorMsg = e.message || t('auth.sendCodeFailed');
    ui.notify(errorMsg, 'error');
  } finally {
    isSendingCode.value = false;
  }
}

/**
 * Handle Reset Password Action
 */
async function handleResetPassword() {
  if (!isEmailEnabled.value) return;

  if (form.value.password !== form.value.confirmPassword) {
    ui.notify(t('auth.passwordMismatch'), 'error');
    return;
  }

  isLoading.value = true;
  try {
    await auth.resetPassword({
      Email: form.value.email,
      NewPassword: form.value.password,
      Code: form.value.code
    });

    ui.notify(t('auth.resetPasswordSuccess'), 'success');
    await router.push('/login');
  } catch (e: any) {
    const errorMsg = e.message || t('auth.resetPasswordFailed');
    ui.notify(errorMsg, 'error');
  } finally {
    isLoading.value = false;
  }
}

const goToLogin = () => router.push('/login');

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const themeOptions = [
  { mode: 'light', icon: Sun, label: t('common.light') },
  { mode: 'dark', icon: Moon, label: t('common.dark') },
  { mode: 'auto', icon: Monitor, label: t('common.system') }
] as const;

const languages = [
  { code: 'zh', label: '简体中文' },
  { code: 'en', label: 'English' }
];
</script>

<template>
  <div class="forgot-password-page-wrapper">
    <!-- Background Layers -->
    <div class="fixed inset-0 bg-background transition-colors duration-500 -z-10">
      <div class="absolute inset-0 bg-linear-to-tr from-brand-blue/5 via-transparent to-brand-purple/5"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
    </div>

    <div class="min-h-screen flex flex-col items-center justify-center p-6 relative">

      <!-- Top Controls -->
      <div class="absolute top-8 right-8 flex items-center gap-2">
        <Button variant="ghost" size="sm" class="gap-2 rounded-full px-4 border border-border/40" @click="goToLogin">
          <ArrowLeft class="size-3.5 opacity-60" />
          <span class="text-xs font-bold">{{ t('auth.backToLogin') }}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="sm" class="gap-2 rounded-full px-4 border border-border/40">
              <Languages class="size-3.5 opacity-60" />
              <span class="text-xs font-bold">{{ languages.find(l => l.code === locale)?.label }}</span>
              <ChevronDown class="size-3 opacity-40" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-40">
            <DropdownMenuItem v-for="lang in languages" :key="lang.code" @click="setLocale(lang.code as any)" class="justify-between">
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
            <DropdownMenuItem v-for="opt in themeOptions" :key="opt.mode" @click="themeStore.setTheme(opt.mode)" class="gap-2">
              <component :is="opt.icon" class="size-3.5 opacity-60" />
              {{ opt.label }}
              <Check v-if="themeStore.theme === opt.mode" class="size-3 ml-auto text-brand-blue" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Branding Section -->
      <div class="flex flex-col items-center text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div class="size-16 rounded-3xl bg-white dark:bg-zinc-900 border border-border/50 shadow-xl p-1 mb-4 overflow-hidden">
          <AssetView :asset="server.meta?.Logo" :fallback-name="server.meta?.SiteName" class-name="w-full h-full rounded-2xl" />
        </div>
        <h1 class="text-2xl font-black tracking-tight text-foreground">{{ t('auth.resetPassword') }}</h1>
        <p class="text-muted-foreground mt-1.5 text-sm font-medium">{{ server.meta?.SiteName }}</p>
      </div>

      <!-- Reset Card -->
      <Card class="w-full max-w-110 glass-card border-none shadow-2xl rounded-4xl overflow-hidden">
        <CardContent class="p-10">

          <!-- Email Disabled Warning -->
          <div v-if="!isEmailEnabled" class="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex gap-4 text-destructive mb-2">
            <AlertCircle class="size-5 shrink-0" />
            <div class="text-xs font-bold leading-relaxed uppercase">
              {{ t('auth.emailDisabled') }}
            </div>
          </div>

          <form v-else @submit.prevent="handleResetPassword" class="space-y-5">
            <!-- Email -->
            <div class="space-y-2">
              <Label class="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">{{ t('common.email') }}</Label>
              <div class="relative">
                <Mail class="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                <Input
                    v-model="form.email"
                    type="email"
                    class="h-12 pl-11 rounded-xl bg-muted/50 border-none focus:bg-background transition-all shadow-none"
                    placeholder="name@example.com"
                    required
                />
              </div>
            </div>

            <!-- New Password -->
            <div class="space-y-2">
              <Label class="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">{{ t('auth.newPassword') }}</Label>
              <div class="relative">
                <Lock class="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                <Input
                    v-model="form.password"
                    type="password"
                    class="h-12 pl-11 rounded-xl bg-muted/50 border-none focus:bg-background transition-all shadow-none"
                    placeholder="••••••••"
                    required
                />
              </div>

              <div class="space-y-2">
                <Label class="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">{{ t('auth.confirmPassword') }}</Label>
                <div class="relative">
                  <Lock class="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                  <Input
                      v-model="form.confirmPassword"
                      type="password"
                      class="h-12 pl-11 rounded-xl bg-muted/50 border-none focus:bg-background transition-all shadow-none"
                      placeholder="••••••••"
                      required
                  />
                </div>
              </div>
            </div>

            <!-- Verification Code -->
            <div class="space-y-2">
              <Label class="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">{{ t('auth.verificationCode') }}</Label>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <ShieldCheck class="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                  <Input
                      v-model="form.code"
                      class="h-12 pl-11 rounded-xl bg-muted/50 border-none focus:bg-background transition-all shadow-none"
                      placeholder="000000"
                      required
                  />
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    class="h-12 px-4 rounded-xl font-bold text-xs"
                    :disabled="countdown > 0 || isSendingCode || !form.email"
                    @click="handleSendCode"
                >
                  <Loader2 v-if="isSendingCode" class="size-3 animate-spin mr-2" />
                  {{ countdown > 0 ? `${countdown}s` : t('auth.sendCode') }}
                </Button>
              </div>
            </div>

            <div class="pt-4">
              <Button
                  type="submit"
                  class="w-full h-12 rounded-xl bg-foreground text-background font-black hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-foreground/10"
                  :disabled="isLoading"
              >
                <Loader2 v-if="isLoading" class="size-4 animate-spin mr-2" />
                {{ t('auth.resetPassword') }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <footer class="mt-12 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em]">
        {{ server.meta?.Copyright }}
      </footer>
    </div>
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
