<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client.ts';
import { useUIStore } from '@/stores/ui.ts';
import {
  type OrganizationSettingsDto,
  MemberRole
} from '@/api/types';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Loader2, AlertTriangle, Save } from 'lucide-vue-next';

const props = defineProps<{
  accountName: string;
  myRole: MemberRole;
}>();

const emit = defineEmits(['deleted']);

const { t } = useI18n();
const ui = useUIStore();

const isSaving = ref(false);
const isDeleting = ref(false);
const deleteConfirm = ref('');
const settings = ref<OrganizationSettingsDto | null>(null);

const isOwner = computed(() => props.myRole === MemberRole.Owner);

const fetchSettings = async () => {
  try {
    settings.value = await httpClient<OrganizationSettingsDto>(`/orgs/${props.accountName}/settings`);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const saveSettings = async () => {
  if (!settings.value) return;
  isSaving.value = true;
  try {
    await httpClient(`/orgs/${props.accountName}/settings`, {
      method: 'PATCH',
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
  if (deleteConfirm.value !== props.accountName) return;
  if (!confirm(t('organization.dissolveConfirm', { name: props.accountName }))) return;

  isDeleting.value = true;
  try {
    await httpClient(`/orgs/${props.accountName}`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    emit('deleted');
  } catch (e: any) {
    ui.notify(e.message, 'error');
    isDeleting.value = false;
  }
};

onMounted(fetchSettings);
</script>

<template>
  <div class="space-y-6">

    <!-- General Settings -->
    <Card v-if="settings">
      <CardHeader>
        <CardTitle>{{ t('organization.settings') }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">

        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label class="text-base">{{ t('settings.allowFollowers') }}</Label>
            <p class="text-sm text-muted-foreground">{{ t('settings.allowFollowersDesc') }}</p>
          </div>
          <input type="checkbox" v-model="settings.AllowFollowers" class="size-5 accent-brand-blue" />
        </div>

        <Separator />

        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label class="text-base">{{ t('organization.allowMemberInvite') }}</Label>
            <p class="text-sm text-muted-foreground">{{ t('organization.allowMemberInviteDesc') }}</p>
          </div>
          <input type="checkbox" v-model="settings.AllowMemberInvite" class="size-5 accent-brand-blue" />
        </div>

      </CardContent>
      <CardFooter class="border-t bg-muted/20 px-6 py-4">
        <Button @click="saveSettings" :disabled="isSaving" class="font-bold">
          <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
          <Save v-else class="mr-2 size-4" />
          {{ t('common.save') }}
        </Button>
      </CardFooter>
    </Card>

    <!-- Danger Zone -->
    <Card v-if="isOwner" class="border-destructive/30 overflow-hidden">
      <CardHeader class="bg-destructive/10 py-6">
        <CardTitle class="flex items-center gap-2 text-destructive">
          <AlertTriangle class="size-5" />
          {{ t('settings.dangerZone') }}
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-6 space-y-4">
        <div>
          <h4 class="font-bold text-destructive">{{ t('organization.dissolve') }}</h4>
          <p class="text-sm text-muted-foreground">{{ t('organization.dissolveDesc') }}</p>
        </div>

        <div class="space-y-2 max-w-sm">
          <Label>{{ t('organization.dissolveConfirm', { name: accountName }) }}</Label>
          <Input v-model="deleteConfirm" :placeholder="accountName" />
        </div>

        <Button variant="destructive" :disabled="deleteConfirm !== accountName || isDeleting" @click="dissolveOrg">
          {{ t('organization.dissolve') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
