const TIME_UNITS = {
  MINUTES: 5,
  SECONDS_PER_MINUTE: 60,
  MS_PER_SECOND: 1000,
} as const;

export const CACHE_DEFAULTS = {
  MAX_SIZE: 50,

  TTL_MS: TIME_UNITS.MINUTES * TIME_UNITS.SECONDS_PER_MINUTE * TIME_UNITS.MS_PER_SECOND,
} as const;
export const HASH_CALC = {
  HASH1_SHIFT: 5,

  HASH2_SHIFT: 7,

  HEX_RADIX: 16,
} as const;
export const PROGRESS = {
  START: 0,

  MIDPOINT: 50,

  COMPLETE: 100,
} as const;
