import React from 'react';
import {
  UserCheck,
  Mail,
  Globe,
  MapPin,
  Share2,
  Compass,
  Search,
  Building2,
  FileText,
  Eye,
  ShieldAlert,
  History,
  Terminal,
  Users,
  Network,
  Radio,
  Folder,
  Wrench,
  Bookmark,
  ExternalLink,
  Shield,
  Layers,
  Database,
  Lock,
  Cpu
} from 'lucide-react';

export function getCategoryIcon(iconName: string, className: string = 'w-4 h-4'): React.ReactNode {
  switch (iconName) {
    case 'UserCheck':
      return <UserCheck className={className} />;
    case 'Mail':
      return <Mail className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'MapPin':
      return <MapPin className={className} />;
    case 'Share2':
      return <Share2 className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Search':
      return <Search className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Eye':
      return <Eye className={className} />;
    case 'ShieldAlert':
      return <ShieldAlert className={className} />;
    case 'History':
      return <History className={className} />;
    case 'Terminal':
      return <Terminal className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Network':
      return <Network className={className} />;
    case 'Radio':
      return <Radio className={className} />;
    case 'Database':
      return <Database className={className} />;
    case 'Lock':
      return <Lock className={className} />;
    default:
      return <Folder className={className} />;
  }
}
