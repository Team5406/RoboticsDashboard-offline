var fs = require('fs');
var eventKey = "2023oncne";
var eventTimeZone = "America/Toronto"
var teams = ["frc5406", "frc9991"];
$(function(){
    $( "#checkOnline" ).on( "click", function() {
          var online = navigator.onLine;  
          alert(online); 
    });


    
    $( "#getTBAData" ).on( "click", function() {

        $.ajax({
            method: "GET",
            url: "https://www.thebluealliance.com/api/v3/event/"+eventKey,
            headers: {"X-TBA-Auth-Key": TBA_API_KEY}
        }).done(function(eventData){
            eventTimeZone = eventData.timeZone;
            getMatchData();
        });


         
    });
    

    function getMatchData(){
        var requests = Array();
teams.forEach(function(team){
    requests.push($.ajax({
        method: "GET",
        url: "https://www.thebluealliance.com/api/v3/team/"+team+"/event/"+eventKey+"/matches",
        headers: {"X-TBA-Auth-Key": TBA_API_KEY}
    }))
});


var defer = $.when.apply($, requests);
var matchData = Array();
defer.done(function(){

    // This is executed only after every ajax request has been completed
    if (requests.length == 1){
        // "arguments" will be the array of response information for the request

        arguments[0].forEach((element, i) => {  
            arguments[0][i]["team"] = teams[0];
        }); 

        matchData = arguments[0];

    }else{
        $.each(arguments, function(index, responseData){

            responseData[0].forEach((element, i) => {  
                responseData[0][i]["team"] = teams[index];
            }); 

            matchData = matchData.concat(responseData[0]);

        });
    }

    console.log(matchData);

    var numMatches =1000; //don't have total number of matches, since only getting matches for team
  
    var matches = _.chain(matchData) 
    .sortBy(function(match){
        if(match.comp_level=="qm"){
          return match.match_number
        }else if(match.comp_level=="sf"){
          return numMatches + match.set_number
        }else if(match.comp_level=="f"){
          return numMatches*2 + match.match_number
        }else{
          return numMatches*3;
        }
    })
    .map(function(match){
            
              var blue = match.alliances.blue.team_keys.includes(match.team);
              var allianceColour= (blue?"blue":"red")
              var comp_level = match.comp_level;
              var date = new Date(match.time * 1000);

              

              
              simplifiedMatch = {
                team: match.team,
                alliance: allianceColour,
                alliances: {
                    blue: match.alliances.blue.team_keys,
                    red: match.alliances.red.team_keys,
                },
                won: (allianceColour==match.winning_alliance),
                rp: match.score_breakdown[allianceColour].rp,
                comp_level: match.comp_level,
                match_number: (comp_level=="sf"?match.set_number:match.match_number),
                time: date.toLocaleTimeString('en-US', {
                    timeZone: eventTimeZone,
                    hour12: true,
                    hour: "numeric", 
                    minute: "2-digit" 
                })
              };
              return simplifiedMatch;
              
            });
            

    matchSchedule = matches.value();
  
    console.log(matchSchedule);

}).fail(function(){
    alert("Fail");
  });
    }
  
});