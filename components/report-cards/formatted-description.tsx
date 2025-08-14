"use client";

interface FormattedDescriptionProps {
  html: string;
}

function formatHtmlContent(html: string) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const text = tempDiv.textContent || tempDiv.innerText || '';
  
  const links = Array.from(tempDiv.getElementsByTagName('a')).map(a => ({
    text: a.textContent || '',
    href: a.href
  }));
  
  return { text, links };
}

export function FormattedDescription({ html }: FormattedDescriptionProps) {
  return (
    <span 
      dangerouslySetInnerHTML={{ __html: html }}
      className="[&>p]:mb-3 [&>p:last-child]:mb-0"
    />
  );
} 