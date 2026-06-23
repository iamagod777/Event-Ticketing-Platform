export type ElementType = 'photo' | 'text' | 'qr';

export type PhotoShape = 'rectangle' | 'rounded-rectangle' | 'circle';

export type TextPlaceholderKey = 'name' | 'designation' | 'company' | 'college' | 'city';

export type QRTargetType = 'event' | 'registration' | 'verification';

export interface TemplateElement {
  id: string;
  type: ElementType;
  x: number; // percentage (0 - 100) of template width
  y: number; // percentage (0 - 100) of template height
  width: number; // percentage of template width
  height: number; // percentage of template height
  
  // Photo properties
  shape?: PhotoShape;
  
  // Text properties
  textKey?: TextPlaceholderKey;
  fontSize?: number; // px at standard template size
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  fontWeight?: string;
  
  // QR properties
  qrTarget?: QRTargetType;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  registrationLink: string;
  logoUrl?: string; // base64 or url
  coverUrl?: string; // base64 or url
  posterUrl: string; // base64 or url (the main poster template)
  isArchived: boolean;
  elements: TemplateElement[];
  createdAt: string;
  visitorsCount: number;
  generationsCount: number;
  downloadsCount: number;
}

export interface GeneratedTicket {
  id: string;
  eventId: string;
  eventName: string;
  attendeeName: string;
  photoUrl: string; // user's uploaded processed photo
  details: Record<string, string>;
  ticketImageUrl: string; // generated image data URL
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  eventId: string;
  type: 'visit' | 'generate' | 'download';
  timestamp: string;
}

export interface DashboardStats {
  totalEvents: number;
  totalVisitors: number;
  totalGenerations: number;
  totalDownloads: number;
  conversionRate: number; // (generations / visitors) * 100
  eventsList: {
    id: string;
    name: string;
    slug: string;
    visitorsCount: number;
    generationsCount: number;
    downloadsCount: number;
  }[];
  generationsHistory: {
    date: string;
    count: number;
  }[];
}

export interface UserSession {
  uid: string;
  email: string;
  role: 'admin' | 'participant';
}
