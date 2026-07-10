import path from "node:path";

const SUPPORTED_PLATFORMS = new Set(["linux", "darwin"]);
const SUPPORTED_SHELLS = new Set(["bash", "dash", "sh", "zsh"]);
const WINDOWS_SHELLS = new Set(["cmd", "cmd.exe", "powershell", "powershell.exe", "pwsh", "pwsh.exe"]);

const optionValue = (argv, option, fallback) => {
  const index = argv.indexOf(option);
  if (index === -1) {
    return fallback;
  }

  const value = argv[index + 1];

  if (typeof value !== "string" || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }

  return value;
};

const isWsl = (argv) =>
  argv.includes("--wsl") || process.env.WSL_INTEROP !== undefined || process.env.WSL_DISTRO_NAME !== undefined;

const parseArguments = (argv) => ({
  platform: optionValue(argv, "--platform", process.platform),
  shell: optionValue(argv, "--shell", process.env.SHELL),
  wsl: isWsl(argv)
});

const shellName = (shell) => shell === undefined ? undefined : path.basename(shell).toLowerCase();

const platformFailure = (platform) => {
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    return `platform ${platform} is unsupported; use Linux, macOS, or WSL with a POSIX shell`;
  }

  return undefined;
};

const shellFailureMessage = (name) => {
  if (WINDOWS_SHELLS.has(name)) {
    return `shell ${name} is unsupported; use WSL/Linux/macOS with bash, sh, dash, or zsh`;
  }

  return SUPPORTED_SHELLS.has(name)
    ? undefined
    : `shell ${name} is outside the tested contract; use bash, sh, dash, or zsh`;
};

const shellFailure = (shell) => {
  const name = shellName(shell);

  return name === undefined ? undefined : shellFailureMessage(name);
};

const failureFor = ({ platform, shell }) => platformFailure(platform) ?? shellFailure(shell);

const main = () => {
  const context = parseArguments(process.argv.slice(2));
  const failure = failureFor(context);

  if (failure !== undefined) {
    console.error("Platform contract failed:");
    console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  const shell = shellName(context.shell) ?? "shell unspecified (POSIX command contract)";
  const environment = context.wsl ? "WSL/POSIX" : context.platform;
  console.log(`Platform contract passed: ${environment}; shell ${shell}; native Windows is unsupported.`);
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
