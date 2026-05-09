// Agent Model Configuration

export const AGENT_MODELS = {
  orchestrator: "google/gemini-2.0-flash-lite-001",
  subAgent: "google/gemini-2.0-flash-lite-001",
  citationAgent: "google/gemini-2.0-flash-lite-001",
  synthesisAgent: "google/gemini-2.0-flash-lite-001",
  reviewAgent: "google/gemini-2.0-flash-lite-001",
} as const;

//  Research Session Status

export type ResearchStatus =
  | "planning"
  | "researching"
  | "synthesizing"
  | "reviewing"
  | "completed"
  | "failed";

// Report Plan

export interface SectionPlan {
  id: string;
  heading: string;
  description: string;
  search_queries: string[];
}

export interface ReportPlan {
  title: string;
  sections: SectionPlan[];
}

// Section Findings

export interface SourceReference {
  url: string;
  title: string;
  snippet: string;
  domain?: string;
  favicon?: string;
}

export interface SectionFindings {
  section_id: string;
  section_heading: string;
  key_findings: string[];
  detailed_content: string;
  sources: SourceReference[];
}

// Citation Index

export interface CitationEntry {
  index: number;
  url: string;
  title: string;
  snippet: string;
  domain: string;
  favicon: string;
}

//  Review Result

export interface ReviewResult {
  approved: boolean;
  overall_quality: "excellent" | "good" | "needs_improvement";
  gaps: string[];
  suggestions: string[];
  sections_needing_research: string[];
}

//  Activity Log Entry

export interface ActivityLogEntry {
  timestamp: string;
  agent:
    | "orchestrator"
    | "sub-agent"
    | "citation-agent"
    | "synthesis-agent"
    | "review-agent"
    | "system";
  action: string;
  detail: string;
  section_id?: string;
}

// Full Session Record (Supabase Row)

export interface DeepResearchSession {
  id: string;
  user_email: string;
  user_id: string | null;
  query: string;
  status: ResearchStatus;
  report_plan: ReportPlan | null;
  section_findings: SectionFindings[];
  citations: CitationEntry[];
  final_report: string;
  activity_log: ActivityLogEntry[];
  iteration_count: number;
  created_at: string;
  updated_at: string;
}

// Constants

export const MAX_ITERATIONS = 2;
export const MIN_REPORT_WORDS = 2000;
export const MAX_REPORT_WORDS = 6000;
