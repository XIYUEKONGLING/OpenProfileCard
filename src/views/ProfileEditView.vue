<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { httpClient } from '@/api/client';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer.vue';
import {
  type ProfileDto,
  type UpdateProfileRequestDto,
  AccountType
} from '@/api/types';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Loader2, Save, ArrowLeft, ExternalLink } from 'lucide-vue-next';

const { t } = useI18n();
const auth = useAuthStore();
const ui = useUIStore();
const router = useRouter();
const route = useRoute();

// --- State ---
const isLoading = ref(true);
const isSaving = ref(false);
const currentAccountType = ref<AccountType | null>(null);
const activeTab = ref('basic');

// Form Data
const form = reactive<UpdateProfileRequestDto>({
  DisplayName: '',
  Pronouns: '',
  Description: '',
  Content: '',
  Location: '',
  TimeZone: '',
  Website: '',
  JobTitle: '',
  CurrentCompany: '',
  CurrentSchool: '',
  Birthday: '',
  FoundedDate: '',
  Avatar: undefined,
  Background: undefined
});

// --- Computed ---
const isOrg = computed(() => currentAccountType.value === AccountType.Organization);
const isPersonal = computed(() => currentAccountType.value === AccountType.Personal);

// Watch Query Params
watch(() => route.query.tab, (newTab) => {
  if (newTab === 'content') activeTab.value = 'content';
  else if (newTab === 'visuals') activeTab.value = 'visuals';
  else activeTab.value = 'basic';
}, { immediate: true });

// --- Actions ---
const fetchData = async () => {
  isLoading.value = true;
  try {
    const data = await httpClient<ProfileDto>('/me/profile');
    currentAccountType.value = data.Type;
    Object.assign(form, data);
  } catch (error) {
    console.error(error);
    ui.notify(t('common.loading') + ' failed', 'error');
  } finally {
    isLoading.value = false;
  }
};

const saveProfile = async () => {
  isSaving.value = true;
  try {
    // Manually handle date clearing
    const payload = { ...form };
    if (payload.Birthday === '') (payload as any).Birthday = null;
    if (payload.FoundedDate === '') (payload as any).FoundedDate = null;

    await httpClient('/me/profile', { method: 'POST', body: JSON.stringify(payload) });
    ui.notify(t('profile.saveSuccess'), 'success');
    await auth.fetchMe();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to save', 'error');
  } finally {
    isSaving.value = false;
  }
};

const navigateToSettings = () => router.push('/dashboard/settings');

onMounted(() => fetchData());
</script>

<template>
  <div class="max-w-4xl mx-auto pb-10 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" @click="router.back()" class="rounded-full">
          <ArrowLeft class="size-5" />
        </Button>
        <div>
          <h1 class="text-2xl font-black tracking-tight">{{ t('profile.editProfile') }}</h1>
          <p class="text-muted-foreground text-sm">{{ auth.user?.AccountName }}</p>
        </div>
      </div>
      <Button @click="saveProfile" :disabled="isSaving || isLoading" class="font-bold min-w-24">
        <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
        <Save v-else class="mr-2 size-4" />
        {{ t('common.save') }}
      </Button>
    </div>

    <div v-if="isLoading" class="space-y-4">
      <div class="h-64 bg-muted rounded-xl animate-pulse"></div>
    </div>

    <div v-else class="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid w-full grid-cols-3 lg:w-100 mb-6">
          <TabsTrigger value="basic">{{ t('profile.basicInfo') }}</TabsTrigger>
          <TabsTrigger value="visuals">{{ t('profile.visuals') }}</TabsTrigger>
          <TabsTrigger value="content">{{ t('profile.content') }}</TabsTrigger>
        </TabsList>

        <!-- TAB: BASIC -->
        <TabsContent value="basic" class="space-y-6">
          <Card>
            <CardHeader>
              <div class="flex justify-between items-center">
                <CardTitle>{{ t('profile.basicInfo') }}</CardTitle>
                <Button variant="link" size="sm" class="h-auto p-0 text-xs text-muted-foreground gap-1" @click="navigateToSettings">
                  {{ t('profile.manageVisibility') }} <ExternalLink class="size-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <Label>{{ t('profile.displayName') }}</Label>
                <Input v-model="form.DisplayName" :placeholder="auth.user?.AccountName" />
              </div>
              <div class="space-y-2">
                <Label>{{ t('profile.pronouns') }}</Label>
                <Input v-model="form.Pronouns" placeholder="e.g. they/them" />
              </div>
              <div class="space-y-2 md:col-span-2">
                <Label>{{ t('profile.bio') }}</Label>
                <Input v-model="form.Description" :placeholder="t('profile.bio')" maxlength="200" />
                <p class="text-[10px] text-muted-foreground text-right">{{ form.Description?.length || 0 }}/200</p>
              </div>
              <div class="space-y-2">
                <Label>{{ t('profile.location') }}</Label>
                <Input v-model="form.Location" placeholder="City, Country" />
              </div>
              <div class="space-y-2">
                <Label>{{ t('common.timeZone') }}</Label>
                <Input v-model="form.TimeZone" placeholder="e.g. UTC, Asia/Shanghai" />
              </div>
              <div class="space-y-2 md:col-span-2">
                <Label>{{ t('profile.website') }}</Label>
                <Input v-model="form.Website" placeholder="https://" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{{ t('profile.details') }}</CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <template v-if="isPersonal">
                <div class="space-y-2">
                  <Label>{{ t('profile.jobTitle') }}</Label>
                  <Input v-model="form.JobTitle" placeholder="Software Engineer" />
                </div>
                <div class="space-y-2">
                  <Label>{{ t('profile.company') }}</Label>
                  <Input v-model="form.CurrentCompany" placeholder="Current Workplace" />
                </div>
                <div class="space-y-2">
                  <Label>{{ t('profile.school') }}</Label>
                  <Input v-model="form.CurrentSchool" placeholder="University / College" />
                </div>
                <div class="space-y-2">
                  <Label>{{ t('profile.birthday') }}</Label>
                  <!-- Use .value to bind properly, but handle empty string in save -->
                  <Input type="date" v-model="form.Birthday" />
                </div>
              </template>
              <template v-else-if="isOrg">
                <div class="space-y-2">
                  <Label>{{ t('profile.foundedDate') }}</Label>
                  <Input type="date" v-model="form.FoundedDate" />
                </div>
              </template>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- TAB: VISUALS -->
        <TabsContent value="visuals">
          <Card>
            <CardHeader>
              <CardTitle>{{ t('profile.visuals') }}</CardTitle>
              <CardDescription>{{ t('profile.visualsDesc') }}</CardDescription>
            </CardHeader>
            <CardContent class="space-y-8">
              <AssetEditor v-model="form.Avatar" :label="t('profile.avatar')" :description="t('profile.avatarDesc')" />
              <Separator />
              <AssetEditor v-model="form.Background" :label="t('profile.background')" :description="t('profile.backgroundDesc')" />
            </CardContent>
          </Card>
        </TabsContent>

        <!-- TAB: CONTENT -->
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
    </div>
  </div>
</template>
