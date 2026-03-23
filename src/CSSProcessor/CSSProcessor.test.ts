import { CSSProcessor } from '@/CSSProcessor/CSSProcessor'
import { BaseCssEntry, INDIVIDUAL, RuleMap, RuleTypeMap } from '@/types/css-processor-types'
import postcss, { Declaration, Root, Rule } from 'postcss'
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

    const baseCssMap = processor.initializeBaseCssMap()

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

  it('extracts Rules and classifies them as OTHER and CORE correctly', () => {
    const css = `
      .a { color: red; }

      .b { display: flex; }
    `
    const root = postcss.parse(css)

    const uniqueJSXClasses = ['a']

    const baseCssMap = processor.initializeBaseCssMap()

    processor.extractRules(root, uniqueJSXClasses, baseCssMap)

    expect(baseCssMap.has('(min-width: 768px)')).toBe(true)

    const entry = baseCssMap.get(INDIVIDUAL)

    const coreMap = entry.ruleTypeMap.get('CORE')
    expect(coreMap.has('a')).toBe(true)

    const otherMap = entry.ruleTypeMap.get('OTHER')
    expect(otherMap.has('b')).toBe(true)
  })

  it('creates correct atRule for media', () => {
    const ruleMap: RuleMap = new Map()
    ruleMap.set('a', new Rule())

    const ruleTypeMap: RuleTypeMap = new Map()
    ruleTypeMap.set('CORE', ruleMap)

    const entry: BaseCssEntry = {
      ruleTypeMap,
      atRuleName: 'media'
    }

    const atRule = processor.createAtRule(entry, '(min-width: 768px)')

    expect(atRule?.name).toBe('media')
    expect(atRule?.params).toBe('(min-width: 768px)')
  })

  it('creates correct atRule for keyframes', () => {
    const ruleMap: RuleMap = new Map()
    ruleMap.set('a', new Rule())

    const ruleTypeMap: RuleTypeMap = new Map()
    ruleTypeMap.set('CORE', ruleMap)

    const entry: BaseCssEntry = {
      ruleTypeMap,
      atRuleName: 'keyframes'
    }

    const atRule = processor.createAtRule(entry, 'logo-spin')

    expect(atRule?.name).toBe('keyframes')
    expect(atRule?.params).toBe('logo-spin')
  })

  it('appends otherRules correctly', () => {
    const otherRules: RuleMap = new Map()

    const rule = new Rule({ selector: '.classA' })
    rule.append(new Declaration({ prop: 'display', value: 'flex' }))

    otherRules.set('a', rule)

    const root = new Root()

    processor.appendOtherRules(otherRules, root)

    const parsedRoot = root.nodes[0]

    expect(parsedRoot.toString()).toContain('display: flex')
  })

  it('appends coreRules correctly for INDIVIDUAL classes', () => {
    const classNames = ['classA', 'classB']

    const coreRules: RuleMap = new Map()

    const rule = new Rule({ selector: '.classA' })
    rule.append(new Declaration({ prop: 'display', value: 'flex' }))

    coreRules.set('classA', rule)

    const root = new Root()

    processor.appendCoreRules(coreRules, classNames, root, INDIVIDUAL)

    expect(root.nodes[0].toString()).toContain('display: flex')
    expect(root.nodes[1].toString()).toBe('.classB {}')
  })
})
