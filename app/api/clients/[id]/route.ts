import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import ClientModel, { IClient } from '@/models/Client';
import { Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type ClientLeanResult = Omit<IClient, '_id'> & { _id: Types.ObjectId };

// GET /api/clients/[id]
// Fetches client details by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = params.id;

  if (!Types.ObjectId.isValid(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    await connectDB();

    const client = await ClientModel.findById(clientId).lean() as ClientLeanResult | null;
    
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Return full client data for client details page
    return NextResponse.json({
      success: true,
      client: {
        ...client,
        _id: client._id.toString(),
      }
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id]
// Updates client details
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = params.id;

  if (!Types.ObjectId.isValid(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const { 
      name, 
      dogName, 
      email, 
      phone, 
      notes, 
      adminNotes,
      dogBirthdate,
      addressLine1,
      addressLine2,
      city,
      state,
      addressZipCode,
      emergencyContact,
      dogInfo,
      sessionRate,
      packageInfo,
      intakeSource,
      agencyName,
      agencyRevenueShare,
      agencyHandlesTax,
      vaccinationRecords,
      dogPhoto,
      liabilityWaiver
    } = body;

    const updatedClient = await ClientModel.findByIdAndUpdate(
      clientId,
      {
        name,
        dogName,
        email,
        phone,
        notes,
        adminNotes,
        dogBirthdate,
        addressLine1,
        addressLine2,
        city,
        state,
        addressZipCode,
        emergencyContact,
        dogInfo,
        sessionRate,
        packageInfo,
        intakeSource,
        agencyName,
        agencyRevenueShare,
        agencyHandlesTax,
        vaccinationRecords,
        dogPhoto,
        liabilityWaiver,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      client: updatedClient 
    });

  } catch (error) {
    console.error('Error updating client:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]
// Deletes a client and associated files
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = params.id;

  if (!Types.ObjectId.isValid(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    await connectDB();

    // First, get the client to access file information
    const client = await ClientModel.findById(clientId);
    
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Collect all file public IDs that need to be deleted from Cloudinary
    const filesToDelete: { publicId: string; resourceType: string }[] = [];

    // Add vaccination records
    if (client.vaccinationRecords && client.vaccinationRecords.length > 0) {
      client.vaccinationRecords.forEach((record: { publicId?: string; resourceType?: string }) => {
        if (record.publicId && record.resourceType) {
          filesToDelete.push({
            publicId: record.publicId,
            resourceType: record.resourceType
          });
        }
      });
    }

    // Add dog photo
    if (client.dogPhoto?.publicId && client.dogPhoto?.resourceType) {
      filesToDelete.push({
        publicId: client.dogPhoto.publicId,
        resourceType: client.dogPhoto.resourceType
      });
    }

    // Add liability waiver
    if (client.liabilityWaiver?.publicId && client.liabilityWaiver?.resourceType) {
      filesToDelete.push({
        publicId: client.liabilityWaiver.publicId,
        resourceType: client.liabilityWaiver.resourceType
      });
    }

    // Delete files from Cloudinary
    const deletePromises = filesToDelete.map(async (file) => {
      try {
        await cloudinary.uploader.destroy(file.publicId, {
          resource_type: file.resourceType as 'image' | 'raw' | 'video'
        });
        return { success: true, publicId: file.publicId };
      } catch (error) {
        console.error(`Failed to delete file ${file.publicId}:`, error);
        return { success: false, publicId: file.publicId, error };
      }
    });

    const deleteResults = await Promise.all(deletePromises);
    const failedDeletes = deleteResults.filter(result => !result.success);

    if (failedDeletes.length > 0) {
      console.warn(`Failed to delete ${failedDeletes.length} files from Cloudinary`);
    }

    // Delete the client from MongoDB
    await ClientModel.findByIdAndDelete(clientId);

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
      filesDeleted: deleteResults.length,
      filesFailedToDelete: failedDeletes.length
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 