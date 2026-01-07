import { z } from "zod";

export const evaluationCriterionSchema = z.object({
  dimension: z.string().min(1, "Dimension is required"),
  description: z.string().min(1, "Description is required"),
  weight: z.number().min(0).max(1),
});

export const requirementsSchema = z.object({
  functional: z.array(z.string()),
  non_functional: z.array(z.string()),
  out_of_scope: z.array(z.string()),
});

export const problemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  industries: z.array(z.string()).optional().default([]),
  is_active: z.boolean().optional().default(true),
  requirements: requirementsSchema,
  evaluation_criteria: z
    .array(evaluationCriterionSchema)
    .min(1, "At least one evaluation criterion is required"),
});

// Partial schema for updates (all fields optional)
export const updateProblemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  industries: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  requirements: requirementsSchema.optional(),
  evaluation_criteria: z.array(evaluationCriterionSchema).min(1).optional(),
});

export type ProblemInput = z.infer<typeof problemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
export type EvaluationCriterion = z.infer<typeof evaluationCriterionSchema>;
export type Requirements = z.infer<typeof requirementsSchema>;
