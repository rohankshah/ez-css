import { parse } from '@babel/parser'
import { JSXExpressionContainer, StringLiteral, traverse } from '@babel/types'

export class JSXParser {
  constructor() {}

  getAst(fileData: string) {
    return parse(fileData, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })
  }

  getClassesForFile(fileData: string) {
    const classes: string[] = []

    const ast = this.getAst(fileData)

    traverse(ast, {
      enter: (path) => {
        if (path.type === 'JSXAttribute' && path.name.name === 'className') {
          const valueNode = path.value

          if (valueNode.type === 'StringLiteral') {
            const parsedClasses = this.parseStringLiteral(valueNode)
            classes.push(...parsedClasses)
          }

          if (valueNode.type === 'JSXExpressionContainer') {
            const parsedClasses = this.parseJSXExpressionContainer(valueNode)
            classes.push(...parsedClasses)
          }
        }
      }
    })

    return classes
  }

  parseStringLiteral(valueNode: StringLiteral) {
    const rawClasses = valueNode?.value
    return rawClasses.split(' ')
  }

  splitClasses(value: string) {
    return value.trim().split(/\s+/).filter(Boolean)
  }

  extractStringLiteral(node: any): string[] {
    if (node.type === 'StringLiteral') {
      return this.splitClasses(node.value)
    }
    return []
  }

  parseJSXExpressionContainer(valueNode: JSXExpressionContainer) {
    const expression = valueNode.expression

    if (expression.type === 'StringLiteral') {
      return this.splitClasses(expression.value)
    }

    if (expression.type === 'TemplateLiteral') {
      const staticClasses = expression.quasis.flatMap((q) => this.splitClasses(q.value.raw))

      const conditionalClasses = expression.expressions.flatMap((e) => {
        if (e.type === 'ConditionalExpression') {
          return [...this.extractStringLiteral(e.consequent), ...this.extractStringLiteral(e.alternate)]
        }
        return []
      })

      return [...staticClasses, ...conditionalClasses]
    }

    return []
  }
}
