export enum FlipCardGameMode {
    Classic = 0,
    Match = 1
}

export enum FlipCardTimerMode {
    None = 0,
    CountUp = 1,
    CountDown = 2
}

export enum FlipCardContentType {
    Text = 0,
    Image = 1,
    Audio = 2,
    Mixed = 3
}

export interface FlipCardPairDto {
    id: number;
    card1Type: FlipCardContentType;
    card1Text: string;
    card1ImageUrl?: string;
    card1AudioUrl?: string;
    card2Type: FlipCardContentType;
    card2Text: string;
    card2ImageUrl?: string;
    card2AudioUrl?: string;
}

export interface FlipCardQuestionDto {
    id: number;
    gradeId: number;
    subjectId: number; // enum?
    gameTitle: string;
    instructions: string;
    gameMode: FlipCardGameMode;
    timerMode: FlipCardTimerMode;
    timeLimitSeconds?: number;
    showHints: boolean;
    maxHints: number;
    uiTheme: string;
    cardBackDesign: string;
    customCardBackUrl?: string;
    numberOfPairs: number;
    pairs: FlipCardPairDto[];
    difficultyLevel?: number;
    isActive: boolean;
    displayOrder: number;
}

// Create/Update DTOs
export interface CreateFlipCardPairDto {
    card1Type: FlipCardContentType;
    card1Text: string;
    card1ImageUrl?: string;
    card1AudioUrl?: string;
    card2Type: FlipCardContentType;
    card2Text: string;
    card2ImageUrl?: string;
    card2AudioUrl?: string;
}

export interface CreateFlipCardQuestionDto {
    gradeId: number;
    subjectId: number;
    gameTitle: string;
    instructions: string;
    gameMode: FlipCardGameMode;
    timerMode: FlipCardTimerMode;
    timeLimitSeconds?: number;
    showHints: boolean;
    maxHints: number;
    uiTheme: string;
    cardBackDesign: string;
    customCardBackUrl?: string;
    pairs: CreateFlipCardPairDto[];
    difficultyLevel?: number;
    isActive: boolean;
    displayOrder: number;
}

export interface UpdateFlipCardQuestionDto extends CreateFlipCardQuestionDto {
    id: number;
}

// Game Play DTOs
export interface StartFlipCardGameDto {
    studentId: number;
    gradeId: number;
    subjectId: number;
    questionId?: number;
    difficultyLevel?: number;
    gameMode?: FlipCardGameMode;
}

export interface GameStartResponseDto {
    id: number; // SessionId
    totalPairs: number;
    gameMode: FlipCardGameMode;
    question: {
        id: number;
        gameTitle: string;
        instructions: string;
        timerMode: FlipCardTimerMode;
        timeLimitSeconds?: number;
        showHints: boolean;
        maxHints: number;
        uiTheme: string;
        cardBackDesign: string;
        customCardBackUrl?: string;
        enableAudio: boolean;
        enableExplanations: boolean;
        numberOfPairs: number;
        cards: GameCardDto[];
    };
}

export interface GameCardDto {
    id: string; // "card-{pairId}-{num}"
    pairId: number;
    cardNumber: number;
    type: FlipCardContentType;
    text: string;
    imageUrl?: string;
    audioUrl?: string;
}

export interface RecordMatchDto {
    sessionId: number;
    pairId: number;
    card1FlippedAtMs: number;
    card2FlippedAtMs: number;
    attemptsBeforeMatch: number;
    hintUsed: boolean;
}

export interface RecordWrongMatchDto {
    sessionId: number;
    card1Id: string;
    card2Id: string;
}

export interface MatchResultDto {
    isCorrect: boolean;
    pointsEarned: number;
    totalScore: number;
    matchedPairs: number;
    totalPairs: number;
    explanation: string;
    isGameComplete: boolean;
}

export interface SessionCompleteDto {
    sessionId: number;
    finalScore: number;
    matchedPairs: number;
    totalPairs: number;
    totalMoves: number;
    timeSpent: number;
    starRating: number;
    rank: number;
    achievements: string[];
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
