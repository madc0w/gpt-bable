const maxDepth = 12;
const maxInputLength = 2e9;

const fs = require('fs');
const path = require('path');
const root = { children: [], count: 0 };
let initMem;
const numNodes = [];
const sumCounts = [];

async function main() {
	await buildTree();
	showStats();
	spew();
}

function showStats() {
	// console.log('computing stats...');
	// const numNodes = [];
	// const sumCounts = [];
	// recurse(root);

	// function recurse(node, depth = 0) {
	// 	numNodes[depth] = (numNodes[depth] || 0) + 1;
	// 	sumCounts[depth] = (sumCounts[depth] || 0) + node.count;
	// 	if (node.children.length) {
	// 		for (const child of node.children) {
	// 			recurse(child, depth + 1);
	// 		}
	// 	}
	// }

	// console.log('numNodes', numNodes);
	// console.log('sumCounts', sumCounts);
	const meanCounts = [];
	for (let i = 0; i < numNodes.length; i++) {
		meanCounts[i] = sumCounts[i] / numNodes[i];
	}
	console.log('mean counts:');
	for (const mean of meanCounts) {
		console.log(`level ${i}: ${mean.toFixed(2)}`);
	}
}

function getAllTxtFiles(dir) {
	const results = [];
	const list = fs.readdirSync(dir);
	list.forEach((file) => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			results.push(...getAllTxtFiles(filePath));
		} else if (path.extname(filePath) === '.txt') {
			results.push(filePath);
		}
	});
	return results;
}

async function readInput() {
	const txtFiles = getAllTxtFiles('in/OANC-GrAF/data/written_1');

	let inText = '';
	for (filePath of txtFiles) {
		console.log('Reading file:', filePath);
		inText += fs.readFileSync(filePath, 'utf8');
		if (inText.length >= maxInputLength) {
			break;
		}
	}

	inText = inText
		.substring(0, maxInputLength)
		.replace(/\t/g, ' ')
		.replace(/\s+/g, ' ');

	// const inText = (await fs.readFile('in/text8.txt'))
	// 	.toString()
	// 	.substring(0, maxInputLength);
	// // fs.writeFile('in/text4M.txt', inText);
	return inText;
}

async function buildTree() {
	const inText = await readInput();
	initMem = process.memoryUsage().heapUsed;

	for (let i = 0; i < maxDepth; i++) {
		numNodes[i] = 0;
	}

	let i = 0;
	const memIntervalId = setInterval(() => {
		showMem(i);
	}, 20 * 1000);

	const window = [];
	for (const char of inText) {
		if (window.length >= maxDepth) {
			window.shift();
		}
		window.push(char);

		addToTree(window);
		i++;
	}
	clearInterval(memIntervalId);
	showMem();
}

function addToTree(window) {
	root.count++;
	let node = root;
	let level = 0;
	for (const token of window) {
		let child = node.children.find((c) => c.token === token);
		if (child) {
			child.count++;
		} else {
			child = {
				token,
				children: [],
				count: 1,
			};
			node.children.push(child);
			numNodes[level]++;
		}
		sumCounts[level]++;
		node = child;
		level++;
	}
}

function spew() {
	const window = [];
	let node = root;
	while (node.children?.length) {
		node = randomChild(node);
		window.push(node.token);
	}
	process.stdout.write(window.join(''));

	while (true) {
		window.shift();
		node = root;
		for (const token of window) {
			node = node.children.find((c) => c.token === token);
		}
		node = randomChild(node);
		window.push(node.token);
		process.stdout.write(node.token);
	}

	// console.log('root.count', root.count);
	// let sum = 0;
	// root.children.forEach((child) => {
	// 	sum += child.count;
	// });
	// console.log('sum', sum);
}

function randomChild(node) {
	let r = Math.max(Math.random() * node.count, 1);
	let sum = 0;
	let i = 0;
	while (sum < r) {
		const child = node.children[i++];
		sum += child.count;
	}
	return node.children[i - 1];
}

function showMem(numBytesRead) {
	const percentFinished = numBytesRead
		? (100 * numBytesRead) / inText.length
		: 100;
	console.log(
		new Date().toISOString() + ' : ' + percentFinished.toFixed(2) + '%'
	);
	const mb = process.memoryUsage().heapUsed / (1 << 20);
	const bytesPerNode = (process.memoryUsage().heapUsed - initMem) / numNodes;
	console.log(
		`Used ${mb.toFixed(1)} MB for ${numNodes} nodes (${bytesPerNode.toFixed(
			2
		)} bytes/node)`
	);
}

main();
