export enum SourceType {
  WEBSITE = 'WEBSITE',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  OTHER = 'OTHER'
}

export enum CrawlStatus {
  IDLE = 'IDLE',
  CRAWLING = 'CRAWLING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface Source {
  id: string;
  name: string;
  url: string; // The target URL or Account Name
  type: SourceType;
  intervalHours: number; // e.g., 2 hours
  lastChecked: number | null; // Timestamp
  nextCheck: number; // Timestamp
  status: CrawlStatus;
  errorMessage?: string;
}

export interface CrawlResult {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  summary: string; // This is the "translated" or summarized text
  originalLanguageText?: string; // Optional raw snippet
  originalUrl: string; // Link to the actual post/article
  timestamp: number;
  isRead: boolean;
}

export interface GroundingMetadata {
  groundingChunks?: {
    web?: {
      uri?: string;
      title?: string;
    };
  }[];
}