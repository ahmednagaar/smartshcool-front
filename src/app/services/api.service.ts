import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, delay } from 'rxjs/operators';
import { MOCK_QUESTIONS } from '../data/mock-questions';
import {
    Student,
    Question,
    Game,
    GameWithQuestions,
    TestResult,
    SubmitTestDto,
    LeaderboardEntryDto,
    StudentStatsDto,
    AchievementDto
} from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = 'http://localhost:5000/api';
    private useMockData = true; // Set to true for Vercel demo without backend

    constructor(private http: HttpClient) { }

    // Question Endpoints
    getQuestions(params?: {
        page?: number;
        pageSize?: number;
        grade?: number;
        subject?: number;
        type?: number; // QuestionType
        testType?: number; // TestType (e.g. 1=Traditional, 2=Central)
        difficulty?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }): Observable<any> {
        if (this.useMockData) {
            console.warn('⚠️ MOCK DATA MODE: Returning static questions');
            let filtered = [...MOCK_QUESTIONS];

            if (params) {
                if (params.grade) filtered = filtered.filter(q => q.grade === Number(params.grade));
                if (params.subject) filtered = filtered.filter(q => q.subject === Number(params.subject));
                if (params.type) filtered = filtered.filter(q => q.type === Number(params.type));
                if (params.testType) filtered = filtered.filter(q => q.testType === Number(params.testType));
                if (params.difficulty) filtered = filtered.filter(q => q.difficulty === Number(params.difficulty));
                if (params.search) filtered = filtered.filter(q => q.text.includes(params.search!) || q.correctAnswer.includes(params.search!));
            }

            return of({
                data: filtered,
                page: params?.page || 1,
                pageSize: params?.pageSize || 20,
                totalCount: filtered.length,
                totalPages: 1
            }).pipe(delay(500)); // Simulate network delay
        }

        let url = `${this.apiUrl}/question`;
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
            if (params.grade) queryParams.append('grade', params.grade.toString());
            if (params.subject) queryParams.append('subject', params.subject.toString());
            if (params.type) queryParams.append('type', params.type.toString());
            if (params.testType) queryParams.append('testType', params.testType.toString());
            if (params.difficulty) queryParams.append('difficulty', params.difficulty.toString());
            if (params.search) queryParams.append('search', params.search);
            if (params.sortBy) queryParams.append('sortBy', params.sortBy);
            if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
            const queryString = queryParams.toString();
            if (queryString) url += `?${queryString}`;
        }
        return this.http.get<any>(url);
    }

    // Question Stats for Dashboard
    getQuestionStats(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/question/stats`);
    }


    // Game Endpoints
    getGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.apiUrl}/game`);
    }

    getGameWithQuestions(id: number): Observable<GameWithQuestions> {
        return this.http.get<GameWithQuestions>(`${this.apiUrl}/game/${id}/questions`);
    }

    // Test Result Endpoints
    submitTest(submitTestDto: SubmitTestDto): Observable<TestResult> {
        return this.http.post<TestResult>(`${this.apiUrl}/testresult/submit`, submitTestDto);
    }

    getTestResultsByStudent(studentId: number): Observable<TestResult[]> {
        return this.http.get<TestResult[]>(`${this.apiUrl}/testresult/student/${studentId}`);
    }

    // NEW: Leaderboard
    getLeaderboard(top: number = 10): Observable<LeaderboardEntryDto[]> {
        return this.http.get<LeaderboardEntryDto[]>(`${this.apiUrl}/testresult/leaderboard?top=${top}`);
    }

    // NEW: Student Stats
    getStudentStats(studentId: number): Observable<StudentStatsDto> {
        return this.http.get<StudentStatsDto>(`${this.apiUrl}/testresult/stats/${studentId}`);
    }

    // NEW: Achievements
    getStudentAchievements(studentId: number): Observable<AchievementDto[]> {
        return this.http.get<AchievementDto[]>(`${this.apiUrl}/achievement/student/${studentId}`);
    }

    // NEW: Student Authentication
    studentRegister(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/student/register`, data);
    }

    studentLogin(studentCode: string, pin: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/student/login`, { studentCode, pin });
    }

    // NEW: Parent Portal
    parentRegister(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/parent/register`, data);
    }

    parentLogin(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/parent/login`, data);
    }

    // NEW: Admin Authentication
    adminRegister(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/admin/register`, data);
    }

    getParentChildProgress(studentId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/parent/child-progress/${studentId}`);
    }

    // Wheel Game Endpoints
    saveWheelResult(result: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/wheel/result`, result);
    }

    getWheelLeaderboard(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/wheel/leaderboard`);
    }

    getWheelStats(studentId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/wheel/stats/${studentId}`);
    }

    // Generic POST method
    post<T>(endpoint: string, data: any): Observable<T> {
        return this.http.post<T>(`${this.apiUrl}${endpoint}`, data);
    }

    // Generic PUT method
    put<T>(endpoint: string, data: any): Observable<T> {
        return this.http.put<T>(`${this.apiUrl}${endpoint}`, data);
    }

    // Generic DELETE method
    delete<T>(endpoint: string): Observable<T> {
        return this.http.delete<T>(`${this.apiUrl}${endpoint}`);
    }

    // Admin Dashboard
    getDashboardStats(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/admin/dashboard-stats`, { headers: this.getAuthHeaders() });
    }

    // Admin Question Management
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn('⚠️ No access token found in localStorage!');
        }
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    createQuestion(question: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/question`, question, { headers: this.getAuthHeaders() });
    }

    updateQuestion(id: number, question: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/question/${id}`, question, { headers: this.getAuthHeaders() });
    }

    deleteQuestion(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/question/${id}`, { headers: this.getAuthHeaders() });
    }

    restoreQuestion(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/question/restore/${id}`, {}, { headers: this.getAuthHeaders() });
    }

    getQuestionAnalytics(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/question/analytics/${id}`, { headers: this.getAuthHeaders() });
    }

    // Bulk Import
    bulkImportQuestions(questions: any[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/question/bulk-import`, questions, { headers: this.getAuthHeaders() });
    }

    // Export - Triggers browser download directly from endpoint
    exportQuestions(format: 'csv' | 'json' = 'csv', search?: string) {
        let url = `${this.apiUrl}/question/export?format=${format}`;
        if (search) url += `&search=${search}`;
        this.downloadFile(url, `questions_export_${new Date().toISOString().split('T')[0]}.${format}`);
    }

    // Admin Game Management
    createGame(game: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/game`, game, { headers: this.getAuthHeaders() });
    }

    updateGame(id: number, game: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/game/${id}`, game, { headers: this.getAuthHeaders() });
    }

    deleteGame(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/game/${id}`, { headers: this.getAuthHeaders() });
    }

    // Student Management
    getAllStudents(): Observable<Student[]> {
        return this.http.get<Student[]>(`${this.apiUrl}/student`, { headers: this.getAuthHeaders() });
    }

    createStudent(student: any): Observable<Student> {
        return this.http.post<Student>(`${this.apiUrl}/student`, student, { headers: this.getAuthHeaders() });
    }

    updateStudent(id: number, student: any): Observable<Student> {
        return this.http.put<Student>(`${this.apiUrl}/student/${id}`, student, { headers: this.getAuthHeaders() });
    }

    deleteStudent(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/student/${id}`, { headers: this.getAuthHeaders() });
    }

    // Administrator Management
    getAllAdmins(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/admin/all`, { headers: this.getAuthHeaders() });
    }

    getPendingAdmins(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/admin/pending`, { headers: this.getAuthHeaders() });
    }

    approveAdmin(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/admin/approve/${id}`, {}, { headers: this.getAuthHeaders() });
    }

    rejectAdmin(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/admin/reject/${id}`, { headers: this.getAuthHeaders() });
    }

    // Audit Logs
    getAuditLogs(count: number = 50): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/audit/logs?count=${count}`, { headers: this.getAuthHeaders() });
    }

    // System Settings
    getSystemSettings(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/settings`, { headers: this.getAuthHeaders() });
    }

    updateSystemSetting(key: string, value: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/settings/${key}`, value, { headers: this.getAuthHeaders() });
    }

    // Export Helper
    downloadFile(url: string, filename: string) {
        this.http.get(url, { headers: this.getAuthHeaders(), responseType: 'blob' }).subscribe({
            next: (blob) => {
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = filename;
                link.click();
                window.URL.revokeObjectURL(link.href);
            },
            error: (err) => console.error('Download failed', err)
        });
    }

    exportStudents() {
        this.downloadFile(`${this.apiUrl}/student/export`, `students_${new Date().toISOString().split('T')[0]}.csv`);
    }

    exportAuditLogs() {
        this.downloadFile(`${this.apiUrl}/audit/export`, `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    }

    // Analytics Endpoints
    getAnalyticsActivityTrends(startDate?: string, endDate?: string): Observable<any> {
        let url = `${this.apiUrl}/admin/analytics/activity-trends`;
        if (startDate || endDate) {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            url += `?${params.toString()}`;
        }
        return this.http.get<any>(url, { headers: this.getAuthHeaders() });
    }

    getAnalyticsDifficultQuestions(grade: number, subject: number, limit: number = 5): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.apiUrl}/admin/analytics/difficult-questions?grade=${grade}&subject=${subject}&limit=${limit}`,
            { headers: this.getAuthHeaders() }
        );
    }

    getAnalyticsEngagementSummary(): Observable<any> {
        return this.http.get<any>(
            `${this.apiUrl}/admin/analytics/engagement-summary`,
            { headers: this.getAuthHeaders() }
        );
    }

    // NEW: Filtered Questions for V0 Flow
    getFilteredQuestions(grade: number, subject: number, testType: number): Observable<Question[]> {
        return this.getQuestions({
            grade,
            subject,
            testType, // Pass testType correctly
            pageSize: 50 // Fetch enough questions for a quiz
        });
    }

    // NEW: Flexible Search for Wheel (Mixed questions)
    searchQuestions(grade: number, subject?: number, page: number = 1, pageSize: number = 50): Observable<any> {
        if (this.useMockData) {
            let filtered = [...MOCK_QUESTIONS];
            if (grade) filtered = filtered.filter(q => q.grade === Number(grade));
            if (subject) filtered = filtered.filter(q => q.subject === Number(subject));

            return of({
                items: filtered,
                page: page,
                pageSize: pageSize,
                totalCount: filtered.length,
                totalPages: 1
            }).pipe(delay(500));
        }

        return this.http.post(`${this.apiUrl}/question/search`, {
            grade: grade,
            subject: subject,
            page: page,
            pageSize: pageSize
            // TestType, Difficulty left empty to fetch all
        });
    }
    // NEW: Get available subjects for games
    getSubjects(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/question/subjects`);
    }

    // NEW: Get DragDrop questions by subject
    getDragDropQuestions(subject: number, grade?: number): Observable<any> {
        return this.getQuestions({
            type: 5, // DragDrop type
            subject: subject,
            grade: grade,
            pageSize: 20
        });
    }
}
