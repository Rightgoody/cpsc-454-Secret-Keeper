import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as crypto from "crypto";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const kmsClient = new KMSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const KMS_KEY_ID = process.env.KMS_KEY_ID!;

const response = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  },
  body: JSON.stringify(body),
});

export const createSecret = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) return response(400, { error: "Missing body" });
    
    const { secretMessage, ttlInSeconds } = JSON.parse(event.body);
    const userId = event.requestContext.authorizer?.claims?.sub || "anonymous";

    const encryptCmd = new EncryptCommand({
      KeyId: KMS_KEY_ID,
      Plaintext: Buffer.from(secretMessage),
    });
    const { CiphertextBlob } = await kmsClient.send(encryptCmd);
    
    if (!CiphertextBlob) throw new Error("Encryption failed");

    const encryptedBase64 = Buffer.from(CiphertextBlob).toString('base64');
    const noteId = crypto.randomUUID();
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (ttlInSeconds || 3600);

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        noteId,
        ownerId: userId,
        encryptedContent: encryptedBase64,
        expiryTimestamp,
        createdAt: new Date().toISOString()
      }
    }));

    return response(201, { noteId, message: "Secret secured", expiresAt: expiryTimestamp * 1000 });
  } catch (error) {
    console.error("Error creating secret:", error);
    return response(500, { error: "Internal Server Error" });
  }
};

export const getSecret = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const noteId = event.pathParameters?.noteId;
    if (!noteId) return response(400, { error: "Missing Note ID" });

    const data = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { noteId }
    }));

    if (!data.Item) return response(404, { error: "Secret not found or expired" });

    const decryptCmd = new DecryptCommand({
      CiphertextBlob: Buffer.from(data.Item.encryptedContent, 'base64'),
      KeyId: KMS_KEY_ID
    });

    const { Plaintext } = await kmsClient.send(decryptCmd);
    if (!Plaintext) throw new Error("Decryption failed");
    
    const secretMessage = Buffer.from(Plaintext).toString('utf-8');

    return response(200, { secret: secretMessage, expiresAt: data.Item.expiryTimestamp });
  } catch (error) {
    console.error("Error getting secret:", error);
    return response(500, { error: "Internal Server Error" });
  }
};