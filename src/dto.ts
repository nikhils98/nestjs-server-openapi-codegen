import { readFile } from "fs/promises"
import { compile } from "handlebars"
import { OpenApi, Schema } from "./openapi"
import { camelCase, upperFirst } from "lodash"

export interface Property {
    name: string
    type: string
}

export interface DtoClass {
    name: string
    properties: Property
}

export interface Dto {
    classes: DtoClass[]
}

export async function generateDtos(api: OpenApi) {
    const templateFile = await readFile('src/templates/dto', 'utf-8')
    const template = compile(templateFile)

    const classes: DtoClass[] = [] 

    for(const res of api.paths.map(p => p.responses[0])) {
       getClassFromSchema(classes, res.schema)
    }

    const dto: Dto = {
        classes
    }

    const content = template(dto)

    console.log(content)
}

function getClassFromSchema(classes: any[], schema: Schema) {
    const dtoClass = {
        name: upperFirst(schema.title),
        properties: [] as any[]
    }
    if(schema.type === 'object') {
        for (const prop of schema.properties!) {
            if(prop.type === 'string') {
                dtoClass.properties.push({ name: camelCase(prop.title), type: prop.type })
            } else if (prop.type === 'object') {
                dtoClass.properties.push({ name: camelCase(prop.title), type: upperFirst(prop.title) })
                getClassFromSchema(classes, prop)
            } else {
                dtoClass.properties.push({ name: camelCase(prop.title), type: upperFirst(prop.items?.title + '[]') })
                getClassFromSchema(classes, prop)
            }
        }
        classes.push(dtoClass)
    } else if (schema.type === 'array') {
        getClassFromSchema(classes, schema.items!)
    }
}