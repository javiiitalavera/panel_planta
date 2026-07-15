"use client";

import { useEffect, useId, useRef, useState } from "react";
import { richTextForEditor, richTextIsEmpty } from "@/lib/rich-text";

type RichTextFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

const DEFAULT_TEXT_COLOR = "#334155";

export function RichTextField({
  label,
  value,
  placeholder,
  onChange,
}: RichTextFieldProps) {
  const id = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [empty, setEmpty] = useState(() => richTextIsEmpty(value));

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;

    const html = richTextForEditor(value);
    if (editor.innerHTML !== html) editor.innerHTML = html;
    setEmpty(richTextIsEmpty(value));
  }, [value]);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
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

  const applyCommand = (command: "bold" | "underline" | "foreColor" | "removeFormat", commandValue?: string) => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, commandValue);
    emitChange();
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

  return (
    <div className="block">
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-slate-700">
        {label}
      </label>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-slate-400 focus-within:ring-3 focus-within:ring-slate-100">
        <div className="flex h-9 items-center gap-1 border-b border-slate-100 bg-slate-50/80 px-2" role="toolbar" aria-label={`Formato de ${label}`}>
          <button
            type="button"
            title="Negrita"
            aria-label="Negrita"
            className="flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-[13px] font-bold text-slate-600 hover:bg-white hover:text-slate-950"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("bold")}
          >
            B
          </button>
          <button
            type="button"
            title="Subrayado"
            aria-label="Subrayado"
            className="flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-[13px] font-semibold text-slate-600 underline decoration-1 underline-offset-2 hover:bg-white hover:text-slate-950"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("underline")}
          >
            U
          </button>
          <div className="mx-1 h-5 w-px bg-slate-200" />
          <label className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-slate-600 hover:bg-white hover:text-slate-950" title="Color de letra">
            <span className="font-semibold">A</span>
            <span className="h-2.5 w-5 rounded-full border border-black/10" style={{ backgroundColor: textColor }} />
            <input
              type="color"
              value={textColor}
              className="absolute h-0 w-0 opacity-0"
              aria-label="Elegir color de letra"
              onMouseDown={saveSelection}
              onChange={(event) => {
                const color = event.target.value;
                setTextColor(color);
                applyCommand("foreColor", color);
              }}
            />
          </label>
          <button
            type="button"
            title="Quitar formato"
            className="ml-auto h-7 rounded-md px-2 text-[11px] font-medium text-slate-500 hover:bg-white hover:text-slate-800"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("removeFormat")}
          >
            Normal
          </button>
        </div>

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
          dangerouslySetInnerHTML={{ __html: richTextForEditor(value) }}
          onInput={emitChange}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onFocus={saveSelection}
          onBlur={saveSelection}
          onPaste={pastePlainText}
        />
      </div>
    </div>
  );
}
