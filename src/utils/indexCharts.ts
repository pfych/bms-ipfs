import md5File from 'md5-file';
import path from 'path';
import { getFiles } from './getFiles';

const chartFolder = path.join(__dirname, '..', 'charts');

export const indexCharts = (): Record<string, string> => {
	console.log('Indexing local charts');
	try {
		const files: string[] = getFiles(chartFolder);

		return files.reduce((acc, val) => {
			return { ...acc, [md5File.sync(val)]: val };
		}, {} as Record<string, string>);
	} catch (e) {
		console.log('Unable to index charts', e);
		throw new Error(e);
	}
};
