'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Trash2,
  Code,
  Undo,
  Redo,
  Sparkles
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write description here...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Set initial value on mount
  useEffect(() => {
    setIsMounted(true);
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Update innerHTML only if value changes from outside (e.g., loaded from API)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Avoid resetting cursor if the active element is this editor and text matches
      if (document.activeElement === editorRef.current) {
        // Strip carriage returns or subtle whitespace differences
        const currentHTML = editorRef.current.innerHTML.replace(/\s+/g, '');
        const targetHTML = value.replace(/\s+/g, '');
        if (currentHTML !== targetHTML) {
          editorRef.current.innerHTML = value;
        }
      } else {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const executeCommand = (command: string, arg: string = '') => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, arg);
      handleInput();
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If editor is empty (e.g. only <br>), send empty string
      if (html === '<br>' || html === '<div><br></div>' || html === '') {
        onChange('');
      } else {
        onChange(html);
      }
    }
  };

  const addLink = () => {
    const url = prompt('Enter link URL (e.g. https://google.com):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  return (
    <div className="rte-container">
      <style>{`
        .rte-container {
          width: 100%;
          border: 1px solid var(--c-border, rgba(143, 122, 112, 0.2));
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
          font-family: inherit;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .rte-container:focus-within {
          border-color: var(--c-accent, #8F7A70);
          box-shadow: 0 0 0 3px rgba(143, 122, 112, 0.15);
        }
        .rte-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: var(--c-soft, #F2EDE8);
          border-bottom: 1px solid var(--c-border, rgba(143, 122, 112, 0.15));
        }
        .rte-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          border: none;
          background: transparent;
          color: var(--c-dark, #1A1614);
          cursor: pointer;
          transition: 0.2s;
        }
        .rte-btn:hover {
          background: rgba(143, 122, 112, 0.18);
          color: var(--c-gold, #8F7A70);
        }
        .rte-select {
          height: 34px;
          padding: 0 10px;
          border-radius: 4px;
          border: 1px solid var(--c-border, rgba(143, 122, 112, 0.2));
          background: #fff;
          font-size: 12px;
          font-weight: 600;
          color: var(--c-dark, #1A1614);
          cursor: pointer;
        }
        .rte-editor {
          min-height: 380px;
          max-height: 75vh;
          overflow-y: auto;
          resize: vertical;
          padding: 24px 26px;
          outline: none;
          font-size: 15px;
          line-height: 1.8;
          color: var(--c-dark, #1A1614);
          background: #fff;
        }
        .rte-editor:focus {
          box-shadow: inset 0 0 0 2px rgba(143, 122, 112, 0.35);
        }
        .rte-editor:empty:before {
          content: attr(data-placeholder);
          color: rgba(26, 22, 20, 0.35);
        }
        .rte-editor p { margin: 0 0 12px; }
        .rte-editor h1 { font-size: 28px; line-height: 1.25; font-weight: 700; margin: 4px 0 12px; }
        .rte-editor h2 { font-size: 22px; line-height: 1.3; font-weight: 700; margin: 4px 0 10px; }
        .rte-editor h3 { font-size: 18px; line-height: 1.35; font-weight: 600; margin: 4px 0 8px; }
        .rte-editor ul {
          list-style-type: disc;
          padding-left: 22px;
          margin-bottom: 12px;
        }
        .rte-editor ol {
          list-style-type: decimal;
          padding-left: 22px;
          margin-bottom: 12px;
        }
        .rte-editor b, .rte-editor strong {
          font-weight: bold;
        }
        .rte-editor i, .rte-editor em {
          font-style: italic;
        }
      `}</style>
      <div className="rte-toolbar">
        <button type="button" className="rte-btn" onClick={() => executeCommand('bold')} title="Bold">
          <Bold size={15} strokeWidth={2.2} />
        </button>
        <button type="button" className="rte-btn" onClick={() => executeCommand('italic')} title="Italic">
          <Italic size={15} strokeWidth={2.2} />
        </button>
        <button type="button" className="rte-btn" onClick={() => executeCommand('underline')} title="Underline">
          <Underline size={15} strokeWidth={2.2} />
        </button>
        <button type="button" className="rte-btn" onClick={() => executeCommand('strikeThrough')} title="Strikethrough">
          <Strikethrough size={15} strokeWidth={2.2} />
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(143, 122, 112, 0.2)', margin: '0 4px' }} />

        <button type="button" className="rte-btn" onClick={() => executeCommand('insertUnorderedList')} title="Bullet List">
          <List size={15} />
        </button>
        <button type="button" className="rte-btn" onClick={() => executeCommand('insertOrderedList')} title="Numbered List">
          <ListOrdered size={15} />
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(143, 122, 112, 0.2)', margin: '0 4px' }} />

        <select 
          className="rte-select" 
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') executeCommand('formatBlock', '<p>');
            else if (val === 'h1') executeCommand('formatBlock', '<h1>');
            else if (val === 'h2') executeCommand('formatBlock', '<h2>');
            else if (val === 'h3') executeCommand('formatBlock', '<h3>');
            else if (val === 'small') {
              executeCommand('fontSize', '2');
            } else if (val === 'big') {
              executeCommand('fontSize', '5');
            } else if (val === 'normal') {
              executeCommand('fontSize', '3');
            }
            e.target.value = ''; // Reset selector
          }}
          title="Format text"
        >
          <option value="">Text Size / Header</option>
          <option value="p">Paragraph</option>
          <option value="h1">Header 1 (Huge)</option>
          <option value="h2">Header 2 (Large)</option>
          <option value="h3">Header 3 (Medium)</option>
          <option value="big">Big Font</option>
          <option value="normal">Normal Font</option>
          <option value="small">Small Font</option>
        </select>

        <div style={{ width: 1, height: 20, background: 'rgba(143, 122, 112, 0.2)', margin: '0 4px' }} />

        <button type="button" className="rte-btn" onClick={addLink} title="Add Link">
          <LinkIcon size={15} />
        </button>
        <button type="button" className="rte-btn" onClick={() => executeCommand('removeFormat')} title="Clear Formatting">
          <Trash2 size={15} />
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(143, 122, 112, 0.2)', margin: '0 4px' }} />

        <button type="button" className="rte-btn" onClick={() => executeCommand('undo')} title="Undo">
          <Undo size={15} />
        </button>
        <button type="button" className="rte-btn" onClick={() => executeCommand('redo')} title="Redo">
          <Redo size={15} />
        </button>
      </div>
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable={isMounted}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={(e) => {
          // Enter must insert a newline inside the editor — never let it
          // bubble up to a form-level handler that submits/swallows it.
          if (e.key === 'Enter') e.stopPropagation();
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
