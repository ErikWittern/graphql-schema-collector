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
import * as glob from 'glob'
import * as fs from 'fs'
import * as path from 'path'
import { RepoData } from './types/repo-data'

export async function iterate (
  f: (repoData: RepoData) => RepoData | void,
  start: number = 0,
  end?: number,
  doLog: boolean = true
) {
  const fileList = glob.sync(path.resolve('.', 'refactored', '*.json'))

  end = (typeof end !== 'undefined' && end < fileList.length) ? end : fileList.length
  for (let i = start; i < end; i++) {
    if (fileList[i].includes('_countRefactored.json')) {
      continue
    }
    const repoData = JSON.parse(fs.readFileSync(fileList[i]).toString()) as RepoData

    if (doLog) {
      console.log(`processing ${repoData.repo_full_name} (${i + 1} out of ${end})`)
    }

    const result = f(repoData)

    if (result) {
      fs.writeFileSync(fileList[i], JSON.stringify(result, null, 2))
    }
  }
}
