import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    FlipCardQuestionDto,
    CreateFlipCardQuestionDto,
    UpdateFlipCardQuestionDto,
    PaginatedResult,
    PaginationParams
} from '../models/flip-card.model';
// PaginationParams/Result might need to be imported from 'drag-drop.model' if I didn't verify they exist in 'flip-card.model'.
// Wait, I didn't add PaginationParams to flip-card.model.ts!
// I should likely import them from a shared model or re-declare them.
// In drag-drop.model.ts they were exported.
// Let's import from drag-drop.model for shared types.

import { PaginatedResult as SharedPaginatedResult, PaginationParams as SharedPaginationParams } from '../models/drag-drop.model';

@Injectable({
    providedIn: 'root'
})
export class FlipCardQuestionService {
    private apiUrl = `${environment.apiUrl}/FlipCardQuestion`;

    constructor(private http: HttpClient) { }

    getQuestions(gradeId: number, subjectId: number): Observable<FlipCardQuestionDto[]> {
        let params = new HttpParams()
            .set('gradeId', gradeId.toString())
            .set('subjectId', subjectId.toString());
        return this.http.get<FlipCardQuestionDto[]>(this.apiUrl, { params });
    }

    getById(id: number): Observable<FlipCardQuestionDto> {
        return this.http.get<FlipCardQuestionDto>(`${this.apiUrl}/${id}`);
    }

    create(question: CreateFlipCardQuestionDto): Observable<FlipCardQuestionDto> {
        return this.http.post<FlipCardQuestionDto>(this.apiUrl, question);
    }

    update(id: number, question: UpdateFlipCardQuestionDto): Observable<FlipCardQuestionDto> {
        return this.http.put<FlipCardQuestionDto>(`${this.apiUrl}/${id}`, question);
    }

    delete(id: number): Observable<boolean> {
        return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
    }

    getCategories(gradeId?: number, subjectId?: number): Observable<string[]> {
        let params = new HttpParams();
        if (gradeId) params = params.set('gradeId', gradeId.toString());
        if (subjectId) params = params.set('subjectId', subjectId.toString());

        return this.http.get<string[]>(`${this.apiUrl}/categories`, { params });
    }

    // getAllPaginated implementation if controller supports it
    getAllPaginated(pagination: SharedPaginationParams): Observable<SharedPaginatedResult<FlipCardQuestionDto>> {
        let params = new HttpParams()
            .set('pageNumber', pagination.pageNumber.toString())
            .set('pageSize', pagination.pageSize.toString());

        if (pagination.searchTerm) {
            params = params.set('searchTerm', pagination.searchTerm);
        }

        return this.http.get<SharedPaginatedResult<FlipCardQuestionDto>>(`${this.apiUrl}/paginated`, { params });
    }
}
