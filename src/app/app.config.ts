import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  LucideAngularModule,
  // Core Actions
  Plus,
  PlusCircle,
  Minus,
  MinusCircle,
  Edit,
  Edit2,
  Edit3,
  Trash,
  Trash2,
  Copy,
  Save,
  X,
  XCircle,
  Check,
  CheckCircle,
  CheckSquare,

  // Navigation
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,

  // View/Search
  Eye,
  EyeOff,
  Search,
  Filter,
  Columns,
  Grid,
  List,

  // Menu
  Menu,
  MoreVertical,
  MoreHorizontal,

  // Status/Alerts
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,

  // File Operations
  File,
  FileText,
  Folder,
  FolderOpen,
  Download,
  Upload,
  ClipboardList,

  // User/Account
  User,
  Users,
  UserPlus,
  UserMinus,
  Settings,
  LogOut,
  LogIn,

  // Date/Time
  Clock,
  Calendar,

  // Communication
  Mail,
  MessageSquare,
  Bell,

  // Media
  Image,
  Video,
  Music,
  Play,
  Pause,
  Volume2,
  Type,

  // Other Common
  Home,
  Star,
  Heart,
  Share2,
  Link,
  ExternalLink,
  Maximize,
  Minimize,
  RefreshCw,
  RotateCw,
  Loader,
  Zap,
  Award,

  // Drag & Drop / Game specific
  Move,
  GripVertical,
  Layers,
  Puzzle,

  // Admin Dashboard specific
  BarChart,
  PieChart,
  TrendingUp,
  Activity
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    // Global Lucide icon registration - all icons available app-wide
    importProvidersFrom(LucideAngularModule.pick({
      // Core Actions
      Plus,
      PlusCircle,
      Minus,
      MinusCircle,
      Edit,
      Edit2,
      Edit3,
      Trash,
      Trash2,
      Copy,
      Save,
      X,
      XCircle,
      Check,
      CheckCircle,
      CheckSquare,

      // Navigation
      ChevronLeft,
      ChevronRight,
      ChevronDown,
      ChevronUp,
      ArrowLeft,
      ArrowRight,
      ArrowUp,
      ArrowDown,

      // View/Search
      Eye,
      EyeOff,
      Search,
      Filter,
      Columns,
      Grid,
      List,

      // Menu
      Menu,
      MoreVertical,
      MoreHorizontal,

      // Status/Alerts
      AlertCircle,
      AlertTriangle,
      Info,
      HelpCircle,

      // File Operations
      File,
      FileText,
      Folder,
      FolderOpen,
      Download,
      Upload,
      ClipboardList,

      // User/Account
      User,
      Users,
      UserPlus,
      UserMinus,
      Settings,
      LogOut,
      LogIn,

      // Date/Time
      Clock,
      Calendar,

      // Communication
      Mail,
      MessageSquare,
      Bell,

      // Media
      Image,
      Video,
      Music,
      Play,
      Pause,
      Volume2,
      Type,

      // Other Common
      Home,
      Star,
      Heart,
      Share2,
      Link,
      ExternalLink,
      Maximize,
      Minimize,
      RefreshCw,
      RotateCw,
      Loader,
      Zap,
      Award,

      // Drag & Drop / Game specific
      Move,
      GripVertical,
      Layers,
      Puzzle,

      // Admin Dashboard specific
      BarChart,
      PieChart,
      TrendingUp,
      Activity
    }))
  ]
};
