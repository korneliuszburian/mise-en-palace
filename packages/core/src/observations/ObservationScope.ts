import type {
  ExecutionRunId,
  ProjectId,
  TaskContractId,
  WorkspaceId
} from "../ids.js";

export interface ObservationScope {
  workspaceId?: WorkspaceId;
  projectId?: ProjectId;
  executionRunId?: ExecutionRunId;
  taskContractId?: TaskContractId;
  targetRepoPath?: string;
}
