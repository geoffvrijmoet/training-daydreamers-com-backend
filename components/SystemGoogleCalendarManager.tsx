"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, X, User, Loader2 } from 'lucide-react';


interface SystemGoogleConnection {
  _id: string;
  connectionName: string;
  googleUserId: string;
  googleEmail: string;
  calendarIds: string[];
  isActive: boolean;
  lastSyncAt?: string;
}

export function SystemGoogleCalendarManager() {
  const [connections, setConnections] = useState<SystemGoogleConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitiallyLoading, setIsInitiallyLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setIsInitiallyLoading(true);
    setConnectionError(null);
    try {
      const response = await fetch('/api/system-google-calendar/calendars');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.connections) {
          setConnections(data.connections);
        }
      } else {
        const errorData = await response.json().catch(() => null);
        if (errorData?.requiresReauth) {
          setConnectionError('System Google Calendar connection expired. Please reconnect.');
        }
      }
    } catch (error) {
      console.error('Error checking system connection status:', error);
    } finally {
      setIsInitiallyLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/system-google-calendar/auth');
      const data = await response.json();
      
      if (data.success) {
        window.location.href = data.authUrl;
      } else {
        console.error('Failed to get system auth URL:', data.error);
      }
    } catch (error) {
      console.error('Error initiating system OAuth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (googleUserId: string, googleEmail: string) => {
    if (!confirm(`Disconnect system calendar ${googleEmail}?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/system-google-calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleUserId }),
      });
      
      if (response.ok) {
        setConnections(prev => prev.filter(conn => conn.googleUserId !== googleUserId));
      }
    } catch (error) {
      console.error('Error disconnecting system calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitiallyLoading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
        <Loader2 size={16} className="text-gray-500 animate-spin" />
        <span className="text-sm text-gray-600">Loading system calendar connections...</span>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="space-y-3">
        {connectionError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-600" />
              <span className="text-sm text-amber-800">{connectionError}</span>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              size="sm"
              className="mt-2 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800"
            >
              <Plus size={14} className="mr-1" />
              {isLoading ? 'Connecting...' : 'Reconnect System Calendar'}
            </Button>
          </div>
        )}
        
        {!connectionError && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">Connect your Google Calendar to block unavailable times for clients</span>
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
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Google Calendar Integration</span>
        </div>
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="text-green-700 border-green-300 hover:bg-green-100"
        >
          <Plus size={14} className="mr-1" />
          {isLoading ? 'Connecting...' : 'Add Another Account'}
        </Button>
      </div>

      <div className="space-y-3">
        {connections.map((connection) => (
          <div key={connection._id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{connection.connectionName}</span>
                <span className="text-xs text-gray-500">({connection.googleEmail})</span>
              </div>
              <Button
                onClick={() => handleDisconnect(connection.googleUserId, connection.googleEmail)}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <X size={12} />
              </Button>
            </div>
            
            <div className="pl-4">
              <div className="text-xs text-gray-600">
                <div>Calendars: {connection.calendarIds.length} selected</div>
                {connection.lastSyncAt && (
                  <div>Last sync: {new Date(connection.lastSyncAt).toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
        <strong>System Calendar:</strong> This calendar connection syncs your Google Calendar events to block off unavailable times for all clients in the portal. 
        Your Google Calendar events will appear as &quot;Unavailable&quot; times that clients cannot book, preventing double-booking.
      </div>
    </div>
  );
}
