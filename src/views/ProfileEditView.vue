<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { httpClient } from '@/api/client';
import { renderMarkdown } from '@/lib/markdown';
import {
  type ProfileDto,
  type UpdateProfileRequestDto,
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
import { Loader2, Save, ArrowLeft } from 'lucide-vue-next';

const { t } = useI18n();
const auth = useAuthStore();
const ui = useUIStore();
const router = useRouter();

// --- State ---
const isLoading = ref(true);
const isSaving = ref(false);

// Form Data
const form = reactive<UpdateProfileRequestDto>({
  DisplayName: '',
  Pronouns: '',
  Description: '',
  Content: '',
  Location: '',
  Website: '',
  // Personal
  JobTitle: '',
  CurrentCompany: '',
  CurrentSchool: '',
  Birthday: '',
  // Org
  FoundedDate: '',
  // Assets
  Avatar: undefined,
  Background: undefined
});

// --- Computed ---
const isOrg = computed(() => auth.user?.Type === 'Organization');
const isPersonal = computed(() => auth.user?.Type === 'Personal');

const renderedContent = computed(() => renderMarkdown(form.Content || ''));

// --- Actions ---

const fetchData = async () => {
  isLoading.value = true;
  try {
    const data = await httpClient<ProfileDto>('/me/profile');

    // Map API data to Form
    form.DisplayName = data.DisplayName;
    form.Pronouns = data.Pronouns;
    form.Description = data.Description;
    form.Content = data.Content;
    form.Location = data.Location;
    form.Website = data.Website;

    form.JobTitle = data.JobTitle;
    form.CurrentCompany = data.CurrentCompany;
    form.CurrentSchool = data.CurrentSchool;
    form.Birthday = data.Birthday; // string "yyyy-MM-dd"

    form.FoundedDate = data.FoundedDate;

    // Directly assign AssetDto objects
    form.Avatar = data.Avatar;
    form.Background = data.Background;

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
    // Send full update (POST)
    await httpClient('/me/profile', {
      method: 'POST',
      body: JSON.stringify(form)
    });

    ui.notify(t('profile.saveSuccess'), 'success');

    // Refresh local user data (in case avatar/name changed in navbar)
    await auth.fetchMe();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to save', 'error');
  } finally {
    isSaving.value = false;
  }
};

const goBack = () => router.back();

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="max-w-4xl mx-auto pb-10 space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" @click="goBack" class="rounded-full">
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

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div class="h-64 bg-muted rounded-xl animate-pulse"></div>
      <div class="h-32 bg-muted rounded-xl animate-pulse"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-8 animate-in fade-in slide-in-from-bottom-4">

      <!-- Section: Visuals -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('profile.visuals') }}</CardTitle>
          <CardDescription>{{ t('profile.visualsDesc') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-8">

          <!-- Avatar Editor -->
          <AssetEditor
              v-model="form.Avatar"
              :label="t('profile.avatar')"
              :description="t('profile.avatarDesc')"
          />

          <Separator />

          <!-- Background Editor -->
          <AssetEditor
              v-model="form.Background"
              :label="t('profile.background')"
              :description="t('profile.backgroundDesc')"
          />

        </CardContent>
      </Card>

      <!-- Section: Basic Info -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('profile.basicInfo') }}</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div class="space-y-2">
            <Label>{{ t('profile.displayName') }}</Label>
            <Input v-model="form.DisplayName" :placeholder="auth.user?.AccountName" />
          </div>

          <div class="space-y-2">
            <Label>{{ t('profile.pronouns') }}</Label>
            <Input v-model="form.Pronouns" placeholder="e.g. they/them, he/him" />
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label>{{ t('profile.bio') }}</Label>
            <Input v-model="form.Description" :placeholder="t('profile.bio')" />
          </div>

          <!-- Personal Fields Only -->
          <template v-if="isPersonal">
            <div class="space-y-2">
              <Label>{{ t('profile.jobTitle') }}</Label>
              <Input v-model="form.JobTitle" placeholder="Software Engineer" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('profile.company') }}</Label>
              <Input v-model="form.CurrentCompany" placeholder="Acme Inc." />
            </div>
            <div class="space-y-2">
              <Label>{{ t('profile.school') }}</Label>
              <Input v-model="form.CurrentSchool" placeholder="University of ..." />
            </div>
            <div class="space-y-2">
              <Label>{{ t('profile.birthday') }}</Label>
              <Input type="date" v-model="form.Birthday" />
            </div>
          </template>

          <!-- Org Fields Only -->
          <template v-else-if="isOrg">
            <div class="space-y-2">
              <Label>{{ t('profile.foundedDate') }}</Label>
              <Input type="date" v-model="form.FoundedDate" />
            </div>
          </template>

          <!-- System/App accounts show neither of the above blocks -->

          <div class="space-y-2">
            <Label>{{ t('profile.location') }}</Label>
            <Input v-model="form.Location" placeholder="City, Country" />
          </div>

          <div class="space-y-2">
            <Label>{{ t('profile.website') }}</Label>
            <Input v-model="form.Website" placeholder="https://..." />
          </div>

        </CardContent>
      </Card>

      <!-- Section: Content (Markdown) -->
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
                <Textarea
                    v-model="form.Content"
                    class="min-h-100 rounded-none border-0 focus-visible:ring-0 resize-none p-6 font-mono text-sm leading-relaxed"
                    :placeholder="t('profile.markdownPlaceholder')"
                />
            </TabsContent>

            <TabsContent value="preview" class="min-h-100 p-6 bg-muted/10">
              <div v-if="form.Content" class="prose dark:prose-invert max-w-none prose-sm" v-html="renderedContent"></div>
              <div v-else class="text-muted-foreground text-sm italic text-center pt-20">{{ t('profile.nothingToPreview') }}</div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

    </div>
  </div>
</template>
