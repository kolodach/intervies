import {
  Circle,
  CircleCheck,
  CircleDashed,
  Crown,
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
  useUser,
} from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchSolutionById } from "@/lib/queries/solutions";
import { Logo } from "./logo";

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
  const { user } = useUser();
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

  // The second segment is the solutions id
  const solutionId = segments[1];
  // Query for the solution by id using supabase-cache-helpers
  const { data, isLoading } = useQuery(fetchSolutionById(client, solutionId), {
    enabled: !!solutionId && !!client && !!user,
    staleTime: 2 * 60 * 1000,
  });

  if (isProblemRoute) {
    const isCompleted = data?.status === "completed";

    return (
      <span className="text-sm font-medium overflow-ellipsis line-clamp-1 flex items-center gap-2">
        {isLoading ? (
          "Loading..."
        ) : (
          <>
            {isCompleted ? (
              <CircleCheck className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-orange-500" />
            )}
            {data?.title ?? "Problem"}
          </>
        )}
      </span>
    );
  }

  if (segments.length === 0) {
    // /app or /
    return <span className="text-sm font-medium">Home</span>;
  }

  // Otherwise, show breadcrumbs
  return (
    <div className="ml-2 text-sm font-medium overflow-ellipsis line-clamp-1">
      <Breadcrumbs pathSegments={segments.map(formatBreadcrumb)} />
    </div>
  );
}

export function Header() {
  const router = useRouter();
  return (
    <header className="h-[48px] flex flex-row items-center px-4">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        className="flex items-center gap-2"
        onClick={() => router.push("/app")}
      >
        <Logo variant="icon" theme="dark" className="h-4" />
      </div>
      <Slash className="ml-2 -rotate-12 opacity-30" size={16} />
      <h1 className="ml-2 text-sm overflow-ellipsis line-clamp-1 font-medium">
        <HeaderTitle />
      </h1>
      {/* <Button
        className="ml-auto h-8 mr-2 text-xs py-1"
        variant="outline"
        size="sm"
      >
        <HeartPlus className="w-4 h-4 md:w-2 md:h-2" />
        <span className="hidden md:inline ml-1">Contribute Problem</span>
      </Button>
      <Button className="h-8 mr-2 text-xs py-1" variant="outline" size="sm">
        <Mail className="w-4 h-4 md:w-2 md:h-2" />
        <span className="hidden md:inline ml-1">Give Feedback</span>
      </Button> */}
      <Button
        className="h-8 mr-2 text-xs py-1 ml-auto"
        variant="outline"
        onClick={() => router.push("/app/")}
      >
        <Plus className="w-4 h-4 md:w-2 md:h-2" />
        <span className="hidden md:inline ml-1">New Interview</span>
      </Button>
      {/* <Button
        className="h-8 mr-2 text-xs py-1"
        variant="outline"
        size="sm"
        onClick={() => router.push("/app/subscription")}
      >
        <Crown className="w-4 h-4 md:w-2 md:h-2" />
        <span className="hidden md:inline ml-1">Subscription</span>
      </Button> */}
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
