"use client";
import React from "react";
import Link from "next/link";

export default function LinkButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-block px-3 py-2 rounded ${
        className || "bg-blue-600 text-white"
      }`}>
      {children}
    </Link>
  );
}
