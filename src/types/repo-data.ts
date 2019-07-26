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
export type MergedSchemaData = {
  mergedContent: string;
  mergedPaths: string[];
  typesDefinedByMerge: string[];
  directivesDefinedByMerge: string[];
  validSchema?: boolean;
  contentDuplicate?: boolean;
  containsCycle?: boolean;
  numObjectTypes?: number;
  numDefinitions?: number;
  polynomialLevel?: number;
  containsFieldListObjects?: boolean;
};

export type SchemaData = {
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  content: string;
  containsQueryType?: boolean;
  typesUndefined?: string[];
  directivesUndefined?: string[];
  validSchema?: boolean;
  contentDuplicate?: boolean;
  merged?: MergedSchemaData;
  containsCycle?: boolean;
  polynomialLevel?: number;
  containsFieldListObjects?: boolean;
  introspection?: string;
  numObjectTypes?: number;
  numDefinitions?: number;
};

export type RepoData = {
  // Commercial repos
  name?: string;
  description?: string;
  graphiql_url?: string;
  docs_url?: string;
  commercial?: boolean;
  comment?: string;
  consider?: boolean;

  // Github repos
  repo_name: string;
  repo_full_name: string;
  repo_owner: string;
  repo_description?: string;
  repo_private: boolean;
  repo_fork: boolean;
  schemas: SchemaData[];

  // metrics:
  metrics?: any;
};
