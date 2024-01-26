import {atom} from 'recoil';

export const painState=atom({
    key:'painState',
    default:{
        currentType:"",
        poseList:null,
    },
});