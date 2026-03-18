import { FileUtils } from '@/core/FileUtils/FileUtils'
import { configType } from '@/types/congif-types'

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

    const configData: configType = JSON.parse(configDataRaw)

    configData['breakPoints'].sort((a, b) => a - b)

    return configData
  }
}
