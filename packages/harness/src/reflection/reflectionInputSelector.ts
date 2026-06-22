import type {
  AntiMemoryRecord,
  ObservationGroupId,
  ObservationItem,
  ProjectId,
  ReflectionInput,
  SourceClaim,
  TaskContractId,
  ExecutionRunId
} from "@krn/core";

export interface SelectReflectionInputOptions {
  projectId: ProjectId;
  executionRunId?: ExecutionRunId;
  taskContractId?: TaskContractId;
  observationGroupIds?: ObservationGroupId[];
  observations: readonly ObservationItem[];
  sourceClaims: readonly SourceClaim[];
  antiMemoryRecords: readonly AntiMemoryRecord[];
  generatedAt: string;
  metadata?: Record<string, unknown>;
}

const isProjectScopedObservation = (
  observation: ObservationItem,
  projectId: ProjectId
): boolean => observation.scope.projectId === projectId;

const isProjectScopedSourceClaim = (
  sourceClaim: SourceClaim,
  projectId: ProjectId
): boolean => sourceClaim.metadata.projectId === projectId;

const isProjectScopedAntiMemory = (
  antiMemory: AntiMemoryRecord,
  projectId: ProjectId
): boolean => antiMemory.projectId === projectId;

const sortedUnique = (values: readonly string[]): string[] => (
  [...new Set(values)].sort()
);

export const selectReflectionInput = (
  options: SelectReflectionInputOptions
): ReflectionInput => {
  const observations = options.observations
    .filter((observation) => isProjectScopedObservation(observation, options.projectId))
    .sort((left, right) => (
      left.temporalScope.observedAt.localeCompare(right.temporalScope.observedAt) ||
      left.id.localeCompare(right.id)
    ));
  const sourceClaims = options.sourceClaims
    .filter((sourceClaim) => isProjectScopedSourceClaim(sourceClaim, options.projectId))
    .sort((left, right) => left.id.localeCompare(right.id));
  const antiMemoryRecords = options.antiMemoryRecords
    .filter((antiMemory) => isProjectScopedAntiMemory(antiMemory, options.projectId))
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    scope: {
      projectId: options.projectId,
      ...(options.executionRunId === undefined ? {} : { executionRunId: options.executionRunId }),
      ...(options.taskContractId === undefined ? {} : { taskContractId: options.taskContractId }),
      ...(options.observationGroupIds === undefined
        ? {}
        : { observationGroupIds: sortedUnique(options.observationGroupIds) })
    },
    observationItemIds: observations.map((observation) => observation.id),
    sourceClaimIds: sourceClaims.map((sourceClaim) => sourceClaim.id),
    antiMemoryKeys: antiMemoryRecords.map((antiMemory) => antiMemory.key),
    generatedAt: options.generatedAt,
    metadata: {
      ...(options.metadata ?? {}),
      observationKinds: sortedUnique(observations.map((observation) => observation.kind)),
      contradictionObservationIds: observations
        .filter((observation) => observation.kind === "conflict" || observation.status === "contested")
        .map((observation) => observation.id)
        .sort(),
      gapObservationIds: observations
        .filter((observation) => observation.kind === "gap")
        .map((observation) => observation.id)
        .sort()
    }
  };
};
