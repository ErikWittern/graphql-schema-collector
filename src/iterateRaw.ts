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

// helper function to iterate through the data

export async function iterate(
  f, store?,
  start: number = 0,
  end?: number,
  doLog: boolean = true
) {
  const fileList = glob.sync(path.resolve('.', 'schemas', '*.json'))

  end = (typeof end !== 'undefined' && end < fileList.length) ? end : fileList.length
  for (let i = start; i < end; i++) {
    try {
      const path = fileList[i]
      if (doLog) {
        console.log(`processing ${path} (${i + 1} out of ${end})...`)
      }
      await processFile(path, f, store, doLog)
    } catch (e) {
      console.error(e)
    }
  }

  return store
}

async function processFile(path: string, f, store, doLog) {
  let data = JSON.parse(fs.readFileSync(path).toString())

  for (let i = 0; i < data.length; i++) {
    if (doLog) {
      console.log(`\trepo: ${data[i].repo_full_name} (${i + 1} out of ${data.length})`)
    }
 
    // Check value of function so that not returning any value will not ruin data
    const temp = await f(data[i], store)
    if (temp) {
      data[i] = temp
    }
  }

  fs.writeFileSync(path, JSON.stringify(data, null, 2))
}