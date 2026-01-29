import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const roleGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const token = localStorage.getItem('accessToken');

    if (!token) {
        router.navigate(['/admin/login']);
        return false;
    }

    try {
        const decoded: any = jwtDecode(token);
        const userRole = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

        // Check if route matches
        const expectedRoles = route.data['roles'] as string[];

        if (expectedRoles && expectedRoles.length > 0) {
            if (expectedRoles.includes(userRole)) {
                return true;
            } else {
                alert('ليس لديك صلاحية للوصول إلى هذه الصفحة'); // Access Denied
                // router.navigate(['/admin/dashboard']); 
                return false;
            }
        }
        return true; // No roles defined, allow
    } catch (e) {
        console.error('Token decode failed', e);
        router.navigate(['/admin/login']);
        return false;
    }
};
