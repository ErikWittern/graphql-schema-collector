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

/**
 * Go through repositories and:
 * 1. Add "hasEntryType" proerty to schemas that have at least one type named
 *    "Query", "Mutation", or "Subscription".
 * 2. For the "hasEntryType" schemas, if a) there are types not defined in the
 *    same file and b) the repo contains "type" schemas containing these types:
 *    create a "merged" property containing a concatenated content and a list of
 *    "type" schemas that were use for merging.
 */
import { SchemaData } from './types/repo-data'
import { parse, DocumentNode, TypeNode, isTypeDefinitionNode, TypeDefinitionNode, DirectiveDefinitionNode } from 'graphql'
import { iterate } from './iterateRefactored'
const scalarTypeNames = ['String', 'Boolean', 'Int', 'Float', 'ID']

iterate(repo => {
  const entrySchemas : { schema: DocumentNode, schemaData: SchemaData }[] = []
  const typeSchemas : { schema: DocumentNode, schemaData: SchemaData }[] = []
  // break up schemas into with or without entryTypes:
  for (const schemaData of repo.schemas) {
    const schema = parse(schemaData.content)
    if (schemaData.containsQueryType === true) {
      entrySchemas.push({schema, schemaData})
    } else {
      typeSchemas.push({schema, schemaData})
    }
  }

  // see if the entryType schemas miss type definitions:
  for (const entry of entrySchemas) {
    const initialContent = `# ${entry.schemaData.html_url}:\n${entry.schemaData.content}`
    const {
      mergedContent,
      mergedPaths,
      typesDefinedByMerge,
      typesUndefined,
      directivesDefinedByMerge,
      directivesUndefined
    } = recGetMergedSchema(initialContent, entry, typeSchemas)
    if (typesUndefined.length === 0 && directivesUndefined.length === 0 && mergedPaths.length > 0) {
      entry.schemaData.merged = {
        mergedContent,
        mergedPaths,
        typesDefinedByMerge,
        directivesDefinedByMerge
      }
    } else if (mergedPaths.length === 0 && (typesUndefined.length !== 0 || directivesUndefined.length !== 0)) {
      entry.schemaData.typesUndefined = typesUndefined
      entry.schemaData.directivesUndefined = directivesUndefined
    }
  }
  return repo
}, undefined, undefined, false)

function recGetMergedSchema (
  mergedContent: string,
  entry: {
    schema: DocumentNode,
    schemaData: SchemaData
  },
  typeSchemas: {
    schema: DocumentNode;
    schemaData: SchemaData;
  }[]
) : {
  mergedContent: string,
  mergedPaths: string[],
  typesDefinedByMerge: string[],
  directivesDefinedByMerge: string[],
  typesUndefined: string[],
  directivesUndefined: string[]
} {
  const ast = parse(mergedContent)
  const mergedPaths = new Set<string>()
  const typesDefinedByMerge = new Set<string>()
  const directivesDefinedByMerge = new Set<string>()

  // Merge for missing type names:
  let typeSchemaPool = [...typeSchemas]
  let undefinedTypeNames = getUndefinedTypeNames(ast)
  while (undefinedTypeNames.length > 0 && typeSchemaPool.length > 0) {
    const undefinedTypeName = undefinedTypeNames[0]
    // get candidate typeSchemas, which contain the given type:
    const candidates = typeSchemaPool.filter(type => {
      return hasTypeDefinition(undefinedTypeName, type.schema)
    })
    if (candidates.length === 0) {
      break
    }
    if (candidates.length > 0) {
      // determine which schema to merge based on paths being most similar:
      const toMerge = candidates.sort((a, b) => {
        const simA = getPathSimilarity(entry.schemaData.path, a.schemaData.path)
        const simB = getPathSimilarity(entry.schemaData.path, b.schemaData.path)
        return simB - simA
      })[0]
      
      // create merged datastructure
      const addedTypes = toMerge.schema.definitions
        .filter(defNode => {
          return isTypeDefinitionNode(defNode) && undefinedTypeNames.includes((defNode as TypeDefinitionNode).name.value)
        })
        .map(defNode => (defNode as TypeDefinitionNode).name.value)
      addedTypes.forEach(at => typesDefinedByMerge.add(at))

      mergedContent += `\n# ${toMerge.schemaData.html_url}:\n${toMerge.schemaData.content}`
      mergedPaths.add(toMerge.schemaData.path)
      typeSchemaPool = typeSchemaPool.filter(obj => {
        return obj.schemaData.html_url !== toMerge.schemaData.html_url
      })
    }
    undefinedTypeNames = getUndefinedTypeNames(parse(mergedContent))
  }

  // Merge for missing directives:
  let undefinedDirectiveNames = getUndefinedDirectiveNames(parse(mergedContent))
  while (undefinedDirectiveNames.size > 0 && typeSchemaPool.length > 0) {
    const undefinedDirectiveName = undefinedDirectiveNames.values().next().value
    // get candidate typeSchemas, which contain the given type:
    const candidates = typeSchemaPool.filter(type => {
      return hasDirectiveDefinition(undefinedDirectiveName, type.schema)
    })
    if (candidates.length === 0) {
      break
    }
    if (candidates.length > 0) {
      // determine which schema to merge based on paths being most similar:
      const toMerge = candidates.sort((a, b) => {
        const simA = getPathSimilarity(entry.schemaData.path, a.schemaData.path)
        const simB = getPathSimilarity(entry.schemaData.path, b.schemaData.path)
        return simB - simA
      })[0]
      
      // create merged datastructure
      const addedDirectives = toMerge.schema.definitions
        .filter(defNode => {
          return defNode.kind === 'DirectiveDefinition' && undefinedDirectiveNames.has((defNode as DirectiveDefinitionNode).name.value)
        })
        .map(defNode => (defNode as TypeDefinitionNode).name.value)
      addedDirectives.forEach(ad => directivesDefinedByMerge.add(ad))
      mergedContent += `\n# ${toMerge.schemaData.html_url}:\n${toMerge.schemaData.content}`
      mergedPaths.add(toMerge.schemaData.path)
      typeSchemaPool = typeSchemaPool.filter(obj => {
        return obj.schemaData.html_url !== toMerge.schemaData.html_url
      })
    }
    undefinedDirectiveNames = getUndefinedDirectiveNames(parse(mergedContent))
  }

  return {
    mergedContent,
    mergedPaths: Array.from<string>(mergedPaths),
    typesDefinedByMerge: Array.from<string>(typesDefinedByMerge),
    typesUndefined: getUndefinedTypeNames(parse(mergedContent)),
    directivesDefinedByMerge: Array.from<string>(directivesDefinedByMerge),
    directivesUndefined: Array.from(getUndefinedDirectiveNames(parse(mergedContent)))
  }
}

function getPathSimilarity (pathA: string, pathB: string) : number {
  const partsA = pathA.split('/')
  const partsB = pathB.split('/')
  let numEqualSegments = 0
  while (partsA[numEqualSegments] === partsB[numEqualSegments]) {
    numEqualSegments++
  }
  return numEqualSegments
}

function hasTypeDefinition (typeName: string, schema: DocumentNode) : boolean {
  return schema.definitions.some(defNode => {
    return defNode.kind !== 'SchemaDefinition' &&
      // @ts-ignore
      typeof defNode.name !== 'undefined' &&
      // @ts-ignore
      defNode.name.value === typeName
  })
}

function hasDirectiveDefinition (directiveName: string, schema: DocumentNode) : boolean {
  return schema.definitions.some(defNode => {
    return defNode.kind === 'DirectiveDefinition' &&
      typeof defNode.name !== 'undefined' &&
      defNode.name.value === directiveName
  })
}

function getUndefinedDirectiveNames (schema: DocumentNode) : Set<string> {
  const undefinedDirectiveNames = new Set<string>()
  const directiveDefinitionNames : string[] = schema.definitions
    .filter(defNode => defNode.kind === 'DirectiveDefinition')
    .map(defNode => (defNode as DirectiveDefinitionNode).name.value)
  for (const defNode of schema.definitions) {
    if (defNode.kind === 'ObjectTypeDefinition' ||
      defNode.kind === 'InterfaceTypeDefinition' ||
      defNode.kind === 'InputObjectTypeDefinition'
    ) {
      for (let field of defNode.fields) {
        const fieldDirectiveNames = field.directives.map(dir => dir.name.value)
        for (let fieldDirectiveName of fieldDirectiveNames) {
          if (!directiveDefinitionNames.includes(fieldDirectiveName)) {
            undefinedDirectiveNames.add(fieldDirectiveName)
          }
        }
      }
    }
  }
  return undefinedDirectiveNames
}

function getUndefinedTypeNames (schema: DocumentNode) : string[] {
  const undefinedTypeNames : string[] = []
  const typeNames : string[] = schema.definitions
    // @ts-ignore
    .filter(defNode => typeof defNode.name !== 'undefined')
    // @ts-ignore
    .map(defNode => defNode.name.value)
  for (const defNode of schema.definitions) {
    if (defNode.kind === 'ObjectTypeDefinition' ||
      defNode.kind === 'InterfaceTypeDefinition' ||
      defNode.kind === 'InputObjectTypeDefinition'
    ) {
      for (let field of defNode.fields) {
        const fieldTypeName = getTypeName(field.type)
        if (!typeNames.includes(fieldTypeName) &&
          !undefinedTypeNames.includes(fieldTypeName) &&
          !scalarTypeNames.includes(fieldTypeName)
        ) {
          undefinedTypeNames.push(fieldTypeName)
        }
      }
    }
  }
  return undefinedTypeNames
}

function getTypeName (type: TypeNode) : string {
  if (type.kind === 'NamedType') {
    return type.name.value
  } else if (type.kind === 'ListType') {
    return getTypeName(type.type)
  } else if (type.kind === 'NonNullType') {
    return getTypeName(type.type)
  }
}
