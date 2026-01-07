"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/header";

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve query parameters when redirecting
    const params = searchParams.toString();
    const destination = params ? `/app/settings?${params}` : "/app/settings";
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <>
      <Header>
        <Header.Left>
          <Header.DefaultLeft />
        </Header.Left>
        <Header.Right>
          <Header.NewInterviewButton />
          <Header.DefaultRight />
        </Header.Right>
      </Header>
      <div className="flex-1 overflow-y-auto min-h-0">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <RedirectContent />
        </Suspense>
      </div>
    </>
  );
}
