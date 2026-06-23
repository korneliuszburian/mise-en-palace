export default class KrnGoldenSmokeProvider {
  id = () => "krn-golden-smoke-local-provider";

  callApi = async (prompt, context) => {
    const caseId = String(context?.vars?.caseId ?? "unknown-case");
    const expectedOutcome = String(context?.vars?.expectedOutcome ?? "unknown-outcome");
    const expectedSubject = String(context?.vars?.expectedSubject ?? "unknown-subject");

    return {
      output: [
        `KRN Promptfoo integration smoke case=${caseId} integrationSmoke=passed`,
        `expectedOutcome=${expectedOutcome}`,
        `expectedSubject=${expectedSubject}`,
        "doesNotExecuteKrnBehavior=true",
        `prompt=${prompt}`
      ].join("\n")
    };
  };
}
