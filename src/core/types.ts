export type Severity = "fail" | "review" | "info";

export interface Finding {
  checkId: string;
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
}

/** Read-only view of the scanned project, handed to every check. */
export interface Project {
  root: string;
  /** Paths relative to root, forward slashes. */
  files: string[];
  read(file: string): Promise<string>;
}

export interface Check {
  id: string;
  title: string;
  run(project: Project): Promise<Finding[]>;
}

export type Reporter = (findings: Finding[]) => string;
