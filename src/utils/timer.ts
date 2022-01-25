let lastLap = performance.now();
export let totalTime = 0;

export const lap = (name: string): void => {
	const currentTime = performance.now();
	console.log(`${name} in: ${Math.ceil(currentTime - lastLap)}ms\n`);
	totalTime += currentTime - lastLap;
	lastLap = currentTime;
};
