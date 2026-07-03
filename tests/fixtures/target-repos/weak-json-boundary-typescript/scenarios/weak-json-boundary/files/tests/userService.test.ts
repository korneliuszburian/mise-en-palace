import {
  createUserFromJson
} from "../src/index.js";

const created = createUserFromJson(
  JSON.stringify({ email: "operator@example.com" }),
  { DEFAULT_ROLE: "admin" }
);

if (!created) {
  throw new Error("Expected baseline fixture to create a user.");
}

if (created.role !== "admin") {
  throw new Error("Expected baseline fixture to use default role.");
}
