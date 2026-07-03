import {
  createUserFromJson
} from "../src/index.js";

const created = createUserFromJson(
  JSON.stringify({ email: "operator@example.com" }),
  { DEFAULT_ROLE: "admin" }
);

if (created.kind !== "created") {
  throw new Error("Expected baseline fixture to create a user.");
}

if (created.user.role !== "admin") {
  throw new Error("Expected baseline fixture to use default role.");
}

const invalidJson = createUserFromJson("{", {});

if (invalidJson.kind !== "invalid_input" || invalidJson.reason !== "invalid_json") {
  throw new Error("Expected malformed JSON to return invalid_json.");
}

const missingEmail = createUserFromJson(JSON.stringify({ role: "admin" }), {});

if (missingEmail.kind !== "invalid_input" || missingEmail.reason !== "invalid_shape") {
  throw new Error("Expected missing email to return invalid_shape.");
}

const invalidRole = createUserFromJson(
  JSON.stringify({ email: "operator@example.com", role: "owner" }),
  {}
);

if (invalidRole.kind !== "invalid_input" || invalidRole.reason !== "invalid_shape") {
  throw new Error("Expected invalid role to return invalid_shape.");
}
