const inFile = 'text8.txt';
const maxDepth = 16;

const fs = require('fs').promises;
const root = { children: [], count: 0 };

async function main() {
	await buildTree();
	showStats();
	spew();
}

function showStats() {
	const numNodes = [];
	const sumCounts = [];
	recurse(root);

	function recurse(node, depth = 0) {
		numNodes[depth] = (numNodes[depth] || 0) + 1;
		sumCounts[depth] = (sumCounts[depth] || 0) + node.count;
		if (node.children.length) {
			for (const child of node.children) {
				recurse(child, depth + 1);
			}
		}
	}

	// console.log('numNodes', numNodes);
	// console.log('sumCounts', sumCounts);
	for (let i = 0; i < numNodes.length; i++) {
		sumCounts[i] /= numNodes[i];
	}
	console.log('mean counts:');
	for (let i = 0; i < sumCounts.length; i++) {
		console.log(`level ${i}: ${sumCounts[i]}`);
	}
}

async function buildTree() {
	let inText = (await fs.readFile(`in/${inFile}`)).toString();

	// console.log('inText.length', inText.length);
	inText = inText.substring(0, 4e6);
	fs.writeFile('in/text4M.txt', inText);
	// console.log('inText', inText);

	const window = [];
	let i = 0;
	for (const char of inText) {
		if (window.length >= maxDepth) {
			window.shift();
		}
		window.push(char);

		addToTree(window);
		i++;
		if (i % 1e6 == 0) {
			console.log(
				new Date().toISOString() +
					' : ' +
					((100 * i) / inText.length).toFixed(2) +
					'%'
			);
			const mb = process.memoryUsage().heapUsed >> 20;
			console.log('Memory used:', mb, 'MB');
			// console.log(JSON.stringify(root));
		}
	}
}

function addToTree(window) {
	root.count++;
	let node = root;
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
		}
		node = child;
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

	for (let i = 0; i < 2000; i++) {
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

main();
