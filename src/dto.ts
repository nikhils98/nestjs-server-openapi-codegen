import { readFile } from 'fs/promises'
import { compile } from 'handlebars'
import { camelCase, upperFirst } from 'lodash'
import { OpenApi, Reference, Schema } from './openapi/interfaces'

export interface Validator {
  name: string
}

export interface Property {
  name: string
  type: string
  validators: Validator[]
}

export interface Dto {
  name: string
  /** 
   * might be wiser to use dict here to avoid duplicates from combinations
   * if it's possible in handlebar template to extract
   */
  properties: Property[]
}

export async function generateDtos(api: OpenApi) {
  const templateFile = await readFile('src/templates/dto', 'utf-8')
  const template = compile(templateFile)

  const dtos = {}

  Object.entries<Schema>(api.components.schemas).forEach(([key, schema]) => {
    toDto(key, schema, dtos, api)
  })

  const content = template({
    dtos: Object.values(dtos)
  })

  console.log(content)
}

function toDto(key: string, schema: Schema, dtos: { [name: string]: Dto }, api: OpenApi): Dto {
  if(dtos[schema.title || key]) {
    return dtos[schema.title || key]
  }

  if(schema.type === 'schema') {
    const apiSchema = api.components.schemas[(schema as Reference).key]
    return toDto((schema as Reference).key, apiSchema, dtos, api)
  }

  /** need to generalize to an interface or type to make oneOf work */
  const dto: Dto = {
    name: schema.title ?? key,
    properties: []
  }

  if(schema.type === 'allOf') {
    schema.combinations.forEach(c => {
      const childDto = toDto((c as Reference).key ?? key, c, dtos, api)
      dto.properties.push(...childDto.properties)
    })
  } else {
    Object.entries<Schema>(schema.properties).map(([propKey, prop]) => {
      const name = prop.title ?? propKey
      if(prop.type === 'object') {
        dto.properties.push({
          name,
          type: toDto(propKey, prop, dtos, api).name,
          validators: []
        })
      } else if (prop.type === 'array') {
        dto.properties.push({
          name,
          type: toDto(propKey, prop.items, dtos, api).name + '[]',
          validators: []
        })
      } else {
        dto.properties.push({
          name,
          type: prop.type,
          validators: []
        })
      }
    })
  }

  dtos[dto.name] = dto
  return dto
}