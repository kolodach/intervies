"use client";

import "@excalidraw/excalidraw/index.css";
import "./excalidraw-wrapper.css";

import { useRef } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/excalidraw/element/types";
import { WelcomeScreen } from "@excalidraw/excalidraw";
import { Hexagon, Pen } from "lucide-react";
import { Excalidraw } from "@/components/excalidraw";

export function Canvas({
  excalidrawRef,
  onChange,
  elements,
}: {
  excalidrawRef: React.RefObject<ExcalidrawImperativeAPI | null>;
  onChange: (elements: Readonly<OrderedExcalidrawElement[]>) => void;
  elements: Readonly<OrderedExcalidrawElement[]>;
}) {
  const currElementsRef = useRef<ExcalidrawElement[]>([]);
  return (
    <div className="h-full w-full theme-dark border border-input rounded-md overflow-hidden relative">
      <Excalidraw
        initialData={{
          elements: elements,
        }}
        onChange={(elements) => {
          onChange(elements);
          currElementsRef.current = elements as ExcalidrawElement[];
        }}
        excalidrawAPI={(api) => {
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
                <Hexagon className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold mb-8">How to succeed?</h1>
              <ul className="text-left">
                <li>1. Clarify the requirements</li>
                <li>2. Create a low-fidelity diagram</li>
                <li>3. Run back-of-the-envelope calculations</li>
                <li>4. Refine your design through follow-up questions</li>
              </ul>
            </WelcomeScreen.Center.Heading>
            <WelcomeScreen.Center.Menu>
              <WelcomeScreen.Center.MenuItemLink href="https://github.com/excalidraw/excalidraw">
                Excalidraw GitHub
              </WelcomeScreen.Center.MenuItemLink>
            </WelcomeScreen.Center.Menu>
          </WelcomeScreen.Center>
        </WelcomeScreen>
      </Excalidraw>
    </div>
  );
}
