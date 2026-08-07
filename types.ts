export interface ResumeData {
  personalInfo: string;
  jobDescription: string;
  generatedLatex: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  READING_PDF = 'READING_PDF',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface PdfExtractResult {
  text: string;
  pageCount: number;
}

export enum AdaptationMode {
  FAITHFUL = 'faithful',
  STRATEGIC = 'strategic',
  GAP_ANALYSIS = 'gap_analysis',
}

export interface ResumeVersion {
  id: string;
  latex: string;
  generatedContent?: unknown;
  createdAt: string;
  jobTitle?: string | null;
  company?: string | null;
  adaptationMode?: AdaptationMode;
}
