"use client";

import { Button } from "@/components/ui/button";
import { useAuthenticatedQuery } from "@/lib/hooks/query-hooks";
import { fetchAllQuestionsQuery } from "@/lib/queries/questions";
import { capitalize } from "@/lib/utils";
import { captureException } from "@sentry/nextjs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import type { Question } from "@/lib/types";
import {
  createInterview,
  findInterviewByQuestionId,
} from "@/lib/queries/interviews";
import { useUser } from "@clerk/nextjs";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const { data: questionsData, error } = useAuthenticatedQuery(
    fetchAllQuestionsQuery
  );
  const supabase = useSupabaseBrowserClient();
  useEffect(() => {
    if (!search) {
      setQuestions(questionsData ?? []);
      return;
    }
    if (questionsData) {
      setQuestions(
        questionsData.filter(
          (question) =>
            question.title.toLowerCase().includes(search.toLowerCase()) ||
            question.categories.some((category) =>
              category.toLowerCase().includes(search.toLowerCase())
            ) ||
            question.tags.some((tag) =>
              tag.toLowerCase().includes(search.toLowerCase())
            ) ||
            question.difficulty.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [questionsData, search]);

  const handleStart = async (question: Question) => {
    if (!user) return;
    const { data: interview, error: interviewError } =
      await findInterviewByQuestionId(supabase, question.id, user.id);
    if (interviewError) {
      captureException(interviewError);
      toast.error("Error finding interview");
      return;
    }
    if (interview) {
      router.push(`/app/problems/${interview.id}`);
      return;
    }
    const { data: newInterview, error: newInterviewError } =
      await createInterview(supabase, {
        question_id: question.id,
        status: "in_progress",
        title: question.title,
        user_id: user.id,
      });
    if (newInterviewError) {
      captureException(newInterviewError);
      toast.error("Error creating interview");
      return;
    }
    router.push(`/app/problems/${newInterview.id}`);
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-4">
      {error && <div className="text-red-500">{error.message}</div>}
      <input
        type="text"
        placeholder="Search questions..."
        className="mb-4 p-2 border rounded-md w-full max-w-[400px] focus:outline-none focus:ring-2 focus:ring-primary"
        // This is a dummy search bar, you may add state and handlers to enable search functionality.
        onChange={(e) => {
          setSearch(e.target.value);
        }}
      />
      <div className="w-full mb-4 max-w-[1200px] rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Difficulty</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>{""}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions?.map((question) => (
              <TableRow key={question.id}>
                {/* Difficulty */}
                <TableCell>
                  <span
                    className={
                      question.difficulty === "easy"
                        ? "text-green-600"
                        : question.difficulty === "medium"
                        ? "text-yellow-600"
                        : question.difficulty === "hard"
                        ? "text-red-600"
                        : undefined
                    }
                  >
                    {capitalize(question.difficulty)}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{question.title}</TableCell>
                <TableCell>
                  {question.categories.map((category) => (
                    <Badge key={category} variant={"outline"}>
                      {category}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant={"outline"}>
                      {tag}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      question.is_active ? "text-green-600" : "text-red-600"
                    }
                  >
                    {question.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => handleStart(question)}
                  >
                    Start
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
