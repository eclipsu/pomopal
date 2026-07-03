"use client";

import { useCallback, useEffect, useRef } from "react";
import { Bold, Italic, Link, List, Underline } from "lucide-react";

function exec(command, value) {
  document.execCommand(command, false, value ?? undefined);
}

export default function RichTextEditor({ value, onChange, placeholder = "Write your message…" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const html = ref.current?.innerHTML ?? "";
    onChange(html === "<br>" ? "" : html);
  }, [onChange]);

  const addLink = () => {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
    handleInput();
  };

  const toolBtn =
    "p-2 rounded-md hover:bg-white/10 text-gray-300 disabled:opacity-40 transition-colors";

  return (
    <div className="rounded-lg border border-white/20 overflow-hidden bg-white/5">
      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
        <button type="button" className={toolBtn} onClick={() => { exec("bold"); handleInput(); }} title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" className={toolBtn} onClick={() => { exec("italic"); handleInput(); }} title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" className={toolBtn} onClick={() => { exec("underline"); handleInput(); }} title="Underline">
          <Underline className="w-4 h-4" />
        </button>
        <button type="button" className={toolBtn} onClick={() => { exec("insertUnorderedList"); handleInput(); }} title="Bullet list">
          <List className="w-4 h-4" />
        </button>
        <button type="button" className={toolBtn} onClick={addLink} title="Insert link">
          <Link className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={handleInput}
        className="min-h-[140px] px-3 py-3 text-sm text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 [&_a]:text-blue-400 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}
