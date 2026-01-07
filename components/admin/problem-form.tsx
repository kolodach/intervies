"use client";

import { useState } from "react";
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
import { X, Plus, Loader2 } from "lucide-react";
import { Tables } from "@/lib/database.types";

type Problem = Tables<"problems">;

interface EvaluationCriterion {
  dimension: string;
  description: string;
  weight: number;
}

interface Requirements {
  functional: string[];
  non_functional: string[];
  constraints: string[];
  out_of_scope: string[];
}

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
  const [categories, setCategories] = useState<string[]>(
    initialData?.categories ?? []
  );
  const [categoryInput, setCategoryInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [sampleRequirements, setSampleRequirements] = useState<string[]>(
    initialData?.sample_requirements ?? []
  );
  const [sampleReqInput, setSampleReqInput] = useState("");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  // Requirements
  const [requirements, setRequirements] = useState<Requirements>(
    (initialData?.requirements as unknown as Requirements) ?? {
      functional: [],
      non_functional: [],
      constraints: [],
      out_of_scope: [],
    }
  );
  const [reqInputs, setReqInputs] = useState({
    functional: "",
    non_functional: "",
    constraints: "",
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

    const data: Partial<Problem> = {
      title,
      description,
      difficulty,
      categories,
      tags,
      sample_requirements: sampleRequirements,
      is_active: isActive,
      requirements: requirements as any,
      evaluation_criteria: evaluationCriteria as any,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              <Select value={difficulty} onValueChange={setDifficulty as any}>
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
              <label className="text-sm font-medium mb-2 block">Status</label>
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

          {/* Categories */}
          <div>
            <label className="text-sm font-medium mb-2 block">Categories</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="Add category..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray(categories, setCategories, categoryInput);
                    setCategoryInput("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  addToArray(categories, setCategories, categoryInput);
                  setCategoryInput("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, idx) => (
                <Badge key={idx} variant="secondary">
                  {cat}
                  <button
                    type="button"
                    onClick={() => removeFromArray(categories, setCategories, idx)}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray(tags, setTags, tagInput);
                    setTagInput("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  addToArray(tags, setTags, tagInput);
                  setTagInput("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <Badge key={idx} variant="outline">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeFromArray(tags, setTags, idx)}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Sample Requirements */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Sample Requirements
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={sampleReqInput}
                onChange={(e) => setSampleReqInput(e.target.value)}
                placeholder="Add sample requirement..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray(
                      sampleRequirements,
                      setSampleRequirements,
                      sampleReqInput
                    );
                    setSampleReqInput("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  addToArray(
                    sampleRequirements,
                    setSampleRequirements,
                    sampleReqInput
                  );
                  setSampleReqInput("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-1">
              {sampleRequirements.map((req, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm bg-muted p-2 rounded"
                >
                  <span className="flex-1">{req}</span>
                  <button
                    type="button"
                    onClick={() =>
                      removeFromArray(
                        sampleRequirements,
                        setSampleRequirements,
                        idx
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(["functional", "non_functional", "constraints", "out_of_scope"] as const).map(
            (type) => (
              <div key={type}>
                <label className="text-sm font-medium mb-2 block capitalize">
                  {type.replace("_", " ")}
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={reqInputs[type]}
                    onChange={(e) =>
                      setReqInputs({ ...reqInputs, [type]: e.target.value })
                    }
                    placeholder={`Add ${type.replace("_", " ")}...`}
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
            )
          )}
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
                setCriterionInput({ ...criterionInput, dimension: e.target.value })
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

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update" : "Create"} Problem
        </Button>
      </div>
    </form>
  );
}

