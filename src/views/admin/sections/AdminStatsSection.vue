<script setup lang="ts">
import { useI18n } from '@/i18n';
import {type SystemStatusDto} from '@/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bell, Key, Activity, Shield, Image } from 'lucide-vue-next';

defineProps<{ status: SystemStatusDto }>();
const { t } = useI18n();

// const typeLabel = (statusKey: string): string => {
//   switch (statusKey) {
//     case 'Personal': return t('admin.typePersonal');
//     case 'Organization': return t('admin.typeOrganization');
//     case 'Application': return t('admin.typeApplication');
//     case 'System': return t('admin.typeSystem');
//     case 'Service': return t('admin.typeService');
//   }
//   return t(`${statusKey}`);
// };

const statusLabel = (statusKey: string): string => {
  switch (statusKey) {
    case 'Active': return t('admin.statusActive');
    case 'PendingDeletion': return t('admin.statusPendingDeletion');
    case 'Banned': return t('admin.statusBanned');
    case 'Suspended': return t('admin.statusSuspended');
    case 'Deactivated': return t('admin.statusDeactivated');
  }
  return t(`${statusKey}`);
};

const visibilityLabel = (statusKey: string): string => {
  switch (statusKey) {
    case 'Public': return t('common.public');
    case 'Private': return t('common.private');
    case 'Protected': return t('common.protected');
    case 'MembersOnly': return t('common.membersOnly');
  }
  return t(`${statusKey}`);
};

const roleLabel = (roleKey: string): string => {
  switch (roleKey) {
    case 'Root': return t('admin.roleRoot');
    case 'Admin': return t('admin.roleAdmin');
    case 'User': return t('admin.roleUser');
  }
  return t(`${roleKey}`);
};
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
          <p class="text-xs text-muted-foreground">{{ t('common.accountTypePersonal') }}: {{ status.TotalPersonalProfileCount }} / {{ t('common.accountTypeOrganization') }}: {{ status.TotalOrganizationCount }}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">{{ t('admin.refreshTokens') }}</CardTitle>
          <Key class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-black">{{ status.ActiveRefreshTokenCount }}</div>
          <p class="text-xs text-muted-foreground">{{ t('common.total') }}: {{ status.TotalRefreshTokenCount }} / {{ t('common.expired') }}: {{ status.ExpiredRefreshTokenCount }}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">{{ t('common.notifications') }}</CardTitle>
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

    <!-- Detailed Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Accounts by Status -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">{{ t('admin.accountsByStatus') }}</CardTitle>
          <Shield class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div v-for="(count, statusKey) in status.AccountsByStatus" :key="statusKey" class="flex justify-between text-sm">
              <span class="text-muted-foreground">{{ statusLabel(statusKey) }}</span>
              <span class="font-medium">{{ count }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Accounts by Role -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">{{ t('admin.accountsByRole') }}</CardTitle>
          <Users class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div v-for="(count, roleKey) in status.AccountsByRole" :key="roleKey" class="flex justify-between text-sm">
              <span class="text-muted-foreground">{{ roleLabel(roleKey) }}</span>
              <span class="font-medium">{{ count }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Assets -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">{{ t('admin.assets') }}</CardTitle>
          <Image class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ t('admin.totalAccountAssets') }}</span>
              <span class="font-medium">{{ status.TotalAccountAssetCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ t('admin.totalSystemAssets') }}</span>
              <span class="font-medium">{{ status.TotalSystemAssetCount }}</span>
            </div>
            <div v-if="status.AccountAssetsByVisibility" class="pt-2 border-t space-y-1">
              <div class="text-xs text-muted-foreground mb-1">{{ t('admin.byVisibility') }}:</div>
              <div v-for="(count, visibility) in status.AccountAssetsByVisibility" :key="visibility" class="flex justify-between">
                <span class="text-muted-foreground">{{ visibilityLabel(visibility) }}</span>
                <span class="font-medium">{{ count }}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
