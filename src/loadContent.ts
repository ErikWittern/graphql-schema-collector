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
import axios from 'axios'
import { sleep } from './loadMetadata'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()

async function main(dataPath: string, beginAt: number) {
  const paths = glob.sync(path.resolve(dataPath, '*.json'))

  for (let i = beginAt; i < paths.length - 1; i++) {
    try {
      const path = paths[i]
      console.log(`Process ${path} (${i} out of ${paths.length})...`)
      await processFile(path)
    } catch (e) {
      console.error(e)
    }
  }
}

async function processFile(filePath: string) {
  let data = JSON.parse(fs.readFileSync(filePath).toString())

  for (let i = 0; i < data.length - 1; i++) {
    console.log(
      `  repo: ${data[i].repo_full_name} (${i} out of ${data.length})`
    )

    const content = await loadContent(data[i])
    data[i].content = content

    await sleep(0.5)
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

async function loadContent(data) {
  const rawURL = data.html_url.replace('/blob/', '/raw/')
  let content = null
  try {
    const response = await axios({
      url: rawURL,
      auth: {
        username: process.env.GH_USERNAME,
        password: process.env.GH_PASSWORD
      }
    })
    content = response.data
  } catch (e) {
    console.error(`Error loading ${rawURL}: ${e}`)
  }
  return content
}

if (require.main === module) {
  const dataPath = process.argv[2]
  if (typeof dataPath !== 'string' || dataPath === '') {
    console.error(`Please provide <path-to-raw> argument.`)
    process.exit(-1)
  }
  const beginAt = Number(process.argv[3])
  if (typeof beginAt !== 'number') {
    console.error(`Please provide <begin-at> argument.`)
    process.exit(-1)
  }
  main(dataPath, beginAt)
}
