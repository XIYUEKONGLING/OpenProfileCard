<script setup lang="ts">
import { reactive } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Loader2 } from 'lucide-vue-next';

const props = defineProps<{ modelValue: any; isSaving: boolean }>();
const emit = defineEmits(['save']);
const form = reactive({ ...props.modelValue });
</script>

<template>
  <div class="space-y-4 py-4">
    <AssetEditor v-model="form.Icon" label="Platform Icon" />
    <div class="space-y-2">
      <Label>Platform</Label>
      <Input v-model="form.Platform" placeholder="Patreon, GitHub Sponsors" required />
    </div>
    <div class="space-y-2">
      <Label>URL</Label>
      <Input v-model="form.Url" placeholder="https://" />
    </div>
    <AssetEditor v-model="form.QrCode" label="QR Code (Optional)" />
    <Button class="w-full" @click="emit('save', form)" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> Save
    </Button>
  </div>
</template>
