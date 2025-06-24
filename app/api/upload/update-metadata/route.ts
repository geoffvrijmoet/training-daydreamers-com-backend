import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { files, clientId } = await request.json();

    console.log('Metadata update called with:', { files, clientId });

    if (!files || !Array.isArray(files) || !clientId) {
      return NextResponse.json(
        { error: 'Files array and clientId are required' },
        { status: 400 }
      );
    }

    const updatePromises = files.map(async (file: { publicId: string; resourceType: string }) => {
      try {
        // Ensure a valid Cloudinary resource type. Default to `image` when unknown.
        const rt =
          file.resourceType === 'raw'
            ? 'raw'
            : file.resourceType === 'video'
            ? 'video'
            : 'image';

        type ValidResourceType = 'image' | 'raw' | 'video';
        let finalType: ValidResourceType = rt;
        const buildResourceOpts = (t: ValidResourceType) =>
          (t === 'image' ? {} : { resource_type: t });
        let resourceOptions = buildResourceOpts(finalType);

        // Extract current path parts
        const pathParts = file.publicId.split('/');
        console.log('Processing file:', { publicId: file.publicId, pathParts });
        
        // Handle new folder structure: clients/temp/ or clients/admin-temp/ -> clients/client-{id}/
        if (pathParts.length >= 3 && pathParts[0] === 'clients' && (pathParts[1] === 'temp' || pathParts[1] === 'admin-temp')) {
          console.log('Matched new folder structure for file:', file.publicId);
          const newPublicId = [...pathParts];
          newPublicId[1] = `client-${clientId}`;
          const newPath = newPublicId.join('/');

          // Helper to ensure folder exists then rename
          const renameWithEnsure = async () => {
            const targetFolder = newPath.split('/').slice(0, -1).join('/');
            try {
              await cloudinary.api.create_folder(targetFolder);
            } catch {/* folder may already exist */}

            // Ensure the source asset is actually available before renaming
            const sourceReady = await waitUntilExists(file.publicId, finalType);
            if (!sourceReady) throw new Error('Source asset not yet available in Cloudinary');

            const tryTypes: ValidResourceType[] = ['image', 'raw', 'video'];
            // Ensure current type is tried first
            const orderedTypes = [finalType, ...tryTypes.filter((t) => t !== finalType)];

            // If the asset is already at the target location, skip renaming
            try {
              await cloudinary.api.resource(newPath, {
                resource_type: finalType,
              });
              // If no error was thrown, asset already exists at destination
              return { result: 'existing', secure_url: undefined } as { result: string; secure_url?: string };
            } catch {
              /* Resource not found at destination – continue with rename attempts */
            }

            for (const resType of orderedTypes) {
              const maxAttempts = 3;
              for (let i = 0; i < maxAttempts; i++) {
                try {
                  const renameOpts = {
                    overwrite: false,
                    invalidate: true,
                    resource_type: resType,
                    type: 'upload',
                    to_type: 'upload',
                  } as const;

                  const res = await cloudinary.uploader.rename(
                    file.publicId,
                    newPath,
                    renameOpts
                  );

                  if (
                    res.result === 'ok' ||
                    res.result === 'created' ||
                    res.result === 'existing' ||
                    res.result === 'already_exists'
                  ) {
                    finalType = resType;
                    resourceOptions = buildResourceOpts(finalType);
                    // Best-effort: delete the source asset so it no longer appears in temp folders
                    try {
                      const delRes = await cloudinary.api.delete_resources([file.publicId], {
                        resource_type: resType,
                        type: 'upload',
                      });
                      console.log('Deleted temp asset:', delRes);
                    } catch (delErr) {
                      console.warn('Failed to delete temp asset:', delErr);
                    }
                    return res;
                  }

                  throw new Error(`Rename result ${res.result}`);
                } catch (err: unknown) {
                  const e = err as { http_code?: number; message?: string } | undefined;
                  // Cloudinary quirk: sometimes returns 404 for source even though the rename succeeded.
                  if (
                    e?.http_code === 404 ||
                    (typeof e?.message === 'string' && e.message.includes('Resource not found'))
                  ) {
                    try {
                      const destExists = await waitUntilExists(newPath, resType);
                      if (destExists) {
                        // Treat as success
                        finalType = resType;
                        resourceOptions = buildResourceOpts(finalType);
                        // Attempt to delete the original asset so it no longer shows in temp folder
                        try {
                          const delRes = await cloudinary.api.delete_resources([file.publicId], {
                            resource_type: resType,
                            type: 'upload',
                          });
                          console.log('Deleted temp asset (404 fallback):', delRes);
                        } catch (delErr) {
                          console.warn('Failed to delete temp asset (404 fallback):', delErr);
                        }
                        return { result: 'ok', secure_url: undefined } as { result: string; secure_url?: string };
                      }
                    } catch {/* ignore */}
                  }

                  // Only retry/continue if not last attempt & resource types remain
                  const isLastAttempt = i === maxAttempts - 1;
                  const isLastResType = orderedTypes.indexOf(resType) === orderedTypes.length - 1;
                  if (isLastAttempt && isLastResType) throw err;
                  // Wait before retrying or switching type
                  await new Promise((r) => setTimeout(r, 700));
                }
              }
            }
          };

          let renameResult;
          try {
            renameResult = await renameWithEnsure();
          } catch (renameErr: unknown) {
            const rn = renameErr as { message?: string } | undefined;
            console.warn('Rename failed, attempting copy-then-delete fallback:', rn?.message || renameErr);

            // Fallback: copy asset by URL into new location then delete old
            try {
              const srcUrl = cloudinary.url(file.publicId, {
                type: 'upload',
                resource_type: finalType,
                secure: true,
              });

              const copyRes = await cloudinary.uploader.upload(srcUrl, {
                public_id: newPath,
                type: 'upload',
                resource_type: finalType,
                overwrite: false,
              });

              console.log('Copied asset as fallback:', copyRes.public_id);

              // Delete original temp asset
              try {
                const delRes = await cloudinary.api.delete_resources([file.publicId], {
                  resource_type: finalType,
                  type: 'upload',
                });
                console.log('Deleted temp asset after copy:', delRes);
              } catch (delErr) {
                console.warn('Failed to delete temp asset after copy:', delErr);
              }

              renameResult = { result: 'copied', secure_url: copyRes.secure_url } as { result: string; secure_url?: string };
            } catch (copyErr) {
              console.error('Copy-then-delete fallback failed:', copyErr);
              throw copyErr;
            }
          }

          // Update tags - remove temp tags and add new client tag
          await cloudinary.uploader.add_tag(`client-${clientId}`, [newPath], resourceOptions);

          // Remove old tags
          const oldTag = pathParts[1]; // either 'temp' or 'admin-temp'
          await cloudinary.uploader.remove_tag(oldTag, [newPath], resourceOptions);

          // Update context metadata
          await cloudinary.uploader.explicit(newPath, {
            type: 'upload',
            ...resourceOptions,
            context: {
              client_id: clientId,
              status: 'completed',
            },
          });

          return {
            success: true,
            oldPublicId: file.publicId,
            newPublicId: newPath,
            newUrl: renameResult.secure_url
          };
        } 
        // Handle legacy folder structure for backward compatibility
        else if (pathParts.length >= 2 && (pathParts[1] === 'client-temp' || pathParts[1] === 'admin-temp')) {
          const newPublicId = [...pathParts];
          newPublicId[1] = `client-${clientId}`;
          const newPath = newPublicId.join('/');

          // Helper to ensure folder exists then rename
          const renameWithEnsure = async () => {
            const targetFolder = newPath.split('/').slice(0, -1).join('/');
            try {
              await cloudinary.api.create_folder(targetFolder);
            } catch {/* folder may already exist */}

            // Ensure the source asset is actually available before renaming
            const sourceReady = await waitUntilExists(file.publicId, finalType);
            if (!sourceReady) throw new Error('Source asset not yet available in Cloudinary');

            const tryTypes: ValidResourceType[] = ['image', 'raw', 'video'];
            // Ensure current type is tried first
            const orderedTypes = [finalType, ...tryTypes.filter((t) => t !== finalType)];

            // If the asset is already at the target location, skip renaming
            try {
              await cloudinary.api.resource(newPath, {
                resource_type: finalType,
              });
              // If no error was thrown, asset already exists at destination
              return { result: 'existing', secure_url: undefined } as { result: string; secure_url?: string };
            } catch {
              /* Resource not found at destination – continue with rename attempts */
            }

            for (const resType of orderedTypes) {
              const maxAttempts = 3;
              for (let i = 0; i < maxAttempts; i++) {
                try {
                  const renameOpts = {
                    overwrite: false,
                    invalidate: true,
                    resource_type: resType,
                    type: 'upload',
                    to_type: 'upload',
                  } as const;

                  const res = await cloudinary.uploader.rename(
                    file.publicId,
                    newPath,
                    renameOpts
                  );

                  if (
                    res.result === 'ok' ||
                    res.result === 'created' ||
                    res.result === 'existing' ||
                    res.result === 'already_exists'
                  ) {
                    finalType = resType;
                    resourceOptions = buildResourceOpts(finalType);
                    // Best-effort: delete the source asset so it no longer appears in temp folders
                    try {
                      const delRes = await cloudinary.api.delete_resources([file.publicId], {
                        resource_type: resType,
                        type: 'upload',
                      });
                      console.log('Deleted temp asset:', delRes);
                    } catch (delErr) {
                      console.warn('Failed to delete temp asset:', delErr);
                    }
                    return res;
                  }

                  throw new Error(`Rename result ${res.result}`);
                } catch (err: unknown) {
                  const e = err as { http_code?: number; message?: string } | undefined;
                  // Cloudinary quirk: sometimes returns 404 for source even though the rename succeeded.
                  if (
                    e?.http_code === 404 ||
                    (typeof e?.message === 'string' && e.message.includes('Resource not found'))
                  ) {
                    try {
                      const destExists = await waitUntilExists(newPath, resType);
                      if (destExists) {
                        // Treat as success
                        finalType = resType;
                        resourceOptions = buildResourceOpts(finalType);
                        // Attempt to delete the original asset so it no longer shows in temp folder
                        try {
                          const delRes = await cloudinary.api.delete_resources([file.publicId], {
                            resource_type: resType,
                            type: 'upload',
                          });
                          console.log('Deleted temp asset (404 fallback):', delRes);
                        } catch (delErr) {
                          console.warn('Failed to delete temp asset (404 fallback):', delErr);
                        }
                        return { result: 'ok', secure_url: undefined } as { result: string; secure_url?: string };
                      }
                    } catch {/* ignore */}
                  }

                  // Only retry/continue if not last attempt & resource types remain
                  const isLastAttempt = i === maxAttempts - 1;
                  const isLastResType = orderedTypes.indexOf(resType) === orderedTypes.length - 1;
                  if (isLastAttempt && isLastResType) throw err;
                  // Wait before retrying or switching type
                  await new Promise((r) => setTimeout(r, 700));
                }
              }
            }
          };

          let renameResult;
          try {
            renameResult = await renameWithEnsure();
          } catch (renameErr: unknown) {
            const rn = renameErr as { message?: string } | undefined;
            console.warn('Rename failed, attempting copy-then-delete fallback (legacy):', rn?.message || renameErr);

            try {
              const srcUrl = cloudinary.url(file.publicId, {
                type: 'upload',
                resource_type: finalType,
                secure: true,
              });

              const copyRes = await cloudinary.uploader.upload(srcUrl, {
                public_id: newPath,
                type: 'upload',
                resource_type: finalType,
                overwrite: false,
              });

              console.log('Copied asset as fallback (legacy):', copyRes.public_id);

              try {
                const delRes = await cloudinary.api.delete_resources([file.publicId], {
                  resource_type: finalType,
                  type: 'upload',
                });
                console.log('Deleted temp asset after copy (legacy):', delRes);
              } catch (delErr) {
                console.warn('Failed to delete temp asset after copy (legacy):', delErr);
              }

              renameResult = { result: 'copied', secure_url: copyRes.secure_url } as { result: string; secure_url?: string };
            } catch (copyErr) {
              console.error('Copy-then-delete fallback (legacy) failed:', copyErr);
              throw copyErr;
            }
          }

          // Update tags - remove 'client-temp'/'admin-temp' and add new client tag
          await cloudinary.uploader.add_tag(`client-${clientId}`, [newPath], resourceOptions);

          // Remove old tags
          const oldTag = pathParts[1]; // either 'client-temp' or 'admin-temp'
          await cloudinary.uploader.remove_tag(oldTag, [newPath], resourceOptions);

          // Update context metadata
          await cloudinary.uploader.explicit(newPath, {
            type: 'upload',
            ...resourceOptions,
            context: {
              client_id: clientId,
              status: 'completed',
            },
          });

          return {
            success: true,
            oldPublicId: file.publicId,
            newPublicId: newPath,
            newUrl: renameResult.secure_url
          };
        } else {
          // File doesn't have temp path structure, just update tags and context
          await cloudinary.uploader.add_tag(`client-${clientId}`, [file.publicId], resourceOptions);

          // Remove both possible temp tags
          try {
            await cloudinary.uploader.remove_tag('client-temp', [file.publicId], resourceOptions);
          } catch (error) {
            // Ignore if tag doesn't exist
          }

          try {
            await cloudinary.uploader.remove_tag('admin-temp', [file.publicId], resourceOptions);
          } catch (error) {
            // Ignore if tag doesn't exist
          }

          await cloudinary.uploader.explicit(file.publicId, {
            type: 'upload',
            ...resourceOptions,
            context: {
              client_id: clientId,
              status: 'completed',
            },
          });

          return {
            success: true,
            oldPublicId: file.publicId,
            newPublicId: file.publicId,
            newUrl: null // URL stays the same
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
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Updated ${successful.length} files, ${failed.length} failed`,
      results: {
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('Error updating file metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update file metadata' },
      { status: 500 }
    );
  }
}

type WaitResType = 'image' | 'raw' | 'video';
const waitUntilExists = async (publicId: string, type: WaitResType) => {
  const maxChecks = 10; // up to ~10 seconds
  const delayMs = 1000;
  for (let i = 0; i < maxChecks; i++) {
    try {
      await cloudinary.api.resource(publicId, { resource_type: type });
      return true;
    } catch {
      /* not yet available */
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}; 