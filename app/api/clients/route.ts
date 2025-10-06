import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ClientModel from '@/models/Client';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      // Basic Information
      name,
      dogName,
      email,
      phone,
      dogBirthdate,
      notes,
      adminNotes,
      
      // Personal Information
      pronouns,
      
      // Address Information
      addressLine1,
      addressLine2,
      city,
      state,
      addressZipCode,
      
      // Agency Information
      intakeSource,
      agencyName,
      agencyRevenueShare,
      agencyHandlesTax,
      
      // Pricing Information
      sessionRate,
      packageInfo,
      
      // Emergency Contact
      emergencyContact,
      
      // Additional Contacts
      additionalContacts,
      
      // Additional Dogs
      additionalDogs,
      
      // Enhanced Dog Information
      dogInfo,
      
      // Household Information
      householdInfo,
      
      // Medical Information
      medicalInfo,
      
      // Behavioral Information
      behavioralInfo,
      
      // Files
      vaccinationRecords,
      dogPhoto,
      liabilityWaiver,
      
      // Intake Status
      intakeCompleted,
      waiverSigned
    } = body;

    // Create client document
    const client = new ClientModel({
      name,
      dogName,
      email,
      phone,
      dogBirthdate: dogBirthdate ? new Date(dogBirthdate) : undefined,
      notes,
      adminNotes,
      
      // Personal Information
      pronouns,
      
      // Address Information
      addressLine1,
      addressLine2,
      city,
      state,
      addressZipCode,
      
      // Agency Information
      intakeSource,
      agencyName,
      agencyRevenueShare,
      agencyHandlesTax,
      
      // Pricing Information
      sessionRate,
      packageInfo,
      
      // Emergency Contact
      emergencyContact,
      
      // Additional Contacts
      additionalContacts,
      
      // Additional Dogs
      additionalDogs,
      
      // Enhanced Dog Information
      dogInfo,
      
      // Household Information
      householdInfo,
      
      // Medical Information
      medicalInfo,
      
      // Behavioral Information
      behavioralInfo,
      
      // Files
      vaccinationRecords,
      dogPhoto,
      liabilityWaiver,
      
      // Intake Status
      intakeCompleted: intakeCompleted ?? true,
      waiverSigned
    });

    await client.save();

    // Update Cloudinary metadata for uploaded files if this is admin-created
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

      // Add liability waiver
      if (liabilityWaiver && liabilityWaiver.publicId && liabilityWaiver.resourceType) {
        filesToUpdate.push({
          publicId: liabilityWaiver.publicId,
          resourceType: liabilityWaiver.resourceType
        });
      }

      console.log('Files to update:', filesToUpdate);
      const hasAdminTempFiles = filesToUpdate.some(f => f.publicId.includes('admin-temp'));
      console.log('Has admin-temp files:', hasAdminTempFiles);

      // Update metadata if there are files to update and they have admin-temp prefix
      if (filesToUpdate.length > 0 && hasAdminTempFiles) {
        console.log('Starting direct metadata update for client:', client._id.toString());
        
        const updatePromises = filesToUpdate.map(async (file: { publicId: string; resourceType: string }) => {
          try {
            const pathParts = file.publicId.split('/');
            console.log('Processing file for metadata update:', { publicId: file.publicId, pathParts });
            
            // Handle new folder structure: clients/admin-temp/ -> clients/client-{id}/
            if (pathParts.length >= 3 && pathParts[0] === 'clients' && pathParts[1] === 'admin-temp') {
              console.log('Matched admin-temp structure, updating file:', file.publicId);
              
              const newPublicId = [...pathParts];
              newPublicId[1] = `client-${client._id.toString()}`;
              const newPath = newPublicId.join('/');
              
              console.log('Renaming from:', file.publicId, 'to:', newPath);

              // Move the file to new folder - different strategies for images vs raw files
              let renameResult;
              try {
                if (file.resourceType === 'raw') {
                  // For raw files (PDFs), use rename method as upload-from-URL has permission issues
                  renameResult = await cloudinary.uploader.rename(
                    file.publicId,
                    newPath,
                    { 
                      resource_type: 'raw',
                      overwrite: false
                    }
                  );

                  // Try to force update the asset_folder for raw files using explicit
                  try {
                    const explicitResult = await cloudinary.uploader.explicit(
                      newPath,
                      {
                        type: 'upload',
                        resource_type: 'raw',
                        asset_folder: newPath.substring(0, newPath.lastIndexOf('/')), // Set correct folder
                      }
                    );
                    console.log('Explicit update for asset_folder successful:', {
                      publicId: newPath,
                      newAssetFolder: explicitResult.asset_folder
                    });
                  } catch (explicitError) {
                    console.warn('Failed to update asset_folder via explicit:', explicitError);
                  }
                } else {
                  // For images, use upload method to properly update asset_folder
                  const originalResource = await cloudinary.api.resource(file.publicId, {
                    resource_type: file.resourceType || 'image'
                  });

                  renameResult = await cloudinary.uploader.upload(originalResource.secure_url, {
                    public_id: newPath.split('/').pop(), // Just the filename
                    folder: newPath.substring(0, newPath.lastIndexOf('/')), // The folder path
                    resource_type: (file.resourceType || 'image') as 'image' | 'raw' | 'video',
                    overwrite: false,
                    use_filename: true,
                    unique_filename: false
                  });
                }

                console.log(`${file.resourceType === 'raw' ? 'Rename' : 'Upload to new location'} successful:`, { 
                  oldPath: file.publicId,
                  newPath, 
                  newUrl: renameResult.secure_url,
                  method: file.resourceType === 'raw' ? 'rename' : 'upload',
                  renameResult: JSON.stringify(renameResult, null, 2)
                });

                // Delete the original file from the old location (only for images, as rename already moves raw files)
                if (file.resourceType !== 'raw') {
                  try {
                    await cloudinary.uploader.destroy(file.publicId, {
                      resource_type: (file.resourceType || 'image') as 'image' | 'raw' | 'video'
                    });
                    console.log('Old file deleted successfully:', file.publicId);
                  } catch (deleteError) {
                    console.warn('Failed to delete old file:', file.publicId, deleteError);
                  }
                }

                // Verify the file exists at the new location
                try {
                  const verifyResult = await cloudinary.api.resource(renameResult.public_id, {
                    resource_type: file.resourceType || 'image'
                  });
                  console.log('File verification successful:', { newPath: renameResult.public_id, exists: true });
                } catch (verifyError) {
                  console.error('File verification failed:', { newPath: renameResult.public_id, error: verifyError });
                }
              } catch (renameError) {
                console.error('Cloudinary rename failed:', {
                  oldPath: file.publicId,
                  newPath,
                  error: renameError,
                  errorMessage: renameError instanceof Error ? renameError.message : 'Unknown error'
                });
                throw renameError;
              }

              // Update tags - remove admin-temp and add new client tag
              await cloudinary.uploader.add_tag(
                `client-${client._id.toString()}`,
                [newPath],
                { resource_type: file.resourceType || 'image' }
              );

              await cloudinary.uploader.remove_tag(
                'admin-temp',
                [newPath],
                { resource_type: file.resourceType || 'image' }
              );

              // Update context metadata
              await cloudinary.uploader.explicit(
                newPath,
                {
                  type: 'upload',
                  resource_type: (file.resourceType || 'image') as 'image' | 'raw' | 'video',
                  context: {
                    client_id: client._id.toString(),
                    status: 'completed'
                  }
                }
              );

              console.log('File metadata updated successfully:', newPath);

              return {
                success: true,
                oldPublicId: file.publicId,
                newPublicId: newPath,
                newUrl: renameResult.secure_url
              };
            } else {
              console.log('File does not match admin-temp pattern, skipping:', file.publicId);
              return {
                success: false,
                oldPublicId: file.publicId,
                error: 'Does not match admin-temp pattern'
              };
            }
          } catch (error) {
            console.error('Error updating file metadata:', error);
            return {
              success: false,
              oldPublicId: file.publicId,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        });

        const results = await Promise.all(updatePromises);
        const successful = results.filter((r): r is { success: true; oldPublicId: string; newPublicId: string; newUrl: string } => r.success) ;
        const failed = results.filter(r => !r.success);
        
        console.log(`Metadata update completed: ${successful.length} successful, ${failed.length} failed`);
        
        if (failed.length > 0) {
          console.warn('Some file metadata updates failed:', failed);
        }

        // Verify the client folder was created by listing its contents
        try {
          const folderContents = await cloudinary.api.resources({
            type: 'upload',
            prefix: `clients/client-${client._id.toString()}/`,
            max_results: 50
          });
          console.log('Client folder verification:', {
            clientId: client._id.toString(),
            folderPrefix: `clients/client-${client._id.toString()}/`,
            totalFiles: folderContents.total_count,
            files: folderContents.resources.map((r: { public_id: string }) => r.public_id)
          });

          // Also check for raw files specifically
          const rawFolderContents = await cloudinary.api.resources({
            type: 'upload',
            resource_type: 'raw',
            prefix: `clients/client-${client._id.toString()}/`,
            max_results: 50
          });
          console.log('Client folder verification (raw files):', {
            clientId: client._id.toString(),
            folderPrefix: `clients/client-${client._id.toString()}/`,
            totalRawFiles: rawFolderContents.total_count,
            rawFiles: rawFolderContents.resources.map((r: { public_id: string, asset_folder: string }) => ({
              public_id: r.public_id,
              asset_folder: r.asset_folder
            }))
          });

          // Check if any files remain in admin-temp
          const adminTempContents = await cloudinary.api.resources({
            type: 'upload',
            resource_type: 'raw',
            prefix: `clients/admin-temp/`,
            max_results: 50
          });
          console.log('Admin-temp folder check (raw files):', {
            totalRemainingFiles: adminTempContents.total_count,
            remainingFiles: adminTempContents.resources.map((r: { public_id: string }) => r.public_id)
          });
        } catch (folderError) {
          console.error('Failed to verify client folder:', folderError);
        }

        // ---------------- Update URLs in client document ----------------
        if(successful.length){
          const urlMap=new Map<string,string>();
          const idMap=new Map<string,string>();
          successful.forEach((s) => {
            if(!s.newPublicId) return; // safeguard
            const finalUrl = s.newUrl ?? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${s.newPublicId}`;
            urlMap.set(s.oldPublicId, finalUrl);
            idMap.set(s.oldPublicId, s.newPublicId);
            const base = s.oldPublicId.split('/').pop() || s.oldPublicId;
            urlMap.set(base, finalUrl);
            idMap.set(base, s.newPublicId);
          });

          const updatePayload:Record<string,unknown>={};

          if(Array.isArray(vaccinationRecords)&&vaccinationRecords.length){
            updatePayload.vaccinationRecords=vaccinationRecords.map((rec) => {
              const key = rec.publicId ?? (() => { const parts = rec.url.split('/'); return parts[parts.length - 1]; })();
              const newUrl=urlMap.get(key);
              const newId=idMap.get(key);
              return {...rec, url:newUrl??rec.url, publicId:newId??rec.publicId};
            });
          }

          if(dogPhoto){
            const key=dogPhoto.publicId??(dogPhoto.url?.split('/')?.pop()||'');
            const newUrl=urlMap.get(key);
            const newId=idMap.get(key);
            if(newUrl||newId){
              updatePayload.dogPhoto={...dogPhoto, url:newUrl??dogPhoto.url, publicId:newId??dogPhoto.publicId};
            }
          }

          if(Object.keys(updatePayload).length){
             await ClientModel.updateOne({_id:client._id},{$set:updatePayload});
          }
        }
      } // end if(successful.length)
    } // end if(filesToUpdate.length > 0 && hasAdminTempFiles)
    catch (error) {
      // Don't fail the entire request if metadata update fails
      console.error('Error updating file metadata:', error);
    }

    return NextResponse.json({ 
      success: true, 
      clientId: client._id
    });
  } catch (error) {
    console.error('Detailed error in POST handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create client',
        details: error
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    const clients = await ClientModel.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, clients });
  } catch (error) {
    console.error('Detailed error in GET handler:', error);
    // Check if it's a connection error
    if (error instanceof Error && 
        (error.message.includes('EADDRNOTAVAIL') || 
         error.message.includes('connect'))) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection error. Please try again in a few moments.',
          details: error.message
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch clients',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 