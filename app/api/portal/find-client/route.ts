import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ClientModel, { IClient } from '@/models/Client';
import { Types } from 'mongoose';

// Search criteria can include dogName, contact matching via $or, and optional name
// Contact matching checks both primary email/phone and additionalContacts email/phone

type ClientLeanResult = Omit<IClient, '_id'> & { _id: Types.ObjectId };

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const { name, dogName, email, phone } = body;

    // Validation: require dog name and at least one contact method
    if (!dogName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Dog name is required' },
        { status: 400 }
      );
    }

    if (!email?.trim() && !phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please provide either email or phone number' },
        { status: 400 }
      );
    }

    // Build search query
    // If dog name is provided, include it in the search; otherwise search by email/phone only
    const searchCriteria: any = {};
    
    if (dogName?.trim()) {
      searchCriteria.dogName = new RegExp(dogName.trim(), 'i'); // Case-insensitive search
    }

    // Add contact method matching - check both primary email and co-owner emails
    const contactCriteria: Array<any> = [];
    if (email?.trim()) {
      const emailRegex = new RegExp(email.trim(), 'i');
      // Match primary email OR any co-owner email
      contactCriteria.push(
        { email: emailRegex },
        { 'additionalContacts.email': emailRegex }
      );
    }
    if (phone?.trim()) {
      // Normalize phone number by removing common separators
      const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
      const phoneRegex = normalizedPhone.replace(/\D/g, '');
      contactCriteria.push({ 
        phone: { 
          $regex: phoneRegex, 
          $options: 'i' 
        } 
      });
      // Also check co-owner phones
      contactCriteria.push({
        'additionalContacts.phone': {
          $regex: phoneRegex,
          $options: 'i'
        }
      });
    }

    if (contactCriteria.length > 0) {
      searchCriteria.$or = contactCriteria;
    }

    // Optionally add name matching if provided (but not required)
    if (name?.trim()) {
      searchCriteria.name = new RegExp(name.trim(), 'i');
    }

    const client = await ClientModel.findOne(searchCriteria).lean() as ClientLeanResult | null;

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'No matching client found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      clientId: client._id.toString(),
      clientName: client.name,
      dogName: client.dogName
    });

  } catch (error) {
    console.error('Error finding client:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 