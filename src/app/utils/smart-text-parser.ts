
export interface ParsedQuestion {
    text: string;
    correctAnswer: string;
    options: string[];
    type: number; // 1: MC, 2: TF, 4: FillBlank
    isValid: boolean;
    errors: string[];
}

export class SmartTextParser {

    static parse(input: string): ParsedQuestion {
        const result: ParsedQuestion = {
            text: '',
            correctAnswer: '',
            options: [],
            type: 1, // Default to Multiple Choice
            isValid: false,
            errors: []
        };

        if (!input || input.trim() === '') {
            result.errors.push('النص فارغ');
            return result;
        }

        const parts = input.split('|').map(p => p.trim());

        // Part 1: Question Text
        result.text = parts[0];
        if (!result.text) {
            result.errors.push('نص السؤال مطلوب');
        }

        // Part 2: Correct Answer
        if (parts.length > 1) {
            result.correctAnswer = parts[1];
        } else {
            result.errors.push('الإجابة الصحيحة مفقودة (استخدم الرمز | للفصل)');
        }

        // Part 3: Options (Optional)
        if (parts.length > 2) {
            // Split by line break OR comma
            // If comma is used, ensure we don't split answer text accidentally? 
            // Assumption: Options are comma or newline separated
            const rawOptions = parts[2];
            if (rawOptions.includes('\n')) {
                result.options = rawOptions.split('\n').map(o => o.trim()).filter(o => o.length > 0);
            } else {
                result.options = rawOptions.split(/,|،/).map(o => o.trim()).filter(o => o.length > 0);
            }
        }

        // Auto-Detect Type
        if (result.options.length > 0) {
            // Check if True/False
            const lowerOpts = result.options.map(o => o.toLowerCase());
            const isTF = (lowerOpts.includes('true') && lowerOpts.includes('false')) ||
                (lowerOpts.includes('صواب') && lowerOpts.includes('خطأ')) ||
                (lowerOpts.includes('نعم') && lowerOpts.includes('لا'));

            if (isTF) {
                result.type = 2; // True/False
            } else {
                result.type = 1; // Multiple Choice
            }

            // Validation: Correct answer must be in options
            if (result.correctAnswer && !result.options.includes(result.correctAnswer)) {
                // Auto-add correct answer to options if missing? 
                // Better validation: warn user
                result.errors.push(`الإجابة الصحيحة "${result.correctAnswer}" غير موجودة ضمن الخيارات`);
                // For better UX, we could auto-add it, but let's stick to validation for now.
            }

        } else {
            // No options provided
            // Check if Answer is multiple words? 
            if (['true', 'false', 'صواب', 'خطأ', 'نعم', 'لا'].includes(result.correctAnswer.toLowerCase())) {
                result.type = 2; // True/False (Implicit)
                result.options = ['صواب', 'خطأ']; // Default Arabic
            } else {
                result.type = 4; // Fill in the blank
            }
        }

        result.isValid = result.errors.length === 0;
        return result;
    }
}
