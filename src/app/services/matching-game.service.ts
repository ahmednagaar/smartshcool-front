import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    StartMatchingGameDto,
    MatchingGameStartResponseDto,
    ValidateMatchDto,
    MatchResultDto,
    HintResponseDto,
    SessionCompleteDto,
    MatchingLeaderboardDto,
    MatchingGameDto,
    CreateMatchingGameDto,
    UpdateMatchingGameDto,
    GradeLevel,
    SubjectType
} from '../models/matching-game.model';

@Injectable({
    providedIn: 'root'
})
export class MatchingGameService {
    private apiUrl = 'http://localhost:5000/api/MatchingGame';
    private apiUrlAdmin = 'http://localhost:5000/api/MatchingGameAdmin';

    constructor(private http: HttpClient) { }

    startGame(dto: StartMatchingGameDto): Observable<MatchingGameStartResponseDto> {
        return this.http.post<MatchingGameStartResponseDto>(`${this.apiUrl}/start`, dto);
    }

    validateMatch(dto: ValidateMatchDto): Observable<MatchResultDto> {
        return this.http.post<MatchResultDto>(`${this.apiUrl}/validate`, dto);
    }

    getHint(sessionId: number): Observable<HintResponseDto> {
        return this.http.post<HintResponseDto>(`${this.apiUrl}/hint/${sessionId}`, {});
    }

    completeSession(sessionId: number): Observable<SessionCompleteDto> {
        return this.http.post<SessionCompleteDto>(`${this.apiUrl}/complete/${sessionId}`, {});
    }

    getHistory(grade?: GradeLevel, subject?: SubjectType): Observable<SessionCompleteDto[]> {
        let params = new HttpParams();
        if (grade) params = params.set('grade', grade.toString());
        if (subject) params = params.set('subject', subject.toString());

        return this.http.get<SessionCompleteDto[]>(`${this.apiUrl}/history`, { params });
    }

    getLeaderboard(grade: GradeLevel, subject: SubjectType): Observable<MatchingLeaderboardDto[]> {
        let params = new HttpParams()
            .set('grade', grade.toString())
            .set('subject', subject.toString());

        return this.http.get<MatchingLeaderboardDto[]>(`${this.apiUrl}/leaderboard`, { params });
    }

    // Admin Methods
    getGames(page: number, pageSize: number, grade?: GradeLevel, subject?: SubjectType): Observable<any> { // PaginatedResult<MatchingGameDto>
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        if (grade) params = params.set('grade', grade.toString());
        if (subject) params = params.set('subject', subject.toString());

        return this.http.get<any>(`${this.apiUrlAdmin}`, { params });
    }

    getGameById(id: number): Observable<MatchingGameDto> {
        return this.http.get<MatchingGameDto>(`${this.apiUrlAdmin}/${id}`);
    }

    createGame(dto: CreateMatchingGameDto): Observable<MatchingGameDto> {
        return this.http.post<MatchingGameDto>(`${this.apiUrlAdmin}`, dto);
    }

    updateGame(id: number, dto: UpdateMatchingGameDto): Observable<MatchingGameDto> {
        return this.http.put<MatchingGameDto>(`${this.apiUrlAdmin}/${id}`, dto);
    }

    deleteGame(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrlAdmin}/${id}`);
    }
}
