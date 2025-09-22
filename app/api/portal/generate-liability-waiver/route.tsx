import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from '@react-pdf/renderer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type GeneratePayload = {
  name: string;
  email?: string;
  phone?: string;
  dogName?: string;
  signedAtISO?: string;
  signatureDataUrl?: string; // optional: drawn signature
  typedSignatureName?: string; // optional: typed signature
  consent?: boolean; // user agreed this is electronic signature
  ipAddress?: string;
  userAgent?: string;
};

// Minimal PDF template for the waiver, includes the full text and a signature block
const styles = StyleSheet.create({
  page: { padding: 32 },
  title: { fontSize: 18, marginBottom: 12 },
  sectionTitle: { fontSize: 14, marginTop: 10, marginBottom: 6 },
  p: { fontSize: 10, lineHeight: 1.4, marginBottom: 6 },
  listItem: { fontSize: 10, lineHeight: 1.4, marginBottom: 4 },
  sigBlock: { marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ccc', borderTopStyle: 'solid' },
  sigRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  sigImage: { width: 180, height: 60, borderWidth: 1, borderColor: '#ddd' },
  meta: { fontSize: 10, color: '#444', marginTop: 6 },
});

function WaiverPDF({ data }: { data: GeneratePayload }) {
  const signedAt = data.signedAtISO ? new Date(data.signedAtISO) : new Date();
  const signedAtStr = signedAt.toLocaleString('en-US', { hour12: true });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Daydreamers Pet Supply LLC – Liability Waiver and Services Agreement</Text>

        <Text style={styles.sectionTitle}>Liability for Potential Harm Caused By or To Dog</Text>
        <Text style={styles.p}>
          If Dog causes property damage, or bites or injures any dog, animal or person (including but not limited to Trainer and Trainer’s agents), during or after the term of this Agreement, then Client agrees to pay all resulting losses and damages suffered or incurred, and to defend and indemnify Daydreamers Pet Supply LLC and Daydreamers Pet Supply LLC’s owners, and/or agents from any resulting claims, demands, lawsuits, losses, costs or expenses, including attorney fees.
        </Text>
        <Text style={styles.p}>
          If Dog is injured in an accident or fight, gets sick during or after participating in a Daydreamers Pet Supply service or with a Daydreamers trainer, or is harmed in any other manner during or after the term of the Agreement, Client assumes the risk and agrees that Trainer should not be held responsible for any resulting injuries, illness, losses, damages, costs or expenses, even if that harm is caused in part by the negligence or carelessness of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents, unless it is caused by the gross negligence or the intentional misconduct of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents.
        </Text>

        <Text style={styles.sectionTitle}>Liability for Potential Harm Caused to Client or Client’s property</Text>
        <Text style={styles.listItem}>• I understand that Daydreamers Pet Supply LLC’s Training Services are not a place of recreation or amusement. Its sole purpose is the training and education of pets and pet owners.</Text>
        <Text style={styles.listItem}>• I knowingly and voluntarily assume all of the risks inherent in engaging in contact with pets and owners, including those that may not be specifically enumerated herein.</Text>
        <Text style={styles.listItem}>• The risk of injury from the activities involved is significant, including the potential for permanent disfigurement, and while particular rules, equipment, and personal discipline reduce this risk, the risk of serious injury does exist.</Text>
        <Text style={styles.listItem}>• I knowingly and freely assume all such risks, both known and unknown, and assume full responsibility for my participation.</Text>
        <Text style={styles.listItem}>• I willingly agree to comply with the stated instructions and policies and customary terms and conditions for participation.</Text>
        <Text style={styles.listItem}>• I agree that I will not attend any Daydreamers Pet Supply LLC Training Services events or enter the premises of a Daydreamers Service if I believe I, or anyone in my household or with whom I have regular contact, has contracted or is suspected to have contracted COVID-19 and have not yet been cleared as non-contagious by a medical provider, or been exposed to a suspected or confirmed case of COVID-19 within the last 14 days.</Text>
        <Text style={styles.listItem}>• If I observe any unusual significant hazard during my presence or participation, I will remove myself from participation and bring such to the attention of the nearest trainer or supervisor immediately.</Text>
        <Text style={styles.listItem}>• I, for myself and on behalf of my heirs, assigns, personal representatives and next of kin, hereby release, indemnify and hold Daydreamers Pet Supply LLC, and their officers, officials, agents, clients and/or employees harmless with respect to any and all injury, illness, disability, death, or loss or damage to person or property, even if that injury, illness or other loss is caused in part by the negligence or carelessness of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents, unless it is caused by the gross negligence or the intentional misconduct of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents. This liability waiver and release extends to Daydreamers Pet Supply LLC together with all owners and employees.</Text>

        <Text style={styles.sectionTitle}>Participation in the Dreamers Club</Text>
        <Text style={styles.p}>
          I am aware that there are inherent risks and hazards involved in activities with and around off-leash dogs. If I attend the Dreamers Club (or other off-leash play/ meet and greets), I am voluntarily participating in these activities with knowledge of potential dangers. I am aware that any pet, regardless of training, handling, or environmental circumstance, is capable of biting, and that Daydreamers Pet Supply LLC also can not guarantee that I will not become infected with COVID-19 or other diseases, and I expressly acknowledge and assume all risks of injury, illness, or other loss, even if that injury, illness or other loss is caused in part by the negligence or carelessness of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents, unless it is caused by the gross negligence or the intentional misconduct of Daydreamers Pet Supply LLC or Daydreamers Pet Supply LLC’s agents.
        </Text>

        <Text style={styles.sectionTitle}>Medical Emergencies</Text>
        <Text style={styles.p}>
          In the case of a medical emergency where Client is not present and/or cannot be reached, Trainer shall have the right to bring Dog to a veterinarian for treatment and to use our judgment (and rely on the judgment of said veterinarian) to authorize medical procedures in the Dog’s best interest. Client agrees they will pay any medical bills or other costs associated with veterinary care which are provided during the time during which they could not be reached.
        </Text>

        <Text style={styles.sectionTitle}>Trainer’s Option to Terminate Agreement in Case of Problems with Dog or Client</Text>
        <Text style={styles.p}>
          At Trainer’s sole election, Trainer’s duties hereunder shall terminate if (a) in Trainer’s sole judgment Dog is dangerous or vicious to Trainer or any other person or animal, or interferes with the training of other dogs, or (b) Client breaches any term or condition of this Agreement, consistently fails to follow Trainer instructions, or refuses to comply with the stated instructions and policies and customary terms and conditions for participation. Upon termination in accordance with the foregoing, Trainer’s duties shall terminate but all other provisions of this Agreement shall continue in full force and effect.
        </Text>

        <Text style={styles.sectionTitle}>Training Outcomes Not Guaranteed</Text>
        <Text style={styles.p}>
          The parties confirm that, except for that which is specifically written in this Agreement, no promises, representations or oral understandings have been made with regard to Dog or anything else. Without limiting the generality of the foregoing, Client acknowledges that Trainer has not represented, promised, guaranteed or warranted that Dog will never bite, that Dog will not be dangerous or vicious in the future, that Dog will not exhibit other behavioral problems, or that the results of the training will last for any particular amount of time.
        </Text>
        <Text style={styles.p}>
          Trainer will make every reasonable effort to help Client achieve training and behavior modification goals but makes no guarantee of Dog’s performance or behavior as a result of providing professional animal behavior consultation. Client understands that they and members of the household must follow Trainer’s instructions without modification, work with dog daily as recommended, and constantly reinforce training being given to Dog.
        </Text>

        <Text style={styles.sectionTitle}>Payment, Cancellations and Refunds</Text>
        <Text style={styles.p}>
          I agree to pay the agreed upon cost of training services within 24 hours of the session, unless otherwise agreed in writing. Cancellations may be made without penalty up to 24 hours prior to the session start time. Sessions canceled within 24 hours of the scheduled session will be paid in full, and Trainer reserves the right to convert late cancellations to Virtual sessions at the cost of the originally scheduled session. Under no circumstances are refunds given on services that have already been used. Packages and classes are non-refundable from the time of purchase, except in the cases of the re-homing or death of a dog, in which case evidence may be requested in the form of a notarized letter from a shelter or vet; in such cases, a refund may be requested in the form of account credit.
        </Text>

        <Text style={styles.sectionTitle}>Entire Agreement, Severability, Written Modification Required</Text>
        <Text style={styles.p}>
          This Agreement supersedes all prior discussions, representations, warranties and agreements of the parties, and expresses the entire agreement between Client and Trainer regarding the matters described above. This Agreement may be amended only by a written instrument signed by both Client and Trainer. If any term of this Agreement is to any extent illegal, otherwise invalid, or incapable of being enforced, such term shall be excluded to the extent of such invalidity or unenforceability; all other terms hereof shall remain in full force and effect; and, to the extent permitted and possible, the invalid or unenforceable term shall be deemed replaced by a term that is valid and enforceable and that comes closest to expressing the intention of such invalid or unenforceable term.
        </Text>

        <View style={styles.sigBlock}>
          <Text style={styles.p}>Client Name: {data.name}</Text>
          {data.dogName ? (<Text style={styles.p}>Dog’s Name: {data.dogName}</Text>) : null}
          <Text style={styles.p}>Email: {data.email || ''}   Phone: {data.phone || ''}</Text>
          <Text style={styles.p}>Signed At: {signedAtStr}</Text>
          <View style={styles.sigRow}>
            <View>
              <Text style={{ fontSize: 10, marginBottom: 4 }}>Signature:</Text>
              {data.typedSignatureName ? (
                <Text style={{ fontSize: 18 }}>/s/ {data.typedSignatureName}</Text>
              ) : data.signatureDataUrl ? (
                <Image style={styles.sigImage} src={data.signatureDataUrl} />
              ) : (
                <Text style={{ fontSize: 10 }}>[No signature provided]</Text>
              )}
            </View>
          </View>
          {data.consent ? (
            <Text style={styles.meta}>Signer acknowledged that typing their name constitutes an electronic signature under ESIGN and UETA.</Text>
          ) : null}
          <Text style={styles.meta}>Audit: IP {data.ipAddress || 'unknown'} · UA {data.userAgent || 'unknown'}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<GeneratePayload>;
    const { name, email, phone, dogName, signatureDataUrl, typedSignatureName, consent } = body;

    if (!name || (!signatureDataUrl && !typedSignatureName)) {
      return NextResponse.json({ success: false, error: 'Missing name or signature.' }, { status: 400 });
    }

    const ipHeader = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const ipAddress = ipHeader.split(',')[0] || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Generate PDF buffer using renderToBuffer function
    const pdfBuffer = await renderToBuffer(
      WaiverPDF({ data: {
        name,
        email,
        phone,
        dogName,
        signedAtISO: new Date().toISOString(),
        signatureDataUrl,
        typedSignatureName,
        consent: Boolean(consent),
        ipAddress,
        userAgent,
      } as GeneratePayload })
    );

    // Return the PDF buffer and upload parameters for client-side upload
    // This matches the pattern used by vaccination records and dog photos
    const folder = 'clients/temp/liability-waivers';
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `${timestamp}-${Math.random().toString(36).substring(2, 10)}.pdf`;

    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
      public_id: publicId,
      access_mode: 'public',
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({
      success: true,
      pdfBuffer: pdfBuffer.toString('base64'),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      publicId,
      signature,
      resourceType: 'raw',
    });
  } catch (error) {
    console.error('Error generating/uploading signed waiver:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}


