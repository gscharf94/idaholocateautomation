const fs = require('fs');

const FILENAME = '831 1pm.mbox';

String.prototype.replaceAll = function(a, b) {
	let output = this;
	while(output.indexOf(a) !== -1) {
		output = output.replace(a,b);
	}
	return output;
}

function openFile(fileName) {
	let rawText = fs.readFileSync(`emailLogs/${fileName}`, 'utf-8', (err) => {
		if (err) throw err;
	})
	return rawText;
}

function getCompletedJobs() {
	fs.readdir('completedJobs', 'utf-8', (err, files) => {
		if (err) throw err;
		
		let completedJobs = [];
		for (const file of files) {
			if (file.slice(-4) == '.log') {
				let objs = getFileText(file);
				objs.forEach( (job) => {
					completedJobs.push(job);
				})
			}
		}
		mainLoop(completedJobs, openFile(FILENAME).split("DIG LINE IDAHO"));
	})
}

function testFileName(file) {
	numbers = /^[0-9]+$/;
	if (file.slice(0,2).match(numbers)) {
		return true;
	} else {
		return false;
	}
}

function getFileText(file) {
	let text = fs.readFileSync(`completedJobs/${file}`, 'utf8');
	let completedJobs = text.split("\n").slice(0,-1);
	let objs = [];
	// console.log(`doing file: ${file}`);
	completedJobs.forEach( (job) => {
		let parsedObj = JSON.parse(job.replaceAll(`'`,""));
		let objReally = JSON.parse(parsedObj);
		if (testFileName(file)) {
			objReally['page'] = `PL ${file.slice(0,2)}`;
		} else {
			objReally['page'] = '---';
		}
		objs.push(objReally);
	})
	return objs;
}

function getTicketNumber(job, emails) {
	for (const email of emails) {
		let ind = email.indexOf(job['confirmationNumber']);
		if (ind === -1) {
			continue;
		}

		let ticketNumInd = email.indexOf('Ticket #:');
		return email.slice(ticketNumInd+9, ticketNumInd+9+10);
	}
	return 'PENDING';
}

function writeToCSV(jobs) {
	let output = "houseNum, street, locateInfo, confNumber, tickNum, page\n";
	for (const job of jobs) {
		output += `${job['houseNum']},${job['street']},`;
		output += `${job['locateInfo']},${job['confirmationNumber']},`;
		output += `${job['ticketNum']},${job['page']}\n`;
	}
	console.log(output);
	let date = new Date();
	let filename = `output/${date.getMonth()+1}-${date.getDate()} ${date.getHours()}h ${date.getMinutes()}m.csv` 
	fs.appendFile(filename, output, (err) => {
		if (err) throw err;
	});
}

function mainLoop(completedJobs, emailList) {
	// console.log(`completed: ${completedJobs[0]}`);
	// console.log(`emails: ${emailList[0]}`);

	for (const job of completedJobs) {
		let ticketNum = getTicketNumber(job, emailList);
		job['ticketNum'] = ticketNum;
	}

	writeToCSV(completedJobs);

}


getCompletedJobs();

// let x = openFile('831 1pm.mbox').split("DIG LINE IDAHO");