<script setup lang="ts">
import { ref, computed, onMounted, provide, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import { type OrganizationDto } from '@/api/types';
import AssetView from '@/components/ui/AssetView.vue';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, Users, Edit3, FolderGit2, Image as ImageIcon } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const ui = useUIStore();

const org = ref<OrganizationDto | null>(null);
const isLoading = ref(true);

// Get accountName from route params
const accountName = computed(() => route.params.accountName as string);

// Determine active tab based on current route name
const activeTab = computed({
  get: () => {
    if (route.name === 'org-settings') return 'settings';
    if (route.name === 'org-members') return 'members';
    if (route.name === 'org-resource-manager') {
      if (route.params.resource === 'projects') return 'projects';
      if (route.params.resource === 'gallery') return 'gallery';
    }
    return 'edit';
  },
  set: (val) => {
    switch(val) {
      case 'settings': router.push({ name: 'org-settings' }); break;
      case 'members': router.push({ name: 'org-members' }); break;
      case 'projects': router.push({ name: 'org-resource-manager', params: { resource: 'projects' } }); break;
      case 'gallery': router.push({ name: 'org-resource-manager', params: { resource: 'gallery' } }); break;
      default: router.push({ name: 'org-edit' });
    }
  }
});

const fetchOrg = async () => {
  isLoading.value = true;
  try {
    // Fetch org details (Dashboard endpoint returns OrganizationDto with MyRole)
    org.value = await httpClient<OrganizationDto>(`/orgs/${accountName.value}`);
  } catch (e: any) {
    ui.notify(e.message || 'Failed to load organization', 'error');
    router.push('/dashboard');
  } finally {
    isLoading.value = false;
  }
};

// Provide org context to children
provide('orgContext', org);
provide('refreshOrg', fetchOrg);

watch(accountName, fetchOrg, { immediate: true });
</script>

<template>
  <div class="max-w-5xl mx-auto pb-10 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="router.push('/dashboard')" class="rounded-full">
        <ArrowLeft class="size-5" />
      </Button>

      <div v-if="isLoading" class="h-12 w-48 bg-muted animate-pulse rounded-lg"></div>
      <div v-else-if="org" class="flex items-center gap-3">
        <div class="size-12 rounded-lg border bg-muted overflow-hidden">
          <AssetView :asset="org.Avatar" :fallback-name="org.DisplayName" class-name="w-full h-full" />
        </div>
        <div>
          <h1 class="text-2xl font-black tracking-tight">{{ org.DisplayName }}</h1>
          <p class="text-sm text-muted-foreground">@{{ org.AccountName }} • {{ org.MyRole }}</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="w-full justify-start overflow-x-auto">
        <TabsTrigger value="edit" class="gap-2"><Edit3 class="size-4" /> {{ t('organization.profile') }}</TabsTrigger>
        <TabsTrigger value="projects" class="gap-2"><FolderGit2 class="size-4" /> {{ t('dashboard.projects') }}</TabsTrigger>
        <TabsTrigger value="gallery" class="gap-2"><ImageIcon class="size-4" /> {{ t('dashboard.gallery') }}</TabsTrigger>
        <TabsTrigger value="members" class="gap-2"><Users class="size-4" /> {{ t('organization.members') }}</TabsTrigger>

        <!-- Settings only for Admin/Owner -->
        <TabsTrigger
            v-if="org && (org.MyRole === 'Owner' || org.MyRole === 'Admin')"
            value="settings"
            class="gap-2 ml-auto"
        >
          <Settings class="size-4" /> {{ t('organization.settings') }}
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <!-- Content -->
    <div v-if="!isLoading">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>
