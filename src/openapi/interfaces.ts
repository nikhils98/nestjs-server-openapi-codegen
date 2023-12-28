export interface OpenApi {
	version: string
	info: ApiInfo;
	paths: Path[];
	components: Components;
}

export interface ApiInfo {
	title: string;
	version: string;
}

export interface Path {
	path: string
	method: MethodEnum
	summary?: string;
	description?: string;
	parameters?: (Parameter | Reference)[];
	requestBody?: RequestBody | Reference;
	responses: StatusResponses
}

export enum MethodEnum {
	Get = 'get',
	Post = 'post',
	Put = 'put',
	Delete = 'delete'
}

export interface Parameter {
	name: string;
	in: 'query' | 'header' | 'path'
	isRequired?: boolean;
	schema: Schema | Reference;
}

export interface RequestBody {
	schema: Schema | Reference
}

export interface StatusResponses {
	[statusCode: string]: Response | Reference
}

export interface Response {
	description: string;
	schema: Schema | Reference
}

export interface Components {
	schemas: { [key: string]: Schema | Reference };
	parameters: { [key: string]: Parameter | Reference };
	requestBodies: { [key: string]: RequestBody | Reference };
	responses: { [key: string]: Response | Reference };
}

export interface Schema {
	type: string;
	required?: string[]
	title?: string
	format?: 'uuid';
	properties?: { [key: string]: Schema | Reference };
	items?: Schema | Reference;
	enum?: string[];
	combinations?: (Schema | Reference) []
	minimum?: number
	maximum?: number
}

/** 
 * Remove this interface
 * instead introduce reference in type in Schema
 * or turn these interfaces into classes so I can
 * differentiate
 */
export interface Reference {
	key: string
	type: ReferenceType
}

export type ReferenceType = 'parameter' | 'requestBody' | 'response' | 'schema'