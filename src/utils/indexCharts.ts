import md5File from 'md5-file';
import path from 'path';
import fs from 'fs';
import { getFiles } from './getFiles';

const chartFolder = path.join('/', 'mnt', 'storage', 'BMS');
const cacheFile = path.join(__dirname, '..', '..', 'cache.json');

export const indexCharts = (): Record<string, string> => {
	console.log('Indexing local charts');

	try {
		if (fs.existsSync(cacheFile)) {
			console.log('Index cache exists');
			return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
		}

		const files: string[] = getFiles(chartFolder);

		const index = files.reduce((acc, val) => {
			if (val.match(/\.bm(s|e|son)/)) {
				return { ...acc, [md5File.sync(val)]: val };
			} else {
				return { ...acc };
			}
		}, {} as Record<string, string>);

		fs.writeFileSync(cacheFile, JSON.stringify(index), 'utf8');
	} catch (e) {
		console.log('Unable to index charts', e);
		throw new Error(e);
	}
};
