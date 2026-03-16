import { FileUtils } from '@/core/FileUtils/FileUtils'

export class Config {
  fileUtils: FileUtils

  constructor(fileUtils: FileUtils) {
    this.fileUtils = fileUtils
  }

  async getConfig() {
    const runPath = process.env.INIT_CWD
  
    const configPath = runPath + '/.ez-css-config.json'
  
    const configExists = await this.fileUtils.checkIfFileExists(configPath)
  
    if (!configExists) {
      throw 'Config not found'
    }
  
    const configDataRaw = await this.fileUtils.readUtf8File(configPath)
  
    const configData = JSON.parse(configDataRaw)
  
    const configRoot = configData['root']
  
    return configRoot
  }
  
}
