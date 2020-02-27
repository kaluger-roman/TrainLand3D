import {roaddifinitionclick,camera,volcanoobj3d, traingonormalization,scene,canvas,renderer,disigncontrolroadpoints, getnearestcity,citymap} from "./GameScript.js";
import * as THREE from './js/three.js-master/build/three.module.js';

let mouse = new THREE.Vector2();
function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / document.body.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / document.body.clientHeight ) * 2 + 1;
}
document.addEventListener( 'mousemove', onDocumentMouseMove, false );

let arrowlp=document.getElementById('arrowlp');
let innerleftpanel=document.getElementById('innerleftpanel');
let arrowdp=document.getElementById('arrowdp');
let mainpanel=document.getElementById('mainpanel');
let mainflex=document.getElementById('mainflex');
let citiesbtn=document.querySelector("[data-allroutbtn]");
let routeswindow=document.getElementById('RoutesWindow');
let exitrotesbtn=document.getElementById('exitroutwindowbtn');
let addroad=document.getElementById('addroadbtn');

let conterl=0;
let conterd=0;

arrowlp.onclick=(event)=>{
    conterl+=1;
    event.stopPropagation();
    if(conterl%2===0){
        arrowlp.classList.remove('rotatearrowback');
        arrowlp.classList.add('rotatearrowclass');
        innerleftpanel.classList.remove('openpanell');
        innerleftpanel.classList.add('hidepanell');
    }
    else {
        arrowlp.classList.remove('rotatearrowclass');
        arrowlp.classList.add('rotatearrowback');
        innerleftpanel.classList.remove('hidepanell');
        innerleftpanel.classList.add('openpanell');
    }
};
arrowdp.onclick=(event)=>{
    conterd+=1;
    event.stopPropagation();
    if(conterd%2===0){
        arrowdp.classList.remove('rotatearrowback');
        arrowdp.classList.add('rotatearrowclass');
        mainpanel.classList.remove('openpaneld');
        mainpanel.classList.add('hidepaneld');
    }
    else {
        arrowdp.classList.remove('rotatearrowclass');
        arrowdp.classList.add('rotatearrowback');
        mainpanel.classList.remove('hidepaneld');
        mainpanel.classList.add('openpaneld');
    }
};
citiesbtn.onclick=()=>{
    if (routeswindow.style.visibility==='hidden'){
        routeswindow.style.visibility='visible';
    }
    else {
        routeswindow.style.visibility='hidden';
    }
};
////////////////////////////////////////////////////////////

let allroadonmap=[];//все дороги нак арте
let allroutes=new Map();//все маршруты(связанные куски дорог)
let allroutespoints=new Map()//маршруты в виде серии точек
let addroadactive=false;//если тру, то дорога перестанет липнуть к мышке и встанет на карту
let road;//3d obj
let axisforuser=new THREE.Vector3(0,1,0),angleforuser=0;//угол поворота дороги
let accesstoput=true;//проверка на возможность размещения(пересечения с текстурами и тд)
let cancelsdvig,idforallroutes=0;
function putroad(e){//ставит дорогу там где она сейчас есть
    e.preventDefault();
    if (addroadactive===false)
        return;
    let nearestcity=getnearestcity(new THREE.Vector2(road.position.x, road.position.z));
    if((nearestcity.position.distanceTo(new THREE.Vector2(road.position.x,road.position.z))>Math.max(nearestcity.size.x,nearestcity.size.z)*1.5)&&(road.routerelative===undefined)) {//проверка на соседство с городом новой дороги
        accesstoput = false;
    }

    if (accesstoput===false ){
        mainflex.insertAdjacentHTML("beforeend",
            `<div id="alertt" style="position: relative;display: flex; justify-content: center; grid-column-start: 3; grid-column-end: 4; grid-row-start: 2; grid-row-end: 3;z-index: 1000">
                        <img style="width: 5vmax; height: 5vmax" src="./images/alert.png">
                         <img style="width: 40vmax; height: 10vmax" src="./images/image(9).png">
                   </div>

                  `
        );

        setTimeout(()=>{let alertt=document.getElementById('alertt'); alertt.remove()}, 3000);
        return;
    }
    addroadactive=false;

    if(road.newOrigin!==undefined) {
        let oldpos=road.children[0].getWorldPosition();
        road.children.forEach((value) => value.translateOnAxis((new THREE.Vector3()).copy(road.newOrigin).normalize(), road.newOrigin.length()));
        let newpos=road.children[0].getWorldPosition();
        let sdvig=new THREE.Vector3();
        sdvig.subVectors(oldpos,newpos);
        road.position.x+=sdvig.x;
        road.position.y+=sdvig.y;
        road.position.z+=sdvig.z;
    }

    addroadactive=false;
    cancelsdvig=true;
    allroadonmap.push(road);
    if(road.routerelative===undefined) {
        let _mas=[];
        allroutes.set(++idforallroutes, _mas);
        _mas.push(road);
        road.routerelative=idforallroutes;
        allroutespoints.set(idforallroutes,[]);
        disigncontrolroadpoints(road,allroutespoints.get(road.routerelative));
    }
    else{
        allroutes.get(road.routerelative).push(road);
        disigncontrolroadpoints(road,allroutespoints.get(road.routerelative));
    }

    document.removeEventListener("keydown", rotataroad);
}
function rotataroad(e){
    if (e.code==='Numpad4')
        road.rotateOnWorldAxis(new THREE.Vector3(0,1,0),Math.PI/36);
    if (e.code==='Numpad6')
        road.rotateOnWorldAxis(new THREE.Vector3(0,1,0),-Math.PI/36);
    let leftcorn1=road.getChildByName('leftcorner1');
    let rightcorner1=road.getChildByName('rightcorner1');
    let axis=new THREE.Vector3();
    axis.subVectors(leftcorn1.position,rightcorner1.position);
    axisforuser=axis;
    if (e.code==='Numpad8'){
        road.rotateOnAxis(axis.normalize(),Math.PI/36);
        angleforuser+= Math.PI/36;
    }
    if (e.code==='Numpad2') {
        road.rotateOnAxis(axis.normalize(), -Math.PI / 36);
        angleforuser -= Math.PI / 36;
    }
    angleforuser=angleforuser%(2*Math.PI);
}
function f1(){
    canvas.addEventListener('mouseup',putroad,{capture:false});
    setTimeout(()=>{
        canvas.removeEventListener('mouseup',putroad,{capture:false});
    }, 500);
}
function adrod(cancelsdvig){
    if (addroadactive===false)
        return;
    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera( mouse, camera );
    let intersects = raycaster.intersectObjects( [].concat(volcanoobj3d,allroadonmap), true);
    if ( intersects.length > 0 ) {
        let p=intersects[0].point;
        let nearroads=[];
        for(let currod of allroadonmap){
            let dist=p.distanceTo(currod.getWorldPosition());
            if (dist<Math.max(road.width, road.length)) {//коэффициент для того чтобы найти ряждом какие чужие углы
                nearroads.push({currod, dist});
            }
        }
        nearroads.sort((a,b)=>{
            if (a.dist > b.dist) return 1;
            if (a.dist < b.dist) return -1;
            if (a.dist === b.dist) return 0;
        });
        if(cancelsdvig===false){
            if(nearroads.length>0){
                accesstoput=road.positionbytwocorners(nearroads[0].currod,p,axisforuser,angleforuser,allroadonmap);
            }
            else {
                road.position.set(p.x, p.y+road.width/5, p.z);
                road.routerelative=undefined;
                accesstoput=true;
                road.angleforuser=angleforuser;
            }
        }
        document.addEventListener("keydown", rotataroad);
    }
    if(addroadactive)
        setTimeout(()=>adrod(cancelsdvig),100);
}
addroad.onclick=async ()=>{
    canvas.removeEventListener('mousedown',f1,{capture:false});
    cancelsdvig=false;
    canvas.addEventListener('mousedown',f1,{capture:false});
    let timeoutofadroad;
    if (addroadactive===false) {
        road = await roaddifinitionclick('./images/fullcorneredroadwithcontrol.glb');
        addroadactive=true;
        timeoutofadroad=setTimeout(()=>adrod(cancelsdvig),100);
    }
    else {
        addroadactive=false;
        for (let i=road.children.length-1;i>=0;i--){
            road.children[i].material.dispose();
            road.children[i].geometry.dispose();
            road.remove( road.children[i]);
        }
        console.log(allroadonmap.indexOf(road));
       //allroadonmap.splice(allroadonmap.indexOf(road)+1,1);
        scene.remove(road);
        road=null;
        canvas.removeEventListener('mouseup',putroad,{capture:false});
        document.removeEventListener("keydown", rotataroad);
    }
};
window.shedule.allroutespoints=allroutespoints;