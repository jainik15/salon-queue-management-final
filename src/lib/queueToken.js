export function formatQueueToken(token) {
  return typeof token === 'string' ? token.replace(/^LX-/i, 'LC-') : ''
}
