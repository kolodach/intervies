import { z } from "zod";

// ============================================
// Comprehensive Interview Evaluation Schema
// (Run this twice for consistency)
// ============================================

const ScoreFeedbackSchema = z.object({
  score: z.number().min(0).max(10),
  feedback: z.string().min(50),
  specific_examples: z.array(z.string()).min(1).max(3),
});

const MissingConsiderationSchema = z.object({
  topic: z.string(),
  importance: z.enum(["critical", "important", "nice_to_have"]),
  why_matters: z.string(),
});

const RedFlagSchema = z.object({
  flag: z.enum([
    "defensive",
    "monologuing",
    "unclear",
    "disorganized",
    "over_engineered",
  ]),
  observed: z.boolean(),
  details: z.string(),
});

export const InterviewEvaluationSchema = z.object({
  // Technical Assessment
  design_quality: ScoreFeedbackSchema,
  scalability_thinking: ScoreFeedbackSchema.extend({
    capacity_planning_quality: z.string(),
  }),
  trade_off_analysis: ScoreFeedbackSchema.extend({
    trade_offs_discussed: z.array(z.string()).min(1),
  }),
  depth: ScoreFeedbackSchema.extend({
    deep_dive_topic: z.string(),
  }),

  // Communication Assessment
  clarity: ScoreFeedbackSchema.extend({
    examples_of_clear_explanations: z.array(z.string()).min(1).max(3),
  }),
  structure: ScoreFeedbackSchema.extend({
    followed_phases: z.boolean(),
  }),
  collaboration: ScoreFeedbackSchema.extend({
    asked_clarifying_questions_count: z.number().min(0),
  }),
  thought_process: ScoreFeedbackSchema.extend({
    verbalized_thinking: z.boolean(),
  }),

  // Issues
  missing_considerations: z.array(MissingConsiderationSchema).min(0).max(5),
  red_flags: z.array(RedFlagSchema).min(0).max(5),

  // Summary
  strengths: z.array(z.string()).min(2).max(5),
  areas_for_improvement: z.array(z.string()).min(2).max(5),
});

export type InterviewEvaluation = z.infer<typeof InterviewEvaluationSchema>;

// ============================================
// Final Evaluation Schema
// ============================================

const CategoryScoreSchema = z.object({
  score: z.number().min(0),
  max: z.number().min(0),
  percentage: z.number().min(0).max(100),
});

const StrengthSchema = z.object({
  strength: z.string(),
  evidence: z.string(),
});

const ImprovementAreaSchema = z.object({
  area: z.string(),
  why_important: z.string(),
  how_to_improve: z.string(),
});

const ResourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.enum(["article", "video", "book", "course"]),
});

const TopicToRevisitSchema = z.object({
  topic: z.string(),
  why: z.string(),
  resources: z.array(ResourceSchema).min(1).max(5),
});

const RecommendationsSchema = z.object({
  topics_to_revisit: z.array(TopicToRevisitSchema).min(2).max(4),
  practice_strategies: z.array(z.string()).min(3).max(7),
  next_problems_to_practice: z.array(z.string()).min(2).max(5),
});

export const FinalEvaluationSchema = z.object({
  overall_score: z.number().min(0).max(100),
  category_scores: z.object({
    requirements: CategoryScoreSchema,
    design: CategoryScoreSchema,
    deep_dive: CategoryScoreSchema,
    communication: CategoryScoreSchema,
  }),
  top_strengths: z.array(StrengthSchema).min(3).max(5),
  areas_for_improvement: z.array(ImprovementAreaSchema).min(3).max(5),
  recommendations: RecommendationsSchema,
  summary: z.string().min(200).max(1000),
  level_assessment: z.enum(["junior", "mid", "senior", "staff", "principal"]),
});

export type FinalEvaluation = z.infer<typeof FinalEvaluationSchema>;
