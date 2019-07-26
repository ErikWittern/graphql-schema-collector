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
import axios from 'axios'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()

function writeResults(results, minSize, maxSize, page) {
  const fileName = `schemas_gql_${minSize}B-${maxSize}B_${page}.json`
  const toWrite = results.map(item => {
    return {
      name: item.name,
      path: item.path,
      sha: item.sha,
      url: item.url,
      git_url: item.git_url,
      html_url: item.html_url,
      repo_name: item.repository.name,
      repo_full_name: item.repository.full_name,
      repo_owner: item.repository.owner.login,
      repo_private: item.repository.private,
      repo_owner_type: item.repository.owner.type,
      repo_fork: item.repository.fork,
      repo_description: item.repository.description
    }
  })
  if (!fs.existsSync(path.resolve('.', 'schemas'))) {
    fs.mkdirSync(path.resolve('.', 'schemas'))
  }
  fs.writeFileSync(
    path.resolve('.', 'schemas', fileName),
    JSON.stringify(toWrite, null, 2)
  )
}

export async function sleep(sec: number) {
  return new Promise(resolve => {
    setTimeout(resolve, 1000 * sec)
  })
}

async function makeRequest(
  minSize: number,
  maxSize: number,
  perPage: number = 100,
  page: number = 1
) {
  return axios({
    url:
      `https://api.github.com/search/code` +
      `?q=type+extension:gql+extension:graphql+fork:false+size:${minSize}..${maxSize}` +
      `&per_page=${perPage}` +
      `&page=${page}`,
    auth: {
      username: process.env.GH_USERNAME,
      password: process.env.GH_PASSWORD
    }
  })
}

function getMinMaxSize(
  start: number,
  lastIntervalSize: number,
  lastTotalCount?: number
) {
  if (typeof lastTotalCount === 'undefined') {
    return { minSize: start, maxSize: start + lastIntervalSize }
  } else if (lastTotalCount > 1000) {
    return {
      minSize: start,
      maxSize: start + Math.floor(lastIntervalSize / 2)
    }
  } else if (lastTotalCount < 250) {
    return {
      minSize: start,
      maxSize: start + Math.floor(lastIntervalSize * 2)
    }
  } else {
    return { minSize: start, maxSize: start + lastIntervalSize }
  }
}

async function main(startSize: number, startIntervalSize: number) {
  // some configuration:
  const retryInSec = 60
  const perPage = 100
  const expSecSleep = 35

  // initial attempt:
  let { minSize, maxSize } = getMinMaxSize(startSize, startIntervalSize)
  let lastIntervalSize = maxSize - minSize
  while (maxSize < 9999999) {
    console.log(
      `\nProcess interval ${minSize}..${maxSize} (size: ${lastIntervalSize})`
    )
    try {
      let page = 1
      console.log(`  Load page ${page}...`)
      const firstResponse = await makeRequest(minSize, maxSize, perPage, page)
      const totalCount = firstResponse.data.total_count
      console.log(`${totalCount} responses.`)
      if (totalCount > 1000) {
        console.error(
          `-> Too many entries in interval ${minSize}..${maxSize}: ${totalCount}`
        )
        // Determine with smaller interval:
        maxSize = getMinMaxSize(minSize, lastIntervalSize, totalCount).maxSize
        lastIntervalSize = maxSize - minSize

        // Wait until retry:
        let sleepSeconds = Math.floor(Math.random() * 2 * expSecSleep + 15) // 15 secs min...
        console.log(`Retry smaller interval in ${sleepSeconds} seconds...`)
        await sleep(sleepSeconds)
      } else {
        console.error(`-> Load remaining pages in ${minSize}..${maxSize}...`)
        writeResults(firstResponse.data.items, minSize, maxSize, page)
        page++

        // Load remaining pages:
        while (totalCount > perPage * page) {
          try {
            let sleepSeconds = Math.floor(Math.random() * 2 * expSecSleep + 15) // 15 secs min...
            const remaining = Number(
              firstResponse.headers['x-ratelimit-remaining']
            )
            if (remaining < 5) {
              console.log('  BACK OFF...')
              sleepSeconds += 120 // 2 minutes tranquility.
            }
            console.log(
              `  Sleep ${sleepSeconds} seconds (${remaining} rates remaining)...`
            )
            await sleep(sleepSeconds)

            console.log(`  Load page ${page}...`)
            const nextResponse = await makeRequest(
              minSize,
              maxSize,
              perPage,
              page
            )
            writeResults(nextResponse.data.items, minSize, maxSize, page)
            page++
          } catch (error) {
            console.error(`Error: ${error.message}`)
          }
        }

        // Determine next interval:
        minSize = getMinMaxSize(maxSize, lastIntervalSize, totalCount).minSize
        maxSize = getMinMaxSize(maxSize, lastIntervalSize, totalCount).maxSize
        lastIntervalSize = maxSize - minSize
      }
    } catch (error) {
      let sleepSeconds = Math.floor(Math.random() * 2 * expSecSleep + 15) // 15 secs min...
      console.error(
        `Error: ${error.message} - Retry in ${sleepSeconds} seconds...`
      )
      await sleep(sleepSeconds)
    }
  }
  console.log(`Max size reached ${maxSize} - done.`)
}

if (require.main === module) {
  // parse arguments:
  const minSize = Number(process.argv[2])
  if (
    minSize === null ||
    typeof minSize !== 'number' ||
    !(minSize >= 0 && minSize < 999999999)
  ) {
    console.error(`Missing <min-size> argument.`)
    process.exit(-1)
  }
  const intervalSize = Number(process.argv[3])
  if (
    intervalSize === null ||
    typeof intervalSize !== 'number' ||
    !(intervalSize >= 0 && intervalSize < 999999999)
  ) {
    console.error(`Missing <interval-size> argument.`)
    process.exit(-1)
  }
  main(minSize, intervalSize)
}
