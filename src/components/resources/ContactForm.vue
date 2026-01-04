<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Loader2 } from 'lucide-vue-next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const props = defineProps<{ modelValue: any; isSaving: boolean }>();
const emit = defineEmits(['save']);
const { t } = useI18n();

// Default Type to 0 (Email) and Visibility to 0 (Public)
const form = reactive({ Type: 0, Visibility: 0, ...props.modelValue });
</script>

<template>
  <div class="space-y-4 py-4">
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label>{{ t('resources.type') }}</Label>
        <Select v-model.number="form.Type">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem :value="0">Email</SelectItem>
            <SelectItem :value="1">Phone</SelectItem>
            <SelectItem :value="2">Message</SelectItem>
            <SelectItem :value="3">Address</SelectItem>
            <SelectItem :value="4">Link</SelectItem>
            <SelectItem :value="5">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="space-y-2">
        <Label>{{ t('resources.platform') }}</Label>
        <Input v-model="form.Label" placeholder="e.g. Work Email" required />
      </div>
    </div>

    <div class="space-y-2">
      <Label>{{ t('resources.value') }}</Label>
      <Input v-model="form.Value" placeholder="alice@example.com" required />
    </div>

    <AssetEditor v-model="form.Icon" :label="t('resources.icon')" />
    <AssetEditor v-model="form.Image" :label="t('resources.image')" description="QR Code or other image" />

    <div class="space-y-2">
      <Label>{{ t('common.visibility') }}</Label>
      <Select v-model.number="form.Visibility">
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem :value="0">{{ t('common.public') }}</SelectItem>
          <SelectItem :value="1">{{ t('common.private') }}</SelectItem>
          <SelectItem :value="2">{{ t('common.protected') }}</SelectItem>
          <SelectItem :value="3">{{ t('common.membersOnly') }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Button class="w-full" @click="emit('save', form)" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> {{ t('common.save') }}
    </Button>
  </div>
</template>