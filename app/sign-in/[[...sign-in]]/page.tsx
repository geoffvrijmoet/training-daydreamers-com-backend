"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mb-8">
        <div className="relative h-[100px] w-full">
          <Image
            src="/images/daydreamers-dog-training-logo.webp"
            alt="Daydreamers Dog Training"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      <SignIn 
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "bg-white shadow-lg rounded-lg p-6",
            headerTitle: "font-fredoka font-medium text-center",
            headerSubtitle: "font-fredoka font-light text-center",
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
          }
        }}
      />
    </div>
  );
} 