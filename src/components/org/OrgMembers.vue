<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import {
  type OrganizationMemberDto,
  type OrganizationPermissionsDto,
  MemberRole,
  Visibility,
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
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
import { Loader2, MoreHorizontal, UserPlus, UserX, Crown, LogOut, Eye, EyeOff } from 'lucide-vue-next';

const props = defineProps<{
  accountName: string;
  accountId?: string;
  myRole: MemberRole;
}>();

const { t } = useI18n();
const ui = useUIStore();

const members = ref<OrganizationMemberDto[]>([]);
const myMemberData = ref<OrganizationMemberDto | null>(null);
const permissions = ref<OrganizationPermissionsDto | null>(null);
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
const canInvite = computed(() => permissions.value?.CanInvite ?? false);

const showKickModal = ref(false);
const memberToKick = ref<OrganizationMemberDto | null>(null);
const showLeaveModal = ref(false);

// --- Actions ---

const fetchPermissions = async () => {
  try {
    permissions.value = await httpClient<OrganizationPermissionsDto>(`/orgs/${props.accountName}/permissions`);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const fetchMembers = async () => {
  isLoading.value = true;
  try {
    members.value = await httpClient<OrganizationMemberDto[]>(`/orgs/${props.accountName}/members`);
    // Find current user's data
    // Note: props.accountId is the current user's ID passed from parent
    myMemberData.value = members.value.find(m => m.AccountId === props.accountId) || null;
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
    inviteForm.value.Identity = '';
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

const updateVisibility = async (member: OrganizationMemberDto, newVisibility: Visibility) => {
  // Determine endpoint: /me for self, /id for others
  const isMe = member.AccountId === props.accountId;
  const endpoint = isMe
      ? `/orgs/${props.accountName}/members/me`
      : `/orgs/${props.accountName}/members/${member.AccountId}`;

  actionLoading.value = member.AccountId;
  try {
    const payload: UpdateMemberRequestDto = { Visibility: newVisibility };
    await httpClient(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    member.Visibility = newVisibility;
    if (isMe) {
      myMemberData.value = member;
    }
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

const canManage = (target: OrganizationMemberDto) => {
  if (!isAdmin.value) return false;
  // if (target.AccountId == props.accountId) return false;
  if (props.myRole === MemberRole.Admin && target.Role === MemberRole.Admin) return false;
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

const getVisibilityLabel = (v: Visibility) => {
  switch(v) {
    case Visibility.Public: return t('common.public');
    case Visibility.Private: return t('common.private');
    case Visibility.Protected: return t('common.protected');
    case Visibility.MembersOnly: return t('common.membersOnly');
    default: return 'Unknown';
  }
};

onMounted(() => {
  fetchMembers();
  fetchPermissions();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Actions -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-bold">{{ t('organization.members') }} ({{ members.length }})</h3>
      <div class="flex gap-2">
        <!-- My Visibility Dropdown (Next to Leave Org) -->
        <DropdownMenu v-if="myMemberData">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" :disabled="actionLoading === myMemberData.AccountId">
              <Loader2 v-if="actionLoading === myMemberData.AccountId" class="size-4 animate-spin mr-2" />
              <Eye v-else class="size-4 mr-2" />
              {{ getVisibilityLabel(myMemberData.Visibility) }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel class="text-xs opacity-50">{{ t('organization.changeMyVisibility') }}</DropdownMenuLabel>
            <DropdownMenuItem @click="updateVisibility(myMemberData, Visibility.Public)">
              {{ t('common.public') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="updateVisibility(myMemberData, Visibility.Private)">
              {{ t('common.private') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="updateVisibility(myMemberData, Visibility.Protected)">
              {{ t('common.protected') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="updateVisibility(myMemberData, Visibility.MembersOnly)">
              {{ t('common.membersOnly') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button v-if="!isOwner" variant="outline" class="text-destructive border-destructive/30 hover:bg-destructive/10" @click="openLeaveModal">
          <LogOut class="size-4 mr-2" /> {{ t('organization.leave') }}
        </Button>

        <Button v-if="canInvite" @click="showInviteDialog = true">
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
            <Badge variant="outline" class="text-[10px]">
              <Eye v-if="member.Visibility === Visibility.Public" class="size-3 mr-1" />
              <EyeOff v-else class="size-3 mr-1" />
              {{ getVisibilityLabel(member.Visibility) }}
            </Badge>

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
                  <DropdownMenuLabel class="text-xs opacity-50">{{ t('organization.role') }}</DropdownMenuLabel>
                  <DropdownMenuItem @click="updateRole(member, MemberRole.Owner)"> {{ t('organization.setAsOwner') }} </DropdownMenuItem>
                  <DropdownMenuItem @click="updateRole(member, MemberRole.Admin)"> {{ t('organization.setAsAdmin') }} </DropdownMenuItem>
                  <DropdownMenuItem @click="updateRole(member, MemberRole.Member)"> {{ t('organization.setAsMember') }} </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuLabel class="text-xs opacity-50">{{ t('common.visibility') }}</DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Eye class="size-4 mr-2" /> {{ getVisibilityLabel(member.Visibility) }}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem @click="updateVisibility(member, Visibility.Public)">
                        {{ t('common.public') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="updateVisibility(member, Visibility.Private)">
                        {{ t('common.private') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="updateVisibility(member, Visibility.Protected)">
                        {{ t('common.protected') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="updateVisibility(member, Visibility.MembersOnly)">
                        {{ t('common.membersOnly') }}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
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
