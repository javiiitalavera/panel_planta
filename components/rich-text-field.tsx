"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Bold,
  Check,
  Palette,
  RemoveFormatting,
  Underline,
} from "@/components/icons";
import { richTextForEditor, richTextIsEmpty } from "@/lib/rich-text";

type RichTextFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

type FormatState = {
  bold: boolean;
  underline: boolean;
  color: string;
};

const DEFAULT_TEXT_COLOR = "#334155";
const TEXT_COLORS = [
  { name: "Normal", value: DEFAULT_TEXT_COLOR },
  { name: "Rojo", value: "#b42318" },
  { name: "Ámbar", value: "#b54708" },
  { name: "Verde", value: "#067647" },
  { name: "Azul", value: "#175cd3" },
  { name: "Morado", value: "#6941c6" },
];

const initialFormat: FormatState = {
  bold: false,
  underline: false,
  color: DEFAULT_TEXT_COLOR,
};

function normalizeBrowserColor(value: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();

  const rgb = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!rgb) return DEFAULT_TEXT_COLOR;

  return `#${rgb
    .slice(1, 4)
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function RichTextField({
  label,
  value,
  placeholder,
  onChange,
}: RichTextFieldProps) {
  const id = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [empty, setEmpty] = useState(() => richTextIsEmpty(value));
  const [focused, setFocused] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [format, setFormat] = useState<FormatState>(initialFormat);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;

    const html = richTextForEditor(value);
    if (editor.innerHTML !== html) editor.innerHTML = html;
    setEmpty(richTextIsEmpty(value));
  }, [value]);

  const updateFormatState = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    let color = DEFAULT_TEXT_COLOR;
    try {
      color = normalizeBrowserColor(document.queryCommandValue("foreColor") || DEFAULT_TEXT_COLOR);
    } catch {
      color = DEFAULT_TEXT_COLOR;
    }

    setFormat({
      bold: document.queryCommandState("bold"),
      underline: document.queryCommandState("underline"),
      color,
    });
  };

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
      updateFormatState();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const range = savedRangeRef.current;
    if (!range) return;

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const emitChange = () => {
    const html = editorRef.current?.innerHTML ?? "";
    setEmpty(richTextIsEmpty(html));
    onChange(html);
    saveSelection();
  };

  const applyCommand = (
    command: "bold" | "underline" | "foreColor" | "removeFormat",
    commandValue?: string,
  ) => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, commandValue);
    emitChange();
    updateFormatState();
  };

  const pastePlainText = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    const safeHtml = text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replace(/\r?\n/g, "<br>");
    document.execCommand("insertHTML", false, safeHtml);
    emitChange();
  };

  const toolbarButtonClass = (active = false) =>
    `flex h-7 w-7 items-center justify-center rounded-md transition ${
      active
        ? "bg-slate-200 text-slate-900"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div
      className="group/rich-field relative block"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setFocused(false);
        setColorOpen(false);
      }}
    >
      <div className="mb-1.5 flex min-h-7 items-center justify-between gap-3">
        <label htmlFor={id} className="block text-[12px] font-semibold text-slate-700">
          {label}
        </label>

        <div
          role="toolbar"
          aria-label={`Formato de ${label}`}
          className={`flex items-center gap-0.5 transition duration-150 ${
            focused ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <button
            type="button"
            title="Negrita"
            aria-label="Negrita"
            aria-pressed={format.bold}
            className={toolbarButtonClass(format.bold)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("bold")}
          >
            <Bold size={15} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            title="Subrayado"
            aria-label="Subrayado"
            aria-pressed={format.underline}
            className={toolbarButtonClass(format.underline)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("underline")}
          >
            <Underline size={15} strokeWidth={2.2} />
          </button>

          <div className="relative">
            <button
              type="button"
              title="Color de letra"
              aria-label="Color de letra"
              aria-expanded={colorOpen}
              className={toolbarButtonClass(colorOpen)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                saveSelection();
                setColorOpen((value) => !value);
              }}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <Palette size={15} strokeWidth={2} />
                <span
                  className="absolute bottom-0 h-0.5 w-4 rounded-full"
                  style={{ backgroundColor: format.color }}
                />
              </span>
            </button>

            {colorOpen && (
              <div className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Color de letra
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {TEXT_COLORS.map((color) => {
                    const selected = format.color.toLowerCase() === color.value.toLowerCase();
                    return (
                      <button
                        key={color.value}
                        type="button"
                        title={color.name}
                        aria-label={color.name}
                        aria-pressed={selected}
                        className="relative flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          applyCommand("foreColor", color.value);
                          setFormat((current) => ({ ...current, color: color.value }));
                          setColorOpen(false);
                        }}
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: color.value }}
                        />
                        {selected && (
                          <Check
                            size={10}
                            strokeWidth={3}
                            className="absolute text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <span className="mx-1 h-4 w-px bg-slate-200" />
          <button
            type="button"
            title="Quitar formato"
            aria-label="Quitar formato"
            className={toolbarButtonClass()}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("removeFormat")}
          >
            <RemoveFormatting size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-xl border bg-white transition ${
          focused
            ? "border-slate-400 ring-3 ring-slate-100"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div
          ref={editorRef}
          id={id}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          data-empty={empty ? "true" : "false"}
          className="rich-editor custom-scrollbar min-h-[86px] max-h-[260px] overflow-y-auto px-3.5 py-3 text-[14px] leading-5 text-slate-800 outline-none"
          onInput={emitChange}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onFocus={() => {
            setFocused(true);
            saveSelection();
          }}
          onBlur={saveSelection}
          onPaste={pastePlainText}
        />
      </div>
    </div>
  );
}
