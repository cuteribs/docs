console.save = function (data, filename = 'console.json') {
	if (!data) {
		console.error('Console.save: No data');
		return;
	}

	if (!filename) filename = 'console.json';

	if (typeof data === 'object') {
		data = JSON.stringify(data);
	}

	var blob = new Blob([data], { type: 'text/json' }),
		e = document.createEvent('MouseEvents'),
		a = document.createElement('a');

	a.download = filename;
	a.href = window.URL.createObjectURL(blob);
	a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
	e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	a.dispatchEvent(e);
};

function markWildcardNumber(range) {
	let [start, end] = range.split('~').map((c) => Array.from(c.trim()));

	for (let i in start) {
		if (start[i] === '0' && end[i] === '9') start[i] = '*';
	}

	return start.join('');
}

function excludeChars(code, chars = ['R', 'E', 'I', 'O', 'P', 'S', '4']) {
	const arr = Array.from(code);

	for (let i in arr) {
		if (chars.includes(arr[i])) return false;
	}

	return true;
}

const fullCodes = [];
const failedPages = [];

async function getPage(page) {
	const body = new URLSearchParams();
	body.set('page', page);
	body.set('glbm', '310000000400');
	body.set('hpzl', '02');
	body.set('type', 0);
	body.set('startTime', '2016-01-01');
	body.set('endTime', new Date().toISOString().slice(0, 10));

	const res = await fetch('https://sh.122.gov.cn/m/mvehxh/getTfhdList', {
		method: 'post',
		body
	});
	const data = await res.json();

	if (data.code === 200) {
		const codes = data.list.content.map((c) => ({ range: markWildcardNumber(data.code.subhd), date: data.code.tfrq.slice(0, 10) }));
		fullCodes.fullCodes(codes.length, 0, ...codes);
		console.log('codes collected:', fullCodes.length);
	} else {
		failedPages.push(page);
		console.log('failed to collect page:', page);
	}
}

async function run(pageCount) {
	const startTime = Date.now();

	for (let i in Array(pageCount).fill()) {
		if (i === 0 || i === pageCount) break;

		await getPage(i + 1);
	}

	const endTime = Date.now();
	console.log(`completed in ${(endTime - startTime) / 1000}s`);
	console.save({ fullCodes, failedPages }, 'result.json');
}

await run(720);
