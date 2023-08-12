import client from "../config/s3.config.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// key is a unique id for the file and body is the actual file
// the options are passed as First capital
export const s3FileUpload = async({bucketName, key, body, contentType}) => {
    const command =  new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType
    })

    try {
        const response = await client.send(command);
        return response;
      } catch (err) {
        console.error(`error in file upload ${err}`);
      }
}

export const deleteFile = async({bucketName, key}) => {
    const command =  new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
    })

    try {
        const response = await client.send(command);
        return response;
      } catch (err) {
        console.error(err);
      }
}
