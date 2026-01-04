<script setup lang="ts">
import { ref, inject, onMounted, type Ref, computed } from 'vue';
import { useI18n } from '@/i18n';
import { useUIStore } from '@/stores/ui';
import { httpClient } from '@/api/client';
import type { OrganizationDto, OrganizationMemberDto, InviteMemberRequestDto } from '@/api/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AssetView from '@/components/ui/AssetView.vue';
import { Loader2, UserPlus, MoreVertical, Shield, Trash2, LogOut } from 'lucide-vue-next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const ui = useUIStore();
const router = useRouter();

const org = inject<Ref<OrganizationDto | null>>('orgContext');
const members = ref<OrganizationMemberDto[]>([]);
const isLoading = ref(true);

// Invite State
const showInvite = ref(false);
const inviteForm = ref<InviteMemberRequestDto>({ Identity: '', Role: 'Member' });
const isInviting = ref(false);

const myRole = computed(() => org?.value?.MyRole);
const isOwner = computed(() => myRole.value === 'Owner');
const isAdmin = computed(() => myRole.value === 'Admin');

const canManage = computed(() => isOwner.value || isAdmin.value);

const fetchMembers = async () => {
  if (!org?.value) return;
  isLoading.value = true;
  try {
    members.value = await httpClient<OrganizationMemberDto[]>(`/orgs/${org.value.AccountName}/members`);
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const inviteMember = async () => {
  if (!org?.value) return;
  isInviting.value = true;
  try {
    await httpClient(`/orgs/${org.value.AccountName}/members`, {
      method: 'POST',
      body: JSON.stringify(inviteForm.value)
    });
    ui.notify(t('common.success'), 'success');
    showInvite.value = false;
    inviteForm.value = { Identity: '', Role: 'Member' };
    fetchMembers(); // Refresh list (though invite is pending, logic might vary)
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isInviting.value = false;
  }
};

const updateRole = async (member: OrganizationMemberDto, newRole: string) => {
  if (!org?.value) return;
  try {
    await httpClient(`/orgs/${org.value.AccountName}/members/${member.AccountName}`, {
      method: 'PATCH',
      body: JSON.stringify({ Role: newRole })
    });
    ui.notify(t('common.success'), 'success');
    member.Role = newRole as any;
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const kickMember = async (member: OrganizationMemberDto) => {
  if (!org?.value) return;
  if (!confirm(t('organization.kickConfirm', { name: member.DisplayName }))) return;

  try {
    await httpClient(`/orgs/${org.value.AccountName}/members/${member.AccountName}`, {
      method: 'DELETE'
    });
    ui.notify(t('common.success'), 'success');
    members.value = members.value.filter(m => m.AccountId !== member.AccountId);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const leaveOrg = async () => {
  if (!org?.value) return;
  if (!confirm(t('organization.leaveConfirm'))) return;

  try {
    await httpClient(`/orgs/${org.value.AccountName}/members/me`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    router.push('/dashboard');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

onMounted(fetchMembers);
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">

    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold">{{ t('organization.members') }} ({{ members.length }})</h2>
      <div class="flex gap-2">
        <Button v-if="!isOwner" variant="outline" class="text-destructive hover:bg-destructive/10" @click="leaveOrg">
          <LogOut class="size-4 mr-2" /> {{ t('organization.leave') }}
        </Button>
        <Button v-if="canManage" @click="showInvite = true">
          <UserPlus class="size-4 mr-2" /> {{ t('organization.inviteMember') }}
        </Button>
      </div>
    </div>

    <div class="grid gap-4">
      <Card v-for="member in members" :key="member.AccountId" class="flex items-center p-4 gap-4">
        <AssetView :asset="member.Avatar" :fallback-name="member.DisplayName" class-name="size-10 rounded-full border" />

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-bold truncate">{{ member.DisplayName }}</span>
            <Badge variant="secondary" class="text-[10px]">{{ member.Role }}</Badge>
          </div>
          <p class="text-xs text-muted-foreground">@{{ member.AccountName }} • {{ t('organization.joinedAt') }}: {{ new Date(member.JoinedAt).toLocaleDateString() }}</p>
        </div>

        <!-- Actions -->
        <div v-if="canManage && member.Role !== 'Owner'" class="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon"><MoreVertical class="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <template v-if="isOwner">
                <DropdownMenuItem @click="updateRole(member, 'Admin')">Set as Admin</DropdownMenuItem>
                <DropdownMenuItem @click="updateRole(member, 'Member')">Set as Member</DropdownMenuItem>
                <DropdownMenuItem @click="updateRole(member, 'Guest')">Set as Guest</DropdownMenuItem>
              </template>
              <DropdownMenuItem class="text-destructive" @click="kickMember(member)">
                <Trash2 class="size-4 mr-2" /> {{ t('organization.kick') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </div>

    <!-- Invite Modal -->
    <Dialog v-model:open="showInvite">
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
            <Select v-model="inviteForm.Role">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">{{ t('organization.roleAdmin') }}</SelectItem>
                <SelectItem value="Member">{{ t('organization.roleMember') }}</SelectItem>
                <SelectItem value="Guest">{{ t('organization.roleGuest') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button @click="inviteMember" :disabled="isInviting">
            <Loader2 v-if="isInviting" class="mr-2 size-4 animate-spin" />
            {{ t('auth.sendCode') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  </div>
</template>
