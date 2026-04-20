/** One-shot: Home requests Explore search focus without keeping URL params. */
let pendingExploreSearchFocus = false;

export function requestExploreSearchFocus(): void {
  pendingExploreSearchFocus = true;
}

export function consumeExploreSearchFocus(): boolean {
  const v = pendingExploreSearchFocus;
  pendingExploreSearchFocus = false;
  return v;
}
