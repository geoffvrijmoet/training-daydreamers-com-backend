"use client";
import { useState } from "react";
import Image from "next/image";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";

interface KeyConcept {
  title: string;
  description: string;
  category?: string;
}

interface PreviewProps {
  date: string;
  clientName?: string;
  dogName?: string;
  summary: string;
  selectedItems: {
    category: string;
    items: KeyConcept[];
  }[];
  productRecommendations: Array<string | { id: string; title: string }>;
  onEdit?: (category: string, itemTitle: string, description: string) => void;
  onUpdateDescription?: (category: string, itemTitle: string, newDesc: string) => void;
  shortTermGoals?: {
    title: string;
    description: string;
  }[];
}

// Helper function to safely render HTML content
function formatHtmlContent(html: string) {
  // First, create a temporary div to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get clean text
  const text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Get all links
  const links = Array.from(tempDiv.getElementsByTagName('a')).map(a => ({
    text: a.textContent || '',
    href: a.href
  }));
  
  return { text, links, html };
}

// Add helper function to get last name
function getLastName(fullName: string): string {
  const nameParts = fullName.trim().split(' ');
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
}

export function ReportCardPreview({
  date,
  clientName = "",
  dogName = "",
  summary,
  selectedItems,
  productRecommendations,
  shortTermGoals = [],
  onEdit,
  onUpdateDescription
}: PreviewProps) {
  const clientLastName = getLastName(clientName);
  
  return (
    <div className="border rounded-lg p-6 bg-white space-y-4 w-full max-w-2xl font-fredoka font-light">
      <div className="flex justify-center mb-6">
        <div className="relative h-[100px] w-full max-w-[400px]">
          <Image
            src="/images/report-card-training-transp-bg.png"
            alt="Daydreamers Dog Training"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <p>
          <span className="font-medium">Dog&apos;s Name:</span> {dogName} {clientLastName}
        </p>
        <p>
          <span className="font-medium">Date:</span> {date}
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">Summary:</p>
        <p className="whitespace-pre-wrap">{summary}</p>
      </div>

      {selectedItems.length > 0 && selectedItems.map(group => (
        <div key={group.category} className="space-y-2">
          <p className="font-medium">{group.category}:</p>
          <ul className="list-disc pl-5 space-y-1">
            {group.items.map((item, index) => {
              const { text, links, html } = formatHtmlContent(item.description);
              return (
                <EditableListItem
                  key={index}
                  category={group.category}
                  itemTitle={item.title}
                  description={item.description}
                  formattedText={text}
                  links={links}
                  htmlContent={html}
                  onUpdate={onUpdateDescription}
                />
              );
            })}
          </ul>
        </div>
      ))}

      {productRecommendations.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Product Recommendations:</p>
          <ul className="list-disc pl-5 space-y-1">
            {productRecommendations.map((product, index) => (
              <li key={index}>
                {typeof product === 'string' ? product : product.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {shortTermGoals.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Short Term Goals:</p>
          <div className="space-y-4">
            {shortTermGoals.map((goal, index) => (
              <div
                key={index}
                className="bg-[#F8FCFD] border-2 border-[#80CDDE] rounded-xl p-6"
              >
                <div className="font-medium">{goal.title}</div>
                <div className="text-gray-600 mt-1">{goal.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface EditableProps {
  category: string;
  itemTitle: string;
  description: string;
  formattedText: string;
  links: { text: string; href: string }[];
  htmlContent: string;
  onUpdate?: (category: string, itemTitle: string, newDesc: string) => void;
}

function EditableListItem({ category, itemTitle, description, formattedText, links, htmlContent, onUpdate }: EditableProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);

  if (editing) {
    return (
      <li className="border border-gray-300 rounded p-2 bg-white space-y-2">
        <RichTextEditor value={draft} onChange={setDraft} />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { onUpdate?.(category, itemTitle, draft); setEditing(false); }}>Save</Button>
          <Button size="sm" variant="outline" onClick={() => { setDraft(description); setEditing(false); }}>Cancel</Button>
        </div>
      </li>
    );
  }

  return (
    <li
      className="relative group cursor-pointer px-1 py-0.5 rounded border border-transparent hover:bg-red-50 hover:border-red-300 transition-colors"
      onClick={() => setEditing(true)}
    >
      <span className="font-medium underline decoration-dotted group-hover:decoration-solid">
        {itemTitle}
      </span>
      :{' '}
      <span 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        className="[&>p]:mb-3 [&>p:last-child]:mb-0"
      />
      <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-red-800 bg-red-100/70 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none select-none">
        click to edit
      </span>
    </li>
  );
} 