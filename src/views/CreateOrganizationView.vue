<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import type { CreateOrganizationRequestDto } from '@/api/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, Building2 } from 'lucide-vue-next';

const router = useRouter();
const { t } = useI18n();
const ui = useUIStore();

// --- State ---
const isSaving = ref(false);
const form = ref<CreateOrganizationRequestDto>({
  AccountName: '',
  DisplayName: '',
  Description: ''
});

// --- Actions ---
const createOrganization = async () => {
  // Basic Validation
  if (!form.value.AccountName || !form.value.DisplayName) {
    ui.notify(t('common.requiredFields'), 'error');
    return;
  }

  // Account Name Validation (Alphanumeric + Underscore)
  const accountNameRegex = /^[a-zA-Z0-9_]+$/;
  if (!accountNameRegex.test(form.value.AccountName)) {
    ui.notify(t('auth.usernamePlaceholder'), 'error');
    return;
  }

  isSaving.value = true;
  try {
    await httpClient<string>('/orgs', {
      method: 'POST',
      body: JSON.stringify(form.value)
    });

    ui.notify(t('organization.createSuccess'), 'success');

    // Force refresh to update Layout sidebar immediately
    window.location.reload();
  } catch (e: any) {
    ui.notify(e.message || t('organization.createFailed'), 'error');
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" @click="router.back()" class="rounded-full">
          <ArrowLeft class="size-5" />
        </Button>
        <div>
          <h1 class="text-2xl font-black tracking-tight">{{ t('organization.createOrg') }}</h1>
          <p class="text-sm text-muted-foreground">{{ t('organization.manage') }}</p>
        </div>
      </div>

      <Card class="border-border/60 shadow-xl">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Building2 class="size-5 text-brand-blue" />
            {{ t('organization.createOrg') }}
          </CardTitle>
          <CardDescription>
            {{ t('organization.createOrg') }} {{ t('common.to') }} {{ t('organization.manage') }}.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4 pt-6">
          <div class="space-y-2">
            <Label for="accountName">{{ t('organization.accountName') }} <span class="text-destructive">*</span></Label>
            <Input
                id="accountName"
                v-model="form.AccountName"
                :placeholder="t('organization.accountNamePlaceholder')"
                class="font-mono"
                required
            />
          </div>

          <div class="space-y-2">
            <Label for="displayName">{{ t('organization.displayName') }} <span class="text-destructive">*</span></Label>
            <Input
                id="displayName"
                v-model="form.DisplayName"
                :placeholder="t('organization.displayNamePlaceholder')"
                required
            />
          </div>

          <div class="space-y-2">
            <Label for="description">{{ t('organization.description') }}</Label>
            <Textarea
                id="description"
                v-model="form.Description"
                :placeholder="t('organization.descriptionPlaceholder')"
                class="resize-none"
                rows="3"
            />
          </div>

          <Button
              @click="createOrganization"
              :disabled="isSaving"
              class="w-full font-bold mt-4"
          >
            <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
            {{ t('common.create') }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
