export type AdmissionStatus = "open" | "closed" | "upcoming";

export interface University {
  id: string;
  slug: string;
  name: string;
  state: string;
  type: "Federal" | "State" | "Private";
  jambCutoff: number;
  admissionStatus: AdmissionStatus;
  lastVerifiedAt: string; // ISO date
  topCourses: string[];
}

export interface FilterState {
  query: string;
  state: string;
  type: string;
  cutoffComparator: "any" | "under" | "over";
  cutoffValue: number | null;
  excludedUniversityIds: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  query: "",
  state: "",
  type: "",
  cutoffComparator: "any",
  cutoffValue: null,
  excludedUniversityIds: [],
};

export interface Course {
  id: string;
  name: string;
  faculty: string;
  cutoffMark: number;
  subjectCombo: string;
  sourceUrl: string;
  deEligible: boolean;
  deCutoffMark?: number;
}

export interface UniversityLink {
  type: "official_site" | "whatsapp" | "facebook";
  label: string;
  url: string;
}

export interface UniversityDetail extends University {
  postUtmeDate: string;
  admissionListDate: string;
  oLevelDeadline: string;
  utmeSubjects: string;
  oLevelRequirement: string;
  directEntryRequirement: string;
  acceptanceFee: string;
  tuitionRange: string;
  articleMarkdown: string;
  courses: Course[];
  links: UniversityLink[];
}

export interface FlatCourse {
  id: string;
  name: string;
  faculty: string;
  cutoffMark: number;
  subjectCombo: string;
  sourceUrl: string;
  deEligible: boolean;
  deCutoffMark?: number;
  universityId: string;
  universitySlug: string;
  universityName: string;
  universityState: string;
  universityType: "Federal" | "State" | "Private";
}