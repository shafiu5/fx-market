export function isSubscriptionActive(user: {
  subscriptionActive: boolean;
  subscriptionExpiresAt: Date | string | null;
}): boolean {
  if (!user.subscriptionActive) return false;
  if (!user.subscriptionExpiresAt) return true;
  return new Date(user.subscriptionExpiresAt).getTime() > Date.now();
}

export function isBoosted(user: {
  boostedUntil: Date | string | null;
}): boolean {
  if (!user.boostedUntil) return false;
  return new Date(user.boostedUntil).getTime() > Date.now();
}
