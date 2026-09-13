"use client";

import {
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
  Children,
  isValidElement,
  type ReactNode,
  type KeyboardEvent,
} from "react";

export interface UniversalSelectorOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface UniversalSelectorProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  options?: UniversalSelectorOption[];
  children?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  onChange?: (value: string) => void;
  accentColor?: "brand" | "orange" | "violet" | "teal";
}

/**
 * UniversalSelector for Admin & Dashboard
 *
 * A modern, accessible, brand-styled custom dropdown with real-time search,
 * custom scrollbar, keyboard navigation, and full form compatibility.
 */
export function UniversalSelector({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  options: directOptions,
  children,
  placeholder = "Select an option...",
  disabled = false,
  required = false,
  searchable = true,
  searchPlaceholder = "Search...",
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  onChange,
  accentColor = "teal",
}: UniversalSelectorProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  // Extract options from props or <option> children
  const parsedOptions: UniversalSelectorOption[] = directOptions
    ? [...directOptions]
    : [];

  if (!directOptions && children) {
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.type === "option") {
        const props = child.props as {
          value?: string;
          children?: ReactNode;
          disabled?: boolean;
        };
        parsedOptions.push({
          value: String(props.value ?? ""),
          label:
            typeof props.children === "string"
              ? props.children
              : String(props.value ?? ""),
          disabled: props.disabled,
        });
      }
    });
  }

  // Internal selection state
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    isControlled ? controlledValue : defaultValue,
  );
  const selectedValue = isControlled ? controlledValue : internalValue;

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  // Sync controlled value changes
  useEffect(() => {
    if (isControlled && controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [isControlled, controlledValue]);

  // Filter options based on search query
  const filteredOptions = parsedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  // Currently selected option metadata
  const selectedOption = parsedOptions.find((opt) => opt.value === selectedValue);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  // Handle item selection
  const handleSelect = useCallback(
    (optionValue: string) => {
      if (!isControlled) {
        setInternalValue(optionValue);
      }
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(-1);
    },
    [isControlled, onChange],
  );

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) {
            handleSelect(opt.value);
          }
        }
        break;
    }
  };

  // Scroll active option into view when navigating with keyboard
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsListRef.current) {
      const items = optionsListRef.current.querySelectorAll("[data-option-item]");
      const target = items[highlightedIndex] as HTMLElement;
      if (target) {
        target.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  // Accent color themes
  const accentStyles = {
    teal: {
      borderFocus: "focus:border-teal-600 focus:ring-teal-500/20",
      borderOpen: "border-teal-600 ring-2 ring-teal-500/20",
      itemSelected: "bg-teal-50 text-teal-800 font-semibold",
      itemHover: "hover:bg-teal-50/80 hover:text-teal-900",
      scrollbarColor: "#0d9488 #f0fdfa",
      scrollbarHex: "#0d9488",
      checkColor: "text-teal-600",
      searchFocus: "focus-within:border-teal-600 focus-within:ring-teal-500/20",
    },
    brand: {
      borderFocus: "focus:border-teal-600 focus:ring-teal-500/20",
      borderOpen: "border-teal-600 ring-2 ring-teal-500/20",
      itemSelected: "bg-teal-50 text-teal-800 font-semibold",
      itemHover: "hover:bg-teal-50/80 hover:text-teal-900",
      scrollbarColor: "#0d9488 #f0fdfa",
      scrollbarHex: "#0d9488",
      checkColor: "text-teal-600",
      searchFocus: "focus-within:border-teal-600 focus-within:ring-teal-500/20",
    },
    orange: {
      borderFocus: "focus:border-[#ea580c] focus:ring-[#ea580c]/20",
      borderOpen: "border-[#ea580c] ring-2 ring-[#ea580c]/20",
      itemSelected: "bg-orange-50 text-orange-800 font-semibold",
      itemHover: "hover:bg-orange-50/80 hover:text-orange-900",
      scrollbarColor: "#ea580c #fff7ed",
      scrollbarHex: "#ea580c",
      checkColor: "text-orange-600",
      searchFocus: "focus-within:border-[#ea580c] focus-within:ring-[#ea580c]/20",
    },
    violet: {
      borderFocus: "focus:border-[#7c3aed] focus:ring-[#7c3aed]/20",
      borderOpen: "border-[#7c3aed] ring-2 ring-[#7c3aed]/20",
      itemSelected: "bg-purple-50 text-purple-800 font-semibold",
      itemHover: "hover:bg-purple-50/80 hover:text-purple-900",
      scrollbarColor: "#7c3aed #faf5ff",
      scrollbarHex: "#7c3aed",
      checkColor: "text-purple-600",
      searchFocus: "focus-within:border-[#7c3aed] focus-within:ring-[#7c3aed]/20",
    },
  }[accentColor];

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML form submission compatibility */}
      <input
        type="hidden"
        id={selectId}
        name={name}
        value={selectedValue}
        required={required}
        disabled={disabled}
      />

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={selectId}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`group relative flex w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm transition-all duration-150 hover:border-slate-400 focus:outline-none ${
          isOpen ? accentStyles.borderOpen : accentStyles.borderFocus
        } ${
          disabled
            ? "cursor-not-allowed opacity-50 bg-slate-100"
            : "cursor-pointer"
        } ${triggerClassName}`}
      >
        <span
          className={`truncate font-normal ${
            selectedOption && selectedOption.value !== ""
              ? "text-slate-900 font-medium"
              : "text-slate-400"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <span className="pointer-events-none shrink-0 text-slate-400 transition-transform duration-200">
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-50 mt-1 min-w-[220px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl transition-all duration-150 ${accentStyles.borderOpen} ${dropdownClassName}`}
          style={{
            boxShadow:
              "0 15px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Top Search Filter */}
          {searchable && (
            <div className="relative mb-2 px-1 pt-0.5">
              <div
                className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs transition-all ${accentStyles.searchFocus}`}
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent p-0 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  style={{
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List with Styled Scrollbar */}
          <div
            ref={optionsListRef}
            className="max-h-56 overflow-y-auto space-y-0.5 pr-1"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: accentStyles.scrollbarColor,
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === selectedValue;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={option.value || `empty-${index}`}
                    data-option-item
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!option.disabled) {
                        handleSelect(option.value);
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`group relative flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all duration-100 cursor-pointer select-none ${
                      option.disabled
                        ? "cursor-not-allowed opacity-40"
                        : isSelected
                        ? accentStyles.itemSelected
                        : isHighlighted
                        ? accentStyles.itemHover
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>

                    {isSelected && (
                      <span className={`shrink-0 ${accentStyles.checkColor} font-bold`}>
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UniversalSelector;
