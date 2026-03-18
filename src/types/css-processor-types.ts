import { Rule } from 'postcss'

type ruleType = 'CORE' | 'OTHER'

type ruleMap = Map<string, Rule>
export type ruleTypeMap = Map<ruleType, ruleMap>
export type BaseCssMapType = Map<string, ruleTypeMap>
