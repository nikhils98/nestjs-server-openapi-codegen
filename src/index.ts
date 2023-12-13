import * as fs from 'fs';
import * as yaml from 'js-yaml';

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

const filePath = 'sample_openapi_specs/items.yml';

readYAMLFile(filePath)
    .then(data => console.log(data))
    .catch(error => console.error(error));
