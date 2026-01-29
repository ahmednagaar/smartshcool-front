import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-administrators',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-administrators.component.html',
  styleUrls: ['./admin-administrators.component.css']
})
export class AdminAdministratorsComponent implements OnInit {
  activeTab: 'all' | 'pending' = 'all';

  admins: any[] = [];
  pendingAdmins: any[] = [];
  loading: boolean = false;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadAdmins();
  }

  switchTab(tab: 'all' | 'pending') {
    this.activeTab = tab;
    if (tab === 'all') {
      this.loadAdmins();
    } else {
      this.loadPending();
    }
  }

  loadAdmins() {
    this.loading = true;
    this.api.getAllAdmins().subscribe({
      next: (data) => {
        this.admins = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load admins', err);
        this.loading = false;
      }
    });
  }

  loadPending() {
    this.loading = true;
    this.api.getPendingAdmins().subscribe({
      next: (data) => {
        this.pendingAdmins = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load pending admins', err);
        this.loading = false;
      }
    });
  }

  approve(id: number) {
    if (!confirm('هل أنت متأكد من الموافقة على هذا المسؤول؟')) return;

    this.api.approveAdmin(id).subscribe({
      next: () => {
        this.loadPending(); // Reload list
        alert('تمت الموافقة بنجاح');
      },
      error: (err) => {
        alert('فشل العملية. تأكد من أن لديك الصلاحيات (SuperAdmin).');
      }
    });
  }

  reject(id: number) {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب وحذفه؟')) return;

    this.api.rejectAdmin(id).subscribe({
      next: () => {
        this.loadPending();
        alert('تم الرفض والحذف بنجاح');
      },
      error: (err) => {
        alert('فشل العملية. تأكد من أن لديك الصلاحيات.');
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'SuperAdmin') return 'bg-purple-100 text-purple-800';
    if (role === 'Admin') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  }
}
