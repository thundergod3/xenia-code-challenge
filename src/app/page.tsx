import React from "react";
import Link from "next/link";
import InfoCard from "@/src/components/ui/molecules/InfoCard";
import { ROUTES } from "../lib/routes";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow p-8 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-extrabold mb-4">
              Manage rules and test confidently
            </h2>
            <p className="text-gray-600 mb-6">
              Create facts, author rules, define outcomes, and run test cases to
              validate your credit logic — all in one place.
            </p>
            <div className="flex space-x-3">
              <Link
                href={ROUTES.RULE_NEW}
                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700">
                Create rule
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoCard
              title="Facts"
              description="Create and manage facts used by rules."
              href={ROUTES.FACT_NEW}
              linkLabel="Add fact"
            />
            <InfoCard
              title="Rules"
              description="Author and edit decision rules."
              href={ROUTES.RULE_NEW}
              linkLabel="New rule"
            />
            <InfoCard
              title="Outcomes"
              description="Define results returned by rules."
              href={ROUTES.OUTCOME_NEW}
              linkLabel="Add outcome"
            />
            <InfoCard
              title="Test Cases"
              description="Create scenarios to validate behavior."
              href={ROUTES.TEST_CASE_NEW}
              linkLabel="Create test"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
