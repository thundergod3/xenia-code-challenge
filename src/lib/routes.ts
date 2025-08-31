export const ROUTES = {
  FACTS: "/facts",
  FACT_NEW: "/facts/new",
  FACT_EDIT: (id: string) => `/facts/${id}/edit`,

  RULES: "/rules",
  RULE_NEW: "/rules/new",
  RULE_EDIT: (id: string) => `/rules/${id}/edit`,

  OUTCOMES: "/outcomes",
  OUTCOME_NEW: "/outcomes/new",
  OUTCOME_EDIT: (id: string) => `/outcomes/${id}/edit`,

  TEST_CASES: "/test-cases",
  TEST_CASE_NEW: "/test-cases/new",
  TEST_CASE_ERRORS: "/test-cases/errors",
  TEST_CASE_EDIT: (id: string) => `/test-cases/${id}/edit`,

  BUILDER: "/builder",
};
