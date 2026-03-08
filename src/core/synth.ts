import { getClassesForFile } from '@/core/parseJSX'
import { checkIfFileExists, getFiles } from '@/core/utils'
import { parse } from '@babel/parser'
import { readFile } from 'node:fs/promises'

async function synthAction() {
  try {
    const runPath = process.env.INIT_CWD

    const configPath = runPath + '/.ez-css-config.json'

    const configExists = await checkIfFileExists(configPath)

    if (!configExists) {
      throw 'Config not found'
    }

    const configDataRaw = await readFile(configPath, 'utf8')

    const configData = JSON.parse(configDataRaw)

    const fileType = configData['fileType']

    const files = await getFiles('./', fileType)

    for (const file of files) {
      const fileData = await readFile(file, 'utf8')

      const ast = parse(fileData, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      })

      const classes = getClassesForFile(ast)

      console.log(classes)
    }
  } catch (error) {
    console.error('error: ', error)
  }
}

export default synthAction
