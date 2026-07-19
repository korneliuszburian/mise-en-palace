import postgres from "postgres";
import {
  createKrnDatabase
} from "@krn/db";
import type {
  KrnDatabase
} from "@krn/db";
import {
  DrizzleHarnessRunRepository
} from "@krn/db/adapters";
import type {
  ListPairedLiveEvalEvidenceInput,
  PairedLiveEvalEvidenceRecord
} from "@krn/core";

export interface PairedLiveEvalEvidenceReadRepository {
  listPairedLiveEvalEvidence(
    input: ListPairedLiveEvalEvidenceInput
  ): Promise<PairedLiveEvalEvidenceRecord[]>;
}

export interface ClosableReadbackRuntime extends PairedLiveEvalEvidenceReadRepository {
  close(): Promise<void>;
}

export const createPairedLiveEvalReadbackRuntime = async <TExtra extends object>(
  input: {
    readonly databaseUrl: string;
    readonly extra?: (db: KrnDatabase) => TExtra;
  }
): Promise<ClosableReadbackRuntime & TExtra> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const db = createKrnDatabase(client);
  const harnessRunRepository = new DrizzleHarnessRunRepository(db);
  const extra = input.extra?.(db) ?? {} as TExtra;

  return {
    listPairedLiveEvalEvidence: (filters) =>
      harnessRunRepository.listPairedLiveEvalEvidence(filters),
    ...extra,
    close: () => client.end()
  };
};
