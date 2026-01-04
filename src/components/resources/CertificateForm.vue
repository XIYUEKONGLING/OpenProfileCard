<script setup lang="ts">
import { reactive } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-vue-next';

const props = defineProps<{ modelValue: any; isSaving: boolean }>();
const emit = defineEmits(['save']);
const form = reactive({ Type: 'PGP', ...props.modelValue });
</script>

<template>
  <div class="space-y-4 py-4">
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label>Name</Label>
        <Input v-model="form.Name" placeholder="My PGP Key" required />
      </div>
      <div class="space-y-2">
        <Label>Type</Label>
        <Input v-model="form.Type" placeholder="PGP, SSH, x509" />
      </div>
    </div>
    <div class="space-y-2">
      <Label>Fingerprint</Label>
      <Input v-model="form.Fingerprint" class="font-mono" required />
    </div>
    <div class="space-y-2">
      <Label>Expires At</Label>
      <Input type="date" v-model="form.ExpiresAt" />
    </div>
    <Button class="w-full" @click="emit('save', form)" :disabled="isSaving">
      <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" /> Save
    </Button>
  </div>
</template>
