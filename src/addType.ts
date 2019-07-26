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
import * as graphql from 'graphql'
import { iterate } from './iterateRaw'
import { graphqlData, graphqlDataType } from './types/graphqlData'

// add the type property to the data if applicable

iterate(async (data: graphqlData) => {
  data.type = null

  if (data.content) {
    try {
      let definitions = graphql.parse(data.content).definitions as graphql.DefinitionNode[]
      
      const schemaNodeCount = definitions.filter((node) => {
        return graphql.isTypeSystemDefinitionNode(node) || graphql.isTypeSystemExtensionNode(node)
      }).length

      const queryNodeCount = definitions.filter((node) => {
        return graphql.isExecutableDefinitionNode(node)
      }).length

      if (schemaNodeCount + queryNodeCount === definitions.length) {
        if (schemaNodeCount === definitions.length) {
          data.type = graphqlDataType.schema
        } else if (queryNodeCount === definitions.length) {
          data.type = graphqlDataType.query
        } else {
          data.type = graphqlDataType.mixed
        }
      } else {
        throw new Error(`schemaNodeCount, ${schemaNodeCount}, + queryNodeCount, ` + 
        `${queryNodeCount}, does not equal definitions.length, ` + `
        ${definitions.length}, for graphQL content, ${data.content}`)
      }
    } catch (e) {
      console.error(e)

      data.type = graphqlDataType.parseError
    }
  }

  return data
})

