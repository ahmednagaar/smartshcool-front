
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-admin-games',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen bg-nafes-cream p-8">
      <div class="container mx-auto">
        <h1 class="text-3xl font-bold text-nafes-dark mb-8">إدارة الاختبارات والألعاب</h1>

        <button (click)="openModal()" class="bg-nafes-gold text-white px-6 py-2 rounded-lg font-bold mb-6 hover:bg-opacity-90 transition">
          + إضافة اختبار جديد
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let game of games" class="bg-white p-6 rounded-xl shadow">
            <h3 class="font-bold text-xl mb-2">{{ game.title }}</h3>
            <p class="text-gray-600 mb-4">{{ game.description }}</p>
            <div class="flex gap-2 text-sm text-gray-500 mb-4">
               <span class="bg-gray-100 px-2 py-1 rounded">الزمن: {{ game.timeLimit }}د</span>
               <span class="bg-gray-100 px-2 py-1 rounded">النجاح: {{ game.passingScore }}%</span>
            </div>
            <div class="flex gap-2 text-sm text-gray-500 mb-4">
               <span class="bg-blue-100 px-2 py-1 rounded text-blue-800">{{ getGradeName(game.grade) }}</span>
               <span class="bg-green-100 px-2 py-1 rounded text-green-800">{{ getSubjectName(game.subject) }}</span>
            </div>
            <div class="flex justify-end gap-2">
               <button (click)="editGame(game)" class="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded">تعديل</button>
               <button (click)="deleteGame(game.id)" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded">حذف</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
          <h2 class="text-2xl font-bold mb-6">{{ isEditing ? 'تعديل اختبار' : 'إضافة اختبار جديد' }}</h2>
          
          <div class="grid md:grid-cols-2 gap-8">
            <!-- Game Details Form -->
            <div class="space-y-4">
               <div>
                 <label class="block mb-1 font-bold">العنوان</label>
                 <input [(ngModel)]="currentGame.title" class="w-full p-2 border rounded">
               </div>
               <div>
                 <label class="block mb-1 font-bold">الوصف</label>
                 <textarea [(ngModel)]="currentGame.description" rows="3" class="w-full p-2 border rounded"></textarea>
               </div>
               <div class="grid grid-cols-2 gap-4">
                 <div>
                   <label class="block mb-1 font-bold">الزمن (دقيقة)</label>
                   <input type="number" [(ngModel)]="currentGame.timeLimit" class="w-full p-2 border rounded">
                 </div>
                 <div>
                   <label class="block mb-1 font-bold">درجة النجاح %</label>
                   <input type="number" [(ngModel)]="currentGame.passingScore" class="w-full p-2 border rounded">
                 </div>
               </div>
               <div class="grid grid-cols-2 gap-4">
                 <div>
                   <label class="block mb-1 font-bold">الصف</label>
                   <select [(ngModel)]="currentGame.grade" (change)="filterQuestions()" class="w-full p-2 border rounded">
                    <option [value]="3">الصف 3</option>
                    <option [value]="4">الصف 4</option>
                    <option [value]="5">الصف 5</option>
                    <option [value]="6">الصف 6</option>
                   </select>
                 </div>
                 <div>
                   <label class="block mb-1 font-bold">المادة</label>
                   <select [(ngModel)]="currentGame.subject" (change)="filterQuestions()" class="w-full p-2 border rounded">
                     <option [value]="1">لغة عربية</option>
                     <option [value]="2">رياضيات</option>
                     <option [value]="3">علوم</option>
                   </select>
                 </div>
               </div>
            </div>

            <!-- Question Picker -->
            <div class="border-r pr-8 border-gray-200">
               <h3 class="font-bold mb-4">اختر الأسئلة ({{ currentGame.questionIds.length }})</h3>
               
               <div class="h-96 overflow-y-auto border rounded p-2 bg-gray-50">
                 <div *ngFor="let q of filteredQuestions" class="flex items-start gap-2 p-2 border-b bg-white mb-2 rounded hover:shadow-sm">
                   <input type="checkbox" 
                          [checked]="currentGame.questionIds.includes(q.id)"
                          (change)="toggleQuestion(q.id)"
                          class="mt-1">
                   <div>
                     <p class="font-bold text-sm">{{ q.text }}</p>
                     <div class="text-xs text-gray-500 mt-1">
                       {{ getTypeName(q.type) }} | {{ getSubjectName(q.subject) }}
                     </div>
                   </div>
                 </div>
                 <div *ngIf="filteredQuestions.length === 0" class="text-center p-4 text-gray-500">
                   لا توجد أسئلة تطابق الصف والمادة المحددة.
                 </div>
               </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button (click)="closeModal()" class="px-4 py-2 border rounded hover:bg-gray-50">إلغاء</button>
            <button (click)="saveGame()" class="bg-nafes-gold text-white px-6 py-2 rounded font-bold hover:bg-opacity-90">حفظ</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminGamesComponent implements OnInit {
    games: any[] = [];
    allQuestions: any[] = [];
    filteredQuestions: any[] = [];
    showModal = false;
    isEditing = false;

    currentGame: any = {
        questionIds: [],
        grade: 3,
        subject: 1
    };

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.loadGames();
        this.loadQuestions();
    }

    loadGames() {
        this.api.getGames().subscribe(data => this.games = data);
    }

    loadQuestions() {
        this.api.getQuestions().subscribe(data => {
            this.allQuestions = data;
            this.filterQuestions();
        });
    }

    // Filter questions to show only those matching current game's grade/subject logic if desired,
    // or just show all. For now, let's filter by the selected grade/subject to make it easier for admin.
    filterQuestions() {
        // Logic: Only show questions that match the Game's Grade and Subject?
        // Or show all?
        // Let's filter to help the user.
        if (!this.currentGame.grade || !this.currentGame.subject) {
            this.filteredQuestions = this.allQuestions;
            return;
        }

        this.filteredQuestions = this.allQuestions.filter(q =>
            q.grade == this.currentGame.grade &&
            q.subject == this.currentGame.subject
        );
    }

    openModal() {
        this.isEditing = false;
        this.currentGame = {
            title: '',
            description: '',
            timeLimit: 10,
            passingScore: 60,
            grade: 3,
            subject: 1,
            questionIds: []
        };
        this.filterQuestions(); // Refresh filter
        this.showModal = true;
    }

    editGame(game: any) {
        this.isEditing = true;
        // Need to fetch detailed game with questions to populate questionIds?
        // The list endpoint might not return questionIds.
        // Let's assume we need to fetch via ID if list doesn't have it.
        // But for now, lets try to see if we can get it.
        // If not, we might need a separate API call.

        // Using api get with questions
        this.api.getGameWithQuestions(game.id).subscribe(details => {
            this.currentGame = {
                ...details,
                questionIds: details.questions.map((q: any) => q.questionId)
            };
            this.filterQuestions();
            this.showModal = true;
        });
    }

    saveGame() {
        if (this.isEditing) {
            this.api.updateGame(this.currentGame.id, this.currentGame).subscribe(() => {
                this.loadGames();
                this.closeModal();
            });
        } else {
            this.api.createGame(this.currentGame).subscribe(() => {
                this.loadGames();
                this.closeModal();
            });
        }
    }

    deleteGame(id: number) {
        if (confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
            this.api.deleteGame(id).subscribe(() => this.loadGames());
        }
    }

    toggleQuestion(questionId: number) {
        const index = this.currentGame.questionIds.indexOf(questionId);
        if (index > -1) {
            this.currentGame.questionIds.splice(index, 1);
        } else {
            this.currentGame.questionIds.push(questionId);
        }
    }

    closeModal() {
        this.showModal = false;
    }

    getGradeName(grade: number): string {
        return `الصف ${grade}`;
    }

    getSubjectName(subject: number): string {
        const subjects: any = { 1: 'لغة عربية', 2: 'رياضيات', 3: 'علوم' };
        return subjects[subject] || 'غير معروف';
    }

    getTypeName(type: number): string {
        const types: any = { 1: 'اختيارات', 2: 'صواب/خطأ', 3: 'توصيل', 4: 'إكمال' };
        return types[type] || 'غير معروف';
    }
}
