"use client";

import { ChevronDownIcon, XIcon } from "lucide-react";
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AgentOption = {
  id: number;
  agentCode: string | null;
  name: string;
};

type PanelStyle = {
  top: number;
  left: number;
  width: number;
};

function formatAgentLabel(agent: AgentOption) {
  return `${agent.agentCode ?? "-"} - ${agent.name}`;
}

function AgentSearchSelectClearButton({
  onClear,
}: {
  onClear: () => void;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      className="text-muted-foreground hover:text-foreground pointer-events-none inline-flex size-4 items-center justify-center rounded-sm opacity-0 transition-opacity group-hover/button:pointer-events-auto group-hover/button:opacity-100 group-focus-visible/button:pointer-events-auto group-focus-visible/button:opacity-100"
      aria-label="清除已选代理人"
      onClick={(event) => {
        event.stopPropagation();
        onClear();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onClear();
      }}
    >
      <XIcon className="size-4" />
    </span>
  );
}

function AgentSearchSelectTrigger({
  isOpen,
  listboxId,
  required,
  selectedAgent,
  onToggle,
  onClear,
}: {
  isOpen: boolean;
  listboxId: string;
  required: boolean;
  selectedAgent: AgentOption | null;
  onToggle: () => void;
  onClear: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-between font-normal"
      aria-expanded={isOpen}
      aria-controls={isOpen ? listboxId : undefined}
      aria-required={required || undefined}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key !== "ArrowDown") {
          return;
        }

        event.preventDefault();
        onToggle();
      }}
    >
      <span
        className={cn(
          "truncate text-left",
          !selectedAgent && "text-muted-foreground",
        )}
      >
        {selectedAgent ? formatAgentLabel(selectedAgent) : "请选择代理人"}
      </span>
      <span className="ml-2 flex shrink-0 items-center gap-1">
        {selectedAgent ? (
          <AgentSearchSelectClearButton onClear={onClear} />
        ) : null}
        <ChevronDownIcon
          className={cn(
            "text-muted-foreground size-4 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </span>
    </Button>
  );
}

function AgentSearchSelectResults({
  value,
  listboxId,
  listRef,
  results,
  isLoading,
  keyword,
  highlightedIndex,
  onHighlight,
  onSelect,
}: {
  value: string;
  listboxId: string;
  listRef: React.RefObject<HTMLDivElement | null>;
  results: AgentOption[];
  isLoading: boolean;
  keyword: string;
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (agent: AgentOption) => void;
}) {
  return (
    <div
      id={listboxId}
      ref={listRef}
      className="max-h-72 overflow-y-auto p-1"
      role="listbox"
    >
      {!keyword && !isLoading ? (
        <p className="text-muted-foreground px-3 py-2 text-sm">
          输入代理人姓名或编码搜索
        </p>
      ) : null}

      {results.map((agent, index) => {
        const isSelected = String(agent.id) === value;

        return (
          <Button
            key={agent.id}
            data-agent-option-index={index}
            type="button"
            variant="ghost"
            className={cn(
              "h-auto w-full justify-start px-3 py-2 text-left",
              highlightedIndex === index && "bg-muted",
            )}
            role="option"
            aria-selected={isSelected}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onMouseEnter={() => {
              onHighlight(index);
            }}
            onClick={() => {
              onSelect(agent);
            }}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className="truncate">{formatAgentLabel(agent)}</span>
              {isSelected ? (
                <span className="text-muted-foreground text-xs">已选择</span>
              ) : null}
            </span>
          </Button>
        );
      })}

      {!isLoading && !!keyword && results.length === 0 ? (
        <p className="text-muted-foreground px-3 py-2 text-sm">
          未找到匹配代理人
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-muted-foreground px-3 py-2 text-sm">
          正在搜索...
        </p>
      ) : null}
    </div>
  );
}

function AgentSearchSelectPanel({
  panelRef,
  panelStyle,
  inputRef,
  keyword,
  placeholder,
  listboxId,
  listRef,
  results,
  value,
  isLoading,
  highlightedIndex,
  onKeywordChange,
  onSearchKeyDown,
  onHighlight,
  onSelect,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>;
  panelStyle: PanelStyle;
  inputRef: React.RefObject<HTMLInputElement | null>;
  keyword: string;
  placeholder: string;
  listboxId: string;
  listRef: React.RefObject<HTMLDivElement | null>;
  results: AgentOption[];
  value: string;
  isLoading: boolean;
  highlightedIndex: number;
  onKeywordChange: (value: string) => void;
  onSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onHighlight: (index: number) => void;
  onSelect: (agent: AgentOption) => void;
}) {
  return createPortal(
    <div
      ref={panelRef}
      className="bg-popover text-popover-foreground z-50 overflow-hidden rounded-lg border shadow-md"
      style={{
        position: "fixed",
        top: panelStyle.top,
        left: panelStyle.left,
        width: panelStyle.width,
      }}
    >
      <div className="border-b p-2">
        <Input
          ref={inputRef}
          value={keyword}
          onChange={(event) => {
            onKeywordChange(event.target.value);
          }}
          onKeyDown={onSearchKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      <AgentSearchSelectResults
        value={value}
        listboxId={listboxId}
        listRef={listRef}
        results={results}
        isLoading={isLoading}
        keyword={keyword.trim()}
        highlightedIndex={highlightedIndex}
        onHighlight={onHighlight}
        onSelect={onSelect}
      />
    </div>,
    document.body,
  );
}

export function AgentSearchSelect({
  name,
  value,
  onValueChange,
  searchAction,
  placeholder = "输入代理人姓名或编码搜索",
  required = false,
}: {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  searchAction: (input: {
    keyword?: string;
    agentId?: string;
  }) => Promise<AgentOption[]>;
  placeholder?: string;
  required?: boolean;
}) {
  const listboxId = useId();
  const [keyword, setKeyword] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentOption | null>(null);
  const [results, setResults] = useState<AgentOption[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [panelStyle, setPanelStyle] = useState<PanelStyle | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const deferredKeyword = useDeferredValue(keyword);
  const deferredKeywordTrimmed = deferredKeyword.trim();

  const resetSearch = useCallback(() => {
    setKeyword("");
    setResults([]);
    setHighlightedIndex(-1);
    setIsLoading(false);
  }, []);

  const updatePanelPosition = useCallback(() => {
    if (!rootRef.current) {
      return;
    }

    const rect = rootRef.current.getBoundingClientRect();
    setPanelStyle({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    resetSearch();
  }, [resetSearch]);

  const openDropdown = useCallback(() => {
    updatePanelPosition();
    setIsOpen(true);
  }, [updatePanelPosition]);

  useEffect(() => {
    if (!value) {
      const timeoutId = window.setTimeout(() => {
        setSelectedAgent(null);
        resetSearch();
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    if (String(selectedAgent?.id) === value) {
      return;
    }

    let cancelled = false;

    void searchAction({ agentId: value }).then((agents) => {
      const agent = agents[0];

      if (cancelled || !agent) {
        return;
      }

      setSelectedAgent(agent);
    });

    return () => {
      cancelled = true;
    };
  }, [resetSearch, searchAction, selectedAgent?.id, value]);

  useEffect(() => {
    if (!deferredKeywordTrimmed) {
      return;
    }

    let cancelled = false;

    void searchAction({ keyword: deferredKeywordTrimmed })
      .then((items) => {
        if (cancelled) return;

        startTransition(() => {
          setResults(items);
          setHighlightedIndex(items.length > 0 ? 0 : -1);
        });
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deferredKeywordTrimmed, searchAction]);

  const selectAgent = useCallback(
    (agent: AgentOption) => {
      setSelectedAgent(agent);
      onValueChange(String(agent.id));
      closeDropdown();
    },
    [closeDropdown, onValueChange],
  );

  const clearSelection = useCallback(() => {
    setSelectedAgent(null);
    onValueChange("");
    closeDropdown();
  }, [closeDropdown, onValueChange]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      closeDropdown();
      return;
    }

    openDropdown();
  }, [closeDropdown, isOpen, openDropdown]);

  const handleKeywordChange = useCallback(
    (nextKeyword: string) => {
      const nextKeywordTrimmed = nextKeyword.trim();
      setKeyword(nextKeyword);

      if (!nextKeywordTrimmed) {
        resetSearch();
        return;
      }

      setResults([]);
      setHighlightedIndex(-1);
      setIsLoading(true);
    },
    [resetSearch],
  );

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDropdown();
        return;
      }

      if (results.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((current) =>
          current < results.length - 1 ? current + 1 : 0,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((current) =>
          current > 0 ? current - 1 : results.length - 1,
        );
        return;
      }

      if (event.key !== "Enter") {
        return;
      }

      if (highlightedIndex < 0 || highlightedIndex >= results.length) {
        return;
      }

      event.preventDefault();
      selectAgent(results[highlightedIndex]);
    },
    [closeDropdown, highlightedIndex, results, selectAgent],
  );

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) {
      return;
    }

    const highlightedItem = listRef.current?.querySelector<HTMLElement>(
      `[data-agent-option-index="${highlightedIndex}"]`,
    );

    highlightedItem?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      updatePanelPosition();
      inputRef.current?.focus();
    });
    const handleViewportChange = () => {
      updatePanelPosition();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    const observer = new ResizeObserver(() => {
      updatePanelPosition();
    });

    if (rootRef.current) {
      observer.observe(rootRef.current);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      observer.disconnect();
    };
  }, [isOpen, updatePanelPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      closeDropdown();
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closeDropdown, isOpen]);

  return (
    <div ref={rootRef}>
      <input name={name} type="hidden" value={value} />

      <AgentSearchSelectTrigger
        isOpen={isOpen}
        listboxId={listboxId}
        required={required}
        selectedAgent={selectedAgent}
        onToggle={handleToggle}
        onClear={clearSelection}
      />

      {isOpen && panelStyle
        ? (
            <AgentSearchSelectPanel
              panelRef={panelRef}
              panelStyle={panelStyle}
              inputRef={inputRef}
              keyword={keyword}
              placeholder={placeholder}
              listboxId={listboxId}
              listRef={listRef}
              results={results}
              value={value}
              isLoading={isLoading}
              highlightedIndex={highlightedIndex}
              onKeywordChange={handleKeywordChange}
              onSearchKeyDown={handleSearchKeyDown}
              onHighlight={setHighlightedIndex}
              onSelect={selectAgent}
            />
          )
        : null}
    </div>
  );
}
