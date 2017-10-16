
"use strict";

const 
    content = d => d instanceof Object ? JSON.stringify(d) : '{}',
    data = require('./data');

let
    UserInfo = function(){},
    ChannelInfo = function(){},
    loginError = function(con){
        con.sendText(content({status:400,'type':'login',message:'login err'}))
    },
    getTime = function(){
        let d = new Date
        return d.getHours() + (d.getMinutes() < 10 ? ':0':':')+d.getMinutes()
    },
    leaveChannel = function(user){

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

    },


z = function(obj,con){

    switch(obj.type){

        case 'login':{

            if(!obj.id)return;
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
            con.sendText(content({status:200,'type':'login',message:'login success'}))

            break;
        }case 'enterChannel':{

            if(!obj.channel_id)return;
            if(!con.user_id){loginError(con);return}
            let user = data.UserMap.get(con.user_id)
            if(!user)return;

            /** 离开所在频道 */
            leaveChannel(user)

            obj.channel_id = obj.channel_id + ''
            
            let channel = data.ChannelMap.get(obj.channel_id)
            if(!channel){

                channel = new ChannelInfo
                channel.master = user
                channel.userList = new Map
                channel.name = obj.name || user.name + '的直播间'
                channel.id = obj.channel_id
                data.ChannelMap.set(obj.channel_id,channel)
                
            }

            channel.userList.set(user.id,user)
            user.channel_id = obj.channel_id

            /** 发送成功消息 */
            console.log(`one connection enter channel - ${con.user_id}`)

            let ob = {};
            ob.channel_id = channel.id
            ob.master_avatar = channel.master.avatar
            ob.master_name = channel.master.name
            ob.name = channel.name


            con.sendText(content({status:200,'type':'enterChannel',data:ob}))

            break;
        }case 'sendMessage':{

            if(!con.user_id){loginError(con);return}
            let user = data.UserMap.get(con.user_id)
            if(!user)return;
            if(!user.channel_id)return;
            if(!obj.message)return;
            if(typeof obj.message != 'string')return;

            let channel = data.ChannelMap.get(user.channel_id)
            if(!channel)return;

            channel.userList.forEach(function(user){
                let t = getTime()
                user.con.sendText(content({status:200,'type':'getMessage',message:obj.message,time:t,user:{avatar:user.avatar,name:user.name}}))
            })


            break;
        }case 'sendImg':
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
                d.master_name = channel.master.name
                d.master_avatar = channel.master.avatar

                ob.push(d)

            })
            con.sendText(content({status:200,'type':'getList',data:ob}))

            break;
        default:
            break;
    }
}


module.exports = z