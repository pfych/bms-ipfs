import fs from 'fs';

export function getFiles(dir: string): string[] {
	return fs.readdirSync(dir).flatMap((item) => {
		const path = `${dir}/${item}`;
		if (fs.statSync(path).isDirectory()) {
			return getFiles(path);
		}

		return path;
	});
}
