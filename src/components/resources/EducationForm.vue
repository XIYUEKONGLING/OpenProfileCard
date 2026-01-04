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
    <AssetEditor v-model="form.Logo" label="School Logo" />
    <div class="space-y-2">
      <Label>School Name</Label>
      <Input v-model="form.SchoolName" required />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label>Degree</Label>
        <Input v-model="form.Degree" />
      </div>
      <div class="space-y-2">
        <Label>Major</Label>
        <Input v-model="form.Major" />
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
    <Button class="w-full" @click="emit('save', form)" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> Save
    </Button>
  </div>
</template>
