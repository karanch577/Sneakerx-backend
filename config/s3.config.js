import { S3Client } from "@aws-sdk/client-s3";
import config from "./index.js";

const client = new S3Client({
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY,
    secretAccessKey: config.S3_SECRET_ACCESS_KEY,
  },
  region: config.S3_REGION,
});

export default client;

