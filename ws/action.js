
"use strict";

const 
    content = d => d instanceof Object ? JSON.stringify(d) : '{}',
    data = require('./data');


z = function(obj,con){

    switch(obj.type){

        case 'login':
            break;
        case 'enterChannel':
            break;
        case 'sendMessage':
            break;
        case 'sendImg':
            break;
        case 'sendLink':
            break;
        default:
            break;
    }
}


module.exports = z