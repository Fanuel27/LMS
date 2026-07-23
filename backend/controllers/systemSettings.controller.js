const prisma = require('../config/db');
const { sendSuccess } = require('../utils/response');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');

const DEFAULT_SETTINGS = {
  platformName: 'National Exam Prep',
  platformDescription: 'A comprehensive platform for national examination preparation.',
  academicYear: '2023/2024',
  contactEmail: 'admin@nationalexamprep.com',
  defaultMockDuration: '120',
  defaultPassingScore: '50',
  maxPracticeQuestions: '50',
  allowMultipleMockAttempts: 'false',
  enableAnnouncements: 'true',
  enableEmailNotifications: 'false',
  notificationPollingInterval: '60000',
  minPasswordLength: '8',
  sessionTimeout: '24',
  maxLoginAttempts: '5'
};

const getDirSize = async (dirPath) => {
  const readdir = promisify(fs.readdir);
  const stat = promisify(fs.stat);
  let size = 0;
  
  try {
    const files = await readdir(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const fileStat = await stat(filePath);
      if (fileStat.isFile()) {
        size += fileStat.size;
      } else if (fileStat.isDirectory()) {
        size += await getDirSize(filePath);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error calculating directory size:', error);
    }
  }
  return size;
};

const countFilesInDir = async (dirPath) => {
  const readdir = promisify(fs.readdir);
  const stat = promisify(fs.stat);
  let count = 0;

  try {
    const files = await readdir(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const fileStat = await stat(filePath);
      if (fileStat.isFile()) {
        count += 1;
      } else if (fileStat.isDirectory()) {
        count += await countFilesInDir(filePath);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error counting directory files:', error);
    }
  }
  return count;
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    
    // Auto-initialize if empty
    if (settings.length === 0) {
      const dataToInsert = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      
      await prisma.systemSetting.createMany({
        data: dataToInsert,
        skipDuplicates: true
      });
      
      const newSettings = await prisma.systemSetting.findMany();
      return sendSuccess(res, formatSettings(newSettings));
    }

    // Ensure any missing keys are initialized
    const existingKeys = settings.map(s => s.key);
    const missingKeys = Object.keys(DEFAULT_SETTINGS).filter(k => !existingKeys.includes(k));
    
    if (missingKeys.length > 0) {
      const dataToInsert = missingKeys.map(key => ({
        key,
        value: String(DEFAULT_SETTINGS[key])
      }));
      await prisma.systemSetting.createMany({
        data: dataToInsert,
        skipDuplicates: true
      });
      const updatedSettings = await prisma.systemSetting.findMany();
      return sendSuccess(res, formatSettings(updatedSettings));
    }
    
    return sendSuccess(res, formatSettings(settings));
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid updates payload' });
    }

    const updatePromises = Object.entries(updates).map(([key, value]) => {
      // Validate that key exists in DEFAULT_SETTINGS to prevent arbitrary key creation
      if (DEFAULT_SETTINGS[key] !== undefined) {
        return prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        });
      }
      return Promise.resolve(null);
    });

    await Promise.all(updatePromises);
    
    const settings = await prisma.systemSetting.findMany();
    return sendSuccess(res, formatSettings(settings), 'Settings updated successfully');
  } catch (err) {
    next(err);
  }
};

exports.resetSettings = async (req, res, next) => {
  try {
    const updatePromises = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });

    await Promise.all(updatePromises);

    const settings = await prisma.systemSetting.findMany();
    return sendSuccess(res, formatSettings(settings), 'Settings reset to default successfully');
  } catch (err) {
    next(err);
  }
};

exports.getSystemInfo = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalSubjects,
      totalQuestions,
      totalNotes,
      totalMockExams,
      totalPracticeAttempts,
      totalMockAttempts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.subject.count(),
      prisma.question.count(),
      prisma.note.count(),
      prisma.mockExam.count(),
      prisma.practiceAttempt.count(),
      prisma.attempt.count()
    ]);

    const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads');
    const totalStorageUsed = await getDirSize(uploadDir);
    const totalUploadedFiles = await countFilesInDir(uploadDir);

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const uptimeSeconds = process.uptime();
    const formatUptime = (seconds) => {
      const d = Math.floor(seconds / (3600*24));
      const h = Math.floor(seconds % (3600*24) / 3600);
      const m = Math.floor(seconds % 3600 / 60);
      return `${d}d ${h}h ${m}m`;
    };

    const systemInfo = {
      appVersion: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      prismaVersion: require('prisma/package.json').version || 'Unknown',
      databaseProvider: 'PostgreSQL',
      environment: process.env.NODE_ENV || 'development',
      serverUptime: formatUptime(uptimeSeconds),
      totalUsers,
      totalTeachers,
      totalStudents,
      totalSubjects,
      totalQuestions,
      totalNotes,
      totalMockExams,
      totalPracticeAttempts,
      totalMockAttempts,
      totalUploadedFiles,
      totalStorageUsed: formatBytes(totalStorageUsed),
      uploadDirectory: process.env.UPLOAD_PATH || 'uploads'
    };

    return sendSuccess(res, systemInfo);
  } catch (err) {
    next(err);
  }
};

// Helper function to format settings based on their expected types
function formatSettings(settingsArray) {
  const settingsObj = {};
  
  settingsArray.forEach(setting => {
    let parsedValue = setting.value;
    
    // Type conversion
    if (parsedValue === 'true') parsedValue = true;
    else if (parsedValue === 'false') parsedValue = false;
    else if (!isNaN(parsedValue) && parsedValue.trim() !== '') {
      parsedValue = Number(parsedValue);
    }
    
    settingsObj[setting.key] = parsedValue;
  });
  
  return settingsObj;
}
