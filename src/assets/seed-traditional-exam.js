
// This script is intended to be run manually or used as reference for manual data entry.
// It contains JSON data for creating Traditional Exam questions via the new Bulk Import feature.

const traditionalExamQuestions = [
    {
        "text": "ما هي عاصمة المملكة العربية السعودية؟",
        "type": 1,
        "grade": 3,
        "subject": 1,
        "testType": 2, // 2 = Central/Traditional Exam
        "correctAnswer": "الرياض",
        "options": ["جدة", "الرياض", "الدمام", "مكة المكرمة"]
    },
    {
        "text": "كم عدد الصلوات المفروضة؟",
        "type": 1,
        "grade": 3,
        "subject": 1,
        "testType": 2,
        "correctAnswer": "5",
        "options": ["3", "4", "5", "6"]
    },
    {
        "text": "ما هو ناتج 5 × 6؟",
        "type": 1,
        "grade": 3,
        "subject": 2, // Math
        "testType": 2,
        "correctAnswer": "30",
        "options": ["25", "30", "35", "40"]
    }
];

console.log(JSON.stringify(traditionalExamQuestions, null, 2));
