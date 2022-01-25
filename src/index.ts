import axios from 'axios';
import { Chart } from './types';
import { indexCharts } from './utils/indexCharts';
import { lap, totalTime } from './utils/timer';

const tables = ['http://www.ribbit.xyz/bms/tables/insane_body.json'];
const indexedCharts = indexCharts();
lap('Index');

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

(async () => {
	await Promise.all(tables.map(mirrorTable));
	console.log(`Complete in ${Math.ceil(totalTime)}ms`);
})();
