import { readFile } from 'fs/promises'
import { compile } from 'handlebars'
import { camelCase, upperFirst } from 'lodash'
import { OpenApi, Reference, Response, Schema } from './openapi/interfaces'

export interface Validator {
  name: string
  decorator: string
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

const allValidators: { [name: string]: Validator } = { }

/** Might need to turn this into a class and store validators in class variable to make imports work efficiently */
export async function generateDtos(api: OpenApi) {
  const templateFile = await readFile('src/templates/dto', 'utf-8')
  const template = compile(templateFile)

  const dtos = {}

  Object.entries<Schema>(api.components.schemas).forEach(([key, schema]) => {
    toDto(key, schema, dtos, api)
  })

  Object.entries(api.components.responses).forEach(([key, res]) => {
    const schema = (res as Reference).type === 'response' ? res : (res as Response).schema
    toDto(key, schema as any, dtos, api)
  })

  const content = template({
    dtos: Object.values(dtos),
    validators: Object.keys(allValidators)
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
      const validateNested = { name: 'ValidateNested', decorator: 'ValidateNested()' }

      if(prop.type === 'object') {
        dto.properties.push({
          name,
          type: toDto(propKey, prop, dtos, api).name,
          validators: [validateNested]
        })
        allValidators[validateNested.name] = validateNested
      } else if (prop.type === 'array') {
        dto.properties.push({
          name,
          type: toDto(propKey, prop.items, dtos, api).name + '[]',
          validators: [validateNested]
        })
        allValidators[validateNested.name] = validateNested
      } else {
        const validators = getValidators(prop)
        dto.properties.push({
          name,
          type: prop.type,
          validators
        })
      }
    })
  }

  dtos[dto.name] = dto
  return dto
}

function getValidators(schema: Schema): Validator[] {
  const validators: Validator[] = []

  if(schema.format === 'uuid') {
    const validator = { name: 'IsUUID', decorator: `IsUUID(4)` }
    validators.push(validator)
    allValidators[validator.name] = validator
  }

  if(schema.minimum) {
    const validator = { name: 'Min', decorator: `Min(${schema.minimum})` }
    validators.push(validator)
    allValidators[validator.name] = validator
  }

  if(schema.maximum) {
    const validator = { name: 'Max', decorator: `Max(${schema.maximum})` }
    validators.push(validator)
    allValidators[validator.name] = validator
  }

  return validators
}