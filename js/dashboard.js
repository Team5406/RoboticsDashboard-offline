var eventKey = "2023nyrr";
var eventTimeZone = "America/Toronto"
var teams = ["5406", "9996"];
var matchData = Array();

$(function(){

    /*
    On load: Check if online - and pull TBA data
    Set Timer to check if online and update TBA data every 5 min
    Loop through TBA data - set each div id = team-match (5406-qm1)
    If data has been updated, update values

    Display connection status in corner
    WebSocket Connection for messaging


    */

    var lastMatch = 0;
    var totalMatches = 0;

    checkOnline();
    updateTBAData();
    setInterval(checkOnline, 30000); //every 30s
    setInterval(updateTBAData, 300000); //every 300s
    setInterval(updateTime, 1000); //every 1s


    $('#checkOnline').on('click', checkOnline);
    $('#getTBAData').on('click', getTBAData);
    
     
function updateTBAData(){
    if(checkOnline()){
        getTBAData();
    }
}

  function checkOnline(){
    var online = navigator.onLine; 
    if (online){
        $('#checkOnline').attr("src", "img/online.png");

    }else{
        $('#checkOnline').attr("src", "img/offline.png");
    }
    return online;
  }

  function updateTime(){
    var currentTime = new Date().toLocaleTimeString('en-US', {
        timeZone: eventTimeZone,
        hour12: true,
        hour: "numeric", 
        minute: "2-digit",
        second: "2-digit"
    });
    $("#currentTime").text("Time: " + currentTime);
  }


  
function getTBAData(){
      $.ajax({
          method: "GET",
          url: "https://www.thebluealliance.com/api/v3/event/"+eventKey,
          headers: {"X-TBA-Auth-Key": TBA_API_KEY}
      }).done(function(eventData){
          eventTimeZone = eventData.timeZone;
          getMatchData();
      });

  }
  

  function getMatchData(){
      var requests = Array();
teams.forEach(function(team){
    team = "frc" + team;
  requests.push($.ajax({
      method: "GET",
      url: "https://www.thebluealliance.com/api/v3/team/"+team+"/event/"+eventKey+"/matches",
      headers: {"X-TBA-Auth-Key": TBA_API_KEY}
  }))
});


var defer = $.when.apply($, requests);
defer.done(function(){

  // This is executed only after every ajax request has been completed
  if (requests.length == 1){
      // "arguments" will be the array of response information for the request

      arguments[0].forEach((element, i) => {  
         var teamNumber = teams[0];
          arguments[0][i]["team"] = teamNumber;
      }); 

      matchData = arguments[0];

  }else{
      $.each(arguments, function(index, responseData){

          responseData[0].forEach((element, i) => {  
                var teamNumber = teams[index];
                

              responseData[0][i]["team"] = teamNumber;
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
            //console.log(match);
            for (var i=0; i<match.alliances.blue.team_keys.length;i++){
                //console.log(match.alliances.blue.team_keys[i]);
                match.alliances.blue.team_keys[i] = match.alliances.blue.team_keys[i].substring(3);
            }
    
            for (var i=0; i<match.alliances.red.team_keys.length;i++){
                match.alliances.red.team_keys[i] = match.alliances.red.team_keys[i].substring(3);
            }

            
          
            var blue = match.alliances.blue.team_keys.includes(match.team);
            var allianceColour= (blue?"blue":"red")
            var comp_level = match.comp_level;
            var date = new Date(match.time * 1000);

            

            var matchPlayed =  ((match.score_breakdown && match.score_breakdown["red"] && match.score_breakdown["blue"]) ? match.score_breakdown["red"].totalPoints !=-1 && match.score_breakdown["blue"].totalPoints!=-1:false);

            simplifiedMatch = {
              team: match.team,
              alliance: allianceColour,
              alliances: {
                  blue: match.alliances.blue.team_keys,
                  red: match.alliances.red.team_keys,
              },
              played: matchPlayed,

              won: (match.winning_alliance==""?"":(allianceColour==match.winning_alliance)),
              rp: ((match.score_breakdown && match.score_breakdown[allianceColour]) ? match.score_breakdown[allianceColour].rp:""),
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

 // console.log(matchSchedule);
  var matchScheduleTemplate = $.templates("#matchScheduleTemplate");
  totalMatches = matchSchedule.length;
  for (var i=0; i<matchSchedule.length; i++){
    matchScheduleData = matchSchedule[i];
    if(matchScheduleData.played){
        lastMatch=i+1;
       // console.log(lastMatch);
    }
    var rowid = matchScheduleData.team + "-" +matchScheduleData.comp_level+matchScheduleData.match_number;
    matchScheduleData.rowid = rowid;
    //console.log(matchScheduleData)
    var matchScheduleTemplateHTML = matchScheduleTemplate.render(matchScheduleData);
    if($("#" + rowid).length){
        $("#" + rowid).replaceWith(matchScheduleTemplateHTML);
    }else{
        $('#matches').append(matchScheduleTemplateHTML);

    }
}
  updateMatches();
  var updateTime = new Date().toLocaleTimeString('en-US', {
    timeZone: eventTimeZone,
    hour12: true,
    hour: "numeric", 
    minute: "2-digit" 
});
  $("#lastTBAUpdate").text("Last updated at: " + updateTime);

  //console.log(matchSchedule);

})/*.fail(function(){
  alert("Fail");
});*/





    
    $('.team-schedule-text').blur(function(){
        $(this).removeClass("us-schedule");
        if($(this).val() == "5406"){
          $(this).addClass("us-schedule");
        }
      })
  
      function updateMatches(){
        lastMatch =0;
        $('.result-schedule-text').each(function(index, element){
          if($(this).val()){
            lastMatch = index+1;
          }
        })
        updateNext();
      }
  
      function updateTotalMatches(){
        totalMatches =0;
        $('.match-schedule-text').each(function(index, element){
          if($(this).val().trim()){
            totalMatches = index+1;
          }
        })
      }
  
      $('.match-schedule-text').blur(updateTotalMatches);
  
  
      function updateNext(){
        console.log(lastMatch);
          var nextMatch = lastMatch +1;
       // console.log(nextMatch);
  
          if(nextMatch <= totalMatches || lastMatch ==0){
  
            $('.time-next').show();
            $('.team-next').show();
            $('.vs-next').show();
  
            console.log(nextMatch);
            var nextMatchDiv = $('#matches .row:nth-child('+nextMatch+')');

            console.log(nextMatchDiv);
          $('#match-number').text($('.match-schedule-text', nextMatchDiv).val());
          $('.time-next').text("(est. " + $('.time-schedule-text', nextMatchDiv).val() +")");
  
        var colours = ["red", "blue"];
          colours.forEach(colour => {
            for (var i=1;i<=3;i++){
                $('#'+colour+i).removeClass("us-next");
                $('#'+colour+i).text($('.team-'+colour+i, nextMatchDiv).val());
                if(teams.indexOf($('.team-'+colour+i, nextMatchDiv).val()) != -1){
                  $('#'+colour+i).addClass("us-next");
                }
            }
          });
  
          }else{
            $('#match-number').text("Playoffs");
            $('.time-next').hide();
            $('.team-next').hide();
            $('.vs-next').hide();
          }
  
      }
      
      $('.rp-schedule-text').change(function(){
        updateMatches();
      })
  
      $('#match1').blur(function(){
        if(lastMatch ==0){
          $('#match-number').text($(this).val());
        }
      })
  
      $('#time1').blur(function(){
        if(lastMatch ==0){
          $('.time-next').text("(est. " + $(this).val() + ")");
        }
      })
  
      $('#team1_red1').blur(function(){
        if(lastMatch ==0){
          $('#red1').removeClass("us-next");
          $('#red1').text($(this).val());
          if($(this).val() == "5406"){
            $('#red1').addClass("us-next");
          }
        }
      })
  
      $('#team1_red2').blur(function(){
        if(lastMatch ==0){
          $('#red2').removeClass("us-next");
          $('#red2').text($(this).val());
          if($(this).val() == "5406"){
            $('#red2').addClass("us-next");
          }
        }
      })
  
      $('#team1_red3').blur(function(){
        if(lastMatch ==0){
          $('#red3').removeClass("us-next");
          $('#red3').text($(this).val());
          if($(this).val() == "5406"){
            $('#red3').addClass("us-next");
          }
        }
      })
  
      $('#team1_blue1').blur(function(){
        if(lastMatch ==0){
          $('#blue1').removeClass("us-next");
          $('#blue1').text($(this).val());
          if($(this).val() == "5406"){
            $('#blue1').addClass("us-next");
          }
        }
      })
  
      $('#team1_blue2').blur(function(){
        if(lastMatch ==0){
          $('#blue2').removeClass("us-next");
          $('#blue2').text($(this).val());
          if($(this).val() == "5406"){
            $('#blue2').addClass("us-next");
          }
        }
      })
  
      $('#team1_blue3').blur(function(){
        if(lastMatch ==0){
          $('#blue3').removeClass("us-next");
          $('#blue3').text($(this).val());
          if($(this).val() == "5406"){
            $('#blue3').addClass("us-next");
          }
        }
      })

     
    }
  
});