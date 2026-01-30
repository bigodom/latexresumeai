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
