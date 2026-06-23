export default class KrnGoldenSmokeProvider {
  id = () => "krn-golden-smoke-local-provider";

  callApi = async (prompt, context) => {
    const caseId = String(context?.vars?.caseId ?? "unknown-case");
    const expectedOutcome = String(context?.vars?.expectedOutcome ?? "unknown-outcome");
    const expectedSubject = String(context?.vars?.expectedSubject ?? "unknown-subject");

    return {
      output: [
        `KRN golden proof case=${caseId} status=passed`,
        `expectedOutcome=${expectedOutcome}`,
        `expectedSubject=${expectedSubject}`,
        `prompt=${prompt}`
      ].join("\n")
    };
  };
}
