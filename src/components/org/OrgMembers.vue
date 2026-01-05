<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client.ts';
import { useUIStore } from '@/stores/ui.ts';
import {
  type OrganizationMemberDto,
  MemberRole,
  type InviteMemberRequestDto,
  type UpdateMemberRequestDto
} from '@/api/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AssetView from '@/components/ui/AssetView.vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
import { Loader2, MoreHorizontal, UserPlus, UserX, Crown, LogOut } from 'lucide-vue-next';

const props = defineProps<{
  accountName: string;
  accountId?: string;
  myRole: MemberRole;
}>();

const { t } = useI18n();
const ui = useUIStore();

const members = ref<OrganizationMemberDto[]>([]);
const isLoading = ref(true);
const actionLoading = ref<string | null>(null);

// Invite State
const showInviteDialog = ref(false);
const inviteForm = ref<InviteMemberRequestDto>({
  Identity: '',
  Role: MemberRole.Member,
  Title: ''
});
const isInviting = ref(false);

const isOwner = computed(() => props.myRole === MemberRole.Owner);
const isAdmin = computed(() => props.myRole === MemberRole.Admin || isOwner.value);

const showKickModal = ref(false);
const memberToKick = ref<OrganizationMemberDto | null>(null);
const showLeaveModal = ref(false);

// --- Actions ---

const fetchMembers = async () => {
  isLoading.value = true;
  try {
    members.value = await httpClient<OrganizationMemberDto[]>(`/orgs/${props.accountName}/members`);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

const sendInvite = async () => {
  isInviting.value = true;
  try {
    await httpClient(`/orgs/${props.accountName}/invitations`, {
      method: 'POST',
      body: JSON.stringify(inviteForm.value)
    });
    ui.notify(t('common.success'), 'success');
    showInviteDialog.value = false;
    inviteForm.value.Identity = ''; // Reset
    // Note: Invites are pending, so they won't appear in members list immediately usually, but spec says POST .../members Force Add for admin system. 
    // Standard invites go to invitations.
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isInviting.value = false;
  }
};

const updateRole = async (member: OrganizationMemberDto, newRole: MemberRole) => {
  actionLoading.value = member.AccountId;
  try {
    const payload: UpdateMemberRequestDto = { Role: newRole };
    await httpClient(`/orgs/${props.accountName}/members/${member.AccountId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    member.Role = newRole;
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = null;
  }
};

const kickMember = async () => {
  if (!memberToKick.value) return;

  actionLoading.value = memberToKick.value.AccountId;
  try {
    await httpClient(`/orgs/${props.accountName}/members/${memberToKick.value.AccountId}`, {
      method: 'DELETE'
    });
    members.value = members.value.filter(m => m.AccountId !== memberToKick.value!.AccountId);
    ui.notify(t('common.success'), 'success');
    showKickModal.value = false;
    memberToKick.value = null;
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = null;
  }
};

const openKickModal = (member: OrganizationMemberDto) => {
  memberToKick.value = member;
  showKickModal.value = true;
};

const leaveOrg = async () => {
  try {
    await httpClient(`/orgs/${props.accountName}/members/me`, { method: 'DELETE' });
    showLeaveModal.value = false;
    window.location.href = '/dashboard';
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const openLeaveModal = () => {
  showLeaveModal.value = true;
};

// Helper to determine if I can manage target user
const canManage = (target: OrganizationMemberDto) => {
  if (!isAdmin.value) return false;
  if (target.AccountId == props.accountId) return false; // Cannot touch self
  // if (target.Role === MemberRole.Owner) return false;
  if (props.myRole === MemberRole.Admin && target.Role === MemberRole.Admin) return false; // Admin cannot touch Admin
  return true;
};

const getRoleLabel = (r: MemberRole) => {
  switch(r) {
    case MemberRole.Owner: return t('organization.roleOwner');
    case MemberRole.Admin: return t('organization.roleAdmin');
    case MemberRole.Member: return t('organization.roleMember');
    case MemberRole.Guest: return t('organization.roleGuest');
    default: return 'Unknown';
  }
};

onMounted(fetchMembers);
</script>

<template>
  <div class="space-y-6">
    <!-- Header Actions -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-bold">{{ t('organization.members') }} ({{ members.length }})</h3>
      <div class="flex gap-2">
        <Button v-if="!isOwner" variant="outline" class="text-destructive border-destructive/30 hover:bg-destructive/10" @click="openLeaveModal">
          <LogOut class="size-4 mr-2" /> {{ t('organization.leave') }}
        </Button>
        <Button v-if="isAdmin" @click="showInviteDialog = true">
          <UserPlus class="size-4 mr-2" /> {{ t('organization.inviteMember') }}
        </Button>
      </div>
    </div>

    <!-- Members List -->
    <div class="rounded-xl border bg-card overflow-hidden">
      <div v-if="isLoading" class="p-8 text-center">
        <Loader2 class="size-6 animate-spin mx-auto text-muted-foreground" />
      </div>

      <div v-else class="divide-y">
        <div v-for="member in members" :key="member.AccountId" class="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
          <div class="flex items-center gap-4">
            <div class="size-10 rounded-full bg-muted border overflow-hidden shrink-0">
              <AssetView :asset="member.Avatar" :fallback-name="member.DisplayName" class-name="w-full h-full" />
            </div>
            <div>
              <div class="font-bold flex items-center gap-2">
                {{ member.DisplayName }}
                <Crown v-if="member.Role === MemberRole.Owner" class="size-3 text-yellow-500 fill-yellow-500" />
              </div>
              <div class="text-xs text-muted-foreground">@{{ member.AccountName }} • {{ getRoleLabel(member.Role) }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Badge variant="outline">{{ getRoleLabel(member.Role) }}</Badge>

            <DropdownMenu v-if="canManage(member)">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" :disabled="actionLoading === member.AccountId">
                  <Loader2 v-if="actionLoading === member.AccountId" class="size-4 animate-spin" />
                  <MoreHorizontal v-else class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <template v-if="isOwner">
                  <DropdownMenuItem @click="updateRole(member, MemberRole.Owner)"> {{ t('organization.setAsOwner') }} </DropdownMenuItem>
                  <DropdownMenuItem @click="updateRole(member, MemberRole.Admin)"> {{ t('organization.setAsAdmin') }} </DropdownMenuItem>
                  <DropdownMenuItem @click="updateRole(member, MemberRole.Member)"> {{ t('organization.setAsMember') }} </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </template>
                <DropdownMenuItem class="text-destructive" @click="openKickModal(member)">
                  <UserX class="size-4 mr-2" /> {{ t('organization.kick') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <Dialog v-model:open="showInviteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('organization.inviteMember') }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>{{ t('organization.identity') }}</Label>
            <Input v-model="inviteForm.Identity" placeholder="username or email" />
          </div>
          <div class="space-y-2">
            <Label>{{ t('organization.role') }}</Label>
            <Select v-model.number="inviteForm.Role">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem :value="0">{{ t('organization.roleMember') }}</SelectItem>
                <SelectItem :value="1">{{ t('organization.roleAdmin') }}</SelectItem>
                <SelectItem :value="2">{{ t('organization.roleOwner') }}</SelectItem>
                <SelectItem :value="3">{{ t('organization.roleGuest') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showInviteDialog = false">{{ t('common.cancel') }}</Button>
          <Button @click="sendInvite" :disabled="isInviting || !inviteForm.Identity">
            <Loader2 v-if="isInviting" class="size-4 animate-spin mr-2" />
            {{ t('organization.inviteMember') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Kick Member Modal -->
    <AlertDialog v-model:open="showKickModal">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('organization.kick') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('organization.kickConfirm', { name: memberToKick?.DisplayName || '' }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="kickMember" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {{ t('organization.kick') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Leave Organization Modal -->
    <AlertDialog v-model:open="showLeaveModal">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('organization.leave') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('organization.leaveConfirm') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="leaveOrg" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {{ t('organization.leave') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
