import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Api, Parameter, Path, Property, Response, Schema } from './interfaces';

run()

async function run() {
    const filePath = 'sample_openapi_specs/items.yml';
    const data = await readYAMLFile(filePath)
    console.log(JSON.stringify(data, null, 4));
    const api = mapToApi(data)
    console.log(JSON.stringify(api, null, 4));
}

async function readYAMLFile(filePath: string): Promise<any> {
    try {
        const fileContents = await fs.promises.readFile(filePath, 'utf8');
        const data = yaml.load(fileContents);
        return data;
    } catch (error) {
        console.error(`Error reading file: ${error}`);
        throw error;
    }
}

function mapToApi(data: any): Api {
    return {
        title: data.info.title,
        paths: Object.entries(data.paths).flatMap(([pathName, paths]) =>
            mapToPaths(pathName, paths))
    };
}

function mapToPaths(pathName: string, paths: any): Path[] {
    return Object.entries<any>(paths).map(([pathRequestType, path]) => ({
        name: pathName,
        type: pathRequestType,
        parameters: mapToParameters(path.parameters),
        responses: mapToResponses(path.responses)
    }));
}

function mapToParameters(parameters: any[]): Parameter[] {
    return parameters.map(param => ({
        name: param.name,
        isRequired: param.required === 'true',
        in: param.in,
        schema: mapToSchema(param.schema)
    }));
}

function mapToResponses(responses: any): Response[] {
    return Object.entries<any>(responses).map(([statusCode, response]) => ({
        statusCode,
        schema: mapToSchema(response['content']['application/json']['schema'])
    }));
}

function mapToSchema(data: any): Schema {
    const schema: Schema = { schemaType: data.type };

    if (data.type === 'object') {
        schema.properties = mapToProperties(data.properties);
    } else if (data.type === 'array') {
        schema.items = mapToSchema(data.items);
    }

    return schema;
}

function mapToProperties(properties: any): Property[] {
    return Object.entries(properties).map(([propName, prop]) => ({
        name: propName,
        schema: mapToSchema(prop)
    }));
}