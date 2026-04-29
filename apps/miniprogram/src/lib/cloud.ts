import { config } from './config'

let cloudInstance: WxCloud | undefined
export async function getCloudInstance(): Promise<WxCloud> {
  if (cloudInstance) {
    return cloudInstance
  }
  // @ts-ignore
  const instance = new wx.cloud.Cloud({
    resourceAppid: config.CLOUD_APPID,
    resourceEnv: config.CLOUD_ENV,
  })
  await instance.init()
  cloudInstance = instance
  return instance
}
