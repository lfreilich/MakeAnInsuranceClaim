import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { db } from "./db";
import { 
  claims, 
  users, 
  insurancePolicies, 
  lossAssessors, 
  auditLogs, 
  claimNotes, 
  payments,
  verificationCodes,
  claimStatusTransitions
} from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";
import { Storage } from "@google-cloud/storage";

interface BackupResult {
  success: boolean;
  timestamp: string;
  tablesBackedUp: string[];
  filesBackedUp: number;
  s3Location: string;
  errors: string[];
}

export async function backupToS3(): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPrefix = `moreland-backup-${timestamp}`;
  const errors: string[] = [];
  const tablesBackedUp: string[] = [];
  let filesBackedUp = 0;

  // Check for required AWS credentials
  const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const s3BucketName = process.env.S3_BACKUP_BUCKET;
  const awsRegion = process.env.AWS_REGION || 'eu-west-2';

  if (!awsAccessKeyId || !awsSecretAccessKey || !s3BucketName) {
    throw new Error('Missing required AWS credentials. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BACKUP_BUCKET environment variables.');
  }

  // Initialize S3 client
  const s3Client = new S3Client({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    },
  });

  console.log(`Starting backup to S3 bucket: ${s3BucketName}`);
  console.log(`Backup prefix: ${backupPrefix}`);

  // Backup database tables
  const tables = [
    { name: 'claims', table: claims },
    { name: 'users', table: users },
    { name: 'insurance_policies', table: insurancePolicies },
    { name: 'loss_assessors', table: lossAssessors },
    { name: 'audit_logs', table: auditLogs },
    { name: 'claim_notes', table: claimNotes },
    { name: 'payments', table: payments },
    { name: 'verification_codes', table: verificationCodes },
    { name: 'claim_status_transitions', table: claimStatusTransitions },
  ];

  for (const { name, table } of tables) {
    try {
      console.log(`Backing up table: ${name}`);
      const data = await db.select().from(table);
      
      const jsonData = JSON.stringify(data, null, 2);
      
      await s3Client.send(new PutObjectCommand({
        Bucket: s3BucketName,
        Key: `${backupPrefix}/database/${name}.json`,
        Body: jsonData,
        ContentType: 'application/json',
      }));
      
      tablesBackedUp.push(name);
      console.log(`  - Backed up ${data.length} records from ${name}`);
    } catch (error: any) {
      const errorMsg = `Failed to backup table ${name}: ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  // Backup uploaded files from object storage
  try {
    console.log('Backing up uploaded files from object storage...');
    
    // Get files from Replit Object Storage
    const objectStorageService = new ObjectStorageService();
    
    // Try to list and backup files from private directory
    const privateDir = process.env.PRIVATE_OBJECT_DIR || '.private';
    const publicDirs = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || 'public').split(',');
    
    // Initialize Google Cloud Storage for reading files
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId) {
      const gcsStorage = new Storage();
      const bucket = gcsStorage.bucket(bucketId);
      
      // List all files in the bucket
      const [files] = await bucket.getFiles();
      
      for (const file of files) {
        try {
          const [content] = await file.download();
          
          await s3Client.send(new PutObjectCommand({
            Bucket: s3BucketName,
            Key: `${backupPrefix}/files/${file.name}`,
            Body: content,
            ContentType: file.metadata.contentType || 'application/octet-stream',
          }));
          
          filesBackedUp++;
          console.log(`  - Backed up file: ${file.name}`);
        } catch (fileError: any) {
          const errorMsg = `Failed to backup file ${file.name}: ${fileError.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    } else {
      console.log('  - No object storage bucket configured, skipping file backup');
    }
  } catch (error: any) {
    const errorMsg = `Failed to backup files: ${error.message}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  // Create a manifest file
  const manifest = {
    timestamp,
    backupPrefix,
    tablesBackedUp,
    filesBackedUp,
    errors,
    createdAt: new Date().toISOString(),
  };

  await s3Client.send(new PutObjectCommand({
    Bucket: s3BucketName,
    Key: `${backupPrefix}/manifest.json`,
    Body: JSON.stringify(manifest, null, 2),
    ContentType: 'application/json',
  }));

  console.log('\nBackup complete!');
  console.log(`  Tables backed up: ${tablesBackedUp.length}`);
  console.log(`  Files backed up: ${filesBackedUp}`);
  console.log(`  Errors: ${errors.length}`);

  return {
    success: errors.length === 0,
    timestamp,
    tablesBackedUp,
    filesBackedUp,
    s3Location: `s3://${s3BucketName}/${backupPrefix}/`,
    errors,
  };
}

// CLI execution
if (require.main === module) {
  backupToS3()
    .then((result) => {
      console.log('\nBackup Result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Backup failed:', error.message);
      process.exit(1);
    });
}
