import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, CheckCircle2, Megaphone, Info, X } from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days === 1) return 'Yesterday';
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const storageKey = user ? `readAnnouncements-${user.id}` : 'readAnnouncements';

  const [readAnnouncements, setReadAnnouncements] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (user) {
      try {
        setReadAnnouncements(JSON.parse(localStorage.getItem(`readAnnouncements-${user.id}`) || '[]'));
      } catch {
        setReadAnnouncements([]);
      }
    }
  }, [user]);

  const updateReadAnnouncements = (newRead) => {
    setReadAnnouncements(newRead);
    localStorage.setItem(storageKey, JSON.stringify(newRead));
  };

  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && selectedNotification) {
        setSelectedNotification(null);
      }
    }
    if (selectedNotification) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedNotification]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await notificationService.getUnreadCount();
      return res.data.data;
    },
    refetchInterval: 60000,
    enabled: !!user,
  });

  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ['notifications-feed'],
    queryFn: async () => {
      const res = await notificationService.getNotifications();
      return res.data.data;
    },
    refetchInterval: 60000,
    enabled: isOpen && !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-feed'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      if (notifications) {
        const announcementKeys = notifications.filter(n => n.userId === null).map(n => `${n.id}_${new Date(n.updatedAt).getTime()}`);
        const newRead = [...new Set([...readAnnouncements, ...announcementKeys])];
        updateReadAnnouncements(newRead);
      }
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-feed'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-feed'] });
    }
  });

  const unreadUserCount = unreadData?.count || 0;
  const unreadAnnouncementCount = (unreadData?.announcementIds || []).filter(
    id => !readAnnouncements.includes(id)
  ).length;
  const unreadCount = unreadUserCount + unreadAnnouncementCount;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 origin-top-right rounded-md border bg-background shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {notifications.some(n => !n.isRead && n.userId !== null) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isLoading}
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : isError ? (
              <div className="p-4 text-center text-sm text-destructive">Failed to load.</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Bell className="mx-auto mb-2 h-8 w-8 opacity-20" />
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => {
                  const isAnnouncement = notif.userId === null;
                  const announcementKey = isAnnouncement ? `${notif.id}_${new Date(notif.updatedAt).getTime()}` : null;
                  const isAnnouncementUnread = isAnnouncement && !readAnnouncements.includes(announcementKey);
                  const isUnread = (!isAnnouncement && !notif.isRead) || isAnnouncementUnread;

                  return (
                    <div 
                      key={notif.id} 
                      className={`group relative flex gap-3 p-4 transition-colors hover:bg-muted/50 cursor-pointer ${isUnread ? 'bg-primary/5' : ''}`}
                      onClick={() => {
                        if (isAnnouncement) {
                          if (isAnnouncementUnread) {
                            const newRead = [...readAnnouncements, announcementKey];
                            updateReadAnnouncements(newRead);
                            queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
                          }
                        } else if (!notif.isRead) {
                          markReadMutation.mutate(notif.id);
                        }
                        
                        setSelectedNotification(notif);
                        setIsOpen(false);
                      }}
                    >
                      <div className="mt-1 shrink-0">
                        {isAnnouncement ? (
                          <Megaphone className="h-5 w-5 text-blue-500" />
                        ) : notif.type === 'SUCCESS' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Info className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-none">
                            {isAnnouncement && <Badge variant="secondary" className="mr-2 text-[10px] uppercase">Announcement</Badge>}
                            {notif.title}
                          </p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notif.message}
                        </p>
                      </div>

                      {!isAnnouncement && (
                        <div className="absolute right-2 top-2 hidden flex-col gap-1 sm:group-hover:flex">
                          {!notif.isRead && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={(e) => {
                                e.stopPropagation();
                                markReadMutation.mutate(notif.id);
                              }}
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(notif.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setSelectedNotification(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-card border shadow-2xl p-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedNotification(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-4">
              <div className="mt-1 shrink-0">
                {selectedNotification.userId === null ? (
                  <Megaphone className="h-6 w-6 text-blue-500" />
                ) : selectedNotification.type === 'SUCCESS' ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Info className="h-6 w-6 text-blue-500" />
                )}
              </div>
              
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-lg font-semibold leading-tight pr-6">
                    {selectedNotification.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedNotification.userId === null && (
                      <Badge variant="secondary" className="text-[10px] uppercase">Announcement</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(selectedNotification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-foreground/90 whitespace-pre-wrap rounded-md bg-muted/30 p-3">
                  {selectedNotification.message}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedNotification(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
