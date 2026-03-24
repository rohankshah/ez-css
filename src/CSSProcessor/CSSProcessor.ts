import { removeDotPrefix } from '@/core/utils/utils'
import { configType } from '@/types/congif-types'
import { BaseCssEntry, BaseCssMapType, INDIVIDUAL, RuleMap, RuleTypeMap } from '@/types/css-processor-types'
import postcss, { AtRule, Root, Rule } from 'postcss'

export class CSSProcessor {
  config: configType
  breakpoints: number[]
  constructor(config: configType) {
    this.config = config
    this.breakpoints = config['breakPoints']
  }

  processCss(rawCss: string, cssFilePath: string, modifiedClasses: string[]) {
    const root = postcss.parse(rawCss, { from: cssFilePath })

    this.syncInOrder(modifiedClasses, root)

    return root.toResult()
  }

  // The aim for now is to preserve classes that are not in use inside the jsx
  // Could expose (preserving / not preserving) as a boolean to the config later on
  syncInOrder(classNames: string[], root: Root) {
    const baseCssMap = this.createCssMap(classNames, root)

    // Clear root
    root.removeAll()

    // Reinsert based on the jsx order
    this.appendBaseMap(baseCssMap, classNames, root)
  }

  createCssMap(classNames: string[], root: Root) {
    const baseCssMap = this.initializeBaseCssMap()

    this.extractAtRules(root, classNames, baseCssMap)
    this.extractRules(root, classNames, baseCssMap)

    return baseCssMap
  }

  initializeBaseCssMap() {
    const baseCssMap: BaseCssMapType = new Map()

    const keys = [INDIVIDUAL, ...this.breakpoints]

    keys.forEach((breakpoint) => {
      const atRuleParam = this.getBaseCssMapKeyByParam(breakpoint)
      this.addAtRuleParamToMap(baseCssMap, atRuleParam, 'media')
    })

    return baseCssMap
  }

  extractAtRules(root: Root, classNames: string[], baseCssMap: BaseCssMapType) {
    root.walkAtRules((atRule) => {
      const atRuleParam = atRule.params

      // Ensure basecssmap key exists
      if (!baseCssMap.has(atRuleParam)) {
        this.addAtRuleParamToMap(baseCssMap, atRuleParam, atRule.name)
      }

      const entry = baseCssMap.get(atRuleParam)

      atRule.walkRules((rule) => {
        this.processRule(rule, classNames, entry)
      })
    })
  }

  extractRules(root: Root, classNames: string[], baseCssMap: BaseCssMapType) {
    const entry = baseCssMap.get(INDIVIDUAL)!

    // Loop INDIVIDUAL classes
    root.walkRules((rule) => {
      if (rule.parent?.type === 'atrule') return

      const selector = removeDotPrefix(rule.selector)

      // IMPORTANT:
      // We only add those rules that are in jsx or have properties
      // If a rule is isn't in jsx, but has properties inside => we keep them
      // If a rule is isn't in jsx, but doesn't have properties inside => we discard them

      // Could expose this property in the config later
      if (!classNames.includes(selector) && rule.nodes.length === 0) return

      this.processRule(rule, classNames, entry)
    })
  }

  processRule(rule: Rule, classNames: string[], entry: BaseCssEntry) {
    const selector = removeDotPrefix(rule.selector)

    const ruleType = classNames.includes(selector) ? 'CORE' : 'OTHER'

    const ruleMap = entry?.ruleTypeMap.get(ruleType)

    ruleMap.set(selector, rule)

    entry?.ruleTypeMap.set(ruleType, ruleMap)
  }

  addAtRuleParamToMap(baseCssMap: BaseCssMapType, atRuleParam: string, atRuleName: string) {
    const ruleTypeMap: RuleTypeMap = new Map([
      ['CORE', new Map()],
      ['OTHER', new Map()]
    ])

    baseCssMap.set(atRuleParam, { ruleTypeMap, atRuleName: atRuleName })
  }

  appendBaseMap(baseCssMap: BaseCssMapType, classNames: string[], root: Root) {
    for (const [breakpoint] of baseCssMap) {
      const baseCssKey = this.getBaseCssMapKeyByParam(breakpoint)
      const entry = baseCssMap.get(baseCssKey)

      if (baseCssKey === INDIVIDUAL) {
        this.addIndividualClassesToRoot(entry, classNames, root, baseCssKey)
        continue
      }
      this.addAtRuleClassesToRoot(baseCssKey, entry, classNames, root)
    }
  }

  addIndividualClassesToRoot(entry: BaseCssEntry, classNames: string[], root: Root, baseCssKey: string) {
    const ruleTypeMap = entry?.ruleTypeMap
    this.appendClasses(ruleTypeMap, classNames, root, baseCssKey)
  }

  addAtRuleClassesToRoot(baseCssKey: string, entry: BaseCssEntry, classNames: string[], root: Root) {
    const ruleTypeMap = entry?.ruleTypeMap
    const atRule = this.createAtRule(entry, baseCssKey)

    if (!ruleTypeMap) {
      root.append(atRule)
      return
    }

    this.appendClasses(ruleTypeMap, classNames, atRule, baseCssKey)
    root.append(atRule)
  }

  createAtRule(entry: BaseCssEntry, baseCssKey: string) {
    const atRuleName = entry?.atRuleName ? entry?.atRuleName : 'media'

    const atRule = new AtRule({ name: atRuleName, params: baseCssKey, nodes: [] })

    return atRule
  }

  appendClasses(ruleTypeMap: RuleTypeMap, classNames: string[], root: Root | AtRule, atRuleParam: string) {
    const coreRules = ruleTypeMap.get('CORE')
    const otherRules = ruleTypeMap.get('OTHER')

    this.appendCoreRules(coreRules, classNames, root, atRuleParam)

    this.appendOtherRules(otherRules, root)
  }

  appendCoreRules(coreRules: RuleMap, classNames: string[], root: Root | AtRule, atRuleParam: string) {
    classNames.forEach((selector) => {
      if (coreRules.has(selector)) {
        // If class existed before, then use the same one
        root.append(coreRules.get(selector))
        coreRules.delete(selector)
      } else {
        if (atRuleParam === INDIVIDUAL) {
          // If no existing class, then add a new empty class.
          // Only for INDIVIDUAL classes. Maybe add setting to config
          const newRule = new Rule({ selector: `.${selector}` })
          root.append(newRule)
        }
      }
    })
  }

  appendOtherRules(otherRules: RuleMap, root: Root | AtRule) {
    otherRules.forEach((rule) => {
      root.append(rule)
    })
  }

  getBaseCssMapKeyByParam(breakpoint: string | number) {
    if (breakpoint === INDIVIDUAL) {
      return INDIVIDUAL
    }

    // For any other atRules that are not in the config
    if (typeof breakpoint === 'string') {
      return breakpoint
    }

    return `(min-width: ${breakpoint}px)`
  }
}
