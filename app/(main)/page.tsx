"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPlus, Users, UserPlus, FileText } from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div 
        className={`w-full max-w-2xl transition-all duration-1000 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl font-bold text-purple-700 mb-4">
              Welcome, Madeline! 🐕
            </CardTitle>
            <p className="text-xl text-gray-600">
              What would you like to do today?
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New Report Card */}
              <Link href="/report-cards/new" className="block">
                <Button 
                  onClick={(e) => { document.body.classList.add('cursor-loading'); }}
                  className="relative overflow-hidden w-full h-20 bg-pink-100 hover:bg-pink-200 active:bg-pink-300 text-pink-700 hover:text-pink-800 transition-all duration-200 shadow-md hover:shadow-lg active:shadow-sm group"
                  size="lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">New Report Card</span>
                  </div>
                </Button>
              </Link>

              {/* View Clients */}
              <Link href="/clients" className="block">
                <Button 
                  onClick={(e) => { document.body.classList.add('cursor-loading'); }}
                  className="relative overflow-hidden w-full h-20 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-200 shadow-md hover:shadow-lg active:shadow-sm group"
                  size="lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">View Clients</span>
                  </div>
                </Button>
              </Link>

              {/* New Client */}
              <Link href="/clients/new" className="block">
                <Button 
                  onClick={(e) => { document.body.classList.add('cursor-loading'); }}
                  className="relative overflow-hidden w-full h-20 bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-700 hover:text-green-800 transition-all duration-200 shadow-md hover:shadow-lg active:shadow-sm group"
                  size="lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">New Client</span>
                  </div>
                </Button>
              </Link>

              {/* See Calendar */}
              <Link href="/calendar" className="block">
                <Button 
                  onClick={(e) => { document.body.classList.add('cursor-loading'); }}
                  className="relative overflow-hidden w-full h-20 bg-purple-100 hover:bg-purple-200 active:bg-purple-300 text-purple-700 hover:text-purple-800 transition-all duration-200 shadow-md hover:shadow-lg active:shadow-sm group"
                  size="lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <CalendarPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">See Calendar</span>
                  </div>
                </Button>
              </Link>
            </div>

            {/* Additional Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center mb-4">Quick Actions</p>
              <div className="flex justify-center gap-3">
                <Link href="/settings">
                  <Button 
                    onClick={(e) => { document.body.classList.add('cursor-loading'); }}
                    variant="outline"
                    size="sm"
                    className="relative overflow-hidden text-amber-700 border-amber-300 hover:bg-amber-100 active:bg-amber-200"
                  >
                    Settings
                  </Button>
                </Link>
                <Link href="/qr-codes">
                  <Button 
                    onClick={(e) => { document.body.classList.add('cursor-loading'); }}
                    variant="outline"
                    size="sm"
                    className="relative overflow-hidden text-orange-700 border-orange-300 hover:bg-orange-100 active:bg-orange-200"
                  >
                    QR Codes
                  </Button>
                </Link>
                <Link href="/dog-training-agencies">
                  <Button 
                    onClick={(e) => { document.body.classList.add('cursor-loading'); }}
                    variant="outline"
                    size="sm"
                    className="relative overflow-hidden text-gray-600 border-gray-300 hover:bg-gray-100 active:bg-gray-200"
                  >
                    Agencies
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
