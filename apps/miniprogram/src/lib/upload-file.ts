import type { UploadFile } from "tdesign-miniprogram/upload/type";
import { getCloudInstance } from "./cloud";
import { randomID } from "./random-id";

const UPLOAD_PREFIX = 'office';

const getFileExtension = (path: string) => {
  const matched = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(path);
  return matched ? matched[1].toLowerCase() : "jpg";
};

export const uploadFile = async (file: UploadFile | string, cloudDir: string) => {
  const filePath = typeof file === 'string' ? file : file.url;
  const ext = getFileExtension(filePath);
  const fileID = randomID();
  const cloudPath = `${UPLOAD_PREFIX}/${cloudDir}/${fileID}.${ext}`;
  const cloudInstance = await getCloudInstance();
  const result = await cloudInstance.uploadFile({
    cloudPath,
    filePath,
  });

  console.log("uploadFile", result);
  return cloudPath;
};