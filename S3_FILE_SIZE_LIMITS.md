# S3 File Upload Size Limits

## Current Configuration: **No Limits** ✅

Your application is configured to support **unlimited file sizes** for uploads. Here's how it works:

### How It Works

1. **Direct S3 Uploads**: Files upload directly to S3 using presigned URLs, bypassing Next.js/Vercel entirely
2. **No Next.js Body Size Limits**: Since files don't go through Next.js API routes, there are no body size restrictions
3. **S3 Maximum Object Size**: AWS S3 supports files up to **5TB** per object

### Practical Limits

While there are no hard-coded limits in the application, practical constraints include:

1. **Browser Limits**: 
   - Most browsers can handle files up to **2-4GB** reliably
   - Very large files may cause browser memory issues

2. **Network Timeouts**:
   - Large files take longer to upload
   - Network interruptions can cause upload failures
   - Consider implementing upload progress indicators for large files

3. **S3 Bucket Configuration**:
   - Default S3 buckets have no size limits
   - Ensure your bucket has sufficient storage capacity
   - Monitor costs as file sizes increase

### Recommendations

For typical use cases (vaccination records, dog photos):
- **Vaccination Records**: Usually PDFs or images, typically < 10MB ✅
- **Dog Photos**: Images, typically < 5MB ✅
- **Liability Waivers**: PDFs, typically < 1MB ✅

These are well within all practical limits.

### If You Want to Add Limits (Optional)

If you decide to add file size limits in the future, you can add validation in:

1. **Client-side** (`app/portal/intake/page.tsx`):
```typescript
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
if (file.size > MAX_FILE_SIZE) {
  alert(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  return;
}
```

2. **S3 Presigned URL** (already supports large files - no changes needed)

### Current Status

✅ **No file size limits configured**  
✅ **Files upload directly to S3**  
✅ **Supports files up to 5TB (S3 maximum)**  
✅ **Build passes successfully**




