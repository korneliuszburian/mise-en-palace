import postgres, { type Sql, type TransactionSql } from "postgres";

export const sourceAuthorityQuarantineReadbackLimitMaximum = 100;

export type SourceAuthorityQuarantineCurrentAuthority =
  | "governing"
  | "non_governing"
  | "absent";

export interface SourceAuthorityQuarantineReadbackItem {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly reason: string;
  readonly quarantinedAt: string;
  readonly projectId: string | null;
  readonly entityPresent: boolean;
  readonly currentAuthority: SourceAuthorityQuarantineCurrentAuthority;
  readonly resolution: "unresolved" | "resolved";
}

export interface SourceAuthorityQuarantineReadbackReport {
  readonly limit: number;
  readonly projectId: string | null;
  readonly afterId: string | null;
  readonly nextAfterId: string | null;
  readonly totalCount: number;
  readonly unresolvedCount: number;
  readonly returnedCount: number;
  readonly truncated: boolean;
  readonly items: readonly SourceAuthorityQuarantineReadbackItem[];
}

export interface SourceAuthorityQuarantineReadbackInput {
  readonly databaseUrl: string;
  readonly limit: number;
  readonly projectId?: string;
  readonly afterId?: string;
}

interface RawQuarantineContext {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly reason: string;
  readonly quarantinedAt: Date;
  readonly projectId: string | null;
  readonly entityPresent: boolean;
  readonly governing: boolean;
}

interface RawQuarantineCounts {
  readonly totalCount: number;
  readonly unresolvedCount: number;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const requireUuid = (value: string, label: string): string => {
  const normalized = value.trim();

  if (!uuidPattern.test(normalized)) {
    throw new Error(`${label} must be a UUID`);
  }

  return normalized;
};

const validateInput = (input: SourceAuthorityQuarantineReadbackInput): {
  readonly databaseUrl: string;
  readonly limit: number;
  readonly projectId: string | null;
  readonly afterId: string | null;
} => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for source authority quarantine readback");
  }

  if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > sourceAuthorityQuarantineReadbackLimitMaximum) {
    throw new Error(`limit must be an integer from 1 to ${sourceAuthorityQuarantineReadbackLimitMaximum}`);
  }

  return {
    databaseUrl,
    limit: input.limit,
    projectId: input.projectId === undefined ? null : requireUuid(input.projectId, "projectId"),
    afterId: input.afterId === undefined ? null : requireUuid(input.afterId, "afterId")
  };
};

const quarantineContextSql = (client: Sql | TransactionSql) => client`
  with quarantine_context as (
    select
      quarantine.id::text as id,
      quarantine.entity_type as "entityType",
      quarantine.entity_id::text as "entityId",
      quarantine.reason,
      quarantine.quarantined_at as "quarantinedAt",
      coalesce(
        artifact.project_id,
        decision.project_id,
        search.project_id,
        claim_artifact.project_id,
        case
          when quarantine.metadata->>'project_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then (quarantine.metadata->>'project_id')::uuid
          else null
        end
      )::text as "projectId",
      case quarantine.entity_type
        when 'source_artifact' then artifact.id is not null
        when 'source_claim' then claim.id is not null
        when 'source_decision' then decision.id is not null
        when 'source_decision_edge' then decision_edge.id is not null
        when 'search_document' then search.id is not null
        else false
      end as "entityPresent",
      case quarantine.entity_type
        when 'source_artifact' then exists (
          select 1
          from source_claims current_claim
          join source_decisions current_decision
            on current_decision.source_claim_id = current_claim.id
           and current_decision.status = 'adopt'
          join source_decision_edges current_edge
            on current_edge.source_claim_id = current_claim.id
           and current_edge.source_decision_id = current_decision.id
          where current_claim.source_artifact_id = quarantine.entity_id
            and current_claim.status = 'accepted'
        )
        when 'source_claim' then claim.status = 'accepted' and exists (
          select 1
          from source_decisions current_decision
          join source_decision_edges current_edge
            on current_edge.source_claim_id = claim.id
           and current_edge.source_decision_id = current_decision.id
          where current_decision.source_claim_id = claim.id
            and current_decision.status = 'adopt'
        )
        when 'source_decision' then decision.status = 'adopt' and exists (
          select 1 from source_decision_edges current_edge
          join source_claims current_claim on current_claim.id = current_edge.source_claim_id
          where current_edge.source_decision_id = decision.id
            and current_claim.status = 'accepted'
        )
        when 'source_decision_edge' then decision_edge.id is not null
          and edge_decision.status = 'adopt'
          and edge_claim.status = 'accepted'
        when 'search_document' then search.id is not null
          and search.validity_status = 'active'
          and search_decision.status = 'adopt'
          and search_claim.status = 'accepted'
        else false
      end as governing
    from source_authority_quarantines quarantine
    left join source_artifacts artifact
      on quarantine.entity_type = 'source_artifact' and artifact.id = quarantine.entity_id
    left join source_claims claim
      on quarantine.entity_type = 'source_claim' and claim.id = quarantine.entity_id
    left join source_decisions decision
      on quarantine.entity_type = 'source_decision' and decision.id = quarantine.entity_id
    left join source_decision_edges decision_edge
      on quarantine.entity_type = 'source_decision_edge' and decision_edge.id = quarantine.entity_id
    left join source_claims edge_claim on edge_claim.id = decision_edge.source_claim_id
    left join source_decisions edge_decision on edge_decision.id = decision_edge.source_decision_id
    left join search_documents search
      on quarantine.entity_type = 'search_document' and search.id = quarantine.entity_id
    left join source_claims search_claim on search_claim.id = search.source_claim_id
    left join source_decisions search_decision on search_decision.id = search.source_decision_id
    left join source_claims anchor_claim on anchor_claim.id = coalesce(
      claim.id,
      decision.source_claim_id,
      decision_edge.source_claim_id,
      search.source_claim_id,
      case
        when quarantine.metadata->>'source_claim_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          then (quarantine.metadata->>'source_claim_id')::uuid
        else null
      end
    )
    left join source_artifacts claim_artifact on claim_artifact.id = anchor_claim.source_artifact_id
  )
  select * from quarantine_context
`;

const readQuarantines = async (
  client: Sql | TransactionSql,
  input: ReturnType<typeof validateInput>
): Promise<SourceAuthorityQuarantineReadbackReport> => {
  const context = quarantineContextSql(client);
  const [counts] = await client<RawQuarantineCounts[]>`
    with context as (${context})
    select
      count(*)::int as "totalCount",
      count(*) filter (where governing)::int as "unresolvedCount"
    from context
    where (${input.projectId}::uuid is null or "projectId" = ${input.projectId})
  `;
  const rows = await client<RawQuarantineContext[]>`
    with context as (${context})
    select * from context
    where (${input.projectId}::uuid is null or "projectId" = ${input.projectId})
      and (${input.afterId}::uuid is null or id::uuid > ${input.afterId}::uuid)
    order by id::uuid
    limit ${input.limit + 1}
  `;
  const truncated = rows.length > input.limit;
  const page = rows.slice(0, input.limit);
  const items = page.map((row): SourceAuthorityQuarantineReadbackItem => ({
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    reason: row.reason,
    quarantinedAt: row.quarantinedAt.toISOString(),
    projectId: row.projectId,
    entityPresent: row.entityPresent,
    currentAuthority: row.entityPresent
      ? row.governing ? "governing" : "non_governing"
      : "absent",
    resolution: row.governing ? "unresolved" : "resolved"
  }));

  return {
    limit: input.limit,
    projectId: input.projectId,
    afterId: input.afterId,
    nextAfterId: truncated ? items.at(-1)?.id ?? null : null,
    totalCount: counts?.totalCount ?? 0,
    unresolvedCount: counts?.unresolvedCount ?? 0,
    returnedCount: items.length,
    truncated,
    items
  };
};

export const listSourceAuthorityQuarantines = async (
  rawInput: SourceAuthorityQuarantineReadbackInput
): Promise<SourceAuthorityQuarantineReadbackReport> => {
  const input = validateInput(rawInput);
  const client = postgres(input.databaseUrl, { max: 1, onnotice: () => undefined });

  try {
    return await client.begin("isolation level repeatable read read only", (transaction) =>
      readQuarantines(transaction, input)
    );
  } finally {
    await client.end();
  }
};
