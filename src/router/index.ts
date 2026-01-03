import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        
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
