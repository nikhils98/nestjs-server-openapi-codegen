import { MethodEnum, OpenApi, Parameter, Path, Reference, ReferenceType, RequestBody, Response, Schema, StatusResponses } from "./interfaces"

export function mapToOpenApi(data: any): OpenApi {
    return {
        version: data.openapi,
        info: {
            title: data.info.title,
            version: data.info.version
        },
        paths: Object.entries<any>(data.paths).flatMap(([path, methodEndpoints]) => toPaths(path, methodEndpoints)),
        components: {
            parameters: Object.entries<any>(data.components.parameters).reduce((parameters, [key, parameter]) => {
                parameters[key] = toParameter(parameter)
                return parameters
            }, {}),
            requestBodies: Object.entries<any>(data.components.requestBodies).reduce((requestBodies, [key, requestBody]) => {
                requestBodies[key] = toRequestBody(requestBody)
                return requestBodies
            }, {}),
            responses: Object.entries<any>(data.components.responses).reduce((responses, [key, response]) => {
                responses[key] = toResponse(response)
                return responses
            }, {}),
            schemas: Object.entries<any>(data.components.schemas).reduce((schemas, [key, schema]) => {
                schemas[key] = toSchema(schema)
                return schemas
            }, {}),
        }
    }
}

function toPaths(path: string, methodEndpoints: any): Path[] {
    return Object.entries<any>(methodEndpoints).map<Path>(([method, endpoint]) => ({
            path,
            method: <MethodEnum> method,
            summary: endpoint.summary,
            description: endpoint.description,
            parameters: endpoint.parameters ? endpoint.parameters.map(toParameter) : [],
            requestBody: endpoint.requestBody ? toRequestBody(endpoint.requestBody) : null,
            responses: toStatusResponses(endpoint.responses),
        }))
}

function toParameter(parameter: any): Parameter | Reference {
    if(isReference(parameter)) {
        return toReference(parameter, 'parameter')
    }

    return {
        name: parameter.name,
        in: parameter.in,
        isRequired: parameter.required,
        schema: toSchema(parameter.schema)
    }
}

const isReference = (obj: any): boolean => obj['$ref'] != null

function toReference(reference: any, type: ReferenceType): Reference {
    const ref = reference['$ref'] as string
    return {
        key: ref.substring(ref.lastIndexOf('/') + 1),
        type
    }
}

function toSchema(schema: any): Schema | Reference {
    if(isReference(schema)) {
        return toReference(schema, 'schema')
    }

    if(schema.allOf) {
        return {
            type: 'allOf',
            combinations: schema.allOf.map(s => toSchema(s))
        }
    } 

    return {
        type: schema.type,
        title: schema.title,
        enum: schema.enum,
        format: schema.format,
        minimum: schema.minimum,
        maximum: schema.maximum,
        required: schema.required,
        properties: schema.properties ? Object.entries<any>(schema.properties).reduce((properties, [key, prop]) => {
            properties[key] = toSchema(prop)
            return properties
        }, {}) : null,
        items: schema.items ? toSchema(schema.items) : null
    }
}

function toRequestBody(requestBody: any): RequestBody | Reference {
    if(isReference(requestBody)) {
        return toReference(requestBody, 'requestBody')
    }

    return {
        schema: toSchema(requestBody.content['application/json'].schema)
    }
}

function toStatusResponses(responses: any): StatusResponses {
    const statusResponses: StatusResponses = {}

    Object.entries<any>(responses).forEach(([statusCode, response]) => {
        statusResponses[statusCode] = toResponse(response)
    })

    return statusResponses
}

function toResponse(response: any): Response | Reference {
    if (isReference(response)) {
        return toReference(response, 'response')
    } 
    return {
            description: response.description,
            schema: toSchema(response.content['application/json'].schema)
        }
}