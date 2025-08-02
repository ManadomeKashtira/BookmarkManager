import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Palette,
  Image
} from 'lucide-react';
import type { MemoContent } from '@/types/bookmark';

interface RichTextEditorProps {
  content: MemoContent[];
  onChange: (content: MemoContent[]) => void;
  placeholder?: string;
  className?: string;
}

const fontFamilies = [
  { name: 'Default', value: 'inherit' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' }
];

const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const colors = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#a4c2f4', '#b4a7d6', '#d5a6bd'
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start typing your memo...",
  className = ""
}) => {
  const [currentFormatting, setCurrentFormatting] = useState<MemoContent['formatting']>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Convert content array to plain text for contentEditable
  const getContentText = () => {
    return content.map(block => block.content).join('\n');
  };

  // Convert plain text back to content array
  const parseContentFromText = (text: string): MemoContent[] => {
    const lines = text.split('\n');
    return lines.map(line => ({
      type: line.trim() === '' ? 'paragraph' : 'text',
      content: line,
      formatting: currentFormatting
    }));
  };

  // Initialize editor content when component mounts or content changes
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.textContent = getContentText();
      setIsInitialized(true);
    }
  }, [content, isInitialized]);

  // Update editor content when content prop changes (but not during user input)
  useEffect(() => {
    if (editorRef.current && isInitialized) {
      const currentText = editorRef.current.textContent || '';
      const contentText = getContentText();
      
      // Only update if the content has actually changed from external source
      if (currentText !== contentText) {
        editorRef.current.textContent = contentText;
      }
    }
  }, [content, isInitialized]);

  const applyFormat = (format: keyof NonNullable<MemoContent['formatting']>, value?: any) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    // For now, we'll apply formatting to the current formatting state
    // In a full implementation, you'd need to handle selection ranges
    setCurrentFormatting(prev => {
      if (format === 'bold' || format === 'italic' || format === 'underline' || format === 'strikethrough') {
        return { ...prev, [format]: value !== undefined ? value : !prev[format] };
      } else {
        return { ...prev, [format]: value };
      }
    });
  };

  const insertText = (text: string, type: MemoContent['type'] = 'text') => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      
      // Update content state
      const newText = editorRef.current.textContent || '';
      const newContent = parseContentFromText(newText);
      onChange(newContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      insertText('\n', 'paragraph');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  '); // Insert 2 spaces
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    const newContent = parseContentFromText(text);
    onChange(newContent);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-t-lg">
        {/* Text formatting */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => applyFormat('bold')}
            className={`p-2 rounded hover:bg-gray-200 ${currentFormatting?.bold ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            className={`p-2 rounded hover:bg-gray-200 ${currentFormatting?.italic ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('underline')}
            className={`p-2 rounded hover:bg-gray-200 ${currentFormatting?.underline ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Underline"
          >
            <Underline size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('strikethrough')}
            className={`p-2 rounded hover:bg-gray-200 ${currentFormatting?.strikethrough ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* Headings */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertText('', 'heading')}
            className="p-2 rounded hover:bg-gray-200"
            title="Heading 1"
          >
            <Heading1 size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertText('', 'heading')}
            className="p-2 rounded hover:bg-gray-200"
            title="Heading 2"
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertText('', 'heading')}
            className="p-2 rounded hover:bg-gray-200"
            title="Heading 3"
          >
            <Heading3 size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* Lists */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertText('• ', 'list-item')}
            className="p-2 rounded hover:bg-gray-200"
            title="Unordered List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertText('1. ', 'list-item')}
            className="p-2 rounded hover:bg-gray-200"
            title="Ordered List"
          >
            <ListOrdered size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* Font family */}
        <select
          onChange={(e) => setCurrentFormatting(prev => ({ ...prev, fontFamily: e.target.value }))}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          title="Font Family"
        >
          {fontFamilies.map(font => (
            <option key={font.value} value={font.value}>
              {font.name}
            </option>
          ))}
        </select>

        {/* Font size */}
        <select
          onChange={(e) => setCurrentFormatting(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          title="Font Size"
        >
          {fontSizes.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* Text color */}
        <div className="relative">
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200"
            title="Text Color"
          >
            <Palette size={16} />
          </button>
          <input
            type="color"
            onChange={(e) => setCurrentFormatting(prev => ({ ...prev, color: e.target.value }))}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {/* Background color */}
        <div className="relative">
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200"
            title="Background Color"
          >
            <Image size={16} />
          </button>
          <input
            type="color"
            onChange={(e) => setCurrentFormatting(prev => ({ ...prev, backgroundColor: e.target.value }))}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="min-h-[200px] p-4 border border-gray-200 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}; 