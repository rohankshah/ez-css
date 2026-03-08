import { ParseResult } from '@babel/parser'
import { JSXExpressionContainer, StringLiteral, traverse } from '@babel/types'

function getClassesForFile(ast: ParseResult) {
  const classes = []

  traverse(ast, {
    enter(path) {
      if (path.type === 'JSXAttribute' && path.name.name === 'className') {
        const valueNode = path.value

        if (valueNode.type === 'StringLiteral') {
          const parsedClasses = parseStringLiteral(valueNode)
          classes.push(...parsedClasses)
        }

        if (valueNode.type === 'JSXExpressionContainer') {
          const parsedClasses = parseJSXExpressionContainer(valueNode)
          classes.push(...parsedClasses)
        }
      }
    }
  })

  return classes
}

function parseStringLiteral(valueNode: StringLiteral) {
  const rawClasses = valueNode?.value
  return rawClasses.split(' ')
}

function splitClasses(value: string) {
  return value.trim().split(/\s+/).filter(Boolean)
}

function extractStringLiteral(node: any): string[] {
  if (node.type === 'StringLiteral') {
    return splitClasses(node.value)
  }
  return []
}

export function parseJSXExpressionContainer(valueNode: JSXExpressionContainer) {
  const expression = valueNode.expression

  if (expression.type === 'StringLiteral') {
    return splitClasses(expression.value)
  }

  if (expression.type === 'TemplateLiteral') {
    const staticClasses = expression.quasis.flatMap((q) => splitClasses(q.value.raw))

    const conditionalClasses = expression.expressions.flatMap((e) => {
      if (e.type === 'ConditionalExpression') {
        return [...extractStringLiteral(e.consequent), ...extractStringLiteral(e.alternate)]
      }
      return []
    })

    return [...staticClasses, ...conditionalClasses]
  }

  return []
}

export { getClassesForFile }
