export interface Student {
    id?: number;
    name: string;
    studentCode?: string;
    age: number;
    grade: string;
    pin?: string; // For creation only
    isActive?: boolean;
}

export interface Question {
    id: number;
    text: string;
    type: QuestionType;
    typeName: string;
    difficulty: DifficultyLevel;
    difficultyName: string;
    mediaUrl?: string;
    options?: string;
    correctAnswer?: string;
}

export enum QuestionType {
    MultipleChoice = 1,
    TrueFalse = 2,
    ConnectLines = 3,
    FillInTheBlank = 4
}

export enum DifficultyLevel {
    Easy = 1,
    Medium = 2,
    Hard = 3
}

export enum TestType {
    Nafes = 1,
    Central = 2
}

export interface Game {
    id: number;
    title: string;
    description: string;
    timeLimit: number;
    passingScore: number;
    questionCount?: number;
}

export interface GameWithQuestions {
    id: number;
    title: string;
    description: string;
    timeLimit: number;
    passingScore: number;
    questions: GameQuestionDto[];
}

export interface GameQuestionDto {
    questionId: number;
    text: string;
    type: string;
    difficulty: string;
    mediaUrl?: string;
    options?: string;
    order: number;
}

export interface TestResult {
    id?: number;
    studentId: number;
    studentName?: string;
    gameId: number;
    gameTitle?: string;
    score: number;
    dateTaken?: Date;
    timeSpent: number;
    passed: boolean;
    answers?: string;
    newAchievements?: AchievementDto[];
}

export interface SubmitTestDto {
    studentId: number;
    gameId: number;
    timeSpent: number;
    answers: TestAnswer[];
}

export interface TestAnswer {
    questionId: number;
    answer: string;
}

// New DTOs regarding backend updates

export interface LeaderboardEntryDto {
    rank: number;
    studentName: string;
    grade: string;
    totalScore: number;
    testsCompleted: number;
    badges: string[];
}

export interface StudentStatsDto {
    totalTests: number;
    averageScore: number;
    totalTimeSpentMinutes: number;
    currentLevel: number;
    subjectPerformance: SubjectPerformanceDto[];
    weeklyActivity: DailyActivityDto[];
}

export interface SubjectPerformanceDto {
    subject: string;
    score: number;
}

export interface DailyActivityDto {
    day: string;
    testsCount: number;
}

export interface AchievementDto {
    id: number;
    title: string;
    description: string;
    icon: string;
    points: number;
    isUnlocked: boolean;
    dateUnlocked?: Date;
}

// Legacy alias for old component compatibility
export interface LeaderboardEntry {
    rank: number;
    studentName: string;
    grade: string;
    points: number;
    badges: string[];
}

// Matching Game Interfaces
export interface MatchingQuestion {
    id: number;
    gradeId: number;
    subjectId: number;
    leftItemText: string;
    rightItemText: string;
    distractorItems: string[]; // Front-end will receive this as array
    difficultyLevel: DifficultyLevel;
    displayOrder: number;
    isActive: boolean;
}

export interface CreateMatchingQuestionDto {
    gradeId: number;
    subjectId: number;
    leftItemText: string;
    rightItemText: string;
    distractorItems: string[];
    difficultyLevel: DifficultyLevel;
    displayOrder: number;
}

export interface StartMatchingGameDto {
    studentId: number;
    gradeId: number;
    subjectId: number;
}

export interface GameLeftItem {
    id: number;
    text: string;
}

export interface GameRightItem {
    id: string;
    text: string;
}

export interface GameStartResponse {
    sessionId: number;
    leftItems: GameLeftItem[];
    rightItems: GameRightItem[];
}

export interface ValidationMatchDto {
    questionId: number;
    rightItemId: string;
}

export interface SubmitMatchingGameDto {
    sessionId: number;
    matches: ValidationMatchDto[];
    timeSpentSeconds: number;
}

export interface MatchResultDetail {
    questionId: number;
    isCorrect: boolean;
    correctAnswer: string;
}

export interface GameResultDto {
    sessionId: number;
    score: number;
    totalQuestions: number;
    correctMatches: number;
    timeSpentSeconds: number;
    details: MatchResultDetail[];
}

export interface MatchingLeaderboardEntry {
    rank: number;
    studentName: string;
    score: number;
    timeSpent: number;
    datePlayed: Date;
}
