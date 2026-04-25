import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface SortableTableHeadProps {
  children: React.ReactNode;
  field: string;
  currentField: string;
  ascending: boolean;
  onSort: (field: string) => void;
  className?: string;
}

export function SortableTableHead({
  children,
  field,
  currentField,
  ascending,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = field === currentField;
  return (
    <TableHead
      className={`cursor-pointer select-none ${className || ""}`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {isActive ? (
          ascending ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </TableHead>
  );
}
