import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="admin-layout" [class.dark]="isDarkMode">
      <!-- Mobile Overlay -->
      <div 
        *ngIf="isMobileMenuOpen" 
        class="mobile-overlay"
        (click)="toggleMobileMenu()">
      </div>

      <!-- Sidebar -->
      <aside 
        class="sidebar"
        [class.collapsed]="isCollapsed"
        [class.mobile-open]="isMobileMenuOpen">
        
        <!-- Logo Section -->
        <div class="sidebar-header">
          <div class="logo" *ngIf="!isCollapsed">
            <span class="logo-icon">📚</span>
            <span class="logo-text">نافس</span>
          </div>
          <button class="collapse-btn" (click)="toggleSidebar()">
            <span>{{ isCollapsed ? '→' : '←' }}</span>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <ng-container *ngFor="let item of menuItems">
            <!-- Parent Item -->
            <div class="nav-item" [class.has-children]="item.children">
              <a 
                *ngIf="item.route && !item.children"
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-link"
                (click)="onNavClick()">
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label" *ngIf="!isCollapsed">{{ item.label }}</span>
              </a>
              
              <button 
                *ngIf="item.children"
                class="nav-link nav-parent"
                (click)="toggleSubmenu(item)"
                [class.expanded]="item.expanded">
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label" *ngIf="!isCollapsed">{{ item.label }}</span>
                <span class="nav-arrow" *ngIf="!isCollapsed">{{ item.expanded ? '▼' : '◀' }}</span>
              </button>

              <!-- Children -->
              <div class="submenu" *ngIf="item.children && item.expanded && !isCollapsed">
                <a 
                  *ngFor="let child of item.children"
                  [routerLink]="child.route"
                  routerLinkActive="active"
                  class="nav-link child-link"
                  (click)="onNavClick()">
                  <span class="nav-icon">{{ child.icon }}</span>
                  <span class="nav-label">{{ child.label }}</span>
                </a>
              </div>
            </div>
          </ng-container>
        </nav>

        <!-- Footer -->
        <div class="sidebar-footer" *ngIf="!isCollapsed">
          <button class="theme-toggle" (click)="toggleDarkMode()">
            {{ isDarkMode ? '☀️ الوضع الفاتح' : '🌙 الوضع الداكن' }}
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-wrapper" [class.sidebar-collapsed]="isCollapsed">
        <!-- Top Header -->
        <header class="top-header">
          <button class="mobile-menu-btn" (click)="toggleMobileMenu()">
            ☰
          </button>
          
          <div class="breadcrumb">
            <span>لوحة التحكم</span>
          </div>

          <div class="header-actions">
            <span class="admin-name">مرحباً، {{ adminUsername }}</span>
            <button class="logout-btn" (click)="logout()">
              🔒 خروج
            </button>
          </div>
        </header>

        <!-- Page Content -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      direction: rtl;
      background: var(--bg-main, #fdf6e3);
    }

    /* Sidebar */
    .sidebar {
      width: 280px;
      background: linear-gradient(180deg, #1e3a5f 0%, #0f2744 100%);
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 100;
      overflow-x: hidden;
    }

    .sidebar.collapsed {
      width: 70px;
    }

    .sidebar-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      font-size: 2rem;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: bold;
      color: #f4a261;
    }

    .collapse-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .collapse-btn:hover {
      background: rgba(255,255,255,0.2);
    }

    /* Navigation */
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-item {
      margin-bottom: 0.25rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      background: none;
      width: 100%;
      text-align: right;
      cursor: pointer;
      font-size: 1rem;
      font-family: inherit;
    }

    .nav-link:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .nav-link.active {
      background: rgba(244, 162, 97, 0.2);
      color: #f4a261;
      border-right: 3px solid #f4a261;
    }

    .nav-icon {
      font-size: 1.25rem;
      min-width: 24px;
      text-align: center;
    }

    .nav-label {
      flex: 1;
    }

    .nav-arrow {
      font-size: 0.75rem;
      transition: transform 0.2s;
    }

    .nav-parent.expanded .nav-arrow {
      transform: rotate(-90deg);
    }

    .submenu {
      padding-right: 1rem;
    }

    .child-link {
      padding: 0.625rem 1.5rem;
      font-size: 0.9rem;
    }

    .child-link .nav-icon {
      font-size: 1rem;
    }

    /* Sidebar Footer */
    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .theme-toggle {
      width: 100%;
      padding: 0.75rem;
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s;
    }

    .theme-toggle:hover {
      background: rgba(255,255,255,0.2);
    }

    /* Main Wrapper */
    .main-wrapper {
      flex: 1;
      margin-right: 280px;
      transition: margin-right 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .main-wrapper.sidebar-collapsed {
      margin-right: 70px;
    }

    /* Top Header */
    .top-header {
      background: white;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .breadcrumb {
      font-size: 1.125rem;
      color: #1e3a5f;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .admin-name {
      color: #64748b;
    }

    .logout-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s;
    }

    .logout-btn:hover {
      background: #dc2626;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    /* Mobile Overlay */
    .mobile-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 90;
    }

    /* Dark Mode */
    .dark {
      --bg-main: #1a1a2e;
    }

    .dark .top-header {
      background: #16213e;
      color: white;
    }

    .dark .breadcrumb {
      color: white;
    }

    .dark .admin-name {
      color: #94a3b8;
    }

    .dark .main-content {
      background: #1a1a2e;
    }

    /* Mobile Responsive */
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(100%);
      }

      .sidebar.mobile-open {
        transform: translateX(0);
      }

      .main-wrapper {
        margin-right: 0;
      }

      .main-wrapper.sidebar-collapsed {
        margin-right: 0;
      }

      .mobile-menu-btn {
        display: block;
      }

      .mobile-overlay {
        display: block;
      }
    }

    @media (max-width: 640px) {
      .top-header {
        padding: 1rem;
      }

      .main-content {
        padding: 1rem;
      }

      .header-actions {
        gap: 0.5rem;
      }

      .admin-name {
        display: none;
      }
    }
  `]
})
export class AdminLayoutComponent {
  isCollapsed = false;
  isDarkMode = false;
  isMobileMenuOpen = false;
  adminUsername = '';

  menuItems: MenuItem[] = [
    { label: 'لوحة التحكم', icon: '🏠', route: '/admin/dashboard' },
    {
      label: 'إدارة المحتوى',
      icon: '📝',
      expanded: false,
      children: [
        { label: 'أسئلة الاختبار التقليدي', icon: '❓', route: '/admin/questions' },
        { label: 'أسئلة المطابقة', icon: '🧩', route: '/admin/matching-questions' },
        { label: 'أسئلة العجلة', icon: '🎡', route: '/admin/wheel-questions' },
        { label: 'أسئلة السحب والإفلات', icon: '🖐️', route: '/admin/dragdrop-questions' },
        // { label: 'أسئلة البطاقات', icon: '🃏', route: '/admin/flipcard-questions' },  // Hidden from admin UI
        { label: 'الألعاب', icon: '🎮', route: '/admin/games' },
        { label: 'استيراد جماعي', icon: '📥', route: '/admin/import' }
      ]
    },
    {
      label: 'إدارة المستخدمين',
      icon: '👥',
      expanded: false,
      children: [
        { label: 'الطلاب', icon: '🎓', route: '/admin/students' },
        { label: 'المشرفين', icon: '🔑', route: '/admin/administrators' }
      ]
    },
    { label: 'التحليلات والتقارير', icon: '📊', route: '/admin/analytics' },
    { label: 'سجل العمليات', icon: '📋', route: '/admin/audit' },
    { label: 'الإعدادات', icon: '⚙️', route: '/admin/settings' }
  ];

  constructor(private router: Router) {
    this.adminUsername = localStorage.getItem('adminUsername') || 'المشرف';
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleSubmenu(item: MenuItem) {
    item.expanded = !item.expanded;
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
  }

  onNavClick() {
    // Close mobile menu on navigation
    if (this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('adminUsername');
    this.router.navigate(['/admin/login']);
  }
}
