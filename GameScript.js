import * as THREE from './js/three.js-master/build/three.module.js';
import {OrbitControls} from './js/three.js-master/examples/jsm/controls/OrbitControls.js';
import {resizerenderertotal} from "./js/usefuljs.js";
import {OBJLoader2} from './js/three.js-master/examples/jsm/loaders/OBJLoader2.js';
import {Vector3} from "./js/three.js-master/src/math/Vector3.js";
import {Plane} from "./js/three.js-master/src/math/Plane.js";
import {MTLLoader} from "./js/three.js-master/examples/jsm/loaders/MTLLoader.js";
import {MtlObjBridge} from "./js/three.js-master/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js";

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
controls.target.set(0, 8000, 0);

const light = new THREE.DirectionalLight(0xFFFFFF, 1);
light.position.set(0, 10000, 0);
light.target.position.set(-5, 0, 0);
scene.add(light);
scene.add(light.target);

const MTLlod=new MTLLoader();
const loader=new THREE.TextureLoader();
const cubemaploader = new THREE.CubeTextureLoader();
const objLoader = new OBJLoader2();

const cubetextture = cubemaploader.load([
    './images/ely_hills/eezabad_ft.jpg',
    './images/ely_hills/eezabad_bk.jpg',
    './images/ely_hills/eezabad_up.jpg',
    './images/ely_hills/eezabad_dn.jpg',
    './images/ely_hills/eezabad_rt.jpg',
    './images/ely_hills/eezabad_lf.jpg']);
scene.background = cubetextture;
//задний план

let train3dobj, volcanoobj3d;


export {train3dobj,volcanoobj3d,canvas,scene,camera,renderer,controls,light,MTLlod,loader,objLoader,cubetextture,cubemaploader};

{
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
            traindifinition('./images/Sci_fi_Train.obj');
        });
    })
}//вулкан
export function traindifinition(objectpath)
{
    let material=new THREE.MeshBasicMaterial({ map:  loader.load('./images/montagne.jpg')});
    objLoader.addMaterials(material);
    material.side = THREE.DoubleSide;
    objLoader.load(objectpath, (root) => {
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
        cornersystem.position.set(p.x,p.y,p.z);
        train3dobj.cornersystem=cornersystem;
        scene.add(cornersystem);

        cornersystem.attach(corner1);
        cornersystem.attach(corner2); //когда add масштабируется и прикпрепляется а attach прикрепляется просто(аттач координаты из внешнего мира и просто крепит), адд переводит во внутренний мир
        cornersystem.attach(corner3);

        train3dobj.trainplain=new Plane();
        train3dobj.trainplain.setFromCoplanarPoints(cornersystem.getChildByName('corner1').getWorldPosition(),cornersystem.getChildByName('corner2').getWorldPosition(),cornersystem.getChildByName('corner3').getWorldPosition());//или position

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
            let helper2 = new THREE.AxisHelper(50000000);
            let helper3 = new THREE.AxisHelper(50000000);
            let helper4 = new THREE.AxisHelper(50000000);
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


    });
}//паровоз