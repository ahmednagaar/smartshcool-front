import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateWheelQuestionDto, WheelQuestion } from '../models/wheel-game.model';
import { PaginatedResponse } from '../models/api-response.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WheelQuestionService {
    private apiUrl = `${environment.apiUrl}/WheelQuestion`;

    constructor(private http: HttpClient) { }

    // Auth headers for admin-protected endpoints
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('accessToken');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    getQuestions(
        page: number = 1,
        pageSize: number = 20,
        gradeId?: number,
        subjectId?: number,
        search?: string
    ): Observable<PaginatedResponse<WheelQuestion>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        if (gradeId) params = params.set('grade', gradeId.toString());
        if (subjectId) params = params.set('subject', subjectId.toString());
        if (search) params = params.set('search', search);

        return this.http.get<PaginatedResponse<WheelQuestion>>(this.apiUrl, {
            params,
            headers: this.getAuthHeaders()
        });
    }

    getById(id: number): Observable<WheelQuestion> {
        return this.http.get<WheelQuestion>(`${this.apiUrl}/${id}`, {
            headers: this.getAuthHeaders()
        });
    }

    create(question: CreateWheelQuestionDto): Observable<WheelQuestion> {
        return this.http.post<WheelQuestion>(this.apiUrl, question, {
            headers: this.getAuthHeaders()
        });
    }

    update(id: number, question: Partial<WheelQuestion>): Observable<WheelQuestion> {
        return this.http.put<WheelQuestion>(`${this.apiUrl}/${id}`, question, {
            headers: this.getAuthHeaders()
        });
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, {
            headers: this.getAuthHeaders()
        });
    }

    getCategories(gradeId?: number, subjectId?: number): Observable<string[]> {
        let params = new HttpParams();
        if (gradeId) params = params.set('grade', gradeId.toString());
        if (subjectId) params = params.set('subject', subjectId.toString());

        return this.http.get<string[]>(`${this.apiUrl}/categories`, {
            params,
            headers: this.getAuthHeaders()
        });
    }
}
