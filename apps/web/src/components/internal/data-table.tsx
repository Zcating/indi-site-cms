import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReactNode } from "react";

export interface Column<T> {
  label: ReactNode;
  value?: keyof T;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (item: T) => string | number;
}

export function DataTable<T>({ data, columns, rowKey }: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, index) => (
            <TableHead key={index} className={col.className}>
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={rowKey(item)}>
            {columns.map((col, index) => (
              <TableCell key={index} className={col.className}>
                {col.render
                  ? col.render(item)
                  : col.value
                    ? (item[col.value] as ReactNode)
                    : null}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
