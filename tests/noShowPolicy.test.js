import assert from 'node:assert/strict'
import test from 'node:test'
import { getNoShowSecondsRemaining, isNoShowEligible, NO_SHOW_GRACE_SECONDS } from '../src/lib/noShowPolicy.js'

const calledAt = new Date('2026-11-25T10:00:00.000Z')
const calledAtMs = calledAt.getTime()

test('no-show remains unavailable until ten minutes after the call', () => {
  assert.equal(isNoShowEligible(calledAt, calledAtMs + 9 * 60 * 1000 + 59 * 1000), false)
  assert.equal(getNoShowSecondsRemaining(calledAt, calledAtMs + 9 * 60 * 1000 + 59 * 1000), 1)
})

test('no-show becomes available at the ten-minute boundary', () => {
  assert.equal(isNoShowEligible(calledAt, calledAtMs + NO_SHOW_GRACE_SECONDS * 1000), true)
  assert.equal(getNoShowSecondsRemaining(calledAt, calledAtMs + NO_SHOW_GRACE_SECONDS * 1000), 0)
})

test('missing or invalid call timestamps never enable no-show', () => {
  assert.equal(isNoShowEligible(null, calledAtMs + 24 * 60 * 60 * 1000), false)
  assert.equal(isNoShowEligible('invalid timestamp', calledAtMs + 24 * 60 * 60 * 1000), false)
  assert.equal(getNoShowSecondsRemaining(undefined, calledAtMs), NO_SHOW_GRACE_SECONDS)
})
