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
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MatchingGameService {
    private apiUrl = `${environment.apiUrl}/MatchingGame`;
    private apiUrlAdmin = `${environment.apiUrl}/MatchingGameAdmin`;

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
    getGames(page: number, pageSize: number, grade?: GradeLevel, subject?: SubjectType, search?: string): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        if (grade) params = params.set('grade', grade.toString());
        if (subject) params = params.set('subject', subject.toString());
        if (search) params = params.set('search', search);

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
