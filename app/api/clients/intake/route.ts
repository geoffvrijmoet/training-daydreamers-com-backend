import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ClientModel from '@/models/Client';

export async function POST(request: Request) {
  try {
    await connectDB();

    const data = await request.json();
    const {
      name,
      dogName,
      email,
      phone,
      dogBirthdate,
      // Address fields (optional)
      addressLine1,
      addressLine2,
      city,
      state,
      addressZipCode,
      vaccinationRecords,
      dogPhoto,
      waiverSigned
    } = data;

    // Create new client
    const client = new ClientModel({
      name,
      dogName,
      email,
      phone,
      dogBirthdate,
      // Address fields (optional)
      addressLine1,
      addressLine2,
      city,
      state,
      addressZipCode,
      vaccinationRecords,
      dogPhoto,
      waiverSigned,
      intakeCompleted: true
    });

    await client.save();

    // Update Cloudinary metadata for uploaded files
    try {
      const filesToUpdate = [];
      
      // Add vaccination records
      if (vaccinationRecords && Array.isArray(vaccinationRecords)) {
        vaccinationRecords.forEach((record: { publicId?: string; resourceType?: string }) => {
          if (record.publicId && record.resourceType) {
            filesToUpdate.push({
              publicId: record.publicId,
              resourceType: record.resourceType
            });
          }
        });
      }
      
      // Add dog photo
      if (dogPhoto && dogPhoto.publicId && dogPhoto.resourceType) {
        filesToUpdate.push({
          publicId: dogPhoto.publicId,
          resourceType: dogPhoto.resourceType
        });
      }

      // Update metadata if there are files to update
      if (filesToUpdate.length > 0) {
        const metadataResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload/update-metadata`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: filesToUpdate,
            clientId: client._id.toString()
          })
        });

        if (!metadataResponse.ok) {
          console.warn('Failed to update file metadata, but client was created successfully');
        } else {
          const metadataResult = await metadataResponse.json();
          console.log('File metadata updated:', metadataResult.message);
        }
      }
    } catch (error) {
      // Don't fail the entire request if metadata update fails
      console.error('Error updating file metadata:', error);
    }

    return NextResponse.json({ 
      success: true, 
      clientId: client._id 
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
} 