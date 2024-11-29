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
  const { text, links } = formatHtmlContent(html);
  
  return (
    <span>
      {links.length > 0 ? (
        text.split('').map((char, i) => {
          const link = links.find(l => 
            l.text.includes(char) && 
            text.indexOf(l.text) <= i && 
            text.indexOf(l.text) + l.text.length > i
          );
          
          if (link) {
            return (
              <a 
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {char}
              </a>
            );
          }
          return char;
        })
      ) : (
        text
      )}
    </span>
  );
} 