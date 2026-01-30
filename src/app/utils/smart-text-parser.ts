/**
 * Enhanced Smart Text Parser with Multi-Format Support
 * Supports: Pipe-separated, JSON, Markdown, and Natural Language formats
 */

// Type definitions
export type QuestionTypeValue = 1 | 2 | 3 | 4 | 5;
export type DifficultyValue = 1 | 2 | 3;
export type GradeValue = 3 | 4 | 5 | 6;
export type SubjectValue = 1 | 2 | 3;
export type InputFormat = 'pipe' | 'json' | 'markdown' | 'natural' | 'unknown';

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
    line?: number;
    column?: number;
}

export interface ParsedQuestionData {
    text: string;
    type: QuestionTypeValue;
    correctAnswer: string;
    options: string[];
    difficulty?: DifficultyValue;
    grade?: GradeValue;
    subject?: SubjectValue;
    mediaUrl?: string;
}

export interface ParsingResult {
    isValid: boolean;
    format: InputFormat;
    parsedData: ParsedQuestionData;
    errors: ValidationError[];
    warnings: string[];
    suggestions: string[];
}

// Legacy interface for backward compatibility
export interface ParsedQuestion {
    text: string;
    correctAnswer: string;
    options: string[];
    type: number;
    isValid: boolean;
    errors: string[];
}

export class SmartTextParser {

    /**
     * Main parse method - auto-detects format and parses accordingly
     */
    static parse(input: string): ParsedQuestion {
        const result = this.parseAdvanced(input);

        // Convert to legacy format for backward compatibility
        return {
            text: result.parsedData.text,
            correctAnswer: result.parsedData.correctAnswer,
            options: result.parsedData.options,
            type: result.parsedData.type,
            isValid: result.isValid,
            errors: result.errors.map(e => e.message)
        };
    }

    /**
     * Advanced parse method with full result details
     */
    static parseAdvanced(input: string): ParsingResult {
        const result: ParsingResult = {
            isValid: false,
            format: 'unknown',
            parsedData: {
                text: '',
                type: 1,
                correctAnswer: '',
                options: []
            },
            errors: [],
            warnings: [],
            suggestions: []
        };

        if (!input || input.trim() === '') {
            result.errors.push({
                field: 'input',
                message: 'النص فارغ',
                severity: 'error'
            });
            return result;
        }

        const trimmedInput = input.trim();

        // Auto-detect format
        result.format = this.detectFormat(trimmedInput);

        // Parse based on detected format
        switch (result.format) {
            case 'json':
                this.parseJson(trimmedInput, result);
                break;
            case 'markdown':
                this.parseMarkdown(trimmedInput, result);
                break;
            case 'natural':
                this.parseNatural(trimmedInput, result);
                break;
            case 'pipe':
            default:
                this.parsePipe(trimmedInput, result);
                break;
        }

        // Common validations
        this.validateParsedData(result);

        result.isValid = result.errors.filter(e => e.severity === 'error').length === 0;
        return result;
    }

    /**
     * Detect input format
     */
    static detectFormat(input: string): InputFormat {
        const trimmed = input.trim();

        // JSON format: starts with { or [
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                JSON.parse(trimmed);
                return 'json';
            } catch {
                // Not valid JSON, continue checking
            }
        }

        // Markdown format: starts with # or has checkbox-style options
        if (trimmed.startsWith('#') || /^-\s+\[.\]/.test(trimmed) || /^-\s+.*✓/.test(trimmed)) {
            return 'markdown';
        }

        // Natural language format: has "Question:" or "السؤال:" keywords
        if (/^(Question|السؤال|سؤال)\s*:/im.test(trimmed)) {
            return 'natural';
        }

        // Default: pipe-separated format
        if (trimmed.includes('|')) {
            return 'pipe';
        }

        return 'unknown';
    }

    /**
     * Parse pipe-separated format
     * Format: "Question Text | Correct Answer | Option1, Option2, Option3"
     */
    static parsePipe(input: string, result: ParsingResult): void {
        const parts = input.split('|').map(p => p.trim());

        // Part 1: Question Text
        result.parsedData.text = parts[0] || '';
        if (!result.parsedData.text) {
            result.errors.push({
                field: 'text',
                message: 'نص السؤال مطلوب',
                severity: 'error',
                line: 1,
                column: 1
            });
        } else if (result.parsedData.text.length < 10) {
            result.warnings.push('نص السؤال قصير جداً (أقل من 10 أحرف)');
            result.suggestions.push('أضف المزيد من التفاصيل للسؤال');
        }

        // Part 2: Correct Answer
        if (parts.length > 1) {
            result.parsedData.correctAnswer = parts[1];
        } else {
            result.errors.push({
                field: 'correctAnswer',
                message: 'الإجابة الصحيحة مفقودة (استخدم الرمز | للفصل)',
                severity: 'error',
                line: 1
            });
        }

        // Part 3: Options (Optional)
        if (parts.length > 2) {
            const rawOptions = parts[2];
            if (rawOptions.includes('\n')) {
                result.parsedData.options = rawOptions.split('\n')
                    .map(o => o.trim())
                    .filter(o => o.length > 0);
            } else {
                result.parsedData.options = rawOptions.split(/,|،/)
                    .map(o => o.trim())
                    .filter(o => o.length > 0);
            }
        }

        // Auto-detect question type
        result.parsedData.type = this.detectQuestionType(result.parsedData);
    }

    /**
     * Parse JSON format
     */
    static parseJson(input: string, result: ParsingResult): void {
        try {
            const parsed = JSON.parse(input);

            result.parsedData.text = parsed.text || parsed.question || '';
            result.parsedData.correctAnswer = parsed.correctAnswer || parsed.answer || '';

            if (parsed.options) {
                result.parsedData.options = Array.isArray(parsed.options)
                    ? parsed.options
                    : [];
            }

            if (parsed.type) {
                result.parsedData.type = this.parseQuestionType(parsed.type);
            }

            if (parsed.difficulty) {
                result.parsedData.difficulty = this.parseDifficulty(parsed.difficulty);
            }

            if (parsed.grade) {
                result.parsedData.grade = this.parseGrade(parsed.grade);
            }

            if (parsed.subject) {
                result.parsedData.subject = this.parseSubject(parsed.subject);
            }

            if (parsed.mediaUrl) {
                result.parsedData.mediaUrl = parsed.mediaUrl;
            }

            // Validate required fields
            if (!result.parsedData.text) {
                result.errors.push({
                    field: 'text',
                    message: 'حقل "text" مطلوب في JSON',
                    severity: 'error'
                });
            }

            if (!result.parsedData.correctAnswer) {
                result.errors.push({
                    field: 'correctAnswer',
                    message: 'حقل "correctAnswer" مطلوب في JSON',
                    severity: 'error'
                });
            }

            // Auto-detect type if not provided
            if (!parsed.type) {
                result.parsedData.type = this.detectQuestionType(result.parsedData);
            }

        } catch (e) {
            result.errors.push({
                field: 'json',
                message: 'تنسيق JSON غير صالح: ' + (e as Error).message,
                severity: 'error'
            });
        }
    }

    /**
     * Parse Markdown format
     * Format:
     * # Question Text
     * - Option 1
     * - Option 2 ✓ (correct)
     * - Option 3
     */
    static parseMarkdown(input: string, result: ParsingResult): void {
        const lines = input.split('\n').map(l => l.trim()).filter(l => l);
        let questionLine = 0;

        // Find question text (first # line or first line)
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#')) {
                result.parsedData.text = lines[i].replace(/^#+\s*/, '');
                questionLine = i;
                break;
            }
        }

        if (!result.parsedData.text && lines.length > 0) {
            result.parsedData.text = lines[0];
        }

        // Find options (lines starting with - or *)
        const options: string[] = [];
        let correctAnswer = '';

        for (let i = questionLine + 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('-') || line.startsWith('*')) {
                let optionText = line.replace(/^[-*]\s*/, '').trim();

                // Check for correct answer markers
                const isCorrect = optionText.includes('✓') ||
                    optionText.includes('✔') ||
                    optionText.toLowerCase().includes('(correct)') ||
                    optionText.includes('(صحيح)');

                if (isCorrect) {
                    optionText = optionText
                        .replace(/✓|✔/g, '')
                        .replace(/\(correct\)/gi, '')
                        .replace(/\(صحيح\)/g, '')
                        .trim();
                    correctAnswer = optionText;
                }

                options.push(optionText);
            }
        }

        result.parsedData.options = options;
        result.parsedData.correctAnswer = correctAnswer;

        if (!correctAnswer && options.length > 0) {
            result.warnings.push('لم يتم تحديد الإجابة الصحيحة. استخدم ✓ لتحديدها');
            result.suggestions.push('مثال: - الخيار الصحيح ✓');
        }

        // Auto-detect type
        result.parsedData.type = this.detectQuestionType(result.parsedData);
    }

    /**
     * Parse Natural Language format
     * Format:
     * Question: What is 2+2?
     * Type: Multiple Choice
     * Options: 1, 2, 3, 4
     * Correct: 4
     * Difficulty: Easy
     */
    static parseNatural(input: string, result: ParsingResult): void {
        const lines = input.split('\n').map(l => l.trim()).filter(l => l);

        const fieldMap: Record<string, string[]> = {
            text: ['question', 'السؤال', 'سؤال', 'نص'],
            correctAnswer: ['correct', 'answer', 'الإجابة', 'الجواب', 'صحيح'],
            options: ['options', 'choices', 'الخيارات', 'اختيارات'],
            type: ['type', 'النوع', 'نوع'],
            difficulty: ['difficulty', 'الصعوبة', 'مستوى'],
            grade: ['grade', 'الصف', 'سنة'],
            subject: ['subject', 'المادة', 'موضوع']
        };

        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;

            const key = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();

            // Match key to field
            for (const [field, keywords] of Object.entries(fieldMap)) {
                if (keywords.some(k => key.includes(k))) {
                    switch (field) {
                        case 'text':
                            result.parsedData.text = value;
                            break;
                        case 'correctAnswer':
                            result.parsedData.correctAnswer = value;
                            break;
                        case 'options':
                            result.parsedData.options = value.split(/,|،/).map(o => o.trim()).filter(o => o);
                            break;
                        case 'type':
                            result.parsedData.type = this.parseQuestionType(value);
                            break;
                        case 'difficulty':
                            result.parsedData.difficulty = this.parseDifficulty(value);
                            break;
                        case 'grade':
                            result.parsedData.grade = this.parseGrade(value);
                            break;
                        case 'subject':
                            result.parsedData.subject = this.parseSubject(value);
                            break;
                    }
                    break;
                }
            }
        }

        // Auto-detect type if not specified
        if (!result.parsedData.type || result.parsedData.type === 1) {
            result.parsedData.type = this.detectQuestionType(result.parsedData);
        }
    }

    /**
     * Detect question type based on options and answer
     */
    static detectQuestionType(data: ParsedQuestionData): QuestionTypeValue {
        if (data.options.length > 0) {
            const lowerOpts = data.options.map(o => o.toLowerCase());

            // True/False detection
            const isTF = (lowerOpts.includes('true') && lowerOpts.includes('false')) ||
                (lowerOpts.includes('صواب') && lowerOpts.includes('خطأ')) ||
                (lowerOpts.includes('نعم') && lowerOpts.includes('لا'));

            if (isTF) {
                return 2; // True/False
            }
            return 1; // Multiple Choice
        }

        // Check if answer suggests True/False
        const lowerAnswer = (data.correctAnswer || '').toLowerCase();
        if (['true', 'false', 'صواب', 'خطأ', 'نعم', 'لا'].includes(lowerAnswer)) {
            return 2; // True/False
        }

        return 4; // Fill in the blank (no options)
    }

    /**
     * Parse question type from string
     */
    static parseQuestionType(value: string | number): QuestionTypeValue {
        if (typeof value === 'number') {
            return (value >= 1 && value <= 5 ? value : 1) as QuestionTypeValue;
        }

        const lower = value.toLowerCase();
        if (lower.includes('mcq') || lower.includes('multiple') || lower.includes('متعدد')) return 1;
        if (lower.includes('true') || lower.includes('false') || lower.includes('صواب') || lower.includes('خطأ')) return 2;
        if (lower.includes('connect') || lower.includes('توصيل')) return 3;
        if (lower.includes('fill') || lower.includes('blank') || lower.includes('أكمل') || lower.includes('فراغ')) return 4;
        if (lower.includes('drag') || lower.includes('drop') || lower.includes('سحب')) return 5;

        return 1;
    }

    /**
     * Parse difficulty from string
     */
    static parseDifficulty(value: string | number): DifficultyValue {
        if (typeof value === 'number') {
            return (value >= 1 && value <= 3 ? value : 1) as DifficultyValue;
        }

        const lower = value.toLowerCase();
        if (lower.includes('easy') || lower.includes('سهل')) return 1;
        if (lower.includes('medium') || lower.includes('متوسط')) return 2;
        if (lower.includes('hard') || lower.includes('صعب')) return 3;

        return 1;
    }

    /**
     * Parse grade from string
     */
    static parseGrade(value: string | number): GradeValue {
        if (typeof value === 'number') {
            return (value >= 3 && value <= 6 ? value : 3) as GradeValue;
        }

        const num = parseInt(value.replace(/\D/g, ''));
        if (num >= 3 && num <= 6) return num as GradeValue;

        return 3;
    }

    /**
     * Parse subject from string
     */
    static parseSubject(value: string | number): SubjectValue {
        if (typeof value === 'number') {
            return (value >= 1 && value <= 3 ? value : 1) as SubjectValue;
        }

        const lower = value.toLowerCase();
        if (lower.includes('arabic') || lower.includes('عربي') || lower.includes('لغة')) return 1;
        if (lower.includes('math') || lower.includes('رياضي')) return 2;
        if (lower.includes('science') || lower.includes('علوم')) return 3;

        return 1;
    }

    /**
     * Common validation for parsed data
     */
    static validateParsedData(result: ParsingResult): void {
        const data = result.parsedData;

        // Text validation
        if (!data.text) {
            result.errors.push({
                field: 'text',
                message: 'نص السؤال مطلوب',
                severity: 'error'
            });
        } else if (data.text.length > 500) {
            result.errors.push({
                field: 'text',
                message: 'نص السؤال يجب أن يكون أقل من 500 حرف',
                severity: 'error'
            });
        }

        // Correct answer validation
        if (!data.correctAnswer) {
            result.errors.push({
                field: 'correctAnswer',
                message: 'الإجابة الصحيحة مطلوبة',
                severity: 'error'
            });
        }

        // Options validation for MCQ
        if (data.type === 1) { // Multiple Choice
            if (data.options.length < 2) {
                result.warnings.push('أسئلة الاختيار من متعدد تحتاج خيارين على الأقل');
            }

            if (data.options.length > 10) {
                result.errors.push({
                    field: 'options',
                    message: 'الخيارات لا يمكن أن تتجاوز 10 عناصر',
                    severity: 'error'
                });
            }

            // Check for duplicate options
            const uniqueOptions = new Set(data.options.map(o => o.toLowerCase()));
            if (uniqueOptions.size !== data.options.length) {
                result.warnings.push('يوجد خيارات مكررة');
            }

            // Check if correct answer is in options
            if (data.correctAnswer && data.options.length > 0) {
                if (!data.options.includes(data.correctAnswer)) {
                    result.errors.push({
                        field: 'correctAnswer',
                        message: `الإجابة الصحيحة "${data.correctAnswer}" غير موجودة ضمن الخيارات`,
                        severity: 'error'
                    });
                    result.suggestions.push('تأكد من أن الإجابة الصحيحة موجودة ضمن الخيارات');
                }
            }
        }

        // True/False: auto-add options if missing
        if (data.type === 2 && data.options.length === 0) {
            data.options = ['صواب', 'خطأ'];
        }

        // Check for empty options
        if (data.options.some(o => !o || o.trim() === '')) {
            result.warnings.push('بعض الخيارات فارغة');
        }

        // Media URL validation
        if (data.mediaUrl) {
            try {
                new URL(data.mediaUrl);
            } catch {
                result.warnings.push('رابط الوسائط غير صالح');
            }
        }
    }

    /**
     * Format question back to pipe-separated string
     */
    static toStringFormat(data: ParsedQuestionData): string {
        let str = data.text;

        if (data.correctAnswer) {
            str += ` | ${data.correctAnswer}`;
        }

        if (data.options.length > 0) {
            str += ` | ${data.options.join(', ')}`;
        }

        return str;
    }

    /**
     * Format question as JSON string
     */
    static toJsonFormat(data: ParsedQuestionData): string {
        return JSON.stringify({
            text: data.text,
            type: this.getTypeName(data.type),
            correctAnswer: data.correctAnswer,
            options: data.options,
            difficulty: data.difficulty ? this.getDifficultyName(data.difficulty) : undefined,
            grade: data.grade,
            subject: data.subject ? this.getSubjectName(data.subject) : undefined,
            mediaUrl: data.mediaUrl
        }, null, 2);
    }

    /**
     * Get type name from value
     */
    static getTypeName(type: number): string {
        const types: Record<number, string> = {
            1: 'اختيار من متعدد',
            2: 'صواب/خطأ',
            3: 'توصيل',
            4: 'أكمل الفراغ',
            5: 'سحب وإفلات'
        };
        return types[type] || 'غير محدد';
    }

    /**
     * Get difficulty name from value
     */
    static getDifficultyName(difficulty: number): string {
        const levels: Record<number, string> = {
            1: 'سهل',
            2: 'متوسط',
            3: 'صعب'
        };
        return levels[difficulty] || 'غير محدد';
    }

    /**
     * Get subject name from value
     */
    static getSubjectName(subject: number): string {
        const subjects: Record<number, string> = {
            1: 'لغة عربية',
            2: 'رياضيات',
            3: 'علوم'
        };
        return subjects[subject] || 'غير محدد';
    }
}
