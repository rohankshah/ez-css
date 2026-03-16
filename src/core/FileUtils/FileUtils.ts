import { open, stat, writeFile, readFile } from 'node:fs/promises'

export class FileUtils {
  constructor() {}

  async checkIfFileExists(pathToCheck: string) {
    try {
      const stats = await stat(pathToCheck)
      return stats.isFile()
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false
      }
      throw error
    }
  }

  async createEmptyFile(filePath: string) {
    try {
      const fileHandle = await open(filePath, 'w')
      await fileHandle.close()
    } catch (err) {
      console.error(err)
    }
  }

  async writeFile(cssFilePath: string, result: string) {
    await writeFile(cssFilePath, result, 'utf8')
  }
  
  async readUtf8File(filePath: string) {
    const fileData = await readFile(filePath, 'utf8')
    return fileData
  }
}
