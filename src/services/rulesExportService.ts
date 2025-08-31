export async function downloadRulesExport() {
  const res = await fetch(`/api/rules/export`);
  if (!res.ok) throw new Error("Failed to fetch rules export");
  const payload = await res.json();
  const blob = new Blob([JSON.stringify(payload.data || [], null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fileName = `rules-export-${new Date().toISOString()}.json`;
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
