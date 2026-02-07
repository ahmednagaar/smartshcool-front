import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WheelSpinSegment } from '../models/wheel-game.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WheelSpinService {
    private apiUrl = `${environment.apiUrl}/WheelSpinSegment`;

    constructor(private http: HttpClient) { }

    getActiveSegments(): Observable<WheelSpinSegment[]> {
        return this.http.get<WheelSpinSegment[]>(this.apiUrl);
    }
}
