import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

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

async function getFiles(dir: string, fileType: string[]) {
  try {
    const entries = await readdir(dir, { withFileTypes: true })

    const files = await Promise.all(
      entries.map(async (res) => {
        const resPath = path.resolve(dir, res.name)

        if (res.name === 'node_modules' || res.name === '.git') {
          return []
        }

        if (res.isDirectory()) {
          return getFiles(resPath, fileType)
        }

        const fileExtension = path.extname(res.name)
        
        return fileType.includes(fileExtension) ? resPath : []
      })
    )

    return files.flat()
  } catch (err) {
    console.error(err)
    return []
  }
}

export { checkIfFileExists, getFiles }
