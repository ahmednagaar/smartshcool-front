// Shared constants across ALL games and admin components
// Single source of truth for subjects, grades, and enums

export const SUBJECTS = [
    { value: 1, label: 'اللغة العربية' },
    { value: 2, label: 'الرياضيات' },
    { value: 3, label: 'العلوم' }
];

export const GRADES = [
    { value: 3, label: 'الصف الثالث' },
    { value: 4, label: 'الصف الرابع' },
    { value: 5, label: 'الصف الخامس' },
    { value: 6, label: 'الصف السادس' }
];

/** Get the student ID from session storage, or 0 for anonymous */
export function getStudentId(): number {
    const storedId = sessionStorage.getItem('currentStudentId');
    return storedId ? parseInt(storedId, 10) : 0;
}

/** Get the student display name for leaderboard */
export function getStudentName(): string {
    return sessionStorage.getItem('studentName')
        || sessionStorage.getItem('playerName')
        || 'زائر';
}

/** Get selected grade as integer */
export function getSelectedGrade(): number {
    return parseInt(sessionStorage.getItem('selectedGrade') || '3', 10);
}

/** Get selected subject as integer (handles both integer and string formats) */
export function getSelectedSubject(): number {
    const raw = sessionStorage.getItem('selectedSubject') || '1';

    // Try integer first (standard format used by most games)
    const asInt = parseInt(raw, 10);
    if (!isNaN(asInt)) return asInt;

    // Fallback: string mapping (for Wheel game legacy format)
    const stringMap: { [key: string]: number } = {
        'arabic': 1,
        'math': 2,
        'science': 3
    };
    return stringMap[raw.toLowerCase()] || 1;
}

/** Get subject label from value */
export function getSubjectLabel(value: number): string {
    const subject = SUBJECTS.find(s => s.value === value);
    return subject?.label || 'غير معروف';
}
