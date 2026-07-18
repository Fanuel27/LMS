const { z } = require('zod');

const questionSchema = z.object({
  subjectId: z.string().uuid({ message: 'Invalid subject selection.' }),
  question: z.string().min(5, { message: 'Question must be at least 5 characters long.' }),
  optionA: z.string().min(1, { message: 'Option A is required.' }),
  optionB: z.string().min(1, { message: 'Option B is required.' }),
  optionC: z.string().min(1, { message: 'Option C is required.' }),
  optionD: z.string().min(1, { message: 'Option D is required.' }),
  correctAnswer: z.enum(['A', 'B', 'C', 'D'], { message: 'Correct answer must be A, B, C, or D.' }),
  explanation: z.string().optional(),
});

module.exports = {
  createQuestionSchema: questionSchema,
  updateQuestionSchema: questionSchema.partial().extend({
    subjectId: questionSchema.shape.subjectId,
    question: questionSchema.shape.question,
    optionA: questionSchema.shape.optionA,
    optionB: questionSchema.shape.optionB,
    optionC: questionSchema.shape.optionC,
    optionD: questionSchema.shape.optionD,
    correctAnswer: questionSchema.shape.correctAnswer,
  }), // For update, we want to enforce all main fields but we allow typical PUT behavior, actually let's just use questionSchema for PUT as well.
};
