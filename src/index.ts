import axios from 'axios';
import path from 'path';
import md5File from 'md5-file';
import { Chart } from './types';
import { getFiles } from './utils/getFiles';
import { lap, totalTime } from './utils/timer';

const tables = ['http://www.ribbit.xyz/bms/tables/insane_body.json'];
const chartFolder = path.join(__dirname, '..', 'charts');

const indexCharts = (): Record<string, string> => {
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

const mirrorTable = async (table: string): Promise<void> => {
	console.log('Fetching table:', table);

	try {
		const response = await axios.get<Chart[]>(table);
		lap('Fetch');

		console.log(`Received ${response.data.length} charts`);

		let existingCharts: {
			chart: Chart;
			location: string;
		}[] = [];

		response.data.forEach((item) => {
			if (Object.keys(indexedCharts).includes(item.md5)) {
				existingCharts.push({
					chart: item,
					location: indexedCharts[item.md5],
				});
			}
		});

		console.log(`${existingCharts.length}/${response.data.length} Exist`);
		lap('Compare');
	} catch (e) {
		console.log('Unable to fetch table', e);
		throw new Error(e);
	}
};

const indexedCharts = indexCharts();
lap('Index');

(async () => {
	await Promise.all(tables.map(mirrorTable));
	console.log(`Complete in ${Math.ceil(totalTime)}ms`);
})();
