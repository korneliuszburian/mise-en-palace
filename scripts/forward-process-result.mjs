// fallow-ignore-next-line complexity -- process boundary must preserve stdout, stderr, spawn errors, and exit status separately
export const forwardProcessResult = (result) => {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  return result.status ?? 0;
};
