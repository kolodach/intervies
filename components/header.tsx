"use client";

import {
  Circle,
  CircleCheck,
  LogOut,
  Plus,
  Settings,
  Slash,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchSolutionById } from "@/lib/queries/solutions";
import { Logo } from "./logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { data: session } = useSession();
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
    enabled: !!solutionId && !!client && !!session?.user,
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

function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) return null;

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            {user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/app/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/app/subscription")}>
          <User className="mr-2 h-4 w-4" />
          <span>Subscription</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();

  return (
    <header className="h-[48px] flex flex-row items-center px-4">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => router.push("/app")}
      >
        <Logo variant="icon" theme="dark" className="h-4" />
      </div>
      <Slash className="ml-2 -rotate-12 opacity-30" size={16} />
      <h1 className="ml-2 text-sm overflow-ellipsis line-clamp-1 font-medium">
        <HeaderTitle />
      </h1>
      <Button
        className="h-8 mr-2 text-xs py-1 ml-auto"
        variant="outline"
        onClick={() => router.push("/app/")}
      >
        <Plus className="w-4 h-4 md:w-2 md:h-2" />
        <span className="hidden md:inline ml-1">New Interview</span>
      </Button>
      {status === "loading" ? null : session ? (
        <UserMenu />
      ) : (
        <>
          <Button variant="ghost" size="sm" onClick={() => signIn("google")}>
            Sign In
          </Button>
          <Button size="sm" className="ml-2" onClick={() => signIn("google")}>
            Sign Up
          </Button>
        </>
      )}
    </header>
  );
}
