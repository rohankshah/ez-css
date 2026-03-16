import { FileProcessor } from '@/FileProcessor/FileProcessor'
import chokidar, { FSWatcher } from 'chokidar'
import path from 'node:path'

const reactFileExtensions = ['.tsx', '.jsx']

export class Watcher {
  configRoot: string | null
  watcher: FSWatcher | null
  fileProcessor: FileProcessor

  constructor(configRoot: string, fileProcessor: FileProcessor) {
    this.configRoot = configRoot
    this.fileProcessor = fileProcessor
    this.init()
  }

  init() {
    this.watcher = chokidar.watch(this.configRoot, { ignored: /node_modules/, persistent: true })
  }

  setupWatch() {
    if (!this.watcher) return

    this.watcher.on('change', this.watchHandler.bind(this))
  }

  async watchHandler(filePath: string) {
    if (!reactFileExtensions.includes(path.extname(filePath))) {
      return
    }

    this.fileProcessor.processFile(filePath)
  }
}
