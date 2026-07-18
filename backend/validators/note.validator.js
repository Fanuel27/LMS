const { z } = require('zod');

// Note: When using FormData, all values are parsed as strings on the backend.
const noteSchema = z.object({
  subjectId: z.string().uuid({ message: 'Invalid subject selection.' }),
  title: z.string().min(3, { message: 'Title must be at least 3 characters long.' }),
  description: z.string().optional(),
});

module.exports = {
  createNoteSchema: noteSchema,
  updateNoteSchema: noteSchema.partial().extend({
    subjectId: noteSchema.shape.subjectId,
    title: noteSchema.shape.title,
  }),
};
