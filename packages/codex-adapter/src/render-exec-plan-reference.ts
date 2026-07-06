export interface ExecPlanReferenceInput {
  planPath: string;
  milestone?: string;
}

export const renderExecPlanReference = (input: ExecPlanReferenceInput): string =>
  input.milestone === undefined
    ? input.planPath
    : `${input.planPath} ${input.milestone}`;
