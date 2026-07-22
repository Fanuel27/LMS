const prisma = require('../config/db');

exports.notifyUser = async (userId, title, message, type = 'INFO') => {
  try {
    return await prisma.notification.create({
      data: { userId, title, message, type }
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

exports.notifyRole = async (role, title, message, type = 'INFO') => {
  try {
    const users = await prisma.user.findMany({ where: { role, isActive: true }, select: { id: true } });
    if (users.length === 0) return;

    const data = users.map(user => ({
      userId: user.id,
      title,
      message,
      type
    }));

    return await prisma.notification.createMany({ data });
  } catch (err) {
    console.error('Error creating role notification:', err);
  }
};

exports.createAnnouncement = async (title, message, type = 'ANNOUNCEMENT') => {
  try {
    return await prisma.notification.create({
      data: { userId: null, title, message, type }
    });
  } catch (err) {
    console.error('Error creating announcement:', err);
  }
};
