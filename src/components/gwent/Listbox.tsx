import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import "./listbox.css";

export interface ListboxOption {
  readonly value: string;
  readonly label: string;
  readonly meta?: string;
  readonly disabled?: boolean;
}

export interface ListboxProps {
  readonly label?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly ListboxOption[];
  readonly disabled?: boolean;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly testId?: string;
}

const isCoarsePointer = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: coarse)").matches;
};

const firstEnabledIndex = (options: readonly ListboxOption[], preferredIndex: number) => {
  if (!options.length) return -1;
  if (preferredIndex >= 0 && !options[preferredIndex]?.disabled) return preferredIndex;
  return options.findIndex((option) => !option.disabled);
};

const NativeListbox: React.FC<ListboxProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  hint,
  placeholder = "Choose...",
  testId,
}) => (
  <label className="authentic-listbox authentic-listbox--native">
    {label ? <span className="authentic-listbox__label">{label}</span> : null}
    <span className="authentic-listbox__native-wrap">
      <select
        value={value}
        disabled={disabled}
        aria-label={label ?? placeholder}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.meta ? `${option.label} - ${option.meta}` : option.label}
          </option>
        ))}
      </select>
      <span className="authentic-listbox__arrow" aria-hidden="true" />
    </span>
    {hint ? <em>{hint}</em> : null}
  </label>
);

const CustomListbox: React.FC<ListboxProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  hint,
  placeholder = "Choose...",
  testId,
}) => {
  const selected = options.find((option) => option.value === value);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => firstEnabledIndex(options, selectedIndex));
  const [typed, setTyped] = useState("");
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const typeTimer = useRef<number | null>(null);

  const closeAndFocus = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(firstEnabledIndex(options, selectedIndex));
    window.requestAnimationFrame(() => listRef.current?.focus());
  }, [open, options, selectedIndex]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  useEffect(
    () => () => {
      if (typeTimer.current !== null) {
        window.clearTimeout(typeTimer.current);
      }
    },
    [],
  );

  const selectIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onChange(option.value);
      closeAndFocus();
    },
    [closeAndFocus, onChange, options],
  );

  const moveActive = useCallback(
    (direction: 1 | -1) => {
      if (!options.length) return;
      let next = activeIndex;
      for (let step = 0; step < options.length; step += 1) {
        next = Math.max(0, Math.min(options.length - 1, next + direction));
        if (!options[next]?.disabled) {
          setActiveIndex(next);
          return;
        }
        if (next === 0 || next === options.length - 1) return;
      }
    },
    [activeIndex, options],
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        if (!disabled) setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(firstEnabledIndex(options, 0));
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(firstEnabledIndex(options, options.length - 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectIndex(activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAndFocus();
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (/^[a-z0-9]$/i.test(event.key)) {
      const nextTyped = `${typed}${event.key.toLowerCase()}`;
      setTyped(nextTyped);
      if (typeTimer.current !== null) window.clearTimeout(typeTimer.current);
      typeTimer.current = window.setTimeout(() => setTyped(""), 700);
      const nextIndex = options.findIndex((option) => !option.disabled && option.label.toLowerCase().startsWith(nextTyped));
      if (nextIndex >= 0) setActiveIndex(nextIndex);
    }
  };

  return (
    <div className="authentic-listbox">
      {label ? <span className="authentic-listbox__label">{label}</span> : null}
      <button
        ref={triggerRef}
        type="button"
        className="authentic-button authentic-button--field authentic-listbox__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        data-testid={testId}
        onClick={() => !disabled && setOpen((valueOpen) => !valueOpen)}
        onKeyDown={handleKeyDown}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span className="authentic-listbox__arrow" aria-hidden="true" data-open={open ? "true" : undefined} />
      </button>
      {hint && !open ? <em>{hint}</em> : null}
      {open ? (
        <ul
          id={`${id}-list`}
          ref={listRef}
          className="authentic-listbox__popover"
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
          onKeyDown={handleKeyDown}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                id={`${id}-opt-${index}`}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                className={isActive ? "is-active" : ""}
                data-disabled={option.disabled ? "true" : undefined}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectIndex(index);
                }}
              >
                <span className="authentic-listbox__check">{isSelected ? "✓" : ""}</span>
                <span className="authentic-listbox__option-label">{option.label}</span>
                {option.meta ? <span className="authentic-listbox__meta">{option.meta}</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export const Listbox: React.FC<ListboxProps> = (props) => {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    setCoarse(isCoarsePointer());
    if (!window.matchMedia) return;
    const query = window.matchMedia("(pointer: coarse)");
    const onChange = () => setCoarse(query.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  return coarse ? <NativeListbox {...props} /> : <CustomListbox {...props} />;
};

export default Listbox;
