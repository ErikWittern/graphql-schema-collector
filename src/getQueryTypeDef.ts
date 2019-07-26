/*
 *  This file is part of the graphql-schema-collector project.
 *
 * Copyright 2018-2019 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  DocumentNode,
  ObjectTypeDefinitionNode,
  SchemaDefinitionNode
} from 'graphql'

export function getQueryTypeDef (doc: DocumentNode) : ObjectTypeDefinitionNode {
  // first priority: mutation in schema definition:
  const schemaDef = doc.definitions.find(defNode => defNode.kind === 'SchemaDefinition')
  if (typeof schemaDef !== 'undefined') {
    const opType = (schemaDef as SchemaDefinitionNode).operationTypes.find(op => op.operation === 'query')
    if (typeof opType !== 'undefined') {
      const queryDef =  doc.definitions.find(defNode => defNode.kind === 'ObjectTypeDefinition' && defNode.name.value === opType.type.name.value)
      if (typeof queryDef !== 'undefined') {
        return queryDef as ObjectTypeDefinitionNode
      }
    }
  }
  
  // second priority: "query"-named type:
  const mutDefIndex = doc.definitions.findIndex(defNode => {
    return (
      defNode.kind === 'ObjectTypeDefinition' && (
        defNode.name.value === 'Query' || // 19730 in raw data
        defNode.name.value === 'RootQuery' || // 206
        defNode.name.value === 'RootQueryType' || // 83
        defNode.name.value === 'QueryRoot' || // 32
        defNode.name.value === 'QueryType' // 16
      )
    )
  })
  if (typeof mutDefIndex === 'number') {
    return doc.definitions[mutDefIndex] as ObjectTypeDefinitionNode
  }

  // nothing found:
  return null
}
