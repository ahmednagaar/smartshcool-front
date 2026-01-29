import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Target, BookOpen, ArrowRight } from 'lucide-angular';
import { AnalyticsService } from '../../services/analytics.service';

export type TestType = 'nafes' | 'central';

@Component({
  selector: 'app-test-type-selection',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './test-type-selection.component.html',
  styleUrls: ['./test-type-selection.component.css']
})
export class TestTypeSelectionComponent {
  readonly icons = { Target, BookOpen, ArrowRight };

  constructor(
    private router: Router,
    private analyticsService: AnalyticsService
  ) { }

  selectTestType(type: TestType) {
    // Analytics
    this.analyticsService.logEvent('select_test_type', { type });

    sessionStorage.setItem('testType', type);
    this.router.navigate(['/grade']);
  }

  goBack() {
    this.router.navigate(['/welcome']);
  }
}
