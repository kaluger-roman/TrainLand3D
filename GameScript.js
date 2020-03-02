"use strict"
import * as THREE from './js/three.js-master/build/three.module.js';
import {OrbitControls} from './js/three.js-master/examples/jsm/controls/OrbitControls.js';
import {resizerenderertotal} from "./js/usefuljs.js";
import {OBJLoader2} from './js/three.js-master/examples/jsm/loaders/OBJLoader2.js';
import {Vector3} from "./js/three.js-master/src/math/Vector3.js";
import {Plane} from "./js/three.js-master/src/math/Plane.js";
import {MTLLoader} from "./js/three.js-master/examples/jsm/loaders/MTLLoader.js";
import {MtlObjBridge} from "./js/three.js-master/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js";
import {GLTFLoader} from "./js/three.js-master/examples/jsm/loaders/GLTFLoader.js";

let canvas=document.getElementById('canv');
const scene=new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 5000000);
camera.position.set(0,400000,0);

const renderer=new THREE.WebGLRenderer({
    canvas,
    alpha:true,
    logarithmicDepthBuffer: true,
});
renderer.autoClearColor = false;
renderer.setSize(window.innerWidth, window.innerHeight);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableKeys=false;
controls.target.set(0, 8000, 0);

const light = new THREE.DirectionalLight(0xFFFFFF, 1);
light.position.set(0, 10000, 0);
light.target.position.set(-5, 0, 0);
scene.add(light);
scene.add(light.target);

const MTLlod=new MTLLoader();
const loader=new THREE.TextureLoader();
const cubemaploader = new THREE.CubeTextureLoader();
const cubetextture = cubemaploader.load([
    './images/ely_hills/eezabad_ft.jpg',
    './images/ely_hills/eezabad_bk.jpg',
    './images/ely_hills/eezabad_up.jpg',
    './images/ely_hills/eezabad_dn.jpg',
    './images/ely_hills/eezabad_rt.jpg',
    './images/ely_hills/eezabad_lf.jpg']);
scene.background = cubetextture;
//задний план

let servertimestamp=0;//получить с сервера
export let clock=new Date(servertimestamp);

let train3dobj, volcanoobj3d;

class City{
    constructor(name,x,y,id,size){//size размер города на карте {width,length,heigth}
        this.name=name;
        this.position=new THREE.Vector2();
        this.position.set(x,y);
        this.id=id;
        this.size=size;
        //axisangle МБ
    }
}

class TrainClass{
    constructor(id,obj3d){
        this.obj3d=obj3d;
        this.id=id;
    }
}
export let citymap=new Map();

citymap.set(2,new City(`Kufagrad`, 120000, 120000,2,new Vector3(10000,10000,10000)));
citymap.set(1,new City(`Vladosburg`, -120000, -120000,1,new Vector3(10000,10000,10000)));

let trainmap=new Map();

class SheduleMember{
    constructor(timestampweek,road,train,duration,fromcity,tocity){
        this.timestampweek=timestampweek;
        this.road=road;
        this.train=train;
        this.duration=duration;
        this.fromcity=fromcity;
        this.tocity=tocity;
        this.isreadyforgo=false;  //готово ли к отправлению или в состоянии редактирования
    }
}

let shedule={
    shedulemap: new Map(),
    citymap,
    SheduleMember,
    clock,
    trainmap,
};
let roadtypes=new Set();
roadtypes.add('start').add('straight').add('left').add('right').add('end');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
(async ()=>{
    const objLoader = new OBJLoader2();
    MTLlod.load('./images/volcano/volcano0201.mtl', (mtpresult) => {
        const volcmaterials = MtlObjBridge.addMaterialsFromMtlLoader(mtpresult);
        for (const material of Object.values(volcmaterials)) {
            material.side = THREE.DoubleSide;
        }
        objLoader.addMaterials(volcmaterials);
        objLoader.load('./images/volcano/volcano0201.obj', (root) => {   //traverse перебрать потомков есть
            scene.add(root);
            root.modelBoundingBox = new THREE.Box3().setFromObject(root);
            volcanoobj3d=root;
        });
    })

})();//прогрузка карты

export async function traindifinition(objectpath)
{
    const objLoader = new OBJLoader2();
    let train3dobj;
    let material=new THREE.MeshBasicMaterial({ map:  loader.load('./images/montagne.jpg')});
    objLoader.addMaterials(material);
    material.side = THREE.DoubleSide;
    await new Promise((resolve) => {objLoader.load(objectpath, (root) => {
        train3dobj=root;
        train3dobj.position.y=80000;
        train3dobj.position.x=-70000;
        train3dobj.scale.set(500,500,500);

        let cornersystem;

        let modBB = new THREE.Box3().setFromObject(train3dobj);
        train3dobj.length=modBB.max.x-modBB.min.x;
        train3dobj.width=modBB.max.z-modBB.min.z;
        train3dobj.height=modBB.max.y-modBB.min.y;//возможно перепутана ширина и длина

        let corner1= new THREE.Mesh(new THREE.SphereBufferGeometry(1000, 6, 6),new THREE.MeshPhongMaterial({emissive: 0xCCFF99}));
        let corner2= new THREE.Mesh(new THREE.SphereBufferGeometry(1000, 6, 6),new THREE.MeshPhongMaterial({emissive: 0xFFFF00}));            //выбрать 3 угол
        let corner3= new THREE.Mesh(new THREE.SphereBufferGeometry(1000, 6, 6),new THREE.MeshPhongMaterial({emissive: 0xFFFF00}));
        let corner4= new THREE.Mesh(new THREE.SphereBufferGeometry(1000, 6, 6),new THREE.MeshPhongMaterial({emissive: 0xFFFF00}));

        corner1.position.set(modBB.max.x,modBB.min.y,modBB.max.z);
        corner2.position.set(modBB.max.x,modBB.min.y,modBB.min.z);
        corner3.position.set(modBB.min.x,modBB.min.y,modBB.max.z);
        corner4.position.set(modBB.min.x,modBB.min.y,modBB.min.z);

        corner3.position.lerp(corner4.position, 0.5);

        corner1.name='corner1';
        corner2.name='corner2';
        corner3.name='corner3';
        corner4.name='corner4';

        cornersystem=new THREE.Mesh(
            new THREE.BoxGeometry( train3dobj.length, train3dobj.height, train3dobj.width),
            new THREE.MeshPhongMaterial({
                color: 0xFFFFFF,
                opacity: 0.5,
                transparent: true,
            }));

        let p=train3dobj.position;
        cornersystem.position.set(p.x,p.y+train3dobj.height*2,p.z);
        train3dobj.cornersystem=cornersystem;
        scene.add(cornersystem);

        cornersystem.attach(corner1);
        cornersystem.attach(corner2); //когда add масштабируется и прикпрепляется а attach прикрепляется просто(аттач координаты из внешнего мира и просто крепит), адд переводит во внутренний мир
        cornersystem.attach(corner3);

        train3dobj.trainplain=new Plane();
        train3dobj.trainplain.setFromCoplanarPoints(cornersystem.getObjectByName('corner1').getWorldPosition(),cornersystem.getObjectByName('corner2').getWorldPosition(),cornersystem.getObjectByName('corner3').getWorldPosition());//или position

        train3dobj.forwarddirrect =  new Vector3(1, 0, 0);
        // в какую сторону направлен нос с учетом поворота поверхности
        train3dobj.lookforward=function(){
            let angle, nvector1, nvector2;
            nvector1=new Vector3();
            nvector2=new Vector3();

            function ncross(obj, trainonj){
                nvector1.crossVectors(trainonj.forwarddirrect, new Vector3(0,1,0)).normalize();
                nvector2.crossVectors(obj.getWorldDirection(), new Vector3(0,1,0)).normalize();
            }

            ncross(train3dobj, train3dobj);

            angle=nvector1.angleTo(nvector2);
            train3dobj.rotateOnAxis(new Vector3(0,1,0), angle);

            ncross(train3dobj,train3dobj);

            if (angle< nvector1.angleTo(nvector2)){
                train3dobj.rotateOnAxis(new Vector3(0,-1,0), 2*angle);
            }

            ncross(cornersystem, train3dobj);

            angle=nvector1.angleTo(nvector2);
            cornersystem.rotateOnWorldAxis(new Vector3(0,1,0), angle);

            ncross(cornersystem, train3dobj);

            if (angle< nvector1.angleTo(nvector2)){
                cornersystem.rotateOnWorldAxis(new Vector3(0,-1,0), 2*angle);
            }
        };

        {
            let helper2 = new THREE.AxesHelper(50000000);
            let helper3 = new THREE.AxesHelper(50000000);
            let helper4 = new THREE.AxesHelper(50000000);
            cornersystem.add(helper4);
            train3dobj.add(helper2);
            scene.add(train3dobj, helper3);//потом удалить помощников
        }

        train3dobj = new Proxy( train3dobj, {
            get(target, prop, receiver) {
                let reflect= Reflect.get(target, prop, receiver);
                if (prop === 'position') {
                    let diff = new Vector3();
                    diff.subVectors(cornersystem.position, reflect);
                    let cp = cornersystem.position;
                    cp.set(reflect.x,reflect.y+10000,reflect.z);
                }
                return typeof reflect == 'function' ? reflect.bind(target) : reflect; // (*)
            }});

        resolve(1);

    });});

     return new Promise((resolve => resolve(train3dobj)));
}//паровоз

export async function roaddifinitionclick(objectpath)
{
   // const objLoader = new OBJLoader2();
    let gltfLoader = new GLTFLoader();
    let road3dobj;
    //let material=new THREE.MeshBasicMaterial({ map:  loader.load('./images/montagne.jpg')});
    //objLoader.addMaterials(material);
    //material.side = THREE.DoubleSide;
    await new Promise((resolve) => {gltfLoader.load(objectpath, (root) => {
        root=root.scene;
        road3dobj=root;
        road3dobj.position.y=80000;
        road3dobj.position.x=-70000;
        road3dobj.scale.set(20,20,20);

        let modBB = new THREE.Box3().setFromObject(road3dobj);
        road3dobj.length=modBB.max.x-modBB.min.x;
        road3dobj.width=modBB.max.z-modBB.min.z;
        road3dobj.height=modBB.max.y-modBB.min.y;//возможно перепутана ширина и длина


        scene.add(road3dobj);

        road3dobj.positionbytwocorners=function(currod,pointofmouse,axisforuser,angleforuser,allroadonmap){//

            if(road3dobj.newOrigin!==undefined) {
                road3dobj.position.x-=road3dobj.sdvig.x;
                road3dobj.position.y-=road3dobj.sdvig.y;
                road3dobj.position.z-=road3dobj.sdvig.z;
                road3dobj.children.forEach((value) => value.translateOnAxis((new Vector3()).copy(road3dobj.newOrigin).normalize(), road3dobj.newOrigin.length()));

            }

            let leftcorn1=road3dobj.getObjectByName('leftcorner1');
            let leftcorn2=road3dobj.getObjectByName('leftcorner2');
            let rightcorn1=road3dobj.getObjectByName('rightcorner1');
            let rightcorn2=road3dobj.getObjectByName('rightcorner2');

            let currodleftcorn1=currod.getObjectByName('leftcorner1');   //для угловых сегментов доделать взять два фиксированных угла на сегменте, которые будут липнуть к нашим, это надо чтобы не было поворота влево вправо при смене угла вращения, углы должны быть одни и те же которые лепим дороге, просто разворачивать как слдует, еще выделить у нужного конца центр двигать которые будем, прям к границе центр приделать чтобы легче позиционировать, тупо на угол дороги на карте ставим наш центр при нужном повороте оси
            let currodleftcorn2=currod.getObjectByName('leftcorner2');

            road3dobj.angleforuser=angleforuser;




            let needquaternion=currod.getWorldQuaternion();
            road3dobj.setRotationFromQuaternion(needquaternion);

            road3dobj.updateMatrixWorld();

            let firstvectto=new THREE.Vector3();
            firstvectto.subVectors(currodleftcorn1.getWorldPosition(),currodleftcorn2.getWorldPosition());

            let res=currod.getWorldPosition();
            road3dobj.position.set(res.x,res.y, res.z);
            road3dobj.updateMatrixWorld();  //вот эта мелккая сука все портила, надо обновлять положения углов внутри так, чьобы тут жеих получить
            let dist=pointofmouse.distanceTo(road3dobj.position);

            let r3p=road3dobj.position;
            road3dobj.position.set(r3p.x+firstvectto.x,r3p.y+firstvectto.y,r3p.z+firstvectto.z);
            if(dist<pointofmouse.distanceTo(road3dobj.position)){
                road3dobj.position.set(r3p.x-2*firstvectto.x,r3p.y-2*firstvectto.y,r3p.z-2*firstvectto.z);
            }
            road3dobj.updateMatrixWorld();
            let nearcornerleft,nearcornerright,neworigin=new THREE.Vector3();
            if(currod.position.distanceTo(leftcorn1.getWorldPosition())>currod.position.distanceTo(leftcorn2.getWorldPosition())){
                nearcornerleft=leftcorn2;
                nearcornerright=rightcorn2;
            }
            else{
                nearcornerleft=leftcorn1;
                nearcornerright=rightcorn1;
            }
            neworigin.lerpVectors(nearcornerleft.position,nearcornerright.position,0.5);

            let oldpos=road3dobj.children[0].getWorldPosition();
            road3dobj.children.forEach((value)=>value.translateOnAxis((new Vector3()).copy(neworigin).normalize().negate(),neworigin.length()));
            let newpos=road3dobj.children[0].getWorldPosition();
            let sdvig=new THREE.Vector3();
            sdvig.subVectors(oldpos,newpos);
            road3dobj.position.x+=sdvig.x;
            road3dobj.position.y+=sdvig.y;
            road3dobj.position.z+=sdvig.z;

            road3dobj.sdvig=sdvig;
            road3dobj.newOrigin=neworigin;
            road3dobj.rotateOnAxis(axisforuser.normalize(),angleforuser);
            road3dobj.updateMatrixWorld();

            let distantcorenerleft,distantcornerright;
                if(currod.position.distanceTo(leftcorn1.getWorldPosition())>currod.position.distanceTo(leftcorn2.getWorldPosition())){
                    distantcorenerleft=leftcorn1.getWorldPosition();
                    distantcornerright=rightcorn1.getWorldPosition();
                }
                else{
                    distantcorenerleft=leftcorn2.getWorldPosition();
                    distantcornerright=rightcorn2.getWorldPosition();
                }

            let raycasterleft = new THREE.Raycaster(distantcorenerleft,new Vector3(0,1,0));
            let raycasterright = new THREE.Raycaster(distantcornerright,new Vector3(0,1,0));

            let intersectleft = raycasterleft.intersectObject( volcanoobj3d, true);
            let intersectright = raycasterright.intersectObject( volcanoobj3d, true);

            if((intersectleft.length>0)||(intersectright.length>0))
                return false;

            let raycasterleftdown = new THREE.Raycaster(distantcorenerleft,new Vector3(0,-1,0));
            let raycasterrightdown = new THREE.Raycaster(distantcornerright,new Vector3(0,-1,0));

            let intersectleftdown = raycasterleftdown.intersectObject( volcanoobj3d, true);
            let intersectrightdown = raycasterrightdown.intersectObject( volcanoobj3d, true);//[].concat(volcanoobj3d,allroadonmap)

            if((intersectleftdown[0].distance>road3dobj.length)||(intersectrightdown[0].distance>road3dobj.length))
                return false;

            intersectleft = raycasterleft.intersectObjects( allroadonmap, true);
            intersectright =raycasterright.intersectObjects( allroadonmap, true);

            let _x1,_x2;
            try {_x1=intersectleft[0].distance;}
            catch {_x1=undefined;}
            try {_x2=intersectright[0].distance;}
            catch {_x2=undefined;}

            if(((_x1<road3dobj.height*2))||((_x2<road3dobj.height*2)))
                return false;

            intersectleftdown = raycasterleftdown.intersectObjects( allroadonmap, true);
            intersectrightdown = raycasterrightdown.intersectObjects( allroadonmap, true);

            try {_x1=intersectleftdown[0].distance;}
            catch {_x1=undefined;}
            try {_x2=intersectrightdown[0].distance;}
            catch {_x2=undefined;}

            if(((_x1<road3dobj.height*2))|| ((_x2<road3dobj.height*2)))
                return false;

            if (Math.abs(road3dobj.angleforuser)>Math.PI/4)
                return false;


            road3dobj.routerelative=currod.routerelative;// принадлежность к маршруту к которому присоединяем
            return true;
        };

        resolve(1);

    });});
    return new Promise((resolve => resolve(road3dobj)));
}//дорога
export function disigncontrolroadpoints(road3dobj,currotecurvepath) {//присоединяемый фрагмент дороги и текущий маршрут(массив точек) присоединения параметры
    road3dobj.updateWorldMatrix();
    let controlpoints=[];
    road3dobj.children.forEach((value)=>{
        if(value.name.startsWith('controlroadpoint')){
            controlpoints.push(value);
        }
    });
    controlpoints.sort((a,b)=>{
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        if (a.name === b.name) return 0;
    });
    if (currotecurvepath.curves.length>0){
    if (currotecurvepath.getPointAt(1).distanceTo(controlpoints[controlpoints.length-1].getWorldPosition())<currotecurvepath.getPointAt(1).distanceTo(controlpoints[0].getWorldPosition())){
        controlpoints.reverse();
    }
    }
    else{
        let nearestcity=getnearestcity(new THREE.Vector2(road3dobj.position.x, road3dobj.position.z));
        if (nearestcity.position.distanceTo(new THREE.Vector2(controlpoints[controlpoints.length-1].getWorldPosition().x,controlpoints[controlpoints.length-1].getWorldPosition().z))
            <nearestcity.position.distanceTo(new THREE.Vector2(controlpoints[0].getWorldPosition().x,controlpoints[0].getWorldPosition().z))){
            controlpoints.reverse();
        }
    }
    let curve = new THREE.CatmullRomCurve3( controlpoints.map(((value) =>value.getWorldPosition())));
    currotecurvepath.add(curve);


}
export function traingonormalization(curtrain, raycastobjmas) {
    curtrain.lookforward();
    let cors=curtrain.cornersystem;
    let intersect;
    let flag=false;
    let corners=[cors.getObjectByName('corner1'),cors.getObjectByName('corner2'),cors.getObjectByName('corner3')];
    let raysup=[];
    let raysdown=[];
    let upvector=new Vector3(0,1,0);
    let downvector=new Vector3(0,-1,0);

    raycastt(upvector,raysup);
    raycastt(downvector,raysdown);
    function raycastt(vector, masrays) {
        scene.updateMatrixWorld();
        curtrain.updateMatrixWorld();
        if(volcanoobj3d!==undefined)
        volcanoobj3d.updateMatrixWorld();
        cors.updateMatrixWorld();
        for (let i =1;i<4;i++){
            masrays.push(new THREE.Raycaster(cors.localToWorld((new Vector3()).copy(cors.getObjectByName(`corner${i}`).position)), vector.normalize()));//можно фар и нир понизить
        }
        masrays.forEach((ray, index)=>{
            intersect = ray.intersectObjects(raycastobjmas, true);//важно флаг тру чтоб проверять загружаемые объекты
            if ( (intersect.length >0) && (intersect[0].distance>curtrain.height/50))//
            {
                flag=true;
                let curpos=new Vector3();
                curpos.copy(corners[index].position);
                let curworldposoftrain=new Vector3();
                curworldposoftrain.copy(cors.position);
                curworldposoftrain.addScaledVector(cors.getObjectByName(`corner${index+1}`).position, cors.scale.y);

                let futureworldpos=new Vector3(curworldposoftrain.x, intersect[0].point.y+100, curworldposoftrain.z);
                let futureposlocal=cors.worldToLocal(futureworldpos);
                if (cors.getWorldDirection().angleTo(new Vector3(1,0,0))<=Math.PI/2){
                    futureposlocal.applyAxisAngle(upvector, cors.getWorldDirection().angleTo(new Vector3(0,0,1)) );
                }
                else {
                    futureposlocal.applyAxisAngle(downvector, cors.getWorldDirection().angleTo(new Vector3(0,0,1)) );
                }
                cors.getObjectByName(`corner${index+1}`).position.set(futureposlocal.x, futureposlocal.y, futureposlocal.z);//убрать прибавление позиции системы многократное каждый раз

            }
        });
    }

    /////////////////////////


    if (flag) {
        corners.sort((a, b) => {
            let ap=(a.position);
            let bp=(b.position);            //localtoworld????
            if (ap.y > bp.y) return 1;
            if (ap.y < bp.y) return -1;
            if (ap.y === bp.y) return 0;
        });

        curtrain.oldaxis=new Vector3();
        curtrain.oldaxis.copy(curtrain.trainplain.normal);
        curtrain.trainplain.setFromCoplanarPoints(corners[0].getWorldPosition().divideScalar(cors.scale.y), corners[1].getWorldPosition().divideScalar(cors.scale.y),corners[2].getWorldPosition().divideScalar(cors.scale.y));
        if(curtrain.trainplain.normal.angleTo(upvector)>=Math.PI/2){
            curtrain.trainplain.normal.negate();
        }

        let quaternion2=new THREE.Quaternion();
        quaternion2.setFromUnitVectors(curtrain.oldaxis.normalize(),curtrain.trainplain.normal.normalize());
        curtrain.applyQuaternion(quaternion2);
        curtrain.position.y=corners[2].getWorldPosition().y;

    }

}//выравнивание паровоза или чего то по вертикали чтобы не проваливалось
export function getnearestcity(pointvect2) {
    let sortcities=Array.from(citymap.values()).sort(((a, b) => {
        let ad,bd;
        ad=a.position.distanceTo(pointvect2);
        bd=b.position.distanceTo(pointvect2);
        if (ad > bd) return 1;
        if (ad < bd) return -1;
        if (ad === bd) return 0;
    }));
    return sortcities[0];
}
(async ()=>{
    train3dobj=await traindifinition('./images/Sci_fi_Train.obj');
    train3dobj.position.set(50000,train3dobj.position.y,50000);
   // setInterval(()=>traingonormalization(train3dobj, allroadonmap),1000);
    trainmap.set(1, new TrainClass(1,train3dobj));
    //shedule.shedulemap.set(1, new SheduleMember(1000*60*60*24*1-1000*60*60*20,new Road(), train3dobj, 1000*30),1,2);//выбор поезда доделать время в мс тут
})();
export  async function traingo() {
    return new Promise(resolve => {
     let cadresinsecond=1000/100;
     function* generatePoints(addpart,curvepath,reverse) {//реверс- надо ли читать дорогу с конца(когда из другого города в первый)
         let progress=reverse?1:0;
         if (reverse){
             while (progress >0) {
                 yield curvepath.getPointAt(progress);
                 progress -= addpart;
             }
         }
         else {
             while (progress < 1) {
                 yield curvepath.getPointAt(progress);
                 progress += addpart;
             }
         }
        return 0;
    }
    function* generatedirectionPoints(addpart,curvepath,arccurvelength,train,reverse) {
        let addtrainsize=train.length/arccurvelength;
        let progress=reverse?(1-addtrainsize):addtrainsize;
        if (reverse){
            while (progress>0){
                yield curvepath.getPointAt(progress);
                progress-=addpart;
            }
        }
        else{
            while (progress<1){
                yield curvepath.getPointAt(progress);
                progress+=addpart;
             }
        }
        return 0;
    }
    function rendrpos(train,gener, generdir, normilizetimer=0,rendrposcounter=0) {//нормалайз тамер чтобы не тратить по много времени на нормализацию делать ее нечасто
         rendrposcounter++;
        console.log('я в рендпос1'+performance.now());
         let gen=gener.next();
         let gendir=generdir.next();
        console.log('я в рендпос2'+performance.now());

        if (rendrposcounter===cadresinsecond) {
            window.allowtotick = true;
            rendrposcounter=0;
        }
        else
            window.allowtotick=false;

         if (gen.done===false) {

             setTimeout(()=>requestAnimationFrame(()=>rendrpos(train,gener, generdir,normilizetimer,rendrposcounter)), 1000/cadresinsecond);//в секунду реальную проходится 25 точек из массива
             train.position.x = gen.value.x;
             train.position.z = gen.value.z;
             if(gendir.done===false) {
                 train.forwarddirrect = new Vector3(gen.value.x - gendir.value.x, 0, gen.value.z - gendir.value.z);
             }
             normilizetimer++;
             if (normilizetimer===1)
                 traingonormalization(train, allroadonmap);
             if (normilizetimer>5)
                 normilizetimer=0;

         }
         else
             window.allowtotick = true;

    }
    for (let shed of shedule.shedulemap.values()){
        if ((clock.getTime()+(3*24*3600000)+(3*3600000))%(1000*60*60*24*7)===shed.timestampweek){//отсчет начинается с четверга 1970 года поэтому сдвиг на понедельник
            let train,gener, generdir;
            train=shed.train.obj3d;
            let curvepath=shed.road;
            let arccurvelength=curvepath.getLength();
            let duration=shed.duration;
            let addpartofmoving=1/(duration/1000*cadresinsecond);

            let needreverse=false;
            if (shed.fromcity.position.distanceTo(new THREE.Vector2(curvepath.getPointAt(0)))>shed.fromcity.position.distanceTo(new THREE.Vector2(curvepath.getPointAt(1))))
                needreverse=true;

            gener=generatePoints(addpartofmoving,curvepath,needreverse);
            generdir=generatedirectionPoints(addpartofmoving,curvepath,arccurvelength,train,needreverse);
            requestAnimationFrame(()=>rendrpos(train,gener, generdir));
            }
        }
    resolve(0);
    });
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////TEMPORARY
(async ()=>{let city1,city2;
    city1=await traindifinition('./images/rotatedcity.obj');
    city2=await traindifinition('./images/rotatedcity.obj');
    traingonormalization(city1,[volcanoobj3d]);
    traingonormalization(city2,[volcanoobj3d]);

    city1.position.set(120000,city1.position.y,120000);
    city2.position.set(-120000,city1.position.y,-120000);

//city2.position.set(-80000,80000,-80000);
    scene.add(city1, city2);})();

/////////////////////////////
export {train3dobj,volcanoobj3d,canvas,scene,camera,renderer,controls,light,MTLlod,loader,cubetextture,cubemaploader};
window.shedule=shedule;
window.SheduleMember=SheduleMember;
window.clock=clock;