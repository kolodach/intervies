"use client";

import "./excalidraw-wrapper.css";

import { useRef, useEffect, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/excalidraw/element/types";
import { Hexagon } from "lucide-react";

// Import CSS at build time (safe for SSR)
import "@excalidraw/excalidraw/index.css";
import { Logo } from "./logo";

export function Canvas({
  excalidrawRef,
  onChange,
  elements,
  readonly,
}: {
  excalidrawRef: React.RefObject<ExcalidrawImperativeAPI | null>;
  onChange: (elements: Readonly<OrderedExcalidrawElement[]>) => void;
  elements: Readonly<OrderedExcalidrawElement[]>;
  readonly: boolean;
}) {
  const currElementsRef = useRef<ExcalidrawElement[]>([]);
  const [ExcalidrawComponent, setExcalidrawComponent] =
    useState<React.ComponentType<unknown> | null>(null);
  const [WelcomeScreenComponent, setWelcomeScreenComponent] =
    useState<React.ComponentType<unknown> | null>(null);

  useEffect(() => {
    // Only import JavaScript modules on client side
    import("@excalidraw/excalidraw").then((mod) => {
      setExcalidrawComponent(
        () => mod.Excalidraw as React.ComponentType<unknown>
      );
      setWelcomeScreenComponent(
        () => mod.WelcomeScreen as React.ComponentType<unknown>
      );
    });
  }, []);

  if (!ExcalidrawComponent || !WelcomeScreenComponent) {
    return (
      <div className="h-full w-full theme-dark border border-input rounded-md overflow-hidden relative flex items-center justify-center">
        <div>Loading canvas...</div>
      </div>
    );
  }

  // Type assertions for dynamically loaded components
  const Excalidraw = ExcalidrawComponent as React.ComponentType<{
    initialData?: { elements: Readonly<OrderedExcalidrawElement[]> };
    onChange?: (elements: OrderedExcalidrawElement[]) => void;
    excalidrawAPI?: (api: ExcalidrawImperativeAPI) => void;
    theme?: string;
    UIOptions?: unknown;
    children?: React.ReactNode;
    viewModeEnabled?: boolean;
  }>;

  const WelcomeScreen = WelcomeScreenComponent as React.ComponentType<{
    children?: React.ReactNode;
  }> & {
    Center: React.ComponentType<{ children?: React.ReactNode }> & {
      Heading: React.ComponentType<{ children?: React.ReactNode }>;
      Menu: React.ComponentType<{ children?: React.ReactNode }>;
      MenuItemLink: React.ComponentType<{
        children?: React.ReactNode;
        href: string;
      }>;
    };
  };

  return (
    <div className="h-full w-full theme-dark border border-input rounded-md overflow-hidden relative">
      <Excalidraw
        initialData={{
          elements: elements,
        }}
        viewModeEnabled={readonly}
        onChange={(elements: OrderedExcalidrawElement[]) => {
          onChange(elements);
          currElementsRef.current = elements as ExcalidrawElement[];
        }}
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
          excalidrawRef.current = api;
        }}
        theme="dark"
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            clearCanvas: true,
            export: false,
            loadScene: false,
            saveAsImage: false,
            saveToActiveFile: false,
            toggleTheme: false,
          },
          tools: {
            image: false,
          },
        }}
      >
        <WelcomeScreen>
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Heading>
              <div className="flex items-center justify-center pb-4">
                <Logo
                  variant="default"
                  theme="dark"
                  className="h-10 opacity-40"
                />
              </div>
              <h1 className="text-2xl font-bold mb-8">How to succeed?</h1>
              <ul className="text-left">
                <li>1. Clarify the requirements</li>
                <li>2. Create a low-fidelity diagram</li>
                <li>3. Run back-of-the-envelope calculations</li>
                <li>4. Refine your design through follow-up questions</li>
              </ul>
            </WelcomeScreen.Center.Heading>
          </WelcomeScreen.Center>
        </WelcomeScreen>
      </Excalidraw>
    </div>
  );
}
