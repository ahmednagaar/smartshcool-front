import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Users, Lock, Phone, ArrowLeft, CheckCircle, Star, ChevronDown, ChevronUp, Mail, Instagram, Twitter, Linkedin, Facebook, MapPin, Sun, Moon } from 'lucide-angular';
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
  readonly icons = {
    Users, Lock, Phone, ArrowLeft, CheckCircle, Star, ChevronDown, ChevronUp, Mail, Instagram, Twitter, Linkedin, Facebook, MapPin, Sun, Moon
  };
  visitorCount$: Observable<number>;
  currentYear = new Date().getFullYear();
  isScrolled = false;
  isDarkMode = false;

  // Testimonials Data
  testimonials = [
    {
      name: 'سارة أحمد',
      role: 'ولية أمر',
      content: 'ابني تحسن مستواه بشكل ملحوظ في الرياضيات بعد استخدام منصة نافس. التدريبات ممتعة ومفيدة جداً.',
      rating: 5
    },
    {
      name: 'محمد العتيبي',
      role: 'طالب - الصف السادس',
      content: 'أحببت طريقة المسابقات والتحديات. جعلت المذاكرة مثل اللعبة وأصبحت أنتظر وقت التدريب.',
      rating: 5
    },
    {
      name: 'أ. نورة الغامدي',
      role: 'معلمة رياضيات',
      content: 'منصة ممتازة أنصح بها جميع طالباتي. تغطي المنهج بشكل شامل وتساعد في تعزيز المهارات الأساسية.',
      rating: 5
    }
  ];
  currentTestimonialIndex = 0;

  // FAQ Data
  faqs = [
    {
      question: 'هل التسجيل في المنصة مجاني؟',
      answer: 'نعم، التسجيل متاح مجانًا لجميع الطلاب والطالبات للاستفادة من الخدمات الأساسية للمنصة.',
      isOpen: false
    },
    {
      question: 'ما هي المراحل الدراسية المدعومة؟',
      answer: 'المنصة تدعم حالياً المرحلة الابتدائية (الصفوف العليا) والمرحلة المتوسطة، ونعمل على إضافة المزيد قريباً.',
      isOpen: false
    },
    {
      question: 'كيف يمكنني متابعة مستوى ابني؟',
      answer: 'يوفر حساب ولي الأمر لوحة تحكم شاملة تعرض إحصائيات دقيقة عن أداء الطالب وتطوره في كل مادة.',
      isOpen: false
    }
  ];

  constructor(
    private router: Router,
    private analyticsService: AnalyticsService
  ) {
    this.visitorCount$ = this.analyticsService.getStats().pipe(
      map(stats => stats.totalVisits)
    );
  }

  ngOnInit() {
    this.analyticsService.logVisit();
    this.initializeTheme();
    // Auto-rotate testimonials
    setInterval(() => {
      this.nextTestimonial();
    }, 5000);
  }

  startTraining() {
    this.analyticsService.logEvent('start_training_click');
    this.router.navigate(['/welcome']);
  }

  // Testimonial Navigation
  nextTestimonial() {
    this.currentTestimonialIndex = (this.currentTestimonialIndex + 1) % this.testimonials.length;
  }

  prevTestimonial() {
    this.currentTestimonialIndex = (this.currentTestimonialIndex - 1 + this.testimonials.length) % this.testimonials.length;
  }

  // FAQ Toggle
  toggleFaq(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
    // Close others (optional)
    this.faqs.forEach((faq, i) => {
      if (i !== index) faq.isOpen = false;
    });
  }

  // V3: Sticky Header & Dark Mode
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark');
    } else {
      this.isDarkMode = false;
      document.documentElement.classList.remove('dark');
    }
  }
}

