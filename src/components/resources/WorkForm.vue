<script setup lang="ts">
import { reactive } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Loader2 } from 'lucide-vue-next';

const props = defineProps<{ modelValue: any; isSaving: boolean }>();
const emit = defineEmits(['save']);

const form = reactive({ ...props.modelValue });

const submit = () => emit('save', form);
</script>

<template>
  <div class="space-y-4 py-4">
    <AssetEditor v-model="form.Logo" label="Company Logo" />
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label>Company Name</Label>
        <Input v-model="form.CompanyName" required />
      </div>
      <div class="space-y-2">
        <Label>Position</Label>
        <Input v-model="form.Position" required />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label>Start Date</Label>
        <Input type="date" v-model="form.StartDate" />
      </div>
      <div class="space-y-2">
        <Label>End Date</Label>
        <Input type="date" v-model="form.EndDate" />
      </div>
    </div>
    <div class="space-y-2">
      <Label>Description</Label>
      <Textarea v-model="form.Description" />
    </div>
    <Button class="w-full" @click="submit" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> Save
    </Button>
  </div>
</template>
