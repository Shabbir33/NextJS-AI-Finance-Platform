import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Trash, X } from "lucide-react";
import React from "react";

const TableFilters = ({
  selectedIds,
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  recurringFilter,
  setRecurringFilter,
  handleBulkDelete,
  handleClearFilters,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={recurringFilter}
          onValueChange={(value) => setRecurringFilter(value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Transactions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recurring">Recurring Only</SelectItem>
            <SelectItem value="non-recurring">Non-recurring Only</SelectItem>
          </SelectContent>
        </Select>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash className="h-4 w-4 mr-1" />
              Delete Selected ({selectedIds.length})
            </Button>
          </div>
        )}
        {(selectedIds.length > 0 ||
          searchTerm ||
          typeFilter ||
          recurringFilter) && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearFilters}
            title="Clear Filters"
          >
            <X className="h-4 w-5 mr-2 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TableFilters;
