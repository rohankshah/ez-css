import { configType } from '@/types/congif-types'
import { open, stat, writeFile, readFile } from 'node:fs/promises'

async function checkIfFileExists(pathToCheck: string) {
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

async function createEmptyFile(filePath: string) {
  try {
    const fileHandle = await open(filePath, 'w')
    await fileHandle.close()
  } catch (err) {
    console.error(err)
  }
}

async function writeUtf8File(cssFilePath: string, result: string) {
  await writeFile(cssFilePath, result, 'utf8')
}

async function readUtf8File(filePath: string) {
  const fileData = await readFile(filePath, 'utf8')
  return fileData
}

async function getConfig() {
  const runPath = process.env.INIT_CWD

  const configPath = runPath + '/.ez-css-config.json'

  const configExists = await checkIfFileExists(configPath)

  if (!configExists) {
    throw 'Config not found'
  }

  const configDataRaw = await readUtf8File(configPath)

  const configData: configType = JSON.parse(configDataRaw)

  configData['breakPoints'].sort((a, b) => a - b)

  return configData
}

function removeDotPrefix(selector: string) {
  return selector.replace(/^\./, '')
}

export { checkIfFileExists, createEmptyFile, writeFile, writeUtf8File, readUtf8File, getConfig, removeDotPrefix }
