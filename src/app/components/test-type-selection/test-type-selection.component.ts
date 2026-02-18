import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { LucideAngularModule, Target, BookOpen, ChevronLeft } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test-type-selection',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './test-type-selection.component.html',
  styleUrl: './test-type-selection.component.css'
})
export class TestTypeSelectionComponent {
  readonly TargetIcon = Target;
  readonly BookOpenIcon = BookOpen;
  readonly ChevronLeftIcon = ChevronLeft;

  constructor(private router: Router, private location: Location) { }

  onSelectType(type: 'nafes' | 'central') {
    console.log(`Selected type: ${type}`);
    // Save to session storage so subsequent components (GradeSelection, Quiz) can read it
    sessionStorage.setItem('testType', type);
    this.router.navigate(['/grade'], { queryParams: { type } });
  }

  goBack() {
    this.router.navigate(['/welcome']);
  }
}
