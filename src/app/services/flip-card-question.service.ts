import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    FlipCardQuestionDto,
    CreateFlipCardQuestionDto,
    UpdateFlipCardQuestionDto,
    PaginatedResult,
    PaginationParams
} from '../models/flip-card.model';

import { PaginatedResult as SharedPaginatedResult, PaginationParams as SharedPaginationParams } from '../models/drag-drop.model';

@Injectable({
    providedIn: 'root'
})
export class FlipCardQuestionService {
    private apiUrl = `${environment.apiUrl}/FlipCardQuestion`;

    constructor(private http: HttpClient) { }

    // Auth headers for admin-protected endpoints
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('accessToken');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    // Used by admin dashboard - requires auth
    getQuestions(gradeId: number, subjectId: number): Observable<FlipCardQuestionDto[]> {
        let params = new HttpParams()
            .set('gradeId', gradeId.toString())
            .set('subjectId', subjectId.toString());
        return this.http.get<FlipCardQuestionDto[]>(`${this.apiUrl}/grade/${gradeId}/subject/${subjectId}`, {
            headers: this.getAuthHeaders()
        });
    }

    // Admin operation - requires auth
    getById(id: number): Observable<FlipCardQuestionDto> {
        return this.http.get<FlipCardQuestionDto>(`${this.apiUrl}/${id}`, {
            headers: this.getAuthHeaders()
        });
    }

    // Admin operation - requires auth
    create(question: CreateFlipCardQuestionDto): Observable<FlipCardQuestionDto> {
        return this.http.post<FlipCardQuestionDto>(this.apiUrl, question, {
            headers: this.getAuthHeaders()
        });
    }

    // Admin operation - requires auth
    update(id: number, question: UpdateFlipCardQuestionDto): Observable<FlipCardQuestionDto> {
        return this.http.put<FlipCardQuestionDto>(`${this.apiUrl}/${id}`, question, {
            headers: this.getAuthHeaders()
        });
    }

    // Admin operation - requires auth
    delete(id: number): Observable<boolean> {
        return this.http.delete<boolean>(`${this.apiUrl}/${id}`, {
            headers: this.getAuthHeaders()
        });
    }

    // Admin operation - requires auth
    getCategories(gradeId?: number, subjectId?: number): Observable<string[]> {
        let params = new HttpParams();
        if (gradeId) params = params.set('gradeId', gradeId.toString());
        if (subjectId) params = params.set('subjectId', subjectId.toString());

        return this.http.get<string[]>(`${this.apiUrl}/categories`, {
            params,
            headers: this.getAuthHeaders()
        });
    }

    // Admin operation - requires auth  
    getAllPaginated(pagination: SharedPaginationParams): Observable<SharedPaginatedResult<FlipCardQuestionDto>> {
        let params = new HttpParams()
            .set('pageNumber', pagination.pageNumber.toString())
            .set('pageSize', pagination.pageSize.toString());

        if (pagination.searchTerm) {
            params = params.set('searchTerm', pagination.searchTerm);
        }

        return this.http.get<SharedPaginatedResult<FlipCardQuestionDto>>(`${this.apiUrl}/paginated`, {
            params,
            headers: this.getAuthHeaders()
        });
    }
}

