// src/features/incident-workspace/types/index.ts

export type Priority = "Critical" | "High" | "Normal" | "Low";

export interface Incident {
  id: string;
  title: string;
  priority: Priority;
  timestamp: Date;
  source: string;
  description: string;
}
