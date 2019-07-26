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
export type graphqlData = {
  name: string,
  path: string,
  sha: string,
  url: string,
  git_url: string,
  html_url: string,
  repo_name: string,
  repo_full_name: string,
  repo_owner: string,
  repo_private: boolean,
  repo_owner_type: string,
  repo_fork: boolean,
  repo_description: string,
  content?: string,
  type?: graphqlDataType,
  githubDuplicate?: boolean,
  contentDuplicate?: boolean,
  containsQueryType?: boolean
}

export enum graphqlDataType {
  schema = 'schema', 
  query = 'query', 
  parseError = 'parseError', 
  mixed = 'mixed'
}
