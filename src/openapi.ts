export interface Path {
  name: string
  type: string
  parameters: Parameter[]
  //requests: Request[]
  responses: Response[]
}

export interface Parameter {
  name: string
  in: string
  isRequired: boolean
  schema: Schema
}

/**
 * properties field is to be filled for object type only
 * items field is to be filled for array type only
 */
export interface Schema {
  title: string
  type: SchemaType
  properties?: Schema[]
  items?: Schema
}

export type SchemaType = 'string' | 'object' | 'array'

export interface Response {
  statusCode: string
  schema: Schema
}

export class OpenApi {
  title: string
  paths: Path[]

  constructor(data: any) {
    this.title = data.info.title
    this.paths = Object.entries(data.paths).flatMap(([pathName, paths]) =>
      this.mapToPaths(pathName, paths)
    )
  }

  private mapToPaths(pathName: string, paths: any): Path[] {
    return Object.entries<any>(paths).map(([pathRequestType, path]) => ({
      name: pathName,
      type: pathRequestType,
      parameters: this.mapToParameters(path.parameters),
      responses: this.mapToResponses(path.responses),
    }))
  }

  private mapToParameters(parameters: any[]): Parameter[] {
    return parameters.map((param) => ({
      name: param.name,
      isRequired: param.required === 'true',
      in: param.in,
      schema: this.mapToSchema(param.schema),
    }))
  }

  private mapToResponses(responses: any): Response[] {
    return Object.entries<any>(responses).map(([statusCode, response]) => ({
      statusCode,
      schema: this.mapToSchema(
        response['content']['application/json']['schema']
      ),
    }))
  }

  private mapToSchema(data: any, title?: string): Schema {
    const schema: Schema = { title: data.title ?? title, type: data.type }

    if (data.type === 'object') {
      schema.properties = Object.entries(data.properties).map(
        ([propKey, prop]) => this.mapToSchema(prop, propKey)
      )
    } else if (data.type === 'array') {
      schema.items = this.mapToSchema(data.items, title)
    }

    return schema
  }
}
