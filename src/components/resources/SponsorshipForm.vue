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
    <AssetEditor v-model="form.Icon" :label="t('resources.icon')" />
    <div class="space-y-2">
      <Label>{{ t('resources.platform') }}</Label>
      <Input v-model="form.Platform" placeholder="Patreon, GitHub Sponsors" required class="min-w-0" />
    </div>
    <div class="space-y-2">
      <Label>{{ t('resources.url') }}</Label>
      <Input v-model="form.Url" placeholder="https://" class="min-w-0 break-all" />
    </div>
    <AssetEditor v-model="form.QrCode" :label="t('resources.qrCode')" />
    <Button class="w-full" @click="emit('save', form)" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> {{ t('common.save') }}
    </Button>
  </div>
</template>
