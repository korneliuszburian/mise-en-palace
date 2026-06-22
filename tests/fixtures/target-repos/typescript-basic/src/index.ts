export interface TestScriptReadiness {
  packageName: string;
  hasTestScript: boolean;
}

export const readiness: TestScriptReadiness = {
  packageName: "krn-fixture-typescript-basic",
  hasTestScript: true
};
