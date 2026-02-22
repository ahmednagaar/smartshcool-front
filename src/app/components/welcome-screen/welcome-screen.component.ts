import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Hand, ArrowLeft, ArrowRight } from 'lucide-angular';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-welcome-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './welcome-screen.component.html',
  styleUrls: ['./welcome-screen.component.css']
})
export class WelcomeScreenComponent {
  studentName = '';
  readonly icons = { Hand, ArrowLeft, ArrowRight };

  constructor(
    private router: Router,
    private analyticsService: AnalyticsService
  ) { }

  continueToTestType() {
    const hasName = !!this.studentName.trim();

    // Analytics
    this.analyticsService.logEvent('welcome_continue', { hasName });

    // Store name in session
    if (hasName) {
      sessionStorage.setItem('studentName', this.studentName.trim());
    } else {
      sessionStorage.removeItem('studentName');
    }

    this.router.navigate(['/test-type']);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
