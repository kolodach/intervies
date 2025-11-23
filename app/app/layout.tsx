import {
  CircleCheck,
  CircleDashed,
  Hexagon,
  Plus,
  Slash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <div className="h-screen grid grid-rows-[auto_1fr]">
      <div className="h-[48px] flex flex-row items-center px-4">
        <Hexagon className="min-w-8 min-h-8 hover:bg-muted p-1 rounded-md" />
        <Slash className="ml-2 -rotate-12 opacity-30" size={16} />
        <h1 className="ml-2 text-sm overflow-ellipsis line-clamp-1">
          Design Url Shortener Design Url Shortener Design Url Shortener
          Design Url Shortener
        </h1>
        <CircleCheck className="ml-2" color="green" size={18} />
        <CircleDashed className="ml-2" color="orange" size={18} />
        <Button className="ml-auto h-8" variant="outline" size="sm">
          <Plus className="w-4 h-4" />
          New Problem
        </Button>
        <Avatar className="ml-4 w-7 h-7">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
      <div className="h-full overflow-hidden">{children}</div>
    </div>
  )
}

