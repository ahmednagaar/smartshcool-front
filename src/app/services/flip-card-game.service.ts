import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    StartFlipCardGameDto,
    GameStartResponseDto,
    RecordMatchDto,
    RecordWrongMatchDto,
    MatchResultDto,
    SessionCompleteDto
} from '../models/flip-card.model';

@Injectable({
    providedIn: 'root'
})
export class FlipCardGameService {
    private apiUrl = `${environment.apiUrl}/FlipCardGame`;

    constructor(private http: HttpClient) { }

    startSession(request: StartFlipCardGameDto): Observable<GameStartResponseDto> {
        return this.http.post<GameStartResponseDto>(`${this.apiUrl}/start`, request);
    }

    recordMatch(request: RecordMatchDto): Observable<MatchResultDto> {
        return this.http.post<MatchResultDto>(`${this.apiUrl}/match`, request);
    }

    recordWrongMatch(request: RecordWrongMatchDto): Observable<boolean> {
        return this.http.post<boolean>(`${this.apiUrl}/wrong-match`, request);
    }

    getHint(sessionId: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/hint`, { sessionId });
    }

    completeSession(sessionId: number): Observable<SessionCompleteDto> {
        // Updated to pass sessionId as query param if Controller expects int, 
        // OR as body if Controller expects [FromBody] int (which is weird in ASP.NET).
        // Controller: public async Task<IActionResult> CompleteSession(int sessionId)
        // If it's [HttpPost("complete")], and argument is "int sessionId", it usually expects query string ?sessionId=123
        // unless [FromBody] is explicit. My controller code didn't specify [FromBody] for simple int usually.
        // Let's assume query param or check controller.
        // Controller Code: public async Task<IActionResult> CompleteSession(int sessionId)
        // Default binding for simple types is Query/Route.
        return this.http.post<SessionCompleteDto>(`${this.apiUrl}/complete?sessionId=${sessionId}`, {});
    }
}
