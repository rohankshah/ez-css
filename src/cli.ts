#!/usr/bin/env node

import { FileProcessor } from '@/FileProcessor/FileProcessor'
import { JSXParser } from '@/JSXParser/JSXParser'
import { FileUtils } from '@/core/FileUtils/FileUtils'
import { Config } from '@/core/Utils/config'
import { Watcher } from '@/Watcher/Watcher'
import { Command } from 'commander'
import { CSSProcessor } from '@/CSSProcessor/CSSProcessor'

const program = new Command()

program.command('watch').action(async () => {
  const jsxParser = new JSXParser()
  const fileUtils = new FileUtils()

  const config = new Config(fileUtils)
  const configData = await config.getConfig()

  const cssProcessor = new CSSProcessor(configData)

  const fileProcessor = new FileProcessor(jsxParser, fileUtils, cssProcessor)
  const watcher = new Watcher(configData, fileProcessor)

  watcher.setupWatch()
})

program.parse()
