"use client";

import { Header } from "@/components/header";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen grid grid-rows-[auto_1fr]">
      <Header />
      <div className="h-full overflow-y-auto">{children}</div>
    </div>
  );
}
