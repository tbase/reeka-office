// COS SDK 工具模块
// 参考：https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/development/storage/service/cos-sdk.html
import COS, { type Credentials } from "cos-nodejs-sdk-v5";

let cosInstance: COS | null = null;

/**
 * 初始化 COS SDK
 */
async function initCOS() {
  if (cosInstance) {
    return cosInstance;
  }

  cosInstance = new COS({
    getAuthorization: async function (options, callback) {
      try {
        // 获取临时密钥
        const res = await fetch("http://api.weixin.qq.com/_/cos/getauth", {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error(`获取临时密钥失败: ${res.status}`);
        }

        const auth = await res.json() as {
          TmpSecretId: string;
          TmpSecretKey: string;
          Token: string;
          ExpiredTime: number;
        };
        callback({
          TmpSecretId: auth.TmpSecretId,
          TmpSecretKey: auth.TmpSecretKey,
          SecurityToken: auth.Token,
          ExpiredTime: auth.ExpiredTime,
        } as Credentials);
      } catch (error) {
        console.error("获取 COS 临时密钥失败:", error);
      }
    },
  });

  console.log("COS SDK 初始化成功");
  return cosInstance;
}

/**
 * 获取文件元数据（用于小程序端访问）
 */
async function getFileMetadata(openid: string, bucket: string, paths: string[]) {
  const res = await fetch("http://api.weixin.qq.com/_/cos/metaid/encode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      openid,
      bucket,
      paths,
    }),
  });

  if (!res.ok) {
    throw new Error(`获取文件元数据失败: ${res.status}`);
  }

  const result = await res.json() as {
    errcode: number;
    errmsg: string;
    respdata: {
      x_cos_meta_field_strs: string[];
    };
  };
  if (result.errcode !== 0) {
    throw new Error(`获取文件元数据失败: ${result.errmsg}`);
  }

  return result.respdata.x_cos_meta_field_strs;
}

/**
 * 从 COS 读取文件（JSON 格式）
 * @param bucket 存储桶名称
 * @param region 存储桶地域
 * @param cloudPath 云上路径
 * @returns 解析后的 JSON 对象
 */
export async function getFromCOS<T>(
  bucket: string,
  region: string,
  cloudPath: string
): Promise<T> {
  const cos = await initCOS();
  const result = await cos.getObject({
    Bucket: bucket,
    Region: region,
    Key: cloudPath,
  });

  if (result.statusCode !== 200) {
    throw new Error(`读取文件失败: ${result.statusCode}`);
  }

  const body = result.Body;
  if (!body) {
    throw new Error("文件内容为空");
  }

  // 处理 Buffer 或 string 类型的 body
  const content = typeof body === "string" ? body : body.toString();
  return JSON.parse(content) as T;
}

/**
 * 从 COS 读取文件原始内容（用于代理转发）
 * @param bucket 存储桶名称
 * @param region 存储桶地域
 * @param cloudPath 云上路径
 * @returns 原始 Buffer、Content-Type 和 Content-Length
 */
export async function getFromCOSRaw(
  bucket: string,
  region: string,
  cloudPath: string
): Promise<{ body: Buffer; contentType: string | undefined; contentLength: number | undefined }> {
  const cos = await initCOS();
  const result = await cos.getObject({
    Bucket: bucket,
    Region: region,
    Key: cloudPath,
  });

  if (result.statusCode === 404) {
    throw new Error(`NoSuchKey: ${cloudPath}`);
  }

  if (result.statusCode !== 200) {
    throw new Error(`读取文件失败: ${result.statusCode}`);
  }

  const rawBody = result.Body;
  if (!rawBody) {
    throw new Error("文件内容为空");
  }

  const body = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(typeof rawBody === "string" ? rawBody : (rawBody as Uint8Array));

  const headers = result.headers as Record<string, string> | undefined;
  const contentType = headers?.["content-type"] ?? headers?.["Content-Type"];
  const rawLen = headers?.["content-length"] ?? headers?.["Content-Length"];
  const contentLength = rawLen !== undefined ? Number(rawLen) : body.byteLength;

  return { body, contentType, contentLength };
}

/**
 * 上传文件到 COS
 * @param bucket 存储桶名称
 * @param region 存储桶地域，默认 ap-shanghai
 * @param cloudPath 云上路径
 * @param buffer 文件二进制数据
 * @param openid 用户 openid（用于生成元数据）
 * @returns fileID（格式：bucket/path）
 */
export async function uploadToCOS(
  bucket: string,
  region: string,
  cloudPath: string,
  buffer: ArrayBuffer,
  openid: string
): Promise<string> {
  const cos = await initCOS();

  // 获取文件元数据
  const metaIds = await getFileMetadata(openid, bucket, [cloudPath]);
  const metaId = metaIds[0];

  // 上传文件
  const result = await cos.putObject({
    Bucket: bucket,
    Region: region,
    Key: cloudPath,
    StorageClass: "STANDARD",
    Body: Buffer.from(buffer),
    ContentLength: buffer.byteLength,
    Headers: {
      "x-cos-meta-fileid": metaId,
    },
  });

  if (result.statusCode !== 200) {
    throw new Error(`上传文件失败: ${JSON.stringify(result)}`);
  }

  // 返回 fileID（微信云托管格式）
  return `${bucket}/${cloudPath}`;
}
