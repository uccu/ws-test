
"use strict";

const 
    content = d => d instanceof Object ? JSON.stringify(d) : '{}',
    data = require('./data');

let
    yoo = 0,
    UserInfo = function(){},
    ChannelInfo = function(){},
    MessageBox = function(){},
    mongo = require('./mongo');


let loginError = function(con){
    con.sendText(content({status:400,'type':'login',message:'login err'}))
};
let getTime = function(){
    let d = new Date
    return d.getHours() + (d.getMinutes() < 10 ? ':0':':')+d.getMinutes()
};
let getChannel = function(id,r,j){
    let channel = data.ChannelMap.get(id)
    if(!channel){
        // mongo.Cchannel.findOne({id:id},function(w){
            // if(!w){
            //     r(w);return
            // }
            channel = new ChannelInfo
            channel.master_name = ''
            channel.master_avatar = ''
            channel.master_id = ''
            channel.pic = ''
            channel.userList = new Map
            channel.name = ''
            channel.id = id
            if(j)data.ChannelMap.set(channel.id,channel)
            r(channel)
        // })  
    }else{
        r(channel)
    }
};

let leaveChannel = function(user){

    if(!user || !user.channel_id)return;
    let 
        channel_id = user.channel_id,
        channel = data.ChannelMap.get(channel_id);
    if(!channel)return;
    /** 删除频道内用户 */
    channel.userList.delete(user.id)
    /** 如果频道内没有用户则关闭频道 */
    if(channel.userList.size == 0)data.ChannelMap.delete(channel_id)
    /** 用户的频道设置为0 */
    user.channel_id = 0;
    
    return true

};

let host = '121.43.111.114:8280';


let z = function(obj,con){

    switch(obj.type){

        case 'login':{

            if(!obj.id){
                yoo++
                obj.id = 'x' + yoo
                obj.name = '游客' + yoo
                obj.avatar = 'http://'+host+'/upload/def/photo_placeholder@3x.png'
            }
            /** 查询用户 */
            obj.id = obj.id + ''
            let user = data.UserMap.get(obj.id)

            /** 用户已登录 */
            if(user){
                if(user.con === con)return
                delete user.con.user_id
                user.con.close();
            }

            /** 用户未登录 */
            con.user_id = obj.id
            user = new UserInfo
            user.con = con
            user.id = con.user_id
            user.avatar = obj.avatar
            user.name = obj.name
            data.UserMap.set(con.user_id,user)

            /** 发送成功消息 */
            console.log(`one connection login - ${con.user_id}`)
            con.sendText(content({status:200,'type':'login',message:'login success',obj:obj}))

            break;
        }case 'createChannel':{

            if(!obj.channel_id)return;
            if(!con.user_id){loginError(con);return}
            let channel_id = obj.channel_id + '';
            let user = data.UserMap.get(con.user_id)
            if(!user)return;

            let name = (obj.name + '') || (user.name + '的直播间');
            let pic = (obj.pic + '').replace(/'|"/ig,'') || '/pic/nopic.jpg';
            mongo.Cchannel.findOne({id:channel_id},function(r){

                if(r){
                    con.sendText(content({status:400,message:'channel has been created'}))
                    return;
                }

                let now = Date.now();

                mongo.Cchannel.insert(
                    {

                        id              :   channel_id,
                        master_id       :   user.id,
                        name            :   name,
                        create_time     :   now,
                        pic             :   pic,
                        master_name     :   user.name,
                        master_avatar   :   user.avatar,
                        end_time        :   0

                    },function(){

                        console.log(channel_id)
                        getChannel(channel_id,function(c){
                            if(!c){
                                console.log(`one channel created err - ${channel_id}`);return
                            }

                            let ob = {};
                            ob.channel_id = c.id
                            ob.master_avatar = c.master_avatar
                            ob.master_name = c.master_name
                            ob.name = c.name

                            
                            c.userList.set(user.id,user)
                            user.channel_id = channel_id
                            
                            console.log(`one channel created - ${channel_id}`)
                            con.sendText(content({status:200,'type':'enterChannel',data:ob}))

                        },1)
                        


                        
                    }
                )

            })


            break;
        }case 'enterChannel':{

            if(!obj.channel_id)return;
            if(!con.user_id){loginError(con);return}
            let user = data.UserMap.get(con.user_id)
            if(!user)return;

            /** 离开所在频道 */
            leaveChannel(user)

            let channel_id = obj.channel_id + ''
            
            getChannel(channel_id,function(c){
                if(!c){
                    console.log(`one channel created enter - ${channel_id}`);return
                }

                let ob = {};
                ob.channel_id = c.id
                ob.master_avatar = c.master_avatar
                ob.master_name = c.master_name
                ob.name = c.name
                c.userList.set(user.id,user)
                user.channel_id = channel_id
                
                console.log(`one connection enter channel - ${con.user_id}`)
                con.sendText(content({status:200,'type':'enterChannel',data:ob}))

            },1)


            break;
        }case 'sendMessage':{

            if(!con.user_id){loginError(con);return}
            let user = data.UserMap.get(con.user_id)
            if(!user)return;
            if(!user.channel_id)return;

            let mode = obj.mode || 0;
            let money = obj.money || 0
            let url = obj.url || ''
            if(mode == 1){
                obj.message = '<span style="color:blueviolet">'+user.name+'</span>打赏主播<span style="color:red">￥'+obj.money + '</span>'
            }
            else if(mode == 2){
                obj.message = '<img src="'+obj.url+'" />'
            }

            if(!obj.message)return;
            if(typeof obj.message != 'string')return;

            let channel = data.ChannelMap.get(user.channel_id)
            if(!channel)return;

            let now = Date.now();
            let ti = getTime()
            

            let message = {

                message     :   obj.message,
                channel_id  :   channel.id,
                user_id     :   user.id,
                user_avatar :   user.avatar,
                user_name   :   user.name,
                create_time :   now,
                mode        :   mode,
                time        :   ti

            }

            mongo.Cmessage.insert(message,function(){

                console.log(`user send a message - ${user.id}`);
                channel.userList.forEach(function(user2){
                    user2.con.sendText(content({status:200,'type':'getMessage',data:message,mode:mode}))
                })
            })


            


            break;
        }case 'close':


            if(!con.user_id){loginError(con);return}
            let user = data.UserMap.get(con.user_id)
            if(!user)return;
            if(!user.channel_id)return;

            

            let channel = data.ChannelMap.get(user.channel_id)
            if(!channel)return;


            channel.userList.forEach(function(user2){
                user2.con.sendText(content({status:200,'type':'close'}))
            })


            break;
        case 'sendImg':
            break;
        case 'sendLink':
            break;
        case 'getList':
            
            let ob = [];
            data.ChannelMap.forEach(function(channel){
                let d = {}
                d.channel_id = channel.id
                d.size = channel.userList.size
                d.name = channel.name
                d.master_name = channel.master_name
                d.master_avatar = channel.master_avatar
                d.pic = channel.pic
                ob.push(d)
            })
            con.sendText(content({status:200,'type':'getList',data:ob}))
            break;
        case 'getHistory':{

            let page = parseInt(obj.page) || 1;


            mongo.Cmessage.find({channel_id  : obj.channel_id+''},function(r){

                con.sendText(content({type:'getHistory',data:r,page:page}))
            },{create_time:-1},page,20)


            break;
        }default:
            break;
    }
}


module.exports = z