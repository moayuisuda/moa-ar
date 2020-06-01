const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x404040, 0.1));

const geometry = new THREE.SphereGeometry(30, 64, 64);
const cube = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading} ) );
camera.position.z = 100;
scene.add(cube);

const geometry2 = new THREE.BoxGeometry(10, 10, 10);
const cube2 = new THREE.Mesh(geometry2, new THREE.MeshPhongMaterial( { color: 0x333333, emissive: 0x000000, shininess: 100, specular: 0x0000FF, shading: THREE.FlatShading } ) );
cube2.position.z = 30;
scene.add(cube2);

//const lc = [0xFF0000,0x00FF00,0x0000FF,0xFFFF00,0x00FFFF,0xFF00FF];
const lc = [0x111199, 0x0000FF, 0x0000FF, 0x991111, 0xFF0000, 0xFF0000];

var program = function ( context ) {
  context.beginPath();
  context.arc( 0, 0, 1, 0, PI2, true );
  context.closePath();
  context.fill();
}

const pointLight = new THREE.PointLight(0x000000, 0.3, 50);
  pointLight.position.z = 40;
  scene.add(pointLight);

const pointLight2 = new THREE.PointLight(0xFFFFFF, 3, 50);
  pointLight2.position.z = 80;
  scene.add(pointLight2);

for(let i=0; i < 6; i++) {
  const light = new THREE.PointLight(lc[i], 2, 50);
  light.position.x = Math.cos(Math.PI/3 * i) * 40;
  light.position.y = Math.sin(Math.PI/3 * i) * 40;
  scene.add(light)
}

let round = 0;
let angle = 0;
let moveX = 0;
let moveY = 0;

function render() {
  requestAnimationFrame(render);
  angle += Math.PI/96;
  cube.rotation.y -= 0.01;
  cube.geometry.translate(0, 0.25*Math.cos(angle), 0);
  cube2.geometry.translate(0, 0.25*Math.cos(angle), 0);
  cube2.position.x += (moveX-cube2.position.x)*0.1;
  cube2.position.y += (moveY-cube2.position.y)*0.1;
  cube2.rotation.x = Math.sin((moveY/(Math.PI)));
  cube2.rotation.x += 0.1;
  cube2.rotation.y = Math.cos((moveX/(Math.PI)));
  renderer.render(scene, camera);
  round++;
}

renderer.domElement.onmousemove = (e) => {
  moveX = (e.pageX - window.innerWidth/2)*(7/(window.innerWidth/2))
  moveY = (e.pageY - window.innerHeight/2)*(-7/(window.innerHeight/2))
}

render();

window.onresize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}