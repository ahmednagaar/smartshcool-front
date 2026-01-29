import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const token = localStorage.getItem('accessToken');

    if (token) {
        try {
            const decoded: any = jwtDecode(token);
            // Check token expiration
            const exp = decoded.exp * 1000; // Convert seconds to milliseconds
            if (Date.now() >= exp) {
                // Token expired - clear it and redirect
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                router.navigate(['/admin/login']);
                return false;
            }
            return true;
        } catch (e) {
            // Invalid token - clear and redirect
            console.error('Token decode failed', e);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            router.navigate(['/admin/login']);
            return false;
        }
    }

    // No token - redirect to login
    router.navigate(['/admin/login']);
    return false;
};
