import { Routes } from '@angular/router';

// New V0 Flow Components
import { HomeComponent } from './components/home/home.component';
import { WelcomeScreenComponent } from './components/welcome-screen/welcome-screen.component';
import { TestTypeSelectionComponent } from './components/test-type-selection/test-type-selection.component';
import { GradeSelectionComponent } from './components/grade-selection/grade-selection.component';
import { SubjectSelectionComponent } from './components/subject-selection/subject-selection.component';
import { TrainingTypeSelectionComponent } from './components/training-type-selection/training-type-selection.component';
import { GameTypeSelectionComponent } from './components/game-type-selection/game-type-selection.component';
import { ResultScreenComponent } from './components/result-screen/result-screen.component';

// Game Components
import { QuestionsWheelComponent } from './components/questions-wheel/questions-wheel.component';
import { TraditionalQuizComponent } from './components/traditional-quiz/traditional-quiz.component';
import { MatchingGameComponent } from './components/matching-game/matching-game.component';
import { DragDropGameComponent } from './components/drag-drop-game/drag-drop-game.component';
import { FlipCardsGameComponent } from './components/flip-cards-game/flip-cards-game.component';

// Legacy Components (keeping for backwards compatibility)
import { StudentRegistrationComponent } from './components/student-registration/student-registration.component';
import { GameSelectionComponent } from './components/game-selection/game-selection.component';
import { TestInterfaceComponent } from './components/test-interface/test-interface.component';
import { TestResultComponent } from './components/test-result/test-result.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { AchievementsComponent } from './components/achievements/achievements.component';
import { ProgressComponent } from './components/progress/progress.component';
import { SpeedRoundComponent } from './components/speed-round/speed-round.component';
import { StudentLoginComponent } from './components/student-login/student-login.component';

// Admin Components
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AdminRegisterComponent } from './components/admin-register/admin-register.component';
import { AdminQuestionsComponent } from './components/admin-questions/admin-questions.component';
import { AdminGamesComponent } from './components/admin-games/admin-games.component';
import { AdminStudentsComponent } from './components/admin-students/admin-students.component';
import { AdminAdministratorsComponent } from './components/admin-administrators/admin-administrators.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { AdminAuditComponent } from './components/admin-audit/admin-audit.component';
import { AdminSettingsComponent } from './components/admin-settings/admin-settings.component';
import { AdminMatchingQuestionsListComponent } from './components/admin-matching-questions-list/admin-matching-questions-list.component';
import { AdminMatchingQuestionFormComponent } from './components/admin-matching-question-form/admin-matching-question-form.component';
import { AdminWheelQuestionsListComponent } from './components/admin-wheel-questions/admin-wheel-questions-list.component';
import { AdminWheelQuestionFormComponent } from './components/admin-wheel-questions/admin-wheel-question-form.component';

// Parent Components
import { ParentRegisterComponent } from './components/parent-register/parent-register.component';
import { ParentLoginComponent } from './components/parent-login/parent-login.component';
import { ParentDashboardComponent } from './components/parent-dashboard/parent-dashboard.component';

export const routes: Routes = [
    // ========== NEW V0 FLOW ==========
    { path: '', component: HomeComponent },
    { path: 'welcome', component: WelcomeScreenComponent },
    { path: 'test-type', component: TestTypeSelectionComponent },
    { path: 'grade', component: GradeSelectionComponent },
    { path: 'subject', component: SubjectSelectionComponent },
    { path: 'training-type', component: TrainingTypeSelectionComponent },
    { path: 'game-type', component: GameTypeSelectionComponent },
    { path: 'quiz', component: TraditionalQuizComponent },
    { path: 'result', component: ResultScreenComponent },

    // Game routes
    { path: 'wheel', component: QuestionsWheelComponent },
    { path: 'game/matching', component: MatchingGameComponent },
    { path: 'game/dragdrop', component: DragDropGameComponent },
    { path: 'game/flipcards', component: FlipCardsGameComponent },

    // ========== LEGACY ROUTES (Keep for backwards compatibility) ==========
    { path: 'home', redirectTo: '', pathMatch: 'full' },
    { path: 'register', component: StudentRegistrationComponent },
    { path: 'student/login', component: StudentLoginComponent },
    { path: 'games', component: GameSelectionComponent },
    { path: 'speed-round', component: SpeedRoundComponent },
    { path: 'leaderboard', component: LeaderboardComponent },
    { path: 'achievements', component: AchievementsComponent },
    { path: 'progress', component: ProgressComponent },
    { path: 'test/:id', component: TestInterfaceComponent },
    { path: 'result/:id', component: TestResultComponent },

    // ========== PARENT PORTAL ==========
    { path: 'parent/register', component: ParentRegisterComponent },
    { path: 'parent/login', component: ParentLoginComponent },
    { path: 'parent/dashboard', component: ParentDashboardComponent },

    // ========== ADMIN PORTAL ==========
    { path: 'admin/login', component: AdminLoginComponent },
    { path: 'admin/register', component: AdminRegisterComponent },

    // Admin routes with layout wrapper
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: AdminDashboardComponent },
            { path: 'questions', component: AdminQuestionsComponent },
            { path: 'games', component: AdminGamesComponent },
            { path: 'students', component: AdminStudentsComponent },
            {
                path: 'administrators',
                component: AdminAdministratorsComponent,
                canActivate: [roleGuard],
                data: { roles: ['SuperAdmin'] }
            },
            {
                path: 'audit',
                component: AdminAuditComponent,
                canActivate: [roleGuard],
                data: { roles: ['SuperAdmin'] }
            },
            {
                path: 'settings',
                component: AdminSettingsComponent,
                canActivate: [roleGuard],
                data: { roles: ['SuperAdmin'] }
            },
            { path: 'settings', component: AdminSettingsComponent, canActivate: [roleGuard], data: { roles: ['SuperAdmin'] } },

            // Matching Game
            { path: 'matching-questions', component: AdminMatchingQuestionsListComponent },
            { path: 'matching-questions/new', component: AdminMatchingQuestionFormComponent },
            { path: 'matching-questions/:id/edit', component: AdminMatchingQuestionFormComponent },

            // Wheel Game
            { path: 'wheel-questions', component: AdminWheelQuestionsListComponent },
            { path: 'wheel-questions/new', component: AdminWheelQuestionFormComponent },
            { path: 'wheel-questions/edit/:id', component: AdminWheelQuestionFormComponent },

            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },

    // Fallback
    { path: '**', redirectTo: '' }
];


