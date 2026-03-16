import postcss, { Root, Rule } from 'postcss'
import mediaParser from 'postcss-media-query-parser'

export class CSSProcessor {
  constructor() {}

  processCss(rawCss: string, cssFilePath: string, modifiedClasses: any[]) {
    const root = postcss.parse(rawCss, { from: cssFilePath })

    this.syncInOrder(modifiedClasses, root)

    return root.toResult()
  }

  // The aim for now is to preserve
  syncInOrder(classNames: string[], root: Root) {
    const ruleMap = new Map<string, Rule>()
    const uniqueJSXClasses = [...new Set(classNames)]

    // Store classes from jsx that already exist in css file
    root.walkRules((rule) => {
      const name = rule.selector.replace(/^\./, '')
      if (uniqueJSXClasses.includes(name)) {
        ruleMap.set(name, rule)
      }
      rule.remove()
    })

    root.walkAtRules((atRule) => {
      const media = mediaParser(atRule.params)

      if (media.type !== 'media-query-list') {
        return
      }

      console.log(media['type'])
    })

    // Reinsert based on the jsx order
    uniqueJSXClasses.forEach((name) => {
      if (ruleMap.has(name)) {
        // If class existed before, then use the same one
        root.append(ruleMap.get(name))
        ruleMap.delete(name)
      } else {
        // If no existing class, then add a new empty class
        const newRule = new Rule({ selector: `.${name}` })
        root.append(newRule)
      }
    })

    // Add remaining classes at the bottom
    ruleMap.forEach((rule) => {
      root.append(rule)
    })
  }
}
