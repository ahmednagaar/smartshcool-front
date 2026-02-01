import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    StartMatchingGameDto,
    SubmitMatchingGameDto,
    GameStartResponse,
    GameResultDto,
    MatchingLeaderboardEntry
} from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class MatchingGameService {
    private apiUrl = 'http://localhost:5000/api/MatchingGame';

    constructor(private http: HttpClient) { }

    startGame(dto: StartMatchingGameDto): Observable<GameStartResponse> {
        return this.http.post<GameStartResponse>(`${this.apiUrl}/start`, dto);
    }

    submitGame(dto: SubmitMatchingGameDto): Observable<GameResultDto> {
        return this.http.post<GameResultDto>(`${this.apiUrl}/submit`, dto);
    }

    getLeaderboard(grade: number, subject: number, top: number = 10): Observable<MatchingLeaderboardEntry[]> {
        let params = new HttpParams()
            .set('grade', grade.toString())
            .set('subject', subject.toString())
            .set('top', top.toString());

        return this.http.get<MatchingLeaderboardEntry[]>(`${this.apiUrl}/leaderboard`, { params });
    }

    getHistory(studentId: number, grade?: number, subject?: number): Observable<GameResultDto[]> {
        let params = new HttpParams();
        if (grade) params = params.set('grade', grade.toString());
        if (subject) params = params.set('subject', subject.toString());

        return this.http.get<GameResultDto[]>(`${this.apiUrl}/history/${studentId}`, { params });
    }
}
