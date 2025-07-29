"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, X, User, Loader2 } from 'lucide-react';

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole: string;
}

interface GoogleAccount {
  googleUserId: string;
  googleEmail: string;
  calendars: GoogleCalendar[];
}

interface CalendarSelection {
  googleUserId: string;
  calendarIds: string[];
}

export function GoogleCalendarInlineManager() {
  const [connectedAccounts, setConnectedAccounts] = useState<GoogleAccount[]>([]);
  const [calendarSelections, setCalendarSelections] = useState<CalendarSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitiallyLoading, setIsInitiallyLoading] = useState(true);


  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setIsInitiallyLoading(true);
    try {
      const [calendarsResponse, preferencesResponse] = await Promise.all([
        fetch('/api/google-calendar/calendars'),
        fetch('/api/google-calendar/preferences')
      ]);
      
      if (calendarsResponse.ok && preferencesResponse.ok) {
        const calendarsData = await calendarsResponse.json();
        const preferencesData = await preferencesResponse.json();
        
        if (calendarsData.success && calendarsData.accounts) {
          setConnectedAccounts(calendarsData.accounts);
        }
        
        if (preferencesData.success && preferencesData.preferences) {
          const storedSelections = preferencesData.preferences.map((pref: { googleUserId: string; calendarIds: string[] }) => ({
            googleUserId: pref.googleUserId,
            calendarIds: pref.calendarIds
          }));
          setCalendarSelections(storedSelections);
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    } finally {
      setIsInitiallyLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google-calendar/auth');
      const data = await response.json();
      
      if (data.success) {
        window.location.href = data.authUrl;
      } else {
        console.error('Failed to get auth URL:', data.error);
      }
    } catch (error) {
      console.error('Error initiating OAuth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (googleUserId: string, googleEmail: string) => {
    if (!confirm(`Disconnect ${googleEmail}?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleUserId }),
      });
      
      if (response.ok) {
        setConnectedAccounts(prev => prev.filter(acc => acc.googleUserId !== googleUserId));
        setCalendarSelections(prev => prev.filter(sel => sel.googleUserId !== googleUserId));
        window.location.reload(); // Refresh to update calendar display
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalendarToggle = async (googleUserId: string, calendarId: string, checked: boolean) => {
    // Update local state immediately for responsive UI
    setCalendarSelections(prev => {
      const existingSelection = prev.find(sel => sel.googleUserId === googleUserId);
      
      if (existingSelection) {
        return prev.map(sel => {
          if (sel.googleUserId === googleUserId) {
            return {
              ...sel,
              calendarIds: checked 
                ? [...sel.calendarIds, calendarId]
                : sel.calendarIds.filter(id => id !== calendarId)
            };
          }
          return sel;
        });
      } else {
        return [...prev, {
          googleUserId,
          calendarIds: checked ? [calendarId] : []
        }];
      }
    });

    // Save to backend
    try {
      // Get updated selections for this account
      const updatedSelection = calendarSelections.find(sel => sel.googleUserId === googleUserId);
      const newCalendarIds = checked 
        ? [...(updatedSelection?.calendarIds || []), calendarId]
        : (updatedSelection?.calendarIds || []).filter(id => id !== calendarId);

      const accountPreferences = calendarSelections.map(sel => 
        sel.googleUserId === googleUserId 
          ? { ...sel, calendarIds: newCalendarIds }
          : sel
      );

      await fetch('/api/google-calendar/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountPreferences }),
      });

      // Refresh calendar to show/hide events
      window.location.reload();
    } catch (error) {
      console.error('Error saving calendar preference:', error);
    }
  };

  const getSelectedCalendarIds = (googleUserId: string): string[] => {
    const selection = calendarSelections.find(sel => sel.googleUserId === googleUserId);
    return selection ? selection.calendarIds : [];
  };

  if (isInitiallyLoading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
        <Loader2 size={16} className="text-gray-500 animate-spin" />
        <span className="text-sm text-gray-600">Loading calendar connections...</span>
      </div>
    );
  }

  if (connectedAccounts.length === 0) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
        <Calendar size={16} className="text-gray-500" />
        <span className="text-sm text-gray-600">No Google Calendars connected</span>
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          size="sm"
          className="bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800"
        >
          <Plus size={14} className="mr-1" />
          {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Google Calendars</span>
        </div>
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="text-green-700 border-green-300 hover:bg-green-100"
        >
          <Plus size={14} className="mr-1" />
          {isLoading ? 'Connecting...' : 'Connect Another Account'}
        </Button>
      </div>

      <div className="space-y-3">
        {connectedAccounts.map((account) => (
          <div key={account.googleUserId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{account.googleEmail}</span>
              </div>
              <Button
                onClick={() => handleDisconnect(account.googleUserId, account.googleEmail)}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <X size={12} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pl-4">
              {account.calendars.map((calendar) => (
                <div key={calendar.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${account.googleUserId}-${calendar.id}`}
                    checked={getSelectedCalendarIds(account.googleUserId).includes(calendar.id)}
                    onCheckedChange={(checked) => 
                      handleCalendarToggle(account.googleUserId, calendar.id, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`${account.googleUserId}-${calendar.id}`} 
                    className="text-xs text-gray-600 cursor-pointer"
                  >
                    {calendar.summary}
                    {calendar.primary && <span className="text-gray-400"> (Primary)</span>}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 