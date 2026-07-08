export const hasSourceText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;
