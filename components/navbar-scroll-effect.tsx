"use client";

import { useEffect } from "react";

export function NavbarScrollEffect() {
  useEffect(() => {
    let rafId: number | null = null;

    const updateNavbar = () => {
      const scrollY = window.scrollY;
      
      // Calculate opacity based on scroll position
      // Start showing gradient after 5px of scroll
      // Fully opaque at 80px
      const scrollThreshold = 5;
      const maxScroll = 80;
      const opacity = Math.min(
        Math.max((scrollY - scrollThreshold) / (maxScroll - scrollThreshold), 0),
        1
      );

      // Update CSS custom property immediately without transitions
      // Using 0.8 as max opacity for the background
      document.documentElement.style.setProperty(
        "--navbar-bg-opacity",
        String(opacity * 0.8)
      );
      document.documentElement.style.setProperty(
        "--navbar-blur",
        `${opacity * 12}px`
      );

      rafId = null;
    };

    const handleScroll = () => {
      // Use requestAnimationFrame for smooth updates
      if (rafId === null) {
        rafId = requestAnimationFrame(updateNavbar);
      }
    };

    // Set initial scroll position
    updateNavbar();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return null;
}

