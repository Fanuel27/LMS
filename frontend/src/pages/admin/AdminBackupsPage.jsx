import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { backupService } from '@/services/backup.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Database, Download, Upload, AlertTriangle, FileJson, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog';

const BREADCRUMBS = [{ label: 'Dashboard', href: '/admin/dashboard' }];

export default function AdminBackupsPage() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('MERGE');
  const [isDryRun, setIsDryRun] = useState(true);
  const [report, setReport] = useState(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const fileInputRef = useRef(null);

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const createExportMutation = (exportFn, filename) => useMutation({
    mutationFn: exportFn,
    onSuccess: (data) => downloadFile(data, filename),
    onError: (err) => alert('Export failed: ' + (err.response?.data?.message || err.message))
  });

  const mUsers = createExportMutation(backupService.exportUsers, 'users.csv');
  const mStudents = createExportMutation(backupService.exportStudents, 'students.csv');
  const mQuestions = createExportMutation(backupService.exportQuestions, 'questions.csv');
  const mExams = createExportMutation(backupService.exportMockExams, 'mock_exams.csv');
  const mResults = createExportMutation(backupService.exportResults, 'results.csv');
  const mLogs = createExportMutation(backupService.exportAuditLogs, 'audit_logs.csv');
  const mSettings = createExportMutation(backupService.exportSettings, 'settings.csv');
  
  const mBackup = useMutation({
    mutationFn: backupService.createBackup,
    onSuccess: (data) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadFile(data, `backup_${timestamp}.json`);
    },
    onError: (err) => alert('Backup failed: ' + (err.response?.data?.message || err.message))
  });

  const mRestore = useMutation({
    mutationFn: () => backupService.restoreBackup(file, mode, isDryRun),
    onSuccess: (data) => {
      setReport(data.data || data); 
      // the backend returns { success: true, message: ..., data: report } via sendSuccess
    },
    onError: (err) => {
      if (err.response?.data?.report) {
        setReport(err.response.data.report);
      } else if (err.response?.data?.errors) {
        setReport({ errors: err.response.data.errors });
      } else {
        alert('Restore failed: ' + (err.response?.data?.message || err.message));
      }
    }
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRestoreSubmit = () => {
    if (!file) return;
    setReport(null);
    mRestore.mutate();
  };

  const resetRestore = () => {
    setFile(null);
    setReport(null);
    setIsDryRun(true);
    setMode('MERGE');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderExportCard = (title, desc, mutation, icon = Download) => {
    const Icon = icon;
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" /> {title}
          </CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Backup & Restore"
        description="Manage data exports, system snapshots, and database restoration."
        breadcrumbs={BREADCRUMBS}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backup Creation Section */}
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="bg-blue-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Database className="w-5 h-5 text-blue-600" />
              Create System Backup
            </CardTitle>
            <CardDescription>
              Generates a full JSON snapshot of all system data excluding passwords, authentication tokens, and files.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={() => mBackup.mutate()}
              disabled={mBackup.isPending}
            >
              <FileJson className="w-4 h-4 mr-2" />
              {mBackup.isPending ? 'Generating Backup...' : 'Generate & Download JSON Backup'}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="bg-amber-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Upload className="w-5 h-5 text-amber-600" />
              Restore System
            </CardTitle>
            <CardDescription>
              Upload a previously generated JSON backup file to restore system data safely.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button 
              variant="outline"
              className="w-full border-amber-300 text-amber-900 hover:bg-amber-50"
              onClick={() => setIsRestoreDialogOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Backup File
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">CSV Data Exports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderExportCard('Users', 'All administrators, teachers, and students.', mUsers)}
          {renderExportCard('Students', 'Only student accounts.', mStudents)}
          {renderExportCard('Questions', 'All questions with subject and teacher mapping.', mQuestions)}
          {renderExportCard('Mock Exams', 'Mock exams metadata and parameters.', mExams)}
          {renderExportCard('Results', 'Student mock exam attempt scores.', mResults)}
          {renderExportCard('Audit Logs', 'System activity and tracking history.', mLogs)}
          {renderExportCard('System Settings', 'Global platform configuration.', mSettings)}
        </div>
      </div>

      {/* Restore Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={(open) => {
        setIsRestoreDialogOpen(open);
        if (!open) resetRestore();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Restore System Data</DialogTitle>
            <DialogDescription>
              Please review the restore options carefully. A Dry-Run is recommended before applying changes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {!report ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Backup File (JSON)</label>
                  <input 
                    type="file" 
                    accept=".json"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Restore Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className={`border p-4 rounded-lg cursor-pointer transition-colors ${mode === 'MERGE' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}
                      onClick={() => setMode('MERGE')}
                    >
                      <h4 className="font-semibold text-sm mb-1">Merge Existing</h4>
                      <p className="text-xs text-muted-foreground">Updates existing records and adds new ones. Does not delete missing records.</p>
                    </div>
                    <div 
                      className={`border p-4 rounded-lg cursor-pointer transition-colors ${mode === 'REPLACE' ? 'border-destructive bg-destructive/5 ring-1 ring-destructive' : 'border-border hover:bg-muted/50'}`}
                      onClick={() => setMode('REPLACE')}
                    >
                      <h4 className="font-semibold text-sm mb-1 text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Replace Existing
                      </h4>
                      <p className="text-xs text-muted-foreground">Clears existing application data before restoring. <strong>Users are always preserved.</strong></p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <input 
                    type="checkbox" 
                    id="dryRun" 
                    checked={isDryRun} 
                    onChange={(e) => setIsDryRun(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="dryRun" className="text-sm font-medium cursor-pointer">
                    Perform Dry-Run (Validate only, do not write to database)
                  </label>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${mRestore.isError ? 'bg-red-50 border-red-200' : (isDryRun ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200')}`}>
                  <div className="flex items-start gap-3">
                    {mRestore.isError ? <XCircle className="w-5 h-5 text-red-600 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />}
                    <div>
                      <h4 className={`font-semibold ${mRestore.isError ? 'text-red-900' : (isDryRun ? 'text-blue-900' : 'text-green-900')}`}>
                        {mRestore.isError ? 'Restore Failed' : (isDryRun ? 'Dry-Run Successful' : 'Restore Completed Successfully')}
                      </h4>
                      {mRestore.isError && mRestore.error && (
                         <p className="text-sm text-red-700 mt-1">{mRestore.error.response?.data?.message || mRestore.error.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-background border p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">{report.recordsRestored || 0}</p>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Restored</p>
                  </div>
                  <div className="bg-background border p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">{report.recordsUpdated || 0}</p>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Updated</p>
                  </div>
                  <div className="bg-background border p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-muted-foreground">{report.recordsSkipped || 0}</p>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Skipped</p>
                  </div>
                </div>

                {report.details && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.keys(report.details).map(entity => {
                      const counts = report.details[entity];
                      if (counts.restored === 0 && counts.updated === 0 && counts.skipped === 0) return null;
                      return (
                        <div key={entity} className="bg-muted/30 border p-3 rounded-md">
                          <h5 className="text-sm font-bold text-foreground capitalize mb-2">{entity.replace(/([A-Z])/g, ' $1').trim()}</h5>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            {counts.restored > 0 && <li>• Restored: {counts.restored}</li>}
                            {counts.updated > 0 && <li>• Updated: {counts.updated}</li>}
                            {counts.skipped > 0 && <li>• Skipped: {counts.skipped}</li>}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}

                {report.skippedReasons?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                    <h5 className="text-xs font-bold text-amber-900 uppercase mb-2">Skipped Items Details</h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {report.skippedReasons.map((r, i) => (
                        <div key={i} className="text-xs text-amber-800 border-b border-amber-200/50 pb-2 last:border-0 last:pb-0">
                          <p className="font-semibold capitalize">Skipped {r.entity}: <span className="font-normal opacity-80 ml-1">{r.identifier}</span></p>
                          <p className="opacity-90 mt-0.5">Reason: {r.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.errors?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                    <h5 className="text-xs font-bold text-red-900 uppercase mb-1">Errors</h5>
                    <ul className="list-disc pl-4 text-xs text-red-800 space-y-1">
                      {report.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}

                {report.validationWarnings?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                    <h5 className="text-xs font-bold text-amber-900 uppercase mb-1">Warnings</h5>
                    <ul className="list-disc pl-4 text-xs text-amber-800 space-y-1">
                      {report.validationWarnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            {!report ? (
              <>
                <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleRestoreSubmit} 
                  disabled={!file || mRestore.isPending}
                  variant={isDryRun ? 'secondary' : (mode === 'REPLACE' ? 'destructive' : 'default')}
                >
                  {mRestore.isPending ? 'Processing...' : (isDryRun ? 'Run Dry-Run' : `Restore (${mode})`)}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsRestoreDialogOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
