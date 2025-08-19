import React from 'react';

export interface ReportCardEmailProps {
  clientName: string;
  dogName: string;
  date: string; // YYYY-MM-DD
  summary: string;
  selectedItemGroups: Array<{
    category: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  }>;
  shortTermGoals?: Array<{
    title: string;
    description: string;
  }>;
  additionalContacts?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
}

export function ReportCardEmail({
  clientName,
  dogName,
  date,
  summary,
  selectedItemGroups,
  shortTermGoals = [],
  additionalContacts = [],
}: ReportCardEmailProps) {
  // Format date - ensure it's interpreted as Eastern time
  const [year, month, day] = date.split('-').map(Number);
  const easternDate = new Date(year, month - 1, day); // month is 0-indexed
  const formattedDate = easternDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const containerStyle: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#111111',
    lineHeight: 1.5,
    maxWidth: 680,
    margin: '0 auto',
  };

  const h2Style: React.CSSProperties = {
    margin: '24px 0 8px 0',
    fontSize: 20,
    fontWeight: 700,
  };

  const h3Style: React.CSSProperties = {
    margin: '16px 0 8px 0',
    fontSize: 16,
    fontWeight: 600,
  };

  const liStyle: React.CSSProperties = { marginBottom: 8 };
  const ulStyle: React.CSSProperties = {
    margin: '0 0 0 20px',
    padding: 0,
    listStyleType: 'disc',
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={process.env.EMAIL_LOGO_URL || 'https://admin.training.daydreamersnyc.com/images/report-card-training-transp-bg.png'}
          alt="Daydreamers Dog Training"
          style={{ maxWidth: 500, height: 'auto' }}
        />
      </div>

      <p style={{ margin: '0 0 16px 0' }}>
        Hi {clientName}
        {additionalContacts.length > 0 && (
          <>
            {additionalContacts.length === 1 ? ' and ' : ', '}
            {additionalContacts.map((contact, index) => {
              if (index === additionalContacts.length - 1 && additionalContacts.length > 1) {
                return ` and ${contact.name}`;
              }
              return contact.name + (index < additionalContacts.length - 2 ? ', ' : '');
            }).join('')}
          </>
        )}
        ,
      </p>
      <p style={{ margin: '0 0 24px 0' }}>
        Here is the report card for your recent training session on{' '}
        <strong>{formattedDate}</strong>.
      </p>

      <h2 style={h2Style}>Summary</h2>
      <div 
        style={{ margin: '0 0 16px 0' }}
        dangerouslySetInnerHTML={{ 
          __html: summary
            .replace(/<p>/g, '<p style="margin: 0 0 12px 0; padding: 0;">')
            .replace(/<ul>/g, '<ul style="margin: 0 0 12px 0; padding-left: 20px; list-style-type: disc;">')
            .replace(/<ol>/g, '<ol style="margin: 0 0 12px 0; padding-left: 20px; list-style-type: decimal;">')
            .replace(/<a /g, '<a style="color: #3b82f6; text-decoration: underline;" ')
        }}
      />

      {selectedItemGroups.map((group) => (
        <div key={group.category}>
          <h3 style={h3Style}>{group.category}</h3>
          <ul style={ulStyle}>
            {group.items.map((item, idx) => {
              return (
                <li key={idx} style={liStyle}>
                  <strong>{item.title}</strong>: <span 
                    dangerouslySetInnerHTML={{ 
                      __html: (item.description || '')
                        .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
                        .replace(/<p><\/p>/g, '') // Remove empty paragraphs (no whitespace)
                        .replace(/<p>/g, '<p style="margin: 0 0 12px 0; padding: 0;">')
                    }} 
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {shortTermGoals.length > 0 && (
        <>
          <h2 style={h2Style}>Short Term Goals</h2>
          <ul style={ulStyle}>
            {shortTermGoals.map((goal, idx) => (
              <li key={idx} style={liStyle}>
                <strong>{goal.title}</strong>: {goal.description}
              </li>
            ))}
          </ul>
        </>
      )}

      <p style={{ marginTop: 32 }}>
        Thank you!
        <br />
        Madeline
      </p>
    </div>
  );
} 