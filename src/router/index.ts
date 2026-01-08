import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from "@/views/LoginView.vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import DashboardView from "@/views/DashboardView.vue";
import SettingsView from "@/views/SettingsView.vue";
import PublicLayout from "@/layouts/PublicLayout.vue";
import PublicProfileView from "@/views/PublicProfileView.vue";
import CreateOrganizationView from "@/views/CreateOrganizationView.vue";
import NotificationsView from "@/views/NotificationsView.vue";
import InvitationsView from "@/views/InvitationsView.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // 1. Auth Routes
        { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
        { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },
        { path: '/forgot-password', name: 'forgot-password', component: () => import('@/views/ForgotPasswordView.vue'), meta: { guest: true } },

        // 2. Dashboard Routes (Protected)
        {
            path: '/dashboard',
            component: DashboardLayout,
            meta: { requiresAuth: true },
            children: [
                { path: '', name: 'dashboard', component: DashboardView },
                { path: 'settings', name: 'settings', component: SettingsView },
                { path: 'notifications', name: 'notifications', component: NotificationsView },
                { path: 'invitations', name: 'invitations', component: InvitationsView },
                { path: 'assets', name: 'asset-library', component: () => import('@/views/AssetLibraryView.vue') },
                { path: 'profile/edit', name: 'profile-edit', component: () => import('@/views/ProfileEditView.vue') },
                { path: 'manage/:resource', name: 'resource-manager', component: () => import('@/views/ResourceManager.vue'), props: true },

                {
                    path: 'create-org',
                    name: 'create-org',
                    component: CreateOrganizationView
                },
                
                // Organization Routes
                {
                    path: 'orgs/:accountName',
                    name: 'org-dashboard',
                    component: () => import('@/views/org/OrgDashboardView.vue'),
                    props: true
                },
                {
                    path: 'orgs/:accountName/edit',
                    name: 'org-profile-edit',
                    component: () => import('@/views/org/OrgProfileEditView.vue'),
                    props: true
                },
                {
                    path: 'orgs/:accountName/settings',
                    name: 'org-settings',
                    component: () => import('@/views/org/OrgSettingsView.vue'),
                    props: true
                },
                {
                    path: 'orgs/:accountName/manage/:resource',
                    name: 'org-resource-manager',
                    component: () => import('@/views/ResourceManager.vue'),
                    props: (route) => ({
                        resource: route.params.resource,
                        apiPrefix: `/orgs/${route.params.accountName}`
                    })
                },
                {
                    path: 'orgs/:accountName/assets',
                    name: 'org-assets',
                    component: () => import('@/views/org/OrgAssetLibraryView.vue'),
                    props: true
                },

                // Admin
                {
                    path: 'admin',
                    name: 'admin-dashboard',
                    component: () => import('@/views/admin/AdminDashboardView.vue'),
                    meta: { adminOnly: true }
                },
            ]
        },

        // 3. Public Routes (Layout)
        {
            path: '/',
            component: PublicLayout,
            children: [
                { path: '', redirect: '/login' },
                {
                    path: ':id',
                    name: 'public-profile',
                    component: PublicProfileView
                }
            ]
        }
    ],
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) return savedPosition;
        return { top: 0 };
    }
});

router.beforeEach(async (to, _from, next) => {
    const auth = useAuthStore();

    if (auth.token && !auth.user) {
        try {
            await auth.fetchMe();
        } catch (e) {
            console.error("Failed to restore session", e);
        }
    }

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return next('/login');
    }

    if (to.meta.adminOnly && !auth.isAdmin) {
        return next('/dashboard');
    }

    if (to.meta.guest && auth.isAuthenticated) {
        return next('/dashboard');
    }

    next();
});

export default router;
