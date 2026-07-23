import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemSettingsService } from '@/services/systemSettings.service';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import PageHeader from '@/components/admin/PageHeader';
import ErrorBanner from '@/components/admin/ErrorBanner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { Toaster } from '@/components/ui/Toaster';
import { Settings, Shield, Bell, BookOpen, LayoutDashboard, Database, HardDrive, Cpu, RefreshCw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSystemSettingsPage() {
  const { toasts, toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirm();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});

  const { data: settingsRes, isLoading: loadingSettings, isError: errSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => systemSettingsService.getSettings().then(res => res.data.data),
    staleTime: 0,
  });

  const { data: infoRes, isLoading: loadingInfo, isError: errInfo } = useQuery({
    queryKey: ['system-info'],
    queryFn: () => systemSettingsService.getSystemInfo().then(res => res.data.data),
    staleTime: 60000,
  });

  useEffect(() => {
    if (settingsRes) {
      setFormData(settingsRes);
    }
  }, [settingsRes]);

  const updateMutation = useMutation({
    mutationFn: (data) => systemSettingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({ title: 'Settings saved', description: 'Your configuration changes have been applied successfully.' });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to save settings.',
        variant: 'destructive',
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => systemSettingsService.resetSettings(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setFormData(res.data.data);
      toast({ title: 'Settings reset', description: 'All settings have been restored to default values.' });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to reset settings.',
        variant: 'destructive',
      });
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Reset all settings?',
      description: 'Are you sure you want to restore all system settings to their factory defaults? This action cannot be undone.',
      confirmLabel: 'Yes, Reset',
      variant: 'destructive',
    });
    if (confirmed) {
      resetMutation.mutate();
    }
  };

  if (loadingSettings || loadingInfo) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (errSettings || errInfo) {
    return <ErrorBanner message="Failed to load system configuration." onRetry={refetchSettings} />;
  }

  const info = infoRes;

  const tabs = [
    { id: 'general', label: 'General', icon: LayoutDashboard },
    { id: 'examination', label: 'Examination', icon: BookOpen },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System Info', icon: Settings },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader
        title="System Settings"
        description="Configure platform preferences, academic settings, and security policies."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={updateMutation.isPending || resetMutation.isPending}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Defaults
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending || resetMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <Card className="w-full md:w-64 h-fit shrink-0">
          <CardContent className="p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-70")} />
                  {tab.label}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic platform information and contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input id="platformName" name="platformName" value={formData.platformName || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="platformDescription">Platform Description</Label>
                  <textarea
                    id="platformDescription"
                    name="platformDescription"
                    rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.platformDescription || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input id="academicYear" name="academicYear" value={formData.academicYear || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Support/Contact Email</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail || ''} onChange={handleChange} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'examination' && (
            <Card>
              <CardHeader>
                <CardTitle>Examination Defaults</CardTitle>
                <CardDescription>Default constraints for practice sessions and mock exams.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="defaultMockDuration">Default Mock Exam Duration (minutes)</Label>
                  <Input id="defaultMockDuration" name="defaultMockDuration" type="number" min="1" value={formData.defaultMockDuration || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="defaultPassingScore">Default Passing Score (%)</Label>
                  <Input id="defaultPassingScore" name="defaultPassingScore" type="number" min="1" max="100" value={formData.defaultPassingScore || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxPracticeQuestions">Maximum Practice Questions per Session</Label>
                  <Input id="maxPracticeQuestions" name="maxPracticeQuestions" type="number" min="1" value={formData.maxPracticeQuestions || ''} onChange={handleChange} />
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-md mt-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Allow Multiple Mock Attempts</Label>
                    <p className="text-xs text-muted-foreground">If disabled, students can only attempt each mock exam once.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="allowMultipleMockAttempts" className="sr-only peer" checked={formData.allowMultipleMockAttempts || false} onChange={handleChange} />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how the system communicates with users.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-border rounded-md">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Enable System Announcements</Label>
                    <p className="text-xs text-muted-foreground">Broadcast messages to all users globally.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="enableAnnouncements" className="sr-only peer" checked={formData.enableAnnouncements || false} onChange={handleChange} />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-md">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Enable Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send essential notifications via email (requires SMTP setup).</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="enableEmailNotifications" className="sr-only peer" checked={formData.enableEmailNotifications || false} onChange={handleChange} />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="space-y-1.5 mt-2">
                  <Label htmlFor="notificationPollingInterval">Notification Polling Interval (ms)</Label>
                  <Input id="notificationPollingInterval" name="notificationPollingInterval" type="number" min="1000" value={formData.notificationPollingInterval || ''} onChange={handleChange} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Configuration</CardTitle>
                <CardDescription>Authentication and session boundaries.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                  <Input id="minPasswordLength" name="minPasswordLength" type="number" min="4" max="32" value={formData.minPasswordLength || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input id="sessionTimeout" name="sessionTimeout" type="number" min="1" max="720" value={formData.sessionTimeout || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
                  <Input id="maxLoginAttempts" name="maxLoginAttempts" type="number" min="1" max="10" value={formData.maxLoginAttempts || ''} onChange={handleChange} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-primary" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">App Version</span>
                      <span className="text-sm font-medium">{info.appVersion}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Node Version</span>
                      <span className="text-sm font-medium">{info.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Prisma Version</span>
                      <span className="text-sm font-medium">{info.prismaVersion}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Database</span>
                      <span className="text-sm font-medium">{info.databaseProvider}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Environment</span>
                      <span className="text-sm font-medium capitalize">{info.environment}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Server Uptime</span>
                      <span className="text-sm font-medium">{info.serverUptime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Platform Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Total Users</span>
                      <span className="text-sm font-medium">{info.totalUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Students</span>
                      <span className="text-sm font-medium">{info.totalStudents.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Teachers</span>
                      <span className="text-sm font-medium">{info.totalTeachers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Subjects</span>
                      <span className="text-sm font-medium">{info.totalSubjects.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Total Questions</span>
                      <span className="text-sm font-medium">{info.totalQuestions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Total Notes</span>
                      <span className="text-sm font-medium">{info.totalNotes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Total Mock Exams</span>
                      <span className="text-sm font-medium">{info.totalMockExams.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Practice Attempts</span>
                      <span className="text-sm font-medium">{info.totalPracticeAttempts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Mock Attempts</span>
                      <span className="text-sm font-medium">{info.totalMockAttempts.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-primary" />
                    Storage Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Uploads Directory</span>
                      <span className="text-sm font-medium truncate ml-4">{info.uploadDirectory}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Total Files</span>
                      <span className="text-sm font-medium">{info.totalUploadedFiles.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2 md:col-span-2">
                      <span className="text-sm text-muted-foreground">Total Storage Used</span>
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{info.totalStorageUsed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmDialog />
      <Toaster toasts={toasts} />
    </div>
  );
}
