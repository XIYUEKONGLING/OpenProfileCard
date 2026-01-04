<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Loader2, Save } from 'lucide-vue-next';

const props = defineProps<{
  accountName: string;
  myRole: MemberRole;
}>();

const emit = defineEmits(['deleted']);

const { t } = useI18n();
const ui = useUIStore();

const isSaving = ref(false);
const settings = ref<OrganizationSettingsDto | null>(null);

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
  </div>
</template>
