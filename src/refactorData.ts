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
import { iterate } from './iterateRaw'
import { graphqlData, graphqlDataType } from './types/graphqlData'
import * as fs from 'fs'
import * as path from 'path'

async function main () {
  const outFolderName = path.resolve('.', 'refactored')
  if (!fs.existsSync(path.resolve(outFolderName))){
    fs.mkdirSync(path.resolve(outFolderName))
  }
  
  let countNonGHDupSchemas = 0
  const results = {}
  await iterate(async (data: graphqlData) => {
    if (data.githubDuplicate === false && data.type === graphqlDataType.schema) {
      const fullName = data.repo_full_name.toLowerCase()
      if (typeof results[fullName] === 'undefined') {
        results[fullName] = {
          repo_name: data.repo_name,
          repo_full_name: fullName,
          repo_owner: data.repo_owner,
          repo_description: data.repo_description,
          repo_private: data.repo_private,
          repo_fork: data.repo_fork,
          schemas: []
        }
      }
      countNonGHDupSchemas++
      results[fullName].schemas.push({
        name: data.name,
        path: data.path,
        sha: data.sha,
        url: data.url,
        git_url: data.git_url,
        html_url: data.html_url,
        content: data.content,
        containsQueryType: data.containsQueryType
      })
    }
  }, null, undefined, undefined, false)

  for (let repoFullName in results) {
    const fileName = repoFullName.replace('/', '___')
    const pathToStore = path.resolve(outFolderName, `${fileName}.json`)
    fs.writeFileSync(pathToStore, JSON.stringify(results[repoFullName], null, 2))
  }
}

main()