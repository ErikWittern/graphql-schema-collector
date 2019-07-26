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
import { iterate } from './iterateRefactored'
import * as fs from 'fs'
import * as graphql from 'graphql'

let errors = {
  content: [],
  merged: []
}

iterate(repoData => {
  for (let i = 0; i < repoData.schemas.length; i++) {
    let schema = repoData.schemas[i]

    try {
      graphql.buildASTSchema(graphql.parse(schema.content))
      schema.validSchema = true
    } catch (e) {
      schema.validSchema = false

      // Only record messages where the schema does not need to be merged
      // Otherwise, we would already know what one of the problems are
      if (!schema.merged) {
        errors.content.push(e.message)
      }
    }
    
    if (schema.merged) {
      try {
        graphql.buildASTSchema(graphql.parse(schema.merged.mergedContent))
        schema.merged.validSchema = true
      } catch (e) {
        schema.merged.validSchema = false

        errors.merged.push(e.message)
      }
    }
  }

  return repoData
})

fs.writeFile('./refactored/addValidSchema.json', JSON.stringify(errors, null, 2) , (err) => {
  if (err) {
    console.log(err)
  }
})
