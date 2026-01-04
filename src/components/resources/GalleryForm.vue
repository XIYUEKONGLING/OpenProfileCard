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
    <AssetEditor v-model="form.Image" label="Image" />
    <div class="space-y-2">
      <Label>Caption</Label>
      <Input v-model="form.Caption" />
    </div>
    <div class="space-y-2">
      <Label>Action URL (Optional)</Label>
      <Input v-model="form.ActionUrl" placeholder="https://" />
    </div>
    <Button class="w-full" @click="emit('save', form)" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> Save
    </Button>
  </div>
</template>
