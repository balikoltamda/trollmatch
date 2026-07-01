"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type AutocompleteOption = {
  id: string;
  label: string;
};

type AutocompleteFieldProps = {
  label: string;
  placeholder: string;
  emptyMessage: string;
  options: AutocompleteOption[];
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
  disabled?: boolean;
};

export function AutocompleteField({
  label,
  placeholder,
  emptyMessage,
  options,
  value,
  onChange,
  disabled = false,
}: AutocompleteFieldProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value?.label ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(normalizedQuery),
  );

  function selectOption(option: AutocompleteOption) {
    onChange(option);
    setQuery(option.label);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleInputChange(nextQuery: string) {
    setQuery(nextQuery);
    setIsOpen(true);
    setActiveIndex(-1);

    if (value && nextQuery !== value.label) {
      onChange(null);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current < filteredOptions.length - 1 ? current + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current > 0 ? current - 1 : filteredOptions.length - 1,
      );
      return;
    }

    if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) {
        selectOption(option);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <label
        htmlFor={listboxId}
        className="text-foreground text-sm font-medium"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={listboxId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${listboxId}-listbox`}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        {isOpen && !disabled ? (
          <ul
            id={`${listboxId}-listbox`}
            role="listbox"
            className="border-border bg-popover text-popover-foreground absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border shadow-md"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={value?.id === option.id}
                  className={cn(
                    "cursor-pointer px-3 py-2.5 text-sm transition-colors",
                    index === activeIndex || value?.id === option.id
                      ? "bg-muted text-foreground"
                      : "hover:bg-muted/70",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground px-3 py-2.5 text-sm">
                {emptyMessage}
              </li>
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
