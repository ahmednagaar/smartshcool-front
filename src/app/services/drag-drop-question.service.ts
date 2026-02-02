import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    DragDropQuestionDto,
    CreateDragDropQuestionDto,
    UpdateDragDropQuestionDto,
    PaginatedResult,
    PaginationParams,
    UITheme,
    GradeLevel,
    SubjectType
} from '../models/drag-drop.model';

@Injectable({
    providedIn: 'root'
})
export class DragDropQuestionService {
    private apiUrl = `${environment.apiUrl}/DragDropQuestion`;

    constructor(private http: HttpClient) { }

    getQuestions(
        params: PaginationParams,
        grade?: GradeLevel,
        subject?: SubjectType
    ): Observable<PaginatedResult<DragDropQuestionDto>> {
        let httpParams = new HttpParams()
            .set('pageNumber', params.pageNumber.toString())
            .set('pageSize', params.pageSize.toString());

        if (params.searchTerm) {
            httpParams = httpParams.set('searchTerm', params.searchTerm);
        }

        if (grade) {
            httpParams = httpParams.set('grade', grade.toString());
        }

        if (subject) {
            httpParams = httpParams.set('subject', subject.toString());
        }

        return this.http.get<PaginatedResult<DragDropQuestionDto>>(this.apiUrl, { params: httpParams });
    }

    getQuestionById(id: number): Observable<DragDropQuestionDto> {
        return this.http.get<DragDropQuestionDto>(`${this.apiUrl}/${id}`);
    }

    createQuestion(question: CreateDragDropQuestionDto): Observable<DragDropQuestionDto> {
        return this.http.post<DragDropQuestionDto>(this.apiUrl, question);
    }

    updateQuestion(id: number, question: UpdateDragDropQuestionDto): Observable<DragDropQuestionDto> {
        return this.http.put<DragDropQuestionDto>(`${this.apiUrl}/${id}`, question);
    }

    deleteQuestion(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getThemes(): Observable<UITheme[]> {
        return this.http.get<UITheme[]>(`${this.apiUrl}/themes`);
    }
}
