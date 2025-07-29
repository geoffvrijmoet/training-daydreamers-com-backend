"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar, Settings, X, Plus, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export function GoogleCalendarManager() {
  const [connectedAccounts, setConnectedAccounts] = useState<GoogleAccount[]>([]);
  const [calendarSelections, setCalendarSelections] = useState<CalendarSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
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
          // Use the actual stored preferences from the database
          const storedSelections = preferencesData.preferences.map((pref: { googleUserId: string; calendarIds: string[] }) => ({
            googleUserId: pref.googleUserId,
            calendarIds: pref.calendarIds
          }));
          setCalendarSelections(storedSelections);
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google-calendar/auth');
      const data = await response.json();
      
      if (data.success) {
        // Redirect to Google OAuth
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
    if (!confirm(`Are you sure you want to disconnect ${googleEmail}? This will stop syncing events from this account.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ googleUserId }),
      });
      
      if (response.ok) {
        // Remove from state
        setConnectedAccounts(prev => prev.filter(acc => acc.googleUserId !== googleUserId));
        setCalendarSelections(prev => prev.filter(sel => sel.googleUserId !== googleUserId));
      } else {
        console.error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalendarToggle = (googleUserId: string, calendarId: string, checked: boolean) => {
    setCalendarSelections(prev => {
      const existingSelection = prev.find(sel => sel.googleUserId === googleUserId);
      
      if (existingSelection) {
        // Update existing selection
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
        // Create new selection
        return [...prev, {
          googleUserId,
          calendarIds: checked ? [calendarId] : []
        }];
      }
    });
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google-calendar/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountPreferences: calendarSelections }),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        // Refresh the page to show updated events
        window.location.reload();
      } else {
        console.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCalendarIds = (googleUserId: string): string[] => {
    const selection = calendarSelections.find(sel => sel.googleUserId === googleUserId);
    return selection ? selection.calendarIds : [];
  };

  const hasConnectedAccounts = connectedAccounts.length > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Connect button / Settings button */}
      {!hasConnectedAccounts ? (
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800"
        >
          <Calendar size={16} className="mr-2" />
          {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
        </Button>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              <Settings size={16} className="mr-2" />
              Google Calendar ({connectedAccounts.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Google Calendar Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-sm text-gray-600">
                Manage your connected Google accounts and select which calendars to sync:
              </div>
              
              {/* Connected Accounts */}
              {connectedAccounts.map((account) => (
                <div key={account.googleUserId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      <span className="font-medium">{account.googleEmail}</span>
                    </div>
                    <Button
                      onClick={() => handleDisconnect(account.googleUserId, account.googleEmail)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      <X size={14} className="mr-1" />
                      Disconnect
                    </Button>
                  </div>
                  
                  {/* Calendars for this account */}
                  <div className="space-y-2 pl-6">
                    <div className="text-sm font-medium text-gray-700">Calendars:</div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {account.calendars.map((calendar) => (
                        <div key={calendar.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${account.googleUserId}-${calendar.id}`}
                            checked={getSelectedCalendarIds(account.googleUserId).includes(calendar.id)}
                            onCheckedChange={(checked) => 
                              handleCalendarToggle(account.googleUserId, calendar.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={`${account.googleUserId}-${calendar.id}`} className="text-sm">
                            {calendar.summary}
                            {calendar.primary && (
                              <span className="ml-1 text-xs text-gray-500">(Primary)</span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Another Account */}
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                variant="outline"
                className="w-full text-green-700 border-green-300 hover:bg-green-100"
              >
                <Plus size={16} className="mr-2" />
                {isLoading ? 'Connecting...' : 'Connect Another Google Account'}
              </Button>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSavePreferences}
                  disabled={isLoading}
                  className="bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800"
                >
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 