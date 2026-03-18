import { FileProcessor } from '@/FileProcessor/FileProcessor'
import { configType } from '@/types/congif-types'
import chokidar, { FSWatcher } from 'chokidar'
import path from 'node:path'

const reactFileExtensions = ['.tsx', '.jsx']

export class Watcher {
  config: configType
  configRoot: string
  watcher: FSWatcher | null
  fileProcessor: FileProcessor

  constructor(config: configType, fileProcessor: FileProcessor) {
    this.config = config
    this.configRoot = config['root']
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
