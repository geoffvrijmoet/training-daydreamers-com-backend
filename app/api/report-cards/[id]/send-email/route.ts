import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { sendEmail } from '@/lib/email';
import { ObjectId } from 'mongodb';
import { ReportCardEmail } from '@/emails/ReportCardEmail';
import React from 'react';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  const isTestEmail = body.isTestEmail === true;
  try {
    const { id } = params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report card id' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('training_daydreamers');

    // Fetch report card
    const reportCard = await db
      .collection('report_cards')
      .findOne({ _id: new ObjectId(id) });

    if (!reportCard) {
      return NextResponse.json(
        { success: false, error: 'Report card not found' },
        { status: 404 }
      );
    }

    // Fetch client to get email and additional contacts
    const clientDoc = await db
      .collection('clients')
      .findOne({ _id: new ObjectId(reportCard.clientId) });

    if (!clientDoc || !clientDoc.email) {
      return NextResponse.json(
        { success: false, error: 'Client email not found' },
        { status: 404 }
      );
    }

    // Collect all email recipients
    let emailRecipients: string[];
    
    if (isTestEmail) {
      // TEST EMAIL: Only send to dogtraining@daydreamersnyc.com
      emailRecipients = ['dogtraining@daydreamersnyc.com'];
      console.log('[RC EMAIL] TEST MODE: Only sending to dogtraining@daydreamersnyc.com');
    } else {
      // REAL EMAIL: Send to client, additional contacts, agency, and business email
      emailRecipients = [clientDoc.email, 'dogtraining@daydreamersnyc.com'];

      // Add additional contacts emails
      if (clientDoc.additionalContacts && Array.isArray(clientDoc.additionalContacts)) {
        for (const contact of clientDoc.additionalContacts) {
          if (contact.email && contact.email.trim()) {
            emailRecipients.push(contact.email.trim());
          }
        }
      }

      // Check if client has a dog training agency and add agency email
      if (clientDoc.agencyName) {
        const agencyDoc = await db
          .collection('dog_training_agencies')
          .findOne({ 
            name: clientDoc.agencyName,
            isActive: true
          });
        
        if (agencyDoc && agencyDoc.email && agencyDoc.email.trim()) {
          emailRecipients.push(agencyDoc.email.trim());
        }
      }
    }

    // ---------------- Mapping of option titles/descriptions ----------------
    const settings = await db.collection('settings').findOne({ type: 'training_options' });

    const optionMap: Record<string, { title: string; description: string }> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addToMap = (arr?: any[]) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        if (!item) continue;
        const payload = { title: item.title, description: item.description } as { title: string; description: string };
        // Map by any identifier we can find. Explicitly DO NOT require _id to exist so that
        // legacy records (pre-ObjectId migration) that only have `id` or `legacyId` still map.
        if (item._id) {
          const idStr = typeof item._id === 'object' && item._id.$oid ? item._id.$oid : item._id.toString();
          optionMap[idStr] = payload;
        }
        if (item.id) optionMap[item.id.toString()] = payload;
        if (item.legacyId) optionMap[item.legacyId.toString()] = payload;
      }
    };

    if (settings) {
      addToMap(settings.keyConcepts);
      addToMap(settings.gamesAndActivities);
      addToMap(settings.trainingSkills);
      addToMap(settings.homework);
      addToMap(settings.productRecommendations);
      if (Array.isArray(settings.customCategories)) {
        for (const cat of settings.customCategories) {
          addToMap(cat.items);
        }
      }
    }

    console.log('[RC EMAIL] optionMap keys count:', Object.keys(optionMap).length);

    // Helper function to extract first name
    const getFirstName = (fullName: string): string => {
      if (!fullName || typeof fullName !== 'string') return '';
      const trimmed = fullName.trim();
      return trimmed.split(' ')[0] || trimmed;
    };

    // Extract first names for greeting
    const clientFirstName = getFirstName(reportCard.clientName);
    const additionalContactFirstNames = (reportCard.additionalContacts || [])
      .map((contact: { name: string; email?: string; phone?: string }) => getFirstName(contact.name))
      .filter((name: string) => name.length > 0);

    // Format date for subject line - ensure it's interpreted as Eastern time
    const [year, month, day] = reportCard.date.split('-').map(Number);
    const easternDate = new Date(year, month - 1, day); // month is 0-indexed
    const formattedDate = easternDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Compose email
    const subject = isTestEmail 
      ? `[TEST] Training Report Card – ${reportCard.dogName} (${formattedDate})`
      : `Training Report Card – ${reportCard.dogName} (${formattedDate})`;

    // Build display-friendly groups (titles + descriptions) using optionMap
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const displayGroups = (reportCard.selectedItemGroups || []).map((group: any) => ({
      category: group.category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (group.items || []).map((it: any) => {
        const key = typeof it.itemId === 'object' && it.itemId?.$oid
          ? it.itemId.$oid
          : it.itemId?.toString?.();
        const base = (key && optionMap[key]) || { title: it.title || it.itemTitle || 'Unknown', description: '' };
        if (!optionMap[key]) {
          console.warn('[RC EMAIL] Unknown itemId not found in optionMap:', key);
        }
        return {
          title: base.title || it.title || it.itemTitle || 'Unknown',
          description: it.customDescription && it.customDescription.length > 0 ? it.customDescription : base.description,
        };
      }),
    }));

    // Build display-friendly product recommendations using optionMap
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const displayProductRecommendations = (reportCard.productRecommendationIds || []).map((id: any) => {
      const key = id?.toString?.();
      const option = (key && optionMap[key]);
      return option ? { title: option.title, description: option.description } : { title: 'Unknown', description: '' };
    });

    const { renderToStaticMarkup } = await import('react-dom/server');

    const bodyHtml = renderToStaticMarkup(
      React.createElement(ReportCardEmail, {
        clientName: clientFirstName,
        dogName: reportCard.dogName,
        date: reportCard.date,
        summary: reportCard.summary,
        selectedItemGroups: displayGroups,
        productRecommendations: displayProductRecommendations,
        shortTermGoals: reportCard.shortTermGoals || [],
        additionalContacts: additionalContactFirstNames.map((name: string) => ({ name })),
      })
    );

    // Remove duplicates and filter out empty emails
    const uniqueRecipients = Array.from(new Set(emailRecipients)).filter(email => email && email.trim());

    console.log(`[RC EMAIL] Sending to ${uniqueRecipients.length} recipients:`, uniqueRecipients);

    await sendEmail({
      to: uniqueRecipients,
      subject,
      html: bodyHtml,
      text: `${reportCard.summary ?? ''}`,
    });

    // Mark report card as emailed
    await db.collection('report_cards').updateOne(
      { _id: new ObjectId(id) },
      { $set: { emailSentAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending report card email:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
} 