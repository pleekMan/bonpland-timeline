

function parseDB(database) {

	var jsonEvents = [];

	var perLine = database.split('\n');

	perLine.forEach(element => {
		var eventFields = element.split('\t');
		// console.log(perField);

		// DATE SETUP - BEGIN
		var startDate = new Date();
		var endDate = new Date();

		var startDateFormatted = formatDate(eventFields[2]);
		startDate.setFullYear(startDateFormatted[2]);
		startDate.setMonth(startDateFormatted[1]);
		startDate.setDate(startDateFormatted[0]);
		startDate.setTime
		// console.log(startDate);

		// IF IT HAS AN END DATE
		if (eventFields[3] != "") {
			var endDateFormatted = formatDate(eventFields[3]);
			endDate.setFullYear(endDateFormatted[2]);
			endDate.setMonth(endDateFormatted[1]);
			endDate.setDate(endDateFormatted[0]);
			// console.log(endDate);
		} else {
			endDate = startDate;
		}

		// DATE SETUP - END

		var event = {
			"id": eventFields[0],
			"title": eventFields[0],
			"dates": {
				"start": Date.parse(startDate), //IN ABSOLUTE TIME
				"startDisplay": startDate, // IN GREGORIAN TIME
				"end": Date.parse(endDate),
				"endDisplay": endDate,
			},
			"description": eventFields[1],
			"type": "type",
			"tags": [
				eventFields[5]
			]
		}

		jsonEvents.push(event);

	});

	return jsonEvents;
}

function formatDate(dateIn) {
	// expected input format => "d-m-yyyy" (Jan = 1)
	// WHERE "0" IN DATABASE MEANS NO VALUES. THIS, WE CONVERT TO 1st DAY OR 1st MONTH

	var finalDate = [];

	var fields = dateIn.split("-");

	finalDate.push(fields[0] == "0" ? "1" : fields[0]); // DAY

	if (fields[1] != "0") {
		// MONTHS (JANUARY = 0 for Date Objects)
		finalDate.push((parseInt(fields[1]) - 1) + "");
	} else {
		finalDate.push("0");
	}
	finalDate.push(fields[2]);

	//console.log(finalDate[2] + "-" + finalDate[1] + "-" + finalDate[0]);

	return finalDate;//[2] + "-" + finalDate[1] + "-" + finalDate[0];
}