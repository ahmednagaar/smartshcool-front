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
        // Controller expects [FromBody] CompleteSessionRequest { SessionId }
        return this.http.post<SessionCompleteDto>(`${this.apiUrl}/complete`, { sessionId });
    }

    getLeaderboard(gradeId: number, subjectId: number): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.apiUrl}/leaderboard?gradeId=${gradeId}&subjectId=${subjectId}`
        );
    }
}
