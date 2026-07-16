const { z } = require('zod');

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please enter a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password cannot be empty.'),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT'], {
    required_error: 'Role is required.',
    invalid_type_error: 'Role must be ADMIN, TEACHER, or STUDENT.',
  }),
});

module.exports = { loginSchema };
