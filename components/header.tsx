import {
  CircleCheck,
  CircleDashed,
  Hexagon,
  Plus,
  Slash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function Header() {
  return (<header className="h-[48px] flex flex-row items-center px-4">
    <Hexagon className="min-w-8 min-h-8 hover:bg-muted p-1 rounded-md" />
    <Slash className="ml-2 -rotate-12 opacity-30" size={16} />
    <h1 className="ml-2 text-sm overflow-ellipsis line-clamp-1">
      Design Url Shortener Design Url Shortener Design Url Shortener
      Design Url Shortener
    </h1>
    <CircleCheck className="ml-2" color="green" size={18} />
    <CircleDashed className="ml-2" color="orange" size={18} />
    <Button className="ml-auto h-8 mr-4 " variant="outline" size="sm">
      <Plus className="w-4 h-4" />
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
  </header>)
}
