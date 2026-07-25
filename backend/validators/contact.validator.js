const { z } = require('zod');

const submitContactSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(150, 'Subject is too long'),
  message: z.string().min(5, 'Message must be at least 5 characters').max(2000, 'Message is too long'),
});

module.exports = {
  submitContactSchema,
};
