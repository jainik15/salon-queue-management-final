export const NO_SHOW_GRACE_SECONDS = 10 * 60

export function getNoShowSecondsRemaining(timestampCalled, nowMs = Date.now()) {
  if (!timestampCalled) return NO_SHOW_GRACE_SECONDS
  const calledAt = timestampCalled instanceof Date
    ? timestampCalled.getTime()
    : Date.parse(timestampCalled)
  if (!Number.isFinite(calledAt)) return NO_SHOW_GRACE_SECONDS
  return Math.max(0, Math.ceil((calledAt + NO_SHOW_GRACE_SECONDS * 1000 - nowMs) / 1000))
}

export function isNoShowEligible(timestampCalled, nowMs = Date.now()) {
  return Boolean(timestampCalled) && getNoShowSecondsRemaining(timestampCalled, nowMs) === 0
}
