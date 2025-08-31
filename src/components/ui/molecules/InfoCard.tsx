"use client";
import React from "react";
import Link from "next/link";

export default function InfoCard({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg flex flex-col gap-3 justify-between">
      <div className="flex flex-col">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Link href={href} className="text-sm text-indigo-600">
        {linkLabel} →
      </Link>
    </div>
  );
}
