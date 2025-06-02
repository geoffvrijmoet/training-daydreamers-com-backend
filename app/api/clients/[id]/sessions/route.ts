import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import CalendarTimeslot from '@/models/CalendarTimeslot';
import ReportCard from '@/models/ReportCard';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;

    // Validate ObjectId
    if (!clientId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
    }

    await connectDB();

    // Fetch sessions for this client and populate timeslot information
    const sessions = await Session.find({ clientId })
      .populate('calendarTimeslotId')
      .populate('packageInstanceId')
      .sort({ createdAt: -1 })
      .lean();

    // Get all session IDs to check for report cards
    const sessionIds = sessions.map(session => session._id?.toString()).filter(Boolean);
    
    // Find which sessions have report cards
    const reportCards = await ReportCard.find({
      sessionId: { $in: sessionIds }
    }).select('sessionId').lean();

    const sessionIdsWithReportCards = new Set(
      reportCards.map(rc => rc.sessionId?.toString()).filter(Boolean)
    );

    // Format sessions with additional information
    const formattedSessions = sessions.map(session => ({
      _id: session._id?.toString(),
      clientId: session.clientId,
      calendarTimeslot: {
        startTime: session.calendarTimeslotId?.startTime,
        endTime: session.calendarTimeslotId?.endTime,
        notes: session.calendarTimeslotId?.notes
      },
      status: session.status,
      quotedPrice: session.quotedPrice,
      sessionNotes: session.sessionNotes,
      isFirstSession: session.isFirstSession,
      packageInstanceId: session.packageInstanceId,
      hasReportCard: sessionIdsWithReportCards.has(session._id?.toString() || ''),
      createdAt: session.createdAt
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions
    });

  } catch (error) {
    console.error('Error fetching client sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 