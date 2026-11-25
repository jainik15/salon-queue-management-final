import assert from 'node:assert/strict'
import test from 'node:test'
import { formatQueueToken } from '../src/lib/queueToken.js'

test('formats a legacy database token with the LateCuts display prefix', () => {
  assert.equal(formatQueueToken('LX-03'), 'LC-03')
})

test('preserves already formatted and unrelated tokens', () => {
  assert.equal(formatQueueToken('LC-03'), 'LC-03')
  assert.equal(formatQueueToken('CUSTOM-03'), 'CUSTOM-03')
})
