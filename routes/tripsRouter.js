var express = require('express');
const bodyParser=require('body-parser');

var User=require('../models/user');
var Trips = require('../models/tripModel');

var tripsRouter = express.Router();
var passport=require('passport');
var authenticate=require('../authenticate');
var uniqueValidator = require('mongoose-unique-validator');
const axios = require('axios');
var moment = require('moment')

//const src = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+Sydney&key=${process.env.GoogleKey}`


tripsRouter.route('/')
.get(authenticate.verifyUser,(req, res, next)=> {
  src = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=Jaipur&type=tourist_attraction&rankby=prominence&key=AIzaSyArM7cAmAWdHA2I6iL0XLLo979LOyy-920"
  console.log(src)
axios.get(src)
  .then(response => {
    console.log(response.data);
    res.json(response.data);
  })
  .catch(error => {
    console.log(error);
  });

});

tripsRouter.route('/test')
.get(async (req,res,next) => {
 src="https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:ChIJlXJ26RuxbTkR0qsToxFP05c%7Cplace_id:ChIJ-w3Sy1qwbTkRK34UR2ffIWI%7Cplace_id:ChIJx0lfsbGxbTkRgVOhxJ7EGbw%7Cplace_id:ChIJwbAghgu0bTkRYHt9ATEVgEQ&destinations=place_id:ChIJlXJ26RuxbTkR0qsToxFP05c%7Cplace_id:ChIJ-w3Sy1qwbTkRK34UR2ffIWI%7Cplace_id:ChIJx0lfsbGxbTkRgVOhxJ7EGbw%7Cplace_id:ChIJwbAghgu0bTkRYHt9ATEVgEQ&departure_time=1618909200&key=AIzaSyArM7cAmAWdHA2I6iL0XLLo979LOyy-920"

  rows=[];
  size=4;

  await axios.get(src)
  .then(async (response) => {
 //   console.log(response.data.rows)

      for(i=0;i<4;i++){
        columns=[]
        for(j=0;j<4;j++){
          if(response.data.rows[i].elements[j].duration.value == 0){
            await columns.push(0);
          }else{
            await columns.push(response.data.rows[i].elements[j].duration_in_traffic.value);
          }
        }
  //      console.log(columns);
      await   rows.push(columns);
      }
  }).catch(error => {
         console.log(error);
         next(error);
       });

   await  res.json(rows);
})


tripsRouter.route('/makeTrip')
.post(authenticate.verifyUser,async(req, res, next)=> {

  var startDate = moment('01/01/1970 00:00:00', 'DD/MM/YYYY HH:mm:ss')
  var endDate = moment(req.body.date, 'DD/MM/YYYY HH:mm:ss')
  var secondsDiff = endDate.diff(startDate, 'seconds')

  Trips.create((req.body))
  .then(async(trip) =>{
    origins = ""

    await Promise.all(
      trip.placeId.map(async (trp) =>{
         origins += "place_id:"+trp+"%7C";
      })
    )


    origins = origins.slice(0,-3);
    matrix=[]
    console.log(origins)
    time=1618909200
    for( k = trip.start ; k <= trip.end ; k++)
    {
        
    src = "https://maps.googleapis.com/maps/api/distancematrix/json?origins="+origins+"&destinations="+origins+"&departure_time="+time.toString()+"&key=AIzaSyArM7cAmAWdHA2I6iL0XLLo979LOyy-920";
    time+=3600
    console.log(src)
    rows = []
    await axios.get(src)
  .then(async (response) => {
    console.log(response.data.rows)

      for(i=0;i<4;i++){
        columns=[]
        for(j=0;j<4;j++){
          if(response.data.rows[i].elements[j].duration.value == 0){
            await columns.push(0);
          }else{
            await columns.push(response.data.rows[i].elements[j].duration_in_traffic.value/60/60);
          }
        }
  //      console.log(columns);
      await  rows.push(columns);
      }
  }).catch(error => {
         console.log(error);
         next(error);
       });
     await  matrix.push(rows);
    }

        console.log(matrix);
    //   trip.temporalGraph = matrix;

   //await  res.json(matrix);

   // src = "https://maps.googleapis.com/maps/api/place/textsearch/json?query="+trip.cityName+"&type=tourist_attraction&rankby=prominence&key=AIzaSyArM7cAmAWdHA2I6iL0XLLo979LOyy-920"
    dataX = []


        await Promise.all( req.body.placeId.map( async (element) => {
            src2 = "https://maps.googleapis.com/maps/api/place/details/json?placeid=" + element + "&fields=opening_hours&key=AIzaSyArM7cAmAWdHA2I6iL0XLLo979LOyy-920"
            console.log(src2)
            await axios.get(src2).then(async (resp) => {
                if(!(resp.data.result.opening_hours == null)){
                  console.log(resp);
                    await dataX.push({place_id:element.place_id,  formatted_address: element.formatted_address, name:element.name, geometry: element.geometry, rating: element.rating, user_ratings_total: element.user_ratings_total, types: element.types ,  opening_hours: resp.data.result.opening_hours.periods})
                }
            }).catch(error => {
                console.log(error);
                return next(err); 
            });

       })
         )
         console.log(dataX)
     //  await res.status(200).json(dataX);

  // .catch(error => {
  //   console.log(error);
  //   return next(err); 

                let inputData = {
            start: req.body.start,
            end: req.body.end,
            temporalGraph: matrix ,
            score: [45, 86, 76 ,67],
            timeToVisit: [0, 0.1, 1.2,2],
            preferedTime: [
              [9, 10],
              [14, 15],
              [11, 15],
              [15 ,16]
            ],
            openTime: [
              [8, 18],
              [14, 20],
              [8, 21],
              [8,21]
            ],
          };
var uniqueNodes = [];
for (let i = 0; i < inputData.temporalGraph[0].length; i++) {
	await uniqueNodes.push(i);
}
var queue = [
	{
		path: ["0"],
		timeTaken: 0.0,
		totalScore: 0.0,
	},
];
const waitTime = 1;
let finalPaths = [];
while (queue.length !== 0) {
	// console.log("\nLoop Entered\n");
	var current = queue[queue.length - 1];
	 queue.pop();

	var lastLocation = current.path[current.path.length - 1];
	var tempo = 1;
	while (lastLocation == -1) {
		lastLocation = current.path[current.path.length - tempo];
		tempo++;
	}

	var timeLeft = inputData.end - inputData.start - current.timeTaken;

	if (timeLeft <= 0) {
		finalPaths.push({
			path: current.path,
			score: current.totalScore,
			timeTaken: current.timeTaken,
		});
		continue;
	}
	var flag = 1;
	for (var x in uniqueNodes) {
		if (!current.path.includes(x)) {
			var newPath = [...current.path];
			newPath.push(x);
			var newTimeTaken =
				current.timeTaken +
				inputData.temporalGraph[Math.floor(current.timeTaken)][
					lastLocation
				][x] +
				inputData.timeToVisit[x];
			//if condition for is x open at current Time
			if (
				inputData.start + newTimeTaken > inputData.openTime[x][1] ||
				inputData.start + newTimeTaken - inputData.timeToVisit[x] <
					inputData.openTime[x][0]
			) {
				continue;
			}
			var newScore = current.totalScore;
			if (
				inputData.openTime[x][0] <=
					newTimeTaken + inputData.start - inputData.timeToVisit[x] &&
				newTimeTaken + inputData.start - inputData.timeToVisit[x] <=
					(inputData.openTime[x][0] + inputData.openTime[x][1]) / 2
			) {
				// console.log("1:", 2*(newTimeTaken + inputData.start - inputData.timeToVisit[x]-inputData.openTime[x][0])/(inputData.openTime[x][1]-inputData.openTime[x][0]))
				newScore =
					newScore +
					inputData.score[x] *
						(1 +
							(2 *
								(newTimeTaken +
									inputData.start -
									inputData.timeToVisit[x] -
									inputData.openTime[x][0])) /
								(inputData.openTime[x][1] -
									inputData.openTime[x][0]));
			} else if (
				(inputData.openTime[x][0] + inputData.openTime[x][1]) / 2 <=
					newTimeTaken + inputData.start - inputData.timeToVisit[x] &&
				newTimeTaken + inputData.start - inputData.timeToVisit[x] <=
					inputData.openTime[x][1]
			) {
				// console.log("2:", 2*(inputData.openTime[x][1] - (newTimeTaken + inputData.start - inputData.timeToVisit[x]))/(inputData.openTime[x][1]-inputData.openTime[x][0]))
				newScore =
					newScore +
					inputData.score[x] *
						(1 +
							(2 *
								(inputData.openTime[x][1] -
									(newTimeTaken +
										inputData.start -
										inputData.timeToVisit[x]))) /
								(inputData.openTime[x][1] -
									inputData.openTime[x][0]));
			} else {
				newScore = newScore + inputData.score[x];
			}
			// if (
			// 	inputData.start + newTimeTaken < inputData.preferedTime[x][1] &&
			// 	inputData.start + newTimeTaken - inputData.timeToVisit[x] >
			// 		inputData.preferedTime[x][0]
			// ) {
			// 	newScore = newScore + inputData.score[x] * 2; //to be changed
			// } else {
			// 	newScore = newScore + inputData.score[x];
			// }
			flag = 0;
			queue.push({
				path: newPath,
				timeTaken: newTimeTaken,
				totalScore: newScore,
			});
		}
	}
	//one more possibility where he waits instead of moving somewhere
	var newPath2 = [...current.path];
	newPath2.push("-1");
	var newTimeTaken2 = current.timeTaken + waitTime;
	if (newTimeTaken2 + inputData.start >= inputData.end) {
		finalPaths.push({
			path: current.path,
			score: current.totalScore,
			timeTaken: current.timeTaken,
		});
		continue;
	}
      queue.push({
        path: newPath2,
        timeTaken: newTimeTaken2,
        totalScore: current.totalScore,
      });

}

    res.json(finalPaths);


   }, (err) => next(err))
     .catch((err) => next(err));

});


// tripsRouter.route('/addPlaces')
// .route(authenticate.verify,(req,res,next) =>{

// })

module.exports = tripsRouter;

