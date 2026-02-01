export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
    errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}
