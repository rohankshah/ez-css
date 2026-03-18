import { FileUtils } from '@/core/FileUtils/FileUtils'
import { CSSProcessor } from '@/CSSProcessor/CSSProcessor'
import { JSXParser } from '@/JSXParser/JSXParser'
import path from 'node:path'
import prettier from 'prettier'

export class FileProcessor {
  jsxParser: JSXParser
  fileUtils: FileUtils
  cssProcessor: CSSProcessor

  constructor(jsxParser: JSXParser, fileUtils: FileUtils, cssProcessor: CSSProcessor) {
    this.jsxParser = jsxParser
    this.fileUtils = fileUtils
    this.cssProcessor = cssProcessor
  }

  async processFile(filePath: string) {
    const fileData = await this.fileUtils.readUtf8File(filePath)

    const classes = this.jsxParser.getClassesForFile(fileData)

    const cssFilePath = filePath.replace(path.extname(filePath), '.css')

    // Check if CSS file exists, if not then create one
    const cssFileExists = await this.fileUtils.checkIfFileExists(cssFilePath)

    if (!cssFileExists) {
      await this.fileUtils.createEmptyFile(cssFilePath)
    }

    // Read CSS file
    const rawCss = await this.fileUtils.readUtf8File(cssFilePath)

    // Process CSS
    const processedCss = this.cssProcessor.processCss(rawCss, cssFilePath, classes)

    const formatted = await prettier.format(processedCss.css, {
      parser: 'css'
    })

    await this.fileUtils.writeFile(cssFilePath, formatted)
  }
}
