const { z } = require('zod');

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title is too long'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message is too long'),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ERROR']).optional().default('INFO'),
});

module.exports = {
  announcementSchema,
};
