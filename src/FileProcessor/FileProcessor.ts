import { checkIfFileExists, createEmptyFile, readUtf8File, writeUtf8File } from '@/core/utils/utils'
import { CSSProcessor } from '@/CSSProcessor/CSSProcessor'
import { JSXParser } from '@/JSXParser/JSXParser'
import path from 'node:path'
import prettier from 'prettier'

export class FileProcessor {
  jsxParser: JSXParser
  cssProcessor: CSSProcessor

  constructor(jsxParser: JSXParser, cssProcessor: CSSProcessor) {
    this.jsxParser = jsxParser
    this.cssProcessor = cssProcessor
  }

  async processFile(filePath: string) {
    const fileData = await readUtf8File(filePath)

    const classes = this.jsxParser.getClassesForFile(fileData)

    const cssFilePath = filePath.replace(path.extname(filePath), '.css')

    // Check if CSS file exists, if not then create one
    const cssFileExists = await checkIfFileExists(cssFilePath)

    if (!cssFileExists) {
      await createEmptyFile(cssFilePath)
    }

    // Read CSS file
    const rawCss = await readUtf8File(cssFilePath)

    // Process CSS
    const processedCss = this.cssProcessor.processCss(rawCss, cssFilePath, classes)

    const formatted = await prettier.format(processedCss.css, {
      parser: 'css'
    })

    await writeUtf8File(cssFilePath, formatted)
  }
}
