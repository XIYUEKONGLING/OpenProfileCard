<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import type { SystemStatusDto, SystemSettingDto, SiteMetadataDto } from '@/api/types';

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, BarChart3, Globe, Settings2, Users } from 'lucide-vue-next';

// Sub-components
import AdminStatsSection from '@/views/admin/sections/AdminStatsSection.vue';
import AdminMetaSection from '@/views/admin/sections/AdminMetaSection.vue';
import AdminSettingsSection from '@/views/admin/sections/AdminSettingsSection.vue';

const { t } = useI18n();
const ui = useUIStore();

const isLoading = ref(true);
const status = ref<SystemStatusDto | null>(null);
const settings = ref<SystemSettingDto[]>([]);
const meta = ref<SiteMetadataDto | null>(null);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [statusData, settingsData, metaData] = await Promise.all([
      httpClient<SystemStatusDto>('/admin/system/status'),
      httpClient<SystemSettingDto[]>('/admin/system-settings'),
      httpClient<SiteMetadataDto>('/meta')
    ]);
    status.value = statusData;
    settings.value = settingsData;
    meta.value = metaData;
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchData);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-brand-blue/10 rounded-xl">
          <ShieldCheck class="size-6 text-brand-blue" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">{{ t('admin.title') }}</h1>
          <p class="text-muted-foreground text-sm">OpenProfileServer Control Panel</p>
        </div>
      </div>
      <Button variant="outline" size="sm" @click="fetchData" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="mr-2 size-4 animate-spin" />
        {{ t('common.refresh') || 'Refresh' }}
      </Button>
    </div>

    <Tabs default-value="stats" class="w-full">
      <TabsList class="grid w-full grid-cols-4 lg:w-200">
        <TabsTrigger value="stats"><BarChart3 class="size-4 mr-2" /> {{ t('admin.stats') }}</TabsTrigger>
        <TabsTrigger value="meta"><Globe class="size-4 mr-2" /> {{ t('admin.siteMeta') }}</TabsTrigger>
        <TabsTrigger value="settings"><Settings2 class="size-4 mr-2" /> {{ t('admin.systemSettings') }}</TabsTrigger>
        <TabsTrigger value="users"><Users class="size-4 mr-2" /> {{ t('admin.userManagement') }}</TabsTrigger>
      </TabsList>

      <div v-if="isLoading" class="py-20 flex justify-center">
        <Loader2 class="size-8 animate-spin text-muted-foreground" />
      </div>

      <template v-else>
        <TabsContent value="stats" class="mt-6">
          <AdminStatsSection v-if="status" :status="status" />
        </TabsContent>

        <TabsContent value="meta" class="mt-6">
          <AdminMetaSection v-if="meta" :initial-meta="meta" @updated="fetchData" />
        </TabsContent>

        <TabsContent value="settings" class="mt-6">
          <AdminSettingsSection :settings="settings" @updated="fetchData" />
        </TabsContent>

        <TabsContent value="users" class="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{{ t('admin.userManagement') }}</CardTitle>
              <CardDescription>Placeholder for advanced user management.</CardDescription>
            </CardHeader>
            <CardContent class="h-64 flex items-center justify-center border-2 border-dashed m-6 rounded-xl">
              <p class="text-muted-foreground italic">User Management Module Coming Soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </template>
    </Tabs>
  </div>
</template>
