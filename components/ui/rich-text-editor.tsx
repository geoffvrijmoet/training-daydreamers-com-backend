import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
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
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Label } from './label';
import { Input } from './input';
import { useState, useCallback } from 'react';
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

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
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
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[8rem] px-3 py-2",
          "[&>ul]:list-disc [&>ul]:ml-4",
          "[&>ol]:list-decimal [&>ol]:ml-4",
          "[&_li]:pl-1",
          "[&_ul]:list-disc [&_ul]:ml-4",
          "[&_ol]:list-decimal [&_ol]:ml-4"
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
        </div>

        <EditorContent editor={editor} />

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

        {editor.isActive('link') && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => editor.chain().focus().unsetLink().run()}
            >
              Remove Link
            </Button>
          </BubbleMenu>
        )}

        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
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
              <Button onClick={setLink} disabled={!linkUrl}>
                Insert
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <ToastViewport />
      </div>
    </ToastProvider>
  );
} 