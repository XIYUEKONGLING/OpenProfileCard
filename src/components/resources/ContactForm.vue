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

const form = reactive({
  Type: 0,
  Label: '',
  Value: '',
  Icon: null,
  Image: null,
  Visibility: 0,
  ...props.modelValue
});
</script>

<template>
  <div class="space-y-5 py-4 overflow-x-hidden">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="space-y-2 min-w-0">
        <Label>{{ t('resources.contactType') }}</Label>
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
      <div class="space-y-2 min-w-0">
        <Label>{{ t('resources.contactPlatform') }}</Label>
        <Input v-model="form.Label" :placeholder="t('resources.contactPlatformPlaceholder')" required class="min-w-0" />
      </div>
    </div>

    <div class="space-y-2">
      <Label>{{ t('resources.contactValue') }}</Label>
      <Input v-model="form.Value" :placeholder="t('resources.contactValuePlaceholder')" required class="min-w-0 break-all" />
    </div>

    <div class="space-y-6">
      <AssetEditor
          v-model="form.Icon"
          :label="t('resources.contactIcon')"
          :description="t('resources.contactIconDesc')"
      />
      <AssetEditor
          v-model="form.Image"
          :label="t('resources.contactImage')"
          :description="t('resources.contactImageDesc')"
      />
    </div>

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

    <Button class="w-full mt-2" @click="emit('save', form)" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> {{ t('common.save') }}
    </Button>
  </div>
</template>
