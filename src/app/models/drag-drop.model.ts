import { GradeLevel, SubjectType, DifficultyLevel } from './models';
export { GradeLevel, SubjectType, DifficultyLevel };

export interface UITheme {
    id: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundPattern: string;
    font: string;
    description: string;
    previewImageUrl: string;
}

export interface DragDropZoneDto {
    id: number;
    dragDropQuestionId: number;
    label: string;
    colorCode: string;
    zoneOrder: number;
    iconUrl?: string;
}

export interface DragDropItemDto {
    id: number;
    dragDropQuestionId: number;
    text: string;
    imageUrl?: string;
    audioUrl?: string;
    correctZoneId: number;
    itemOrder: number;
    explanation?: string;
}

export interface DragDropQuestionDto {
    id: number;
    grade: GradeLevel;
    subject: SubjectType;
    gameTitle: string;
    instructions?: string;
    numberOfZones: number;
    zones: DragDropZoneDto[];
    items: DragDropItemDto[];
    difficultyLevel?: DifficultyLevel;
    timeLimit?: number;
    pointsPerCorrectItem: number;
    showImmediateFeedback: boolean;
    uiTheme: string;
    isActive: boolean;
    displayOrder: number;
    createdDate: Date;
}

// Create/Update DTOs
export interface CreateDragDropQuestionDto {
    grade: GradeLevel;
    subject: SubjectType;
    gameTitle: string;
    instructions?: string;
    numberOfZones: number;
    zones: CreateDragDropZoneDto[];
    items: CreateDragDropItemDto[];
    difficultyLevel?: DifficultyLevel;
    timeLimit?: number;
    pointsPerCorrectItem: number;
    showImmediateFeedback: boolean;
    uiTheme: string;
}

export interface CreateDragDropZoneDto {
    label: string;
    colorCode: string;
    zoneOrder: number;
    iconUrl?: string;
}

export interface CreateDragDropItemDto {
    text: string;
    imageUrl?: string;
    audioUrl?: string;
    correctZoneIndex: number; // Front-end uses Index to map to Zones in the same form
    itemOrder: number;
    explanation?: string;
}

export interface UpdateDragDropQuestionDto extends CreateDragDropQuestionDto {
    id: number;
}

export interface PaginationParams {
    pageNumber: number;
    pageSize: number;
    searchTerm?: string;
}

export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}
