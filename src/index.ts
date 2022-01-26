import axios from 'axios';
import { Chart } from './types';
import { indexCharts } from './utils/indexCharts';
import { lap, totalTime } from './utils/timer';

const tables = ['http://www.ribbit.xyz/bms/tables/insane_body.json'];
let indexedCharts;

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

		let missingCharts: Chart[] = [];

		response.data.forEach((item, index) => {
			if (Object.keys(indexedCharts).includes(item.md5)) {
				process.stdout.write(`\r${index}/${response.data.length} found`);
				existingCharts.push({
					chart: item,
					location: indexedCharts[item.md5],
				});
			} else {
				missingCharts.push(item);
			}
		});
		lap('Compare');

		console.log(`${existingCharts.length}/${response.data.length} Exist`);
		console.log(`Missing:`, missingCharts);
	} catch (e) {
		console.log('Unable to fetch table', e);
		throw new Error(e);
	}
};

(async () => {
	indexedCharts = await indexCharts();
	await Promise.all(tables.map(mirrorTable));
	console.log(`Complete in: ${Math.ceil(totalTime)}ms`);
})();
