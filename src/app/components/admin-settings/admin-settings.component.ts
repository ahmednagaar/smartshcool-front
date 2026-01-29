import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description: string;
  group: string;
  type: string;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css']
})
export class AdminSettingsComponent implements OnInit {
  settings: SystemSetting[] = [];
  groupedSettings: { [key: string]: SystemSetting[] } = {};
  loading: boolean = false;
  savingKey: string | null = null;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.api.getSystemSettings().subscribe({
      next: (data) => {
        this.settings = data;
        this.groupSettings();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load settings', err);
        this.loading = false;
      }
    });
  }

  groupSettings() {
    this.groupedSettings = this.settings.reduce((groups, setting) => {
      const group = setting.group || 'General';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(setting);
      return groups;
    }, {} as { [key: string]: SystemSetting[] });
  }

  getGroups(): string[] {
    return Object.keys(this.groupedSettings);
  }

  updateSetting(setting: SystemSetting) {
    this.savingKey = setting.key;

    // For boolean toggles, value is already updated in model via ngModel, but ensure string conversion if needed
    // Api expects { Value: "..." }
    const payload = {
      Value: setting.value.toString(),
      Description: setting.description,
      Group: setting.group,
      Type: setting.type
    };

    this.api.updateSystemSetting(setting.key, payload).subscribe({
      next: () => {
        this.savingKey = null;
        // Optional: show toast
      },
      error: (err) => {
        console.error('Failed to update setting', err);
        this.savingKey = null;
        // Revert change if needed (complex with ngModel binding)
      }
    });
  }

  // Helper for boolean toggle
  onToggleChange(setting: SystemSetting, event: any) {
    setting.value = event.target.checked ? "true" : "false";
    this.updateSetting(setting);
  }
}
