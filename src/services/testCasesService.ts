export async function listTestCases() {
  const res = await fetch("/api/test-cases");
  return res.json();
}

export async function runTestCase(id: string) {
  const res = await fetch(`/api/test-cases/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test_case_id: id }),
  });
  const payload = await res.json();
  if (!res.ok) {
    // keep error shape consistent for callers
    throw payload;
  }
  return payload;
}

export async function createTestCase(payload: any) {
  const res = await fetch(`/api/test-cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateTestCase(id: string, payload: any) {
  const res = await fetch(`/api/test-cases/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getTestCase(id: string) {
  const res = await fetch(`/api/test-cases/${id}`);
  const payload = await res.json();
  if (!res.ok) throw payload;
  return payload;
}

export async function deleteTestCase(id: string) {
  const res = await fetch(`/api/test-cases`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const payload = await res.json();
  if (!res.ok) throw payload;
  return payload;
}
