const { count } = require('console');

const fs = require('fs').promises;

const root = { children: [], count: 0 };
const maxDepth = 12;

async function main() {
	await buildTree();

	spew();
}

async function buildTree() {
	let inText = (await fs.readFile('in/text8.txt')).toString();

	// console.log('inText.length', inText.length);
	inText = inText.substring(0, 1e7);
	// console.log('inText.length', inText.length);

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
	console.log('root.count', root.count);
	let sum = 0;
	root.children.forEach((child) => {
		sum += child.count;
	});
	console.log('sum', sum);
}

main();
