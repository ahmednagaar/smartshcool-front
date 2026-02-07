import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    StartWheelGameDto,
    StartGameResponse,
    SpinResult,
    SpinWheelDto,
    SubmitAnswerDto,
    AnswerResult,
    GetHintDto,
    HintResponse,
    WheelLeaderboardEntry,
    StudentStatistics
} from '../models/wheel-game.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WheelGameService {
    private apiUrl = `${environment.apiUrl}/WheelGame`;

    constructor(private http: HttpClient) { }

    startGame(data: StartWheelGameDto): Observable<StartGameResponse> {
        return this.http.post<StartGameResponse>(`${this.apiUrl}/start`, data);
    }

    spinWheel(data: SpinWheelDto): Observable<SpinResult> {
        return this.http.post<SpinResult>(`${this.apiUrl}/spin`, data);
    }

    submitAnswer(data: SubmitAnswerDto): Observable<AnswerResult> {
        return this.http.post<AnswerResult>(`${this.apiUrl}/submit`, data);
    }

    getHint(data: GetHintDto): Observable<HintResponse> {
        return this.http.post<HintResponse>(`${this.apiUrl}/hint`, data);
    }

    getLeaderboard(gradeId: number, subjectId: number): Observable<WheelLeaderboardEntry[]> {
        const params = new HttpParams()
            .set('gradeId', gradeId.toString())
            .set('subjectId', subjectId.toString());
        return this.http.get<WheelLeaderboardEntry[]>(`${this.apiUrl}/leaderboard`, { params });
    }

    getStudentStats(studentId: number): Observable<StudentStatistics> {
        return this.http.get<StudentStatistics>(`${this.apiUrl}/stats/${studentId}`);
    }
}
