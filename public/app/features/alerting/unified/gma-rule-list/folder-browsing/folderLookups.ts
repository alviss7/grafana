import { skipToken } from '@reduxjs/toolkit/query';

import {
  type FolderInfo,
  useGetFolderCountsQuery,
  useGetFolderParentsQuery,
} from '@grafana/api-clients/rtkq/folder/v1beta1';
import { getParsedCounts } from 'app/api/clients/folder/v1beta1/utils';

export function useFolderPath(folderUid: string | undefined): string[] | undefined {
  const { data } = useGetFolderParentsQuery(folderUid ? { name: folderUid } : skipToken);
  return data?.items.map((folder: FolderInfo) => folder.title);
}

/** A folder's count for one rule kind; `error` means the `/counts` lookup failed, not that it is pending. */
export type FolderRuleCount =
  | { status: 'loading' }
  | { status: 'loaded'; count: number }
  | { status: 'error'; retry: () => void };

export function useFolderAlertRuleCount(folderUid: string | undefined): FolderRuleCount {
  return useFolderRuleCount(folderUid, 'alertrules');
}

function useFolderRuleCount(folderUid: string | undefined, resource: 'alertrules'): FolderRuleCount {
  // Counts change when a rule is created or duplicated in the editor, outside these queries.
  const { data, isError, refetch } = useGetFolderCountsQuery(folderUid ? { name: folderUid } : skipToken, {
    refetchOnMountOrArgChange: true,
  });
  // A failed refetch keeps the last good count, so the row only reports an error when it has nothing to show.
  if (data) {
    // The response omits resources the folder holds none of. getParsedCounts keeps the Unified Storage
    // entry over the SQL fallback one, so a rule is not counted twice.
    return { status: 'loaded', count: getParsedCounts(data.counts)[resource] ?? 0 };
  }
  return isError ? { status: 'error', retry: refetch } : { status: 'loading' };
}
