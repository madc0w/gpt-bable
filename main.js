const maxDepth = 12;
const maxInputLength = 2e9;

const fs = require('fs');
const path = require('path');
const root = { children: [], count: 0 };
const numNodes = [];
const sumCounts = [];
let initMem,
	inText = '';

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

	console.log('numNodes', numNodes);
	console.log('sumCounts', sumCounts);
	const meanCounts = [];
	for (let i = 0; i < numNodes.length; i++) {
		meanCounts[i] = sumCounts[i] / numNodes[i];
	}
	console.log('mean counts:');
	let i = 0;
	for (const mean of meanCounts) {
		console.log(`level ${i++}: ${mean.toFixed(2)}`);
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
}

async function buildTree() {
	await readInput();
	initMem = process.memoryUsage().heapUsed;

	for (let i = 0; i < maxDepth; i++) {
		numNodes[i] = 0;
		sumCounts[i] = 0;
	}

	console.log('building tree...');
	let i = 0;
	let start = Date.now();
	const window = [];
	for (const char of inText) {
		if (window.length >= maxDepth) {
			window.shift();
		}
		window.push(char);

		addToTree(window);
		i++;

		const elapsed = Date.now() - start;
		if (elapsed > 4000) {
			showMem(i);
			start = Date.now();
		}
	}

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
			if (!node) {
				break;
			}
		}
		if (node) {
			node = randomChild(node);
			window.push(node.token);
			process.stdout.write(node.token);
		}
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
		if (child) {
			sum += child.count;
		} else {
			break;
		}
	}
	return node.children[i - 1];
}

function showMem(numBytesRead) {
	const percentFinished =
		100 * (numBytesRead ? numBytesRead / inText.length : 1);
	console.log(
		new Date().toISOString() + ' : ' + percentFinished.toFixed(2) + '%'
	);
	let totalNumNodes = 0;
	for (const n of numNodes) {
		totalNumNodes += n;
	}
	const mb = process.memoryUsage().heapUsed / (1 << 20);
	const bytesPerNode =
		(process.memoryUsage().heapUsed - initMem) / totalNumNodes;
	console.log(
		`Used ${mb.toFixed(
			1
		)} MB for ${totalNumNodes} nodes (${bytesPerNode.toFixed(2)} bytes/node)`
	);
}

main();
