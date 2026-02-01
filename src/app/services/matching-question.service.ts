import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    CreateMatchingQuestionDto,
    MatchingQuestion,
    DifficultyLevel
} from '../models/models';
import { PaginatedResponse } from '../models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class MatchingQuestionService {
    private apiUrl = 'http://localhost:5000/api/MatchingQuestion';

    constructor(private http: HttpClient) { }

    search(
        page: number = 1,
        pageSize: number = 20,
        grade?: number,
        subject?: number,
        search?: string
    ): Observable<PaginatedResponse<MatchingQuestion>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        if (grade) params = params.set('grade', grade.toString());
        if (subject) params = params.set('subject', subject.toString());
        if (search) params = params.set('search', search);

        return this.http.get<PaginatedResponse<MatchingQuestion>>(this.apiUrl, { params });
    }

    getById(id: number): Observable<MatchingQuestion> {
        return this.http.get<MatchingQuestion>(`${this.apiUrl}/${id}`);
    }

    create(dto: CreateMatchingQuestionDto): Observable<MatchingQuestion> {
        return this.http.post<MatchingQuestion>(this.apiUrl, dto);
    }

    update(id: number, dto: Partial<CreateMatchingQuestionDto>): Observable<MatchingQuestion> {
        return this.http.put<MatchingQuestion>(`${this.apiUrl}/${id}`, dto);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    bulkImport(dtos: CreateMatchingQuestionDto[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/bulk-import`, dtos);
    }
}
