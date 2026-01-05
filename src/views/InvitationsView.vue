<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import { MemberRole } from '@/api/types';
import type { OrganizationInvitationDto } from '@/api/types';


// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AssetView from '@/components/ui/AssetView.vue';
import { Loader2, Check, X, Mail } from 'lucide-vue-next';

const { t } = useI18n();
const ui = useUIStore();

// --- State ---
const invitations = ref<OrganizationInvitationDto[]>([]);
const isLoading = ref(false);
const actionLoadingId = ref<string | null>(null);

// --- Actions ---
const fetchInvitations = async () => {
  isLoading.value = true;
  try {
    invitations.value = await httpClient<OrganizationInvitationDto[]>('/me/invitations');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

const handleAction = async (id: string, action: 'accept' | 'decline') => {
  actionLoadingId.value = id;
  try {
    await httpClient(`/me/invitations/${id}/${action}`, { method: 'POST' });
    ui.notify(action === 'accept' ? t('invitations.acceptSuccess') : t('invitations.declineSuccess'), 'success');
    // Remove from list
    invitations.value = invitations.value.filter(inv => inv.Id !== id);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

const toRoleString = (role: MemberRole) => {
  switch (role) {
    case MemberRole.Owner:
      return t('organization.roleOwner');
    case MemberRole.Admin:
      return t('organization.roleAdmin');
    case MemberRole.Member:
      return t('organization.member');
    case MemberRole.Guest:
      return t('organization.guest');
    default: t('organization.roleUnknown');
  }
};

onMounted(fetchInvitations);
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto pb-10">
    <div>
      <h1 class="text-3xl font-black tracking-tight">{{ t('invitations.title') }}</h1>
      <p class="text-muted-foreground text-sm">{{ t('invitations.subtitle') }}</p>
    </div>

    <!-- List -->
    <div class="space-y-4">
      <div v-if="isLoading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="h-28 bg-muted rounded-xl animate-pulse"></div>
      </div>

      <div v-else-if="invitations.length === 0" class="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/10">
        <Mail class="size-12 mx-auto text-muted-foreground/20 mb-4" />
        <p class="font-bold">{{ t('invitations.empty') }}</p>
        <p class="text-sm text-muted-foreground">{{ t('invitations.emptyDesc') }}</p>
      </div>

      <div v-else class="grid gap-4">
        <Card v-for="inv in invitations" :key="inv.Id" class="overflow-hidden">
          <CardContent class="p-0">
            <div class="flex flex-col sm:flex-row">
              <!-- Org Info -->
              <div class="p-6 flex-1 flex items-start gap-4">
                <div class="size-14 rounded-xl bg-muted border overflow-hidden shrink-0">
                  <AssetView :asset="inv.OrganizationAvatar" :fallback-name="inv.OrganizationName" class-name="w-full h-full" />
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold text-lg">{{ inv.OrganizationName }}</h3>
                    <Badge variant="secondary" class="text-[10px]">{{ inv.Status }}</Badge>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    <span class="font-medium">{{ t('invitations.invitedBy') }}:</span> @{{ inv.InviterName }}
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    {{ t('organization.role') }}: {{ toRoleString(inv.Role) }} • {{ new Date(inv.CreatedAt).toLocaleDateString() }}
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="p-6 sm:w-auto flex sm:flex-col justify-center gap-3">
                <Button
                    class="w-full sm:w-auto font-bold"
                    @click="handleAction(inv.Id, 'accept')"
                    :disabled="actionLoadingId === inv.Id"
                >
                  <Check v-if="actionLoadingId !== inv.Id" class="mr-2 size-4" />
                  <Loader2 v-else class="mr-2 size-4 animate-spin" />
                  {{ t('common.accept') }}
                </Button>
                <Button
                    variant="outline"
                    class="w-full sm:w-auto"
                    @click="handleAction(inv.Id, 'decline')"
                    :disabled="actionLoadingId === inv.Id"
                >
                  <X v-if="actionLoadingId !== inv.Id" class="mr-2 size-4" />
                  <Loader2 v-else class="mr-2 size-4 animate-spin" />
                  {{ t('common.decline') }}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
