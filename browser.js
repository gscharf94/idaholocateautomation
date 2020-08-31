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
		console.log(`get user options: ${options}`);
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
		console.log(`print options list ${items}`);
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

	checkIfJobCompleted(job, completedJobs) {
		for (let i=0; i<completedJobs.length; i++) {
			let finishedJob = completedJobs[i];
			if (
				job.houseNum === finishedJob.houseNum &&
				job.street === finishedJob.street &&
				job.locateInfo === finishedJob.locateInfo	
			) {
				console.log('Job already completed');
				return true;
			}
		}
		return false;
	}

	trimJobList(jobList, completedJobs) {
		console.log(`joblist: ${jobList}`);
		console.log(`completed: ${completedJobs}`);
		let finalJobList = [];
		for (const job of jobList) {
			if (this.checkIfJobCompleted(job, completedJobs)) {
				
			} else {
				finalJobList.push(job);
			}
		}
		console.log(`final job list:\n${finalJobList}`);
		let webBrowser = new WebBrowser(jobList);
		
	}
	
	getCompletedJobs(jobList) {
		fs.readdir('completedJobs', 'utf-8', (err, files) => {
			if (err) throw err;
			
			let completedJobs = [];
			for (const file of files) {
				if (file.slice(-4) == '.log') {
					let objs = this.getFileText(file);
					objs.forEach( (job) => {
						completedJobs.push(job);
					})
				}
			}
			this.trimJobList(jobList, completedJobs);
		})
	}
	
	getFileText(file) {
		let text = fs.readFileSync(`completedJobs/${file}`, 'utf8');
		let completedJobs = text.split("\n").slice(0,-1);
		// console.log(`getfiletext completed jobs: ${completedJobs}`);
		let objs = [];
		completedJobs.forEach( (job) => {
			console.log()
			objs.push(JSON.parse(job.replaceAll(`'`,"")));
		})
		return objs;
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
			console.log(`splitting ${val}`);
			let addressInfo = val.slice(0,val.indexOf('}')+1).replaceAll(`'`,`"`);
			console.log(`ainfo: >${addressInfo}<`);
			addressInfo = JSON.parse(addressInfo);

			let easementInfo = val.slice(val.indexOf('}')+2,).replaceAll(`'`,`"`);
			console.log(` einfo: >${easementInfo}<`);
			easementInfo = JSON.parse(easementInfo);

			let job = {
				street: addressInfo.street,
				houseNum: addressInfo.num,
			};

			let newJob = { ...job };
			let locateEasement = "";
			for (const option in easementInfo) {
				if (easementInfo[option] === 1) {
					locateEasement += `${JOBTEXT[option]} & `;
				}
			}
			newJob['locateInfo'] = locateEasement.slice(0,-2);
			jobList.push(newJob);
		});
		this.getCompletedJobs(jobList);
	}
}

class WebBrowser {
	constructor(jobList) {
		this.contractorID = "4491";
		this.password = "1546";
		this.city = "Meridian";
		this.first = true;

		this.jobList = jobList;
		this.date = new Date();
		this.saveLog(`Starting jobList: ${JSON.stringify(jobList)}`);
		this.saveLog('---------------------------------------------');
		this.mainFunction();
	}

	saveLog(text) {
		let fileName = `jobLists/logM${this.date.getMonth()+1}D${this.date.getDay()}H${this.date.getHours()}m${this.date.getMinutes()}.txt`
		this.savedJobs = `completedJobs/M${this.date.getMonth()+1}D${this.date.getDay()}H${this.date.getHours()}m${this.date.getMinutes()}.log`; 
		fs.appendFile(fileName, text, (err) => {
			if (err) throw err;
		});
	}

	saveJobInfo(job) {
		fs.appendFile(this.savedJobs, JSON.stringify(job)+"\n", (err) => {
			if (err) throw err;
		});
	}

	async acceptTerms(page) {
		let checkBox = await page.$('input[name="ReadNotice"]');
		await checkBox.click();
		await page.evaluate( () => { ChooseMode(1) });
	}

	async waitForLoad(page) {
		console.log('waiting page loading...')
		await page.waitForNavigation({
			waitUntil: 'networkidle0',
		});
		console.log('loaded');
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

		await this.waitForLoad(page);
		let cityBar = await page.$('input[name="DigCitySearch"]');
		await cityBar.type(this.city);
		await page.evaluate( () => { Search(0) });
	}

	async processJob(page, job) {
		console.log('looking for address bar');
		let addressBar = await page.$('input[name="DigAddressFrom"]');
		await addressBar.click({ clickCount: 3 });
		await addressBar.type(job.houseNum);

		let streetBar = await page.$('input[name="DigStreetSearch"]');
		await streetBar.click({ clickCount: 3 });
		await streetBar.type(job.street);

		await page.evaluate( () => { Search(1) });
		await this.waitForLoad(page);

		await page.evaluate( () => {
			let secondStreetSelect = document.querySelector('select[name="DigInter1"]');
			secondStreetSelect.selectedIndex = 1;
		});
		
		if (this.first == true) {
			let workType = await page.$('select[name="WorkType"]');
			await workType.select('171');

			let checkBox1 = await page.$('input[name="DigInfo1"]');
			let checkBox2 = await page.$('input[name="DigInfo4"]');
			let checkBox3 = await page.$('input[name="DigInfo6"]');

			await checkBox1.click();
			await checkBox2.click();
			await checkBox3.click();

			this.first = false;
		}

		let locateInfoBox = await page.$('textarea[name="AddInfo"]');
		await locateInfoBox.click({ clickCount: 3 });
		await locateInfoBox.type(job.locateInfo);

		let nextSectionButton = await page.$('input[name="Submit"]');
		await nextSectionButton.click();

		await this.waitForLoad(page);
		
		let submitRequestButton = await page.$('input[name="Submit"]');
		submitRequestButton.click();

		await this.waitForLoad(page);

		const pageHTML = await page.evaluate( () =>	document.body.innerHTML);
		
		let startInd = pageHTML.indexOf('<font size="+1">');
		let newHTML = pageHTML.slice(startInd+16,);
		let endInd = newHTML.indexOf('</font>');
		let confNum = newHTML.slice(0,endInd);

		let newRequestButton = await page.$('input[id="button1"]');
		newRequestButton.click();
		job.confirmationNumber = confNum;
		this.saveJobInfo(JSON.stringify(job));
	}

	mainFunction() {
		(async() => {
			const browser = await puppeteer.launch({ headless:false, slowMo: 150 });
			const page = await browser.newPage();
			await page.goto('http://ticket.digline.com/eticket/default.asp?a=&c=&JavaEnabled=1');
			await this.acceptTerms(page);
			await this.login(page);
			await this.waitForLoad(page);

			for (let i=0; i<this.jobList.length; i++) {
				console.log(`starting job: ${this.jobList[i]}`);
				console.log('starting process job');
				await this.processJob(page, this.jobList[i]);
				console.log(`finished job: ${this.jobList[i]}`);
				await this.waitForLoad(page);
				await this.acceptTerms(page);
				await this.waitForLoad(page);
			}

			setTimeout(() => {
				browser.close();
			}, 10000);
		})();
	}
}

dataProcessor = new DataProcessor();