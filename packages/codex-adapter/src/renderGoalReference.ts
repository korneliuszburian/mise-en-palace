export interface GoalReferenceInput {
  goal?: string;
  planPath?: string;
}

export const renderGoalReference = (input: GoalReferenceInput): string | undefined => {
  if (input.goal === undefined && input.planPath === undefined) {
    return undefined;
  }

  return [
    input.goal === undefined ? undefined : `Goal: ${input.goal}`,
    input.planPath === undefined ? undefined : `Plan: ${input.planPath}`
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
};
