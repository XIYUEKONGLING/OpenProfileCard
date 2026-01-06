<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from '@/i18n';
import { type AssetDto, AssetType } from '@/api/types';
import AssetView from '@/components/ui/AssetView.vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UploadCloud, Lock, XCircle } from 'lucide-vue-next';
import { useUIStore } from '@/stores/ui';

const props = defineProps<{
  modelValue?: AssetDto | null;
  label?: string;
  description?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();
const ui = useUIStore();

// Local state
const currentType = ref<AssetType>(AssetType.Remote);
const currentValue = ref<string>('');
const currentTag = ref<string | undefined>(undefined);

// Supported types for selection
const availableTypes = [
  { value: AssetType.Remote, label: t('common.remote') },
  { value: AssetType.Image, label: t('common.image') },
  { value: AssetType.Text, label: t('common.text') },
  { value: AssetType.Style, label: t('common.style') },
  { value: AssetType.Empty, label: t('common.none') },
];

// Computed Asset for Preview
const previewAsset = computed<AssetDto | null>(() => {
  if (currentType.value === AssetType.Empty) return null;
  return {
    Type: currentType.value,
    Value: currentValue.value,
    Tag: currentTag.value
  };
});

// Is the incoming asset a restricted system identifier?
const isRestricted = computed(() => props.modelValue?.Type === AssetType.Identifier);

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    currentType.value = newVal.Type;
    currentValue.value = newVal.Value || '';
    currentTag.value = newVal.Tag;
  } else {
    // Default to Empty if null
    currentType.value = AssetType.Empty;
    currentValue.value = '';
    currentTag.value = undefined;
  }
}, { immediate: true });

// Emit changes
const update = () => {
  if (currentType.value === AssetType.Empty) {
    emit('update:modelValue', {
      Type: AssetType.Empty,
      Value: null,
      Tag: null
    });
  } else {
    emit('update:modelValue', {
      Type: currentType.value,
      Value: currentValue.value,
      Tag: currentTag.value || undefined
    });
  }
};

// Handle Type Switch
const onTypeChange = (val: unknown) => {
  if (val === null || typeof val !== 'number') return;
  currentType.value = val as AssetType;
  currentValue.value = '';
  currentTag.value = undefined;
  update();
};

// Handle File Upload (Convert to Base64)
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  // Limit size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    ui.notify(t('common.fileSizeLimit'), 'error');
    input.value = ''; // reset
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result;
    if (typeof result === 'string') {
      const mimeMatch = result.match(/^data:(.+);base64,/);
      if (mimeMatch) {
        currentTag.value = mimeMatch[1];
      }
      currentValue.value = result;
      currentType.value = AssetType.Image;
      update();
    }
  };
  reader.readAsDataURL(file);
};
</script>

<template>
  <div class="space-y-3">
    <div v-if="label || description">
      <Label v-if="label" class="text-base font-semibold">{{ label }}</Label>
      <p v-if="description" class="text-[10px] text-muted-foreground">{{ description }}</p>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 items-start">

      <!-- Preview Section -->
      <div class="shrink-0">
        <div class="size-24 rounded-lg border bg-muted overflow-hidden relative shadow-sm flex items-center justify-center">
          <!-- Show AssetView if NOT Empty -->
          <AssetView
              v-if="currentType !== AssetType.Empty"
              :asset="isRestricted ? props.modelValue : previewAsset"
              class-name="w-full h-full object-cover"
          />
          <!-- Show 'None' Placeholder if Empty -->
          <div v-else class="text-muted-foreground opacity-50 flex flex-col items-center gap-1">
            <XCircle class="size-6" />
            <span class="text-[9px] font-bold uppercase">None</span>
          </div>
        </div>
      </div>

      <!-- Controls Section -->
      <div class="flex-1 w-full space-y-3">

        <!-- Case 1: Restricted (Identifier) -->
        <div v-if="isRestricted" class="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 text-orange-600 space-y-2">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Lock class="size-3" /> {{ t('common.identifier') }}
          </div>
          <p class="text-xs opacity-80 break-all font-mono">{{ props.modelValue?.Value }}</p>
          <Button
              size="sm"
              variant="outline"
              class="h-7 text-xs border-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/40"
              @click="onTypeChange(AssetType.Remote)"
          >
            {{ t('common.replace') }}
          </Button>
        </div>

        <!-- Case 2: Editable Types -->
        <div v-else class="space-y-3 animate-in fade-in slide-in-from-right-2">

          <!-- Type Selector -->
          <Select :model-value="currentType" @update:model-value="onTypeChange">
            <SelectTrigger class="w-full sm:w-48 h-8 text-xs">
              <SelectValue>
                {{ availableTypes.find(t => t.value === currentType)?.label || t('common.selectType') }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="type in availableTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Input: Remote URL -->
          <div v-if="currentType === AssetType.Remote">
            <Input v-model="currentValue" @input="update" placeholder="https://example.com/image.png" class="font-mono text-xs" />
          </div>

          <!-- Input: File Upload (Image) -->
          <div v-else-if="currentType === AssetType.Image">
            <div v-if="!currentValue" class="relative group cursor-pointer">
              <div class="flex items-center justify-center w-full h-20 px-4 transition bg-background border-2 border-muted border-dashed rounded-md hover:border-brand-blue/50 hover:bg-muted/20">
                <div class="flex flex-col items-center space-y-1">
                  <UploadCloud class="size-5 text-muted-foreground group-hover:text-brand-blue transition-colors" />
                  <span class="font-medium text-muted-foreground text-[10px] group-hover:text-brand-blue transition-colors">{{ t('common.uploadImage') }}</span>
                </div>
                <input type="file" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" @change="handleFileUpload" />
              </div>
            </div>
            <div v-else class="flex items-center gap-2">
              <div class="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200">
                {{ currentTag ? currentTag : 'Image' }} ({{ Math.round(currentValue.length / 1024) }} KB)
              </div>
              <Button size="sm" variant="ghost" class="h-6 text-xs text-destructive hover:text-destructive" @click="currentValue = ''; currentTag = undefined; update()">
                {{ t('common.cancel') }}
              </Button>
            </div>
          </div>

          <!-- Input: Text / Emoji -->
          <div v-else-if="currentType === AssetType.Text">
            <Input v-model="currentValue" @input="update" placeholder="😊 or Initials" maxlength="5" class="text-center text-lg font-black tracking-widest" />
          </div>

          <!-- Input: Style (Icon Class) -->
          <div v-else-if="currentType === AssetType.Style">
            <Input v-model="currentValue" @input="update" placeholder="fa-solid fa-user" class="font-mono text-xs" />
            <p class="text-[10px] text-muted-foreground mt-1">FontAwesome 6 Free or Devicon classes</p>
          </div>

          <!-- Input: Empty (No controls) -->
          <div v-else-if="currentType === AssetType.Empty" class="text-xs text-muted-foreground italic">
            {{ t('common.noAssetSelected') }}
          </div>

        </div>

      </div>
    </div>
  </div>
</template>
