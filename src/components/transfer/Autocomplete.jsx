import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandGroup, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Autocomplete({
  value,
  onChange,
  options,
  groups,
  placeholder,
  searchPlaceholder,
  displayValue,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const all = groups ? groups.flatMap((g) => g.items) : options || [];
  const q = query.trim().toLowerCase();
  const filterFn = (item) => !q || item.label.toLowerCase().includes(q);
  const filteredAll = all.filter(filterFn);
  const exactMatch = q && all.some((item) => item.label.toLowerCase() === q);
  const showCustom = q && !exactMatch;
  const shown = displayValue || value;

  const pick = (val, label) => {
    onChange(val, label);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <span className={cn("truncate text-left", !shown && "text-muted-foreground")}>
            {shown || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[12rem]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder || "Search…"}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {showCustom && (
              <CommandGroup>
                <CommandItem onSelect={() => pick(query, query)}>
                  <Check className="mr-1 opacity-0" />
                  Use “{query}”
                </CommandItem>
              </CommandGroup>
            )}
            {groups
              ? groups.map((g) => {
                  const items = g.items.filter(filterFn);
                  if (!items.length) return null;
                  return (
                    <CommandGroup key={g.heading} heading={g.heading}>
                      {items.map((item) => (
                        <CommandItem key={item.value} onSelect={() => pick(item.value, item.label)}>
                          <Check className={cn("mr-1", value === item.value ? "opacity-100" : "opacity-0")} />
                          {item.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })
              : filteredAll.map((item) => (
                  <CommandItem key={item.value} onSelect={() => pick(item.value, item.label)}>
                    <Check className={cn("mr-1", value === item.value ? "opacity-100" : "opacity-0")} />
                    {item.label}
                  </CommandItem>
                ))}
            {!showCustom && filteredAll.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results. Type to add your own.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}