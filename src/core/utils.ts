import { open, readFile, stat } from 'node:fs/promises'

async function getConfig() {
  const runPath = process.env.INIT_CWD

  const configPath = runPath + '/.ez-css-config.json'

  const configExists = await checkIfFileExists(configPath)

  if (!configExists) {
    throw 'Config not found'
  }

  const configDataRaw = await readFile(configPath, 'utf8')

  const configData = JSON.parse(configDataRaw)

  const configRoot = configData['root']

  return configRoot
}

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

export { checkIfFileExists, getConfig, createEmptyFile }
