"use client";

import { Canvas } from "@/components/canvas";
import Chat from "@/components/chat";
import { useAuthenticatedQuery } from "@/lib/hooks/query-hooks";
import { fetchSolutionById, updateSolution } from "@/lib/queries/solutions";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useDebouncer } from "@tanstack/react-pacer";
import { toast } from "sonner";
import type { Json } from "@/lib/database.types";

export default function Page() {
  const { id } = useParams();
  const user = useUser();
  const client = useSupabaseBrowserClient();
  const supabase = useSupabaseBrowserClient();
  const {
    data: solution,
    error,
    isLoading,
  } = useQuery(fetchSolutionById(supabase, id as string), {
    enabled: !!user,
  });

  const initialElements = useMemo(() => {
    return (solution?.board_state ?? []) as unknown as Readonly<
      OrderedExcalidrawElement[]
    >;
  }, [solution]);
  const [elements, setElements] = useState<
    Readonly<OrderedExcalidrawElement[]>
  >([]);
  const onChange = async (elements: Readonly<OrderedExcalidrawElement[]>) => {
    setElements(elements);
    console.log("elements", elements);
    if (!solution) {
      return;
    }
    await updateSolution(client, solution?.id, {
      board_state: elements as unknown as Json[],
    });
  };
  const debouncedOnChange = useDebouncer(onChange, {
    wait: 1000,
  });
  const excalidrawRef = useRef<ExcalidrawImperativeAPI>(null);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (!solution) {
    return <div>Solution not found</div>;
  }

  return (
    <div className="grid grid-cols-[400px_1fr] h-full">
      <div className="h-full p-2 min-h-0">
        <Chat solution={solution} />
      </div>
      <div className="h-full relative pb-2 pr-2">
        <Canvas
          elements={initialElements}
          excalidrawRef={excalidrawRef}
          onChange={debouncedOnChange.maybeExecute}
        />
      </div>
    </div>
  );
}
