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

    // Fetch client to get email
    const clientDoc = await db
      .collection('clients')
      .findOne({ _id: new ObjectId(reportCard.clientId) });

    if (!clientDoc || !clientDoc.email) {
      return NextResponse.json(
        { success: false, error: 'Client email not found' },
        { status: 404 }
      );
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

    // Compose email
    const subject = `Training Report Card – ${reportCard.dogName} (${reportCard.date})`;

    const summaryHtml = `<p style="margin:0 0 16px 0;">${reportCard.summary ?? ''}</p>`;

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

    const formattedDate = new Date(reportCard.date).toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const logoUrl = `${process.env.EMAIL_LOGO_URL || 'https://admin.training.daydreamersnyc.com/images/report-card-training-transp-bg.png'}`;

    const { renderToStaticMarkup } = await import('react-dom/server');

    const bodyHtml = renderToStaticMarkup(
      React.createElement(ReportCardEmail, {
        clientName: reportCard.clientName,
        dogName: reportCard.dogName,
        date: reportCard.date,
        summary: reportCard.summary,
        selectedItemGroups: displayGroups,
        shortTermGoals: reportCard.shortTermGoals || [],
      })
    );

    await sendEmail({
      to: clientDoc.email,
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