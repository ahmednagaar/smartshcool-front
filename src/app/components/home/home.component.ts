import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Users, Lock, Phone, ArrowLeft } from 'lucide-angular';
import { AnalyticsService } from '../../services/analytics.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  readonly icons = { Users, Lock, Phone, ArrowLeft };
  visitorCount$: Observable<number>;
  currentYear = new Date().getFullYear();

  constructor(
    private router: Router,
    private analyticsService: AnalyticsService
  ) {
    this.visitorCount$ = this.analyticsService.getStats().pipe(
      map(stats => stats.totalVisits)
    );
  }

  ngOnInit() {
    // Log the visit to the backend
    this.analyticsService.logVisit();
  }

  startTraining() {
    this.analyticsService.logEvent('start_training_click');
    this.router.navigate(['/welcome']);
  }
}

