"use client";
import React from "react";

export default function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto bg-white rounded shadow">{children}</div>
  );
}

export function TableElement({ children }: { children: React.ReactNode }) {
  return <table className="w-full">{children}</table>;
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="text-left text-sm text-gray-500">{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-t hover:bg-gray-50">{children}</tr>;
}

export function TableCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`p-3 ${className || ""}`}>{children}</td>;
}
