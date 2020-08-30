const fs = require('fs');
const path = require('path');

let job1 = {
	houseNum: 1105,
	street: "dixie ave",
	locateInfo: "LOCATE SOUTH BITACH",
};

let job2 = {
	houseNum: 1534,
	street: "dixie ave",
	locateInfo: "LOCATE SOUTH BITACH",
};

let job3 = {
	houseNum: 1133,
	street: "dixie ave",
	locateInfo: "LOCATE SOUTH BITACH",
};

let job4 = {
	houseNum: 1100,
	street: "dixif ave",
	locateInfo: "LOCATE WEST BITACH",
};

let job5 = {
	houseNum: 1548,
	street: "dixie ave",
	locateInfo: "LOCATE EAST BITACH",
};

let job6 = {
	houseNum: 1648,
	street: 'promise ave',
	locateInfo: 'LOCATE WEST BIATCH'
}

let jobList = [
	job1,
	job2,
	job3,
	job4,
	job5,
	job6,
];

function doJob(job) {
	job.cNumber = "ijojiojioj";
	return job;
}

function createJobLog() {
	fs.appendFile('completedJobs/current/test.log','', (err) => {
		if (err) throw err;
	});
}

function updateLog(job) {
	let text = JSON.stringify(job);
	fs.appendFile('completedJobs/current/test.log',`${text}\n`, (err) => {
		if (err) throw err;
	});
}

function checkIfJobCompleted(job, jobs) {
	for (let i=0; i<jobs.length; i++) {
		let finishedJob = jobs[i];
		if (
			job.houseNum === finishedJob.houseNum &&
			job.street === finishedJob.street &&
			job.locateInfo === finishedJob.locateInfo
		) {
			console.log(`Job already completed ${i}\n${job.houseNum}`);
			return true;
		}
	}
	return false;
}

function doJobs(completedJobs) {
	createJobLog();
	jobList.forEach( (job, ind) => {
		console.log(`Starting t ${ind+1} / ${jobList.length}`);
		if(checkIfJobCompleted(job, completedJobs)) {
			
		} else {
			doJob(job);
			updateLog(job);
			console.log(`Finished t ${ind+1} / ${jobList.length}`);
		}
	})
}


// doJobs(jobList);

function getFileText(fileName) {
	let text = fs.readFileSync(`completedJobs/${fileName}`,'utf8');
	let completedJobs = text.split("\n").slice(0,-1);
	let objs = [];
	completedJobs.forEach( (job) => {
		objs.push(JSON.parse(job));
	});
	return objs;
}


getCompletedJobs();

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
		doJobs(completedJobs);
	});

}

// getFileText();