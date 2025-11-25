import {
  CircleCheck,
  CircleDashed,
  HeartPlus,
  Hexagon,
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

export function Header() {
  return (
    <header className="h-[48px] flex flex-row items-center px-4">
      <Hexagon className="min-w-8 min-h-8 hover:bg-muted p-1 rounded-md" />
      <Slash className="ml-2 -rotate-12 opacity-30" size={16} />
      <h1 className="ml-2 text-sm overflow-ellipsis line-clamp-1 font-medium">
        Design Url Shortener Design Url Shortener Design Url Shortener Design
        Url Shortener
      </h1>
      <CircleCheck className="ml-2" color="green" size={18} />
      <CircleDashed className="ml-2" color="orange" size={18} />
      <Button
        className="ml-auto h-8 mr-2 text-xs py-1"
        variant="outline"
        size="sm"
      >
        <HeartPlus className="w-2 h-2" />
        Contribute Problem
      </Button>
      <Button className="h-8 mr-2 text-xs py-1" variant="outline" size="sm">
        <MessageSquarePlus className="w-2 h-2" />
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
