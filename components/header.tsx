import {
  CircleCheck,
  CircleDashed,
  HeartPlus,
  Hexagon,
  Mail,
  MessageSquarePlus,
  Plus,
  Slash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";

function formatBreadcrumb(segment: string) {
  if (!segment) return "";
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Breadcrumbs({ pathSegments }: { pathSegments: string[] }) {
  return (
    <nav className="flex items-center">
      {pathSegments.map((segment, idx) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <span key={idx} className="flex items-center">
          {idx > 0 && (
            <Slash
              className="mx-1 -rotate-12 opacity-30 inline-block"
              size={16}
            />
          )}
          <span>{formatBreadcrumb(segment)}</span>
        </span>
      ))}
    </nav>
  );
}

function HeaderTitle() {
  const pathname = usePathname();
  const client = useSupabaseBrowserClient();

  // Remove any query string/hash and split on /
  const segments = pathname
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean);

  // Remove "app" if first segment is "app"
  if (segments[0] === "app") segments.shift();

  const problemsIdx = segments.indexOf("problems");
  const isProblemRoute = problemsIdx === 0 && segments.length === 2; // /problems/{id}

  if (segments.length === 0) {
    // /app or /
    return <span className="ml-2 text-sm font-medium">Home</span>;
  }

  // If route is /problems/{id}
  if (isProblemRoute) {
    // The second segment is the solutions id
    const solutionId = segments[1];
    // Query for the solution by id
    const { data, isLoading } = useQuery({
      queryKey: ["solution-title", solutionId],
      queryFn: async () => {
        const { data, error } = await client
          .from("solutions")
          .select("title")
          .eq("id", solutionId)
          .single();
        if (error) throw error;
        return data;
      },
      enabled: !!solutionId && !!client,
      staleTime: 2 * 60 * 1000,
    });

    return (
      <span className="ml-2 text-sm font-medium overflow-ellipsis line-clamp-1">
        {isLoading ? "Loading..." : data?.title ?? "Problem"}
      </span>
    );
  }

  // Otherwise, show breadcrumbs
  return (
    <div className="ml-2 text-sm font-medium overflow-ellipsis line-clamp-1">
      <Breadcrumbs pathSegments={segments.map(formatBreadcrumb)} />
    </div>
  );
}

export function Header() {
  return (
    <header className="h-[48px] flex flex-row items-center px-4">
      <Hexagon className="min-w-8 min-h-8 hover:bg-muted p-1 rounded-md" />
      <Slash className="ml-2 -rotate-12 opacity-30" size={16} />
      <h1 className="ml-2 text-sm overflow-ellipsis line-clamp-1 font-medium">
        <HeaderTitle />
      </h1>
      <Button
        className="ml-auto h-8 mr-2 text-xs py-1"
        variant="outline"
        size="sm"
      >
        <HeartPlus className="w-2 h-2" />
        Contribute Problem
      </Button>
      <Button className="h-8 mr-2 text-xs py-1" variant="outline" size="sm">
        <Mail className="w-2 h-2" />
        Give Feedback
      </Button>
      <Button className="h-8 mr-2 text-xs py-1" variant="default">
        <Plus className="w-2 h-2" />
        New Problem
      </Button>
      <SignedOut>
        <SignInButton />
        <SignUpButton>
          <Button size={"sm"} className="ml-4">
            Sign Up
          </Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
