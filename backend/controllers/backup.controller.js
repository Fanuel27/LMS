const backupService = require('../services/backup.service');
const { sendSuccess } = require('../utils/response');
const auditLogService = require('../services/auditLog.service');
const notificationService = require('../services/notification.service');

const downloadCsv = (res, filename, csvData) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csvData);
};

exports.exportUsers = async (req, res, next) => {
  try {
    const csv = await backupService.exportUsers();
    auditLogService.log({ userId: req.user.id, action: 'EXPORT_USERS_CSV', entityType: 'System', description: 'Exported Users CSV data.', req });
    downloadCsv(res, 'users_export.csv', csv);
  } catch (err) { next(err); }
};

exports.exportStudents = async (req, res, next) => {
  try {
    const csv = await backupService.exportStudents();
    auditLogService.log({ userId: req.user.id, action: 'EXPORT_STUDENTS_CSV', entityType: 'System', description: 'Exported Students CSV data.', req });
    downloadCsv(res, 'students_export.csv', csv);
  } catch (err) { next(err); }
};

exports.exportQuestions = async (req, res, next) => {
  try {
    const csv = await backupService.exportQuestions();
    auditLogService.log({ userId: req.user.id, action: 'EXPORT_QUESTIONS_CSV', entityType: 'System', description: 'Exported Questions CSV data.', req });
    downloadCsv(res, 'questions_export.csv', csv);
  } catch (err) { next(err); }
};

exports.exportMockExams = async (req, res, next) => {
  try {
    const csv = await backupService.exportMockExams();
    auditLogService.log({ userId: req.user.id, action: 'EXPORT_MOCK_EXAMS_CSV', entityType: 'System', description: 'Exported Mock Exams CSV data.', req });
    downloadCsv(res, 'mock_exams_export.csv', csv);
  } catch (err) { next(err); }
};

exports.exportResults = async (req, res, next) => {
  try {
    const csv = await backupService.exportResults();
    auditLogService.log({ userId: req.user.id, action: 'EXPORT_RESULTS_CSV', entityType: 'System', description: 'Exported Results CSV data.', req });
    downloadCsv(res, 'results_export.csv', csv);
  } catch (err) { next(err); }
};

exports.exportAuditLogs = async (req, res, next) => {
  try {
    const csv = await backupService.exportAuditLogs();
    auditLogService.log({ userId: req.user.id, action: 'EXPORT_AUDIT_LOGS_CSV', entityType: 'System', description: 'Exported Audit Logs CSV data.', req });
    downloadCsv(res, 'audit_logs_export.csv', csv);
  } catch (err) { next(err); }
};

exports.exportSettings = async (req, res, next) => {
  try {
    const csv = await backupService.exportSettings();
    auditLogService.log({ userId: req.user.id, action: 'EXPORT_SETTINGS_CSV', entityType: 'System', description: 'Exported System Settings CSV data.', req });
    downloadCsv(res, 'system_settings_export.csv', csv);
  } catch (err) { next(err); }
};

exports.createBackup = async (req, res, next) => {
  try {
    const backup = await backupService.createBackup();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    auditLogService.log({
      userId: req.user.id,
      action: 'CREATE_BACKUP',
      entityType: 'System',
      description: 'Generated full JSON system backup.',
      req
    });
    
    notificationService.notifyRole('ADMIN', 'System Backup Created Successfully', 'A full JSON system backup was generated.', 'INFO');
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup_${timestamp}.json"`);
    res.status(200).json(backup);
  } catch (err) { next(err); }
};

exports.restoreBackup = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No backup file uploaded.' });
    }

    const mode = req.body.mode || 'MERGE';
    const isDryRun = req.body.isDryRun === 'true';

    let backupData;
    try {
      backupData = JSON.parse(req.file.buffer.toString('utf-8'));
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid JSON file.' });
    }

    const result = await backupService.restoreBackup(backupData, mode, isDryRun);

    const actionType = isDryRun ? 'RESTORE_DRY_RUN' : (mode === 'REPLACE' ? 'RESTORE_REPLACE' : 'RESTORE_MERGE');
    
    auditLogService.log({
      userId: req.user.id,
      action: actionType,
      entityType: 'System',
      description: `Performed system restore (${actionType}).`,
      metadata: {
        mode,
        dryRun: isDryRun,
        restored: result.report?.recordsRestored,
        updated: result.report?.recordsUpdated,
        skipped: result.report?.recordsSkipped
      },
      req
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Restore validation failed or encountered errors.',
        errors: result.errors,
        report: result.report
      });
    }

    if (!isDryRun) {
      notificationService.notifyRole('ADMIN', 'Database Restore Completed Successfully', `System data restored via ${mode} mode.`, 'INFO');
    }

    return sendSuccess(res, result.report, `Restore ${isDryRun ? 'dry-run ' : ''}completed successfully.`);
  } catch (err) {
    next(err);
  }
};
