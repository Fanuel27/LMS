const { z } = require('zod');

exports.createMockExamSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  subjectId: z.string().uuid('Invalid subject ID.'),
  durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute.'),
  passingScore: z.number().min(0, 'Passing score must be at least 0.'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  questionIds: z.array(z.string().uuid('Invalid question ID.')).min(1, 'At least one question is required.'),
});

exports.updateMockExamSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.').optional(),
  subjectId: z.string().uuid('Invalid subject ID.').optional(),
  durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute.').optional(),
  passingScore: z.number().min(0, 'Passing score must be at least 0.').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  questionIds: z.array(z.string().uuid('Invalid question ID.')).min(1, 'At least one question is required.').optional(),
});
