
module.exports=function(app, database, passport, XMLHttpRequest,rp,puppeteer,fs,mysql1,jsreport,chromepdf){
    app.get('/', function(req, res){
        res.render('login.ejs',{message:req.flash('loginMessage')});});
        
    app.post('/', passport.authenticate('local-login',{
        successRedirect: '/profile',
        failureRedirect: '/',
        failureFlash: true}),
        function (req, res){
        if(req.body.remember){
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        }else{
            req.session.cookie.expires = false;}
        res.redirect('/');});
        
    app.get('/profile', isLoggedIn, function(req, res){
        res.render('profile.ejs',{
            user:req.user});});

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect})
        
        
        
    
//setting fares and traffic
app.get('/appfares',isLoggedIn,function(request,response){
   var appRef=database.ref('Fares')
   appRef.once('value',function(snapshot){
      if(snapshot.val()){
          response.render('Fares/appfares.ejs',{fareobject:snapshot.val()})
         }else{
         response.render('Fares/appfares.ejs',{fareobject:snapshot.val()})}})})


app.get('/payRider/:id/',isLoggedIn,function(request,response){ 
  var id = request.params.id;
     var bodabodaRef=database.ref('Users').child('BodaBodaAgents').child(id)
     bodabodaRef.once('value',function(snapshot){
      if(snapshot.val()){
          response.render('payments/bodapayment.ejs',{riderobject:snapshot.val(),id:id})
         }else{
         response.render('payments/bodapayment.ejs',{riderobject:snapshot.val(),id:id})}})
})


app.get('/payDriver/:id/',isLoggedIn,function(request,response){ 
  var id = request.params.id;
     var bodabodaRef=database.ref('Users').child('Drivers').child(id)
     bodabodaRef.once('value',function(snapshot){
      if(snapshot.val()){
          response.render('payments/driverpayment.ejs',{riderobject:snapshot.val(),id:id})
         }else{
         response.render('payments/driverpayment.ejs',{riderobject:snapshot.val(),id:id})}})
})

//this handles the submission of payment form
app.post('/payRiders',isLoggedIn,function(request,response){ 
    var amount=request.body.amount
    var id=request.body.id
    
    //database ref
    var bodabodaRef=database.ref('Users').child('BodaBodaAgents').child(id)
    
          //updating the rider wallet in firebase
       bodabodaRef.once('value',function(snapshot){
           var object=snapshot.val()
           var currentwallet=object.walletBalance
           var name=object.userName
           var phone=object.phone
           var helmentNo=object.helMentNo
           //getting the new balance
           var newBalance=currentwallet-amount
           //console.log(newBalance)
  
           bodabodaRef.update({walletBalance:newBalance})
           .then(function(){
                  // response.redirect('/dashboard-home?message=' + encodeURIComponent('sucessfull payment'))
                  
                  //get mysql connection to record the transaction
                   var con = mysql1.createConnection({
                    host:"localhost",
                    user:"canoninn_mobile",
                    password:"mediat*45TYZ",
                    database:"canoninn_mobile_money_API"
                    });
                  
                        
                   con.query("INSERT INTO `bodaPayments`( `name`, `phone`, `helment Number`, `amount`) VALUES (?,?,?,?)",[name,phone,helmentNo,amount],function(error,rows,fields){
                        if(!!error){
                            response.redirect('/dashboard-home?message=' + encodeURIComponent('failed record'))
                       }else{
                        //generating a receipt of receival
                        response.render('bodaPaymentReceipt.ejs',{receipt:object,amount:amount})
                      
                       }
                   })
                   
           }).catch(function(){
                response.redirect('/dashboard-home?message=' + encodeURIComponent('failed payment'))}) })})
                
 //Payments made to Taxi Drivers               
 app.get('/driverPayments',isLoggedIn,function(request,response){
      var con = mysql1.createConnection({
    host:"localhost",
    user:"canoninn_mobile",
    password:"mediat*45TYZ",
    database:"canoninn_mobile_money_API"
    });
        con.connect(function (err) {
        if (err){
        response.print( err);
        } 
        console.log("Connected");
        var sql = "SELECT * FROM driverPayments";
        con.query(sql, function (err, rows,fields) {
            if (err) {
                response.render("failed");
            } else {
                obj = rows;
                response.render('driverPayments.ejs',{obj:obj});
            }
        });
    });})               

//Payments made to boda boda riders 
 app.get('/bodaPayments',isLoggedIn,function(request,response){
      var con = mysql1.createConnection({
    host:"localhost",
    user:"canoninn_mobile",
    password:"mediat*45TYZ",
    database:"canoninn_mobile_money_API"
    });
        con.connect(function (err) {
        if (err){
        response.print( err);
        }
        console.log("Connected");
        var sql = "SELECT * FROM bodaPayments";
        con.query(sql, function (err, rows,fields) {
            if (err) {
                response.render("failed");
            } else {
                obj = rows;
                response.render('bodaPayments.ejs',{obj:obj});
            }
        });
    });
     
     })

//this handles the submission of payment form
app.post('/payDrivers',isLoggedIn,function(request,response){ 
    var amount=request.body.amount
    var id=request.body.id
    
    //database ref
    var bodabodaRef=database.ref('Users').child('Drivers').child(id)
    
          //updating the rider wallet in firebase
       bodabodaRef.once('value',function(snapshot){
           var object=snapshot.val()
           var currentwallet=object.walletBalance
           var name=object.userName
           var phone=object.phone
           var numberPlate=object.numberPlate
           //getting the new balance
           var newBalance=currentwallet-amount
           //console.log(newBalance)
  
           bodabodaRef.update({walletBalance:newBalance})
           .then(function(){
                  // response.redirect('/dashboard-home?message=' + encodeURIComponent('sucessfull payment'))
                  
                  //get mysql connection to record the transaction
                   var con = mysql1.createConnection({
                        host:"localhost",
                        user:"canoninn_mobile",
                        password:"mediat*45TYZ",
                        database:"canoninn_mobile_money_API"
                        });
                        
                   con.query("INSERT INTO `driverPayments`( `name`, `phone`, `numberPlate`, `amount`) VALUES (?,?,?,?)",[name,phone,numberPlate,amount],function(error,rows,fields){
                        if(!!error){
                            response.redirect('/taxi?message=' + encodeURIComponent('failed record'))
                       }else{
                        //generating a receipt of receival
                        response.render('taxiPaymentReceipt.ejs',{receipt:object,amount:amount})
                      
                       }
                   })
                   
           }).catch(function(){
                response.redirect('/taxi?message=' + encodeURIComponent('failed payment'))

           })
      })
         
})

    

app.get('/dashboard-home',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('BodaBodaAgents')
    bodabodaRef.once('value',function(snapshot){
        var availableobjects = snapshot.val();
        var keys=Object.keys(availableobjects);
        var size=keys.length;
        console.log(size);
        response.render('Bodaboda/dashboard-home.ejs',{bodabodas:snapshot.val(),size:size})})});

//getting online bodabodas without clients
app.get('/bodasonline',isLoggedIn,function(request,response){
    var bodabodaavailableRef=database.ref('bodaBodasAvailable')
    bodabodaavailableRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var onlineobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects available')
            //getting keys
            var  keys=Object.keys(onlineobjects)
            var size=keys.length
            response.render('Bodaboda/bodasonline.ejs',{onlinebodas:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No riders online'
            response.render('Bodaboda/bodasonline.ejs',{onlinebodas:0,size:0})}})})

//getting working boda bodas with clients
app.get('/bodasworking',isLoggedIn,function(request,response){
    var bodabodaworkingRef=database.ref('bodaBodasWorking');
    bodabodaworkingRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var workingobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects working')
            //getting keys
            var  keys=Object.keys(workingobjects)
            console.log(snapshot.val())
            var size=keys.length
            response.render('Bodaboda/bodasworking.ejs',{workingbodas:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No riders working'
            response.render('Bodaboda/bodasworking.ejs',{workingbodas:0,size:0})}})})

app.get('/allBodaTrips',isLoggedIn,function(request,response){
    var bodabodatripRef=database.ref('bodabodahistory')
    bodabodatripRef.once('value',function(snapshot){
        //console.log(snapshot.val())
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('Bodaboda/allBodaTrips.ejs',{allbodatrips:snapshot.val(),size:size})
        }else
        {
            response.render('Bodaboda/allBodaTrips.ejs',{allbodatrips:0,size:0})}})})
            
//view single rider Trips
app.get('/viewSingleRiderTrips/:id/',isLoggedIn,function(request,response){
    var id = request.params.id;
    var bodabodatripRef=database.ref('Users').child('BodaBodaAgents').child(id).child('bodabodahistory')
    //console.log(id)
    bodabodatripRef.once('value',function(snapshot){
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects);
            var size=keys.length;
            response.render('Bodaboda/viewSingleRiderTrips.ejs',{historyobjects:snapshot.val(),size:size})
        }else{
            response.render('Bodaboda/viewSingleRiderTrips.ejs',{historyobjects:0,size:0})}})})

app.get('/customers',isLoggedIn,function(request,response){
    var customersRef=database.ref('Users').child('Customers')
    customersRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('customers.ejs',{customers:snapshot.val(),size:size})
        }else{
            response.render('customers.ejs',{customers:0,size:0})}})});


app.get('/incomingBodaRequests',isLoggedIn,function(request,response){
    var requestRef=database.ref('BodabodacustomerRequest')
    requestRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Bodaboda/incomingBodaRequests.ejs',{bodarequests:snapshot.val(),size:size})
        }else{
            response.render('Bodaboda/incomingBodaRequests.ejs',{bodarequests:0,size:0})}})});
//DRIVER PANEL
///the taxi interface

app.get('/taxi',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('Drivers')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Taxi/taxi.ejs',{drivers:snapshot.val(),size:size})
        }else{
            response.render('Taxi/taxi.ejs',{drivers:0,size:0})}})});

//getting online drivers without clients
app.get('/driversonline',isLoggedIn,function(request,response){
    var bodabodaavailableRef=database.ref('driversAvailable');
    bodabodaavailableRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var onlineobjects=snapshot.val();
        if(snapshot.val()){
            console.log('objects available');
            //getting keys
            var  keys=Object.keys(onlineobjects);
            var size=keys.length;
            response.render('Taxi/driversonline.ejs',{onlinedrivers:snapshot.val(),size:size})
        }else{
            console.log('objects not available');
            var message='No riders online';
            response.render('Taxi/driversonline.ejs',{onlinedrivers:0,size:0})}})});

////getting working drivers with clients
app.get('/driversworking',isLoggedIn,function(request,response){
    var bodabodaworkingRef=database.ref('driversWorking');
    bodabodaworkingRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var workingobjects=snapshot.val();
        if(snapshot.val()){
            console.log('objects working');
            //getting keys
            var  keys=Object.keys(workingobjects);
            console.log(snapshot.val());
            var size=keys.length;
            response.render('Taxi/driversworking.ejs',{workingdrivers:snapshot.val(),size:size})
        }else{
            console.log('Taxi/objects not available');
            var message='No drivers working';
            response.render('Taxi/driversworking.ejs',{workingdrivers:0,size:0})}})});

//viewing all the Driver trips
app.get('/allDriverTrips',isLoggedIn,function(request,response){
    var bodabodatripRef=database.ref('taxihistory')
    bodabodatripRef.once('value',function(snapshot){
        //console.log(snapshot.val())
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('Taxi/allDriverTrips.ejs',{alldrivertrips:snapshot.val(),size:size})
        }else{
            response.render('Taxi/allDriverTrips.ejs',{alldrivertrips:0,size:0})}})});

//view single driver trips
app.get('/viewSingleDriverTrips/:id/',isLoggedIn,function(request,response){
    var id = request.params.id;
    var bodabodatripRef=database.ref('Users').child('Drivers').child(id).child('taxihistory')
    //console.log(id)
    bodabodatripRef.once('value',function(snapshot){
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects);
            var size=keys.length;
            response.render('Taxi/viewSingleDriverTrips.ejs',{historyobjects:snapshot.val(),size:size})
        }else{
            response.render('Taxi/viewSingleDriverTrips.ejs',{historyobjects:0,size:0})}})});

//view all the incoming boda boda customers requests.
app.get('/incomingDriverRequests',isLoggedIn,function(request,response){
    var requestRef=database.ref('TaxicustomerRequest');
    requestRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects);
            var size=keys.length;
            console.log(size);
            response.render('Taxi/incomingDriverRequests.ejs',{driverrequests:snapshot.val(),size:size})
        }else{
            response.render('Taxi/incomingDriverRequests.ejs',{driverrequests:0,size:0})}})});

//DELIVERY AGENT MODULE
///getting all the delivery agents
app.get('/delivery',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('DeliveryAgents')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Delivery/delivery.ejs',{deliveryagents:snapshot.val(),size:size})
        }else{
            response.render('Delivery/delivery.ejs',{deliveryagents:0,size:0}) }})})

//getting online delivery agents without clients
app.get('/deliveryagentsonline',isLoggedIn,function(request,response){
    var bodabodaavailableRef=database.ref('deliveryAgentsAvailable')
    bodabodaavailableRef.once('value',function(snapshot){
        var name = snapshot.val()
        //console.log(name)
        var onlineobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects available')
            //getting keys
            var  keys=Object.keys(onlineobjects)
            var size=keys.length
            response.render('Delivery/deliveryagentsonline.ejs',{onlinedeliveryagents:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No agents online'
            response.render('Delivery/deliveryagentsonline.ejs',{onlinedeliveryagents:0,size:0})}})})

////getting working drivers with clients
app.get('/deliveryagentsworking',isLoggedIn,function(request,response){
    var bodabodaworkingRef=database.ref('deliveryAgentsWorking')
    bodabodaworkingRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var workingobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects working')
            //getting keys
            var  keys=Object.keys(workingobjects)
            console.log(snapshot.val())
            var size=keys.length
            response.render('Delivery/deliveryAgentsworking.ejs',{workingdeliveryAgents:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No agentss working'
            response.render('Delivery/deliveryAgentsworking.ejs',{workingdeliveryAgents:0,size:0})}})})

//viewing all the Driver trips
app.get('/allDeliveryTrips',isLoggedIn,function(request,response){
    var bodabodatripRef=database.ref('deliveryhistory')
    bodabodatripRef.once('value',function(snapshot){
        //console.log(snapshot.val())
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('Delivery/allDeliverytrips.ejs',{alldeliverytrips:snapshot.val(),size:size})
        }else{
            response.render('Delivery/allDeliverytrips.ejs',{alldeliverytrips:0,size:0})}})});

//view single delivery Trips
app.get('/viewSingleDeliveryTrips/:id/',isLoggedIn,function(request,response){
    var id = request.params.id
    var bodabodatripRef=database.ref('Users').child('DeliveryAgents').child(id).child('deliveryhistory')
    //console.log(id)
    bodabodatripRef.once('value',function(snapshot){
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('Delivery/viewSingleDeliveryTrips.ejs',{historyobjects:snapshot.val(),size:size})
        }else{
            response.render('Delivery/viewSingleDeliveryTrips.ejs',{historyobjects:0,size:0})}})});

//incoming delivery requests
app.get('/incomingDeliveryRequests',isLoggedIn,function(request,response){
    var requestRef=database.ref('deliverycustomerRequest')
    requestRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Delivery/incomingDeliveryRequests.ejs',{deliveryrequests:snapshot.val(),size:size})
        }else{
            response.render('Delivery/incomingDeliveryRequests.ejs',{deliveryrequests:0,size:0})}})})

//CAR RENTAL MODULE
///getting all the delivery agents
app.get('/carrental',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('CarRentalAgents')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('CarRental/carrental.ejs',{carrentalagents:snapshot.val(),size:size})
        }else{
            response.render('CarRental/carrental.ejs',{carrentalagents:0,size:0})}})})
//getting carrental agents online
app.get('/carrentalAgentsonline',isLoggedIn,function(request,response){
    var bodabodaavailableRef=database.ref('carRentalAgentsAvailable')
    bodabodaavailableRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var onlineobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects available')
            //getting keys
            var  keys=Object.keys(onlineobjects)
            var size=keys.length
            response.render('CarRental/carrentalagentsonline.ejs',{onlinecarrentalagents:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No agents online'
            response.render('CarRental/carrentalagentsonline.ejs',{onlinecarrentalagents:0,size:0})}})})

//view carrental agents working
app.get('/carrentalAgentsworking',isLoggedIn,function(request,response){
    var bodabodaworkingRef=database.ref('carRentalAgentsWorking')
    bodabodaworkingRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var workingobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects working')
            //getting keys
            var  keys=Object.keys(workingobjects)
            console.log(snapshot.val())
            var size=keys.length
            response.render('CarRental/carrentalAgentsworking.ejs',{workingcarrentalAgents:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No agents working'
            response.render('CarRental/carrentalAgentsworking.ejs',{workingcarrentalAgents:0,size:0})}})})

//view all the carrental agents service history
app.get('/allcarrentalServiceHistory',isLoggedIn,function(request,response){
    var bodabodatripRef=database.ref('carrentalhistory')
    bodabodatripRef.once('value',function(snapshot){
        //console.log(snapshot.val())
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('CarRental/allCarRentalServices.ejs',{allcarrentalservices:snapshot.val(),size:size})
        }else{
            response.render('CarRental/allCarRentalServices.ejs',{allcarrentalservices:0,size:0})}})})

//view single carrental agent service history
app.get('/viewSingleCarRentaAgentServiceHistory/:id/',isLoggedIn,function(request,response){
    var id = request.params.id
    var bodabodatripRef=database.ref('Users').child('CarRentalAgents').child(id).child('carrentalhistory')
    //console.log(id)
    bodabodatripRef.once('value',function(snapshot){
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('CarRental/viewSingleCarRentalAgentServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
        }else{
            response.render('CarRental/viewSingleCarRentalAgentServiceHistory.ejs',{historyobjects:0,size:0})}})})

//view the incoming carrental requests
app.get('/incomingcarrentalRequests',isLoggedIn,function(request,response){
    var requestRef=database.ref('carRentalcustomerRequest')
    requestRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('CarRental/incomingCarRentalRequests.ejs',{carrentalrequests:snapshot.val(),size:size})
        }else{
            response.render('CarRental/incomingCarRentalRequests.ejs',{carrentalrequests:0,size:0})}})})

//CLEANING AGENTS MODULE
//getting all the cleaning agents
app.get('/cleaning',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('CleaningAgents')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Cleaners/cleaning.ejs',{cleaningagents:snapshot.val(),size:size})
        }else{
            response.render('Cleaners/cleaning.ejs',{cleaningagents:0,size:0})}})});
            
//get the cleaning agents online
app.get('/cleaningAgentsonline',isLoggedIn,function(request,response){
    var bodabodaavailableRef=database.ref('cleaningAgentsAvailable')
    bodabodaavailableRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var onlineobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects available')
            //getting keys
            var  keys=Object.keys(onlineobjects)
            var size=keys.length
            response.render('Cleaners/cleaningAgentsonline.ejs',{onlinecleaningagents:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No agents online'
            response.render('Cleaners/cleaningAgentsonline.ejs',{onlinecleaningagents:0,size:0})}})});

//view cleaning agents working
app.get('/cleaningAgentsworking',isLoggedIn,function(request,response){
    var bodabodaworkingRef=database.ref('cleaningAgentsWorking')
    bodabodaworkingRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var workingobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects working')
            //getting keys
            var  keys=Object.keys(workingobjects)
            console.log(snapshot.val())
            var size=keys.length
            response.render('Cleaners/cleaningAgentsworking.ejs',{workingcleaningAgents:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No agents working'
            response.render('Cleaners/cleaningAgentsworking.ejs',{workingcleaningAgents:0,size:0})}})});

//view all the cleaning service history
app.get('/allcleaningServiceHistory',isLoggedIn,function(request,response){
    var bodabodatripRef=database.ref('cleaninghistory')
    bodabodatripRef.once('value',function(snapshot){
        //console.log(snapshot.val())
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('Cleaners/allCleaningServices.ejs',{allcleaningservices:snapshot.val(),size:size})
        }else{
            response.render('Cleaners/allCleaningServices.ejs',{allcleaningservices:0,size:0}) }})});

//view single cleaning agent service history
app.get('/viewSingleCleaningAgentServiceHistory/:id/',isLoggedIn,function(request,response){
    var id = request.params.id
    var bodabodatripRef=database.ref('Users').child('CleaningAgents').child(id).child('cleaninghistory')
    //console.log(id)
    bodabodatripRef.once('value',function(snapshot){
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('Cleaners/viewSingleCleaningAgentServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
        }else{
            response.render('Cleaners/viewSingleCleaningAgentServiceHistory.ejs',{historyobjects:0,size:0})}})})

//view incoming cleaning requests
app.get('/incomingcleaningRequests',isLoggedIn,function(request,response){
    var requestRef=database.ref('cleaningcustomerRequest')
    requestRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Cleaners/incomingcleaningRequests.ejs',{cleaningrequests:snapshot.val(),size:size})
        }else{
            response.render('Cleaners/incomingcleaningRequests.ejs',{cleaningrequests:0,size:0})}})})
            
//DOCTORS MODULE
//getting all the doctors on the app
app.get('/doctors',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('Doctors')
    bodabodaRef.once('value',function(snapshot){

        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)

            var size=keys.length

            console.log(size)
            response.render('Doctors/doctors.ejs',{doctors:snapshot.val(),size:size})
        }else{
            response.render('Doctors/doctors.ejs',{doctors:0,size:0})}})})
            
//view the doctors online
app.get('/doctorsonline',isLoggedIn,function(request,response){
    var bodabodaavailableRef=database.ref('DoctorsAvailable')
    bodabodaavailableRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var onlineobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects available')
            //getting keys
            var  keys=Object.keys(onlineobjects)
            var size=keys.length
            response.render('Doctors/doctorsonline.ejs',{onlinedoctors:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No agents online'
            response.render('Doctors/doctorsonline.ejs',{onlinedoctors:0,size:0})}})})
        
//view all the doctors working
app.get('/doctorsworking',isLoggedIn,function(request,response){
    var bodabodaworkingRef=database.ref('DoctorsWorking')
    bodabodaworkingRef.once('value',function(snapshot){
        var name = snapshot.val();
        var workingobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects working')
            //getting keys
            var  keys=Object.keys(workingobjects)
            console.log(snapshot.val())
            var size=keys.length
            response.render('Doctors/doctorsworking.ejs',{workingdoctors:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No agents working'
            response.render('Doctors/doctorsworking.ejs',{workingdoctors:0,size:0})}})})

//all doctor service history
app.get('/alldoctorsServiceHistory',isLoggedIn,function(request,response){
    var bodabodatripRef=database.ref('doctorhistory')
    bodabodatripRef.once('value',function(snapshot){
        //console.log(snapshot.val())
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('Doctors/allDoctorServices.ejs',{alldoctorservices:snapshot.val(),size:size})
        }else{
            response.render('Doctors/allDoctorServices.ejs',{alldoctorservices:0,size:0})}})})
        
//view single doctor history        
app.get('/viewSingleDoctorServiceHistory/:id/',isLoggedIn,function(request,response){
    var id = request.params.id
    var bodabodatripRef=database.ref('Users').child('Doctors').child(id).child('doctorhistory')
    //console.log(id)
    bodabodatripRef.once('value',function(snapshot){
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('Doctors/viewSingleDoctorServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
        }else{
            response.render('Doctors/viewSingleDoctorServiceHistory.ejs',{historyobjects:0,size:0})}})})

//incoming doctor requests
app.get('/incomingdoctorRequests',isLoggedIn,function(request,response){
    var requestRef=database.ref('doctorcustomerRequest')
    requestRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Doctors/incomingdoctorRequests.ejs',{doctorrequests:snapshot.val(),size:size})
        }else{
            response.render('Doctors/incomingdoctorRequests.ejs',{doctorrequests:0,size:0})}})})

//ELECTRICIAN MODULE
//electricians online
app.get('/electriciansonline',isLoggedIn,function(request,response){
    var bodabodaavailableRef=database.ref('electriciansAvailable')
    bodabodaavailableRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var onlineobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects available')
            //getting keys
            var  keys=Object.keys(onlineobjects)
            var size=keys.length
            response.render('Electricians/electriciansonline.ejs',{onlineelectricians:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No agents online'
            response.render('Electricians/electriciansonline.ejs',{onlineelectricians:0,size:0})}})})

//electricians working
app.get('/electriciansworking',isLoggedIn,function(request,response){
    var bodabodaworkingRef=database.ref('electriciansWorking')
    bodabodaworkingRef.once('value',function(snapshot){
        var name = snapshot.val();
        //console.log(name)
        var workingobjects=snapshot.val()
        if(snapshot.val()){
            console.log('objects working')
            //getting keys
            var  keys=Object.keys(workingobjects)
            console.log(snapshot.val())
            var size=keys.length
            response.render('Electricians/electriciansworking.ejs',{workingelectricians:snapshot.val(),size:size})
        }else{
            console.log('objects not available')
            var message='No agents working'
            response.render('Electricians/electriciansworking.ejs',{workingelectricians:0,size:0})}})})

//all electrician service history
app.get('/allelectricianServiceHistory',isLoggedIn,function(request,response){
    var bodabodatripRef=database.ref('electricianhistory')
    bodabodatripRef.once('value',function(snapshot){
        //console.log(snapshot.val())
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('Electricians/allelectricianServices.ejs',{allelectricianServices:snapshot.val(),size:size})
        }else{
            response.render('Electricians/allelectricianServices.ejs',{allelectricianServices:0,size:0})}})})

//view single electrician service history
app.get('/viewSingleElectricianServiceHistory/:id/',isLoggedIn,function(request,response){
    var id = request.params.id
    var bodabodatripRef=database.ref('Users').child('Electricians').child(id).child('electricianhistory')
    //console.log(id)
    bodabodatripRef.once('value',function(snapshot){
        if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length
            response.render('Electricians/viewSingleElectricianServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
        }else{
            response.render('Electricians/viewSingleElectricianServiceHistory.ejs',{historyobjects:0,size:0})}})})

//incoming electrician requests
app.get('/incomingElectriciansRequests',isLoggedIn,function(request,response){
    var requestRef=database.ref('electriciancustomerRequest')
    requestRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Electricians/incomingelectricianRequests.ejs',{electricianrequests:snapshot.val(),size:size})
        }else{
            response.render('Electricians/incomingelectricianRequests.ejs',{electricianrequests:0,size:0})}})})

//getting all the electricians on the app
app.get('/electricians',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('Electricians')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Electricians/electricians.ejs',{electricians:snapshot.val(),size:size})
        }
        else{
            response.render('Electricians/electricians.ejs',{electricians:0,size:0})}})})

//FUMIGATION MODULE
//getting all fumigation agents
app.get('/fumigation',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('FumigationAgents')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Fumigation/fumigation.ejs',{fumigationagents:snapshot.val(),size:size})
        }else{
            response.render('Fumigation/fumigation.ejs',{fumigationagents:0,size:0})}})})

//getting all the fumigation agents online
app.get('/fumigationAgentsonline',isLoggedIn,function(request,response){  
    var bodabodaavailableRef=database.ref('fumigationAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)
                var size=keys.length
                response.render('Fumigation/FumigationAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Fumigation/FumigationAgentsonline.ejs',{agents:0,size:0})}})})
            
//getting all the fumigation agents working
app.get('/fumigationAgentsworking',isLoggedIn,function(request,response){  
var bodabodaworkingRef=database.ref('fumigationAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Fumigation/FumigationAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Fumigation/FumigationAgentsworking.ejs',{agents:0,size:0})}})})
            
//getting all the incoming requests for fumigation agents 
app.get('/fumigationincomingRequests',isLoggedIn,function(request,response){
        var bodabodaworkingRef=database.ref('fumigationcustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Fumigation/incomingfumigationRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Fumigation/incomingfumigationRequests.ejs',{requests:0,size:0})}})})
            
//getting all fumigation agent history 
app.get('/fumigationallAgentsServiceHistory',isLoggedIn,function(request,response){
        var bodabodatripRef=database.ref('fumigationhistory')
        bodabodatripRef.once('value',function(snapshot){

            //console.log(snapshot.val())
            if(snapshot.val()){
                var  tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var  size=keys.length
                response.render('Fumigation/allfumigationServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Fumigation/allfumigationServices.ejs',{services:0,size:0})}})})            
  
   
   
   
   
   
   
   
   
   
   
   
   
   
   
    


//all other agents online
app.get('/Agentsonline/:service/',function(request,response){

    var service = request.params.service

    if(service=='fumigation'){
        var bodabodaavailableRef=database.ref('fumigationAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('Fumigation/FumigationAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Fumigation/FumigationAgentsonline.ejs',{agents:0,size:0})
            }
        })
    }else if(service=='gasrefill'){
        var bodabodaavailableRef=database.ref('gasAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('Gas/GasAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Gas/GasAgentsonline.ejs',{agents:0,size:0})
            }
        })


    }else if(service=='massage'){
        var bodabodaavailableRef=database.ref('massageAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('MassageAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('MassageAgentsonline.ejs',{agents:0,size:0})
            }
        })
    }
})

//all other agents working
app.get('/Agentsworking/:service/',isLoggedIn,function(request,response){
    var service = request.params.service
    if(service=='fumigation'){
        var bodabodaworkingRef=database.ref('fumigationAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Fumigation/FumigationAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Fumigation/FumigationAgentsworking.ejs',{agents:0,size:0})
            }
        })

    }else if(service=='gasrefill'){
        var bodabodaworkingRef=database.ref('gasAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Gas/GasAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Gas/GasAgentsworking.ejs',{agents:0,size:0})
            }
        })

    }else if(service=='massage'){
        var bodabodaworkingRef=database.ref('massageAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('MassageAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('MassageAgentsworking.ejs',{agents:0,size:0})
            }
        })
    }
})

//all other agents service history
app.get('/allAgentsServiceHistory/:service/',isLoggedIn,function(request,response){
    var service = request.params.service
    if(service=='fumigation'){
        var bodabodatripRef=database.ref('fumigationhistory')
        bodabodatripRef.once('value',function(snapshot){

            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length

                response.render('Fumigation/allfumigationServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Fumigation/allfumigationServices.ejs',{services:0,size:0})
            }
        })
    }else if(service=='gasrefill'){
        var bodabodatripRef=database.ref('gasrefillhistory')
        bodabodatripRef.once('value',function(snapshot){

            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length

                response.render('Gas/allgasServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Gas/allgasServices.ejs',{services:0,size:0})
            }
        })
    }
})

//view ALL other agents single service history
app.get('/viewSingleAgentServiceHistory/:id/:service/',function(request,response){
    var id = request.params.id
    var service=request.params.service

    if(service=='fumigation'){
        var bodabodatripRef=database.ref('Users').child('FumigationAgents').child(id).child('fumigationhistory')
        //console.log(id)
        bodabodatripRef.once('value',function(snapshot){
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Fumigation/viewSingleFumigationServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
            }else{
                response.render('Fumigation/viewSingleFumigationServiceHistory.ejs',{historyobjects:0,size:0})
            }
        })
    }else if(service=='gasrefill'){
        var bodabodatripRef=database.ref('Users').child('GasAgents').child(id).child('gasrefillhistory')
        //console.log(id)
        bodabodatripRef.once('value',function(snapshot){
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Gas/viewSingleGasServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
            }else{
                response.render('Gas/viewSingleGasServiceHistory.ejs',{historyobjects:0,size:0})
            }
        })
    }
})

//GAS REFILL MODULE
//getting all the gas agents
app.get('/gasrefill',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('GasAgents')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Gas/gasrefill.ejs',{gasagents:snapshot.val(),size:size})
        }else{
            response.render('Gas/gasrefill.ejs',{gasagents:0,size:0})
        }
    })
})

//getting all the gas agents and manage them
app.get('/gasrefill',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('GasAgents')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Gas/gasrefill.ejs',{gasagents:snapshot.val(),size:size})
        }else{
            response.render('Gas/gasrefill.ejs',{gasagents:0,size:0})
        }
    })
})

//getting all the gas agents online
app.get('/gasAgentsonline',isLoggedIn,function(request,response){
        var bodabodaavailableRef=database.ref('gasAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('Gas/GasAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Gas/GasAgentsonline.ejs',{agents:0,size:0})}})})

//getting all the gas agents working
app.get('/gasAgentsworking',isLoggedIn,function(request,response){
        var bodabodaworkingRef=database.ref('gasAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Gas/GasAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Gas/GasAgentsworking.ejs',{agents:0,size:0})
            }})})

//getting all the gas agents incoming requests
app.get('/gasincomingRequests',isLoggedIn,function(request,response){
        var bodabodaworkingRef=database.ref('gascustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Gas/incominggasRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Gas/incominggasRequests.ejs',{requests:0,size:0})
            }
        })
})

//getting all the gas agents History
app.get('/gasallAgentsServiceHistory',isLoggedIn,function(request,response){
        var bodabodatripRef=database.ref('gasrefillhistory')
        bodabodatripRef.once('value',function(snapshot){
            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Gas/allgasServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Gas/allgasServices.ejs',{services:0,size:0})
            }})})



//view all incoming requests
app.get('/incomingRequests/:service/',function(request,response){
    var service = request.params.service
    if(service=='fumigation'){
        var bodabodaworkingRef=database.ref('fumigationcustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Fumigation/incomingfumigationRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Fumigation/incomingfumigationRequests.ejs',{requests:0,size:0})
            }
        })
    }else if(service=='gasrefill'){
        var bodabodaworkingRef=database.ref('gascustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Gas/incominggasRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Gas/incominggasRequests.ejs',{requests:0,size:0})
            }
        })

    }
})

//MASSAGE AGENT

//getting all the massage agents
app.get('/massage',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('MassageAgents')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Massage/massage.ejs',{agents:snapshot.val(),size:size})
        }else{
            response.render('Massage/massage.ejs',{agents:0,size:0})
        }
    })
})

//getting all the massage agents online
app.get('/massageAgentsonline',isLoggedIn,function(request,response){
        var bodabodaavailableRef=database.ref('massageAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)
                var size=keys.length
                response.render('Massage/MassageAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Massage/MassageAgentsonline.ejs',{agents:0,size:0})
            }
        })
})

//getting all the massage agents working
app.get('/massageAgentsworking',isLoggedIn,function(request,response){
        var bodabodaworkingRef=database.ref('massageAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Massage/MassageAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Massage/MassageAgentsworking.ejs',{agents:0,size:0})
            }
        })

})

//getting all incoming requests for massage agents
app.get('/massageincomingRequests',isLoggedIn,function(request,response){
        var bodabodaworkingRef=database.ref('massagecustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Massage/incomingmassageRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Massage/incomingmassageRequests.ejs',{requests:0,size:0})
            }})})
//getting all the massage agents history
app.get('/massageallAgentsServiceHistory',isLoggedIn,function(request,response){
        var bodabodatripRef=database.ref('massagehistory')
        bodabodatripRef.once('value',function(snapshot){
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length

                response.render('Massage/allmassageServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Massage/allmassageServices.ejs',{services:0,size:0})
            }
        })})            

//view all salon agents
app.get('/salon',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('SalonAgents')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Salon/salon.ejs',{agents:snapshot.val(),size:size})
        }else{
            response.render('Salon/salon.ejs',{agents:0,size:0})
        }
    })
})

//view all salon agents history
app.get('/salonallAgentsServiceHistory',isLoggedIn,function(request,response){
        var bodabodatripRef=database.ref('salonhistory')
        bodabodatripRef.once('value',function(snapshot){

            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Salon/allsalonServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Salon/allsalonServices.ejs',{services:0,size:0})
            }
        })

})


//view all salon agents incoming requests
app.get('/salonincomingRequests',isLoggedIn,function(request,response){
        var bodabodaworkingRef=database.ref('saloncustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Salon/incomingsalonRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Salon/incomingsalonRequests.ejs',{requests:0,size:0})
            }
        })
})

//view all salon agents online
app.get('/salonAgentsonline',isLoggedIn,function(request,response){
        var bodabodaavailableRef=database.ref('salonAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)
                var size=keys.length
                response.render('Salon/SalonAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Salon/SalonAgentsonline.ejs',{agents:0,size:0})
            }
        })
})

//view all salon agents working
app.get('/salonAgentsworking',isLoggedIn,function(request,response){
        var bodabodaworkingRef=database.ref('salonAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Salon/SalonAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Salon/SalonAgentsworking.ejs',{agents:0,size:0})
            }
        })
})




//view all the mechanics
app.get('/mechanics',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('Mechanics')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Mechanic/mechanics.ejs',{agents:snapshot.val(),size:size})
        }else{
            response.render('Mechanic/mechanics.ejs',{agents:0,size:0})
        }
    })
})

//view all the mechanics online
app.get('/mechanicsAgentsonline',isLoggedIn,function(request,response){
        var bodabodaavailableRef=database.ref('salonAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('Salon/SalonAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Salon/SalonAgentsonline.ejs',{agents:0,size:0})
            }
        })
})
//view all the mechanics working
app.get('/mechanicsAgentsworking',isLoggedIn,function(request,response){
        var bodabodaworkingRef=database.ref('mechanicsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Mechanic/Mechanicsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Mechanic/Mechanicsworking.ejs',{agents:0,size:0})
            }
        })
})

//view all the mechanics trip history
app.get('/allmechanicServices',isLoggedIn,function(request,response){
         var bodabodatripRef=database.ref('mechanichistory')
         bodabodatripRef.once('value',function(snapshot){
         
         //console.log(snapshot.val())
         if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length

            response.render('Mechanic/allmechanicServices.ejs',{services:snapshot.val(),size:size})
         }else{
            response.render('Mechanic/allmechanicServices.ejs',{services:0,size:0})
         }
         })
})

app.get('/mechanicsincomingRequests',isLoggedIn,function(request,response){
  var bodabodaworkingRef=database.ref('mechaniccustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Mechanic/incomingmechanicRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Mechanic/incomingmechanicRequests.ejs',{requests:0,size:0})
            }
        })})

//getting all plumbing agents
app.get('/plumbing',isLoggedIn,function(request,response){
    var bodabodaRef=database.ref('Users').child('PlumbingAgents')
    bodabodaRef.once('value',function(snapshot){
        if(snapshot.val()){
            var availableobjects = snapshot.val();
            var  keys=Object.keys(availableobjects)
            var size=keys.length
            console.log(size)
            response.render('Plumbing/plumbing.ejs',{agents:snapshot.val(),size:size})
        }else{
            response.render('Plumbing/plumbing.ejs',{agents:0,size:0})
        }
    })
})

//getting all plumbing agents online
app.get('/plumbingAgentsonline',isLoggedIn,function(request,response){
    var bodabodaavailableRef=database.ref('plumbingAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('Plumbing/PlumbingAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Plumbing/PlumbingAgentsonline.ejs',{agents:0,size:0})
            }
        })
})



//getting all plumbing agents working
app.get('/plumbingAgentsworking',isLoggedIn,function(request,response){
        var bodabodaworkingRef=database.ref('plumbingAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Plumbing/PlumbingAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Plumbing/PlumbingAgentsworking.ejs',{agents:0,size:0})
            }
        })
})

//getting all plumbing agents incoming requests
app.get('/plumbingincomingRequests',isLoggedIn,function(request,response){
        var bodabodaworkingRef=database.ref('plumbingcustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Plumbing/incomingplumberRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Plumbing/incomingplumberRequests.ejs',{requests:0,size:0})
            }
        })
})

//getting all plumbing agents history
app.get('/plumbingallAgentsServiceHistory',isLoggedIn,function(request,response){
       var bodabodatripRef=database.ref('plumbinghistory')
         bodabodatripRef.once('value',function(snapshot){
         
         //console.log(snapshot.val())
         if(snapshot.val()){
            var tripobjects = snapshot.val();
            var  keys=Object.keys(tripobjects)
            var size=keys.length

            response.render('Plumbing/allplumberServices.ejs',{services:snapshot.val(),size:size})
         }else{
            response.render('Plumbing/allplumberServices.ejs',{services:0,size:0})
         }
         })
})

//getting single plumbing agent history
app.get('/viewSinglePlumbingServiceHistory',isLoggedIn,function(request,response){
        var bodabodatripRef=database.ref('plumbinghistory')
        bodabodatripRef.once('value',function(snapshot){
            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Plumbing/viewSinglePlumbingServiceHistory.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Plumbing/viewSinglePlumbingServiceHistory.ejs',{services:0,size:0})
            }
        })

})

//ALL OTHER AGENTS WORKING
app.get('/Agentsworking/:service/',isLoggedIn,function(request,response){

    var service = request.params.service
    if(service=='fumigation'){
        var bodabodaworkingRef=database.ref('fumigationAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Fumigation/FumigationAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Fumigation/FumigationAgentsworking.ejs',{agents:0,size:0})
            }
        })

    }else if(service=='gasrefill'){
        var bodabodaworkingRef=database.ref('gasAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Gas/GasAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Gas/GasAgentsworking.ejs',{agents:0,size:0})
            }
        })

    }else if(service=='massage'){
        var bodabodaworkingRef=database.ref('massageAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Massage/MassageAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Massage/MassageAgentsworking.ejs',{agents:0,size:0})
            }
        })

    }else if(service=='plumbing'){
        var bodabodaworkingRef=database.ref('plumbingAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Plumbing/PlumbingAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Plumbing/PlumbingAgentsworking.ejs',{agents:0,size:0})
            }
        })

    }else if(service=='salon'){
        var bodabodaworkingRef=database.ref('salonAgentsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Salon/SalonAgentsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Salon/SalonAgentsworking.ejs',{agents:0,size:0})
            }
        })
    }else if(service=='mechanic'){
        var bodabodaworkingRef=database.ref('mechanicsWorking')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Mechanic/Mechanicsworking.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Mechanic/Mechanicsworking.ejs',{agents:0,size:0})
            }
        })

    }
})


//ALL OTHER AGENTS ONLINE
app.get('/Agentsonline/:service/',isLoggedIn,function(request,response){
    var service = request.params.service
    if(service=='fumigation'){
        var bodabodaavailableRef=database.ref('fumigationAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)
                var size=keys.length
                response.render('Fumigation/FumigationAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Fumigation/FumigationAgentsonline.ejs',{agents:0,size:0})
            }
        })
    }else if(service=='gasrefill'){
        var bodabodaavailableRef=database.ref('gasAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('Gas/GasAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Gas/GasAgentsonline.ejs',{agents:0,size:0})
            }
        })


    }else if(service=='massage'){
        var bodabodaavailableRef=database.ref('massageAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('Massage/MassageAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Massage/MassageAgentsonline.ejs',{agents:0,size:0})
            }
        })


    }else if(service=='plumbing'){
        var bodabodaavailableRef=database.ref('plumbingAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('Plumbing/PlumbingAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Plumbing/PlumbingAgentsonline.ejs',{agents:0,size:0})
            }
        })

    }else if(service=='salon'){
        var bodabodaavailableRef=database.ref('salonAgentsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('Salon/SalonAgentsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Salon/SalonAgentsonline.ejs',{agents:0,size:0})
            }
        })

    }else if(service=='mechanic'){
        var bodabodaavailableRef=database.ref('mechanicsAvailable')
        bodabodaavailableRef.once('value',function(snapshot){
            var name = snapshot.val();
            //console.log(name)
            var onlineobjects=snapshot.val()
            if(snapshot.val()){
                console.log('objects available')
                //getting keys
                var  keys=Object.keys(onlineobjects)

                var size=keys.length

                response.render('Mechanic/Mechanicsonline.ejs',{agents:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents online'
                response.render('Mechanic/Mechanicsonline.ejs',{agents:0,size:0})
            }
        })
    }
})

//ALL OTHER AGENTS SERVICE HISTORY
app.get('/allAgentsServiceHistory/:service/',isLoggedIn,function(request,response){
    var service = request.params.service
    if(service=='fumigation'){
        var bodabodatripRef=database.ref('fumigationhistory')
        bodabodatripRef.once('value',function(snapshot){

            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length

                response.render('Fumigation/allfumigationServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Fumigation/allfumigationServices.ejs',{services:0,size:0})
            }
        })
    }else if(service=='gasrefill'){
        var bodabodatripRef=database.ref('gasrefillhistory')
        bodabodatripRef.once('value',function(snapshot){

            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length

                response.render('Gas/allgasServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Gas/allgasServices.ejs',{services:0,size:0})
            }
        })
    }else if(service=='massage'){
        var bodabodatripRef=database.ref('massagehistory')
        bodabodatripRef.once('value',function(snapshot){

            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length

                response.render('Massage/allmassageServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Massage/allmassageServices.ejs',{services:0,size:0})
            }
        })
    }else if(service=='plumbing'){
        var bodabodatripRef=database.ref('plumbinghistory')
        bodabodatripRef.once('value',function(snapshot){

            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length

                response.render('Plumbing/allplumberServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Plumbing/allplumberServices.ejs',{services:0,size:0})
            }
        })

    }else if(service=='salon'){
        var bodabodatripRef=database.ref('salonhistory')
        bodabodatripRef.once('value',function(snapshot){

            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Salon/allsalonServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Salon/allsalonServices.ejs',{services:0,size:0})
            }
        })

    }else if(service=='mechanic'){
        var bodabodatripRef=database.ref('mechanichistory')
        bodabodatripRef.once('value',function(snapshot){

            //console.log(snapshot.val())
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length

                response.render('Mechanic/allmechanicServices.ejs',{services:snapshot.val(),size:size})
            }else{
                response.render('Mechanic/allmechanicServices.ejs',{services:0,size:0})
            }
        })

    }

})

//This is going to query for customers payments
app.get('/customerTopUps',isLoggedIn,function(request,response){

    var Url="http://mobilemoneyapi.canoninnovationsltd.com/allcustomerTopUps.php"

    var xmlHttp = new XMLHttpRequest()
    xmlHttp.open( "GET", Url, false ) // false for synchronous request
    xmlHttp.send( null )
    var transactionsobject=xmlHttp.responseText

    var customerTransactionobj = JSON.parse(transactionsobject);

    if(customerTransactionobj){
        var  keys=Object.keys(customerTransactionobj)
        var size=keys.length

        console.log(size)

        response.render('customerTopUps.ejs',{customerTransactions:customerTransactionobj,size:size})

    }else{
        response.render('customerTopUps.ejs',{customerTransactions:0,size:0})
    }

})


//view ALL other agents single service history
app.get('/viewSingleAgentServiceHistory/:id/:service/',isLoggedIn,function(request,response){
    var id = request.params.id
    var service=request.params.service

    if(service=='fumigation'){
        var bodabodatripRef=database.ref('Users').child('FumigationAgents').child(id).child('fumigationhistory')
        //console.log(id)
        bodabodatripRef.once('value',function(snapshot){
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Fumigation/viewSingleFumigationServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
            }else{
                response.render('Fumigation/viewSingleFumigationServiceHistory.ejs',{historyobjects:0,size:0})
            }
        })


    }else if(service=='gasrefill'){
        var bodabodatripRef=database.ref('Users').child('GasAgents').child(id).child('gasrefillhistory')
        //console.log(id)
        bodabodatripRef.once('value',function(snapshot){
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Gas/viewSingleGasServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
            }else{
                response.render('Gas/viewSingleGasServiceHistory.ejs',{historyobjects:0,size:0})
            }
        })

    }else if(service=='massage'){
        var bodabodatripRef=database.ref('Users').child('MassageAgents').child(id).child('massagehistory')
        //console.log(id)
        bodabodatripRef.once('value',function(snapshot){
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Massage/viewSingleMassageServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
            }else{
                response.render('Message/viewSingleMassageServiceHistory.ejs',{historyobjects:0,size:0})
            }
        })
    }else if(service=='plumbing'){
        var bodabodatripRef=database.ref('Users').child('PlumbingAgents').child(id).child('plumbinghistory')
        //console.log(id)
        bodabodatripRef.once('value',function(snapshot){
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Plumbing/viewSinglePlumbingServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
            }else{
                response.render('PlumbingviewSinglePlumbingServiceHistory.ejs',{historyobjects:0,size:0})
            }
        })

    }else if(service=='salon'){
        var bodabodatripRef=database.ref('Users').child('SalonAgents').child(id).child('salonhistory')
        //console.log(id)
        bodabodatripRef.once('value',function(snapshot){
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Salon/viewSingleSalonServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
            }else{
                response.render('Salon/viewSingleSalonServiceHistory.ejs',{historyobjects:0,size:0})
            }
        })
    }else if(service=='mechanic'){
        var bodabodatripRef=database.ref('Users').child('Mechanics').child(id).child('mechanichistory')
        //console.log(id)
        bodabodatripRef.once('value',function(snapshot){
            if(snapshot.val()){
                var tripobjects = snapshot.val();
                var  keys=Object.keys(tripobjects)
                var size=keys.length
                response.render('Mechanic/viewSingleMechanicServiceHistory.ejs',{historyobjects:snapshot.val(),size:size})
            }else{
                response.render('Mechanic/viewSingleMechanicServiceHistory.ejs',{historyobjects:0,size:0})
            }
        })
    }
})

//incoming electrician requests

//view all incoming requests
app.get('/incomingRequests/:service/',isLoggedIn,function(request,response){
    var service = request.params.service
    if(service=='fumigation'){
        var bodabodaworkingRef=database.ref('fumigationcustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Fumigation/incomingfumigationRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Fumigation/incomingfumigationRequests.ejs',{requests:0,size:0})
            }
        })
    }else if(service=='gasrefill'){
        var bodabodaworkingRef=database.ref('gascustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Gas/incominggasRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Gas/incominggasRequests.ejs',{requests:0,size:0})
            }
        })

    }else if(service=='massage'){
        var bodabodaworkingRef=database.ref('massagecustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Massage/incomingmassageRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Massage/incomingmassageRequests.ejs',{requests:0,size:0})
            }
        })


    }else if(service=='plumbing'){
        var bodabodaworkingRef=database.ref('plumbingcustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Plumbing/incomingplumberRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Plumbing/incomingplumberRequests.ejs',{requests:0,size:0})
            }
        })

    }else if(service=='salon'){
        var bodabodaworkingRef=database.ref('saloncustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Salon/incomingsalonRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Salon/incomingsalonRequests.ejs',{requests:0,size:0})
            }
        })

    }else if(service=='mechanic'){
        var bodabodaworkingRef=database.ref('mechaniccustomerRequest')
        bodabodaworkingRef.once('value',function(snapshot){
            var name = snapshot.val();
            var workingobjects=snapshot.val()
            if(snapshot.val()){
                var  keys=Object.keys(workingobjects)
                console.log(snapshot.val())
                var size=keys.length
                response.render('Mechanic/incomingmechanicRequests.ejs',{requests:snapshot.val(),size:size})
            }else{
                console.log('objects not available')
                var message='No agents working'
                response.render('Mechanic/incomingmechanicRequests.ejs',{requests:0,size:0})
            }
        })

    }
})
};


function isLoggedIn(req, res, next){
   // var msg = "Must be signed in first to access this page.";
    if(!req.isAuthenticated()){
        res.redirect('/');
    }else {
        return next(); }}




