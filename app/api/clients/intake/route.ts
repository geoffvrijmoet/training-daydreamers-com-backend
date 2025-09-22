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
      liabilityWaiver,
      additionalContacts,
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
      liabilityWaiver,
      additionalContacts,
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

      // Add liability waiver
      if (liabilityWaiver && liabilityWaiver.publicId) {
        filesToUpdate.push({
          publicId: liabilityWaiver.publicId,
          resourceType: liabilityWaiver.resourceType || 'raw'
        });
      }

      // Update metadata if there are files to update
      if (filesToUpdate.length > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:7777');
        const metadataUrl = `${baseUrl}/api/upload/update-metadata`;

        const metadataResponse = await fetch(metadataUrl, {
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

          // map new urls
          const successful = metadataResult.results.successful as Array<{oldPublicId:string; newUrl:string; newPublicId:string}>;
          if(successful?.length){
            // build map keyed by oldPublicId and by filename for robustness
            const urlMap = new Map<string,string>();
            const idMap = new Map<string,string>();
            successful.forEach(s=>{
              const finalUrl = s.newUrl ?? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${s.newPublicId}`;
              urlMap.set(s.oldPublicId, finalUrl);
              idMap.set(s.oldPublicId, s.newPublicId);
              const base = s.oldPublicId.split('/').pop() as string;
              urlMap.set(base, finalUrl);
              idMap.set(base, s.newPublicId);
            });

            const update: Record<string, unknown> = {};

            if (Array.isArray(vaccinationRecords) && vaccinationRecords.length) {
              update.vaccinationRecords = vaccinationRecords.map(rec => {
                const key = rec.publicId ?? rec.url.split('/').pop() ?? '';
                const newUrl = urlMap.get(key);
                const newId = idMap.get(key);
                return {
                  ...rec,
                  url: newUrl ?? rec.url,
                  publicId: newId ?? rec.publicId,
                };
              });
            }

            if (dogPhoto) {
              const key = dogPhoto.publicId ?? dogPhoto.url?.split('/').pop() ?? '';
              const newUrl = urlMap.get(key);
              const newId = idMap.get(key);
              if (newUrl || newId) {
                update.dogPhoto = {
                  ...dogPhoto,
                  url: newUrl ?? dogPhoto.url,
                  publicId: newId ?? dogPhoto.publicId,
                };
              }
            }

            if (Object.keys(update).length) {
              await ClientModel.updateOne({ _id: client._id }, { $set: update });
            }
          }
        }
      }
    } catch (metaError) {
      // Don't fail the entire request if metadata update fails
      console.error('Error updating file metadata:', metaError);
    }

    return NextResponse.json({
      success: true,
      clientId: client._id,
    });

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
} 