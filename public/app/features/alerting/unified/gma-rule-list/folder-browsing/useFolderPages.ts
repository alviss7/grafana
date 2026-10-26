import { useState } from 'react';

import { type PagedFailure } from '../shared/PagedFailureAlert';

import { type FolderHit, useSearchRuleFoldersInfiniteQuery } from './folderSearch';

/** The query keeps every visited page (tokens in memory), so going back is free and refetches do not move the user. */
export function useFolderPages(folderUids: string[]) {
  const filterKey = JSON.stringify(folderUids);
  const [position, setPosition] = useState({ filterKey, pageIndex: 0 });
  if (position.filterKey !== filterKey) {
    setPosition({ filterKey, pageIndex: 0 });
  }

  const query = useSearchRuleFoldersInfiniteQuery({ folderUids });
  const { currentData, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = query;
  // Missing from the result type of a query that has not started.
  const isFetchNextPageError = 'isFetchNextPageError' in query && query.isFetchNextPageError;

  // currentData, not data: while the arguments change, data still holds the previous arguments' pages.
  const pages = currentData?.pages;
  const hasLoaded = pages !== undefined;
  // The wanted page can be ahead of the loaded ones while the next page is fetching or has failed;
  // the last loaded page stays on screen until it arrives.
  const shownIndex = pages ? Math.min(position.pageIndex, pages.length - 1) : 0;
  const folders: FolderHit[] = pages?.[shownIndex]?.folders ?? [];
  const failure: PagedFailure | undefined =
    hasLoaded && isError ? { kind: isFetchNextPageError ? 'load-more' : 'refresh', error } : undefined;

  return {
    folders,
    isLoading: !hasLoaded && !isError,
    // A failed first page replaces the list; a later failure keeps the shown folders and reports `failure`.
    error: !hasLoaded && isError ? error : undefined,
    failure,
    isLoadingPage: isFetchingNextPage,
    hasNext: hasLoaded && (shownIndex < pages.length - 1 || hasNextPage),
    hasPrevious: shownIndex > 0,
    next: () => {
      setPosition({ filterKey, pageIndex: shownIndex + 1 });
      if (pages && shownIndex === pages.length - 1) {
        void fetchNextPage();
      }
    },
    previous: () => setPosition({ filterKey, pageIndex: Math.max(shownIndex - 1, 0) }),
    // Refetching reloads every loaded page with fresh continuation tokens, so it also recovers from an expired one.
    retry: () => {
      void refetch();
    },
  };
}
