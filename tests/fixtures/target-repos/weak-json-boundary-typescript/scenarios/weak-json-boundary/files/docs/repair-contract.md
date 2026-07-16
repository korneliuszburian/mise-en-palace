# User-Creation Repair Contract

Repair the public `createUserFromJson` behavior while preserving the existing
package and exported entry points.

## Observable acceptance requirements

- Valid JSON containing a non-empty email and either the `admin` or `member`
  role creates and saves one user.
- When the role is omitted, the configured default is used only if it is
  supported; otherwise use a safe supported default.
- Malformed JSON, a missing or empty email, and any unsupported role are
  rejected without throwing and without saving a user.
- Every call returns an explicit object whose state lets a caller distinguish
  creation from rejected input.
- Focused tests cover the three rejected-input classes above, and the package
  test and typecheck commands pass.

## Scope

Do not add a framework, external service, network access, broad cleanup, or a
new package. The checks do not prove behavior outside this target contract.
