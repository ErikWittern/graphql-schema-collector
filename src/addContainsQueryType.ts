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
import { graphqlData } from './types/graphqlData'
import { getQueryTypeDef } from './getQueryTypeDef'

iterate(async (data: graphqlData) => {
  data.containsQueryType = null
  if (data.content) {
    try {
      let document = graphql.parse(data.content)
      const queryDef = getQueryTypeDef(document)
      if (queryDef) {
        data.containsQueryType = true
      } else {
        data.containsQueryType = false
      }
    } catch (e) {
      // nothing...
    }
    return data
  }
}, undefined, undefined, undefined, false)
