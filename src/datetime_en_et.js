const monthNamesET = ["jaanuar", "veebruar", "märts", "april", "mai", "juuni", "juuli", "august", "september", "oktoober", "novemeber", "detsember"];
const monthNamesEN = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


//Inglise kell ja kuu

const dateENformatted = function(){
	let timeNow = new Date();
	return monthNamesEN[timeNow.getMonth()] + " " + timeNow.getDate() + " " + timeNow.getFullYear();
}

const dateENformattedShort = function(){
	let timeNow = new Date();
	return (timeNow.getMonth() + 1) + "/" + timeNow.getDate() + "/" + timeNow.getFullYear();
}

const timeENformatted = function(){
	let timeNow = new Date();
	return timeNow.getHours() + ":" + timeNow.getMinutes() + ":" + timeNow.getSeconds();
}

//Eesti kell ja kuu

const dateETformatted = function(){
	let timeNow = new Date();
	return timeNow.getDate() + ". " + monthNamesET[timeNow.getMonth()] + " " + timeNow.getFullYear();
}

const timeETformatted = function(){
	let timeNow = new Date();
	let timeET = (timeNow.getHours()) + ":" + (timeNow.getMinutes()) + ":" + (timeNow.getSeconds());
	return timeET;
}

// SQL VORM

const dateSQLformatted = function(){
	let timeNow = new Date();
	return timeNow.getFullYear() + "-" + (timeNow.getMonth()+1) + "-" + timeNow.getDay();
}

const timeOfDayET = function(){
	let partOfDay = "suvaline hetk";
	let hourNow  = new Date().getHours();
	if(hourNow >= 6 && hourNow < 11){
		partOfDay = "hommik.";
	}
	if(hourNow >= 12 && hourNow < 14) {
		partOfDay = "keskpäev"
	}
	if(hourNow >= 14 && hourNow < 18){
		partOfDay = "pärastlõuna.";
	}
	if(hourNow >= 18){
		partOfDay = "õhtu.";
	}
	return partOfDay;
}

const formatChange = function(engFormatDate){
	let separated = [];
	separated = engFormatDate.split(".");
	let estDate = new Date();
	let day = separated[1];
	let month = separated[0];
	let year = separated[2];
	let estFormatDate = day + "." + month + "." + year;
	return estFormatDate;
}

//ekspordin all
module.exports = {dateETformatted: dateETformatted, timeETformatted: timeETformatted, timeOfDayET:timeOfDayET, monthsET:monthNamesET, dateENformatted:dateENformatted, timeENformatted:timeENformatted, dateENformattedShort:dateENformattedShort, monthsEN:monthNamesEN, dateSQLformatted: dateSQLformatted};
