export type ReportPeriod = 'last-week' | 'this-week' | 'two-weeks' | 'this-month' | 'custom';

export interface GeneratedReport {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  fileUrl: string;
  createdById: string;
  createdAt: string;
}