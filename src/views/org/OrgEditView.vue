<script setup lang="ts">
import { ref, inject, onMounted, reactive, type Ref } from 'vue';
import { useI18n } from '@/i18n';
import { useUIStore } from '@/stores/ui';
import { httpClient } from '@/api/client';
import type { OrganizationDto, UpdateProfileRequestDto, ProfileDto } from '@/api/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Loader2, Save } from 'lucide-vue-next';

const { t } = useI18n();
const ui = useUIStore();

// Inject context from Layout
const org = inject<Ref<OrganizationDto | null>>('orgContext');
const refreshOrg = inject<() => Promise<void>>('refreshOrg');

const isSaving = ref(false);
const isLoading = ref(true);

const form = reactive<UpdateProfileRequestDto>({
  DisplayName: '',
  Description: '',
  Content: '',
  Location: '',
  Website: '',
  FoundedDate: '',
  Avatar: undefined,
  Background: undefined
});

const canEdit = () => {
  const role = org?.value?.MyRole;
  return role === 'Owner' || role === 'Admin';
};

const fetchData = async () => {
  if (!org?.value) return;
  isLoading.value = true;
  try {
    // We use the generic profile endpoint but scoped to the org
    // Note: The spec says POST .../profile for full update.
    // We need to GET the current profile data first to populate the form.
    // The spec says GET /api/profiles/{profile} returns ProfileDto.
    // But for editing, we usually want the "Edit View" data.
    // Assuming GET /api/orgs/{org}/profile exists or we use the public profile endpoint.
    // Let's use the public profile endpoint for data population as per spec Section 5.

    const data = await httpClient<ProfileDto>(`/profiles/${org.value.AccountName}`);
    Object.assign(form, data);
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const save = async () => {
  if (!org?.value) return;
  isSaving.value = true;
  try {
    // Handle date clearing
    const payload = { ...form };
    if (payload.FoundedDate === '') (payload as any).FoundedDate = null;

    await httpClient(`/orgs/${org.value.AccountName}/profile`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    ui.notify(t('profile.saveSuccess'), 'success');
    if (refreshOrg) await refreshOrg();
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
    <div v-if="!canEdit()" class="p-4 border border-yellow-200 bg-yellow-50 text-yellow-800 rounded-lg">
      You do not have permission to edit this organization's profile.
    </div>

    <template v-else>
      <Card>
        <CardHeader>
          <CardTitle>{{ t('profile.basicInfo') }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <Label>{{ t('profile.displayName') }}</Label>
              <Input v-model="form.DisplayName" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('profile.foundedDate') }}</Label>
              <Input type="date" v-model="form.FoundedDate" />
            </div>
            <div class="space-y-2 md:col-span-2">
              <Label>{{ t('profile.bio') }}</Label>
              <Input v-model="form.Description" maxlength="200" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('profile.location') }}</Label>
              <Input v-model="form.Location" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('profile.website') }}</Label>
              <Input v-model="form.Website" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{{ t('profile.visuals') }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-8">
          <AssetEditor v-model="form.Avatar" :label="t('profile.avatar')" />
          <AssetEditor v-model="form.Background" :label="t('profile.background')" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{{ t('profile.content') }} (Markdown)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea v-model="form.Content" class="min-h-64 font-mono" />
        </CardContent>
      </Card>

      <div class="flex justify-end">
        <Button @click="save" :disabled="isSaving" class="font-bold min-w-32">
          <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
          {{ t('common.save') }}
        </Button>
      </div>
    </template>
  </div>
</template>
