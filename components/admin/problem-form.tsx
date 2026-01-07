"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Loader2, AlertCircle, Check } from "lucide-react";
import { Tables } from "@/lib/database.types";
import {
  problemSchema,
  type EvaluationCriterion,
  type Requirements,
} from "@/lib/schemas/problem";

type Problem = Tables<"problems">;

interface ProblemFormProps {
  initialData?: Problem;
  onSubmit: (data: Partial<Problem>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProblemForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProblemFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    (initialData?.difficulty as "easy" | "medium" | "hard") ?? "medium"
  );
  const [industries, setIndustries] = useState<string[]>(
    initialData?.industries ?? []
  );
  const [industryInput, setIndustryInput] = useState("");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  // Requirements
  const [requirements, setRequirements] = useState<Requirements>(
    (initialData?.requirements as unknown as Requirements) ?? {
      functional: [],
      non_functional: [],
      out_of_scope: [],
    }
  );
  const [reqInputs, setReqInputs] = useState({
    functional: "",
    non_functional: "",
    out_of_scope: "",
  });

  // Evaluation Criteria
  const [evaluationCriteria, setEvaluationCriteria] = useState<
    EvaluationCriterion[]
  >(
    (initialData?.evaluation_criteria as unknown as EvaluationCriterion[]) ?? []
  );
  const [criterionInput, setCriterionInput] = useState({
    dimension: "",
    description: "",
    weight: 0.25,
  });

  // JSON editor state
  const [activeTab, setActiveTab] = useState("form");
  const [jsonValue, setJsonValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Build current form data object
  const currentFormData = useMemo(
    () => ({
      title,
      description,
      difficulty,
      industries,
      is_active: isActive,
      requirements,
      evaluation_criteria: evaluationCriteria,
    }),
    [
      title,
      description,
      difficulty,
      industries,
      isActive,
      requirements,
      evaluationCriteria,
    ]
  );

  // Sync JSON value when switching to JSON tab
  useEffect(() => {
    if (activeTab === "json") {
      setJsonValue(JSON.stringify(currentFormData, null, 2));
      setJsonError(null);
    }
  }, [activeTab, currentFormData]);

  // Validate and apply JSON changes
  const validateAndApplyJson = (value: string): boolean => {
    try {
      const parsed = JSON.parse(value);
      const result = problemSchema.safeParse(parsed);

      if (!result.success) {
        const errors = result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("\n");
        setJsonError(errors);
        return false;
      }

      // Apply validated data to form state
      setTitle(result.data.title);
      setDescription(result.data.description);
      setDifficulty(result.data.difficulty);
      setIndustries(result.data.industries ?? []);
      setIsActive(result.data.is_active ?? true);
      setRequirements(result.data.requirements);
      setEvaluationCriteria(result.data.evaluation_criteria);
      setJsonError(null);
      return true;
    } catch {
      setJsonError("Invalid JSON syntax");
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    // Live validation feedback
    try {
      const parsed = JSON.parse(value);
      const result = problemSchema.safeParse(parsed);
      if (!result.success) {
        const errors = result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("\n");
        setJsonError(errors);
      } else {
        setJsonError(null);
      }
    } catch {
      setJsonError("Invalid JSON syntax");
    }
  };

  const handleApplyJson = () => {
    if (validateAndApplyJson(jsonValue)) {
      setActiveTab("form");
    }
  };

  const addToArray = (
    arr: string[],
    setter: (arr: string[]) => void,
    value: string
  ) => {
    if (value.trim()) {
      setter([...arr, value.trim()]);
    }
  };

  const removeFromArray = (
    arr: string[],
    setter: (arr: string[]) => void,
    index: number
  ) => {
    setter(arr.filter((_, i) => i !== index));
  };

  const addRequirement = (type: keyof Requirements) => {
    const value = reqInputs[type];
    if (value.trim()) {
      setRequirements({
        ...requirements,
        [type]: [...requirements[type], value.trim()],
      });
      setReqInputs({ ...reqInputs, [type]: "" });
    }
  };

  const removeRequirement = (type: keyof Requirements, index: number) => {
    setRequirements({
      ...requirements,
      [type]: requirements[type].filter((_, i) => i !== index),
    });
  };

  const addCriterion = () => {
    if (criterionInput.dimension.trim() && criterionInput.description.trim()) {
      setEvaluationCriteria([...evaluationCriteria, criterionInput]);
      setCriterionInput({ dimension: "", description: "", weight: 0.25 });
    }
  };

  const removeCriterion = (index: number) => {
    setEvaluationCriteria(evaluationCriteria.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If on JSON tab, parse and submit JSON directly (state updates are async)
    if (activeTab === "json") {
      try {
        const parsed = JSON.parse(jsonValue);
        const result = problemSchema.safeParse(parsed);

        if (!result.success) {
          const errors = result.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("\n");
          setJsonError(errors);
          return;
        }

        // Submit the parsed JSON data directly
        await onSubmit({
          title: result.data.title,
          description: result.data.description,
          difficulty: result.data.difficulty,
          industries: result.data.industries ?? [],
          is_active: result.data.is_active ?? true,
          requirements:
            result.data.requirements as unknown as Problem["requirements"],
          evaluation_criteria:
            result.data
              .evaluation_criteria as unknown as Problem["evaluation_criteria"],
        });
        return;
      } catch {
        setJsonError("Invalid JSON syntax");
        return;
      }
    }

    const data: Partial<Problem> = {
      title,
      description,
      difficulty,
      industries,
      is_active: isActive,
      requirements: requirements as unknown as Problem["requirements"],
      evaluation_criteria:
        evaluationCriteria as unknown as Problem["evaluation_criteria"],
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="form">Form Editor</TabsTrigger>
          <TabsTrigger value="json">JSON Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6 mt-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Design a URL Shortener"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the problem..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Difficulty
                  </label>
                  <Select
                    value={difficulty}
                    onValueChange={(v) =>
                      setDifficulty(v as "easy" | "medium" | "hard")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Status
                  </label>
                  <Select
                    value={isActive ? "active" : "inactive"}
                    onValueChange={(v) => setIsActive(v === "active")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Industries */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Industries
                </label>
                <p className="text-sm text-muted-foreground mb-2">
                  Industries where this question is commonly asked (e.g., FAANG,
                  Fintech, Startup)
                </p>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={industryInput}
                    onChange={(e) => setIndustryInput(e.target.value)}
                    placeholder="Add industry..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToArray(industries, setIndustries, industryInput);
                        setIndustryInput("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      addToArray(industries, setIndustries, industryInput);
                      setIndustryInput("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {industries.map((industry, idx) => (
                    <Badge key={idx} variant="secondary">
                      {industry}
                      <button
                        type="button"
                        onClick={() =>
                          removeFromArray(industries, setIndustries, idx)
                        }
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(
                ["functional", "non_functional", "out_of_scope"] as const
              ).map((type) => (
                <div key={type}>
                  <label className="text-sm font-medium mb-2 block capitalize">
                    {type.replace(/_/g, " ")}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={reqInputs[type]}
                      onChange={(e) =>
                        setReqInputs({ ...reqInputs, [type]: e.target.value })
                      }
                      placeholder={`Add ${type.replace(/_/g, " ")}...`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRequirement(type);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => addRequirement(type)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ul className="space-y-1">
                    {requirements[type].map((req, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm bg-muted p-2 rounded"
                      >
                        <span className="flex-1">{req}</span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(type, idx)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Evaluation Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-12 gap-2">
                <Input
                  className="col-span-4"
                  value={criterionInput.dimension}
                  onChange={(e) =>
                    setCriterionInput({
                      ...criterionInput,
                      dimension: e.target.value,
                    })
                  }
                  placeholder="Dimension"
                />
                <Input
                  className="col-span-5"
                  value={criterionInput.description}
                  onChange={(e) =>
                    setCriterionInput({
                      ...criterionInput,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description"
                />
                <Input
                  className="col-span-2"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={criterionInput.weight}
                  onChange={(e) =>
                    setCriterionInput({
                      ...criterionInput,
                      weight: parseFloat(e.target.value),
                    })
                  }
                  placeholder="Weight"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="col-span-1"
                  onClick={addCriterion}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ul className="space-y-2">
                {evaluationCriteria.map((criterion, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 p-3 bg-muted rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{criterion.dimension}</div>
                      <div className="text-sm text-muted-foreground">
                        {criterion.description}
                      </div>
                    </div>
                    <Badge variant="secondary">{criterion.weight}</Badge>
                    <button type="button" onClick={() => removeCriterion(idx)}>
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>JSON Editor</span>
                {jsonError === null && jsonValue && (
                  <span className="text-sm font-normal text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Valid
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Edit the problem data directly as JSON. Changes will be
                validated against the schema before saving.
              </p>
              <Textarea
                value={jsonValue}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="font-mono text-sm min-h-[500px]"
                placeholder="Loading..."
              />
              {jsonError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <pre className="whitespace-pre-wrap">{jsonError}</pre>
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={handleApplyJson}
                disabled={!!jsonError}
              >
                Apply & Switch to Form
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !!jsonError}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update" : "Create"} Problem
        </Button>
      </div>
    </form>
  );
}
