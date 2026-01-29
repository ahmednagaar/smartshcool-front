import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private apiUrl = 'http://localhost:5000/api/analytics';
    private visitorIdKey = 'nafes_visitor_id';

    constructor(private http: HttpClient) {
        this.ensureVisitorId();
    }

    private ensureVisitorId() {
        if (!localStorage.getItem(this.visitorIdKey)) {
            localStorage.setItem(this.visitorIdKey, uuidv4());
        }
    }

    getVisitorId(): string {
        this.ensureVisitorId();
        return localStorage.getItem(this.visitorIdKey) || '';
    }

    async logVisit() {
        const visitData = {
            visitorId: this.getVisitorId(),
            pagePath: window.location.pathname,
            userAgent: navigator.userAgent,
            deviceType: this.detectDeviceType(),
            source: document.referrer || 'direct'
        };

        try {
            await firstValueFrom(this.http.post(`${this.apiUrl}/visit`, visitData));
        } catch (error) {
            console.error('Failed to log visit', error);
        }
    }

    async logEvent(eventName: string, properties: any = {}) {
        const eventData = {
            visitorId: this.getVisitorId(),
            eventName: eventName,
            eventProperties: JSON.stringify(properties),
            pagePath: window.location.pathname
        };

        try {
            await firstValueFrom(this.http.post(`${this.apiUrl}/event`, eventData));
        } catch (error) {
            console.error('Failed to log event', error);
        }
    }



    getStats() {
        return this.http.get<{ totalVisits: number }>(`${this.apiUrl}/stats`);
    }

    private detectDeviceType(): string {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'Tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'Mobile';
        }
        return 'Desktop';
    }
}
