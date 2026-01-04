<script setup lang="ts">
import { reactive } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Loader2 } from 'lucide-vue-next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const props = defineProps<{ modelValue: any; isSaving: boolean }>();
const emit = defineEmits(['save']);
const form = reactive({ Visibility: 'Public', ...props.modelValue });
</script>

<template>
  <div class="space-y-4 py-4">
    <AssetEditor v-model="form.Logo" label="Project Logo" />
    <div class="space-y-2">
      <Label>Project Name</Label>
      <Input v-model="form.Name" required />
    </div>
    <div class="space-y-2">
      <Label>Summary</Label>
      <Input v-model="form.Summary" />
    </div>
    <div class="space-y-2">
      <Label>URL</Label>
      <Input v-model="form.Url" placeholder="https://" />
    </div>
    <div class="space-y-2">
      <Label>Visibility</Label>
      <Select v-model="form.Visibility">
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Public">Public</SelectItem>
          <SelectItem value="Private">Private</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <Button class="w-full" @click="emit('save', form)" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> Save
    </Button>
  </div>
</template>
