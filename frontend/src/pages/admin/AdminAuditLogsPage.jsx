import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs, getAuditLogActions } from '@/services/auditLog.service';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Eye, Search, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import EmptyState from '@/components/admin/EmptyState';
import ErrorBanner from '@/components/admin/ErrorBanner';
import { TableSkeleton } from '@/components/admin/LoadingSkeleton';

const BREADCRUMBS = [{ label: 'Dashboard', href: '/admin/dashboard' }];
const LIMIT = 20;

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedLog, setSelectedLog] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['auditLogs', { page, limit: LIMIT, search, action: actionFilter, entity: entityFilter, sort }],
    queryFn: () => getAuditLogs({ page, limit: LIMIT, search, action: actionFilter, entity: entityFilter, sort }),
    keepPreviousData: true,
  });

  const { data: availableActions } = useQuery({
    queryKey: ['auditLogActions'],
    queryFn: getAuditLogActions,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const getActionColor = (action) => {
    if (!action) return 'bg-gray-100 text-gray-800';
    if (action.includes('CREATE') || action.includes('START') || action.includes('LOGIN')) return 'bg-green-100 text-green-800 border-green-200';
    if (action.includes('UPDATE') || action.includes('FINISH') || action.includes('SUBMIT')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('DELETE') || action.includes('LOGOUT')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const total = data?.pagination?.total ?? 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Audit Logs"
        description={`${total.toLocaleString()} system activities recorded`}
        breadcrumbs={BREADCRUMBS}
      />

      {isError && <ErrorBanner message={error?.response?.data?.message || "Failed to load logs."} onRetry={refetch} />}

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
            <form onSubmit={handleSearch} className="flex flex-1 max-w-sm gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs by action or description..."
                  className="pl-9"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background md:w-[150px]"
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background md:w-[150px]"
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Actions</option>
                {availableActions?.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>

              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background md:w-[150px]"
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Entities</option>
                <option value="User">User</option>
                <option value="Question">Question</option>
                <option value="Note">Note</option>
                <option value="MockExam">Mock Exam</option>
                <option value="SystemSetting">System Setting</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><TableSkeleton rows={LIMIT} cols={6} /></div>
          ) : data?.logs?.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={search || actionFilter || entityFilter ? 'No audit logs found' : 'No audit logs yet'}
              description={
                search || actionFilter || entityFilter
                  ? `No results match your filters. Try clearing them.`
                  : 'System activity will appear here once recorded.'
              }
              action={
                (search || actionFilter || entityFilter) && (
                  <Button onClick={() => { setSearch(''); setSearchInput(''); setActionFilter(''); setEntityFilter(''); setPage(1); }}>
                    Clear Filters
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entity</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.logs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div className="text-sm">
                            <div className="font-medium text-foreground">{log.user.fullName}</div>
                            <div className="text-muted-foreground text-xs">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">System / Deleted User</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{log.entityType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate" title={log.description}>
                        {log.description}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {((page - 1) * LIMIT) + 1} to {Math.min(page * LIMIT, data.pagination.total)} of {data.pagination.total} entries
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        {selectedLog && (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Timestamp</h4>
                <p className="text-sm font-medium">{new Date(selectedLog.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Action</h4>
                <Badge variant="outline" className={getActionColor(selectedLog.action)}>{selectedLog.action}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Entity</h4>
                <p className="text-sm"><Badge variant="outline">{selectedLog.entityType}</Badge> {selectedLog.entityId && <span className="text-muted-foreground text-xs ml-2">({selectedLog.entityId})</span>}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Client IP</h4>
                <p className="text-sm text-foreground">{selectedLog.ipAddress || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Description</h4>
              <p className="text-sm bg-muted/40 p-3 rounded-md border border-border">{selectedLog.description}</p>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">User Information</h4>
              {selectedLog.user ? (
                <div className="text-sm bg-muted/40 p-3 rounded-md border border-border">
                  <p><span className="font-medium w-24 inline-block">ID:</span> {selectedLog.user.id}</p>
                  <p><span className="font-medium w-24 inline-block">Name:</span> {selectedLog.user.fullName}</p>
                  <p><span className="font-medium w-24 inline-block">Email:</span> {selectedLog.user.email}</p>
                  <p><span className="font-medium w-24 inline-block">Role:</span> {selectedLog.user.role}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">System Action or User Deleted</p>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">User Agent</h4>
              <p className="text-xs font-mono bg-muted/40 p-3 rounded-md border border-border break-all">
                {selectedLog.userAgent || 'N/A'}
              </p>
            </div>

            {selectedLog.metadata && (
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Metadata</h4>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
