# E-signature Feature Maintenance Guide

## Overview

This runbook documents the maintenance procedures for the electronic signature feature implemented for liability waivers.

## 🔧 Feature Components

### Core Implementation
- **PDF Generation**: Client-side PDF creation using React-PDF
- **Signature Collection**: Modal interface with typed signatures
- **File Storage**: Cloudinary integration with audit trails
- **Legal Compliance**: Comprehensive audit logging

### Key Files Modified
```
app/api/portal/generate-liability-waiver/route.tsx
app/portal/intake/page.tsx
components/clients/client-details.tsx
app/api/clients/intake/route.ts
models/Client.ts
```

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Test PDF generation in staging environment
- [ ] Verify Cloudinary upload permissions
- [ ] Test signature modal functionality
- [ ] Confirm audit trail logging
- [ ] Validate waiver text formatting

### Post-deployment
- [ ] Monitor PDF generation performance
- [ ] Check Cloudinary storage usage
- [ ] Verify client data integrity
- [ ] Test download functionality
- [ ] Confirm mobile responsiveness

## 🔍 Troubleshooting

### Common Issues

#### PDF Generation Fails
**Symptoms**: PDF generation throws errors, blank PDFs
**Diagnosis**:
1. Check browser console for React-PDF errors
2. Verify waiver markdown formatting
3. Confirm font loading

**Resolution**:
```javascript
// Check PDF component props
console.log('PDF Data:', {
  name,
  email,
  phone,
  dogName,
  signatureDataUrl,
  typedSignatureName
});
```

#### Cloudinary Upload Issues
**Symptoms**: Upload fails, "Customer is marked as untrusted"
**Diagnosis**:
1. Verify Cloudinary configuration
2. Check upload parameters
3. Confirm API secret validity

**Resolution**:
- Ensure `CLOUDINARY_API_SECRET` is correctly set
- Verify upload folder permissions
- Check Cloudinary account settings for PDF delivery

#### Download Link Not Working
**Symptoms**: Download button appears but link doesn't work
**Diagnosis**:
1. Check if file exists in Cloudinary
2. Verify public access settings
3. Confirm URL construction

**Resolution**:
- Enable PDF delivery in Cloudinary settings
- Check file resource type is "raw"
- Verify public access mode

## 📊 Monitoring

### Key Metrics
- **PDF Generation Time**: Should be < 5 seconds
- **Upload Success Rate**: Target > 99.9%
- **Download Success Rate**: Target > 99.9%
- **Error Rate**: Monitor for spikes

### CloudWatch Alerts
- PDF generation errors > 1%
- Cloudinary API errors > 0.1%
- Large PDF files (> 10MB)

### Log Monitoring
```
# Key log patterns to monitor
PDF generation time: [0-9]+ms
Cloudinary upload: success|error
Signature collection: started|completed|failed
```

## 🔒 Security Considerations

### Audit Trail Verification
- Verify all signatures include timestamp, IP, user agent
- Check PDF metadata includes all required legal information
- Ensure consent checkboxes are properly logged

### Data Retention
- PDFs stored permanently in Cloudinary
- Audit logs maintained for legal compliance
- Client signature status tracked in database

### Access Control
- Only authenticated users can generate PDFs
- Cloudinary files set to public access for downloads
- Internal access restricted to admin users

## 📝 Maintenance Tasks

### Weekly
- [ ] Review PDF generation performance
- [ ] Check Cloudinary storage usage
- [ ] Verify audit trail completeness
- [ ] Test download functionality

### Monthly
- [ ] Review and update waiver text if needed
- [ ] Audit signature collection process
- [ ] Check legal compliance requirements
- [ ] Update documentation as needed

### Quarterly
- [ ] Security review of signature process
- [ ] Performance optimization review
- [ ] Legal compliance audit
- [ ] User experience testing

## 🛠️ Development Workflow

### Making Changes
1. **Test Environment**: Develop and test in staging
2. **Code Review**: All changes require engineering review
3. **Legal Review**: Signature-related changes need legal approval
4. **Documentation**: Update this runbook for any changes

### Rollback Plan
If critical issues arise:
1. Disable signature modal temporarily
2. Revert to manual PDF workflow
3. Notify users of temporary service interruption
4. Implement hotfix based on issue severity

## 📞 Support Contacts

### Technical Support
- **Primary**: Development Team
- **Backup**: System Administrator
- **Emergency**: On-call engineer

### Legal Support
- **Contracts**: Legal Department
- **Compliance**: Compliance Officer

### Business Support
- **Feature Requests**: Product Manager
- **User Issues**: Customer Success Team

---

*Owner: Engineering Team*
*Last updated: 2024-01-23*
*Review Cycle: Monthly*
