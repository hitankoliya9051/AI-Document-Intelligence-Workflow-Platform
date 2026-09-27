import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { config } from '../config';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  User,
  Organization,
  Membership,
  Folder,
  Tag,
  DocumentModel,
  ExtractedData,
  Workflow,
  WorkflowExecution,
  Review,
  Comment,
  Notification,
  ActivityLog,
} from '../models';

// Helper to generate minimal valid PDF with selectable text
function generateSamplePdfBuffer(title: string, content: string[]): Buffer {
  const contentStream = `BT
/F1 18 Tf
50 750 Td
(${title}) Tj
/F1 11 Tf
0 -30 Td
${content.map((line) => `(${line.replace(/[()\\]/g, '')}) '`).join('\n')}
ET`;

  const streamLength = Buffer.byteLength(contentStream);

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000244 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
380
%%EOF`;

  return Buffer.from(pdf, 'utf-8');
}

// Helper to generate sample Excel workbook buffer
function generateSampleExcelBuffer(sheetName: string, headers: string[], rows: any[][]): Buffer {
  const wb = xlsx.utils.book_new();
  const data = [headers, ...rows];
  const ws = xlsx.utils.aoa_to_sheet(data);
  xlsx.utils.book_append_sheet(wb, ws, sheetName);
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export const runSeed = async () => {
  console.log('--- Starting Database Seeding ---');
  await connectDatabase();

  // 1. Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Membership.deleteMany({}),
    Folder.deleteMany({}),
    Tag.deleteMany({}),
    DocumentModel.deleteMany({}),
    ExtractedData.deleteMany({}),
    Workflow.deleteMany({}),
    WorkflowExecution.deleteMany({}),
    Review.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);
  console.log('Cleared existing collections.');

  // 2. Create Users
  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash('Password123!', salt);

  const admin = await User.create({
    name: 'Alexandra Vance',
    email: 'admin@docintel.io',
    passwordHash: commonPassword,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    settings: {
      theme: 'dark',
      emailNotifications: true,
      inAppNotifications: true,
      autoProcessUploads: true,
    },
  });

  const reviewer = await User.create({
    name: 'Marcus Chen',
    email: 'reviewer@docintel.io',
    passwordHash: commonPassword,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    settings: {
      theme: 'dark',
      emailNotifications: true,
      inAppNotifications: true,
      autoProcessUploads: true,
    },
  });

  const member = await User.create({
    name: 'Sarah Jenkins',
    email: 'member@docintel.io',
    passwordHash: commonPassword,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    settings: {
      theme: 'dark',
      emailNotifications: false,
      inAppNotifications: true,
      autoProcessUploads: true,
    },
  });

  const auditor = await User.create({
    name: 'David Kalu',
    email: 'auditor@docintel.io',
    passwordHash: commonPassword,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    settings: {
      theme: 'light',
      emailNotifications: true,
      inAppNotifications: true,
      autoProcessUploads: false,
    },
  });

  console.log('Created 4 demo users: admin, reviewer, member, auditor (password: Password123!).');

  // 3. Create Organizations
  const acmeOrg = await Organization.create({
    name: 'Acme Financial Global',
    slug: 'acme-financial',
    ownerId: admin._id,
    plan: 'enterprise',
    storageUsed: 0,
    storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB
    settings: {
      allowedDocTypes: ['pdf', 'docx', 'xlsx', 'csv', 'txt', 'png', 'jpg'],
      maxFileSizeMb: 25,
      autoTriggerWorkflow: true,
      requireReviewForConfidenceBelow: 0.88,
    },
  });

  const apexOrg = await Organization.create({
    name: 'Apex Legal Partners',
    slug: 'apex-legal',
    ownerId: admin._id,
    plan: 'enterprise',
    storageUsed: 0,
    storageLimit: 5 * 1024 * 1024 * 1024,
  });

  // Assign memberships for Acme Org
  await Promise.all([
    Membership.create({ userId: admin._id, organizationId: acmeOrg._id, role: 'owner' }),
    Membership.create({ userId: reviewer._id, organizationId: acmeOrg._id, role: 'reviewer' }),
    Membership.create({ userId: member._id, organizationId: acmeOrg._id, role: 'member' }),
    Membership.create({ userId: auditor._id, organizationId: acmeOrg._id, role: 'reviewer' }),
    // Also admin in Apex Org
    Membership.create({ userId: admin._id, organizationId: apexOrg._id, role: 'owner' }),
  ]);

  admin.currentOrganizationId = acmeOrg._id;
  await admin.save();
  reviewer.currentOrganizationId = acmeOrg._id;
  await reviewer.save();
  member.currentOrganizationId = acmeOrg._id;
  await member.save();
  auditor.currentOrganizationId = acmeOrg._id;
  await auditor.save();

  console.log('Created organizations and memberships.');

  // 4. Create Folders
  const folderInvoices = await Folder.create({
    name: 'Invoices & Billing',
    organizationId: acmeOrg._id,
    createdBy: admin._id,
    color: '#3b82f6',
  });

  const folderContracts = await Folder.create({
    name: 'Vendor Contracts',
    organizationId: acmeOrg._id,
    createdBy: admin._id,
    color: '#8b5cf6',
  });

  const folderReports = await Folder.create({
    name: 'Financial Reports',
    organizationId: acmeOrg._id,
    createdBy: admin._id,
    color: '#10b981',
  });

  const folderHR = await Folder.create({
    name: 'HR & Onboarding',
    organizationId: acmeOrg._id,
    createdBy: admin._id,
    color: '#f59e0b',
  });

  // 5. Create Tags
  const tagInvoice = await Tag.create({ name: 'Invoice', color: '#3b82f6', organizationId: acmeOrg._id, createdBy: admin._id });
  const tagUrgent = await Tag.create({ name: 'Urgent', color: '#ef4444', organizationId: acmeOrg._id, createdBy: admin._id });
  const tagApproved = await Tag.create({ name: 'Reviewed', color: '#10b981', organizationId: acmeOrg._id, createdBy: admin._id });
  const tagContract = await Tag.create({ name: 'Contract', color: '#8b5cf6', organizationId: acmeOrg._id, createdBy: admin._id });
  const tagQ3 = await Tag.create({ name: 'Q3-2026', color: '#06b6d4', organizationId: acmeOrg._id, createdBy: admin._id });
  const tagCompliance = await Tag.create({ name: 'Compliance', color: '#f59e0b', organizationId: acmeOrg._id, createdBy: admin._id });

  // 6. Create Standard Enterprise Workflow
  const defaultWorkflow = await Workflow.create({
    name: 'Enterprise Document Intelligence & Verification',
    description: 'Four-stage automated ingestion, OCR entity extraction, human review gate, and executive sign-off.',
    organizationId: acmeOrg._id,
    triggerType: 'on_upload',
    isDefault: true,
    isActive: true,
    createdBy: admin._id,
    steps: [
      {
        stepNumber: 1,
        name: 'Document Upload & Ingestion',
        description: 'File integrity check, virus screening, and metadata extraction.',
        type: 'upload',
        assignedRole: 'any',
        requiredApprovals: 1,
      },
      {
        stepNumber: 2,
        name: 'AI Extraction & Parsing',
        description: 'Automated entity recognition, field mapping, and confidence assessment.',
        type: 'extraction',
        assignedRole: 'any',
        requiredApprovals: 1,
        autoApproveConfidenceThreshold: 0.95,
      },
      {
        stepNumber: 3,
        name: 'Human Review & Verification',
        description: 'Domain expert or reviewer validates fields with confidence below threshold.',
        type: 'review',
        assignedRole: 'reviewer',
        requiredApprovals: 1,
      },
      {
        stepNumber: 4,
        name: 'Final Approval & Completion',
        description: 'Audit clearance and global catalog search indexing.',
        type: 'complete',
        assignedRole: 'admin',
        requiredApprovals: 1,
      },
    ],
  });

  acmeOrg.settings.defaultWorkflowId = defaultWorkflow._id;
  await acmeOrg.save();

  // 7. Ensure upload directory exists
  const uploadOrgDir = path.join(config.storage.localDir, `org-${acmeOrg._id}`);
  if (!fs.existsSync(uploadOrgDir)) {
    fs.mkdirSync(uploadOrgDir, { recursive: true });
  }

  // 8. Generate sample documents
  // Document 1: AWS Cloud Infrastructure Invoice (PDF)
  const doc1OriginalName = 'AWS-Cloud-Services-Invoice-AUG2026.pdf';
  const doc1Key = `org-${acmeOrg._id}/${doc1OriginalName}`;
  const doc1Path = path.join(config.storage.localDir, doc1Key);
  const doc1PdfBuffer = generateSamplePdfBuffer('AMAZON WEB SERVICES - INVOICE', [
    'Invoice Number: INV-AWS-2026-9842',
    'Issue Date: August 15, 2026',
    'Due Date: September 15, 2026',
    'Customer: Acme Financial Global',
    'Vendor: Amazon Web Services Inc',
    'Contact Email: billing@amazon.com',
    'Phone: +1 800-555-0199',
    'Tax ID: EIN-98-7654321',
    'Total Amount Due: $14,850.00 USD',
    'Description: Dedicated Cloud Computing & Vector DB Instances for AI Document Processing.',
  ]);
  fs.writeFileSync(doc1Path, doc1PdfBuffer);

  const doc1Text = `AMAZON WEB SERVICES - INVOICE
Invoice Number: INV-AWS-2026-9842
Issue Date: August 15, 2026
Due Date: September 15, 2026
Vendor: Amazon Web Services Inc
Customer: Acme Financial Global
Contact Email: billing@amazon.com
Phone: +1 800-555-0199
Tax ID: EIN-98-7654321
Total Amount: $14,850.00
Currency: USD
Description: Dedicated Cloud Computing & Vector DB Instances for AI Document Processing. Payment due net 30 days. Remit payment to AWS Corporate Accounts.`;

  const doc1 = await DocumentModel.create({
    title: 'AWS Cloud Services Invoice - Aug 2026',
    originalName: doc1OriginalName,
    description: 'Monthly production infrastructure billing for high-throughput AI document inference.',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    fileSize: doc1PdfBuffer.length,
    storagePath: doc1Path,
    storageKey: doc1Key,
    storageProvider: 'local',
    organizationId: acmeOrg._id,
    folderId: folderInvoices._id,
    tags: [tagInvoice._id, tagUrgent._id],
    status: 'review_required',
    documentType: 'invoice',
    extractedText: doc1Text,
    wordCount: doc1Text.split(/\s+/).length,
    pageCount: 1,
    summary: '[Demo Analysis Mode]: Amazon Web Services billed Acme Financial Global $14,850.00 USD for dedicated cloud computing and vector DB infrastructure. Invoice INV-AWS-2026-9842 is due September 15, 2026.',
    confidenceScore: 0.86,
    uploadedBy: member._id,
    workflowId: defaultWorkflow._id,
    currentWorkflowStep: 3,
  });

  await ExtractedData.create({
    documentId: doc1._id,
    organizationId: acmeOrg._id,
    reviewStatus: 'pending',
    isDemoMode: true,
    fields: [
      { key: 'invoice_number', label: 'Invoice #', value: 'INV-AWS-2026-9842', type: 'string', confidence: 0.98, status: 'approved', isEdited: false },
      { key: 'vendor_name', label: 'Vendor Name', value: 'Amazon Web Services Inc', type: 'string', confidence: 0.95, status: 'approved', isEdited: false },
      { key: 'customer_name', label: 'Customer', value: 'Acme Financial Global', type: 'string', confidence: 0.94, status: 'approved', isEdited: false },
      { key: 'issue_date', label: 'Issue Date', value: 'August 15, 2026', type: 'date', confidence: 0.92, status: 'pending', isEdited: false },
      { key: 'due_date', label: 'Due Date', value: 'September 15, 2026', type: 'date', confidence: 0.91, status: 'pending', isEdited: false },
      { key: 'total_amount', label: 'Total Amount', value: '$14,850.00', type: 'currency', confidence: 0.84, status: 'pending', isEdited: false },
      { key: 'currency', label: 'Currency', value: 'USD', type: 'string', confidence: 0.99, status: 'approved', isEdited: false },
      { key: 'contact_email', label: 'Billing Email', value: 'billing@amazon.com', type: 'email', confidence: 0.97, status: 'approved', isEdited: false },
      { key: 'tax_id', label: 'Tax ID', value: 'EIN-98-7654321', type: 'string', confidence: 0.89, status: 'pending', isEdited: false },
    ],
    entities: [
      { type: 'ORGANIZATION', text: 'Amazon Web Services Inc', confidence: 0.95 },
      { type: 'ORGANIZATION', text: 'Acme Financial Global', confidence: 0.94 },
      { type: 'MONEY', text: '$14,850.00', confidence: 0.84 },
      { type: 'REFERENCE_ID', text: 'INV-AWS-2026-9842', confidence: 0.98 },
      { type: 'DATE', text: 'September 15, 2026', confidence: 0.91 },
    ],
  });

  await WorkflowExecution.create({
    documentId: doc1._id,
    workflowId: defaultWorkflow._id,
    organizationId: acmeOrg._id,
    currentStepNumber: 3,
    currentStepName: 'Human Review & Verification',
    status: 'pending',
    history: [
      { stepNumber: 1, stepName: 'Document Upload & Ingestion', stepType: 'upload', action: 'started', actorId: member._id, timestamp: new Date(Date.now() - 3600000 * 5), notes: 'File uploaded via web interface.' },
      { stepNumber: 2, stepName: 'AI Extraction & Parsing', stepType: 'extraction', action: 'passed', timestamp: new Date(Date.now() - 3600000 * 4), notes: 'OCR parsing completed with confidence 86%.' },
      { stepNumber: 3, stepName: 'Human Review & Verification', stepType: 'review', action: 'started', timestamp: new Date(Date.now() - 3600000 * 4), notes: 'Confidence score (86%) is below threshold (88%). Queued for human verification.' },
    ],
  });

  // Document 2: Master SaaS Service Agreement (Text / Contract)
  const doc2OriginalName = 'Enterprise-SaaS-Master-Agreement.txt';
  const doc2Key = `org-${acmeOrg._id}/${doc2OriginalName}`;
  const doc2Path = path.join(config.storage.localDir, doc2Key);
  const doc2Text = `MASTER SERVICES AGREEMENT
Agreement Reference: MSA-2026-0044
Effective Date: July 01, 2026
Provider: CloudScale Enterprise Solutions LLC
Client: Acme Financial Global
Term: 36 Months
Total Contract Value: $180,000.00 USD
Payment Terms: Annual advance payment of $60,000.00 USD.
Confidentiality & Data Protection: Provider agrees to maintain strict GDPR, SOC-2 Type II, and ISO 27001 data isolation controls.
Governing Law: State of New York, USA.
Signatures:
Provider: Elena Rostova, VP Enterprise Sales
Client: Alexandra Vance, Chief Technology Officer, Acme Financial Global`;

  fs.writeFileSync(doc2Path, doc2Text, 'utf-8');

  const doc2 = await DocumentModel.create({
    title: 'Enterprise SaaS Master Agreement - CloudScale',
    originalName: doc2OriginalName,
    description: '36-month enterprise master subscription and SLA agreement.',
    mimeType: 'text/plain',
    fileExtension: 'txt',
    fileSize: Buffer.byteLength(doc2Text),
    storagePath: doc2Path,
    storageKey: doc2Key,
    storageProvider: 'local',
    organizationId: acmeOrg._id,
    folderId: folderContracts._id,
    tags: [tagContract._id, tagApproved._id, tagCompliance._id],
    status: 'completed',
    documentType: 'contract',
    extractedText: doc2Text,
    wordCount: doc2Text.split(/\s+/).length,
    pageCount: 1,
    summary: '[Demo Analysis Mode]: 36-month Master Services Agreement between CloudScale Enterprise Solutions LLC and Acme Financial Global valued at $180,000.00 USD. Governed by the laws of New York with SOC-2 and ISO 27001 compliance guarantees.',
    confidenceScore: 0.96,
    uploadedBy: admin._id,
    workflowId: defaultWorkflow._id,
    currentWorkflowStep: 4,
  });

  await ExtractedData.create({
    documentId: doc2._id,
    organizationId: acmeOrg._id,
    reviewStatus: 'approved',
    reviewedBy: reviewer._id,
    reviewedAt: new Date(Date.now() - 3600000 * 2),
    reviewNotes: 'All clauses and payment schedules verified against legal terms.',
    isDemoMode: true,
    fields: [
      { key: 'reference_number', label: 'Agreement Ref', value: 'MSA-2026-0044', type: 'string', confidence: 0.98, status: 'approved', isEdited: false },
      { key: 'vendor_name', label: 'Provider', value: 'CloudScale Enterprise Solutions LLC', type: 'string', confidence: 0.97, status: 'approved', isEdited: false },
      { key: 'customer_name', label: 'Client', value: 'Acme Financial Global', type: 'string', confidence: 0.97, status: 'approved', isEdited: false },
      { key: 'issue_date', label: 'Effective Date', value: 'July 01, 2026', type: 'date', confidence: 0.95, status: 'approved', isEdited: false },
      { key: 'total_amount', label: 'Contract Value', value: '$180,000.00', type: 'currency', confidence: 0.96, status: 'approved', isEdited: false },
      { key: 'currency', label: 'Currency', value: 'USD', type: 'string', confidence: 0.99, status: 'approved', isEdited: false },
    ],
    entities: [
      { type: 'ORGANIZATION', text: 'CloudScale Enterprise Solutions LLC', confidence: 0.97 },
      { type: 'ORGANIZATION', text: 'Acme Financial Global', confidence: 0.97 },
      { type: 'MONEY', text: '$180,000.00', confidence: 0.96 },
      { type: 'REFERENCE_ID', text: 'MSA-2026-0044', confidence: 0.98 },
    ],
  });

  await Review.create({
    documentId: doc2._id,
    organizationId: acmeOrg._id,
    reviewerId: reviewer._id,
    action: 'approve',
    notes: 'Legal compliance verified. Ready for execution.',
    fieldChanges: [],
  });

  await WorkflowExecution.create({
    documentId: doc2._id,
    workflowId: defaultWorkflow._id,
    organizationId: acmeOrg._id,
    currentStepNumber: 4,
    currentStepName: 'Final Approval & Completion',
    status: 'completed',
    completedAt: new Date(),
    history: [
      { stepNumber: 1, stepName: 'Document Upload & Ingestion', stepType: 'upload', action: 'started', actorId: admin._id, timestamp: new Date(Date.now() - 3600000 * 12), notes: 'Contract uploaded.' },
      { stepNumber: 2, stepName: 'AI Extraction & Parsing', stepType: 'extraction', action: 'passed', timestamp: new Date(Date.now() - 3600000 * 11), notes: 'Entities extracted with 96% confidence.' },
      { stepNumber: 3, stepName: 'Human Review & Verification', stepType: 'review', action: 'approved', actorId: reviewer._id, timestamp: new Date(Date.now() - 3600000 * 2), notes: 'Review approved.' },
      { stepNumber: 4, stepName: 'Final Approval & Completion', stepType: 'complete', action: 'approved', actorId: admin._id, timestamp: new Date(), notes: 'Workflow completed.' },
    ],
  });

  // Document 3: Q3 Financial Budget Projections (XLSX Spreadsheet)
  const doc3OriginalName = 'Q3-2026-Financial-Budget-Projections.xlsx';
  const doc3Key = `org-${acmeOrg._id}/${doc3OriginalName}`;
  const doc3Path = path.join(config.storage.localDir, doc3Key);
  const excelHeaders = ['Department', 'Budget Allocated', 'Spent to Date', 'Variance', 'Status'];
  const excelRows = [
    ['Engineering & AI', 750000, 680000, 70000, 'On Track'],
    ['Product & Design', 220000, 195000, 25000, 'On Track'],
    ['Marketing & Growth', 340000, 365000, -25000, 'Review Needed'],
    ['Legal & Compliance', 180000, 140000, 40000, 'Under Budget'],
    ['Operations & HR', 150000, 135000, 15000, 'On Track'],
  ];
  const doc3ExcelBuffer = generateSampleExcelBuffer('Budget 2026', excelHeaders, excelRows);
  fs.writeFileSync(doc3Path, doc3ExcelBuffer);

  const doc3Text = `--- Sheet: Budget 2026 ---
Department | Budget Allocated | Spent to Date | Variance | Status
Engineering & AI | 750000 | 680000 | 70000 | On Track
Product & Design | 220000 | 195000 | 25000 | On Track
Marketing & Growth | 340000 | 365000 | -25000 | Review Needed
Legal & Compliance | 180000 | 140000 | 40000 | Under Budget
Operations & HR | 150000 | 135000 | 15000 | On Track
Total Budget: $1,640,000.00 USD. Total Spent: $1,515,000.00 USD.`;

  const doc3 = await DocumentModel.create({
    title: 'Q3 2026 Financial Budget Projections',
    originalName: doc3OriginalName,
    description: 'Consolidated departmental spending and Q3 operational expense forecast.',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileExtension: 'xlsx',
    fileSize: doc3ExcelBuffer.length,
    storagePath: doc3Path,
    storageKey: doc3Key,
    storageProvider: 'local',
    organizationId: acmeOrg._id,
    folderId: folderReports._id,
    tags: [tagQ3._id, tagApproved._id],
    status: 'completed',
    documentType: 'financial_report',
    extractedText: doc3Text,
    wordCount: doc3Text.split(/\s+/).length,
    pageCount: 1,
    summary: '[Demo Analysis Mode]: Q3 departmental budget shows $1.64M total allocation with $1.515M spent to date. Engineering and Legal are under budget while Marketing exceeded allocation by $25k.',
    confidenceScore: 0.94,
    uploadedBy: auditor._id,
    workflowId: defaultWorkflow._id,
    currentWorkflowStep: 4,
  });

  await ExtractedData.create({
    documentId: doc3._id,
    organizationId: acmeOrg._id,
    reviewStatus: 'approved',
    isDemoMode: true,
    tables: [
      {
        name: 'Budget 2026',
        headers: excelHeaders,
        rows: excelRows,
      },
    ],
    fields: [
      { key: 'total_amount', label: 'Total Budget', value: '$1,640,000.00', type: 'currency', confidence: 0.96, status: 'approved', isEdited: false },
      { key: 'currency', label: 'Currency', value: 'USD', type: 'string', confidence: 0.98, status: 'approved', isEdited: false },
      { key: 'fiscal_period', label: 'Fiscal Period', value: 'Q3 2026', type: 'string', confidence: 0.95, status: 'approved', isEdited: false },
    ],
    entities: [
      { type: 'MONEY', text: '$1,640,000.00', confidence: 0.96 },
      { type: 'DATE', text: 'Q3 2026', confidence: 0.95 },
    ],
  });

  // Document 4: Vendor Expense Log (CSV)
  const doc4OriginalName = 'August-Vendor-Disbursements.csv';
  const doc4Key = `org-${acmeOrg._id}/${doc4OriginalName}`;
  const doc4Path = path.join(config.storage.localDir, doc4Key);
  const doc4CsvText = `Date,Vendor,Category,InvoiceRef,Amount,Status
2026-08-02,Stripe Payments,Payment Gateway,TXN-9011,$3420.50,Cleared
2026-08-07,Datadog Inc,Monitoring,DD-5521,$1280.00,Cleared
2026-08-14,GitHub Enterprise,Developer Tools,GH-8820,$2400.00,Cleared
2026-08-20,Figma Enterprise,Design Tools,FG-1200,$850.00,Cleared
2026-08-28,OpenAI API,AI Services,OAI-7729,$4650.00,Pending`;

  fs.writeFileSync(doc4Path, doc4CsvText, 'utf-8');

  const doc4 = await DocumentModel.create({
    title: 'August Vendor Disbursements Log',
    originalName: doc4OriginalName,
    description: 'Detailed ledger of August technology subscriptions and vendor payouts.',
    mimeType: 'text/csv',
    fileExtension: 'csv',
    fileSize: Buffer.byteLength(doc4CsvText),
    storagePath: doc4Path,
    storageKey: doc4Key,
    storageProvider: 'local',
    organizationId: acmeOrg._id,
    folderId: folderInvoices._id,
    tags: [tagInvoice._id, tagQ3._id],
    status: 'completed',
    documentType: 'financial_report',
    extractedText: doc4CsvText,
    wordCount: doc4CsvText.split(/\s+/).length,
    pageCount: 1,
    summary: '[Demo Analysis Mode]: 5 vendor disbursements totaling $12,600.50 recorded in August across Cloud, Monitoring, AI, and Design tooling.',
    confidenceScore: 0.93,
    uploadedBy: member._id,
    workflowId: defaultWorkflow._id,
    currentWorkflowStep: 4,
  });

  await ExtractedData.create({
    documentId: doc4._id,
    organizationId: acmeOrg._id,
    reviewStatus: 'approved',
    isDemoMode: true,
    tables: [
      {
        name: 'CSV Data',
        headers: ['Date', 'Vendor', 'Category', 'InvoiceRef', 'Amount', 'Status'],
        rows: [
          ['2026-08-02', 'Stripe Payments', 'Payment Gateway', 'TXN-9011', '$3420.50', 'Cleared'],
          ['2026-08-07', 'Datadog Inc', 'Monitoring', 'DD-5521', '$1280.00', 'Cleared'],
          ['2026-08-14', 'GitHub Enterprise', 'Developer Tools', 'GH-8820', '$2400.00', 'Cleared'],
          ['2026-08-20', 'Figma Enterprise', 'Design Tools', 'FG-1200', '$850.00', 'Cleared'],
          ['2026-08-28', 'OpenAI API', 'AI Services', 'OAI-7729', '$4650.00', 'Pending'],
        ],
      },
    ],
    fields: [
      { key: 'total_amount', label: 'Disbursement Total', value: '$12,600.50', type: 'currency', confidence: 0.94, status: 'approved', isEdited: false },
      { key: 'currency', label: 'Currency', value: 'USD', type: 'string', confidence: 0.98, status: 'approved', isEdited: false },
    ],
    entities: [
      { type: 'ORGANIZATION', text: 'Stripe Payments', confidence: 0.95 },
      { type: 'ORGANIZATION', text: 'Datadog Inc', confidence: 0.95 },
      { type: 'ORGANIZATION', text: 'GitHub Enterprise', confidence: 0.95 },
      { type: 'ORGANIZATION', text: 'OpenAI API', confidence: 0.95 },
    ],
  });

  // Document 5: HR Employment Offer Letter (PDF)
  const doc5OriginalName = 'Employment-Offer-Letter-Lead-Architect.pdf';
  const doc5Key = `org-${acmeOrg._id}/${doc5OriginalName}`;
  const doc5Path = path.join(config.storage.localDir, doc5Key);
  const doc5PdfBuffer = generateSamplePdfBuffer('ACME FINANCIAL - OFFER OF EMPLOYMENT', [
    'Candidate: Jordan Rivera',
    'Position: Principal AI & Data Architect',
    'Start Date: October 01, 2026',
    'Base Salary: $210,000.00 USD per annum',
    'Equity: 0.5% Incentive Stock Options',
    'Reporting To: Alexandra Vance, Chief Technology Officer',
    'Location: New York, NY (Hybrid)',
    'Status: Awaiting Candidate Signature',
  ]);
  fs.writeFileSync(doc5Path, doc5PdfBuffer);

  const doc5Text = `ACME FINANCIAL - OFFER OF EMPLOYMENT
Candidate: Jordan Rivera
Position: Principal AI & Data Architect
Start Date: October 01, 2026
Base Salary: $210,000.00 USD per annum
Equity: 0.5% Incentive Stock Options vesting over 4 years
Reporting To: Alexandra Vance, Chief Technology Officer
Location: New York, NY (Hybrid)
Offer Valid Until: September 30, 2026
Benefits: Comprehensive medical, 401(k) matching, and continuous learning allowance.`;

  const doc5 = await DocumentModel.create({
    title: 'Offer Letter - Principal AI Architect',
    originalName: doc5OriginalName,
    description: 'Executive hiring contract and compensation package for Principal AI Architect.',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    fileSize: doc5PdfBuffer.length,
    storagePath: doc5Path,
    storageKey: doc5Key,
    storageProvider: 'local',
    organizationId: acmeOrg._id,
    folderId: folderHR._id,
    tags: [tagContract._id, tagUrgent._id],
    status: 'review_required',
    documentType: 'contract',
    extractedText: doc5Text,
    wordCount: doc5Text.split(/\s+/).length,
    pageCount: 1,
    summary: '[Demo Analysis Mode]: Formal offer of employment extended to Jordan Rivera for Principal AI & Data Architect position at $210,000.00 USD annual base plus 0.5% equity, reporting to CTO Alexandra Vance.',
    confidenceScore: 0.87,
    uploadedBy: admin._id,
    workflowId: defaultWorkflow._id,
    currentWorkflowStep: 3,
  });

  await ExtractedData.create({
    documentId: doc5._id,
    organizationId: acmeOrg._id,
    reviewStatus: 'pending',
    isDemoMode: true,
    fields: [
      { key: 'candidate_name', label: 'Candidate Name', value: 'Jordan Rivera', type: 'string', confidence: 0.98, status: 'approved', isEdited: false },
      { key: 'job_title', label: 'Role Title', value: 'Principal AI & Data Architect', type: 'string', confidence: 0.96, status: 'approved', isEdited: false },
      { key: 'start_date', label: 'Start Date', value: 'October 01, 2026', type: 'date', confidence: 0.94, status: 'pending', isEdited: false },
      { key: 'total_amount', label: 'Base Compensation', value: '$210,000.00', type: 'currency', confidence: 0.85, status: 'pending', isEdited: false },
      { key: 'currency', label: 'Currency', value: 'USD', type: 'string', confidence: 0.99, status: 'approved', isEdited: false },
    ],
    entities: [
      { type: 'PERSON', text: 'Jordan Rivera', confidence: 0.98 },
      { type: 'PERSON', text: 'Alexandra Vance', confidence: 0.97 },
      { type: 'ORGANIZATION', text: 'Acme Financial', confidence: 0.96 },
      { type: 'MONEY', text: '$210,000.00', confidence: 0.85 },
    ],
  });

  await WorkflowExecution.create({
    documentId: doc5._id,
    workflowId: defaultWorkflow._id,
    organizationId: acmeOrg._id,
    currentStepNumber: 3,
    currentStepName: 'Human Review & Verification',
    status: 'pending',
    history: [
      { stepNumber: 1, stepName: 'Document Upload & Ingestion', stepType: 'upload', action: 'started', actorId: admin._id, timestamp: new Date(Date.now() - 3600000 * 2), notes: 'Offer letter uploaded by HR.' },
      { stepNumber: 2, stepName: 'AI Extraction & Parsing', stepType: 'extraction', action: 'passed', timestamp: new Date(Date.now() - 3600000 * 1), notes: 'Candidate terms extracted with 87% confidence.' },
      { stepNumber: 3, stepName: 'Human Review & Verification', stepType: 'review', action: 'started', timestamp: new Date(), notes: 'Awaiting executive compensation sign-off.' },
    ],
  });

  // Calculate and update org storage
  const totalStorage = doc1PdfBuffer.length + Buffer.byteLength(doc2Text) + doc3ExcelBuffer.length + Buffer.byteLength(doc4CsvText) + doc5PdfBuffer.length;
  acmeOrg.storageUsed = totalStorage;
  await acmeOrg.save();

  // 9. Create Comments
  await Comment.create({
    documentId: doc1._id,
    organizationId: acmeOrg._id,
    authorId: reviewer._id,
    content: 'Checked the AWS line items against the reserved vector DB instance specs. Amounts match our Q3 commitments.',
  });

  await Comment.create({
    documentId: doc1._id,
    organizationId: acmeOrg._id,
    authorId: admin._id,
    content: 'Thanks Marcus! Please approve the invoice in the review queue so Accounts Payable can process it before the 15th.',
  });

  await Comment.create({
    documentId: doc2._id,
    organizationId: acmeOrg._id,
    authorId: reviewer._id,
    content: 'Indemnification clause and SLA benchmarks are verified. Approved.',
  });

  // 10. Create Notifications
  await Notification.create({
    userId: admin._id,
    organizationId: acmeOrg._id,
    title: 'Review Required: AWS Cloud Services Invoice',
    message: 'Confidence score (86%) requires human verification for AWS-Cloud-Services-Invoice-AUG2026.pdf',
    type: 'review_required',
    documentId: doc1._id,
    link: `/documents/${doc1._id}`,
    isRead: false,
  });

  await Notification.create({
    userId: reviewer._id,
    organizationId: acmeOrg._id,
    title: 'New Document Assigned for Review',
    message: 'Offer Letter - Principal AI Architect is waiting in your review queue.',
    type: 'review_required',
    documentId: doc5._id,
    link: `/documents/${doc5._id}`,
    isRead: false,
  });

  await Notification.create({
    userId: admin._id,
    organizationId: acmeOrg._id,
    title: 'Contract Approved: CloudScale Master Agreement',
    message: 'Marcus Chen approved Enterprise SaaS Master Agreement - CloudScale.',
    type: 'document_approved',
    documentId: doc2._id,
    link: `/documents/${doc2._id}`,
    isRead: true,
  });

  // 11. Create Activity Logs
  const activities = [
    { action: 'login', userId: admin._id, details: { ip: '127.0.0.1' }, createdAt: new Date(Date.now() - 3600000 * 24) },
    { action: 'upload', userId: admin._id, documentId: doc2._id, details: { fileName: doc2OriginalName }, createdAt: new Date(Date.now() - 3600000 * 12) },
    { action: 'extraction', userId: admin._id, documentId: doc2._id, details: { fieldsExtracted: 6 }, createdAt: new Date(Date.now() - 3600000 * 11) },
    { action: 'approval', userId: reviewer._id, documentId: doc2._id, details: { action: 'approve' }, createdAt: new Date(Date.now() - 3600000 * 2) },
    { action: 'upload', userId: member._id, documentId: doc1._id, details: { fileName: doc1OriginalName }, createdAt: new Date(Date.now() - 3600000 * 5) },
    { action: 'comment', userId: reviewer._id, documentId: doc1._id, details: { note: 'Verified line items' }, createdAt: new Date(Date.now() - 3600000 * 3) },
    { action: 'upload', userId: admin._id, documentId: doc5._id, details: { fileName: doc5OriginalName }, createdAt: new Date(Date.now() - 3600000 * 1) },
  ];

  for (const act of activities) {
    await ActivityLog.create({
      organizationId: acmeOrg._id,
      userId: act.userId,
      action: act.action as any,
      documentId: act.documentId,
      details: act.details,
      createdAt: act.createdAt,
    });
  }

  console.log('--- Database Seeding Completed Successfully! ---');
  console.log('Demo Credentials:');
  console.log('  Admin/Owner: admin@docintel.io / Password123!');
  console.log('  Reviewer:    reviewer@docintel.io / Password123!');
  console.log('  Member:      member@docintel.io / Password123!');
  console.log('  Auditor:     auditor@docintel.io / Password123!');

  await disconnectDatabase();
};

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed script error:', err);
      process.exit(1);
    });
}
