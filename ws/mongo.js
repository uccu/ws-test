let
    mongodb = require('mongodb'),
    server  = new mongodb.Server('localhost', 27017, {auto_reconnect:true}),
    db = new mongodb.Db('chat', server, {safe:true}),
    tables = ['message','channel'],

    z = {},Connection = function(c){this.con = c};


    Connection.prototype.find = function(w,r,s = {},p=0,l=0){


        this.con.find(w).sort(s).limit(l).skip((p-1)*l).toArray(function(err,d){
            if(err){
                console.log('mongodb find err : ' + err);
                return;
            }
            r instanceof Function && r(d)
        });
    };
    Connection.prototype.findOne = function(w,r){
        this.con.findOne(w,function(err,d){
            if(err){
                console.log('mongodb findOne err : ' + err);
                return;
            }
            r instanceof Function && r(d)
        });
    };
    Connection.prototype.insert = function(w,r){
        this.con.insert(w,{safe:true},function(err,d){
            if(err){
                console.log('mongodb insert err : ' + err);
                return;
            }
            r instanceof Function && r(d)
        });
    };
    Connection.prototype.update = function(w,e,r){
        this.con.update(w,e,{safe:true},function(err,d){
            if(err){
                console.log('mongodb update err : ' + err);
                return;
            }
            r instanceof Function && r(d)
        });
    };
    Connection.prototype.remove = function(w,r){
        this.con.remove(w,{safe:true},function(err,d){
            if(err){
                console.log('mongodb remove err : ' + err);
                return;
            }
            r instanceof Function && r(d)
        });
    };


    


db.open(function(err, db){


    if(err){
        console.log('mongodb connect err : ' + err);
        return;
    }

    db.dropCollection('message',{safe:true})
    db.dropCollection('channel',{safe:true})
    
    console.log('mongodb connect success')

    /** 连接消息表 */
    db.collection('message', {safe:true}, function(err, collection){

        if(err){
            console.log('message collection connect err : ' + err);
            return;
        }
        console.log('message collection connect success')
        z.Cmessage = new Connection(collection);
    })
    /** 连接频道表 */
    db.collection('channel', {safe:true}, function(err, collection){

        if(err){
            console.log('channel collection connect err : ' + err);
            return;
        }
        console.log('channel collection connect success')
        z.Cchannel = new Connection(collection);
    })
});



module.exports = z

