// types.ts
export type StatusType = 'completed' | 'in-progress' | 'pending' | 'at-risk' | string;

export interface Task {
  id: string;
  name: string;
  status: StatusType;
  date: string;
}

export interface Document {
  id: string;
  name: string;
  url: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  status: StatusType;
  description: string;
  tasks: Task[];
  documents: Document[];
  team: TeamMember[];
}

export interface NavigationViewProps {
  phases: ProjectPhase[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export interface ScrollViewProps {
  phases: ProjectPhase[];
  activeTab: string;
}

export interface PhaseIndicatorProps {
  phases: ProjectPhase[];
  currentPhaseId: string;
}

export interface StatusBadgeProps {
  status: StatusType;
}

export interface ProjectManagementProps {
  projectData?: ProjectPhase[];
}