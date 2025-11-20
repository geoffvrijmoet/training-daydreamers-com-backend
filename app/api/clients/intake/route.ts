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
      // Personal Information
      pronouns,
      // Address fields (optional)
      addressLine1,
      addressLine2,
      city,
      state,
      addressZipCode,
      // Emergency Contact
      emergencyContact,
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
      vaccinationRecords,
      dogPhoto,
      liabilityWaiver,
      additionalContacts,
      waiverSigned
    } = data;

    // Convert string dates to Date objects
    const processedDogBirthdate = dogBirthdate ? new Date(dogBirthdate) : undefined;
    const processedAdditionalDogs = additionalDogs?.map((dog: { birthdate?: string; [key: string]: unknown }) => ({
      ...dog,
      birthdate: dog.birthdate ? new Date(dog.birthdate) : undefined
    }));

    // Convert string fields to arrays where model expects arrays
    const processedMedicalInfo = medicalInfo ? {
      ...medicalInfo,
      medicalIssues: typeof medicalInfo.medicalIssues === 'string' 
        ? medicalInfo.medicalIssues.split(/[,\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : medicalInfo.medicalIssues
    } : medicalInfo;

    const processedBehavioralInfo = behavioralInfo ? {
      ...behavioralInfo,
      behavioralIssues: typeof behavioralInfo.behavioralIssues === 'string'
        ? behavioralInfo.behavioralIssues.split(/[,\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : behavioralInfo.behavioralIssues,
      biteHistory: behavioralInfo.biteHistory ? {
        ...behavioralInfo.biteHistory,
        incidents: behavioralInfo.biteHistory.incidents?.map((incident: { date?: string; [key: string]: unknown }) => ({
          ...incident,
          date: incident.date ? new Date(incident.date) : undefined
        }))
      } : behavioralInfo.biteHistory
    } : behavioralInfo;

    const processedHouseholdInfo = householdInfo ? {
      ...householdInfo,
      allergies: householdInfo.allergies ? {
        human: typeof householdInfo.allergies.human === 'string'
          ? householdInfo.allergies.human.split(/[,\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0)
          : householdInfo.allergies.human,
        dog: typeof householdInfo.allergies.dog === 'string'
          ? householdInfo.allergies.dog.split(/[,\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0)
          : householdInfo.allergies.dog
      } : householdInfo.allergies
    } : householdInfo;

    // Populate dogInfo.behaviorConcerns from behavioralInfo.behavioralIssues for backwards compatibility
    const processedDogInfo = dogInfo ? {
      ...dogInfo,
      behaviorConcerns: processedBehavioralInfo?.behavioralIssues && Array.isArray(processedBehavioralInfo.behavioralIssues) && processedBehavioralInfo.behavioralIssues.length > 0
        ? processedBehavioralInfo.behavioralIssues
        : dogInfo.behaviorConcerns || [],
      // Remove spayedNeutered if reproductiveStatus is set (consolidate to one field)
      spayedNeutered: dogInfo.reproductiveStatus ? undefined : dogInfo.spayedNeutered
    } : dogInfo;

    // Create new client
    const client = new ClientModel({
      name,
      dogName,
      email,
      phone,
      dogBirthdate: processedDogBirthdate,
      // Personal Information
      pronouns,
      // Address fields (optional)
      addressLine1,
      addressLine2,
      city,
      state,
      addressZipCode,
      // Emergency Contact
      emergencyContact,
      // Additional Dogs
      additionalDogs: processedAdditionalDogs,
      // Enhanced Dog Information
      dogInfo: processedDogInfo,
      // Household Information
      householdInfo: processedHouseholdInfo,
      // Medical Information
      medicalInfo: processedMedicalInfo,
      // Behavioral Information
      behavioralInfo: processedBehavioralInfo,
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

      // Skip liability waiver - keep it in temp folder
      // Liability waivers stay in temp folder to avoid file moving issues
      // if (liabilityWaiver && liabilityWaiver.publicId) {
      //   filesToUpdate.push({
      //     publicId: liabilityWaiver.publicId,
      //     resourceType: liabilityWaiver.resourceType || 'raw'
      //   });
      // }

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