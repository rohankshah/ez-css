#!/usr/bin/env node

import synthAction from '@/core/synth'
import { Command } from 'commander'

const program = new Command()

program.command('synth').action(synthAction)

program.parse()
