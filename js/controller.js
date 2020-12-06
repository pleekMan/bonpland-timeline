console.log("--- CONTROLLER LOADED");

var eventData = events;
var timelineWidth = 600;

setup();

function setup(){
	
	$("#timelineContainer").css("width", timelineWidth+"px");

	buildEvents(eventData);

}


function buildEvents(eventData) {

	// GETTING MODEL HTML-DOM FOR AN EVENT
	var eventModelElement = $("#timelineContainer").children(".timeEvent").first();

	var newEvents = [];

	for (let i = 0; i < 2; i++) {

		var newEvent = eventModelElement.clone();

		newEvent.find(".ev-title").text(eventData[i].title);
		newEvent.find(".ev-description").text(eventData[i].description);

		var posInTimeline = timelineWidth * (eventData[i].dates.start / 100);
		newEvent.css("left", posInTimeline + "px");

		var sizeInTimeline = timelineWidth * ((eventData[i].dates.end - eventData[i].dates.start) / 100);
		newEvent.find(".ev-timeIndicator").css("width", sizeInTimeline+"px");

		newEvents.push(newEvent[0]); // GET THE DOM OBJECT WRAPPED BY THE JQUERY OBJECT
	}

	console.log(newEvents);

	$("#timelineContainer").append(newEvents);

	// REMOVE MODEL
	eventModelElement.remove();
	// eventModelElement.css("display", "none");

}