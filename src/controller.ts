import { readFile } from "fs/promises"
import { OpenApi } from "./openapi"
import { compile } from "handlebars"
import { camelCase, uniq, upperFirst } from "lodash"

async function generateController(api: OpenApi) {
    const templateFile = await readFile('src/templates/controller','utf-8')
    const template = compile(templateFile)

    const content = template({
        imports: [
            'Param',
            ...uniq(api.paths.map(path => upperFirst(path.type)))
        ],
        title: upperFirst(api.title.replace(/\s/g, '')),
        domainName: camelCase(api.title.replace(/\s/g, '')),
        paths: api.paths.map(path => ({
            methodType: upperFirst(path.type),
            path: path.name,
            methodName: camelCase(path.type + path.name),
            parameters: path.parameters
        }))
    })

    console.log(content)
}