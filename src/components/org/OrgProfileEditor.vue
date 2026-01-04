<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import type { ProfileDto, UpdateProfileRequestDto } from '@/api/types';
import { renderMarkdown } from '@/lib/markdown';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Loader2, Save } from 'lucide-vue-next';

const props = defineProps<{
  accountName: string;
  isAdmin: boolean;
}>();

const emit = defineEmits(['saved']);

const { t } = useI18n();
const ui = useUIStore();

const isLoading = ref(true);
const isSaving = ref(false);

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

const loadProfile = async () => {
  isLoading.value = true;
  try {
    const data = await httpClient<ProfileDto>(`/orgs/${props.accountName}/profile`);
    Object.assign(form, data);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

const saveProfile = async () => {
  if (!props.isAdmin) return;
  isSaving.value = true;
  try {
    const payload = { ...form };
    // Handle date clearing
    if (payload.FoundedDate === '') (payload as any).FoundedDate = null;

    await httpClient(`/orgs/${props.accountName}/profile`, {
      method: 'POST', // Full update semantics
      body: JSON.stringify(payload)
    });
    ui.notify(t('profile.saveSuccess'), 'success');
    emit('saved');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isSaving.value = false;
  }
};

onMounted(loadProfile);
</script>

<template>
  <div class="space-y-6">
    <!-- Read Only Warning -->
    <div v-if="!isAdmin" class="p-4 bg-muted/50 rounded-lg text-sm text-center text-muted-foreground">
      {{ t('organization.noEditPermission') }}
    </div>

    <form @submit.prevent="saveProfile" :disabled="!isAdmin" :class="{'opacity-60 pointer-events-none select-none filter blur-sm': !isAdmin}">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Basic Info -->
        <Card class="lg:col-span-1">
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

        <!-- Visuals -->
        <Card class="lg:col-span-1">
          <CardHeader>
            <CardTitle>{{ t('profile.visuals') }}</CardTitle>
            <CardDescription>{{ t('profile.visualsDesc') }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <AssetEditor v-model="form.Avatar" :label="t('profile.avatar')" />
            <AssetEditor v-model="form.Background" :label="t('profile.background')" />
          </CardContent>
        </Card>

        <!-- Markdown Content -->
        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle>{{ t('profile.content') }}</CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <Tabs default-value="write" class="w-full">
              <div class="border-b bg-muted/30 px-6 py-2 flex items-center justify-between">
                <TabsList class="h-8">
                  <TabsTrigger value="write" class="text-xs">{{ t('profile.write') }}</TabsTrigger>
                  <TabsTrigger value="preview" class="text-xs">{{ t('profile.preview') }}</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="write" class="p-0 m-0 border-none">
                <Textarea v-model="form.Content" class="min-h-100 rounded-none border-0 focus-visible:ring-0 resize-none p-6 font-mono text-sm leading-relaxed" :placeholder="t('profile.markdownPlaceholder')" />
              </TabsContent>
              <TabsContent value="preview" class="min-h-100 p-6 bg-muted/10">
                <div v-if="form.Content" class="prose dark:prose-invert max-w-none prose-sm" v-html="renderMarkdown(form.Content)"></div>
                <div v-else class="text-muted-foreground text-sm italic text-center pt-20">{{ t('profile.nothingToPreview') }}</div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div class="sticky bottom-4 flex justify-end pt-6 pointer-events-auto">
        <Button type="submit" size="lg" :disabled="isSaving || !isAdmin" class="font-bold shadow-xl">
          <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
          <Save v-else class="mr-2 size-4" />
          {{ t('common.save') }}
        </Button>
      </div>
    </form>
  </div>
</template>
