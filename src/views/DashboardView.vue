<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useI18n } from '@/i18n';
import {
  Users,
  Eye,
  TrendingUp,
  Plus
} from 'lucide-vue-next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const auth = useAuthStore();
const { t } = useI18n();

const stats = [
  { label: 'Total Views', value: '1,284', icon: Eye, color: 'text-blue-500' },
  { label: t('dashboard.followers'), value: '42', icon: Users, color: 'text-purple-500' },
  { label: 'Engagement', value: '+12%', icon: TrendingUp, color: 'text-emerald-500' },
];
</script>

<template>
  <div class="space-y-10">
    <!-- Welcome Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h2 class="text-3xl font-black tracking-tight">Welcome back, {{ auth.user?.Username }}!</h2>
        <p class="text-muted-foreground font-medium mt-1">Here's what's happening with your profile cards.</p>
      </div>
      <Button class="rounded-xl h-12 px-6 bg-foreground text-background font-black hover:opacity-90 transition-all gap-2">
        <Plus class="size-5" />
        Create New Card
      </Button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card v-for="stat in stats" :key="stat.label" class="glass-card border-none rounded-3xl overflow-hidden shadow-sm">
        <CardContent class="p-6 flex items-center gap-6">
          <div :class="['p-4 rounded-2xl bg-muted/50', stat.color]">
            <component :is="stat.icon" class="size-6" />
          </div>
          <div>
            <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ stat.label }}</p>
            <p class="text-2xl font-black mt-1">{{ stat.value }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Placeholder for "My Cards" or "Recent Activity" -->
    <div class="space-y-6">
      <h3 class="text-xl font-black tracking-tight">{{ t('dashboard.myCards') }}</h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Card Placeholder -->
        <div v-for="i in 2" :key="i" class="h-64 rounded-4xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 transition-colors hover:bg-muted/10">
          <p class="font-bold text-sm">No cards found in this section</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(40px);
  border: 1px solid var(--glass-border);
}
</style>
