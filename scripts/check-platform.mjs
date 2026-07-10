import path from "node:path";

const SUPPORTED_PLATFORMS = new Set(["linux", "darwin"]);
const SUPPORTED_SHELLS = new Set(["bash", "dash", "sh", "zsh"]);
const WINDOWS_SHELLS = new Set(["cmd", "cmd.exe", "powershell", "powershell.exe", "pwsh", "pwsh.exe"]);

const optionValue = (argv, option) => {
  const index = argv.indexOf(option);
  if (index === -1) {
    return undefined;
  }

  const value = index === -1 ? undefined : argv[index + 1];

  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }

  return value;
};

const parseArguments = (argv) => ({
  platform: optionValue(argv, "--platform") ?? process.platform,
  shell: optionValue(argv, "--shell") ?? process.env.SHELL,
  wsl: argv.includes("--wsl") || process.env.WSL_INTEROP !== undefined || process.env.WSL_DISTRO_NAME !== undefined
});

const shellName = (shell) => shell === undefined ? undefined : path.basename(shell).toLowerCase();

const failureFor = ({ platform, shell }) => {
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    return `platform ${platform} is unsupported; use Linux, macOS, or WSL with a POSIX shell`;
  }

  const name = shellName(shell);
  if (name !== undefined && WINDOWS_SHELLS.has(name)) {
    return `shell ${name} is unsupported; use WSL/Linux/macOS with bash, sh, dash, or zsh`;
  }

  if (name !== undefined && !SUPPORTED_SHELLS.has(name)) {
    return `shell ${name} is outside the tested contract; use bash, sh, dash, or zsh`;
  }

  return undefined;
};

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
