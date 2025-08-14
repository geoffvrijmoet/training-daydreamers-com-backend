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
}

export function ReportCardEmail({
  clientName,
  dogName,
  date,
  summary,
  selectedItemGroups,
  shortTermGoals = [],
}: ReportCardEmailProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
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

      <p style={{ margin: '0 0 16px 0' }}>Hi {clientName},</p>
      <p style={{ margin: '0 0 24px 0' }}>
        Here is the report card for your recent training session on{' '}
        <strong>{formattedDate}</strong>.
      </p>

      <h2 style={h2Style}>Summary</h2>
      <div 
        style={{ margin: '0 0 16px 0' }}
        dangerouslySetInnerHTML={{ 
          __html: summary.split('\n').map(paragraph => 
            paragraph.trim() ? `<p style="margin: 0 0 12px 0;">${paragraph}</p>` : ''
          ).join('')
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