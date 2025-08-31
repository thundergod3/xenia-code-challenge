"use client";
import React from "react";

export default function Button({
  children,
  className,
  loading,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      className={`px-3 py-2 rounded ${className || "bg-blue-600 text-white"}`}
      disabled={disabled || loading}>
      {loading ? "Loading..." : children}
    </button>
  );
}
