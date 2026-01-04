<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client.ts';
import { useUIStore } from '@/stores/ui.ts';
import {
  type OrganizationDto,
  MemberRole,
  AccountStatus
} from '@/api/types';

// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import AssetView from '@/components/ui/AssetView.vue';
import {
  Building2, Users, Settings, ArrowLeft,
  LayoutDashboard, ShieldAlert, FolderGit2,
  Image as ImageIcon
} from 'lucide-vue-next';

// Lazy load sub-components
const OrgProfileEditor = defineAsyncComponent(() => import('@/components/org/OrgProfileEditor.vue'));
const OrgMembers = defineAsyncComponent(() => import('@/components/org/OrgMembers.vue'));
const OrgSettings = defineAsyncComponent(() => import('@/components/org/OrgSettings.vue'));
const ResourceManager = defineAsyncComponent(() => import('@/views/ResourceManager.vue'));

const props = defineProps<{ accountName: string }>();

const { t } = useI18n();
const ui = useUIStore();
const router = useRouter();

const isLoading = ref(true);
const org = ref<OrganizationDto | null>(null);
const activeTab = ref('profile');

const isOwner = computed(() => org.value?.MyRole === MemberRole.Owner);
const isAdmin = computed(() => org.value?.MyRole === MemberRole.Admin || isOwner.value);

const apiPrefix = computed(() => `/orgs/${props.accountName}`);

const fetchOrg = async () => {
  isLoading.value = true;
  try {
    org.value = await httpClient<OrganizationDto>(`/orgs/${props.accountName}`);
  } catch (e: any) {
    ui.notify(e.message || 'Failed to load organization', 'error');
    router.push('/dashboard');
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchOrg);

// Watch props in case user switches between orgs directly
watch(() => props.accountName, fetchOrg);
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 pb-10">
    <!-- Header -->
    <div v-if="org" class="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="router.push('/dashboard')" class="rounded-full shrink-0">
          <ArrowLeft class="size-5" />
        </Button>

        <div class="size-14 rounded-xl border bg-muted overflow-hidden shrink-0">
          <AssetView :asset="org.Avatar" :fallback-name="org.DisplayName" class-name="w-full h-full object-cover" />
        </div>

        <div>
          <h1 class="text-2xl font-black tracking-tight flex items-center gap-2">
            {{ org.DisplayName }}
            <Badge v-if="org.Status !== AccountStatus.Active" variant="destructive" class="text-[10px] h-5">
              {{ t('dashboard.accountStatus') }}: {{ org.Status }}
            </Badge>
          </h1>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <span class="font-mono">@{{ org.AccountName }}</span>
            <Separator orientation="vertical" class="h-3" />
            <Badge variant="outline" class="text-[10px] h-5 font-bold uppercase tracking-wider">
              {{ isOwner ? t('organization.roleOwner') : isAdmin ? t('organization.roleAdmin') : t('organization.roleMember') }}
            </Badge>
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <Button variant="outline" @click="router.push(`/${org.AccountName}`)">
          {{ t('common.viewAll') }}
        </Button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-4 pt-4">
      <div class="h-32 bg-muted rounded-xl animate-pulse"></div>
    </div>

    <!-- Main Content -->
    <div v-else-if="org" class="animate-in fade-in slide-in-from-bottom-4">
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid grid-cols-2 md:grid-cols-5 w-full md:w-auto mb-6 h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="profile" class="rounded-lg data-[state=active]:bg-background py-2">
            <LayoutDashboard class="size-4 mr-2" /> {{ t('organization.profile') }}
          </TabsTrigger>
          <TabsTrigger value="projects" class="rounded-lg data-[state=active]:bg-background py-2">
            <FolderGit2 class="size-4 mr-2" /> {{ t('dashboard.projects') }}
          </TabsTrigger>
          <TabsTrigger value="resources" class="rounded-lg data-[state=active]:bg-background py-2">
            <ImageIcon class="size-4 mr-2" /> {{ t('dashboard.resources') }}
          </TabsTrigger>
          <TabsTrigger value="members" class="rounded-lg data-[state=active]:bg-background py-2">
            <Users class="size-4 mr-2" /> {{ t('organization.members') }}
          </TabsTrigger>
          <TabsTrigger value="settings" class="rounded-lg data-[state=active]:bg-background py-2" :disabled="!isAdmin">
            <Settings class="size-4 mr-2" /> {{ t('organization.settings') }}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" class="space-y-6">
          <OrgProfileEditor :account-name="accountName" :is-admin="isAdmin" @saved="fetchOrg" />
        </TabsContent>

        <TabsContent value="projects">
          <!-- Reuse Resource Manager with API Prefix -->
          <ResourceManager resource="projects" :api-prefix="apiPrefix" />
        </TabsContent>

        <TabsContent value="resources" class="space-y-8">
          <div class="grid gap-8">
            <ResourceManager resource="gallery" :api-prefix="apiPrefix" />
            <Separator />
            <ResourceManager resource="socials" :api-prefix="apiPrefix" />
            <Separator />
            <ResourceManager resource="contacts" :api-prefix="apiPrefix" />
            <Separator />
            <ResourceManager resource="sponsorships" :api-prefix="apiPrefix" />
            <!-- Orgs don't have Certificates in this spec, but if they did, add here -->
          </div>
        </TabsContent>

        <TabsContent value="members">
          <OrgMembers :account-name="accountName" :my-role="org.MyRole" />
        </TabsContent>

        <TabsContent value="settings" v-if="isAdmin">
          <OrgSettings :account-name="accountName" :my-role="org.MyRole" @deleted="router.push('/dashboard')" />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
