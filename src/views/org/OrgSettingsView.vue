<script setup lang="ts">
import { ref, inject, onMounted, type Ref } from 'vue';
import { useI18n } from '@/i18n';
import { useUIStore } from '@/stores/ui';
import { httpClient } from '@/api/client';
import type { OrganizationDto, OrganizationSettingsDto } from '@/api/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const ui = useUIStore();
const router = useRouter();

const org = inject<Ref<OrganizationDto | null>>('orgContext');
const isSaving = ref(false);
const settings = ref<OrganizationSettingsDto | null>(null);

// Danger Zone
const showDissolve = ref(false);
const dissolveInput = ref('');

const isOwner = () => org?.value?.MyRole === 'Owner';

const fetchSettings = async () => {
  if (!org?.value) return;
  try {
    settings.value = await httpClient<OrganizationSettingsDto>(`/orgs/${org.value.AccountName}/settings`);
  } catch (e) {
    console.error(e);
  }
};

const saveSettings = async () => {
  if (!org?.value || !settings.value) return;
  isSaving.value = true;
  try {
    await httpClient(`/orgs/${org.value.AccountName}/settings`, {
      method: 'POST', // Full update
      body: JSON.stringify(settings.value)
    });
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isSaving.value = false;
  }
};

const dissolveOrg = async () => {
  if (!org?.value) return;
  if (dissolveInput.value !== org.value.AccountName) return;

  try {
    await httpClient(`/orgs/${org.value.AccountName}`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    router.push('/dashboard');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

onMounted(fetchSettings);
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">

    <Card v-if="settings">
      <CardHeader>
        <CardTitle>{{ t('organization.settings') }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">

        <!-- Visibility -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <Label>{{ t('common.visibility') }}</Label>
            <Select v-model.number="settings.Visibility">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem :value="0">{{ t('common.public') }}</SelectItem>
                <SelectItem :value="1">{{ t('common.private') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>{{ t('organization.defaultMemberVisibility') }}</Label>
            <Select v-model.number="settings.DefaultMemberVisibility">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem :value="0">{{ t('common.public') }}</SelectItem>
                <SelectItem :value="1">{{ t('common.private') }}</SelectItem>
                <SelectItem :value="3">{{ t('common.membersOnly') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <!-- Toggles -->
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label class="text-base">{{ t('organization.allowMemberInvite') }}</Label>
            <p class="text-sm text-muted-foreground">{{ t('organization.allowMemberInviteDesc') }}</p>
          </div>
          <input type="checkbox" v-model="settings.AllowMemberInvite" class="size-5 accent-brand-blue" />
        </div>

        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label class="text-base">{{ t('settings.allowFollowers') }}</Label>
          </div>
          <input type="checkbox" v-model="settings.AllowFollowers" class="size-5 accent-brand-blue" />
        </div>

      </CardContent>
      <CardFooter class="border-t bg-muted/20 px-6 py-4">
        <Button @click="saveSettings" :disabled="isSaving">
          <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
          {{ t('common.save') }}
        </Button>
      </CardFooter>
    </Card>

    <!-- Danger Zone (Owner Only) -->
    <Card v-if="isOwner()" class="border-destructive/30 overflow-hidden">
      <CardHeader class="bg-destructive/10 py-6">
        <CardTitle class="flex items-center gap-2 text-destructive">
          <AlertTriangle class="size-5" />
          {{ t('settings.dangerZone') }}
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-6">
        <div v-if="!showDissolve">
          <h4 class="font-bold mb-1">{{ t('organization.dissolve') }}</h4>
          <p class="text-sm text-muted-foreground mb-4">{{ t('organization.dissolveDesc') }}</p>
          <Button variant="destructive" @click="showDissolve = true">{{ t('organization.dissolve') }}</Button>
        </div>

        <div v-else class="space-y-4 animate-in fade-in">
          <Label>{{ t('organization.dissolveConfirm', { name: org?.AccountName }) }}</Label>
          <Input v-model="dissolveInput" :placeholder="org?.AccountName" class="border-destructive/50" />
          <div class="flex gap-2">
            <Button variant="destructive" :disabled="dissolveInput !== org?.AccountName" @click="dissolveOrg">
              <Trash2 class="size-4 mr-2" /> {{ t('organization.dissolve') }}
            </Button>
            <Button variant="ghost" @click="showDissolve = false">{{ t('common.cancel') }}</Button>
          </div>
        </div>
      </CardContent>
    </Card>

  </div>
</template>
