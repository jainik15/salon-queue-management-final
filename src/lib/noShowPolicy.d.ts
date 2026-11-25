export const NO_SHOW_GRACE_SECONDS: number
export function getNoShowSecondsRemaining(timestampCalled: string | Date | null | undefined, nowMs?: number): number
export function isNoShowEligible(timestampCalled: string | Date | null | undefined, nowMs?: number): boolean
