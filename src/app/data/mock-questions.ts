
export const MOCK_QUESTIONS = [
    // --- GRADE 3 ---
    // Arabic
    { id: 1, text: "ما جمع كلمة \"كتاب\"؟", options: ["كتاب", "كتب", "كاتب"], correctAnswer: "كتب", subject: 1, grade: 3, type: 1, difficulty: 1, testType: 1 },
    { id: 2, text: "ما عكس كلمة \"كبير\"؟", options: ["طويل", "صغير", "سريع"], correctAnswer: "صغير", subject: 1, grade: 3, type: 1, difficulty: 1, testType: 2 },
    { id: 3, text: "أيهما اسم؟", options: ["يكتب", "مدرسة", "يذهب"], correctAnswer: "مدرسة", subject: 1, grade: 3, type: 1, difficulty: 2, testType: 1 },

    // Science
    { id: 4, text: "ما الكوكب الذي نعيش عليه؟", options: ["القمر", "الأرض", "الشمس"], correctAnswer: "الأرض", subject: 3, grade: 3, type: 1, difficulty: 1, testType: 1 },
    { id: 5, text: "أي من الآتي حيوان؟", options: ["شجرة", "حجر", "قطة"], correctAnswer: "قطة", subject: 3, grade: 3, type: 1, difficulty: 1, testType: 2 },
    { id: 6, text: "ما لون الشمس؟", options: ["أزرق", "أصفر", "أخضر"], correctAnswer: "أصفر", subject: 3, grade: 3, type: 1, difficulty: 1, testType: 1 },

    // Math
    { id: 7, text: "5 + 3 = ؟", options: ["6", "7", "8"], correctAnswer: "8", subject: 2, grade: 3, type: 1, difficulty: 1, testType: 1 },
    { id: 8, text: "10 − 4 = ؟", options: ["5", "6", "7"], correctAnswer: "6", subject: 2, grade: 3, type: 1, difficulty: 2, testType: 2 },
    { id: 9, text: "أيهما أكبر؟", options: ["6", "8", "9"], correctAnswer: "9", subject: 2, grade: 3, type: 1, difficulty: 1, testType: 1 },


    // --- GRADE 4 ---
    // Arabic
    { id: 10, text: "ما جمع كلمة \"ولد\"؟", options: ["ولود", "أولاد", "ولدين"], correctAnswer: "أولاد", subject: 1, grade: 4, type: 1, difficulty: 1, testType: 1 },
    { id: 11, text: "ما نوع كلمة \"يلعب\"؟", options: ["اسم", "فعل", "حرف"], correctAnswer: "فعل", subject: 1, grade: 4, type: 1, difficulty: 2, testType: 2 },
    { id: 12, text: "ما مرادف كلمة \"سعيد\"؟", options: ["حزين", "فرحان", "غاضب"], correctAnswer: "فرحان", subject: 1, grade: 4, type: 1, difficulty: 1, testType: 1 },

    // Science
    { id: 13, text: "ما الحالة السائلة للماء؟", options: ["بخار", "ثلج", "ماء"], correctAnswer: "ماء", subject: 3, grade: 4, type: 1, difficulty: 1, testType: 1 },
    { id: 14, text: "أي عضو نستخدمه للتنفس؟", options: ["القلب", "الرئة", "المعدة"], correctAnswer: "الرئة", subject: 3, grade: 4, type: 1, difficulty: 2, testType: 2 },
    { id: 15, text: "ما مصدر الضوء الطبيعي؟", options: ["المصباح", "الشمس", "القمر"], correctAnswer: "الشمس", subject: 3, grade: 4, type: 1, difficulty: 1, testType: 1 },

    // Math
    { id: 16, text: "6 × 2 = ؟", options: ["8", "10", "12"], correctAnswer: "12", subject: 2, grade: 4, type: 1, difficulty: 1, testType: 1 },
    { id: 17, text: "15 ÷ 3 = ؟", options: ["4", "5", "6"], correctAnswer: "5", subject: 2, grade: 4, type: 1, difficulty: 2, testType: 2 },
    { id: 18, text: "20 + 15 = ؟", options: ["30", "35", "40"], correctAnswer: "35", subject: 2, grade: 4, type: 1, difficulty: 1, testType: 1 },


    // --- GRADE 5 ---
    // Arabic
    { id: 19, text: "ما مفرد كلمة \"أقلام\"؟", options: ["قلم", "قلام", "قلمون"], correctAnswer: "قلم", subject: 1, grade: 5, type: 1, difficulty: 1, testType: 1 },
    { id: 20, text: "ما ضد كلمة \"نشاط\"؟", options: ["تعب", "كسل", "سرعة"], correctAnswer: "كسل", subject: 1, grade: 5, type: 1, difficulty: 1, testType: 2 },
    { id: 21, text: "الجملة \"الطالب مجتهد\" هي؟", options: ["فعلية", "اسمية", "استفهامية"], correctAnswer: "اسمية", subject: 1, grade: 5, type: 1, difficulty: 2, testType: 1 },

    // Science
    { id: 22, text: "ما الغاز اللازم للتنفس؟", options: ["النيتروجين", "الأكسجين", "الهيدروجين"], correctAnswer: "الأكسجين", subject: 3, grade: 5, type: 1, difficulty: 1, testType: 1 },
    { id: 23, text: "ما الكوكب الأحمر؟", options: ["الزهرة", "المريخ", "عطارد"], correctAnswer: "المريخ", subject: 3, grade: 5, type: 1, difficulty: 1, testType: 2 },
    { id: 24, text: "أي من الآتي نبات؟", options: ["قط", "حجر", "شجرة"], correctAnswer: "شجرة", subject: 3, grade: 5, type: 1, difficulty: 1, testType: 1 },

    // Math
    { id: 25, text: "9 × 4 = ؟", options: ["32", "36", "40"], correctAnswer: "36", subject: 2, grade: 5, type: 1, difficulty: 1, testType: 1 },
    { id: 26, text: "50 − 18 = ؟", options: ["30", "32", "34"], correctAnswer: "32", subject: 2, grade: 5, type: 1, difficulty: 2, testType: 2 },
    { id: 27, text: "نصف العدد 20 هو؟", options: ["5", "10", "15"], correctAnswer: "10", subject: 2, grade: 5, type: 1, difficulty: 1, testType: 1 },


    // --- GRADE 6 ---
    // Arabic
    { id: 28, text: "ما نوع كلمة \"الصدق\"؟", options: ["اسم", "فعل", "مصدر"], correctAnswer: "مصدر", subject: 1, grade: 6, type: 1, difficulty: 3, testType: 1 },
    { id: 29, text: "ما جمع كلمة \"مدينة\"؟", options: ["مدائن", "مدن", "مدينة"], correctAnswer: "مدن", subject: 1, grade: 6, type: 1, difficulty: 2, testType: 2 },
    { id: 30, text: "مرادف كلمة \"شجاع\"؟", options: ["خائف", "جريء", "ضعيف"], correctAnswer: "جريء", subject: 1, grade: 6, type: 1, difficulty: 1, testType: 1 },

    // Science
    { id: 31, text: "ما العضو المسؤول عن ضخ الدم؟", options: ["الرئة", "القلب", "المخ"], correctAnswer: "القلب", subject: 3, grade: 6, type: 1, difficulty: 1, testType: 1 },
    { id: 32, text: "ما الوحدة الأساسية لقياس الطول؟", options: ["الكيلو", "المتر", "الجرام"], correctAnswer: "المتر", subject: 3, grade: 6, type: 1, difficulty: 1, testType: 2 },
    { id: 33, text: "ما الكوكب الأكبر في المجموعة الشمسية؟", options: ["الأرض", "زحل", "المشتري"], correctAnswer: "المشتري", subject: 3, grade: 6, type: 1, difficulty: 2, testType: 1 },

    // Math
    { id: 34, text: "12 × 5 = ؟", options: ["50", "60", "70"], correctAnswer: "60", subject: 2, grade: 6, type: 1, difficulty: 2, testType: 1 },
    { id: 35, text: "100 ÷ 4 = ؟", options: ["20", "25", "30"], correctAnswer: "25", subject: 2, grade: 6, type: 1, difficulty: 1, testType: 2 },
    { id: 36, text: "3² = ؟", options: ["6", "9", "12"], correctAnswer: "9", subject: 2, grade: 6, type: 1, difficulty: 3, testType: 1 }
];
