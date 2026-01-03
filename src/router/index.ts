import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from "@/views/LoginView.vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import DashboardView from "@/views/DashboardView.vue";
import SettingsView from "@/views/SettingsView.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: { guest: true }
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/RegisterView.vue'),
            meta: { guest: true }
        },
        {
            path: '/forgot-password',
            name: 'forgot-password',
            component: () => import('@/views/ForgotPasswordView.vue'),
            meta: { guest: true }
        },
        {
            path: '/dashboard',
            component: DashboardLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: DashboardView
                },
                {
                    path: 'settings',
                    name: 'settings',
                    component: SettingsView
                }
            ]
        },
        { path: '/', redirect: '/dashboard' }
    ]
});

router.beforeEach(async (to, _from, next) => {
    const auth = useAuthStore();
    if (auth.token && !auth.user) await auth.fetchMe();

    if (to.meta.requiresAuth && !auth.isAuthenticated) return next('/login');
    if (to.meta.guest && auth.isAuthenticated) return next('/dashboard');
    next();
});

export default router;
