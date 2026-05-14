// Generates a consistent conversation ID between two users
// Always sorts the two IDs so order doesn't matter
export function getConversationId(userId1, userId2) {
  return [userId1, userId2].sort().join('_')
}