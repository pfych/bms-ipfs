import axios from 'axios';
import { fdir } from 'fdir';
import { create } from 'ipfs-http-client';
import { Chart } from './types';
import { indexCharts } from './utils/indexCharts';
import { lap, totalTime } from './utils/timer';
import fs from 'fs';

interface Table {
	url: string;
	header: string;
	name: string;
}

const tables: Table[] = [
	{
		url: 'http://37.187.114.36:8001/',
		header: 'header.json',
		name: 'BMS_Server',
	},
];

let indexedCharts;

const mirrorTable = async (table: Table): Promise<void> => {
	console.log('Fetching table:', table.name);

	try {
		const ipfs = await create({ url: 'http://192.168.1.132:5001/api/v0' });

		if (!fs.existsSync(`./mirrors/${table.name}`)) {
			fs.mkdirSync(`./mirrors/${table.name}`, { recursive: true });
		}

		const header = await axios.get(`${table.url}${table.header}`);
		fs.writeFileSync(
			`./mirrors/${table.name}/header.json`,
			JSON.stringify(header.data),
			'utf-8',
		);

		const bodyFileName = header.data.data_url;
		const response = await axios.get(`${table.url}${bodyFileName}`);

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

		console.log('Missing the following charts:', missingCharts);

		let mirrorBody = [];

		for (let chart of existingCharts) {
			console.log(
				`Total Progress: ${existingCharts.indexOf(chart) + 1}/${
					existingCharts.length
				}`,
			);
			const parentFolder = chart.location.replace(/\/[^\/]+$/, '');
			const files = (await new fdir()
				.withFullPaths()
				.crawl(parentFolder)
				.withPromise()) as string[];

			const ipfsFolderPath = `/${parentFolder.split('storage/')[1]}`;
			try {
				ipfs.files.mkdir(ipfsFolderPath, { parents: true });
				console.log(`IPFS Created ${ipfsFolderPath}`);
			} catch {
				console.log(`IPFS Folder ${ipfsFolderPath} exists`);
			}

			for (let file of files) {
				const ipfsFileLocation = `/${file.split('storage/')[1]}`;
				try {
					/** @TODO This does not support nested folders & files. FIX!!! */
					await ipfs.files.write(ipfsFileLocation, fs.readFileSync(file), {
						create: true,
						parents: true,
					});
					const { cid } = await ipfs.files.stat(ipfsFileLocation);
					await ipfs.pin.add(cid);
				} catch {
					console.log(`\nFailed to write file ${ipfsFileLocation}\n`);
				}

				process.stdout.write(
					`\r${files.indexOf(file) + 1}/${files.length} uploaded`,
				);
			}

			const { cid } = await ipfs.files.stat(ipfsFolderPath);

			console.log('');
			console.log(`IPFS location: ${cid}`);
			lap('uploaded');

			mirrorBody.push({ ...chart.chart, ipfs: cid.toString() });
			fs.writeFileSync(
				`./mirrors/${table.name}/${bodyFileName}`,
				JSON.stringify(mirrorBody),
				'utf-8',
			);
		}
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
