export interface Api {
    title: string
    paths: Path[]
}

export interface Path {
    name: string
    type: string
    parameters: Parameter[]
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
    schemaType: SchemaType
    properties?: Property[]
    items?: Schema
}

export type SchemaType = 'string' | 'object' | 'array'

export interface Response {
    statusCode: string
    schema: Schema
}

export interface Property {
    name: string
    schema: Schema
}