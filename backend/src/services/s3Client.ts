import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

const s3Client = new S3Client({
    region: process.env.AWS_REGION!.trim(),
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!.trim(),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!.trim(),
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!.trim();

// Genera una URL prefirmada para que el cliente suba directamente a S3
export const generateUploadPresignedUrl = async (
    userId: string,
    fileExtension: string = 'jpg'
): Promise<{ uploadUrl: string; imageKey: string }> => {
    const imageKey = `receipts/${userId}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey,
        ContentType: `image/${fileExtension}`,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 300, // 5 minutos
    });

    logger.debug(`Generated presigned URL for key: ${imageKey}`);
    return { uploadUrl, imageKey };
};

// Genera una URL prefirmada para ver una imagen (válida 1 hora)
export const generateViewPresignedUrl = async (
    imageKey: string
): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

// Descarga una imagen de S3 como Buffer
export const downloadFromS3 = async (imageKey: string): Promise<Buffer> => {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: imageKey });
    const response = await s3Client.send(command);
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};

// Elimina una imagen de S3
export const deleteFromS3 = async (imageKey: string): Promise<void> => {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey,
    });
    await s3Client.send(command);
    logger.info(`Deleted from S3: ${imageKey}`);
};

export { s3Client };