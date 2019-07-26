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
import * as graphql from 'graphql'

let seenAsts = new Set<string>()

iterate(repoData => {
  for (let i = 0; i < repoData.schemas.length; i++) {
    // Check if merged content exists
    if (repoData.schemas[i].merged && repoData.schemas[i].merged.validSchema) {
      const astString = JSON.stringify(graphql.buildASTSchema(graphql.parse(repoData.schemas[i].merged.mergedContent)))
 
      if (seenAsts.has(astString)) {
        repoData.schemas[i].merged.contentDuplicate = true
      } else {
        seenAsts.add(astString)
        repoData.schemas[i].merged.contentDuplicate = false
      }
    } else if (repoData.schemas[i].validSchema) {
      const astString = JSON.stringify(graphql.buildASTSchema(graphql.parse(repoData.schemas[i].content)))
 
      if (seenAsts.has(astString)) {
        repoData.schemas[i].contentDuplicate = true
      } else {
        seenAsts.add(astString)
        repoData.schemas[i].contentDuplicate = false
      }
    }
  }
  
  return repoData
})

