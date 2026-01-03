import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            component: () => import('../views/auth/Login.vue'),
            meta: { guest: true }
        },
        {
            path: '/dashboard',
            component: () => import('../layouts/DashboardLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                { path: '', component: () => import('../views/dashboard/ConsoleHome.vue') },
                {
                    path: 'admin',
                    component: () => import('../views/admin/AdminDashboard.vue'),
                    meta: { requiresAdmin: true }
                }
            ]
        },
        {
            path: '/:username',
            component: () => import('../views/public/PublicProfile.vue')
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
