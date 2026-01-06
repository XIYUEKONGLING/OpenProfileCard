<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import type { ProfileDto, UpdateProfileRequestDto, OrganizationDto } from '@/api/types';
import { MemberRole } from '@/api/types';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer.vue';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Loader2, Save, AlertTriangle, ArrowLeft } from 'lucide-vue-next';

const props = defineProps<{
  accountName: string;
}>();

const emit = defineEmits(['saved']);
const router = useRouter();
const { t } = useI18n();
const ui = useUIStore();

// --- State ---
const isLoading = ref(true);
const isSaving = ref(false);
const orgId = ref<string | null>(null); // Store the GUID
const myRole = ref<MemberRole | null>(null);

const form = reactive<UpdateProfileRequestDto>({
  DisplayName: '',
  Description: '',
  Content: '',
  Location: '',
  TimeZone: '',
  Website: '',
  FoundedDate: '',
  Avatar: undefined,
  Background: undefined
});

// --- Computed ---
// Permission Check: Only Owner (2) and Admin (1) can edit
const canEdit = computed(() => {
  const role = myRole.value;
  return role === MemberRole.Owner || role === MemberRole.Admin;
});

// --- Actions ---
const loadData = async () => {
  isLoading.value = true;
  try {
    // 1. Fetch Organization Context to get GUID and Role
    // This detects permissions via API as requested
    const orgData = await httpClient<OrganizationDto>(`/orgs/${props.accountName}`);
    orgId.value = orgData.Id;
    myRole.value = orgData.MyRole;

    // 2. Fetch Profile Data using the GUID (@{guid})
    // Using GUID for operations as requested
    const profileData = await httpClient<ProfileDto>(`/orgs/@${orgId.value}/profile`);
    Object.assign(form, profileData);
  } catch (e: any) {
    ui.notify(e.message || 'Failed to load organization data', 'error');
    // If we can't load the org (e.g. not a member), redirect
    if (e.message?.includes('403') || e.message?.includes('404')) {
      router.push('/dashboard');
    }
  } finally {
    isLoading.value = false;
  }
};

const saveProfile = async () => {
  if (!orgId.value || !canEdit.value) return;

  isSaving.value = true;
  try {
    const payload = { ...form };
    // Handle date clearing
    if (payload.FoundedDate === '') (payload as any).FoundedDate = null;

    // Use GUID for the API call
    await httpClient(`/orgs/@${orgId.value}/profile`, {
      method: 'POST', // Full update semantics
      body: JSON.stringify(payload)
    });
    ui.notify(t('organization.saveSuccess'), 'success');
    emit('saved');
  } catch (e: any) {
    ui.notify(e.message || 'Failed to save', 'error');
  } finally {
    isSaving.value = false;
  }
};

onMounted(loadData);
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-2">
      <Button variant="ghost" size="icon" @click="router.back()" class="rounded-full">
        <ArrowLeft class="size-5" />
      </Button>
      <div>
        <h1 class="text-2xl font-black tracking-tight">{{ t('organization.profile') }}</h1>
        <p class="text-sm text-muted-foreground">@{{ accountName }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <Loader2 class="size-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Permission Denied State -->
    <Card v-else-if="!canEdit" class="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <CardContent class="p-8 flex flex-col items-center text-center gap-4">
        <div class="size-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <AlertTriangle class="size-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 class="text-lg font-bold text-orange-900 dark:text-orange-100">{{ t('organization.noEditPermission') }}</h3>
          <p class="text-sm text-orange-700 dark:text-orange-300 mt-2 max-w-md">
            {{ t('organization.noEditPermissionDesc') }}
          </p>
        </div>
        <Button variant="outline" @click="router.back()">
          {{ t('common.back') }}
        </Button>
      </CardContent>
    </Card>

    <!-- Edit Form (Tab Layout) -->
    <form v-else @submit.prevent="saveProfile" class="space-y-6">
      <Tabs default-value="basic" class="w-full">
        <!-- Tabs List -->
        <TabsList class="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none gap-6 mb-6 overflow-x-auto no-scrollbar">
          <TabsTrigger value="basic" class="rounded-md border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">
            {{ t('profile.basicInfo') }}
          </TabsTrigger>
          <TabsTrigger value="visuals" class="rounded-md border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">
            {{ t('profile.visuals') }}
          </TabsTrigger>
          <TabsTrigger value="content" class="rounded-md border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">
            {{ t('profile.content') }}
          </TabsTrigger>
        </TabsList>

        <!-- Tab Content: Basic Info -->
        <TabsContent value="basic" class="animate-in fade-in slide-in-from-bottom-2 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{{ t('profile.basicInfo') }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label>{{ t('profile.displayName') }}</Label>
                <Input v-model="form.DisplayName" required />
              </div>
              <div class="space-y-2">
                <Label>{{ t('profile.bio') }}</Label>
                <Input v-model="form.Description" maxlength="200" />
              </div>
              <div class="space-y-2">
                <Label>{{ t('profile.location') }}</Label>
                <Input v-model="form.Location" />
              </div>
              <div class="space-y-2">
                <Label>{{ t('common.timeZone') }}</Label>
                <Input v-model="form.TimeZone" placeholder="e.g. UTC, Asia/Shanghai" />
              </div>
              <div class="space-y-2">
                <Label>{{ t('profile.website') }}</Label>
                <Input v-model="form.Website" placeholder="https://" />
              </div>
              <div class="space-y-2">
                <Label>{{ t('profile.foundedDate') }}</Label>
                <Input type="date" v-model="form.FoundedDate" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Tab Content: Visuals -->
        <TabsContent value="visuals" class="animate-in fade-in slide-in-from-bottom-2 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{{ t('profile.visuals') }}</CardTitle>
              <CardDescription>{{ t('profile.visualsDesc') }}</CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <AssetEditor v-model="form.Avatar" :label="t('profile.avatar')" />
              <AssetEditor v-model="form.Background" :label="t('profile.background')" />
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Tab Content: Markdown Content -->
        <TabsContent value="content">
          <Card class="overflow-hidden">
            <Tabs default-value="write" class="w-full">
              <div class="border-b bg-muted/30 px-6 py-2 flex items-center justify-between">
                <Label class="font-bold">{{ t('profile.content') }}</Label>
                <TabsList class="h-8">
                  <TabsTrigger value="write" class="text-xs">{{ t('profile.write') }}</TabsTrigger>
                  <TabsTrigger value="preview" class="text-xs">{{ t('profile.preview') }}</TabsTrigger>
                </TabsList>
              </div>
              <CardContent class="p-0">
                <TabsContent value="write" class="p-0 m-0 border-none">
                  <Textarea v-model="form.Content" class="min-h-100 rounded-none border-0 focus-visible:ring-0 resize-none p-6 font-mono text-sm leading-relaxed" :placeholder="t('profile.markdownPlaceholder')" />
                </TabsContent>
                <TabsContent value="preview" class="min-h-100 p-6 bg-muted/10">
                  <MarkdownRenderer v-if="form.Content" :content="form.Content" size="sm" />
                  <div v-else class="text-muted-foreground text-sm italic text-center pt-20">{{ t('profile.nothingToPreview') }}</div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </TabsContent>
      </Tabs>

      <div class="sticky bottom-4 flex justify-end pt-6 pointer-events-auto">
        <Button type="submit" size="lg" :disabled="isSaving" class="font-bold shadow-xl">
          <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
          <Save v-else class="mr-2 size-4" />
          {{ t('common.save') }}
        </Button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
