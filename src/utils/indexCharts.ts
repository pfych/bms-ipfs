import { fdir } from 'fdir';
import md5File from 'md5-file';
import path from 'path';
import fs from 'fs';
import { lap } from './timer';
const chartFolder = path.join('/', 'mnt', 'storage', 'BMS');
const cacheFile = path.join(__dirname, '..', '..', 'cache.json');

export const indexCharts = async (): Promise<Record<string, string>> => {
	console.log('Indexing local charts');

	try {
		const api = new fdir()
			.withFullPaths()
			.withMaxDepth(2)
			.glob('./**/*.bms', './**/*.bme', './**/*.bmson')
			.crawl(chartFolder);

		const files = (await api.withPromise()) as string[];
		lap('got files');

		let cache = {};
		if (fs.existsSync(cacheFile)) {
			console.log('Index cache exists');
			cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
		}

		const fileLength = files.length;
		const indexed = files.reduce((acc, val, index) => {
			process.stdout.write(`\r${index + 1}/${fileLength} hashed`);
			if (val.match(/\.bm(s|e|son)/) && !Object.values(acc).includes(val)) {
				console.log(' - new file');
				return { ...acc, [md5File.sync(val)]: val };
			} else {
				return { ...acc };
			}
		}, cache as Record<string, string>);
		lap('hashed files');

		fs.writeFileSync(cacheFile, JSON.stringify(indexed), 'utf8');

		return indexed;
	} catch (e) {
		console.log('Unable to index charts', e);
		throw new Error(e);
	}
};
