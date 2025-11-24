"use client";

import { useParams } from "next/navigation";

export default function Page() {
  const { id } = useParams();
  return (
    <div>
      <div className="w-full mb-4 max-w-[1200px] mt-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{id}</h1>
        </div>
      </div>
    </div>
  );
}
