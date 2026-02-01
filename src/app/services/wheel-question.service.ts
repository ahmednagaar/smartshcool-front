import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateWheelQuestionDto, WheelQuestion } from '../models/wheel-game.model';
import { PaginatedResponse } from '../models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class WheelQuestionService {
    private apiUrl = 'http://localhost:5000/api/WheelQuestion';

    constructor(private http: HttpClient) { }

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

        return this.http.get<PaginatedResponse<WheelQuestion>>(this.apiUrl, { params });
    }

    getById(id: number): Observable<WheelQuestion> {
        return this.http.get<WheelQuestion>(`${this.apiUrl}/${id}`);
    }

    create(question: CreateWheelQuestionDto): Observable<WheelQuestion> {
        return this.http.post<WheelQuestion>(this.apiUrl, question);
    }

    update(id: number, question: Partial<WheelQuestion>): Observable<WheelQuestion> {
        return this.http.put<WheelQuestion>(`${this.apiUrl}/${id}`, question);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getCategories(gradeId?: number, subjectId?: number): Observable<string[]> {
        let params = new HttpParams();
        if (gradeId) params = params.set('grade', gradeId.toString());
        if (subjectId) params = params.set('subject', subjectId.toString());

        return this.http.get<string[]>(`${this.apiUrl}/categories`, { params });
    }
}
