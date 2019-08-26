var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var morgan = require('morgan');
var port = process.env.PORT || 3030;
var passport = require('passport');
var flash = require('connect-flash');
app.set('views',__dirname+'/views/');
require('./config/passport')(passport);
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('view engine','ejs')

//being sorting
var logger=require('morgan')
var admin=require('firebase-admin')
var path = require('path');
var serviceAccount=require('./canon-serviceKey.json')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var rp = require('request-promise');


//the pdf printing library
const puppeteer=require('puppeteer')
const fs=require('fs-extra')
var mysql1=require('mysql')
const jsreport = require('jsreport');



var firebaseAdmin=admin.initializeApp({
    credential:admin.credential.cert(serviceAccount),
    databaseURL: "https://canon-4f6d8.firebaseio.com"
});
///database reference
var database=firebaseAdmin.database();
app.use(express.static(path.join(__dirname, '/views/')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(session({
    secret: 'justasecret',
    resave:true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
require('./app/routes.js')(app,database, passport,XMLHttpRequest,rp,puppeteer,fs,mysql1,jsreport);
app.listen(port);
console.log('Port being used: '+ port);


app.get('/routerClientPrivacyPolicy',function(request,response){
   response.render('routerclientprivacypolicy.ejs')
    
})

app.get('/routerserviceproviderpolicy',function(request,response){
   response.render('routerserviceproviderpolicy.ejs')
    
})




app.post('/updateMobileMoneyTransaction/',function(request,response){
    
    
   var tran_type=request.body.tran_type
   var transaction_id=request.body.transaction_id
   var status=request.body.message
   
   //creating mysql connection
   var mysql = require('mysql');

        var con = mysql.createConnection({
        host:"localhost",
        user:"canoninn_mobile",
        password:"mediat*45TYZ",
        database:"canoninn_mobile_money_API"
        });
        
       
        //this updates the status of the collections using transaction id and in the else it updates the status of a withdraw
        if(tran_type=="1"){
            con.query("UPDATE Transactions SET transaction_status=? WHERE transaction_id=?",[status,transaction_id],function(error,rows,fields){
           if(!!error){
              response.json('Error in the transaction update query');
           }else{
               //update the firebase database from here(clients account wallet)
                    if(status=="SUCCESS"){
                        var sql="SELECT * FROM Transactions WHERE transaction_id=?"
                        con.query(sql,[transaction_id],function(error,row,fields){
                            if(!!error){
                                 var feedback={"transaction_id":transaction_id,"message":"failed update"}
                                 response.json(feedback);
                            }else{
                                
                                //get the remark
                                var remark=row[0].remark
                                
                                //get the amount
                                var amount=Number(row[0].amount)
                                
                                //get the customer id
                                var customerID=row[0].customer_id
                                
                                //get the reflection status
                                var reflectionStatus=row[0].reflected_status
                                
                                
                                if(reflectionStatus!="Reflected"){
                                //get customer reference according to the specified remark
                                if(remark=="clientWallet"){
                                    var customerRef=database.ref('Users').child('Customers').child(customerID)
                        
                                }else if(remark=="Boda Boda"){
                                            var customerRef=database.ref('Users').child('BodaBodaAgents').child(customerID)
                        
                                       
                                }else if(remark=="Taxi"){
                                            var customerRef=database.ref('Users').child('Drivers').child(customerID)
                        
                                   
                        
                                }else if(remark=="Delivery"){
                                            var customerRef=database.ref('Users').child('DeliveryAgents').child(customerID)
                        
                                 
                        
                                }else if(remark=="Car Rental"){
                                            var customerRef=database.ref('Users').child('CarRentalAgents').child(customerID)
                        
                                   
                        
                                }else if(remark=="Plumbing"){
                                           var customerRef=database.ref('Users').child('PlumbingAgents').child(customerID)
                        
                        
                                }else if(remark=="Massage"){
                                            var customerRef=database.ref('Users').child('MassageAgents').child(customerID)
                        
                                   
                        
                                }else if(remark=="Electrician"){
                                            var customerRef=database.ref('Users').child('Electricians').child(customerID)
                        
                                   
                                }else if(remark=="Fumigation"){
                                            var customerRef=database.ref('Users').child('FumigationAgents').child(customerID)
                        
                                  
                        
                                }else if(remark=="Cleaning"){
                                            var customerRef=database.ref('Users').child('CleaningAgents').child(customerID)
                        
                                   
                        
                                }else if(remark=="Salon"){
                                            var customerRef=database.ref('Users').child('SalonAgents').child(customerID)
                        
                                   
                        
                                }else if(remark=="Doctor"){
                                            var customerRef=database.ref('Users').child('Doctors').child(customerID)
                        
                                  
                        
                                }else if(remark=="Gas Refill"){
                                            var customerRef=database.ref('Users').child('GasAgents').child(customerID)
                        
                                   
                        
                                }else if(remark=="Mechanic"){
                                            var customerRef=database.ref('Users').child('Mechanics').child(customerID)
                        
                                }
                                
                                
                                     //updating the client database
                                customerRef.once('value',function(snapshot){
                                var balanceObject=snapshot.val()
                                const currentWalletBalance=Number(balanceObject.walletBalance);
                                var newWalletBalance=currentWalletBalance+amount;

                                //update the customer wallet balance
                                 customerRef.update({walletBalance:newWalletBalance})
                                .then(function(){
                                    con.query("UPDATE Transactions SET reflected_status=? WHERE transaction_id=?",["Reflected",transaction_id],function(error,rows,fields){
                                        
                                    })

                                     var feedback={"transaction_id":transaction_id,"message":"successfull"}
                                     response.json(feedback);

                                }).catch(function(){
                                    var feedback={"transaction_id":transaction_id,"message":"Successfully updated DB &failed update on MOney"}
                                    response.json(feedback);

                                })
                        
                                })
                                    
                                }else{
                                    var feedback={"transaction_id":transaction_id,"message":"Successfully updated DB &failed update on Money"}
                                    response.json(feedback); 
                                }
                                
                            }
                        })
                        
                        
                     }else{
                         var feedback={"transaction_id":transaction_id,"message":"Successfully updated DB"}

                         response.json(feedback);
                     }
               
           }
         });
            
        }else if(tran_type=="2"){
             con.query("UPDATE cashWithDraws SET transaction_status=? WHERE transaction_id=?",[status,transaction_id],function(error,rows,fields){
           if(!!error){
             var feedback={"transaction_id":transaction_id,"message":"failed update"}

              response.json(feedback);
           }else{
               var feedback={"transaction_id":transaction_id,"message":"successfull update"}
              response.json(feedback);
           }
         });
            
        }else{
            //var feedback={"transaction_id":"nothing received","message":"Parameters sent but no action"}
            var feedback=tran_type+"  "+transaction_id+"  "+status;
            
              response.json(request.body);
            
            
        }

})







