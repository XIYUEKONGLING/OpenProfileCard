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

// Default Visibility to 0 (Public) if undefined
const form = reactive({ Visibility: 0, ...props.modelValue });
</script>

<template>
  <div class="space-y-4 py-4 overflow-x-hidden">
    <AssetEditor v-model="form.Logo" :label="t('resources.logo')" />
    <div class="space-y-2">
      <Label>{{ t('resources.projectName') }}</Label>
      <Input v-model="form.Name" required class="min-w-0" />
    </div>
    <div class="space-y-2">
      <Label>{{ t('resources.summary') }}</Label>
      <Input v-model="form.Summary" class="min-w-0" />
    </div>
    <div class="space-y-2">
      <Label>{{ t('resources.url') }}</Label>
      <Input v-model="form.Url" placeholder="https://" class="min-w-0 break-all" />
    </div>
    <div class="space-y-2">
      <Label>{{ t('common.visibility') }}</Label>
      <!-- Bind as number -->
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
