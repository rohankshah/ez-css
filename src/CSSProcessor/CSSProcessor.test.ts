import { CSSProcessor } from '@/CSSProcessor/CSSProcessor'
import { BaseCssMapType } from '@/types/css-processor-types'
import postcss from 'postcss'
import { describe, it, expect, beforeEach } from 'vitest'

let processor: CSSProcessor
let config = {
  fileType: ['jsx', 'tsx'],
  root: './src',
  breakPoints: [768, 1024, 1400]
}

describe('CSS Processor', () => {
  beforeEach(() => {
    processor = new CSSProcessor(config)
  })

  it('extracts atRules and classifies them as OTHER and CORE correctly', () => {
    const css = `
      .a { color: red; }
      @keyframes logo-spin {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
      }
      @media (min-width: 768px) {
        .a { color: red; }
        .b { color: blue; }
      }
    `
    const root = postcss.parse(css)

    const uniqueJSXClasses = ['a']

    let baseCssMap: BaseCssMapType = new Map()

    processor.initializeBaseCssMap(baseCssMap)

    processor.extractAtRules(root, uniqueJSXClasses, baseCssMap)

    expect(baseCssMap.has('(min-width: 768px)')).toBe(true)

    const entry = baseCssMap.get('(min-width: 768px)')

    expect(entry.atRuleName).toBe('media')

    const coreMap = entry.ruleTypeMap.get('CORE')
    expect(coreMap.has('a')).toBe(true)

    const otherMap = entry.ruleTypeMap.get('OTHER')
    expect(otherMap.has('b')).toBe(true)

    const keyframeEntry = baseCssMap.get('logo-spin')

    expect(keyframeEntry.atRuleName).toBe('keyframes')

    const keyframeOtherMap = keyframeEntry.ruleTypeMap.get('OTHER')
    expect(keyframeOtherMap.has('from')).toBe(true)
    expect(keyframeOtherMap.has('to')).toBe(true)

  })
})
