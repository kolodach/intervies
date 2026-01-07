"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  MessageSquare,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface Interview {
  id: string;
  title: string;
  status: string;
  state: string;
  created_at: string;
  concluded_at: string | null;
  problem_id: string;
  problem_title: string;
}

export default function UserInterviewsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/users/${userId}/interviews`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("User not found");
          }
          throw new Error("Failed to fetch interviews");
        }
        const data = await res.json();
        setUser(data.user);
        setInterviews(data.interviews || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading interviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load data</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/admin/users")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
      </Button>

      {/* Header */}
      {user && (
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg">{getInitials(user)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {user.name || "Unnamed User"}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Interviews
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter((i) => i.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter((i) => i.status === "active").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                This user hasn&apos;t taken any interviews yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Concluded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium">
                      {interview.problem_title}
                    </TableCell>
                    <TableCell>{getStatusBadge(interview.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {interview.state}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(interview.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {interview.concluded_at
                        ? formatDate(interview.concluded_at)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/interviews/${interview.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

