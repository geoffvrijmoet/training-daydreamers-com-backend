'use client';

import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useSearchParams } from 'next/navigation';

// Shadcn Popover
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Import FullCalendar components
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventSourceInput, EventInput, DatesSetArg, ViewApi } from '@fullcalendar/core';
import { format, parse } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIME_ZONE = "America/New_York";
const RECURRING_WEEKS_AHEAD = 6;

// Helper to extract parts from ISO-like string (e.g., "2025-05-07T12:30:00")
function extractDateTimeParts(dateTimeStr: string | null | undefined): { date: string; time: string } {
  if (!dateTimeStr) return { date: '', time: '' };
  try {
    const [datePart, timePartWithPotentialZ] = dateTimeStr.split('T');
    const timePart = timePartWithPotentialZ?.split(/[:.]/)?.[0] + ':' + timePartWithPotentialZ?.split(/[:.]/)?.[1];
    return { date: datePart || '', time: timePart || '' };
  } catch (e) {
    return { date: '', time: '' };
  }
}

// Helper: get date at midnight in the target timezone
function getDateAtMidnightInTz(date: Date, tz: string) {
  const zoned = toZonedTime(date, tz);
  return new Date(zoned.getFullYear(), zoned.getMonth(), zoned.getDate());
}

// Client interface for the dropdown
interface Client {
  _id: string;
  name: string;
  dogName: string;
  sessionRate?: number;
  packageInfo?: {
    totalSessions?: number;
    packagePrice?: number;
  };
}

function CalendarPageContent() {
  const searchParams = useSearchParams();
  const preSelectedClientId = searchParams.get('clientId');
  
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverMode, setPopoverMode] = useState<'create' | 'edit'>('create');
  const [selectedRange, setSelectedRange] = useState<DateSelectArg | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventClickArg | null>(null);
  const [initialScrollTime, setInitialScrollTime] = useState<string | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);

  // Enhanced booking state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isPackage, setIsPackage] = useState(false);
  const [packageSize, setPackageSize] = useState<3 | 5>(3);
  const [sessionPrice, setSessionPrice] = useState('');
  const [packagePrice, setPackagePrice] = useState('');
  const [scheduleRemainingNow, setScheduleRemainingNow] = useState(false);
  const [bookingStep, setBookingStep] = useState<'client' | 'pricing' | 'schedule'>('client');

  // Form State
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formDurationHours, setFormDurationHours] = useState('1');
  const [formDurationMinutes, setFormDurationMinutes] = useState('0');
  const [formNotes, setFormNotes] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [dateInputWidth, setDateInputWidth] = useState('auto');
  const [isManualEndTimeChange, setIsManualEndTimeChange] = useState(false);
  const [durationHoursInputWidth, setDurationHoursInputWidth] = useState('2.5em');
  const [durationMinutesInputWidth, setDurationMinutesInputWidth] = useState('2.5em');
  const [calendarView, setCalendarView] = useState('timeGridWeek');
  const [todayButtonLabel, setTodayButtonLabel] = useState('This Week');

  // Tooltip state for timeslot interactions
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipContent, setTooltipContent] = useState<{
    event: EventClickArg['event'];
    mode: 'details' | 'booking' | 'delete';
    startTime: string;
    endTime: string;
    date: string;
    notes: string;
    isAvailable: boolean;
    clientName?: string;
    dogName?: string;
    isRecurring?: boolean;
  } | null>(null);

  // Helper to get the current date label (e.g. "May 18 – 24, 2025") from FullCalendar
  const [dateLabel, setDateLabel] = useState('');
  const updateDateLabel = useCallback(() => {
    if (calendarRef.current) {
      setDateLabel(calendarRef.current.getApi().view.title);
    }
  }, []);

  // Update date label on view or date change
  useEffect(() => {
    updateDateLabel();
  }, [calendarView, isLoadingEvents, updateDateLabel]);

  // Helper to determine if the current view is on today/this week/this month
  const [isOnCurrentPeriod, setIsOnCurrentPeriod] = useState(false);
  const checkIsOnCurrentPeriod = useCallback(() => {
    if (!calendarRef.current) return;

    const api = calendarRef.current.getApi();
    const view = api.view;
    const tz = TIME_ZONE;

    const now = new Date();
    const todayInTz = getDateAtMidnightInTz(now, tz);

    let isCurrent = false;

    if (view.type === 'timeGridDay') {
      const parsed = parse(view.title, 'MMMM d, yyyy', new Date());
      const viewDateInTz = getDateAtMidnightInTz(parsed, tz);
      isCurrent = todayInTz.getTime() === viewDateInTz.getTime();
    } else {
      const viewStartInTz = toZonedTime(view.activeStart, tz);
      viewStartInTz.setHours(0, 0, 0, 0);
      const viewEndInTz = toZonedTime(view.activeEnd, tz);
      isCurrent = todayInTz >= viewStartInTz && todayInTz < viewEndInTz;
    }
    setIsOnCurrentPeriod(isCurrent);
  }, []);

  // Update isOnCurrentPeriod on view/date change
  useEffect(() => {
    checkIsOnCurrentPeriod();
  }, [calendarView, isLoadingEvents, dateLabel, checkIsOnCurrentPeriod]);

  // Fetch clients for dropdown
  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      if (data.success) {
        setClients(data.clients || []);
        
        if (preSelectedClientId) {
          const preSelectedClient = data.clients?.find((c: Client) => c._id === preSelectedClientId);
          if (preSelectedClient) {
            setSelectedClient(preSelectedClient);
            setSessionPrice(preSelectedClient.sessionRate?.toString() || '');
            setPackagePrice(preSelectedClient.packageInfo?.packagePrice?.toString() || '');
          }
        }
      }
    } catch (error) {
      // Error handled silently
    }
  }, [preSelectedClientId]);

  // Load clients when component mounts
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Calculate sales tax (8.875%)
  const calculateSalesTax = useCallback((amount: number) => {
    return amount * 0.08875;
  }, []);

  // Filter clients based on search
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.dogName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Navigation handlers
  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
      updateDateLabel();
    }
  };
  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
      updateDateLabel();
    }
  };
  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
      updateDateLabel();
    }
  };
  const handleViewChange = (view: string) => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
      setCalendarView(view);
      updateTodayButtonLabel(view);
      updateDateLabel();
    }
  };

  // Update today button label based on view
  const updateTodayButtonLabel = useCallback((viewType: string) => {
    if (viewType === 'timeGridWeek') setTodayButtonLabel('This Week');
    else if (viewType === 'dayGridMonth') setTodayButtonLabel('This Month');
    else if (viewType === 'timeGridDay') setTodayButtonLabel('Today');
    else setTodayButtonLabel('Today');
  }, []);

  // Listen for view changes
  const handleViewDidMount = useCallback((arg: { view: ViewApi }) => {
    setCalendarView(arg.view.type);
    updateTodayButtonLabel(arg.view.type);
    checkIsOnCurrentPeriod(); // Initial check when view mounts
  }, [updateTodayButtonLabel, checkIsOnCurrentPeriod]);
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setCalendarView(arg.view.type);
    updateTodayButtonLabel(arg.view.type);
    updateDateLabel(); // Update date label whenever dates change
    checkIsOnCurrentPeriod(); // Check period whenever dates are set
  }, [updateTodayButtonLabel, checkIsOnCurrentPeriod, updateDateLabel]);

  // Function to audit recurring timeslots
  const auditRecurringTimeslots = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar-timeslots/audit-recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        await response.json();
      }
    } catch (error) {
      // Error handled silently
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const formattedTime = format(now, 'HH:mm:ss');
    setInitialScrollTime(formattedTime);
    
    // Audit recurring timeslots when calendar loads
    auditRecurringTimeslots();
  }, [auditRecurringTimeslots]);

  // Add useEffect to calculate date input width
  useEffect(() => {
    if (formDate) {
      const date = new Date(formDate);
      const formattedDate = format(date, 'MMMM d, yyyy');
      const width = Math.max(120, formattedDate.length * 8); // Minimum width of 120px, 8px per character
      setDateInputWidth(`${width}px`);
    }
  }, [formDate]);

  // Add useEffect to update end time when duration changes (only if not manual end time change)
  useEffect(() => {
    if (!isManualEndTimeChange && formDate && formStartTime) {
      const startDate = new Date(`${formDate}T${formStartTime}`);
      if (isNaN(startDate.getTime())) {
        // Invalid start date, don't update end time
        return;
      }
      const endDate = new Date(
        startDate.getTime() +
        (parseInt(formDurationHours) * 60 * 60 * 1000) +
        (parseInt(formDurationMinutes) * 60 * 1000)
      );
      if (isNaN(endDate.getTime())) {
        // Invalid end date, don't update
        return;
      }
      setFormEndTime(format(endDate, 'HH:mm'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formDate, formStartTime, formDurationHours, formDurationMinutes]);

  // Add useEffect to update duration when end time changes (only if manual)
  useEffect(() => {
    if (isManualEndTimeChange && formDate && formStartTime && formEndTime) {
      const startDate = new Date(`${formDate}T${formStartTime}`);
      const endDate = new Date(`${formDate}T${formEndTime}`);
      const durationMs = endDate.getTime() - startDate.getTime();
      const totalMinutes = Math.max(15, Math.round(durationMs / (1000 * 60)));
      setFormDurationHours(Math.floor(totalMinutes / 60).toString());
      setFormDurationMinutes((totalMinutes % 60).toString());
      setIsManualEndTimeChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formEndTime]);

  useEffect(() => {
    // Minimum width 2.5em, scale with value length
    setDurationHoursInputWidth(`${Math.max(2.5, String(formDurationHours).length * 0.7 + 1.2)}em`);
  }, [formDurationHours]);
  useEffect(() => {
    setDurationMinutesInputWidth(`${Math.max(2.5, String(formDurationMinutes).length * 0.7 + 1.2)}em`);
  }, [formDurationMinutes]);

  // Function to fetch calendar events
  const fetchCalendarEvents: EventSourceInput = useCallback(async (
    fetchInfo: { start: Date; end: Date; startStr: string; endStr: string; timeZone: string; }, 
    successCallback: (events: EventInput[]) => void, 
    failureCallback: (error: Error) => void
  ) => {
    setIsLoadingEvents(true);
    try {
      const { startStr, endStr } = fetchInfo;

      if (typeof startStr !== 'string' || typeof endStr !== 'string') {
        failureCallback(new Error('Invalid date range strings provided by FullCalendar.'));
        return;
      }

      const apiUrl = `/api/calendar-timeslots?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch events: ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.events)) {
        const formattedEvents = data.events.map((event: EventInput) => ({
          ...event,
          start: event.start,
          end: event.end,
        }));
        successCallback(formattedEvents);
      } else {
        throw new Error(data.error || 'Invalid event data received');
      }
    } catch (error) {
      failureCallback(error instanceof Error ? error : new Error('Unknown error fetching events'));
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Function to reset form state
  const resetForm = useCallback(() => {
    setFormDate('');
    setFormStartTime('');
    setFormEndTime('');
    setFormDurationHours('1');
    setFormDurationMinutes('0');
    setFormNotes('');
    setFormIsRecurring(false);
    setSelectedRange(null);
    setSelectedEvent(null);
    setDateInputWidth('auto');
  }, []);

  const handleOpenPopover = useCallback((mode: 'create' | 'edit', data?: DateSelectArg | EventClickArg) => {
    resetForm(); 
    setPopoverMode(mode);
    if (mode === 'create' && data && 'startStr' in data) {
      const selectInfo = data as DateSelectArg;
      setSelectedRange(selectInfo);

      // --- Extract directly from startStr/endStr ---
      const { date, time } = extractDateTimeParts(selectInfo.startStr);
      const start = selectInfo.start;
      const end = selectInfo.end;
      // If end is missing or equal to start, assume month view day click
      if (!end || isNaN(end.getTime()) || end.getTime() === start.getTime()) {
        // Month view: default to 12:00pm start, 1 hour duration
        setFormDate(date);
        setFormStartTime('12:00');
        setFormDurationHours('1');
        setFormDurationMinutes('0');
        setFormEndTime('13:00');
        // Month view defaulted to 12:00pm start, 1 hour duration
      } else {
        // Week/day view: use actual selection
        setFormDate(date);
        setFormStartTime(time);
        const durationMs = end.getTime() - start.getTime();
        const totalMinutes = Math.max(15, Math.round(durationMs / (1000 * 60)));
        setFormDurationHours(Math.floor(totalMinutes / 60).toString());
        setFormDurationMinutes((totalMinutes % 60).toString());
        setFormEndTime(format(end, 'HH:mm'));
        // Week/day view: use actual selection
      }
    } else if (mode === 'edit' && data && 'event' in data) {
      const clickInfo = data as EventClickArg;
      if(clickInfo.event.extendedProps.isAvailable) {
        setSelectedEvent(clickInfo);
        const startStr = clickInfo.event.startStr;
        const end = clickInfo.event.end ?? clickInfo.event.start ?? new Date();
        const start = clickInfo.event.start ?? new Date();
        
        const { date, time } = extractDateTimeParts(startStr);
        setFormDate(date);
        setFormStartTime(time);
        setFormEndTime(format(end, 'HH:mm'));
        
        const durationMs = end.getTime() - start.getTime();
        const totalMinutes = Math.max(15, Math.round(durationMs / (1000 * 60))); 
        setFormDurationHours(Math.floor(totalMinutes / 60).toString());
        setFormDurationMinutes((totalMinutes % 60).toString());
        setFormNotes(clickInfo.event.extendedProps.notes || '');
              } else {
        alert(`Booked Slot: ${clickInfo.event.title} at ${clickInfo.event.startStr}`);
        return; 
      }
    } else {
       const now = new Date();
       const defaultDate = format(now, 'yyyy-MM-dd');
       const defaultTime = format(now, 'HH:mm');
       setFormDate(defaultDate);
       setFormStartTime(defaultTime);
       setFormEndTime(format(new Date(now.getTime() + 60 * 60 * 1000), 'HH:mm'));
    }
    setIsPopoverOpen(true);
  }, [resetForm]);

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (!open) { // Reset selections when popover closes
      // Unselect any active calendar selection
      if (selectedRange && calendarRef.current) {
        const calendarApi = selectedRange.view.calendar;
        calendarApi.unselect();
      }
      resetForm();
    }
  };

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    // If we're in month view, switch to day view for the selected date
    if (selectInfo.view.type === 'dayGridMonth') {
      if (calendarRef.current) {
        const api = calendarRef.current.getApi();
        api.gotoDate(selectInfo.start); // Navigate to the selected date
        api.changeView('timeGridDay'); // Switch to day view
        setCalendarView('timeGridDay');
        updateTodayButtonLabel('timeGridDay');
        updateDateLabel();
      }
      const calendarApi = selectInfo.view.calendar;
      calendarApi.unselect(); 
    } else {
      // For week/day views, open the create popover as before
      // Store the calendar API reference to unselect later
      setSelectedRange(selectInfo);
      handleOpenPopover('create', selectInfo);
      // Don't unselect immediately - let the popover close handler do it
    }
  }, [handleOpenPopover, updateTodayButtonLabel, updateDateLabel]);

  const handleEventClick = useCallback(async (clickInfo: EventClickArg) => {
    
    // If there's a pre-selected client and this is an available timeslot, auto-trigger booking
    if (preSelectedClientId && clickInfo.event.extendedProps.isAvailable && selectedClient) {
      const event = clickInfo.event;
      const formatTimeFromString = (timeStr: string) => {
        if (!timeStr) return 'Unknown';
        const timePart = timeStr.split('T')[1];
        if (!timePart) return 'Unknown';
        const [hours, minutes] = timePart.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      };
      
      const startTime = formatTimeFromString(event.startStr);
      const endTime = formatTimeFromString(event.endStr);
      const date = event.start ? format(event.start, 'EEEE, MMMM d, yyyy') : 'Unknown';
      
      // Pre-populate booking data for selected client
      setBookingStep('pricing');
      setIsPackage(false);
      setPackageSize(3);
      setSessionPrice(selectedClient.sessionRate?.toString() || '');
      setPackagePrice(selectedClient.packageInfo?.packagePrice?.toString() || '');
      setScheduleRemainingNow(false);
      
      setTooltipContent({
        event,
        mode: 'booking',
        startTime,
        endTime,
        date,
        notes: event.extendedProps.notes || 'No notes',
        isAvailable: true,
        isRecurring: !!event.extendedProps.repeatingSeriesId
      });
      
      const rect = (clickInfo.jsEvent.target as HTMLElement).getBoundingClientRect();
      const tooltipX = rect.left + rect.width / 2;
      const tooltipY = rect.top - 10;
      setTooltipPosition({ x: tooltipX, y: tooltipY });
      setTooltipOpen(true);
      return;
    }
    
    // Show timeslot details in tooltip instead of alert
    const event = clickInfo.event;
    
    // Use the original time strings from the API instead of Date objects
    const formatTimeFromString = (timeStr: string) => {
      if (!timeStr) return 'Unknown';
      // Extract time from format like "2025-05-30T12:00:00"
      const timePart = timeStr.split('T')[1];
      if (!timePart) return 'Unknown';
      const [hours, minutes] = timePart.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    const startTime = formatTimeFromString(event.startStr);
    const endTime = formatTimeFromString(event.endStr);
    const date = event.start ? format(event.start, 'EEEE, MMMM d, yyyy') : 'Unknown';
    const notes = event.extendedProps.notes || 'No notes';
    const isAvailable = event.extendedProps.isAvailable;
    const isRecurring = !!event.extendedProps.repeatingSeriesId;
    
    let clientName = '';
    let dogName = '';
    
    // If this is a booked timeslot, fetch client details
    if (!isAvailable && event.extendedProps.clientId) {
      try {
        const response = await fetch(`/api/clients/${event.extendedProps.clientId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.client) {
            clientName = data.client.name;
            dogName = data.client.dogName;
          }
        }
      } catch (error) {
        console.error('Error fetching client details:', error);
      }
    }
    
    // Calculate tooltip position based on click location
    const rect = (clickInfo.jsEvent.target as HTMLElement).getBoundingClientRect();
    const tooltipX = rect.left + rect.width / 2;
    const tooltipY = rect.top - 10; // Position above the event
    
    setTooltipContent({
      event,
      mode: 'details',
      startTime,
      endTime,
      date,
      notes,
      isAvailable,
      clientName,
      dogName,
      isRecurring
    });
    setTooltipPosition({ x: tooltipX, y: tooltipY });
    setTooltipOpen(true);
  }, [preSelectedClientId, selectedClient]);

  // Handle booking flow
  const handleBookTimeslot = useCallback(() => {
    if (!tooltipContent) return;
    
    // If there's a pre-selected client, skip directly to pricing
    if (preSelectedClientId && selectedClient) {
      setBookingStep('pricing');
      setIsPackage(false);
      setPackageSize(3);
      setSessionPrice(selectedClient.sessionRate?.toString() || '');
      setPackagePrice(selectedClient.packageInfo?.packagePrice?.toString() || '');
      setScheduleRemainingNow(false);
    } else {
      // Reset booking state for normal flow
      setBookingStep('client');
      setSelectedClient(null);
      setClientSearch('');
      setIsPackage(false);
      setPackageSize(3);
      setSessionPrice('');
      setPackagePrice('');
      setScheduleRemainingNow(false);
    }
    
    setTooltipContent(prev => prev ? { ...prev, mode: 'booking' } : null);
  }, [tooltipContent, preSelectedClientId, selectedClient]);

  // Handle delete flow
  const handleDeleteTimeslot = useCallback(() => {
    if (!tooltipContent) return;
    
    setTooltipContent(prev => prev ? { ...prev, mode: 'delete' } : null);
  }, [tooltipContent]);

  // Handle client selection
  const handleClientSelect = useCallback((client: Client) => {
    setSelectedClient(client);
    setClientSearch('');
    setSessionPrice(client.sessionRate?.toString() || '');
    setPackagePrice(client.packageInfo?.packagePrice?.toString() || '');
    setBookingStep('pricing');
  }, []);

  // Handle booking completion
  const handleBookingSubmit = useCallback(async () => {
    if (!tooltipContent?.event || !selectedClient) return;
    
    try {
      const amount = isPackage ? parseFloat(packagePrice || '0') : parseFloat(sessionPrice || '0');
      const salesTax = calculateSalesTax(amount);
      
      // TODO: Implement actual booking API call with package creation
              // Booking details prepared for API call
      
      // Close tooltip and show success message for now
      setTooltipOpen(false);
      setTooltipContent(null);
      
      // Temporary success notification
      setTimeout(() => {
        alert(`Booking created!\nClient: ${selectedClient.name} (${selectedClient.dogName})\nTimeslot: ${tooltipContent.startTime} - ${tooltipContent.endTime}\nAmount: $${amount.toFixed(2)} + $${salesTax.toFixed(2)} tax${isPackage ? `\nPackage: ${packageSize} sessions` : ''}`);
      }, 100);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking. Please try again.');
    }
  }, [tooltipContent, selectedClient, isPackage, packageSize, sessionPrice, packagePrice, scheduleRemainingNow, calculateSalesTax]);

  // Handle timeslot deletion
  const handleDeleteSubmit = useCallback(async (deleteAllSeries: boolean) => {
    if (!tooltipContent?.event) return;
    
    try {
      const url = deleteAllSeries 
        ? `/api/calendar-timeslots/${tooltipContent.event.id}?deleteAll=true`
        : `/api/calendar-timeslots/${tooltipContent.event.id}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete timeslot');
      }
      
      // Close tooltip and refresh calendar
      setTooltipOpen(false);
      setTooltipContent(null);
      
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
      }
      
      // Show success message
      alert(data.message || 'Timeslot deleted successfully');
      
    } catch (error) {
      console.error('Error deleting timeslot:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete timeslot'}`);
    }
  }, [tooltipContent]);

  // Close tooltip
  const closeTooltip = useCallback(() => {
    setTooltipOpen(false);
    setTooltipContent(null);
  }, []);

  const handleSaveTimeslot = async () => {
    // Create dates in Eastern timezone and convert to UTC for storage
    const formattedDateTime = `${formDate}T${formStartTime}:00`; // Add seconds
    const localStart = new Date(formattedDateTime);
    
    // Convert from local Eastern time to UTC for storage
    const utcStart = fromZonedTime(localStart, TIME_ZONE);
    const durationMs = (parseInt(formDurationHours) * 60 * 60 * 1000) + (parseInt(formDurationMinutes) * 60 * 1000);

    const timeslotPayloads = [] as { startTime: string; endTime: string; notes: string; repeatingSeriesId?: string }[];
    // Generate a unique series ID if this is a recurring event
    const seriesId = formIsRecurring ? `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined;
    
    // always push the primary timeslot
    timeslotPayloads.push({
      startTime: utcStart.toISOString(),
      endTime: new Date(utcStart.getTime() + durationMs).toISOString(),
      notes: formNotes,
      repeatingSeriesId: seriesId,
    });

    if (formIsRecurring) {
      for (let i = 1; i <= RECURRING_WEEKS_AHEAD; i++) {
        const offsetStart = new Date(utcStart.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        timeslotPayloads.push({
          startTime: offsetStart.toISOString(),
          endTime: new Date(offsetStart.getTime() + durationMs).toISOString(),
          notes: formNotes,
          repeatingSeriesId: seriesId,
        });
      }
    }

    const method = popoverMode === 'create' ? 'POST' : 'PUT';
    const endpoint = '/api/calendar-timeslots';
    if (popoverMode === 'edit' && selectedEvent?.event.id) {
        alert("Edit functionality is not fully wired up yet.");
        handlePopoverOpenChange(false);
        return; 
    }

    try {
      // send payloads sequentially (could be parallel but sequential keeps order and easier error handling)
      for (const p of timeslotPayloads) {
        const res = await fetch(endpoint, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || 'Failed to create timeslot');
        }
      }
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
      }
      handlePopoverOpenChange(false);
    } catch (error) {
      console.error(`Error ${popoverMode === 'create' ? 'saving' : 'updating'} timeslot:`, error);
      alert(`Error: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isPopoverOpen) {
          handlePopoverOpenChange(false);
        } else if (tooltipOpen) {
          closeTooltip();
        } else if (calendarRef.current) {
          const calendarApi = calendarRef.current.getApi();
          calendarApi.unselect();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPopoverOpen, tooltipOpen, closeTooltip, handlePopoverOpenChange]);

  if (!initialScrollTime) {
    return <div className="flex justify-center items-center h-screen">Initializing Calendar...</div>;
  }

  return (
    <div className="p-4">
      {/* Custom Calendar Header */}
      <div className={`flex flex-col gap-2 mb-4 ${
        calendarView === 'timeGridWeek' || calendarView === 'timeGridDay' 
          ? 'sticky top-0 bg-white z-30 border-b border-gray-200 pb-4' 
          : ''
      }`}>
        {/* Top Row: Prev/Next + Date Label */}
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            <Button className="bg-purple-200 hover:bg-purple-300 text-purple-800 border border-purple-300" size="icon" onClick={handlePrev} aria-label="Previous">
              &lt;
            </Button>
            <Button className="bg-purple-200 hover:bg-purple-300 text-purple-800 border border-purple-300" size="icon" onClick={handleNext} aria-label="Next">
              &gt;
            </Button>
          </div>
          <div className="text-lg font-semibold text-right whitespace-nowrap">{dateLabel}</div>
        </div>
        {/* Bottom Row: Today/This Week/This Month + View Switchers */}
        <div className="flex justify-between items-center w-full">
          <Button className="bg-amber-200 hover:bg-amber-300 text-amber-800 disabled:bg-gray-100 disabled:text-gray-400" onClick={handleToday} disabled={isOnCurrentPeriod}>{todayButtonLabel}</Button>
          <div className="flex gap-2">
            <Button
              className={calendarView === 'dayGridMonth' ? 'bg-blue-300 hover:bg-blue-400 text-blue-900' : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300'}
              onClick={() => handleViewChange('dayGridMonth')}
            >
              Month
            </Button>
            <Button
              className={calendarView === 'timeGridWeek' ? 'bg-blue-300 hover:bg-blue-400 text-blue-900' : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300'}
              onClick={() => handleViewChange('timeGridWeek')}
            >
              Week
            </Button>
            <Button
              className={calendarView === 'timeGridDay' ? 'bg-blue-300 hover:bg-blue-400 text-blue-900' : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300'}
              onClick={() => handleViewChange('timeGridDay')}
            >
              Day
            </Button>
          </div>
        </div>
      </div>
      {/* Popover for timeslot creation/editing */}
      <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <button style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
        </PopoverTrigger>
        <PopoverContent className="w-96">
          {/* Dummy input to absorb auto-focus and prevent date input from being focused */}
          <input style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }} tabIndex={-1} autoFocus />
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">{popoverMode === 'create' ? 'Create New Timeslot' : 'Edit Timeslot'}</h4>
              <p className="text-sm text-muted-foreground">
                {popoverMode === 'create' ? 'Define a new available timeslot.' : 'Update the details of this timeslot.'}
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="col-span-2 h-8"
                  style={{ width: dateInputWidth }}
                  autoFocus={false}
                  tabIndex={0}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="col-span-2 h-8"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="duration-hours">Duration</Label>
                <div className="col-span-2 flex gap-2 items-center">
                  <Input
                    id="duration-hours"
                    type="number"
                    min="0"
                    value={formDurationHours}
                    onChange={(e) => setFormDurationHours(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-8 text-right"
                    placeholder="Hrs"
                    style={{ width: durationHoursInputWidth, minWidth: '2.5em' }}
                  />
                  <span className="mr-2">hr</span>
                  <Input
                    id="duration-minutes"
                    type="number"
                    min="0"
                    max="59"
                    step="15"
                    value={formDurationMinutes}
                    onChange={(e) => setFormDurationMinutes(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-8 text-right"
                    placeholder="Min"
                    style={{ width: durationMinutesInputWidth, minWidth: '2.5em' }}
                  />
                  <span>min</span>
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={formEndTime}
                  onChange={(e) => { setFormEndTime(e.target.value); setIsManualEndTimeChange(true); }}
                  className="col-span-2 h-8"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="col-span-2"
                  placeholder="(Optional) Notes for this timeslot"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="recurring">Recurring (weekly)</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox id="recurring" checked={formIsRecurring} onCheckedChange={(v) => setFormIsRecurring(!!v)} />
                  <span className="text-sm text-muted-foreground">Create weekly copies for the next {RECURRING_WEEKS_AHEAD} weeks</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button className="bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300" onClick={() => handlePopoverOpenChange(false)}>
                Cancel
              </Button>
              <Button className="bg-green-200 hover:bg-green-300 text-green-800" onClick={handleSaveTimeslot} disabled={!formDate || !formStartTime}>
                {popoverMode === 'create' ? 'Create Timeslot' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {/* Show "Loading events..." message if events are being fetched */}
      {isLoadingEvents && (
        <div className="text-center p-4">Loading events...</div>
      )}
      
      {/* Timeslot Details/Booking Tooltip */}
      {tooltipOpen && tooltipContent && (
        <>
          {/* Backdrop to close tooltip */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeTooltip}
          />
          
          {/* Tooltip */}
          <div
            className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-80 max-w-96"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="space-y-3">
              <div className="font-semibold text-lg">Timeslot Details</div>
              
              <div className="space-y-2 text-sm">
                <div><strong>Date:</strong> {tooltipContent.date}</div>
                <div><strong>Time:</strong> {tooltipContent.startTime} - {tooltipContent.endTime}</div>
                <div><strong>Status:</strong> {tooltipContent.isAvailable ? 'Available' : 'Booked'}</div>
                <div><strong>Notes:</strong> {tooltipContent.notes}</div>
                
                {!tooltipContent.isAvailable && (
                  <div className="space-y-1 text-gray-600">
                    {tooltipContent.clientName && (
                      <div><strong>Client:</strong> {tooltipContent.clientName}</div>
                    )}
                    {tooltipContent.dogName && (
                      <div><strong>Dog:</strong> {tooltipContent.dogName}</div>
                    )}
                    {tooltipContent.event.extendedProps.sessionId && (
                      <div><strong>Session ID:</strong> {tooltipContent.event.extendedProps.sessionId}</div>
                    )}
                  </div>
                )}
              </div>
              
              {tooltipContent.mode === 'details' && tooltipContent.isAvailable && (
                <div className="flex gap-2 pt-2">
                  <Button className="bg-blue-200 hover:bg-blue-300 text-blue-800" size="sm" onClick={handleBookTimeslot}>
                    Book for Client
                  </Button>
                  <Button className="bg-purple-300 hover:bg-pink-300" variant="destructive" size="sm" onClick={handleDeleteTimeslot}>
                    Delete
                  </Button>
                  <Button variant="outline" size="sm" onClick={closeTooltip}>
                    Close
                  </Button>
                </div>
              )}
              
              {tooltipContent.mode === 'booking' && (
                <div className="space-y-4 pt-2 max-w-md">
                  <div className="text-sm font-medium">Book this timeslot:</div>
                  
                  {/* Step 1: Client Selection */}
                  {bookingStep === 'client' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search clients..."
                          className="pl-8"
                          autoFocus={!preSelectedClientId}
                        />
                        <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                      
                      {/* Client dropdown */}
                      <div className="max-h-32 overflow-y-auto border rounded border-gray-200">
                        {filteredClients.map((client) => (
                          <div
                            key={client._id}
                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => handleClientSelect(client)}
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-gray-500">{client.dogName}</div>
                          </div>
                        ))}
                        
                                                 {/* New client option */}
                         {clientSearch && filteredClients.length === 0 && (
                           <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                             <Plus className="w-4 h-4 inline mr-2" />
                             New client &apos;{clientSearch}&apos;
                           </div>
                         )}
                        
                        {!clientSearch && (
                          <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                            <Plus className="w-4 h-4 inline mr-2" />
                            New client
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={closeTooltip}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 2: Pricing Options */}
                  {bookingStep === 'pricing' && selectedClient && (
                    <div className="space-y-3">
                      <div className="text-sm">
                        <strong>Client:</strong> {selectedClient.name} ({selectedClient.dogName})
                      </div>
                      
                      {/* Package vs Single Session */}
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={!isPackage}
                            onChange={() => setIsPackage(false)}
                          />
                          <span>Single Session</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={isPackage}
                            onChange={() => setIsPackage(true)}
                          />
                          <span>Package</span>
                        </label>
                      </div>
                      
                      {/* Package options */}
                      {isPackage && (
                        <div className="space-y-2 pl-6">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={packageSize === 3}
                              onChange={() => setPackageSize(3)}
                            />
                            <span>3 Sessions</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={packageSize === 5}
                              onChange={() => setPackageSize(5)}
                            />
                            <span>5 Sessions</span>
                          </label>
                        </div>
                      )}
                      
                      {/* Pricing */}
                      <div className="space-y-2">
                        {isPackage ? (
                          <div>
                            <label className="text-sm font-medium">Package Price:</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={packagePrice}
                              onChange={(e) => setPackagePrice(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              placeholder="0.00"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="text-sm font-medium">Session Price:</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={sessionPrice}
                              onChange={(e) => setSessionPrice(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        
                        {/* Tax calculation */}
                        {(sessionPrice || packagePrice) && (
                          <div className="text-xs text-gray-600">
                            Sales Tax (8.875%): ${calculateSalesTax(parseFloat(isPackage ? packagePrice || '0' : sessionPrice || '0')).toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      {/* Schedule remaining option for packages */}
                      {isPackage && (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={scheduleRemainingNow}
                            onChange={(e) => setScheduleRemainingNow(e.target.checked)}
                          />
                          <span className="text-sm">Schedule remaining {packageSize - 1} sessions now</span>
                        </label>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setBookingStep('client')}
                        >
                          Back
                        </Button>
                        <Button 
                          className="bg-green-200 hover:bg-green-300 text-green-800" 
                          size="sm" 
                          onClick={handleBookingSubmit}
                          disabled={!sessionPrice && !packagePrice}
                        >
                          Confirm Booking
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {tooltipContent.mode === 'delete' && (
                <div className="space-y-3 pt-2">
                  <div className="text-sm font-medium text-red-500">
                    {tooltipContent.isRecurring 
                      ? 'Delete this recurring timeslot:'
                      : 'Delete this timeslot:'
                    }
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      className="bg-purple-200 hover:bg-purple-300 text-purple-800"
                      size="sm" 
                      onClick={() => handleDeleteSubmit(false)}
                    >
                      Delete This Timeslot Only
                    </Button>
                    {tooltipContent.isRecurring && (
                      <Button 
                        className="bg-pink-200 hover:bg-pink-300 text-pink-800"
                        size="sm" 
                        onClick={() => handleDeleteSubmit(true)}
                      >
                        Delete Entire Recurring Series
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={closeTooltip}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {!tooltipContent.isAvailable && (
                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={closeTooltip}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={false}
        initialView={calendarView}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={fetchCalendarEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        timeZone={TIME_ZONE}
        scrollTime={initialScrollTime}
        height="auto"
        viewDidMount={handleViewDidMount}
        datesSet={handleDatesSet}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
      />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CalendarPageContent />
    </Suspense>
  );
}