import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Editor, getMarkRange } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from './button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  RemoveFormatting,
  FileUp,
  Loader2,
  IndentIcon,
  OutdentIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Label } from './label';
import { Input } from './input';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
} from "./toast";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const removeLineBreaks = (editor: Editor) => {
  const { from, to } = editor.state.selection;
  const text = editor.state.doc.textBetween(from, to);
  const newText = text.replace(/[\n\r\s]+/g, ' ').trim();
  
  editor.chain()
    .focus()
    .deleteSelection()
    .insertContent(newText)
    .run();
};

function RemoveLineBreaksIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 6H3M3 12h18M3 18h18" />
      <line x1="4" y1="2" x2="20" y2="22" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDialogMode, setLinkDialogMode] = useState<'insert' | 'edit'>('insert');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    isUploading: boolean;
    fileName: string;
    progress: 'uploading' | 'success' | 'error';
    message?: string;
  }>({
    isUploading: false,
    fileName: '',
    progress: 'uploading',
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc ml-4',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-decimal ml-4',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'pl-1',
          },
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        autolink: true,
        linkOnPaste: true,
        validate: href => /^https?:\/\//.test(href),
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[8rem] px-3 py-2",
          "[&>ul]:list-disc [&>ul]:ml-4",
          "[&>ol]:list-decimal [&>ol]:ml-4",
          "[&_li]:pl-1",
          "[&_ul_ul]:list-circle [&_ul_ul]:ml-4",
          "[&_ul_ul_ul]:list-square [&_ul_ul_ul]:ml-4",
          "[&_ol_ol]:ml-4",
          "[&_ol_ul]:list-disc [&_ol_ul]:ml-4",
          "[&_ul_ol]:list-decimal [&_ul_ol]:ml-4",
          "[&_a]:text-blue-500 [&_a]:no-underline hover:[&_a]:underline"
        ),
      },
    },
  });

  if (!editor) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editor.state.selection.empty) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (editor.state.selection.empty) {
      alert('Please select some text first');
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (editor.state.selection.empty) {
      alert('Please select some text first');
      return;
    }

    setUploadStatus({
      isUploading: true,
      fileName: file.name,
      progress: 'uploading',
      message: 'Starting upload...'
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      setUploadStatus(prev => ({
        ...prev,
        message: 'Uploading to Google Drive...'
      }));

      const response = await fetch('/api/upload-resource', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload file');
      }

      editor
        .chain()
        .focus()
        .setLink({ href: data.webViewLink })
        .run();

      setUploadStatus(prev => ({
        ...prev,
        progress: 'success',
        message: 'File uploaded successfully!'
      }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus({
          isUploading: false,
          fileName: '',
          progress: 'uploading',
        });
      }, 3000);

    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus(prev => ({
        ...prev,
        progress: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload file'
      }));
    }
  };

  const setLink = () => {
    if (!linkUrl) return;

    if (editor.state.selection.empty) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      editor
        .chain()
        .focus()
        .setLink({ href: linkUrl })
        .run();
    }

    setLinkUrl('');
    setShowLinkDialog(false);
  };

  return (
    <ToastProvider>
      <div 
        className="border rounded-md overflow-hidden relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100, delay: [0, 0], appendTo: () => document.body, interactive: true }}
          shouldShow={({ editor, from, to }) => {
            // Only show when there's a text selection and no link
            return from !== to && !editor.isActive('link');
          }}
        >
          <Button
            variant="dark"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => { setLinkDialogMode('insert'); setShowLinkDialog(true); }}
          >
            <LinkIcon className="h-4 w-4" />
            Insert Link
          </Button>
        </BubbleMenu>

        <div className="border-b bg-gray-50 p-2 flex gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            type="button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            type="button"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
            type="button"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLinkDialog(true)}
            className={editor.isActive('link') ? 'bg-gray-200' : ''}
            type="button"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            type="button"
          >
            <RemoveFormatting className="h-4 w-4" />
          </Button>
          <div className="relative">
            <label
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer",
                "hover:bg-gray-200 transition-colors",
                uploadStatus.isUploading && "opacity-50 cursor-not-allowed",
                editor.isActive('link') && 'bg-gray-200'
              )}
            >
              {uploadStatus.isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = '';
                }}
                disabled={uploadStatus.isUploading}
              />
            </label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
            disabled={!editor.can().sinkListItem('listItem')}
            className={editor.isActive('listItem') ? 'bg-gray-200' : ''}
            type="button"
            title="Increase indent"
          >
            <IndentIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().liftListItem('listItem').run()}
            disabled={!editor.can().liftListItem('listItem')}
            className={editor.isActive('listItem') ? 'bg-gray-200' : ''}
            type="button"
            title="Decrease indent"
          >
            <OutdentIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor && removeLineBreaks(editor)}
            className="h-8 w-8 p-0"
            title="Remove Line Breaks"
          >
            <RemoveLineBreaksIcon className="h-4 w-4" />
          </Button>
        </div>

        <EditorContent 
          editor={editor} 
          onMouseOver={(e) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            const linkEl = target.closest('a');
            if (!linkEl) return;
            try {
              const view = editor.view;
              const pos = view.posAtDOM(linkEl, 0);
              const $pos = view.state.doc.resolve(pos);
              const range = getMarkRange($pos, editor.schema.marks.link);
              if (range && (view.state.selection.from !== range.from || view.state.selection.to !== range.to)) {
                editor.chain().setTextSelection(range).run();
              }
            } catch {
              // Ignore mapping errors during transient re-renders
            }
          }}
        />

        {isDragging && !editor.state.selection.empty && (
          <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg text-center">
              <FileUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">Drop file to upload and link</p>
            </div>
          </div>
        )}

        {uploadStatus.isUploading && (
          <div className="absolute bottom-4 right-4">
            <Toast>
              <div className="flex items-center gap-2">
                {uploadStatus.progress === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <div>
                  <ToastTitle>
                    {uploadStatus.progress === 'uploading' && 'Uploading...'}
                    {uploadStatus.progress === 'success' && 'Upload Complete'}
                    {uploadStatus.progress === 'error' && 'Upload Failed'}
                  </ToastTitle>
                  <ToastDescription className="text-sm">
                    {uploadStatus.fileName && (
                      <span className="font-medium">{uploadStatus.fileName}</span>
                    )}
                    {uploadStatus.message && (
                      <span className="block text-xs mt-1">{uploadStatus.message}</span>
                    )}
                  </ToastDescription>
                </div>
              </div>
            </Toast>
          </div>
        )}

        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100, delay: [0, 0], appendTo: () => document.body, interactive: true }}
          shouldShow={({ editor }) => editor.isActive('link')}
        >
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="hover:bg-gray-600"
              onClick={() => {
                const currentHref = editor.getAttributes('link')?.href || '';
                setLinkUrl(currentHref);
                setLinkDialogMode('edit');
                setShowLinkDialog(true);
              }}
            >
              Change Link
            </Button>
          </div>
        </BubbleMenu>

        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{linkDialogMode === 'edit' ? 'Change Link' : 'Insert Link'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={setLink} disabled={!linkUrl}>
                  {linkDialogMode === 'edit' ? 'Update' : 'Insert'}
                </Button>
                {linkDialogMode === 'edit' && (
                  <Button
                    variant="outline"
                    className="text-red-700 border-red-300 hover:bg-red-100"
                    onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkDialog(false); }}
                  >
                    Remove Link
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ToastViewport />
      </div>
    </ToastProvider>
  );
} 