<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Loader2 } from 'lucide-vue-next';

const props = defineProps<{ modelValue: any; isSaving: boolean }>();
const emit = defineEmits(['save']);
const { t } = useI18n();

const form = reactive({ ...props.modelValue });
</script>

<template>
  <div class="space-y-4 py-4 overflow-x-hidden">
    <AssetEditor v-model="form.Logo" :label="t('resources.logo')" />
    <div class="space-y-2">
      <Label>{{ t('resources.schoolName') }}</Label>
      <Input v-model="form.SchoolName" required class="min-w-0" />
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="space-y-2 min-w-0">
        <Label>{{ t('resources.degree') }}</Label>
        <Input v-model="form.Degree" class="min-w-0" />
      </div>
      <div class="space-y-2 min-w-0">
        <Label>{{ t('resources.major') }}</Label>
        <Input v-model="form.Major" class="min-w-0" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="space-y-2 min-w-0">
        <Label>{{ t('resources.startDate') }}</Label>
        <Input type="date" v-model="form.StartDate" class="min-w-0" />
      </div>
      <div class="space-y-2 min-w-0">
        <Label>{{ t('resources.endDate') }}</Label>
        <Input type="date" v-model="form.EndDate" class="min-w-0" />
      </div>
    </div>
    <Button class="w-full" @click="emit('save', form)" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> {{ t('common.save') }}
    </Button>
  </div>
</template>
