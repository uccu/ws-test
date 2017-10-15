"use strict";

const 
    ws = require("nodejs-websocket"),
    crypto = require('crypto'),
    util = require('util'),
    fs = require('fs'),
    md5 = d => crypto.createHash('md5').update(d).digest('hex'),
    content = d => d instanceof Object ? JSON.stringify(d) : '{}',
    action = require('./action'),
    data = require('./data');




let serverCallback = function(con){

        console.log("one connection linked")
        let path = con.path.slice(1)
    
        con.sendText(content({status:200,type:'connect'}))
    

        /** 连接断开执行动作 */
        con.on("close", function (code, reason) {
            
    
            console.log("one connection closed")
        });



        /** 连接错误执行动作 */
        con.on("error", function (code, reason) {
    

            console.log("one connection occurred error")
        });


        /** 收到消息执行动作 */
        con.on("text", function (str){


            let obj
            
            try{
                obj = JSON.parse(str)
            }catch(e){
                console.warn('message not obj',str)
                con.sendText(content({status:400,message:'message not obj'}))
                return
            }
    
            if(!obj || !(obj instanceof Object))return
            
            try{
                action(obj,con)
            }catch(e){

                console.warn(e.message)
                con.sendText(content({status:400,message:'something err'}))
            }
    
        });
    
    }
    
    let server = ws.createServer(serverCallback).listen(7777)
    console.log("server started")
