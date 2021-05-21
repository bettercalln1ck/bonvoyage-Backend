var express = require('express');
const bodyParser=require('body-parser');

var User=require('../models/user');
var Trips = require('../models/tripModel');

var tripsRouter = express.Router();
var passport=require('passport');
var authenticate=require('../authenticate');
var uniqueValidator = require('mongoose-unique-validator');
const axios = require('axios');
var moment = require('moment');
const { path } = require('../app');
var User = require('../models/user');

//const src = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+Sydney&key=${process.env.GoogleKey}`


tripsRouter.route('/')
.get(authenticate.verifyUser,(req, res, next)=> {
  src =`https://maps.googleapis.com/maps/api/place/textsearch/json?query=Jaipur&type=tourist_attraction&rankby=prominence&key=${process.env.GoogleKey}`
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
 src=`https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:ChIJlXJ26RuxbTkR0qsToxFP05c%7Cplace_id:ChIJ-w3Sy1qwbTkRK34UR2ffIWI%7Cplace_id:ChIJx0lfsbGxbTkRgVOhxJ7EGbw%7Cplace_id:ChIJwbAghgu0bTkRYHt9ATEVgEQ&destinations=place_id:ChIJlXJ26RuxbTkR0qsToxFP05c%7Cplace_id:ChIJ-w3Sy1qwbTkRK34UR2ffIWI%7Cplace_id:ChIJx0lfsbGxbTkRgVOhxJ7EGbw%7Cplace_id:ChIJwbAghgu0bTkRYHt9ATEVgEQ&departure_time=1618909200&key=${process.env.GoogleKey}`;

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


tripsRouter.route('/search')
.post(authenticate.verifyUser,async(req, res, next)=> {
  Trips.find({$text :{$search : req.body.search}},{"_id":1,"tripName":1,"date":1,"start":1,"end":1})
  .limit(100)
  .exec((error,data)=>{
    if(error){
      next(error);
    }
      res.send(data);
  })
});


tripsRouter.route('/makeTrip')
.post(authenticate.verifyUser,async(req, res, next)=> {
    startingTime = req.body.start
    var startDate = moment('01/01/1970 00:00:00', 'DD/MM/YYYY HH:mm:ss')
    var endDate = moment(req.body.date, 'DD/MM/YYYY HH:mm:ss')
    var secondsDiff = endDate.diff(startDate, 'seconds')
    var startTime =moment(req.body.start,'HH:mm:ss')
    req.body.start = startTime.hour()+ startTime.minute()/60;
    var endTime =moment(req.body.end,'HH:mm:ss')
    req.body.end = endTime.hour()+ endTime.minute()/60;

    req.body.admin = req.user._id;
    req.body.users = [req.user._id];

      await Trips.create((req.body))
      .then(async(trip) =>{
       // res.json(trip);
      //  return;
        origins = ""

              //create origins url that contain placeId's
              await Promise.all(
                trip.placeId.map(async (trp) =>{
                  origins += "place_id:"+trp+"%7C";
                })
              )

                //calculate distance matrix
                origins = origins.slice(0,-3);
                matrix=[]
                time = secondsDiff
                for( k = req.body.start ; k <= req.body.end; k++)
                {
                    
                src = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=`+origins+`&destinations=`+origins+`&departure_time=`+time.toString()+`&key=${process.env.GoogleKey}`;
                
                time+=3600
                console.log(src)
                rows = []
                await axios.get(src)
              .then(async (response) => {
              //  console.log(response.data.rows)
              console.log(src);
                  for(i=0;i<req.body.placeId.length;i++){
                    columns=[]
                    for(j=0;j<req.body.placeId.length;j++){
                      if(response.data.rows[i].elements[j].duration.value == 0){
                        await columns.push(0);
                      }else{
                      if(typeof response.data.rows[i].elements[j].duration_in_traffic === "undefined"){
                          await columns.push(85290);
                          console.log("hello");
                      }else{
                        await columns.push(response.data.rows[i].elements[j].duration_in_traffic.value/60/60);
                        }
                      }
                    }
              //      console.log(columns);
                  await  rows.push(columns);
                  }
              }).catch(error => {
                    console.log(error);
                    next(error);
                  });
              console.log(rows);
                await  matrix.push(rows);
                }

                openingTime = []
            //  calculate opening time
              dataX = []
              openingTime = []

                  await Promise.all( req.body.placeId.map( async (element) => {
                      src2 = `https://maps.googleapis.com/maps/api/place/details/json?placeid=` + element + `&fields=opening_hours&key=${process.env.GoogleKey}`
                      console.log(src2)
                      await axios.get(src2).then(async (resp) => {
                          if(Object.keys(resp.data.result).length === 0){
                            await openingTime.push([10,22])
                            return ;
                          }
                          if(!(resp.data.result.opening_hours == null)){
                    //        console.log(resp);
                  //  await console.log(startDate.day());
                              await dataX.push({opening_hours: resp.data.result.opening_hours.periods})
                              var open ;
                              if(Object.keys(resp.data.result.opening_hours.periods[startDate.day()]).length === 0){
                                open = 6;
                              }else{
                                open = resp.data.result.opening_hours.periods[startDate.day()].open.time;
                              open = (open/100 + (open%100)/60)
                              }
                              var close ;
                              if(Object.keys(resp.data.result.opening_hours.periods[startDate.day()]).length === 0){
                                close = 6;
                              }else{
                                close = resp.data.result.opening_hours.periods[startDate.day()].close.time
                              close = (close/100 + (close%100)/60)
                              }
                              await openingTime.push([open,close]);
                          }
                      }).catch(error => {
                          console.log(error);
                          return next(err); 
                      });

                })
                  )

              var peakTime = []
              

              for(i = 0 ;i<req.body.placeId.length ;i++){
                    var x = [0,0]
                    x[0] = (openingTime [i][0]+openingTime [i][1])/2 - 2
                    x[1] = (openingTime [i][0]+openingTime [i][1])/2 + 2
                    await peakTime.push(x)
                   // openingTime.push([6,20])
                }


            //calculate preferred time
            


            // for(var i in openingTime ){
            //     var x = [0,0]
            //     x[0] = (openingTime [i][0]+openingTime [i][1])/2 - 2
            //     x[1] = (openingTime [i][0]+openingTime [i][1])/2 + 2
            //     await peakTime.push(x)
            // }

            //calculate visiting time
            var visiting = []

            for(var i in openingTime ){
                x = 1 + (openingTime [i][1] - openingTime [i][0] - 6)/6
                if(x<1) x = 1
                if(x>3) x = 3
                await visiting.push(x)
            }


          //calculate scores of places
          placesScore = []
          placesInfo = []

          await Promise.all( req.body.placeId.map( async (element) => {
            src2 = `https://maps.googleapis.com/maps/api/place/details/json?place_id=`+element+`&fields=rating,user_ratings_total,formatted_address,name&key=${process.env.GoogleKey}`
            console.log(src2)
            await axios.get(src2).then(async (response) => {
              if(typeof response.data.result.rating === "undefined"){
                await placesScore.push(90000);
              }else{
                await placesScore.push(response.data.result.rating * response.data.result.user_ratings_total)
              }
                await placesInfo.push({"placeId":element,"placeName":response.data.result.name,"placeAddress":response.data.result.formatted_address});
            }).catch(error => {
                console.log(error);
                return next(err); 
            });

          })
          )





      let inputData = {
                start: req.body.start,
                end: req.body.end,
                temporalGraph: matrix ,
                score: placesScore,
                timeToVisit: visiting,
                preferedTime: peakTime,
                openTime: openingTime,
              };


    console.log(inputData)

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
          await queue.push({
            path: newPath2,
            timeTaken: newTimeTaken2,
            totalScore: current.totalScore,
          });

    }

   // res.json({"result" : finalPaths,"start":startingTime});

    await finalPaths.sort((a,b)=> {
      return b.score - a.score;}
      )

    //   res.json(finalPaths);

      console.log(finalPaths)
      var result =[];

      for( i=0;i<5;i++){
        var path= []
        for( j=0 ; j<finalPaths[i].path.length ;j++){
          
          if(finalPaths[i].path[j]==-1){
            await path.push({"placeId":"wait","placeName":"null","placeAddress":"null"});
          }else{
            await path.push(placesInfo[finalPaths[i].path[j]])
          }
        }
      await  result.push({
          "path":path,"score":finalPaths[i].score,"timeTaken":finalPaths[i].timeTaken
        })
      }

    //  await Trips.findByIdAndUpdate(trip._id ,
    //   { $set: { result: result} }, 
    //   { new: true })
    //   .then((trip) =>{
    //     res.json({"result" : result,"start":startingTime,"trip":trip});
    //   }) 
    trip.result = result;
    await trip.save((err,resp)=>{
      if(err){
        next(err);
      }
      res.json({"result" : result,"start":startingTime});
    })

      }, (err) => next(err))
        .catch((err) => next(err));

});

tripsRouter.route('/tripInfo/:tripId')
.options( (req, res) => { res.sendStatus(200); })
.get(async (req,res,next) => {
  Trips.findById(req.params.tripId,{placeId:1,tripName:1,start:1,end:1,data:1,result:1,users:1})
  .then((trip)=>{
    res.statusCode=200;
    res.setHeader('Content-Type', 'application/json');
      res.json({sucess:true,tripInfo:trip});
  }, (err) => next(err))
        .catch((err) => next(err));
});

tripsRouter.route('/joinTrip/:tripId')
.get(authenticate.verifyUser,(req,res,next) =>{
  Trips.findByIdAndUpdate(req.params.tripId,{
    $addToSet:{users:req.user._id}
  },{new:true})
  .then((trip) =>{
    User.findByIdAndUpdate(req.user._id,{
      $addToSet:{trips: req.params.tripId}},{new:true})
      .then((user) =>{
        res.json({success:true});
      })   
  }, (err) => next(err))
  .catch((err) => next(err));
})
.delete((req,res,next) =>{
  Trips.findByIdAndUpdate(req.params.tripId,{
    $pull:{users:req.user._id}
  },{new:true})
  .then((trip) =>{
    User.findByIdAndUpdate(req.user._id,{
      $pull:{trips: req.params.tripId}},{new:true})
      .then((user) =>{
        res.json({success:true});
      })   
  }, (err) => next(err))
  .catch((err) => next(err));
});

module.exports = tripsRouter;

