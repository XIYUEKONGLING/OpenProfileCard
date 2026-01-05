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
import { Loader2, Mail, X, Clock } from 'lucide-vue-next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const props = defineProps<{ accountName: string }>();

const { t } = useI18n();
const ui = useUIStore();

const invitations = ref<OrganizationInvitationDto[]>([]);
const isLoading = ref(false);
const actionLoadingId = ref<string | null>(null);
const showRevokeModal = ref(false);
const inviteToRevoke = ref<OrganizationInvitationDto | null>(null);

const fetchInvitations = async () => {
  isLoading.value = true;
  try {
    invitations.value = await httpClient<OrganizationInvitationDto[]>(`/orgs/${props.accountName}/invitations`);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

const confirmRevoke = (invite: OrganizationInvitationDto) => {
  inviteToRevoke.value = invite;
  showRevokeModal.value = true;
};

const revokeInvitation = async () => {
  if (!inviteToRevoke.value) return;

  actionLoadingId.value = inviteToRevoke.value.Id;
  try {
    await httpClient(`/orgs/${props.accountName}/invitations/${inviteToRevoke.value.Id}`, {
      method: 'DELETE'
    });
    ui.notify(t('common.success'), 'success');
    invitations.value = invitations.value.filter(i => i.Id !== inviteToRevoke.value!.Id);
    showRevokeModal.value = false;
    inviteToRevoke.value = null;
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

const getRoleLabel = (role: MemberRole) => {
  switch (role) {
    case MemberRole.Owner: return t('organization.roleOwner');
    case MemberRole.Admin: return t('organization.roleAdmin');
    case MemberRole.Member: return t('organization.roleMember');
    case MemberRole.Guest: return t('organization.roleGuest');
    default: return t('organization.roleUnknown');
  }
};

onMounted(fetchInvitations);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h3 class="text-lg font-bold">{{ t('organization.outgoingInvitations') }}</h3>
      <p class="text-sm text-muted-foreground">{{ t('organization.pendingInvitesDesc') }}</p>
    </div>

    <!-- List -->
    <Card>
      <CardContent class="p-0">
        <div v-if="isLoading" class="p-8 flex justify-center">
          <Loader2 class="size-6 animate-spin text-muted-foreground" />
        </div>

        <div v-else-if="invitations.length === 0" class="p-12 text-center">
          <Mail class="size-12 mx-auto text-muted-foreground/20 mb-4" />
          <p class="font-bold">{{ t('organization.noPendingInvites') }}</p>
        </div>

        <div v-else class="divide-y">
          <div v-for="inv in invitations" :key="inv.Id" class="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <!-- Invitee Info -->
            <div class="flex items-center gap-4">
              <div class="size-10 rounded-full bg-muted border overflow-hidden shrink-0">
                <AssetView :asset="inv.InviteeAvatar" :fallback-name="inv.InviteeName" class-name="w-full h-full" />
              </div>
              <div>
                <div class="font-bold flex items-center gap-2">
                  {{ inv.InviteeName }}
                  <Badge variant="secondary" class="text-[10px] h-5 px-1.5">
                    {{ getRoleLabel(inv.Role) }}
                  </Badge>
                </div>
                <div class="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock class="size-3" />
                  {{ new Date(inv.CreatedAt).toLocaleString() }}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive hover:bg-destructive/10"
                @click="confirmRevoke(inv)"
                :disabled="actionLoadingId === inv.Id"
            >
              <Loader2 v-if="actionLoadingId === inv.Id" class="size-4 animate-spin mr-2" />
              <X v-else class="size-4 mr-2" />
              {{ t('organization.revoke') }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Revoke Confirmation Modal -->
    <AlertDialog v-model:open="showRevokeModal">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('organization.revoke') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('organization.revokeConfirm') }}
            <div class="mt-2 font-bold text-foreground">
              {{ inviteToRevoke?.InviteeName }}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="revokeInvitation" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {{ t('organization.revoke') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
