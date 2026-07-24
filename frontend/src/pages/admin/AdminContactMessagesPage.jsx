import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactService } from '@/services/contact.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Mail, MailOpen, Trash2, Eye } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog';
import { useToast } from '@/hooks/useToast';
import { Toaster } from '@/components/ui/Toaster';

const BREADCRUMBS = [{ label: 'Dashboard', href: '/admin/dashboard' }];

export default function AdminContactMessagesPage() {
  const queryClient = useQueryClient();
  const { toasts, toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contactMessages', { page, search, status }],
    queryFn: () => contactService.getContactMessages({ page, limit: 10, search, status }),
    keepPreviousData: true,
  });

  const mMarkAsRead = useMutation({
    mutationFn: contactService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['contactMessages']);
      toast({ description: 'Message marked as read.' });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update message.', variant: 'destructive' });
    }
  });

  const mDelete = useMutation({
    mutationFn: contactService.deleteContactMessage,
    onSuccess: () => {
      queryClient.invalidateQueries(['contactMessages']);
      setIsDeleteDialogOpen(false);
      setMessageToDelete(null);
      if (selectedMessage?.id === messageToDelete) {
        setIsViewDialogOpen(false);
      }
      toast({ description: 'Message deleted successfully.' });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete message.', variant: 'destructive' });
    }
  });

  const handleView = (msg) => {
    setSelectedMessage(msg);
    setIsViewDialogOpen(true);
  };

  const confirmDelete = (id) => {
    setMessageToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const unreadCount = data?.data?.unreadCount || 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <PageHeader
          title="Contact Messages"
          description="Manage inquiries and messages submitted via the public landing page."
          breadcrumbs={BREADCRUMBS}
        />
        <Badge variant={unreadCount > 0 ? "default" : "outline"} className="px-3 py-1 text-sm flex items-center gap-2">
          <Mail className="w-4 h-4" />
          {unreadCount} Unread Messages
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-9 w-full"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="flex h-10 w-full sm:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="ALL">All Messages</option>
              <option value="UNREAD">Unread Only</option>
              <option value="READ">Read Only</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading messages...</p>
          ) : isError ? (
            <p className="text-sm text-red-500 text-center py-6">Failed to load contact messages.</p>
          ) : data?.data?.messages?.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <Mail className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No contact messages found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Sender</th>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.data?.messages?.map((msg) => (
                    <tr key={msg.id} className={`hover:bg-muted/30 transition-colors ${!msg.isRead ? 'bg-primary/5 font-medium' : ''}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {!msg.isRead ? (
                          <span className="flex items-center gap-1.5 text-blue-600">
                            <Mail className="w-4 h-4 fill-blue-100" /> Unread
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <MailOpen className="w-4 h-4" /> Read
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-foreground">{msg.fullName}</span>
                          <span className="text-xs text-muted-foreground">{msg.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-[200px] truncate text-foreground">
                        {msg.subject}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                        <Button variant="outline" size="sm" onClick={() => handleView(msg)}>
                          <Eye className="w-4 h-4 mr-1.5" /> View
                        </Button>
                        {!msg.isRead && (
                          <Button variant="outline" size="sm" onClick={() => mMarkAsRead.mutate(msg.id)} disabled={mMarkAsRead.isPending}>
                            Mark Read
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => confirmDelete(msg.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.data?.pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Showing page {page} of {data.data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.data.pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">From</p>
                  <p className="text-sm font-medium">{selectedMessage.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                </div>
                <div className="space-y-1 sm:text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date Received</p>
                  <p className="text-sm">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                  <Badge variant={selectedMessage.isRead ? "secondary" : "default"} className="mt-1">
                    {selectedMessage.isRead ? "Read" : "Unread"}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Subject</p>
                <p className="text-base font-semibold">{selectedMessage.subject}</p>
              </div>

              <div className="space-y-1 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Message</p>
                <div className="bg-muted/30 p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border">
                  {selectedMessage.message}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 flex sm:justify-between items-center gap-3">
             <Button variant="destructive" onClick={() => {
                confirmDelete(selectedMessage.id);
             }}>
                Delete Message
             </Button>
             <div className="flex gap-2">
                {!selectedMessage?.isRead && (
                   <Button variant="default" onClick={() => {
                      mMarkAsRead.mutate(selectedMessage.id);
                      setIsViewDialogOpen(false);
                   }}>
                      Mark as Read
                   </Button>
                )}
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contact Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => mDelete.mutate(messageToDelete)} disabled={mDelete.isPending}>
              {mDelete.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} />
    </div>
  );
}
