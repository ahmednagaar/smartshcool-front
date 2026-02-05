import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    GradeLevel,
    SubjectType,
    DragDropZoneDto,
    DragDropItemDto
} from '../models/drag-drop.model';

export interface StartGameRequestDto {
    questionId?: number;  // Optional - if not provided, backend gets random by grade/subject
    grade: GradeLevel;
    subject: SubjectType;
    difficulty?: number;  // Optional filter (DifficultyLevel enum)
}

export interface GameSessionDto {
    sessionId: number;
    questionId: number;
    gameTitle: string;
    instructions: string;
    timeLimit: number;
    showImmediateFeedback: boolean;
    uiTheme: string;
    zones: DragDropZoneDto[];
    items: DragDropItemDto[];
    currentScore: number;
    timeElapsedSeconds: number;
    completedItemIds: number[];
}

export interface SubmitAttemptRequestDto {
    sessionId: number;
    itemId: number;
    droppedInZoneId: number;
}

export interface SubmitAttemptResponseDto {
    isCorrect: boolean;
    pointsEarned: number;
    totalScore: number;
    message: string;
    isGameComplete: boolean;
}

export interface GameResultDto {
    sessionId: number;
    totalScore: number;
    maxPossibleScore: number;
    correctPlacements: number;
    wrongPlacements: number;
    timeSpentSeconds: number;
    stars: number;
    badgeUrl: string;
}

@Injectable({
    providedIn: 'root'
})
export class DragDropGameService {
    private apiUrl = `${environment.apiUrl}/DragDropGame`;

    constructor(private http: HttpClient) { }

    startSession(request: StartGameRequestDto): Observable<GameSessionDto> {
        return this.http.post<GameSessionDto>(`${this.apiUrl}/start`, request);
    }

    submitAttempt(request: SubmitAttemptRequestDto): Observable<SubmitAttemptResponseDto> {
        return this.http.post<SubmitAttemptResponseDto>(`${this.apiUrl}/attempt`, request);
    }

    completeGame(sessionId: number): Observable<GameResultDto> {
        return this.http.post<GameResultDto>(`${this.apiUrl}/complete/${sessionId}`, {});
    }

    getActiveSession(): Observable<GameSessionDto | null> {
        return this.http.get<GameSessionDto | null>(`${this.apiUrl}/active`);
    }
}
