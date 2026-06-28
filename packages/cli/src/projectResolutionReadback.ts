import type {
  ProjectResolutionKind
} from "./databaseRuntime.js";

const assertNever = (value: never): never => {
  throw new Error(`Unhandled project resolution kind: ${String(value)}`);
};

export const projectResolutionKindLabel = (
  kind: ProjectResolutionKind
): string => {
  switch (kind) {
    case "explicit_project":
      return "explicit project";
    case "connected_repo_path":
      return "connected repo path";
    case "workspace_project_slug":
      return "workspace/project slug fallback";
    default:
      return assertNever(kind);
  }
};

export const formatProjectResolutionKind = (
  kind: ProjectResolutionKind
): string => `${kind} (${projectResolutionKindLabel(kind)})`;
