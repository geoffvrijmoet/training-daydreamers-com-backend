'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, startOfDay, endOfDay, isSameDay, parseISO } from 'date-fns';

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
  const [selectedTimeslot, setSelectedTimeslot] = useState<TimeslotEvent | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchTimeslots = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const startDate = startOfWeek(currentDate);
      const endDate = endOfWeek(addDays(currentDate, 14)); // Show 2-3 weeks ahead
      
      const response = await fetch(`/api/portal/calendar-timeslots?start=${startDate.toISOString()}&end=${endDate.toISOString()}&clientId=${clientId}`);
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

  const handleBookTimeslot = async (timeslot: TimeslotEvent) => {
    setIsBooking(true);
    setError('');
    
    try {
      const response = await fetch('/api/portal/book-timeslot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeslotId: timeslot.id,
          clientId,
          clientName,
          dogName,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book timeslot');
      }
      
      if (data.success) {
        setBookingSuccess(true);
        setSelectedTimeslot(null);
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

  const groupTimeslotsByDay = () => {
    const grouped: { [key: string]: TimeslotEvent[] } = {};
    
    timeslots.forEach(slot => {
      const dayKey = format(parseISO(slot.start), 'yyyy-MM-dd');
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(slot);
    });
    
    // Sort slots within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    });
    
    return grouped;
  };

  const goToPreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

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

  const groupedTimeslots = groupTimeslotsByDay();
  const sortedDays = Object.keys(groupedTimeslots).sort();

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
            {format(startOfWeek(currentDate), 'MMM d')} - {format(endOfWeek(addDays(currentDate, 14)), 'MMM d, yyyy')}
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

      {/* Timeslots grouped by day */}
      <div className="space-y-4">
        {sortedDays.length > 0 ? (
          sortedDays.map(dayKey => (
            <div key={dayKey} className="bg-white rounded-lg shadow-sm overflow-hidden border border-blue-200">
              <div className="bg-purple-100 px-4 py-3 border-b border-purple-200">
                <h3 className="font-semibold text-purple-800">
                  {formatDate(groupedTimeslots[dayKey][0].start)}
                </h3>
              </div>
              
              <div className="p-4 space-y-3">
                {groupedTimeslots[dayKey].map(timeslot => {
                  const isBooked = timeslot.extendedProps.isOwnBooking;
                  return (
                    <div
                      key={timeslot.id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        isBooked 
                          ? 'bg-blue-50 border-blue-300 hover:bg-blue-100' 
                          : 'bg-white border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      <div>
                        <div className={`font-medium ${isBooked ? 'text-blue-800' : 'text-purple-700'}`}>
                          {formatTime(timeslot.start)} - {formatTime(timeslot.end)}
                        </div>
                        {isBooked && (
                          <div className="text-sm text-blue-600 font-medium mt-1">
                            ✓ Booked by you
                          </div>
                        )}
                        {timeslot.extendedProps.notes && (
                          <div className="text-sm text-gray-600 mt-1">
                            {timeslot.extendedProps.notes}
                          </div>
                        )}
                      </div>
                      
                      {!isBooked ? (
                        <button
                          onClick={() => setSelectedTimeslot(timeslot)}
                          className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-md hover:text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm"
                        >
                          Book
                        </button>
                      ) : (
                        <div className="px-4 py-2 bg-blue-200 text-blue-800 text-sm font-medium rounded-md">
                          Booked
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-blue-200">
            <div className="text-amber-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-purple-700 mb-2">No Training Sessions Found</h3>
            <p className="text-gray-600">
              There are no available or booked training sessions in the selected time range. 
              Please try selecting a different week or contact us to schedule new sessions.
            </p>
          </div>
        )}
      </div>

      {/* Booking confirmation modal */}
      {selectedTimeslot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-700 mb-4">Confirm Booking</h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-medium text-purple-700">Date: </span>
                <span className="text-gray-900">{formatDate(selectedTimeslot.start)}</span>
              </div>
              <div>
                <span className="font-medium text-purple-700">Time: </span>
                <span className="text-gray-900">
                  {formatTime(selectedTimeslot.start)} - {formatTime(selectedTimeslot.end)}
                </span>
              </div>
              <div>
                <span className="font-medium text-purple-700">Client: </span>
                <span className="text-gray-900">{clientName}</span>
              </div>
              <div>
                <span className="font-medium text-purple-700">Dog: </span>
                <span className="text-gray-900">{dogName}</span>
              </div>
              {selectedTimeslot.extendedProps.notes && (
                <div>
                  <span className="font-medium text-purple-700">Notes: </span>
                  <span className="text-gray-900">{selectedTimeslot.extendedProps.notes}</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedTimeslot(null)}
                disabled={isBooking}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBookTimeslot(selectedTimeslot)}
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