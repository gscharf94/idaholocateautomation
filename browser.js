const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

String.prototype.replaceAll = function(a, b) {
	let output = this;
	while(output.indexOf(a) !== -1) {
		output = output.replace(a,b);
	}
	return output;
}

class DataProcessor {
	constructor() {
		this.getOptions();
	}

	errorMessage(err) {
		console.log(`There has been an error\n${err}`);
	}

	getUserOption(options) {
		const r1 = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		let optionsCount = -1;
		for (const option in options) {
			optionsCount++;
		}
		r1.question("?: ", (answer) => {
			if(isNaN(answer)) {
				// exit
				r1.close();
			} else if (Number(answer) > -1 && Number(answer) <= optionsCount) {
				// do next thing
				r1.close();
				this.loadFile(options[answer]);
			} else {
				// exit
				r1.close();
			}
		});
	}

	loadFile(fileName) {
		console.log(`>: ${fileName}`);
		fs.readFile(`blobs/${fileName}`, 'utf-8', (err, content) => {
			if(err) {
				console.log(`error:\n${err}`);
			}
			this.createJobList(content);
		});
	}

	printOptionList(items) {
		let options = {};
		items.forEach( (val, ind) => {
			options[ind] = val;
			console.log(`${ind}: ${val}`);
		});
		this.getUserOption(options);
	}

	getOptions() {
		fs.readdir('blobs/', (error, items) => {
			if(error) {
				this.errorMessage(error);
			}
			this.printOptionList(items);
		});
	}

	createJobList(text) {
		const JOBTEXT = {
			rear: "Locate entire REAR EASEMENT of property",
			front: "Locate entire FRONT EASEMENT of property",
			west: "Locate ALL EASEMENTS alongside the WESTERN side of property",
			east: "Locate ALL EASEMENTS alongside the EASTERN side of property",
			south: "Locate ALL EASEMENTS alongside the SOUTHERN side of property",
			north: "Locate ALL EASEMENTS alongside the NORTHERN side of property"
		};
		let split = text.split("\n");
		split = split.slice(1,split.length-1)
		let jobList = [];

		split.forEach( (val, ind) => {
			let addressInfo = val.slice(0,val.indexOf('}')+1).replaceAll(`'`,`"`);
			addressInfo = JSON.parse(addressInfo);

			let easementInfo = val.slice(val.indexOf('}')+2,).replaceAll(`'`,`"`);
			easementInfo = JSON.parse(easementInfo);

			let job = {
				completed: false,
				street: addressInfo.street,
				houseNum: addressInfo.num,
			};

			for (const option in easementInfo) {
				if (easementInfo[option] === 1) {
					let newJob = { ...job };
					newJob['locateInfo'] = JOBTEXT[option];
					jobList.push(newJob);
				}
			}
		});
		let webBrowser = new WebBrowser(jobList);
	}
}

class WebBrowser {
	constructor(jobList) {
		this.contractorID = "4491";
		this.password = "1546";
		this.city = "Meridian";

		this.jobList = jobList;
		this.date = new Date();
		this.saveLog(`Starting jobList: ${JSON.stringify(jobList)}`);
		this.mainFunction();
	}

	saveLog(text) {
		let fileName = `jobLists/logM${this.date.getMonth()+1}D${this.date.getDay()}H${this.date.getHours()}m${this.date.getMinutes()}.txt` 
		fs.appendFile(fileName, text, (err) => {
			if (err) throw err;
		});
	}

	async acceptTerms(page) {
		let checkBox = await page.$('input[name="ReadNotice"]');
		await checkBox.click();
		await page.evaluate( () => { ChooseMode(1) });
	}

	async waitForLoad(page) {
		await page.waitForNavigation({
			waitUntil: 'networkidle0',
		});
	}

	async login(page) {
		await this.waitForLoad(page);
		let idBar = await page.$('input[name="ContractorID"]');
		let passwordBar = await page.$('input[name="password"]');
		await idBar.type(this.contractorID);
		await passwordBar.type(this.password);

		let enterBar = await page.$('input[value="Enter"]');
		await enterBar.click();
		await this.waitForLoad(page);
		await page.evaluate( () => { SameExcav() });

		await this.waitForLoad();
		let cityBar = await page.$('input[name="DigCitySearch"]');
		await cityBar.type(this.city);

		await page.evaluate( () => { Search(0) });
	}

	mainFunction() {
		(async() => {
			const browser = await puppeteer.launch({ headless:false });
			const page = await browser.newPage();
			await page.goto('http://ticket.digline.com/eticket/default.asp?a=&c=&JavaEnabled=1');
			await this.acceptTerms(page);
			await this.login(page);

			await this.waitForLoad(page);

			setTimeout(() => {
				browser.close();
			}, 5000);
		})();
	}
}


// (async() => {
// 	const browser = await puppeteer.launch({headless:false});
// 	const page = await browser.newPage();
// 	await page.goto('https://google.com');
// 	await page.screenshot({path:'test.png'});

// 	setTimeout( async() => {
// 		await browser.close();
// 	}, 2000);

// })();



dataProcessor = new DataProcessor();