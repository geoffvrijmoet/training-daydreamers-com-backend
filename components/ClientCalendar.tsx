'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfDay, parseISO, addHours, setHours, isBefore, isAfter, differenceInCalendarDays } from 'date-fns';

interface TimeslotEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: {
    isAvailable: boolean;
    isOwnBooking?: boolean;
    notes?: string;
    sessionId?: string;
    clientId?: string;
    packageInstanceId?: string;
    repeatingSeriesId?: string;
  };
}

interface HourSlot {
  parentId: string; // original calendarTimeslot _id
  startISO: string; // start of this 1-hour slot
  endISO: string;   // end of this 1-hour slot
  isAvailable: boolean;
  isOwnBooking: boolean;
}

interface ClientCalendarProps {
  clientId: string;
  clientName: string;
  dogName: string;
}

export default function ClientCalendar({ clientId, clientName, dogName }: ClientCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeslots, setTimeslots] = useState<TimeslotEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHourSlot, setSelectedHourSlot] = useState<HourSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const fetchTimeslots = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const viewStart = startOfDay(currentDate);
      const viewEnd   = addDays(viewStart, 6);
      
      const response = await fetch(`/api/portal/calendar-timeslots?start=${viewStart.toISOString()}&end=${viewEnd.toISOString()}&clientId=${clientId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch timeslots');
      }
      
      if (data.success) {
        // Now includes both available timeslots and this client's booked timeslots
        setTimeslots(data.events);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeslots();
  }, [currentDate]);

  useEffect(()=>{ setExpandedDays({}); }, [currentDate.getTime()]);

  const handleBookTimeslot = async (slot: HourSlot) => {
    setIsBooking(true);
    setError('');
    
    try {
      const response = await fetch('/api/portal/book-timeslot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeslotId: slot.parentId,
          clientId,
          clientName,
          dogName,
          selectedStartTime: slot.startISO,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book timeslot');
      }
      
      if (data.success) {
        setBookingSuccess(true);
        setSelectedHourSlot(null);
        fetchTimeslots(); // Refresh the calendar
        
        // Clear success message after 3 seconds
        setTimeout(() => setBookingSuccess(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book session');
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (timeString: string) => {
    const date = parseISO(timeString);
    return format(date, 'h:mm a');
  };

  const formatDate = (timeString: string) => {
    const date = parseISO(timeString);
    return format(date, 'EEEE, MMM d');
  };

  // Expand raw timeslots into 1-hour HourSlots and memoise
  const hourSlots = useMemo(() => {
    const slots: HourSlot[] = [];
    timeslots.forEach(evt => {
      const start = parseISO(evt.start);
      const end   = parseISO(evt.end);
      const loopEnd = end;
      let pointer = start;
      const pushSlot = (s: Date) => {
        const e = addHours(s, 1);
        slots.push({
          parentId: evt.id,
          startISO: s.toISOString(),
          endISO: e.toISOString(),
          isAvailable: evt.extendedProps.isAvailable,
          isOwnBooking: !!evt.extendedProps.isOwnBooking,
        });
      };
      while (pointer < loopEnd) {
        if (addHours(pointer,1) > loopEnd) break; // last slot must fit fully
        pushSlot(pointer);
        pointer = addHours(pointer,1);
      }
    });
    return slots;
  }, [timeslots]);

  // Group by day for rendering
  const hourSlotsByDay = useMemo(() => {
    const grouped: Record<string, HourSlot[]> = {};
    hourSlots.forEach(s => {
      const key = format(parseISO(s.startISO), 'yyyy-MM-dd');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });
    // sort
    Object.values(grouped).forEach(arr => arr.sort((a,b)=> new Date(a.startISO).getTime() - new Date(b.startISO).getTime()));
    return grouped;
  }, [hourSlots]);

  const goToPreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleDay = (dayKey:string) => setExpandedDays(prev=>({ ...prev, [dayKey]: !prev[dayKey] }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your training sessions...</p>
        </div>
      </div>
    );
  }

  const viewStart = startOfDay(currentDate);
  const viewEnd   = addDays(viewStart,6);

  const daysToRender = Array.from({length:7},(_,i)=> addDays(viewStart,i));

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-purple-700">Your Training Sessions</h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors font-medium"
          >
            Today
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-lg font-medium text-purple-700">
            {format(viewStart, 'MMM d')} - {format(viewEnd, 'MMM d, yyyy')}
          </span>
          
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Success message */}
      {bookingSuccess && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-700 font-medium">Session booked successfully!</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Hourly timeline per day */}
      <div className="space-y-4">
        {daysToRender.map(dateObj=>{
          const dayKey = format(dateObj,'yyyy-MM-dd');
          const daySlots = hourSlotsByDay[dayKey] || [];
          const availableCount = daySlots.filter(s=>s.isAvailable).length;
          return (
            <div key={dayKey} className="bg-white rounded-lg shadow-sm border border-blue-200">
              <button type="button" onClick={()=> daySlots.length && toggleDay(dayKey)} className="w-full text-left bg-purple-100 px-4 py-3 border-b border-purple-200 flex items-center justify-between focus:outline-none">
                <span className="font-semibold text-purple-800">
                  {format(dateObj,'EEEE, MMM d')}
                </span>
                {daySlots.length > 0 && (
                  <svg className={`w-4 h-4 ml-2 transform transition-transform ${expandedDays[dayKey]? 'rotate-180':'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {daySlots.length === 0 ? (
                <div className="p-6 text-center text-gray-500 bg-gray-50">No availability</div>
              ) : expandedDays[dayKey] ? (
                (()=>{
                  // determine display hour range
                  const hours = daySlots.map(s=> new Date(s.startISO).getHours());
                  const minHr = Math.max(0, Math.min(...hours) - 2);
                  const maxHr = Math.min(23, Math.max(...hours) + 2);
                  const totalRows = maxHr - minHr + 1;
                  return (
                    <div className="relative flex flex-col px-6 py-4" style={{height: `${totalRows*44}px`}}>
                      {Array.from({length: totalRows}, (_,idx)=> minHr + idx).map(hr=>{
                        const slot = daySlots.find(s=> new Date(s.startISO).getHours()===hr);
                        const top = (hr-minHr)*44;
                        return (
                          <div key={hr} className="absolute left-0 right-0" style={{top, height:'44px'}}>
                            <div className="flex items-center h-full">
                              <div className="w-20 text-right pr-4 text-sm text-gray-500 select-none">
                                {format(setHours(new Date(dateObj),hr),'h a')}
                              </div>
                              <div className={`flex-1 h-10 rounded-md cursor-pointer ${slot? (slot.isAvailable? 'bg-green-100 hover:bg-green-200':'bg-blue-200') : 'bg-gray-100'} `}
                                onClick={()=>{
                                  if(!slot||!slot.isAvailable) return;
                                  setSelectedHourSlot(slot);
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <button type="button" onClick={()=>toggleDay(dayKey)} className="w-full p-6 text-center font-medium focus:outline-none bg-green-50 text-green-700 hover:bg-green-100">
                  {availableCount} available
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Booking confirmation modal */}
      {selectedHourSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-700 mb-4">Confirm Booking</h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-medium text-purple-700">Date: </span>
                <span className="text-gray-900">{format(parseISO(selectedHourSlot.startISO), 'EEEE, MMM d')}</span>
              </div>
              <div>
                <span className="font-medium text-purple-700">Time: </span>
                <span className="text-gray-900">{format(parseISO(selectedHourSlot.startISO), 'h:mm a')} - {format(parseISO(selectedHourSlot.endISO), 'h:mm a')}</span>
              </div>
              <div>
                <span className="font-medium text-purple-700">Client: </span>
                <span className="text-gray-900">{clientName}</span>
              </div>
              <div>
                <span className="font-medium text-purple-700">Dog: </span>
                <span className="text-gray-900">{dogName}</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedHourSlot(null)}
                disabled={isBooking}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedHourSlot && handleBookTimeslot(selectedHourSlot)}
                disabled={isBooking}
                className="flex-1 px-4 py-2 bg-purple-300 text-white rounded-md hover:bg-purple-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium shadow-sm"
              >
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 