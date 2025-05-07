'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// Import FullCalendar components
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // For month view
import timeGridPlugin from '@fullcalendar/timegrid'; // For week/day time views
import interactionPlugin from '@fullcalendar/interaction'; // For clicking/dragging interactions
import { DateSelectArg, EventClickArg } from '@fullcalendar/core'; // Import specific types

// CSS imports removed from here - will be added to globals.css

export default function CalendarPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateSelectArg | null>(null);

  // Placeholder for fetching/displaying timeslots - fetch real data via API later
  const [events, setEvents] = useState([
    // Example structure - fetch real data later
    { id: '1', title: 'Available', start: '2024-07-24T10:00:00', end: '2024-07-24T11:00:00', display: 'background', color: '#a3e6ff' }, // Light blue background for available
    { id: '2', title: 'Booked', start: '2024-07-25T14:00:00', end: '2024-07-25T15:00:00', color: '#fecaca' } // Light red for booked
  ]);

  const handleOpenCreateModal = useCallback((selectionInfo?: DateSelectArg) => {
    console.log("Opening create timeslot modal...", selectionInfo);
    setSelectedRange(selectionInfo || null); // Store selection info to potentially pre-fill modal
    setIsCreateModalOpen(true);
  }, []);

  // Handler for when a user clicks and drags to select a time range on the calendar
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    console.log('Selected time range:', selectInfo.startStr, selectInfo.endStr);
    handleOpenCreateModal(selectInfo);
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); 
  }, [handleOpenCreateModal]);

  // Handler for when a user clicks an existing event (timeslot)
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    console.log('Clicked event:', clickInfo.event.id, clickInfo.event.title);
    // TODO: Open an edit modal if the slot is available, or show booking details if booked
    if (clickInfo.event.display === 'background') {
      alert(`Edit available slot: ${clickInfo.event.startStr} - ${clickInfo.event.endStr} (ID: ${clickInfo.event.id})`);
      // Open edit modal here, passing event details
    } else {
      alert(`View booked slot: ${clickInfo.event.title} at ${clickInfo.event.startStr} (ID: ${clickInfo.event.id})`);
      // Show booking info here
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Availability</h1>
        <Button onClick={() => handleOpenCreateModal()} className="gap-2">
          <PlusCircle size={18} />
          Add Timeslot
        </Button>
      </div>

      <div className="border rounded-lg p-4 bg-white shadow">
        {/* Replace placeholder with FullCalendar component */}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events} // Feed fetched/state timeslots here
          editable={true} // Allows dragging/resizing available slots (needs refinement based on event type)
          selectable={true} // Allows clicking/dragging to select times
          selectMirror={true} // Shows a placeholder event while dragging
          dayMaxEvents={true} // Allows "+X more" link when too many events
          weekends={true} // Or false if Madeline doesn't work weekends
          select={handleDateSelect} // Callback for selecting time range
          eventClick={handleEventClick} // Callback for clicking an event
          // eventDrop={handleEventDrop} // Callback for drag-n-drop resize/move (implement later)
          // eventResize={handleEventResize} // Callback for resizing (implement later)
          height="auto" // Adjust height as needed, "auto" uses container
          contentHeight="auto"
        />
      </div>

      {/* Placeholder for Create/Edit Modal - Conditionally render based on state */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            {/* Pass selectedRange data to the modal component if needed */}
            <h2 className="text-xl font-semibold mb-4">Create Timeslot (Modal Placeholder)</h2>
            <p className="text-sm text-gray-600 mb-4">Form elements for date, start time, duration (hours/minutes), end time (editable), notes, and repeating options will go here. Start: {selectedRange?.startStr}, End: {selectedRange?.endStr}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); setSelectedRange(null); }}>Cancel</Button>
              <Button>Save Timeslot</Button> 
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 