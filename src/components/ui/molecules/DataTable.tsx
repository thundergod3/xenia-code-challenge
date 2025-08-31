"use client";
import React from "react";
import Table, {
  TableElement,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/src/components/ui/molecules/Table";

export type DataColumn = {
  key: string;
  title: React.ReactNode;
  render?: (row: any) => React.ReactNode;
  className?: string;
};

export default function DataTable({
  data,
  columns,
  actions,
  loading,
}: {
  data: any[];
  columns: DataColumn[];
  actions?: (row: any) => React.ReactNode;
  loading?: boolean;
}) {
  const colCount = (columns.length || 0) + (actions ? 1 : 0);

  return (
    <Table>
      <TableElement>
        <TableHead>
          {columns.map((c) => (
            <TableCell key={c.key} className={c.className}>
              {c.title}
            </TableCell>
          ))}
          {actions && <TableCell>Actions</TableCell>}
        </TableHead>

        <TableBody>
          {loading && (
            <tr>
              <td
                colSpan={colCount}
                className="p-4 text-center text-sm text-gray-500">
                Loading...
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td
                colSpan={colCount}
                className="p-4 text-center text-sm text-gray-500">
                No data
              </td>
            </tr>
          )}

          {data.map((row) => (
            <TableRow key={row.id}>
              {columns.map((c) => (
                <TableCell key={c.key} className={c.className}>
                  {c.render ? c.render(row) : row[c.key] ?? ""}
                </TableCell>
              ))}
              {actions && <TableCell>{actions(row)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </TableElement>
    </Table>
  );
}
