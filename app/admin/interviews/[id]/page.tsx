"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { Canvas } from "@/components/canvas";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { ReadOnlyChat } from "@/components/admin/read-only-chat";
import type { Json } from "@/lib/database.types";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
}

interface Interview {
  id: string;
  title: string;
  status: string;
  state: string;
  created_at: string;
  concluded_at: string | null;
  problem_id: string;
  user_id: string;
  conversation: Json;
  board_state: Json;
  evaluation: Json | null;
}

export default function AdminInterviewViewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/interviews/${interviewId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Interview not found");
          }
          throw new Error("Failed to fetch interview");
        }
        const data = await res.json();
        setInterview(data.interview);
        setProblem(data.problem);
        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [interviewId]);

  function getInitials(user: User): string {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() ?? "?";
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
            <Clock className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function getDifficultyBadge(difficulty: string) {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return (
          <Badge className="bg-green-500/20 text-green-400">Easy</Badge>
        );
      case "medium":
        return (
          <Badge className="bg-amber-500/20 text-amber-400">Medium</Badge>
        );
      case "hard":
        return <Badge className="bg-red-500/20 text-red-400">Hard</Badge>;
      default:
        return <Badge variant="secondary">{difficulty}</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load interview</p>
          <p className="text-muted-foreground text-sm mt-1">
            {error || "Interview not found"}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const boardElements = (interview.board_state as OrderedExcalidrawElement[]) || [];
  const messages = (interview.conversation as { id: string; role: string; parts: { type: string; text?: string }[] }[]) || [];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={user ? `/admin/users/${user.id}/interviews` : "/admin/users"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            {user && (
              <>
                <Avatar className="h-8 w-8">
                  {user.image && <AvatarImage src={user.image} />}
                  <AvatarFallback className="text-xs">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name || user.email}</span>
                  {user.name && (
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {problem && (
            <>
              <span className="text-sm font-medium">{problem.title}</span>
              {getDifficultyBadge(problem.difficulty)}
            </>
          )}
          {getStatusBadge(interview.status)}
          <Badge variant="outline" className="font-mono text-xs">
            {interview.state}
          </Badge>
        </div>
      </div>

      {/* Meta info bar */}
      <div className="border-b px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 shrink-0">
        <span>Started: {formatDate(interview.created_at)}</span>
        {interview.concluded_at && (
          <>
            <span className="text-border">•</span>
            <span>Concluded: {formatDate(interview.concluded_at)}</span>
          </>
        )}
        <span className="text-border">•</span>
        <span>Messages: {messages.length}</span>
      </div>

      {/* Main content - Chat and Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className="w-[450px] border-r flex flex-col bg-background">
          <div className="border-b px-4 py-2 bg-muted/30">
            <h3 className="text-sm font-medium">Conversation</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <ReadOnlyChat messages={messages} evaluation={interview.evaluation} />
          </div>
        </div>

        {/* Canvas panel */}
        <div className="flex-1 flex flex-col">
          <div className="border-b px-4 py-2 bg-muted/30">
            <h3 className="text-sm font-medium">Whiteboard</h3>
          </div>
          <div className="flex-1 p-2">
            <Canvas
              excalidrawRef={excalidrawRef}
              onChange={() => {}}
              elements={boardElements}
              readonly={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

