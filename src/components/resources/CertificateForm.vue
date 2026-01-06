<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-vue-next';

const props = defineProps<{ modelValue: any; isSaving: boolean }>();
const emit = defineEmits(['save']);
const { t } = useI18n();

// Helper to extract date part from ISO string or return as-is
const formatDateForInput = (value: string | null | undefined): string | null | undefined => {
  if (!value) return value;
  if (value.includes('T')) {
    return value.split('T')[0];
  }
  return value;
};

const form = reactive({
  Type: 'PGP',
  Visibility: 0,
  ...props.modelValue,
  CreatedAt: formatDateForInput(props.modelValue?.CreatedAt),
  ExpiresAt: formatDateForInput(props.modelValue?.ExpiresAt)
});
</script>

<template>
  <div class="space-y-4 py-4 overflow-x-hidden">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="space-y-2 min-w-0">
        <Label>{{ t('resources.certName') }}</Label>
        <Input v-model="form.Name" placeholder="My PGP Key" required class="min-w-0" />
      </div>
      <div class="space-y-2 min-w-0">
        <Label>{{ t('resources.certType') }}</Label>
        <Input v-model="form.Type" placeholder="PGP, SSH, x509" class="min-w-0" />
      </div>
    </div>

    <div class="space-y-2">
      <Label>{{ t('resources.fingerprint') }}</Label>
      <Input v-model="form.Fingerprint" class="font-mono min-w-0 break-all" required />
    </div>

    <div class="space-y-2">
      <Label>{{ t('resources.email') }}</Label>
      <Input v-model="form.Email" placeholder="associated@email.com" class="min-w-0" />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="space-y-2 min-w-0">
        <Label>{{ t('resources.createdAt') }}</Label>
        <Input type="date" v-model="form.CreatedAt" class="min-w-0" />
      </div>
      <div class="space-y-2 min-w-0">
        <Label>{{ t('resources.expiresAt') }}</Label>
        <Input type="date" v-model="form.ExpiresAt" class="min-w-0" />
      </div>
    </div>

    <div class="space-y-2">
      <Label>{{ t('common.visibility') }}</Label>
      <Select v-model.number="form.Visibility">
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem :value="0">{{ t('common.public') }}</SelectItem>
          <SelectItem :value="1">{{ t('common.private') }}</SelectItem>
          <SelectItem :value="2">{{ t('common.protected') }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-2">
      <Label>{{ t('resources.content') }}</Label>
      <Textarea v-model="form.Content" class="font-mono text-xs min-w-0 break-all resize-none" placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----" />
    </div>

    <Button class="w-full" @click="emit('save', form)" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> {{ t('common.save') }}
    </Button>
  </div>
</template>
