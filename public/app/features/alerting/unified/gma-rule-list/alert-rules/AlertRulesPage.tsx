import { t } from '@grafana/i18n';
import { Box, EmptyState, Stack } from '@grafana/ui';

import { AlertingPageWrapper } from '../../components/AlertingPageWrapper';
import { withPageErrorBoundary } from '../../withPageErrorBoundary';
import { RuleListModeToggle } from '../rule-search/RuleListModeToggle';
import { RuleSearchInput } from '../rule-search/RuleSearchInput';
import { type RuleSearchFilter } from '../rule-search/ruleSearchFilter';
import { type RuleListMode, useRuleListSearchState } from '../rule-search/useRuleListSearchState';
import { useTrackRuleListPageView } from '../shared/analytics';

import { AlertRulesFoldersView } from './AlertRulesFoldersView';
import { AlertRulesListView } from './AlertRulesListView';
import { useAlertRuleSearchRejection } from './alertRuleSearch';

function AlertRulesPage() {
  const { query, filter, parseIssues, filters, mode, hasNonFolderFilters, applyQuery, setMode } =
    useRuleListSearchState('alert');
  // Folders mode sends no rule search for the page, so there is no request to be rejected.
  const rejectionIssues = useAlertRuleSearchRejection(filter, {
    skip: parseIssues.length > 0 || mode === 'folders',
  });
  const issues = parseIssues.length > 0 ? parseIssues : rejectionIssues;

  useTrackRuleListPageView('alert', mode);

  return (
    // The heading comes from the navId, so it also drives breadcrumbs and nav highlighting.
    <AlertingPageWrapper navId="alert-rules">
      <Box paddingTop={2}>
        <Stack direction="column" gap={2}>
          <Stack direction="row" gap={2} alignItems="flex-end">
            <Box grow={1} minWidth={0}>
              <RuleSearchInput query={query} onApply={applyQuery} filters={filters} issues={issues} />
            </Box>
            <Box shrink={0}>
              <RuleListModeToggle mode={mode} onChange={setMode} foldersDisabled={hasNonFolderFilters} />
            </Box>
          </Stack>
          <AlertRulesBody hasIssues={issues.length > 0} mode={mode} filter={filter} />
        </Stack>
      </Box>
    </AlertingPageWrapper>
  );
}

export default withPageErrorBoundary(AlertRulesPage);

interface AlertRulesBodyProps {
  hasIssues: boolean;
  mode: RuleListMode;
  filter: RuleSearchFilter;
}

function AlertRulesBody({ hasIssues, mode, filter }: AlertRulesBodyProps) {
  if (hasIssues) {
    return (
      <EmptyState
        variant="not-found"
        message={t('alerting.gma-rule-list.alert-rules.search-issues', 'Change the search to see results')}
      />
    );
  }
  if (mode === 'folders') {
    return <AlertRulesFoldersView folderUids={filter.folders} />;
  }
  return <AlertRulesListView filter={filter} />;
}
