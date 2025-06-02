import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { connectDB } from '@/lib/db';
import ClientModel from '@/models/Client';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryResource {
  public_id: string;
  created_at: string;
  resource_type: string;
  secure_url: string;
}

export async function POST(request: Request) {
  try {
    await connectDB();
    
    // Get all Cloudinary resources with temp tags (abandoned uploads)
    const tempResources = await cloudinary.search
      .expression('tags:temp OR tags:admin-temp OR tags:client-temp')
      .max_results(500)
      .execute();

    // Get resources older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldTempResources = tempResources.resources.filter((resource: CloudinaryResource) => {
      const createdAt = new Date(resource.created_at);
      return createdAt < oneDayAgo;
    });

    // BACKUP PROTECTION: Check if any temp files are referenced in client records
    const allClients = await ClientModel.find({}).lean();
    const referencedUrls = new Set<string>();
    
    // Collect all file URLs from client records
    allClients.forEach(client => {
      // Check vaccination records
      if (client.vaccinationRecords && Array.isArray(client.vaccinationRecords)) {
        client.vaccinationRecords.forEach((record: { url?: string }) => {
          if (record.url) referencedUrls.add(record.url);
        });
      }
      
      // Check dog photo
      if (client.dogPhoto && client.dogPhoto.url) {
        referencedUrls.add(client.dogPhoto.url);
      }

      // Check liability waiver
      if (client.liabilityWaiver && client.liabilityWaiver.url) {
        referencedUrls.add(client.liabilityWaiver.url);
      }
    });

    // Filter out temp files that are actually referenced in the database
    const safeTempResources = oldTempResources.filter((resource: CloudinaryResource) => {
      return !referencedUrls.has(resource.secure_url);
    });

    // Check for orphaned resources in both new and legacy folder structures
    const newStructureResources = await cloudinary.search
      .expression('folder:clients/*')
      .max_results(500)
      .execute();

    const legacyVaccinationResources = await cloudinary.search
      .expression('folder:vaccination-records/*')
      .max_results(500)
      .execute();

    const legacyDogPhotoResources = await cloudinary.search
      .expression('folder:dog-photos/*')
      .max_results(500)
      .execute();

    const allResources = [
      ...newStructureResources.resources, 
      ...legacyVaccinationResources.resources, 
      ...legacyDogPhotoResources.resources
    ];
    
    // Extract client IDs from resource paths and check if they exist in database
    const orphanedResources = [];
    
    for (const resource of allResources) {
      // Skip temp resources (already handled above)
      if (resource.public_id.includes('temp') || resource.public_id.includes('admin-temp') || resource.public_id.includes('client-temp')) continue;
      
      // BACKUP PROTECTION: Skip if this file is referenced in any client record
      if (referencedUrls.has(resource.secure_url)) continue;
      
      // Extract client ID from different path structures
      const pathParts = resource.public_id.split('/');
      let clientId = null;
      
      if (pathParts[0] === 'clients' && pathParts.length >= 2) {
        // New structure: clients/client-123/subfolder/file
        const clientFolder = pathParts[1]; // e.g., "client-123"
        clientId = clientFolder.replace('client-', '');
      } else if (pathParts.length >= 2) {
        // Legacy structure: vaccination-records/client-123/file or dog-photos/client-123/file
        const clientFolder = pathParts[1]; // e.g., "client-123"
        clientId = clientFolder.replace('client-', '');
      }
      
      if (clientId) {
        // Skip if this looks like a temp ID
        if (clientId === 'temp' || clientId === 'admin') continue;
        
        // Check if client exists in database
        try {
          const client = await ClientModel.findById(clientId);
          if (!client) {
            // Check if resource is older than 1 hour to avoid deleting files from in-progress forms
            const createdAt = new Date(resource.created_at);
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            if (createdAt < oneHourAgo) {
              orphanedResources.push(resource);
            }
          }
        } catch (error) {
          // If clientId is not a valid ObjectId, consider it orphaned if old enough
          const createdAt = new Date(resource.created_at);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (createdAt < oneHourAgo) {
            orphanedResources.push(resource);
          }
        }
      }
    }

    // Combine all resources to delete (now using safeTempResources instead of oldTempResources)
    const resourcesToDelete = [...safeTempResources, ...orphanedResources];
    
    // Delete the orphaned resources
    const deletePromises = resourcesToDelete.map((resource: CloudinaryResource) => 
      cloudinary.uploader.destroy(resource.public_id, {
        resource_type: resource.resource_type || 'image'
      })
    );

    const deleteResults = await Promise.allSettled(deletePromises);
    
    const successful = deleteResults.filter(result => 
      result.status === 'fulfilled' && result.value.result === 'ok'
    ).length;
    
    const failed = deleteResults.length - successful;

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${successful} files deleted, ${failed} failed`,
      details: {
        totalFound: resourcesToDelete.length,
        successful,
        failed,
        oldTempFiles: oldTempResources.length,
        protectedTempFiles: oldTempResources.length - safeTempResources.length,
        orphanedFiles: orphanedResources.length
      }
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
} 