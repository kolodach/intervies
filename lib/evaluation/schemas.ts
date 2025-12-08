import { z } from "zod";

// ============================================
// Single Evaluation Schema
// Used by both evaluators and final synthesizer
// ============================================

const CategoryWithProsConsSchema = z.object({
  score: z.number().min(0),
  max: z.number().min(0),
  percentage: z.number().min(0).max(100),
  pros: z.array(z.string()).max(5).describe("Strengths in this category"),
  cons: z.array(z.string()).max(5).describe("Weaknesses in this category"),
});

export const EvaluationSchema = z.object({
  overall_score: z.number().min(0).max(100),
  summary: z
    .string()
    .min(100)
    .describe("Brief overview paragraph of interview performance"),
  categories: z.object({
    technical: CategoryWithProsConsSchema.describe(
      "Aggregates design_quality, scalability_thinking, trade_off_analysis, depth"
    ),
    communication: CategoryWithProsConsSchema.describe(
      "Aggregates clarity, structure, collaboration, thought_process"
    ),
  }),
});

export type Evaluation = z.infer<typeof EvaluationSchema>;

// For backwards compatibility, export the same schema as different names
export const InterviewEvaluationSchema = EvaluationSchema;
export type InterviewEvaluation = Evaluation;

export const FinalEvaluationSchema = EvaluationSchema;
export type FinalEvaluation = Evaluation;
