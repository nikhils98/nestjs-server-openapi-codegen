import { readFile } from 'fs/promises'
import * as yaml from 'js-yaml'
import { OpenApi } from './openapi'
import { generateDtos } from './dto'

run()

async function run() {
  const filePath = 'sample_openapi_specs/items.yml'
  const data = await readOpenApiSpecFile(filePath)
  const api = new OpenApi(data)
  console.log(JSON.stringify(api, null, 4))
  generateDtos(api)
}

async function readOpenApiSpecFile(filePath: string): Promise<any> {
  try {
    const fileContent = await readFile(filePath, 'utf8')

    if (filePath.endsWith('.json')) {
      return JSON.parse(fileContent)
    }

    return yaml.load(fileContent)
  } catch (error) {
    console.error(`Error reading file: ${error}`)
    throw error
  }
}
