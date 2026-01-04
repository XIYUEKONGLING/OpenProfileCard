<script setup lang="ts">
import { useI18n } from '@/i18n';
import type { SystemStatusDto } from '@/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bell, Key, Activity } from 'lucide-vue-next';

defineProps<{ status: SystemStatusDto }>();
const { t } = useI18n();
</script>

<template>
  <div class="space-y-6">
    <!-- Top Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">{{ t('admin.accounts') }}</CardTitle>
          <Users class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-black">{{ status.TotalAccountCount }}</div>
          <p class="text-xs text-muted-foreground">Personal: {{ status.TotalPersonalProfileCount }} / Orgs: {{ status.TotalOrganizationCount }}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">{{ t('admin.refreshTokens') }}</CardTitle>
          <Key class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-black">{{ status.ActiveRefreshTokenCount }}</div>
          <p class="text-xs text-muted-foreground">Total: {{ status.TotalRefreshTokenCount }} / Expired: {{ status.ExpiredRefreshTokenCount }}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">Notifications</CardTitle>
          <Bell class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-black">{{ status.TotalNotificationCount }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">{{ t('admin.serverTime') }}</CardTitle>
          <Activity class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-sm font-mono truncate">{{ new Date(status.ServerTimeUtc).toLocaleString() }}</div>
        </CardContent>
      </Card>
    </div>

    <!-- Detailed Breakdown (Optional Charts or Lists) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Placeholder for future charts -->
    </div>
  </div>
</template>
