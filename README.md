# GraphQL Schema Collector

Scripts to mine GitHub for GraphQL schemas, defined in the Schema Definition Language. Details on the mining and preprocessing as well as on an analysis of thousands of mined schemas can be found in our [2019 ICSOC paper]().

## Prerequisites
In order to use these scripts, perform the following steps:

1. Clone this repository and install dependencies using `npm i`.
2. Create a file named `.env` in the main folder containing the following:
   ```
   GH_USERNAME=<your GitHub username>
   GH_PASSWORD=<your GitHub password>
   ```

## Data collection
The first set of scripts in this repository searches GitHub for GraphQL schema definitions, and downloads metadata as well as the content of such files.

1. `npm run load-metadata <min-size> <interval-size>`: Searches GitHub for GraphQL schema definition files. The argument `<min-size>` is the minimum number of bytes a schema file should have. The argument `<interval-size>` is the size of the interval in bytes for the crawler to look in. The crawler automatically updates the interval size subsequently to search for all schema definition files that have at least the given minimum size. A reasonable command to start off with is `npm run load-metadata 0 5`. The results will be written into JSON files created in a `schemas` folder, which will contain files for different intervals. The data, so far, does not contain the content of the schema definition files yet, only references to the files on GitHub. This step can take multiple hours, as the crawler is designed to adhere to GitHub's API rate limits.
2. `npm run load-content <begin-at>`: Load the actual content of the schema files. The argument `<begin-at>` can be used to skip a number of files in that folder from processing. This script will add a `content` property to the data, containing the content of the schema definition file.

## Data processing
The second set of scripts in this repository preprocesses previously collected data. The scripts should be run in the outlined order. Note that these scripts may log errors, as, for example, parsing a schema fails - this is expected, and the scripts will still continue.

1. `npm run preprocess`: Checks all files in the `schemas` folder for having the same GitHub URL and adds a `githubDuplicate` property. Duplication can be the result of the GitHub search being inconsistent. Also adds a `type` property that denotes if the content in a found file is a schema (`schema`), an operation (`query`), a mixture of both (`mixed`), or cannot be determined (`null`). Finally, also adds a `addContainsQueryType` property that denotes if, given the content is a `schema`, a `Query` type is defined in it.
2. `npm run refactor`: Refactors the data in the `schemas` folder by grouping schemas based on their (shared) repository. The output is written into a `refactored` folder.
3. `npm run preprocess-refactored`: Attempts to merge partial schemas that belong to the same repository as described in our [ICSOC paper](). If merging succeeds, a new `merged` entry will be added to the corresponding schema entry, which again contains the content of the merged schema in a `mergedContent` field. Also, per schema, this script adds a `validSchema` property denoting if the schema is deemed valid as defined in the GraphQL specification. Finally, adds a `contentDuplicate` property that denotes if the (merged) schema is contained multiple times across all collected data.

## License
Licensed under the Apache License, Version 2.0.
