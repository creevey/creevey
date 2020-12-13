export function setSearchParams(storyId: string, browser: string): void {
  const pageUrl = `?storyId=${storyId || ''}&browser=${browser}`;
  window.history.pushState('', '', pageUrl);
}

export function getStoryIdAndBrowserFromSearch(): { storyId: string | null; browser: string | null } {
  const search = new URLSearchParams(window.location.search);
  return { storyId: search.get('storyId'), browser: search.get('browser') };
}
